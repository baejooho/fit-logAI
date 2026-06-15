import fs from 'fs';
import path from 'path';
import { WorkoutRoutine, UserInput } from './types';

interface RoutineRecord {
  id: number;
  name: string;
  goal: string;
  experience: string;
  days_per_week: number;
  focus_area: string;
  split_type: string;
  routine: WorkoutRoutine;
  created_at: string;
  weights?: Record<string, number>;
  height?: number;
  body_weight?: number;
  extra_request?: string;
}

interface DbData {
  routines: RoutineRecord[];
  next_id: number;
}

const DB_PATH = process.env.DB_PATH ?? path.join(process.cwd(), 'routines.json');

function loadDb(): DbData {
  if (fs.existsSync(DB_PATH)) {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')) as DbData;
  }
  return { routines: [], next_id: 1 };
}

export function saveRoutine(userInput: UserInput, routine: WorkoutRoutine, name?: string): number {
  const data = loadDb();
  const id = data.next_id;

  data.routines.push({
    id,
    name: name || `${userInput.goal} ${routine.split_type}`,
    goal: userInput.goal,
    experience: userInput.experience,
    days_per_week: userInput.days_per_week,
    focus_area: userInput.focus_area || '전신',
    split_type: routine.split_type,
    routine,
    created_at: new Date().toISOString(),
    height: userInput.height,
    body_weight: userInput.weight,
    extra_request: userInput.extra_request,
  });

  data.next_id++;
  if (data.routines.length > 20) data.routines = data.routines.slice(-20);
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  return id;
}

export function getRoutines(): RoutineRecord[] {
  const data = loadDb();
  return [...data.routines].reverse();
}

export function getRoutine(id: number): RoutineRecord | null {
  const data = loadDb();
  return data.routines.find(r => r.id === id) ?? null;
}

export function deleteRoutine(id: number): boolean {
  const data = loadDb();
  const idx = data.routines.findIndex(r => r.id === id);
  if (idx === -1) return false;
  data.routines.splice(idx, 1);
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  return true;
}

export function updateRoutineWeights(id: number, weights: Record<string, number>): boolean {
  const data = loadDb();
  const record = data.routines.find(r => r.id === id);
  if (!record) return false;
  record.weights = { ...(record.weights ?? {}), ...weights };
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  return true;
}

export function updateRoutineName(id: number, name: string): boolean {
  const data = loadDb();
  const record = data.routines.find(r => r.id === id);
  if (!record) return false;
  record.name = name;
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  return true;
}
