import 'dotenv/config';
import express, { Request, Response } from 'express';
import { generateRoutine } from './claude';
import { saveRoutine } from './db';
import { UserInput, WorkoutRoutine } from './types';

const app = express();
const PORT = 3000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const MOCK_ROUTINE: WorkoutRoutine = {
  split_type: 'PPL',
  days: [
    {
      day_name: '월요일', focus: '가슴 / 어깨 / 삼두',
      exercises: [
        { name: '바벨 벤치프레스',      sets: 4, reps: 8,  rest_seconds: 90,  target_muscle: '가슴' },
        { name: '인클라인 덤벨프레스',  sets: 3, reps: 10, rest_seconds: 75,  target_muscle: '상부 가슴' },
        { name: '덤벨 숄더프레스',      sets: 3, reps: 12, rest_seconds: 60,  target_muscle: '어깨' },
        { name: '케이블 레터럴레이즈',  sets: 3, reps: 15, rest_seconds: 45,  target_muscle: '측면 삼각근' },
        { name: '트라이셉스 푸시다운',  sets: 3, reps: 12, rest_seconds: 60,  target_muscle: '삼두' },
      ],
    },
    {
      day_name: '수요일', focus: '등 / 이두',
      exercises: [
        { name: '바벨 데드리프트',      sets: 4, reps: 6,  rest_seconds: 120, target_muscle: '척추기립근' },
        { name: '랫풀다운',            sets: 4, reps: 10, rest_seconds: 75,  target_muscle: '광배근' },
        { name: '시티드 케이블 로우',   sets: 3, reps: 12, rest_seconds: 60,  target_muscle: '중부 등' },
        { name: '덤벨 해머컬',         sets: 3, reps: 12, rest_seconds: 60,  target_muscle: '이두' },
        { name: '페이스 풀',           sets: 3, reps: 15, rest_seconds: 45,  target_muscle: '후면 삼각근' },
      ],
    },
    {
      day_name: '금요일', focus: '하체 전체',
      exercises: [
        { name: '바벨 스쿼트',         sets: 4, reps: 8,  rest_seconds: 120, target_muscle: '대퇴사두' },
        { name: '레그프레스',          sets: 3, reps: 12, rest_seconds: 90,  target_muscle: '대퇴사두' },
        { name: '레그 익스텐션',       sets: 3, reps: 15, rest_seconds: 60,  target_muscle: '대퇴사두' },
        { name: '레그 컬',            sets: 3, reps: 15, rest_seconds: 60,  target_muscle: '햄스트링' },
        { name: '카프 레이즈',         sets: 4, reps: 20, rest_seconds: 45,  target_muscle: '종아리' },
      ],
    },
  ],
};

const PAGE_HTML = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AI 운동 루틴 생성기</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg:       #0a0a0a;
  --bg2:      #111111;
  --surface:  #161616;
  --card:     #1c1c1c;
  --card2:    #222222;
  --accent:   #e8484a;
  --accent-d: #c03638;
  --accent-l: rgba(232,72,74,0.12);
  --text:     #f2f2f2;
  --sub:      #888888;
  --border:   #282828;
  --border2:  #333333;
}

body {
  font-family: 'Inter', system-ui, sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
}

/* ── NAV ── */
.nav {
  position: sticky; top: 0; z-index: 50;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 2rem; height: 56px;
  background: rgba(10,10,10,0.85); backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
}
.nav-logo { font-size: 1rem; font-weight: 800; letter-spacing: -0.02em; color: var(--text); }
.nav-logo span { color: var(--accent); }
.nav-badge { font-size: 0.7rem; background: var(--accent-l); border: 1px solid rgba(232,72,74,0.3); color: var(--accent); border-radius: 4px; padding: 0.15rem 0.5rem; font-weight: 700; }

/* ── MAIN LAYOUT ── */
.main { max-width: 1100px; margin: 0 auto; padding: 2.5rem 1.5rem; }

/* ── FORM ── */
.form-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
}
.form-title { font-size: 1.4rem; font-weight: 800; margin-bottom: 0.3rem; letter-spacing: -0.03em; }
.form-sub { font-size: 0.85rem; color: var(--sub); margin-bottom: 2rem; }

.field-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--sub); margin-bottom: 0.6rem; display: block; }
.field-group { margin-bottom: 1.6rem; }

.option-row { display: flex; gap: 0.6rem; flex-wrap: wrap; }
.option-row input[type="radio"] { display: none; }
.option-row label {
  flex: 1; min-width: 100px; padding: 0.7rem 0.5rem;
  background: var(--card); border: 1.5px solid var(--border2);
  border-radius: 10px; text-align: center; cursor: pointer;
  font-size: 0.85rem; font-weight: 500; color: var(--sub);
  transition: all 0.15s;
}
.option-row label:hover { border-color: var(--accent); color: var(--text); }
.option-row input[type="radio"]:checked + label {
  border-color: var(--accent); background: var(--accent-l); color: var(--text); font-weight: 700;
}

select {
  width: 100%; padding: 0.75rem 1rem;
  background: var(--card); border: 1.5px solid var(--border2);
  border-radius: 10px; color: var(--text); font-size: 0.9rem;
  font-family: inherit; outline: none; cursor: pointer; appearance: none;
  transition: border-color 0.15s;
}
select:focus { border-color: var(--accent); }

.form-actions { display: flex; gap: 0.75rem; margin-top: 0.5rem; }
.btn-primary {
  flex: 1; padding: 0.9rem;
  background: var(--accent); border: none; border-radius: 10px;
  color: #fff; font-size: 0.95rem; font-weight: 700; font-family: inherit;
  cursor: pointer; transition: background 0.15s, transform 0.1s;
  letter-spacing: -0.01em;
}
.btn-primary:hover { background: var(--accent-d); }
.btn-primary:active { transform: scale(0.99); }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-ghost {
  flex: none; padding: 0.9rem 1.2rem;
  background: transparent; border: 1.5px solid var(--border2);
  border-radius: 10px; color: var(--sub); font-size: 0.85rem;
  font-weight: 600; font-family: inherit; cursor: pointer;
  transition: all 0.15s; white-space: nowrap;
}
.btn-ghost:hover { border-color: var(--sub); color: var(--text); }

