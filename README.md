# 올라타자! 타자 서바이벌

초등학생용 문장 타자 대결 게임입니다. React와 Vite로 구성되어 있습니다.

## 로컬 실행과 점검

```bash
npm install
npm run dev
npm run check
```

`npm run check`는 소스 린트와 프로덕션 빌드를 차례로 실행합니다. `docs/assets/`는 이전 배포에서 만들어진 생성물이므로 린트 대상이 아니며, 실제 수정 기준은 `src/`입니다.

## 배포와 산출물

- 운영 주소: <https://cantroxx.github.io/climb-typing/>
- 배포 방식: GitHub Pages (`/climb-typing/` base 경로)
- 기준 저장소: <https://github.com/cantroxx/climb-typing>
- 실제 소스는 `src/`이고 Vite의 기본 새 빌드 산출물은 `dist/`입니다. 저장소의 `docs/`는 이전 배포 산출물로 취급하며 직접 기능 수정 기준으로 삼지 않습니다.

## 랭킹 데이터 안전

- Firebase URL이 설정된 현재 배포는 학급 공유 랭킹을 읽고 새 기록을 추가합니다.
- Firebase 사용이 불가능하면 브라우저 `localStorage`의 `climb_typing_rankings`를 개인 기록 대체 저장소로 사용합니다.
- 공개 클라이언트에서는 공유 Firebase 랭킹 전체 삭제를 실행하지 않습니다.
- 로컬 모드에서만 이 기기의 기록 삭제 메뉴가 보이며, 삭제 전 확인 단계를 거칩니다.
- 실제 학급 운영 전에는 Realtime Database 규칙에서 읽기·쓰기 범위와 입력값 검증을 별도로 확인해야 합니다.

빌드나 린트는 Firebase에 접속하거나 랭킹 데이터를 변경하지 않습니다.

## 외부 서비스와 알려진 제한

- Firebase Realtime Database가 유일한 백엔드입니다. 실제 학급 운영 전 Rules의 입력 검증과 쓰기 범위를 확인합니다.
- 문장·이미지·음원을 추가할 때는 출처와 이용 조건을 기록합니다.
- 배포 전 `npm run check`, 한글 입력 시작·정답·오답·게임 종료, 공유 랭킹 실패 시 로컬 대체, 모바일 입력을 확인합니다.
