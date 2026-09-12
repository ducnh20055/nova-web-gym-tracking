import { DatasetExercise } from "./exercise";

export interface RoutineExerciseItem {
  routineId: string;
  exercise: DatasetExercise;
  sets: number;
  reps: number;
  restSec: number;
}

export interface SavedRoutine {
  id: string;
  title: string;
  createdAt: string;
  items: RoutineExerciseItem[];
}