.error-msg { display: none; margin-top: 0.75rem; padding: 0.75rem 1rem; background: rgba(232,72,74,0.08); border: 1px solid rgba(232,72,74,0.3); border-radius: 8px; color: #ff7a7c; font-size: 0.85rem; }

/* ── 신체 정보 입력 ── */
.body-inputs { display: flex; gap: 0.6rem; }
.body-field { flex: 1; position: relative; }
.body-field input[type="number"] {
  width: 100%; padding: 0.72rem 2.6rem 0.72rem 0.9rem;
  background: var(--card); border: 1.5px solid var(--border2);
  border-radius: 10px; color: var(--text); font-size: 0.9rem;
  font-family: inherit; outline: none; transition: border-color 0.15s;
  -moz-appearance: textfield;
}
.body-field input[type="number"]::-webkit-inner-spin-button,
.body-field input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; }
.body-field input[type="number"]:focus { border-color: var(--accent); }
.body-field input[type="number"]::placeholder { color: var(--sub); }
.body-unit {
  position: absolute; right: 0.8rem; top: 50%; transform: translateY(-50%);
  font-size: 0.72rem; color: var(--sub); pointer-events: none; font-weight: 600;
}
.bmi-bar {
  display: none; margin-top: 0.55rem; padding: 0.55rem 0.9rem;
  background: var(--card); border: 1px solid var(--border2); border-radius: 8px;
  align-items: center; gap: 0.75rem; flex-wrap: wrap;
}
.bmi-bar.show { display: flex; animation: fadeIn 0.2s ease; }
.bmi-num { font-size: 1.1rem; font-weight: 900; letter-spacing: -0.03em; }
.bmi-cat { font-size: 0.72rem; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: 4px; }
.bmi-msg { font-size: 0.75rem; color: var(--sub); margin-left: auto; }

/* ── 기대효과 미리보기 ── */
.effect-preview {
  display: none; margin-top: 1rem;
  padding: 1rem 1.2rem;
  background: rgba(232,72,74,0.04);
  border: 1px solid rgba(232,72,74,0.18);
  border-left: 3px solid var(--accent);
  border-radius: 12px;
  animation: fadeIn 0.25s ease;
}
@keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
/* ── 경험 수준 안내 ── */
.field-label-row { display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.6rem; }
.info-btn {
  width: 16px; height: 16px; border-radius: 50%;
  border: 1.5px solid var(--border2); background: transparent;
  color: var(--sub); font-size: 0.6rem; font-weight: 700;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.15s; line-height: 1; padding: 0; font-family: inherit;
}
.info-btn:hover, .info-btn.active { border-color: var(--accent); color: var(--accent); }
.exp-guide {
  display: none; margin-top: 0.6rem;
  background: var(--card); border: 1px solid var(--border2);
  border-radius: 10px; overflow: hidden;
}
.exp-guide.open { display: block; animation: fadeIn 0.2s ease; }
.exp-row {
  display: flex; align-items: flex-start; gap: 0.75rem;
  padding: 0.65rem 0.9rem; border-bottom: 1px solid var(--border);
}
.exp-row:last-child { border-bottom: none; }
.exp-icon { font-size: 1rem; flex-shrink: 0; margin-top: 1px; }
.exp-text {}
.exp-name { font-size: 0.8rem; font-weight: 700; color: var(--text); margin-bottom: 0.15rem; }
.exp-desc { font-size: 0.73rem; color: var(--sub); line-height: 1.5; }

.effect-label {
  font-size: 0.65rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.09em; color: var(--accent); margin-bottom: 0.55rem;
}
.effect-list { list-style: none; display: flex; flex-direction: column; gap: 0.3rem; }
.effect-list li {
  font-size: 0.82rem; color: var(--sub); display: flex; align-items: flex-start; gap: 0.45rem;
}
.effect-list li::before { content: '→'; color: var(--accent); flex-shrink: 0; }

