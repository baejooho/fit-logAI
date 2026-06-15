# FitLog AI

AI 기반 운동 루틴 생성 웹앱 — 1인 사용자를 위한 점진적 과부하 운동
루틴 추천 서비스

## 프로젝트 개요

FitLog AI는 본인의 운동 목표(벌크업/다이어트/체력유지), 경험 수준,
주당 운동 가능 일수, 집중 부위, 신체 정보, 추가 요구사항을 입력하면
AI(Gemini API)가 1주 운동 루틴을 생성해주는 웹 애플리케이션이다.

운동 후 실제 수행한 무게(kg)를 기록하면, 다음 주 루틴 생성 시 이
기록을 바탕으로 AI가 점진적 과부하(progressive overload)를 자동으로
반영한 새로운 루틴을 만든다.

자세한 기획 배경은 [docs/PLANNING.md](docs/PLANNING.md)를 참고한다.

## 주요 기능

- 운동 목표(벌크업/다이어트/체력유지), 경험 수준(초보/중급/고급) 선택
- 주당 운동 가능 일수(2~7일), 집중 부위(상체/하체/전신) 선택
- 신체 정보(키/몸무게, 선택), 추가 요구사항(자유 텍스트, 선택) 입력
- AI가 생성한 1주 점진적 과부하 루틴을 요일별 탭으로 표시
  (운동 이미지, 세트×횟수, 휴식시간, 총 운동시간/종목수/세트)
- 운동별 수행 무게(kg) 기록
- 루틴 저장 및 이전 루틴 목록 조회/삭제 (최대 20개)
- 접속 시 오늘 요일 탭 자동 반영
- 다음 주 루틴 생성 시 이전 기록을 반영한 점진적 과부하 적용,
  입력값 재설정 가능

## 기술 스택

- **Backend**: Node.js, Express, TypeScript
- **AI**: Google Gemini API (`gemini-2.5-flash`)
- **Frontend**: HTML/CSS (서버 렌더링)
- **Storage**: JSON 파일 (`routines.json`, fs 모듈)
- **Testing**: Jest, supertest

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

## 테스트

```bash
npm test
```

`src/db.test.ts`(단위 테스트), `src/web.test.ts`(통합 테스트) 모두
PASS 확인됨.

## 문서

- [기획서 및 요구사항 정의서](docs/PLANNING.md)
- [WBS 및 일정](docs/WBS.md)
- [아키텍처 설계 문서](docs/ARCHITECTURE.md)
- [ADR (아키텍처 의사결정 기록)](docs/ADR.md)
- [Setup / Deploy / Testing 가이드](docs/SETUP.md)
- [AGENTS.md (AI 에이전트 활용 정책)](AGENTS.md)

## 향후 계획

- 1주 루틴을 누적한 4주 점진적 과부하 플랜으로 확장
- 칼로리·단백질 목표 기반 식단 추천 기능
- 데이터 증가 시 SQLite로 저장소 전환
- 테스트 커버리지 확대 (프롬프트 빌더, 이미지 매핑)

## 라이선스

본 프로젝트는 학습 목적으로 제작되었습니다.