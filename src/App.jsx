import { useState, useEffect, useRef } from "react";

/* ============================================================
   🔥 Firebase 학급 공유 랭킹 설정 (선생님용)
   ------------------------------------------------------------
   1. https://console.firebase.google.com 에서 프로젝트 생성
   2. 빌드 → Realtime Database → 데이터베이스 만들기 (테스트 모드)
   3. 아래 FIREBASE_URL 에 데이터베이스 URL을 붙여넣기
      예: "https://my-class-default-rtdb.asia-southeast1.firebasedatabase.app"
   4. 규칙 탭에서 rankings 만 열어두기 (권장):
      {
        "rules": {
          "rankings": { ".read": true, ".write": true },
          "$other": { ".read": false, ".write": false }
        }
      }
   - 비워두면("") 자동으로 이 컴퓨터(브라우저)에만 저장됩니다.
   ============================================================ */
const FIREBASE_URL = "https://climb-typing-default-rtdb.asia-southeast1.firebasedatabase.app/";

// ---------- 문장 풀 (속담 · 교과 · 재미) ----------
const SENTENCES = [
  { t: "티끌 모아 태산", c: "속담" },
  { t: "등잔 밑이 어둡다", c: "속담" },
  { t: "우물 안 개구리", c: "속담" },
  { t: "달은 지구 주위를 돈다", c: "지식" },
  { t: "곤충의 다리는 여섯 개", c: "지식" },
  { t: "사각형은 변이 네 개", c: "지식" },
  { t: "지우개가 또 사라졌다", c: "재미" },
  { t: "고양이는 박스를 좋아해", c: "재미" },
  { t: "줄넘기 백 개에 도전!", c: "재미" },
  { t: "백지장도 맞들면 낫다", c: "속담" },
  { t: "소 잃고 외양간 고친다", c: "속담" },
  { t: "호랑이도 제 말 하면 온다", c: "속담" },
  { t: "원숭이도 나무에서 떨어진다", c: "속담" },
  { t: "천 리 길도 한 걸음부터", c: "속담" },
  { t: "물은 백 도에서 펄펄 끓는다", c: "지식" },
  { t: "우리나라의 수도는 서울이다", c: "지식" },
  { t: "물고기는 아가미로 숨을 쉰다", c: "지식" },
  { t: "한글은 세종대왕이 만들었다", c: "지식" },
  { t: "방학은 왜 이렇게 짧을까?", c: "재미" },
  { t: "알림장 쓰는 걸 깜빡했다", c: "재미" },
  { t: "오늘 급식이 치킨이면 좋겠다", c: "재미" },
  { t: "가는 말이 고와야 오는 말이 곱다", c: "속담" },
  { t: "세 살 버릇 여든까지 간다더니", c: "속담" },
  { t: "낮말은 새가 듣고 밤말은 쥐가 듣는다", c: "속담" },
  { t: "콩 심은 데 콩 나고 팥 심은 데 팥 난다", c: "속담" },
  { t: "지구는 태양 주위를 일 년에 한 바퀴 돈다", c: "지식" },
  { t: "식물은 햇빛을 받아 스스로 양분을 만든다", c: "지식" },
  { t: "삼각형의 세 각을 더하면 180도가 된다", c: "지식" },
  { t: "숙제는 내일의 나에게 맡기기로 했다", c: "재미" },
  { t: "떡볶이는 역시 매콤해야 제맛이지!", c: "재미" },
  { t: "단짝 친구와 함께라면 청소도 즐겁다", c: "재미" },
];

const BOT_POOL = [
  { name: "슬라임", emoji: "🟢" }, { name: "토끼", emoji: "🐰" }, { name: "다람쥐", emoji: "🐿️" },
  { name: "고양이", emoji: "🐱" }, { name: "강아지", emoji: "🐶" }, { name: "여우", emoji: "🦊" },
  { name: "펭귄", emoji: "🐧" }, { name: "곰", emoji: "🐻" }, { name: "햄스터", emoji: "🐹" },
  { name: "부엉이", emoji: "🦉" }, { name: "개구리", emoji: "🐸" }, { name: "병아리", emoji: "🐤" },
];

const SKILLS = {
  "쉬움":   { p: [0.45, 0.6],  t: [0.45, 0.95] },
  "보통":   { p: [0.58, 0.75], t: [0.4, 0.9] },
  "어려움": { p: [0.7, 0.88],  t: [0.3, 0.8] },
};