/* ── LOADING ── */
.loading { display: none; padding: 3rem; text-align: center; color: var(--sub); }
.spinner { width: 36px; height: 36px; border: 2.5px solid var(--border2); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.7s linear infinite; margin: 0 auto 1rem; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── RESULTS ── */
#results { display: none; }

.routine-header {
  display: flex; align-items: center; gap: 0.75rem;
  margin-bottom: 1.5rem; flex-wrap: wrap;
}
.split-chip {
  display: inline-flex; align-items: center; gap: 0.4rem;
  padding: 0.3rem 0.85rem; border-radius: 20px;
  background: var(--accent-l); border: 1px solid rgba(232,72,74,0.3);
  color: var(--accent); font-size: 0.78rem; font-weight: 700;
}
.demo-chip {
  padding: 0.3rem 0.75rem; border-radius: 20px;
  background: rgba(255,255,255,0.05); border: 1px solid var(--border2);
  color: var(--sub); font-size: 0.72rem; font-weight: 600;
}
.save-chip { margin-left: auto; font-size: 0.75rem; color: var(--sub); }

/* ── DAY TABS ── */
.day-tabs { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; overflow-x: auto; padding-bottom: 4px; }
.day-tabs::-webkit-scrollbar { display: none; }
.day-tab {
  flex-shrink: 0; padding: 0.5rem 1.2rem;
  background: var(--surface); border: 1.5px solid var(--border);
  border-radius: 30px; color: var(--sub); font-size: 0.82rem;
  font-weight: 600; font-family: inherit; cursor: pointer; transition: all 0.15s;
}
.day-tab.active { background: var(--accent); border-color: var(--accent); color: #fff; }
.day-tab:not(.active):hover { border-color: var(--border2); color: var(--text); }

/* ── DAY PANEL ── */
.day-panel { display: none; }
.day-panel.active { display: block; }

/* 하루 인포 바 */
.day-infobar {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 1.2rem; flex-wrap: wrap; gap: 1rem;
}
.day-title-group {}
.day-name { font-size: 1.5rem; font-weight: 800; letter-spacing: -0.03em; }
.day-focus { font-size: 0.85rem; color: var(--sub); margin-top: 0.2rem; }

.day-stats { display: flex; gap: 1.5rem; }
.day-stat { text-align: right; }
.day-stat-val { font-size: 1.3rem; font-weight: 800; color: var(--text); line-height: 1; }
.day-stat-lbl { font-size: 0.65rem; color: var(--sub); text-transform: uppercase; letter-spacing: 0.06em; margin-top: 2px; }

/* ── EXERCISE CARDS ── */
.ex-list { display: flex; flex-direction: column; gap: 0.75rem; }

.ex-card {
  display: flex; align-items: center; gap: 1.2rem;
  padding: 1.1rem 1.2rem;
  background: var(--card); border: 1px solid var(--border);
  border-radius: 16px; cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  position: relative; overflow: hidden;
}
.ex-card::before {
  content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
  background: var(--accent); opacity: 0; transition: opacity 0.15s;
  border-radius: 3px 0 0 3px;
}
.ex-card:hover { border-color: var(--border2); background: var(--card2); }
.ex-card:hover::before { opacity: 1; }

/* 기구 일러스트 */
.ex-illust {
  width: 88px; height: 88px; flex-shrink: 0;
  background: var(--accent-l); border-radius: 12px;
  border: 1px solid rgba(232,72,74,0.15);
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 4px;
}
.ex-illust svg { width: 62px; height: 50px; }
.ex-illust-lbl { font-size: 0.55rem; color: rgba(232,72,74,0.7); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }

/* 운동 정보 */
.ex-info { flex: 1; min-width: 0; }
.ex-name { font-size: 0.95rem; font-weight: 700; margin-bottom: 0.35rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ex-muscle-badge {
  display: inline-block; padding: 0.15rem 0.55rem;
  background: rgba(232,72,74,0.1); border: 1px solid rgba(232,72,74,0.25);
  border-radius: 4px; font-size: 0.68rem; color: var(--accent); font-weight: 700;
  margin-bottom: 0.75rem;
}

/* 세트×반복 크게 */
.ex-params { display: flex; align-items: flex-end; gap: 1.2rem; }
.param-block { }
.param-val { font-size: 2rem; font-weight: 900; line-height: 1; letter-spacing: -0.04em; color: var(--text); }
.param-lbl { font-size: 0.6rem; color: var(--sub); text-transform: uppercase; letter-spacing: 0.07em; margin-top: 2px; }
.param-sep { font-size: 1.4rem; font-weight: 300; color: var(--border2); padding-bottom: 4px; }

.ex-rest {
  margin-left: auto; flex-shrink: 0;
  display: flex; flex-direction: column; align-items: center;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 10px; padding: 0.5rem 0.8rem; min-width: 64px;
}
.ex-rest-val { font-size: 1.1rem; font-weight: 800; color: var(--text); }
.ex-rest-lbl { font-size: 0.58rem; color: var(--sub); text-transform: uppercase; letter-spacing: 0.05em; margin-top: 1px; }

/* ── 모달 ── */
.modal-overlay {
  display: none; position: fixed; inset: 0;
  background: rgba(0,0,0,0.8); backdrop-filter: blur(6px);
  z-index: 200; align-items: center; justify-content: center;
}
.modal-overlay.open { display: flex; }
.modal {
  background: var(--surface); border: 1px solid var(--border2);
  border-radius: 24px; padding: 2rem; width: 90%; max-width: 400px;
}
.modal-illust {
  width: 100%; aspect-ratio: 16/9; border-radius: 14px;
  background: var(--accent-l); border: 1px solid rgba(232,72,74,0.15);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 1.2rem;
}
.modal-illust svg { width: 55%; height: 55%; }
.modal-name { font-size: 1.2rem; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 0.25rem; }
.modal-equip { font-size: 0.78rem; color: var(--accent); font-weight: 600; margin-bottom: 1rem; }
.modal-stat-row { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
.modal-stat-box { flex: 1; background: var(--card); border-radius: 10px; padding: 0.75rem; text-align: center; }
.modal-stat-box strong { display: block; font-size: 1.4rem; font-weight: 900; letter-spacing: -0.03em; }
.modal-stat-box span { font-size: 0.62rem; color: var(--sub); text-transform: uppercase; letter-spacing: 0.06em; }
.modal-hint { font-size: 0.8rem; color: var(--sub); line-height: 1.65; background: var(--card); border-radius: 10px; padding: 0.85rem 1rem; }
.modal-close {
  width: 100%; margin-top: 1rem; padding: 0.75rem;
  background: transparent; border: 1.5px solid var(--border2);
  border-radius: 10px; color: var(--sub); font-size: 0.85rem;
  font-family: inherit; cursor: pointer; transition: all 0.15s;
}
.modal-close:hover { border-color: var(--accent); color: var(--accent); }
</style>
</head>
<body>

<!-- 기구 SVG 저장소 (숨김) -->
<div id="svg-store" aria-hidden="true" style="display:none">
  <svg id="svg-barbell" viewBox="0 0 120 50" fill="none">
    <rect x="18" y="20" width="84" height="10" rx="5" fill="#555"/>
    <line x1="35" y1="20" x2="35" y2="30" stroke="#444" stroke-width="1.5"/>
    <line x1="85" y1="20" x2="85" y2="30" stroke="#444" stroke-width="1.5"/>
    <rect x="2"  y="6"  width="14" height="38" rx="4" fill="#e8484a" opacity="0.9"/>
    <rect x="14" y="13" width="8"  height="24" rx="3" fill="#e8484a" opacity="0.55"/>
    <rect x="98" y="13" width="8"  height="24" rx="3" fill="#e8484a" opacity="0.55"/>
    <rect x="104" y="6" width="14" height="38" rx="4" fill="#e8484a" opacity="0.9"/>
  </svg>
  <svg id="svg-dumbbell" viewBox="0 0 120 60" fill="none">
    <rect x="40" y="26" width="40" height="8" rx="4" fill="#555"/>
    <line x1="52" y1="26" x2="52" y2="34" stroke="#444" stroke-width="1"/>
    <line x1="60" y1="26" x2="60" y2="34" stroke="#444" stroke-width="1"/>
    <line x1="68" y1="26" x2="68" y2="34" stroke="#444" stroke-width="1"/>
    <path d="M6 16 L32 10 L40 30 L32 50 L6 44 Z" fill="#e8484a" opacity="0.75"/>
    <circle cx="24" cy="30" r="5" fill="#1c1c1c"/>
    <path d="M114 16 L88 10 L80 30 L88 50 L114 44 Z" fill="#e8484a" opacity="0.75"/>
    <circle cx="96" cy="30" r="5" fill="#1c1c1c"/>
  </svg>
  <svg id="svg-cable" viewBox="0 0 100 130" fill="none">
    <rect x="8" y="5" width="34" height="118" rx="5" fill="#1e1e1e" stroke="#333" stroke-width="1.5"/>
    <rect x="14" y="55" width="22" height="55" rx="2" fill="#111"/>
    <line x1="14" y1="63" x2="36" y2="63" stroke="#e8484a" stroke-width="1" opacity="0.45"/>
    <line x1="14" y1="70" x2="36" y2="70" stroke="#e8484a" stroke-width="1" opacity="0.45"/>
    <line x1="14" y1="77" x2="36" y2="77" stroke="#e8484a" stroke-width="1" opacity="0.45"/>
    <line x1="14" y1="84" x2="36" y2="84" stroke="#e8484a" stroke-width="1" opacity="0.45"/>
    <rect x="14" y="63" width="22" height="7" rx="1" fill="#e8484a" opacity="0.2"/>
    <circle cx="25" cy="18" r="9" fill="none" stroke="#e8484a" stroke-width="2"/>
    <circle cx="25" cy="18" r="3" fill="#e8484a" opacity="0.5"/>
    <path d="M25 27 Q25 70 75 90" fill="none" stroke="#e8484a" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.7"/>
    <rect x="68" y="86" width="22" height="10" rx="5" fill="#2a2a2a" stroke="#e8484a" stroke-width="1.5"/>
    <line x1="79" y1="96" x2="79" y2="115" stroke="#e8484a" stroke-width="2" stroke-linecap="round"/>
    <rect x="66" y="113" width="26" height="6" rx="3" fill="#2a2a2a" stroke="#444" stroke-width="1.5"/>
  </svg>
  <svg id="svg-legpress" viewBox="0 0 160 110" fill="none">
    <line x1="8"  y1="100" x2="152" y2="100" stroke="#444" stroke-width="3" stroke-linecap="round"/>
    <line x1="8"  y1="100" x2="80"  y2="22"  stroke="#444" stroke-width="3" stroke-linecap="round"/>
    <rect x="60" y="72" width="70" height="12" rx="4" fill="#222" stroke="#444" stroke-width="1.5"/>
    <path d="M80 22 L110 22 L110 55 L80 68 Z" fill="#222" stroke="#444" stroke-width="1.5"/>
    <rect x="14" y="20" width="44" height="30" rx="5" fill="#222" stroke="#e8484a" stroke-width="2"/>
    <line x1="22" y1="33" x2="50" y2="33" stroke="#e8484a" stroke-width="1.5" opacity="0.5"/>
    <line x1="22" y1="40" x2="50" y2="40" stroke="#e8484a" stroke-width="1.5" opacity="0.5"/>
    <circle cx="138" cy="70" r="18" fill="none" stroke="#e8484a" stroke-width="2.5"/>
    <circle cx="138" cy="70" r="10" fill="none" stroke="#e8484a" stroke-width="1.5" opacity="0.5"/>
    <circle cx="138" cy="70" r="4"  fill="#e8484a" opacity="0.4"/>
  </svg>
  <svg id="svg-machine" viewBox="0 0 120 150" fill="none">
    <rect x="8"  y="10"  width="14"  height="130" rx="4" fill="#1a1a1a" stroke="#333" stroke-width="1.5"/>
    <rect x="98" y="10"  width="14"  height="130" rx="4" fill="#1a1a1a" stroke="#333" stroke-width="1.5"/>
    <rect x="8"  y="10"  width="104" height="12"  rx="4" fill="#1a1a1a" stroke="#333" stroke-width="1.5"/>
    <rect x="12" y="35"  width="10"  height="65"  rx="2" fill="#0f0f0f"/>
    <line x1="12" y1="44"  x2="22" y2="44"  stroke="#e8484a" stroke-width="1" opacity="0.4"/>
    <line x1="12" y1="52"  x2="22" y2="52"  stroke="#e8484a" stroke-width="1" opacity="0.4"/>
    <line x1="12" y1="60"  x2="22" y2="60"  stroke="#e8484a" stroke-width="1" opacity="0.4"/>
    <rect x="12" y="44"  width="10"  height="8"   rx="1" fill="#e8484a" opacity="0.25"/>
    <rect x="30" y="75"  width="62"  height="14"  rx="6" fill="#222" stroke="#333" stroke-width="1.5"/>
    <rect x="30" y="58"  width="62"  height="20"  rx="5" fill="#222" stroke="#333" stroke-width="1.5"/>
    <line x1="61" y1="89" x2="55" y2="128" stroke="#333" stroke-width="4" stroke-linecap="round"/>
    <rect x="38" y="124" width="38"  height="12"  rx="6" fill="#222" stroke="#e8484a" stroke-width="2"/>
    <path d="M22 48 Q50 65 55 100" fill="none" stroke="#e8484a" stroke-width="1.5" opacity="0.5" stroke-dasharray="4 3"/>
  </svg>
  <svg id="svg-bodyweight" viewBox="0 0 120 160" fill="none">
    <rect x="0" y="0" width="120" height="12" fill="#222"/>
    <rect x="18" y="8"  width="8" height="30" rx="3" fill="#444"/>
    <rect x="94" y="8"  width="8" height="30" rx="3" fill="#444"/>
    <rect x="12" y="32" width="96" height="10" rx="5" fill="#e8484a"/>
    <circle cx="60" cy="55" r="11" fill="none" stroke="#f2f2f2" stroke-width="2.5"/>
    <line x1="55" y1="46" x2="36" y2="38" stroke="#f2f2f2" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="65" y1="46" x2="84" y2="38" stroke="#f2f2f2" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="60" y1="66" x2="60" y2="105" stroke="#f2f2f2" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="60" y1="82" x2="45" y2="95" stroke="#f2f2f2" stroke-width="2" stroke-linecap="round"/>
    <line x1="60" y1="82" x2="75" y2="95" stroke="#f2f2f2" stroke-width="2" stroke-linecap="round"/>
    <line x1="60" y1="105" x2="46" y2="135" stroke="#f2f2f2" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="46" y1="135" x2="42" y2="158" stroke="#f2f2f2" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="60" y1="105" x2="74" y2="135" stroke="#f2f2f2" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="74" y1="135" x2="78" y2="158" stroke="#f2f2f2" stroke-width="2.5" stroke-linecap="round"/>
  </svg>
  <svg id="svg-bench" viewBox="0 0 200 140" fill="none">
    <rect x="28"  y="90" width="130" height="14" rx="5" fill="#222" stroke="#444" stroke-width="1.5"/>
    <line x1="50"  y1="104" x2="50"  y2="128" stroke="#444" stroke-width="3" stroke-linecap="round"/>
    <line x1="130" y1="104" x2="130" y2="128" stroke="#444" stroke-width="3" stroke-linecap="round"/>
    <line x1="38"  y1="128" x2="64"  y2="128" stroke="#444" stroke-width="3" stroke-linecap="round"/>
    <line x1="118" y1="128" x2="144" y2="128" stroke="#444" stroke-width="3" stroke-linecap="round"/>
    <circle cx="158" cy="80" r="11" fill="none" stroke="#f2f2f2" stroke-width="2.5"/>
    <line x1="147" y1="80" x2="55" y2="88" stroke="#f2f2f2" stroke-width="3" stroke-linecap="round"/>
    <line x1="55"  y1="88" x2="36" y2="108" stroke="#f2f2f2" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="36"  y1="108" x2="50" y2="128" stroke="#f2f2f2" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="130" y1="83" x2="105" y2="48" stroke="#f2f2f2" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="105" y1="87" x2="80"  y2="48" stroke="#f2f2f2" stroke-width="2.5" stroke-linecap="round"/>
    <rect x="5"   y="40" width="190" height="9" rx="4" fill="#555"/>
    <rect x="5"   y="26" width="14"  height="37" rx="4" fill="#e8484a" opacity="0.9"/>
    <rect x="17"  y="33" width="8"   height="23" rx="3" fill="#e8484a" opacity="0.55"/>
    <rect x="175" y="33" width="8"   height="23" rx="3" fill="#e8484a" opacity="0.55"/>
    <rect x="181" y="26" width="14"  height="37" rx="4" fill="#e8484a" opacity="0.9"/>
  </svg>
</div>

<!-- 모달 -->
<div class="modal-overlay" id="modal" onclick="closeModal(event)">
  <div class="modal">
    <div class="modal-illust" id="modal-illust"></div>
    <div class="modal-name"   id="modal-name"></div>
    <div class="modal-equip"  id="modal-equip"></div>
    <div class="modal-stat-row" id="modal-stats"></div>
    <div class="modal-hint"   id="modal-hint"></div>
    <button class="modal-close" onclick="document.getElementById('modal').classList.remove('open')">닫기</button>
  </div>
</div>

<!-- 네비게이션 -->
<nav class="nav">
  <div class="nav-logo">planfit<span>.</span>ai <span class="nav-badge">demo</span></div>
</nav>

<div class="main">
  <!-- 폼 -->
  <div class="form-card" id="formSection">
    <div class="form-title">내 운동 루틴 만들기</div>
    <div class="form-sub">목표와 수준을 입력하면 AI가 맞춤 루틴을 생성합니다</div>
    <form id="form">
      <div class="field-group">
        <label class="field-label">운동 목표</label>
        <div class="option-row">
          <input type="radio" name="goal" id="g1" value="벌크업" checked><label for="g1">💪 벌크업</label>
          <input type="radio" name="goal" id="g2" value="다이어트"><label for="g2">🔥 다이어트</label>
          <input type="radio" name="goal" id="g3" value="체력유지"><label for="g3">⚡ 체력 유지</label>
        </div>
      </div>
      <div class="field-group">
        <div class="field-label-row">
          <label class="field-label" style="margin-bottom:0">경험 수준</label>
          <button type="button" class="info-btn" id="expInfoBtn" onclick="toggleExpGuide()" title="경험 수준 기준 보기">?</button>
        </div>
        <div class="option-row">
          <input type="radio" name="experience" id="e1" value="초보" checked><label for="e1">🌱 초보</label>
          <input type="radio" name="experience" id="e2" value="중급"><label for="e2">🌿 중급</label>
          <input type="radio" name="experience" id="e3" value="고급"><label for="e3">🌳 고급</label>
        </div>
        <div class="exp-guide" id="expGuide">
          <div class="exp-row">
            <div class="exp-icon">🌱</div>
            <div class="exp-text">
              <div class="exp-name">초보 — 운동 경험 1년 미만</div>
              <div class="exp-desc">기본 자세를 익히는 단계. 가벼운 중량으로 정확한 동작을 배우며, 과도한 운동량보다 꾸준함이 중요합니다.</div>
            </div>
          </div>
          <div class="exp-row">
            <div class="exp-icon">🌿</div>
            <div class="exp-text">
              <div class="exp-name">중급 — 운동 경험 1~3년</div>
              <div class="exp-desc">주요 운동 동작을 숙지한 단계. 분할 루틴과 점진적 과부하를 적용할 수 있으며, 근비대·체력 향상이 본격적으로 시작됩니다.</div>
            </div>
          </div>
          <div class="exp-row">
            <div class="exp-icon">🌳</div>
            <div class="exp-text">
              <div class="exp-name">고급 — 운동 경험 3년 이상</div>
              <div class="exp-desc">고중량 훈련과 세밀한 분할이 가능한 단계. 보조 운동·변형 동작을 활용해 약점 부위를 집중적으로 발달시킵니다.</div>
            </div>
          </div>
        </div>
      </div>
      <div class="field-group">
        <label class="field-label">주당 운동 일수</label>
        <select name="days_per_week" id="daysSelect">
          <option value="2">주 2일</option><option value="3">주 3일</option>
          <option value="4" selected>주 4일</option><option value="5">주 5일</option>
          <option value="6">주 6일</option><option value="7">주 7일</option>
        </select>
      </div>
      <div class="field-group">
        <label class="field-label">집중 부위</label>
        <div class="option-row">
          <input type="radio" name="focus_area" id="f1" value="상체"><label for="f1">💪 상체</label>
          <input type="radio" name="focus_area" id="f2" value="하체"><label for="f2">🦵 하체</label>
          <input type="radio" name="focus_area" id="f3" value="전신" checked><label for="f3">⚡ 전신</label>
        </div>
      </div>
      <div class="field-group">
        <label class="field-label">신체 정보 <span style="font-weight:400;text-transform:none;letter-spacing:0;font-size:0.62rem;color:var(--sub)">(선택)</span></label>
        <div class="body-inputs">
          <div class="body-field">
            <input type="number" name="height" id="heightInput" placeholder="키" min="100" max="250" step="1">
            <span class="body-unit">cm</span>
          </div>
          <div class="body-field">
            <input type="number" name="weight" id="weightInput" placeholder="몸무게" min="30" max="300" step="0.1">
            <span class="body-unit">kg</span>
          </div>
        </div>
        <div class="bmi-bar" id="bmiBar">
          <span class="bmi-num" id="bmiNum"></span>
          <span class="bmi-cat" id="bmiCat"></span>
          <span class="bmi-msg" id="bmiMsg"></span>
        </div>
      </div>
      <div class="form-actions">
        <button type="submit" class="btn-primary" id="submitBtn">루틴 생성하기</button>
        <button type="button" class="btn-ghost"   id="demoBtn">데모 보기</button>
      </div>
      <div class="effect-preview" id="effectPreview">
        <div class="effect-label">이 루틴의 기대효과</div>
        <ul class="effect-list" id="effectList"></ul>
      </div>
      <div class="error-msg" id="errorBox"></div>
    </form>
  </div>

  <!-- 로딩 -->
  <div class="loading" id="loading">
    <div class="spinner"></div>
    <p style="font-size:0.85rem">AI가 루틴을 생성하고 있습니다...</p>
  </div>

  <!-- 결과 -->
  <div id="results"></div>
</div>

<script>
var EQUIP = {
  barbell:    { label: '바벨', svgId: 'svg-barbell', hint: '바벨 랙에서 원하는 중량을 설정하세요. 양쪽 플레이트를 동일하게 장착하고 클램프로 고정한 뒤 사용합니다.' },
  bench:      { label: '바벨 + 벤치', svgId: 'svg-bench', hint: '벤치에 등을 밀착하고 누운 뒤 바벨을 그립합니다. 흉근 하부를 향해 천천히 내렸다가 밀어 올리세요. 반드시 스팟터와 함께 고중량을 시도하세요.' },
  dumbbell:   { label: '덤벨', svgId: 'svg-dumbbell', hint: '덤벨 랙에서 적절한 무게를 선택하세요. 양손에 하나씩 잡고 동작을 수행합니다. 좌우 균형에 주의하세요.' },
  cable:      { label: '케이블 머신', svgId: 'svg-cable', hint: '풀리 높이와 중량핀 위치를 조절하세요. 케이블 장력을 느끼며 컨트롤된 속도로 움직이는 것이 핵심입니다.' },
  legpress:   { label: '레그프레스 머신', svgId: 'svg-legpress', hint: '시트에 앉아 등과 허리를 등받이에 완전히 밀착하세요. 발판 위치에 따라 자극 부위가 달라집니다. 무릎이 안쪽으로 모이지 않도록 주의하세요.' },
  machine:    { label: '웨이트 머신', svgId: 'svg-machine', hint: '시트와 패드 위치를 체형에 맞게 조절하세요. 중량 선택핀을 꽂아 무게를 설정합니다. 끝범위까지 완전히 수축·이완시키세요.' },
  bodyweight: { label: '맨몸 / 풀업바', svgId: 'svg-bodyweight', hint: '특별한 기구 없이 체중으로 수행합니다. 풀업바나 딥스바가 필요한 경우 헬스장 전용 기구를 이용하세요.' }
};

function getEquipKey(name) {
  if (name.indexOf('벤치프레스') !== -1 || name.indexOf('벤치 프레스') !== -1) return 'bench';
  if (name.indexOf('바벨') !== -1 || name.indexOf('데드리프트') !== -1 || name.indexOf('스쿼트') !== -1) return 'barbell';
  if (name.indexOf('덤벨') !== -1 || name.indexOf('해머컬') !== -1) return 'dumbbell';
  if (name.indexOf('케이블') !== -1 || name.indexOf('랫풀다운') !== -1 || name.indexOf('풀다운') !== -1 || name.indexOf('푸시다운') !== -1 || name.indexOf('페이스 풀') !== -1 || name.indexOf('시티드') !== -1) return 'cable';
  if (name.indexOf('레그프레스') !== -1 || name.indexOf('레그 프레스') !== -1) return 'legpress';
  if (name.indexOf('머신') !== -1 || name.indexOf('레그 익스텐션') !== -1 || name.indexOf('레그컬') !== -1 || name.indexOf('레그 컬') !== -1 || name.indexOf('카프') !== -1) return 'machine';
  if (name.indexOf('풀업') !== -1 || name.indexOf('딥스') !== -1 || name.indexOf('푸시업') !== -1 || name.indexOf('플랭크') !== -1 || name.indexOf('크런치') !== -1 || name.indexOf('런지') !== -1 || name.indexOf('버피') !== -1) return 'bodyweight';
  return 'barbell';
}

function calcDuration(exs) {
  return Math.ceil((600 + exs.reduce(function(t, e) { return t + e.sets * e.reps * 3 + e.sets * e.rest_seconds + 90; }, 0) + 300) / 60);
}

var EFFECTS = {
  '벌크업_상체':   ['가슴·어깨·팔 집중 근육량 증가', '상체 근력 향상으로 데일리 퍼포먼스 개선', '4~8주 내 티셔츠 핏 변화 체감 가능'],
  '벌크업_하체':   ['대퇴사두·햄스트링·둔근 집중 발달', '기초대사량 증가로 체지방 관리에 유리', '스쿼트·데드리프트 퍼포먼스 지속 향상'],
  '벌크업_전신':   ['전신 균형 근육량 증가', '복합 운동 중심으로 근성장 호르몬 분비 극대화', '기능적 근력 향상으로 일상 활동 능력 개선'],
  '다이어트_상체': ['상체 근육 유지하며 체지방 감소', '팔·어깨·가슴 라인이 선명해짐', '기초대사량 유지로 요요 현상 방지'],
  '다이어트_하체': ['대근육 활용한 높은 칼로리 소모', '허벅지·엉덩이 라인 개선', '심폐기능 향상 및 혈액순환 촉진'],
  '다이어트_전신': ['전신 운동으로 최대 칼로리 소모', '체지방 감소 + 근육량 유지 동시 달성', '신진대사 향상으로 장기적 체중 관리 용이'],
  '체력유지_상체': ['현재 상체 근력 수준 안정적 유지', '어깨·등 근육 강화로 자세 개선', '부상 예방 및 관절 건강 보호'],
  '체력유지_하체': ['하체 근력 유지로 무릎·허리 건강 관리', '하체 순환 개선 및 피로 회복 촉진', '균형감각 및 안정성 향상'],
  '체력유지_전신': ['전신 근력·심폐지구력 균형 유지', '일상생활 활력 및 컨디션 향상', '스트레스 해소 및 수면 질 개선'],
};

function updateBMI() {
  var h = parseFloat(document.getElementById('heightInput').value);
  var w = parseFloat(document.getElementById('weightInput').value);
  var bar = document.getElementById('bmiBar');
  if (!h || !w || h < 100 || w < 20) { bar.classList.remove('show'); return; }
  var bmi = w / ((h / 100) * (h / 100));
  var cat, color, bg, msg;
  if (bmi < 18.5) {
    cat = '저체중'; color = '#64b5f6'; bg = 'rgba(100,181,246,0.12)';
    msg = '체중 증가와 근육 발달에 집중하는 루틴을 추천합니다';
  } else if (bmi < 25) {
    cat = '정상 체중'; color = '#66bb6a'; bg = 'rgba(102,187,106,0.12)';
    msg = '현재 체형을 유지하며 목표에 맞게 발전할 수 있습니다';
  } else if (bmi < 30) {
    cat = '과체중'; color = '#ffa726'; bg = 'rgba(255,167,38,0.12)';
    msg = '유산소 병행 + 근력 운동으로 체지방 감소를 권장합니다';
  } else {
    cat = '비만'; color = '#e8484a'; bg = 'rgba(232,72,74,0.12)';
    msg = '저강도에서 시작해 점진적으로 강도를 높이는 것이 중요합니다';
  }
  document.getElementById('bmiNum').textContent = bmi.toFixed(1);
  document.getElementById('bmiNum').style.color = color;
  var catEl = document.getElementById('bmiCat');
  catEl.textContent = cat;
  catEl.style.color = color;
  catEl.style.background = bg;
  document.getElementById('bmiMsg').textContent = msg;
  bar.classList.add('show');
}

function toggleExpGuide() {
  var guide = document.getElementById('expGuide');
  var btn   = document.getElementById('expInfoBtn');
  var isOpen = guide.classList.toggle('open');
  btn.classList.toggle('active', isOpen);
}

function updateEffect() {
  var g = document.querySelector('input[name="goal"]:checked');
  var f = document.querySelector('input[name="focus_area"]:checked');
  if (!g || !f) return;
  var effects = EFFECTS[g.value + '_' + f.value];
  if (!effects) return;
  document.getElementById('effectList').innerHTML = effects.map(function(e) { return '<li>' + e + '</li>'; }).join('');
  document.getElementById('effectPreview').style.display = 'block';
}

function escAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function openModal(name, key, sets, reps, rest) {
  var info = EQUIP[key] || EQUIP['barbell'];
  var el = document.getElementById(info.svgId);
  document.getElementById('modal-illust').innerHTML = el ? el.outerHTML : '';
  document.getElementById('modal-name').textContent  = name;
  document.getElementById('modal-equip').textContent = '사용 기구: ' + info.label;
  document.getElementById('modal-stats').innerHTML =
    '<div class="modal-stat-box"><strong>' + sets + '</strong><span>세트</span></div>' +
    '<div class="modal-stat-box"><strong>' + reps + '</strong><span>반복</span></div>' +
    '<div class="modal-stat-box"><strong>' + rest + 's</strong><span>휴식</span></div>';
  document.getElementById('modal-hint').textContent = info.hint;
  document.getElementById('modal').classList.add('open');
}

document.addEventListener('click', function(e) {
  var card = e.target.closest('.ex-card');
  if (card) {
    openModal(card.dataset.name, card.dataset.key, +card.dataset.sets, +card.dataset.reps, +card.dataset.rest);
  }
});

function closeModal(e) {
  if (e.target === document.getElementById('modal')) document.getElementById('modal').classList.remove('open');
}

function switchDay(idx) {
  document.querySelectorAll('.day-tab').forEach(function(t, i) { t.classList.toggle('active', i === idx); });
  document.querySelectorAll('.day-panel').forEach(function(p, i) { p.classList.toggle('active', i === idx); });
}

function buildHTML(routine, savedId, isDemo) {
  var tabs = routine.days.map(function(d, i) {
    return '<button class="day-tab' + (i === 0 ? ' active' : '') + '" onclick="switchDay(' + i + ')">' + d.day_name + '</button>';
  }).join('');

  var panels = routine.days.map(function(day, i) {
    var dur  = calcDuration(day.exercises);
    var sets = day.exercises.reduce(function(t, e) { return t + e.sets; }, 0);

    var cards = day.exercises.map(function(ex) {
      var key  = getEquipKey(ex.name);
      var info = EQUIP[key];
      var el   = document.getElementById(info.svgId);
      var svg  = el ? el.outerHTML : '';
      return '<div class="ex-card" data-name="' + escAttr(ex.name) + '" data-key="' + key + '" data-sets="' + ex.sets + '" data-reps="' + ex.reps + '" data-rest="' + ex.rest_seconds + '">'
        + '<div class="ex-illust">' + svg + '<div class="ex-illust-lbl">' + info.label + '</div></div>'
        + '<div class="ex-info">'
        +   '<div class="ex-name">' + ex.name + '</div>'
        +   '<div class="ex-muscle-badge">' + (ex.target_muscle || '') + '</div>'
        +   '<div class="ex-params">'
        +     '<div class="param-block"><div class="param-val">' + ex.sets + '</div><div class="param-lbl">세트</div></div>'
        +     '<div class="param-sep">&times;</div>'
        +     '<div class="param-block"><div class="param-val">' + ex.reps + '</div><div class="param-lbl">반복</div></div>'
        +   '</div>'
        + '</div>'
        + '<div class="ex-rest"><div class="ex-rest-val">' + ex.rest_seconds + 's</div><div class="ex-rest-lbl">휴식</div></div>'
        + '</div>';
    }).join('');

    return '<div class="day-panel' + (i === 0 ? ' active' : '') + '" id="panel-' + i + '">'
      + '<div class="day-infobar">'
      +   '<div class="day-title-group"><div class="day-name">' + day.day_name + '</div><div class="day-focus">' + (day.focus || '') + '</div></div>'
      +   '<div class="day-stats">'
      +     '<div class="day-stat"><div class="day-stat-val">' + dur + '</div><div class="day-stat-lbl">분 예상</div></div>'
      +     '<div class="day-stat"><div class="day-stat-val">' + day.exercises.length + '</div><div class="day-stat-lbl">종목</div></div>'
      +     '<div class="day-stat"><div class="day-stat-val">' + sets + '</div><div class="day-stat-lbl">총 세트</div></div>'
      +   '</div>'
      + '</div>'
      + '<div class="ex-list">' + cards + '</div>'
      + '</div>';
  }).join('');

  var demoBadge = isDemo ? '<span class="demo-chip">DEMO</span>' : '';
  var saveBadge = isDemo ? '' : '<span class="save-chip">저장 ID: ' + savedId + '</span>';

  return '<div class="routine-header"><span class="split-chip">● ' + routine.split_type + '</span>' + demoBadge + saveBadge + '</div>'
    + '<div class="day-tabs">' + tabs + '</div>'
    + panels
    + '<p style="margin-top:1.5rem;font-size:0.72rem;color:var(--sub);text-align:center">운동 카드를 클릭하면 기구 사용 안내를 볼 수 있습니다</p>';
}

async function callAPI(url, body) {
  var btn     = document.getElementById('submitBtn');
  var demoBtn = document.getElementById('demoBtn');
  var loading = document.getElementById('loading');
  var results = document.getElementById('results');
  var errorBox = document.getElementById('errorBox');
  btn.disabled = true; demoBtn.disabled = true;
  loading.style.display = 'block'; results.style.display = 'none'; errorBox.style.display = 'none';
  try {
    var res  = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    var data = await res.json();
    if (!data.success) throw new Error(data.error);
    results.innerHTML = buildHTML(data.routine, data.savedId, data.isDemo);
    results.style.display = 'block';
    results.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) {
    errorBox.textContent = '오류: ' + err.message;
    errorBox.style.display = 'block';
  } finally {
    btn.disabled = false; demoBtn.disabled = false; loading.style.display = 'none';
  }
}

document.querySelectorAll('input[type="radio"]').forEach(function(r) { r.addEventListener('change', updateEffect); });
document.getElementById('daysSelect').addEventListener('change', updateEffect);
document.getElementById('heightInput').addEventListener('input', updateBMI);
document.getElementById('weightInput').addEventListener('input', updateBMI);
updateEffect();

document.getElementById('form').addEventListener('submit', function(e) {
  e.preventDefault();
  var f = e.target;
  var body = {
    goal: f.goal.value,
    experience: f.experience.value,
    days_per_week: parseInt(f.days_per_week.value),
    focus_area: f.focus_area.value,
    height: f.height.value ? parseFloat(f.height.value) : undefined,
    weight: f.weight.value ? parseFloat(f.weight.value) : undefined,
  };
  callAPI('/generate', body);
});
document.getElementById('demoBtn').addEventListener('click', function() { callAPI('/demo', {}); });
</script>
</body>
</html>`;

app.get('/', (_req: Request, res: Response) => { res.send(PAGE_HTML); });

app.post('/generate', async (req: Request, res: Response) => {
  try {
    const userInput: UserInput = {
      goal: req.body.goal,
      experience: req.body.experience,
      days_per_week: parseInt(req.body.days_per_week, 10),
      focus_area: req.body.focus_area || '전신',
      height: req.body.height ? parseFloat(req.body.height) : undefined,
      weight: req.body.weight ? parseFloat(req.body.weight) : undefined,
    };
    const routine = await generateRoutine(userInput);
    const savedId = saveRoutine(userInput, routine);
    res.json({ success: true, routine, savedId, isDemo: false });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : '오류가 발생했습니다.' });
  }
});

app.post('/demo', (_req: Request, res: Response) => {
  res.json({ success: true, routine: MOCK_ROUTINE, savedId: 0, isDemo: true });
});

app.listen(PORT, () => { console.log(`\n  서버 실행 중: http://localhost:${PORT}\n`); });
