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

`.env.example`을 복사하여 `.env` 파일을 생성한다.

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

본 프로젝트는 Node.js 기반 Express 서버로 동작하므로, Node.js를
지원하는 환경(예: Render, Railway, Vercel 등)에 배포할 수 있다.

### 배포 절차 (예시)

1. 저장소를 배포 플랫폼에 연결
2. 빌드 명령어: `npm install && npm run build`
3. 시작 명령어: `npm run web` (또는 빌드 결과 실행 명령)
4. 배포 환경의 환경변수 설정 화면에서 `GEMINI_API_KEY`, `PORT`를
   `.env`와 동일하게 등록
5. 배포 완료 후 제공되는 URL로 접속하여 정상 동작 확인

---

## 6. 테스트 (Testing)

### 6.1 수동 테스트 (Manual Testing)

현재 버전은 자동화된 테스트 코드 대신, 다음 시나리오 기반 수동
테스트를 통해 동작을 검증한다.

| 테스트 항목 | 입력값 예시 | 기대 결과 |
|-------------|-------------|-----------|
| 정상 입력 | 목표: 벌크업, 경험: 중급, 운동일수: 4 | 1주 루틴(요일별 운동/세트/횟수)이 표 형태로 표시됨 |
| 다른 목표 선택 | 목표: 다이어트 | 벌크업과 다른 구성의 루틴이 생성됨 |
| API 키 누락 | `.env`에 `GEMINI_API_KEY` 미설정 | 에러 메시지가 콘솔 및 화면에 표시됨 |
| 모델 응답 오류 | (네트워크 차단 등) | 사용자에게 오류 안내 메시지 표시 |

### 6.2 향후 자동화 테스트 계획

- 프롬프트 빌더 함수에 대한 단위 테스트(Unit Test) 추가
- `/generate` 라우트에 대한 통합 테스트(Integration Test) 추가
  (예: Jest + supertest)
