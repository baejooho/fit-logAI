export interface Exercise {
  name: string;
  sets: number;
  reps: number;
  rest_seconds: number;
  target_muscle: string;
}

export interface Day {
  day_name: string;   // e.g. "월요일"
  focus: string;      // e.g. "가슴 / 어깨 / 삼두"
  exercises: Exercise[];
}

export interface WorkoutRoutine {
  split_type: string;
  days: Day[];
}

export interface UserInput {
  goal: string;
  experience: string;
  days_per_week: number;
  focus_area: string;
  height?: number;
  weight?: number;
}