const strokes = (s) => s.normalize("NFD").length;
const rand = (a, b) => a + Math.random() * (b - a);

// ---------- 이름 비속어 필터 ----------
const BAD_WORDS = [
  "시발", "씨발", "씨빨", "시벌", "씨벌", "스발", "쒸발", "병신", "븅신", "빙신",
  "지랄", "졸라", "존나", "좆", "좃", "새끼", "색기", "섹끼", "개새", "개색",
  "미친놈", "미친년", "또라이", "닥쳐", "꺼져", "죽어", "뒤져", "엿먹",
  "섹스", "쎅스", "성교", "야동", "야사", "자지", "보지", "음경", "음부",
  "딸딸이", "강간", "변태", "발기", "사정", "포르노", "유두", "꼭지",
  "fuck", "fck", "shit", "bitch", "asshole", "dick", "cock", "pussy",
  "sex", "porn", "penis", "vagina", "boobs", "nude", "rape",
];
const BAD_JAMO = ["ㅅㅂ", "ㅆㅂ", "ㅄ", "ㅂㅅ", "ㅈㄹ", "ㅈㄴ", "ㄲㅈ", "ㅅㄲ", "ㄷㅊ", "ㅁㅊ"];
const CHO = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];

function choseongOf(str) {
  let out = "";
  for (const ch of str) {
    const code = ch.charCodeAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) out += CHO[Math.floor((code - 0xac00) / 588)];
    else if (/[ㄱ-ㅎ]/.test(ch)) out += ch;
  }
  return out;
}

function isNameAllowed(raw) {
  // 숫자·기호·공백을 제거해 우회(시1발, ㅅ_ㅂ 등)도 잡는다
  const norm = raw.toLowerCase().replace(/[^가-힣ㄱ-ㅎㅏ-ㅣa-z]/g, "");
  if (BAD_WORDS.some((w) => norm.includes(w))) return false;
  const cho = choseongOf(norm);
  if (BAD_JAMO.some((j) => cho.includes(j))) return false;
  return true;
}

// ---------- 랭킹 저장소 ----------
// 우선순위: Firebase(학급 공유) → window.storage(Claude 미리보기) → localStorage(개인)
const RANK_KEY = "climb_typing_rankings";

async function loadRankings() {
  if (FIREBASE_URL) {
    try {
      const res = await fetch(`${FIREBASE_URL}/rankings.json`);
      const data = await res.json();
      if (data) return Object.values(data);
      return [];
    } catch { /* 네트워크 실패 시 로컬로 */ }
  }
  try {
    if (window.storage) {
      const r = await window.storage.get(RANK_KEY);
      return r ? JSON.parse(r.value) : [];
    }
  } catch { /* 키 없음 */ }
  try {
    const r = window.localStorage && window.localStorage.getItem(RANK_KEY);
    return r ? JSON.parse(r) : [];
  } catch { return []; }
}

