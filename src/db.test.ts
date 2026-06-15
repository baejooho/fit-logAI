import os from 'os';
import path from 'path';
import fs from 'fs';

const tmpDb = path.join(os.tmpdir(), `fit-test-${Date.now()}.json`);

describe('db', () => {
  let saveRoutine: (typeof import('./db'))['saveRoutine'];
  let getRoutine: (typeof import('./db'))['getRoutine'];

  beforeAll(() => {
    process.env.DB_PATH = tmpDb;
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const db = require('./db') as typeof import('./db');
    saveRoutine = db.saveRoutine;
    getRoutine = db.getRoutine;
  });

  afterAll(() => {
    delete process.env.DB_PATH;
    if (fs.existsSync(tmpDb)) fs.unlinkSync(tmpDb);
  });

  it('저장한 루틴을 동일하게 다시 조회할 수 있다', () => {
    const userInput = {
      goal: '근력 향상',
      experience: '중급',
      days_per_week: 3,
      focus_area: '전신',
    };
    const routine = {
      split_type: '무분할',
      days: [
        {
          day_name: '월요일',
          focus: '전신',
          exercises: [
            { name: '스쿼트', sets: 3, reps: 10, rest_seconds: 90, target_muscle: '하체' },
          ],
        },
      ],
    };

    const id = saveRoutine(userInput, routine, '테스트 루틴');
    const record = getRoutine(id);

    expect(record).not.toBeNull();
    expect(record!.id).toBe(id);
    expect(record!.name).toBe('테스트 루틴');
    expect(record!.goal).toBe('근력 향상');
    expect(record!.routine.split_type).toBe('무분할');
    expect(record!.routine.days[0].exercises[0].name).toBe('스쿼트');
  });
});
