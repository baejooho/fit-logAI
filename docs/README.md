# FitLog AI

AI 기반 운동 루틴 생성 웹앱 — 헬스장 이용자를 위한 1주 점진적 과부하
루틴 추천 서비스

## 프로젝트 개요

FitLog AI는 사용자가 운동 목표(벌크업/다이어트/체력유지), 경험 수준,
주당 운동 가능 일수를 입력하면, AI(Gemini API)가 점진적 과부하
원칙을 반영한 1주 운동 루틴을 생성해주는 웹 애플리케이션이다.

자세한 기획 배경은 [docs/PLANNING.md](docs/PLANNING.md)를 참고한다.

## 주요 기능

- 목표(벌크업/다이어트/체력유지) 선택
- 경험 수준(초보/중급/고급) 선택
- 주당 운동 가능 일수 입력
- AI가 생성한 1주 점진적 과부하 루틴을 요일별 표로 출력

## 기술 스택

- **Backend**: Node.js, Express, TypeScript
- **AI**: Google Gemini API (`gemini-2.0-flash`)
- **Frontend**: HTML/CSS (서버 렌더링)

## 설치 및 실행 방법

```bash
git clone https://github.com/baejooho/fit-logAI.git
cd fit-logAI
npm install
cp .env.example .env
# .env 파일에 GEMINI_API_KEY 입력
npm run web
```

브라우저에서 `http://localhost:3000` 접속.

자세한 환경변수 설정, 빌드, 배포, 테스트 방법은
[docs/SETUP.md](docs/SETUP.md)를 참고한다.

## 환경변수 설정

본 프로젝트는 API 키 등 민감 정보를 `.env` 파일을 통한 환경변수로
관리하며, `.env`는 저장소에 포함되지 않는다. `.env.example`을
참고하여 `.env`를 생성한다.

| 변수명 | 설명 |
|--------|------|
| `GEMINI_API_KEY` | Google AI Studio에서 발급한 Gemini API 키 |
| `PORT` | 웹 서버 포트 번호 (기본 3000) |

## 문서

- [기획서 및 요구사항 정의서](docs/PLANNING.md)
- [WBS 및 일정](docs/WBS.md)
- [아키텍처 설계 문서](docs/ARCHITECTURE.md)
- [ADR (아키텍처 의사결정 기록)](docs/ADR.md)
- [Setup / Deploy / Testing 가이드](docs/SETUP.md)
- [AGENTS.md (AI 에이전트 활용 정책)](AGENTS.md)

## 향후 계획

- SQLite 기반 사용자별 루틴 저장 및 히스토리 기능
- 1주 루틴을 누적한 4주 점진적 과부하 플랜으로 확장
- 칼로리·단백질 목표 기반 식단 추천 기능

## 라이선스

본 프로젝트는 학습 목적으로 제작되었습니다.
