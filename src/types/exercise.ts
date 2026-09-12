export interface Exercise {
  id: string;
  name: string;
  primaryMuscles: string[];
  equipment: string;
  images: string[];
  instructions?: string[];
}

export interface WorkoutRoutine {
  id: string;
  title: string;
  targetMuscle: string;
  duration: string;
  exercises: Exercise[];
}

export interface DatasetExercise {
  id: string;
  name: string;
  category: string; // Body part category (e.g. "chest", "upper arms")
  body_part: string;
  equipment: string;
  target: string; // Cơ tác động chính (e.g. "biceps", "abs")
  muscle_group: string;
  secondary_muscles: string[];
  instructions: {
    en: string;
    es?: string;
  };
  image: string; // Path: "images/0001-2gPfomN.jpg"
  gif_url: string; // Path: "videos/0001-2gPfomN.gif"
}