async function addRankingEntry(entry) {
  if (FIREBASE_URL) {
    try {
      await fetch(`${FIREBASE_URL}/rankings.json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });
      return await loadRankings();
    } catch { /* 실패 시 로컬로 */ }
  }
  const list = await loadRankings();
  const next = [...list, entry];
  const data = JSON.stringify(next);
  try { if (window.storage) { await window.storage.set(RANK_KEY, data); return next; } } catch { /* 무시 */ }
  try { window.localStorage && window.localStorage.setItem(RANK_KEY, data); } catch { /* 무시 */ }
  return next;
}

async function clearAllRankings() {
  // 공유 Firebase 기록은 공개 클라이언트에서 일괄 삭제하지 않는다.
  try { if (window.storage) { await window.storage.set(RANK_KEY, "[]"); return; } } catch { /* 무시 */ }
  try { window.localStorage && window.localStorage.setItem(RANK_KEY, "[]"); } catch { /* 무시 */ }
}

const sortRank = (list) => [...list].sort((a, b) => b.cpm - a.cpm).slice(0, 20);

function pickSentence(round, used) {
  const sorted = [...SENTENCES].sort((a, b) => a.t.length - b.t.length);
  const band = Math.min(Math.floor((round - 1) / 3), 2);
  const size = Math.ceil(sorted.length / 3);
  let pool = sorted.slice(band * size, (band + 1) * size).filter((s) => !used.has(s.t));
  if (pool.length === 0) pool = sorted.filter((s) => !used.has(s.t));
  if (pool.length === 0) { used.clear(); pool = sorted; }
  return pool[Math.floor(Math.random() * pool.length)];
}

function beep(type) {
  try {
    const ctx = beep.ctx || (beep.ctx = new (window.AudioContext || window.webkitAudioContext)());
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination); g.gain.value = 0.05;
    if (type === "up") { o.frequency.setValueAtTime(523, ctx.currentTime); o.frequency.setValueAtTime(784, ctx.currentTime + 0.09); }
    else if (type === "down") { o.frequency.setValueAtTime(330, ctx.currentTime); o.frequency.setValueAtTime(196, ctx.currentTime + 0.12); }
    else { o.frequency.setValueAtTime(1047, ctx.currentTime); o.frequency.setValueAtTime(1319, ctx.currentTime + 0.1); o.frequency.setValueAtTime(1568, ctx.currentTime + 0.2); }
    o.start(); o.stop(ctx.currentTime + 0.22);
  } catch { /* 소리 미지원 */ }
}

const C = {
  sky1: "#141a38", sky2: "#2a2153",
  platform: "#3d3470", star: "#ffd84d", mint: "#5ef0b0", coral: "#ff7a7a",
  text: "#f3efff", dim: "#9b93c4", card: "rgba(255,255,255,0.06)",
};

const MEDALS = ["🥇", "🥈", "🥉"];

function OptBtn({ on, children, onClick }) {
  return (
    <button onClick={onClick} style={{
      fontFamily: "inherit", fontSize: 15, padding: "7px 14px", borderRadius: 999, cursor: "pointer",
      border: `2px solid ${on ? C.star : C.platform}`,
      background: on ? C.star : "transparent", color: on ? "#3a2d00" : C.dim,
    }}>{children}</button>
  );
}

function RankList({ highlight, rankLoading, rankings }) {
  return (
    <div style={{ maxHeight: 240, overflowY: "auto", textAlign: "left" }}>
      {rankLoading && <p style={{ textAlign: "center", color: C.dim, fontSize: 14 }}>랭킹을 불러오는 중…</p>}
      {!rankLoading && rankings.length === 0 && (
        <p style={{ textAlign: "center", color: C.dim, fontSize: 14 }}>아직 기록이 없어요. 첫 번째 등반가가 되어 보세요!</p>
      )}
      {!rankLoading && rankings.map((r, i) => (
        <div key={`${r.ts ?? i}-${r.name}`} style={{
          display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 10, fontSize: 14,
          background: highlight === i ? "rgba(255,216,77,0.18)" : i % 2 ? "rgba(0,0,0,0.18)" : "transparent",
          border: highlight === i ? `1px solid ${C.star}` : "1px solid transparent",
        }}>
          <span style={{ width: 28, textAlign: "center" }}>{MEDALS[i] || i + 1}</span>
          <span style={{ flex: 1, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {r.win ? "🏆 " : ""}{r.name}
          </span>
          <span style={{ color: C.mint, width: 70, textAlign: "right" }}>{r.cpm}타/분</span>
          <span style={{ color: C.dim, fontSize: 11, width: 96, textAlign: "right" }}>{r.setting}</span>
        </div>
      ))}
    </div>
  );
}

export default function ClimbTypingGame() {
  const [phase, setPhase] = useState("title");
  const [goal, setGoal] = useState(8);
  const [racerCount, setRacerCount] = useState(6);
  const [skill, setSkill] = useState("보통");
  const [round, setRound] = useState(0);
  const [floor, setFloor] = useState(0);
  const [bots, setBots] = useState([]);
  const [sentence, setSentence] = useState(null);
  const [input, setInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [timeMax, setTimeMax] = useState(0);
  const [msg, setMsg] = useState("");
  const [msgTone, setMsgTone] = useState("info");
  const [shake, setShake] = useState(false);
  const [pops, setPops] = useState({});
  const [winner, setWinner] = useState(null);
  const [stats, setStats] = useState({ strokes: 0, ms: 0, ok: 0, tries: 0 });
  const [playerDone, setPlayerDone] = useState(false);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [confirmClearRankings, setConfirmClearRankings] = useState(false);
  const [rankings, setRankings] = useState([]);
  const [rankLoading, setRankLoading] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [nameError, setNameError] = useState("");
  const [registered, setRegistered] = useState(false);
  const [myRank, setMyRank] = useState(null);
  const [isComposing, setIsComposing] = useState(false);

  const usedRef = useRef(new Set());
  const R = useRef({});
  const composingRef = useRef(false);
  const inputRef = useRef(null);
  const floorRef = useRef(0);
  const botsRef = useRef([]);
  const finishedRef = useRef(false);

  const refreshRankings = async () => {
    setRankLoading(true);
    const list = await loadRankings();
    setRankings(sortRank(list));
    setRankLoading(false);
  };
  const startGame = () => {
    usedRef.current = new Set();
    finishedRef.current = false;
    const myBots = BOT_POOL.slice(0, racerCount - 1).map((b) => {
      const s = SKILLS[skill];
      return { ...b, floor: 0, p: rand(s.p[0], s.p[1]), tf: s.t };
    });
    floorRef.current = 0; botsRef.current = myBots;
    setFloor(0); setBots(myBots);
    setStats({ strokes: 0, ms: 0, ok: 0, tries: 0 });
    setWinner(null);
    setRegistered(false); setMyRank(null); setNameError("");
    setConfirmQuit(false);
    setPhase("play");
    nextRound(1);
  };

  const quitGame = () => {
    finishedRef.current = true;
    R.current = {};
    setConfirmQuit(false);
    setPhase("title");
  };

  const nextRound = (r) => {
    if (finishedRef.current) return;
    const s = pickSentence(r, usedRef.current);
    usedRef.current.add(s.t);
    const limit = Math.round(5 + s.t.length * 0.55);
    const now = Date.now();
    R.current = {
      start: now,
      deadline: now + limit * 1000,
      limit,
      playerResolved: false,
      closing: false,
      plans: botsRef.current.map((b, i) => ({
        i,
        finishAt: now + rand(b.tf[0], b.tf[1]) * limit * 1000,
        success: Math.random() < b.p,
        resolved: false,
      })),
    };
    setRound(r); setSentence(s); setInput("");
    setTimeMax(limit); setTimeLeft(limit);
    setPlayerDone(false);
    setMsg(r === 1 ? "문장을 똑같이 치고 Enter!" : "");
    setMsgTone("info");
    setTimeout(() => inputRef.current && inputRef.current.focus(), 60);
  };

  const flashPop = (name, dir) => {
    setPops((p) => ({ ...p, [name]: dir }));
    setTimeout(() => setPops((p) => { const n = { ...p }; delete n[name]; return n; }), 700);
  };

  const moveBot = (i, success) => {
    const b = botsRef.current[i];
    const nf = Math.max(0, Math.min(goal, b.floor + (success ? 1 : -1)));
    botsRef.current = botsRef.current.map((x, j) => (j === i ? { ...x, floor: nf } : x));
    setBots(botsRef.current);
    flashPop(b.name, success ? "up" : "down");
    if (nf >= goal && !finishedRef.current) finish(`${b.name} ${b.emoji}`);
  };

  const movePlayer = (success) => {
    const nf = Math.max(0, Math.min(goal, floorRef.current + (success ? 1 : -1)));
    floorRef.current = nf;
    setFloor(nf);
    flashPop("나", success ? "up" : "down");
    beep(success ? "up" : "down");
    if (!success) { setShake(true); setTimeout(() => setShake(false), 450); }
    if (nf >= goal && !finishedRef.current) finish("나");
  };

  const finish = (who) => {
    finishedRef.current = true;
    setWinner(who);
    if (who === "나") beep("win");
    setTimeout(() => setPhase("result"), 1200);
  };

  // 메인 게임 틱
  useEffect(() => {
    if (phase !== "play") return;
    const id = setInterval(() => {
      const r = R.current;
      if (!r.deadline || finishedRef.current) return;
      const now = Date.now();
      setTimeLeft(Math.max(0, (r.deadline - now) / 1000));

      for (const plan of r.plans) {
        if (!plan.resolved && now >= plan.finishAt) {
          plan.resolved = true;
          moveBot(plan.i, plan.success);
          if (finishedRef.current) return;
        }
      }

      if (now >= r.deadline) {
        if (!r.playerResolved) {
          r.playerResolved = true;
          setStats((st) => ({ ...st, tries: st.tries + 1 }));
          setMsg("⏰ 시간 초과! 한 칸 아래로…"); setMsgTone("bad");
          setPlayerDone(true);
          movePlayer(false);
          if (finishedRef.current) return;
        }
        for (const plan of r.plans) {
          if (!plan.resolved) { plan.resolved = true; moveBot(plan.i, false); if (finishedRef.current) return; }
        }
      }

      if (!r.closing && r.playerResolved && r.plans.every((p) => p.resolved)) {
        r.closing = true;
        setMsg((m) => m || "모두 이동 완료!");
        setTimeout(() => nextRound(round + 1), 1100);
      }
    }, 100);
    return () => clearInterval(id);
    // 게임 틱은 goal/round 변경 시 재생성되며 이동 함수는 해당 렌더의 최신 상태를 사용한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, round, goal]);

  const submit = () => {
    const r = R.current;
    if (!sentence || r.playerResolved || finishedRef.current) return;
    r.playerResolved = true;
    setPlayerDone(true);
    const ok = input === sentence.t;
    const elapsed = Date.now() - r.start;
    setStats((st) => ({
      strokes: st.strokes + (ok ? strokes(sentence.t) : 0),
      ms: st.ms + (ok ? elapsed : 0),
      ok: st.ok + (ok ? 1 : 0),
      tries: st.tries + 1,
    }));
    if (ok) { setMsg("🎉 정확해요! 친구들을 기다리는 중…"); setMsgTone("good"); }
    else { setMsg("💥 앗, 오타! 한 칸 아래로…"); setMsgTone("bad"); }
    movePlayer(ok);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing && !composingRef.current) {
      e.preventDefault(); submit();
    }
  };

  const registerScore = async (timestamp) => {
    if (registered) return;
    const name = playerName.trim();
    if (!name) { setNameError("이름을 입력해 주세요!"); return; }
    if (!isNameAllowed(name)) {
      setNameError("사용할 수 없는 이름이에요. 바르고 고운 이름으로 정해 주세요!");
      return;
    }
    setNameError("");
    const entry = {
      name, cpm, acc, rounds: stats.tries,
      win: winner === "나",
      setting: `${goal}층·${racerCount}명·${skill}`,
      date: new Date().toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" }),
      ts: timestamp,
    };
    setRankLoading(true);
    const list = await addRankingEntry(entry);
    const sorted = sortRank(list);
    setRankings(sorted);
    setMyRank(sorted.findIndex((r) => r.ts === entry.ts && r.name === entry.name));
    setRegistered(true);
    setRankLoading(false);
  };

  const clearRankings = async () => {
    setRankings([]);
    await clearAllRankings();
    setConfirmClearRankings(false);
  };

  const charStates = () => {
    if (!sentence) return [];
    return sentence.t.split("").map((ch, i) => {
      if (i >= input.length) return { ch, st: "todo" };
      if (isComposing && i === input.length - 1) return { ch, st: "typing" };
      return { ch, st: input[i] === ch ? "ok" : "bad" };
    });
  };

  const cpm = stats.ms > 0 ? Math.round(stats.strokes / (stats.ms / 60000)) : 0;
  const acc = stats.tries > 0 ? Math.round((stats.ok / stats.tries) * 100) : 0;
  const racers = [{ name: "나", emoji: "🧒", floor, me: true }, ...bots];
  const n = racers.length;
  const big = n <= 6;
  const towerH = goal >= 12 ? 300 : goal >= 8 ? 250 : 210;

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(180deg, ${C.sky1}, ${C.sky2})`, color: C.text, fontFamily: "'Jua', sans-serif", display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 12px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Jua&display=swap');
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-7px)} 40%{transform:translateX(7px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(5px)} }
        @keyframes twinkle { 0%,100%{opacity:.25} 50%{opacity:.9} }
        @keyframes pop { 0%{transform:scale(.6);opacity:0} 70%{transform:scale(1.08)} 100%{transform:scale(1);opacity:1} }
        @keyframes rise { 0%{opacity:1; transform:translateY(0)} 100%{opacity:0; transform:translateY(-16px)} }
        .racer { transition: bottom .55s cubic-bezier(.34,1.56,.64,1); }
        @media (prefers-reduced-motion: reduce) { .racer { transition: none } }
        input:focus { outline: 2px solid ${C.star}; }
      `}</style>

      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        {[...Array(24)].map((_, i) => (
          <div key={i} style={{ position: "absolute", left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%`, width: 3, height: 3, borderRadius: 3, background: C.star, animation: `twinkle ${2 + (i % 4)}s infinite`, animationDelay: `${i * 0.3}s` }} />
        ))}
      </div>

      <div style={{ width: "100%", maxWidth: 520, position: "relative" }}>
        {/* 상단 바: 제목 + 그만하기 (게임 화면과 분리) */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
          <div style={{ width: 92 }} />
          <h1 style={{ textAlign: "center", fontSize: 28, margin: 0, letterSpacing: 1 }}>
            ⬆️ <span style={{ color: C.star }}>올라타자!</span>
          </h1>
          <div style={{ width: 92, textAlign: "right" }}>
            {phase === "play" && !confirmQuit && (
              <button onClick={() => setConfirmQuit(true)} style={{ fontFamily: "inherit", fontSize: 13, padding: "6px 12px", borderRadius: 999, border: `1px solid ${C.platform}`, cursor: "pointer", background: "rgba(0,0,0,0.35)", color: C.dim }}>
                🏠 그만하기
              </button>
            )}
          </div>
        </div>
        <p style={{ textAlign: "center", color: C.dim, fontSize: 14, margin: "0 0 10px" }}>
          타자 서바이벌 · 문장을 똑같이 치면 올라가요
        </p>

        {/* 그만하기 확인 바 (독립 영역) */}
        {phase === "play" && confirmQuit && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "center", background: "rgba(255,122,122,0.12)", border: `1px solid ${C.coral}`, borderRadius: 12, padding: "8px 12px", marginBottom: 10 }}>
            <span style={{ fontSize: 14, color: C.coral }}>게임을 그만두고 홈으로 갈까요?</span>
            <button onClick={quitGame} style={{ fontFamily: "inherit", fontSize: 14, padding: "5px 16px", borderRadius: 999, border: "none", cursor: "pointer", background: C.coral, color: "#3a0000" }}>네</button>
            <button onClick={() => setConfirmQuit(false)} style={{ fontFamily: "inherit", fontSize: 14, padding: "5px 16px", borderRadius: 999, border: `1px solid ${C.platform}`, cursor: "pointer", background: "transparent", color: C.dim }}>계속하기</button>
          </div>
        )}

        {phase === "title" && !showRanking && (
          <div style={{ background: C.card, borderRadius: 20, padding: 22, animation: "pop .4s" }}>
            <div style={{ textAlign: "center", fontSize: 44, marginBottom: 10 }}>🧒🐿️🐰🟢🐱🦊</div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 14, color: C.dim, marginBottom: 6 }}>🏁 꼭대기 층수</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[5, 8, 12].map((g) => <OptBtn key={g} on={goal === g} onClick={() => setGoal(g)}>{g}층</OptBtn>)}
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 14, color: C.dim, marginBottom: 6 }}>👥 참가 인원 (나 포함)</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[4, 6, 8, 12].map((c) => <OptBtn key={c} on={racerCount === c} onClick={() => setRacerCount(c)}>{c}명</OptBtn>)}
              </div>
            </div>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 14, color: C.dim, marginBottom: 6 }}>🤖 친구들 실력</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {Object.keys(SKILLS).map((s) => <OptBtn key={s} on={skill === s} onClick={() => setSkill(s)}>{s}</OptBtn>)}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={startGame} style={{ fontFamily: "inherit", fontSize: 20, padding: "12px 36px", borderRadius: 999, border: "none", cursor: "pointer", background: C.star, color: "#3a2d00", boxShadow: "0 4px 0 #b89a1f" }}>
                게임 시작!
              </button>
              <button onClick={() => { setShowRanking(true); refreshRankings(); }} style={{ fontFamily: "inherit", fontSize: 17, padding: "12px 22px", borderRadius: 999, border: `2px solid ${C.platform}`, cursor: "pointer", background: "transparent", color: C.dim }}>
                🏅 랭킹
              </button>
            </div>
            {FIREBASE_URL && (
              <p style={{ textAlign: "center", color: C.dim, fontSize: 12, margin: "12px 0 0" }}>🌐 우리 반 친구들과 랭킹을 함께 써요</p>
            )}
          </div>
        )}

        {phase === "title" && showRanking && (
          <div style={{ background: C.card, borderRadius: 20, padding: 22, animation: "pop .4s" }}>
            <h2 style={{ textAlign: "center", fontSize: 22, margin: "0 0 14px", color: C.star }}>
              🏅 명예의 전당 {FIREBASE_URL ? "(우리 반)" : ""}
            </h2>
            <RankList rankLoading={rankLoading} rankings={rankings} />
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 16 }}>
              <button onClick={() => setShowRanking(false)} style={{ fontFamily: "inherit", fontSize: 16, padding: "9px 26px", borderRadius: 999, border: "none", cursor: "pointer", background: C.star, color: "#3a2d00" }}>
                돌아가기
              </button>
              {!FIREBASE_URL && rankings.length > 0 && !confirmClearRankings && (
                <button onClick={() => setConfirmClearRankings(true)} style={{ fontFamily: "inherit", fontSize: 14, padding: "9px 18px", borderRadius: 999, border: `2px solid ${C.platform}`, cursor: "pointer", background: "transparent", color: C.dim }}>
                  이 기기의 기록 지우기
                </button>
              )}
            </div>
            {!FIREBASE_URL && confirmClearRankings && (
              <div style={{ marginTop: 12, textAlign: "center", color: C.coral, fontSize: 13 }}>
                <p>이 기기에 저장된 랭킹을 모두 지울까요?</p>
                <button onClick={clearRankings} style={{ marginRight: 8 }}>삭제 확인</button>
                <button onClick={() => setConfirmClearRankings(false)}>취소</button>
              </div>
            )}
          </div>
        )}

        {phase !== "title" && (
          <>
            {/* 타워 (버튼 없는 깨끗한 영역) */}
            <div style={{ position: "relative", height: towerH, background: "rgba(0,0,0,0.25)", borderRadius: 16, overflow: "hidden", marginBottom: 12 }}>
              {[...Array(goal + 1)].map((_, f) => (
                <div key={f} style={{ position: "absolute", left: 0, right: 0, bottom: `${(f / goal) * 86 + 4}%`, height: 2, background: f === goal ? C.star : C.platform, opacity: f === goal ? 0.9 : 0.45 }}>
                  <span style={{ position: "absolute", right: 6, bottom: 2, fontSize: 10, color: f === goal ? C.star : C.dim }}>{f === goal ? "🏁" : `${f}`}</span>
                </div>
              ))}
              {racers.map((r, i) => (
                <div key={r.name} className="racer" style={{
                  position: "absolute",
                  left: `${5 + (i * 86) / Math.max(1, n - 1)}%`,
                  bottom: `${(r.floor / goal) * 86 + 5}%`,
                  textAlign: "center", transform: "translateX(-50%)",
                  animation: r.me && shake ? "shake .45s" : "none",
                  zIndex: r.me ? 2 : 1,
                }}>
                  {pops[r.name] && (
                    <div style={{ position: "absolute", top: -16, left: "50%", transform: "translateX(-50%)", fontSize: 13, color: pops[r.name] === "up" ? C.mint : C.coral, animation: "rise .7s forwards" }}>
                      {pops[r.name] === "up" ? "+1" : "-1"}
                    </div>
                  )}
                  <div style={{ fontSize: r.me ? (big ? 30 : 26) : big ? 24 : 18, filter: r.me ? `drop-shadow(0 0 6px ${C.star})` : "none" }}>{r.emoji}</div>
                  {(big || r.me) && <div style={{ fontSize: 10, color: r.me ? C.star : C.dim, whiteSpace: "nowrap" }}>{r.name}</div>}
                </div>
              ))}
            </div>

            {phase === "play" && sentence && (
              <div style={{ background: C.card, borderRadius: 20, padding: 18, animation: "pop .35s" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.dim, marginBottom: 8 }}>
                  <span>라운드 {round} · <span style={{ color: C.star }}>[{sentence.c}]</span></span>
                  <span style={{ color: timeLeft < 3 ? C.coral : C.dim }}>⏱ {timeLeft.toFixed(1)}초</span>
                </div>
                <div style={{ height: 8, borderRadius: 8, background: "rgba(0,0,0,0.35)", marginBottom: 14 }}>
                  <div style={{ height: "100%", width: `${(timeLeft / timeMax) * 100}%`, borderRadius: 8, background: timeLeft < 3 ? C.coral : C.mint, transition: "width .1s linear" }} />
                </div>
                <div style={{ fontSize: 22, lineHeight: 1.6, textAlign: "center", letterSpacing: 1, marginBottom: 14, wordBreak: "keep-all", opacity: playerDone ? 0.45 : 1 }}>
                  {charStates().map((c, i) => (
                    <span key={i} style={{
                      color: c.st === "ok" ? C.mint : c.st === "bad" ? C.coral : c.st === "typing" ? C.star : C.dim,
                      textDecoration: c.st === "bad" ? "underline wavy" : "none",
                      borderBottom: i === input.length && c.st === "todo" && !playerDone ? `3px solid ${C.star}` : "none",
                    }}>{c.ch}</span>
                  ))}
                </div>
                <input
                  ref={inputRef}
                  value={input}
                  disabled={playerDone}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  onCompositionStart={() => { composingRef.current = true; setIsComposing(true); }}
                  onCompositionEnd={() => { composingRef.current = false; setIsComposing(false); }}
                  placeholder={playerDone ? "친구들이 이동 중…" : "여기에 입력하고 Enter"}
                  autoComplete="off" autoCorrect="off" spellCheck={false}
                  style={{ width: "100%", boxSizing: "border-box", fontFamily: "inherit", fontSize: 19, padding: "12px 14px", borderRadius: 12, border: "none", background: "rgba(0,0,0,0.35)", color: C.text, textAlign: "center", opacity: playerDone ? 0.6 : 1 }}
                />
                <div style={{ minHeight: 26, marginTop: 10, textAlign: "center", fontSize: 16, color: msgTone === "good" ? C.mint : msgTone === "bad" ? C.coral : C.dim }}>
                  {msg}
                </div>
              </div>
            )}

            {phase === "result" && (
              <div style={{ background: C.card, borderRadius: 20, padding: 22, textAlign: "center", animation: "pop .4s" }}>
                <div style={{ fontSize: 46 }}>{winner === "나" ? "🏆" : "😅"}</div>
                <h2 style={{ margin: "4px 0 12px", fontSize: 23, color: winner === "나" ? C.star : C.coral }}>
                  {winner === "나" ? "우승! 꼭대기 도착!" : `${winner} 이(가) 먼저 도착했어요`}
                </h2>
                <div style={{ display: "flex", justifyContent: "center", gap: 18, fontSize: 15, marginBottom: 16 }}>
                  <div><div style={{ fontSize: 24, color: C.mint }}>{cpm}</div><div style={{ color: C.dim }}>평균 타수(타/분)</div></div>
                  <div><div style={{ fontSize: 24, color: C.star }}>{acc}%</div><div style={{ color: C.dim }}>성공률</div></div>
                  <div><div style={{ fontSize: 24, color: C.text }}>{stats.tries}</div><div style={{ color: C.dim }}>라운드</div></div>
                </div>

                {!registered ? (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                      <input
                        value={playerName}
                        onChange={(e) => { setPlayerName(e.target.value.slice(0, 10)); setNameError(""); }}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) registerScore(Date.now()); }}
                        placeholder="이름 입력 (10자)"
                        style={{ fontFamily: "inherit", fontSize: 15, padding: "9px 14px", borderRadius: 10, border: `1px solid ${nameError ? C.coral : C.platform}`, background: "rgba(0,0,0,0.35)", color: C.text, width: 150, textAlign: "center" }}
                      />
                      <button onClick={() => registerScore(Date.now())} disabled={rankLoading} style={{ fontFamily: "inherit", fontSize: 15, padding: "9px 18px", borderRadius: 10, border: "none", cursor: "pointer", background: C.mint, color: "#00331c", opacity: rankLoading ? 0.6 : 1 }}>
                        {rankLoading ? "등록 중…" : "🏅 랭킹 등록"}
                      </button>
                    </div>
                    {nameError && <p style={{ color: C.coral, fontSize: 13, margin: "8px 0 0" }}>{nameError}</p>}
                  </div>
                ) : (
                  <div style={{ marginBottom: 16 }}>
                    <p style={{ color: C.mint, fontSize: 15, margin: "0 0 8px" }}>
                      {myRank !== null && myRank >= 0 ? `등록 완료! 현재 ${myRank + 1}위예요 ${MEDALS[myRank] || "🎖️"}` : "등록 완료! (순위권 밖이지만 기록은 남았어요)"}
                    </p>
                    <RankList highlight={myRank} rankLoading={rankLoading} rankings={rankings} />
                  </div>
                )}

                <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                  <button onClick={startGame} style={{ fontFamily: "inherit", fontSize: 17, padding: "10px 26px", borderRadius: 999, border: "none", cursor: "pointer", background: C.star, color: "#3a2d00", boxShadow: "0 4px 0 #b89a1f" }}>
                    다시 도전!
                  </button>
                  <button onClick={() => { setShowRanking(false); setPhase("title"); }} style={{ fontFamily: "inherit", fontSize: 17, padding: "10px 26px", borderRadius: 999, border: `2px solid ${C.platform}`, cursor: "pointer", background: "transparent", color: C.dim }}>
                    🏠 홈으로
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
