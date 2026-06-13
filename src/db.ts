import fs from 'fs';
import path from 'path';
import { WorkoutRoutine, UserInput } from './types';

interface RoutineRecord {
  id: number;
  goal: string;
  experience: string;
  days_per_week: number;
  split_type: string;
  routine: WorkoutRoutine;
  created_at: string;
}

interface DbData {
  routines: RoutineRecord[];
  next_id: number;
}

const DB_PATH = path.join(process.cwd(), 'routines.json');

function loadDb(): DbData {
  if (fs.existsSync(DB_PATH)) {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')) as DbData;
  }
  return { routines: [], next_id: 1 };
}

export function saveRoutine(userInput: UserInput, routine: WorkoutRoutine): number {
  const data = loadDb();
  const id = data.next_id;

  data.routines.push({
    id,
    goal: userInput.goal,
    experience: userInput.experience,
    days_per_week: userInput.days_per_week,
    split_type: routine.split_type,
    routine,
    created_at: new Date().toISOString(),
  });

  data.next_id++;
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');

  return id;
}
