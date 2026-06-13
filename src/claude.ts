import { GoogleGenerativeAI } from '@google/generative-ai';
import { UserInput, WorkoutRoutine } from './types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

function getSplitGuide(days: number, experience: string): string {
  if (days <= 3) {
    return `- 분할: 무분할 (전신 운동)\n- ${days}일 모두 전신을 고루 자극하는 복합운동 위주로 구성\n- 가슴·등·하체·어깨를 매 세션 포함`;
  }
  if (days === 4) {
    return `- 분할: 상하체 분리 (Upper/Lower)\n- 월·목 = 상체 (가슴·등·어깨·팔), 화·금 = 하체 (대퇴·햄스트링·둔근·종아리)\n- 또는 상체 Push/Pull 각 1회 + 하체 2회`;
  }
  if (days === 5) {
    if (experience === '초보') {
      return `- 분할: 상하체 분리 + 전신 1회\n- 상체 2회, 하체 2회, 전신 또는 약점 1회`;
    }
    return `- 분할: PPL + 하체 2회 or 브로스플릿\n- Push(가슴·어깨·삼두) / Pull(등·이두) / 하체 / 상체 / 하체 순으로 배치\n- 또는 가슴·삼두 / 등·이두 / 하체 / 어깨 / 팔·복근`;
  }
  if (days === 6) {
    if (experience === '초보') {
      return `- 분할: 상하체 분리 3사이클\n- 상체·하체 교대 6일, 같은 부위 연속 금지`;
    }
    return `- 분할: PPL 2사이클\n- Push / Pull / Legs / Push / Pull / Legs\n- 각 세션 운동 구성은 동일하지 않게 변형 (다른 각도·그립 활용)`;
  }
  // 7일
  return `- 분할: PPL 2사이클 + 회복 세션 1회 (or 브로스플릿 변형)\n- Push / Pull / Legs / Push / Pull / Legs / 가벼운 전신 or 복근·유산소\n- 7일 연속은 과부하 위험 — 마지막 날은 저강도로 구성`;
}

function getRepGuide(goal: string): string {
  if (goal === '벌크업') {
    return `- 주력 복합운동: 3~5세트 × 4~8회 (고중량, 휴식 2~3분)\n- 보조운동: 3~4세트 × 8~12회 (중중량, 휴식 60~90초)\n- 세트 수 충분히 확보해 근비대 자극`;
  }
  if (goal === '다이어트') {
    return `- 주력 운동: 3~4세트 × 12~15회 (중~경중량, 휴식 45~60초)\n- 서킷 또는 수퍼셋 구성 권장으로 칼로리 소모 극대화\n- 유산소성 운동(버피, 점프스쿼트 등) 1~2개 포함 가능`;
  }
  return `- 복합운동: 3세트 × 8~12회 (중중량, 휴식 60~90초)\n- 보조운동: 3세트 × 12~15회\n- 과도한 피로 없이 현재 체력 유지에 집중`;
}

export async function generateRoutine(userInput: UserInput): Promise<WorkoutRoutine> {
  const { goal, experience, days_per_week, focus_area, height, weight } = userInput;

  const splitGuide = getSplitGuide(days_per_week, experience);
  const repGuide = getRepGuide(goal);

  const prompt = `당신은 전문 헬스 트레이너입니다. 아래 정보를 바탕으로 주간 운동 루틴을 생성해주세요.

사용자 정보:
- 운동 목표: ${goal}
- 경험 수준: ${experience}
- 주당 운동 일수: ${days_per_week}일
- 집중 부위: ${focus_area}${height && weight ? `\n- 키: ${height}cm / 몸무게: ${weight}kg (BMI: ${(weight / ((height / 100) ** 2)).toFixed(1)})` : ''}

분할 방식 (반드시 준수):
${splitGuide}

세트/반복수 기준:
${repGuide}

근육 그룹 배치 규칙 (반드시 준수):
- 같은 날 절대 함께 배치하지 말 것: 가슴+등 (길항근 중복 과부하), 삼두+이두 (팔 전용 날 제외)
- 자연스러운 조합: [가슴·어깨·삼두], [등·이두], [하체·복근], [전신]
- 어깨 전면은 가슴 운동 시 이미 자극되므로 같은 날 전면 어깨 단독 운동 최소화
- 복근은 하체 날 또는 별도 날에 배치

일반 규칙:
- 정확히 ${days_per_week}개의 day를 생성하세요
- 각 day에 4~6개 운동을 포함하세요 (${experience === '초보' ? '복합운동 위주 4~5개' : experience === '중급' ? '복합+보조운동 5~6개' : '복합+세밀한 보조운동 5~6개'})
- day_name은 실제 요일 (월요일~일요일)을 균형 있게 배치하세요
- focus는 해당 날 집중 신체 부위를 간결하게 적으세요 (예: "가슴 / 어깨 / 삼두")
- target_muscle은 운동의 주 자극 근육을 한 단어로 적으세요
- 마크다운 코드블록 없이 순수 JSON만 출력하세요

JSON 형식:
{
  "split_type": "분할 방식 (예: PPL, 상하체분리, 무분할)",
  "days": [
    {
      "day_name": "월요일",
      "focus": "가슴 / 어깨 / 삼두",
      "exercises": [
        {
          "name": "운동명 한국어",
          "sets": 4,
          "reps": 10,
          "rest_seconds": 90,
          "target_muscle": "가슴"
        }
      ]
    }
  ]
}`;

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await model.generateContent(prompt);
  let jsonText = result.response.text().trim();

  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```\n?/, '').replace(/\n?```$/, '');
  }

  try {
    return JSON.parse(jsonText) as WorkoutRoutine;
  } catch (error) {
    throw new Error(`JSON 파싱 오류: ${error}\n원본 응답: ${jsonText.slice(0, 200)}`);
  }
}
