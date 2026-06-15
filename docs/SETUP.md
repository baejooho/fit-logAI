# FitLog AI — Setup, Deploy & Testing 가이드

본 문서는 FitLog AI 프로젝트의 개발 환경 설정(setup), 빌드 및 배포
(deploy), 테스트(testing) 절차를 안내한다.

---

## 1. 사전 요구사항 (Prerequisites)

- Node.js 18 이상
- npm
- Google AI Studio에서 발급한 Gemini API 키

Node.js 버전 확인:

```bash
node --version
```

---

## 2. 프로젝트 클론 및 설치 (Setup)

```bash
git clone https://github.com/baejooho/fit-logAI.git
cd fit-logAI
npm install
```

`npm install` 실행 시 `package-lock.json`에 명시된 의존성이 설치된다.

---

## 3. 환경변수 설정 (Environment Variables)

본 프로젝트는 API 키 등 민감 정보를 코드에 하드코딩하지 않고
환경변수(`.env`)로 관리한다. `.env` 파일은 `.gitignore`에 포함되어
저장소에 올라가지 않으며, 대신 `.env.example`에 필요한 변수 목록을
제공한다.

### 3.1 .env 파일 생성

```bash
cp .env.example .env
```

(Windows PowerShell의 경우)

```powershell
copy .env.example .env
```

### 3.2 환경변수 값 입력

`.env` 파일을 열어 아래 변수에 실제 값을 입력한다.

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `GEMINI_API_KEY` | Google AI Studio에서 발급한 Gemini API 키 | `AIza...` |
| `PORT` | 웹 서버 포트 번호 | `3000` |

`GEMINI_API_KEY`는 [Google AI Studio](https://aistudio.google.com)에서
무료로 발급받을 수 있다.

---

## 4. 빌드 및 실행 (Build & Run)

### 4.1 개발 모드 실행

```bash
npm run web
```

위 명령 실행 후 브라우저에서 `http://localhost:3000` 에 접속하면
입력 폼 화면이 표시된다.

### 4.2 TypeScript 빌드

```bash
npm run build
```

`tsconfig.json` 설정에 따라 TypeScript 소스(`src/`)가 컴파일된다.

---

## 5. 배포 (Deploy)

본 프로젝트는 1인 사용을 목적으로 하며, 현재는 소스코드와 문서를
GitHub 저장소에 배포(push)하는 방식을 사용한다.

### 배포 절차

1. `npm run build`로 TypeScript 컴파일 확인
2. `npm test`로 단위/통합 테스트 통과 확인
3. `git add`, `git commit`, `git push`로 GitHub에 반영
4. (선택) Node.js 지원 호스팅(Render, Railway 등)에 배포 시,
   빌드 명령은 `npm install && npm run build`, 시작 명령은 `npm run web`,
   환경변수는 `GEMINI_API_KEY`, `PORT`를 호스팅 환경변수 설정에 등록

---

## 6. 테스트 (Testing)

### 6.1 자동화 테스트

Jest 기반 단위 테스트와 통합 테스트를 작성하여 실행한다.

```bash
npm test
```

| 파일 | 종류 | 내용 | 결과 |
|------|------|------|------|
| `src/db.test.ts` | 단위 테스트 | 루틴 저장 후 조회 시 동일한 데이터가 반환되는지 검증 (임시 DB 경로 사용) | PASS |
| `src/web.test.ts` | 통합 테스트 | Express 서버의 `GET /` 요청이 200 응답을 반환하는지 검증 (supertest, Gemini 호출은 mock) | PASS |

실행 결과: `Test Suites: 2 passed, 2 total / Tests: 2 passed, 2 total`

### 6.2 수동 테스트 시나리오

| 테스트 항목 | 입력값 예시 | 기대 결과 |
|-------------|-------------|-----------|
| 정상 입력 | 목표: 벌크업, 경험: 초보, 일수: 4, 부위: 전신 | 1주 루틴(요일별 운동/세트/횟수/휴식시간)이 표로 표시됨 |
| 추가 요구사항 반영 | "무릎 부상으로 스쿼트 대신 다른 운동" | 스쿼트가 대체 운동으로 변경되어 생성됨 |
| 수행 무게 기록 후 다음 주 루틴 | 1주차 기록 후 "다음 주 루틴 생성" | 기록된 무게보다 높은 무게/세트로 점진적 과부하 반영 |
| 이전 루틴 삭제 | 저장된 루틴 목록에서 삭제 클릭 | routines.json에서 해당 항목 제거 |

### 6.3 향후 테스트 계획

- 프롬프트 빌더(claude.ts) 단위 테스트 추가
- 이미지 매핑 로직 테스트 추가