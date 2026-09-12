import Programs from "@/components/Programs";
import Navbar from "@/components/Navbar";
import exercisesData from "@/data/exercises.json";
import { PRESET_WORKOUTS } from "@/data/presetWorkouts";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

interface LocalExerciseAsset {
  id: string;
  name: string;
  category?: string;
  body_part?: string;
  equipment?: string;
  instructions?: { en?: string };
  image?: string;
}

const findLocalExerciseImage = (id: string, name: string) => {
  const normalizedName = name.trim().toLowerCase();
  const asset = (exercisesData as LocalExerciseAsset[]).find(
    (exercise) =>
      exercise.id === id ||
      exercise.name.trim().toLowerCase() === normalizedName,
  );

  return asset?.image ? `/${asset.image}` : null;
};

const getFallbackExercises = (category: string, count: number) => {
  const categoryKey = category.toLowerCase();
  const assets = (exercisesData as LocalExerciseAsset[]).filter((exercise) => {
    const exerciseCategory = (
      exercise.body_part ||
      exercise.category ||
      ""
    ).toLowerCase();
    return exerciseCategory.includes(categoryKey);
  });

  return assets.slice(0, count).map((exercise) => ({
    id: exercise.id,
    name: exercise.name,
    category: exercise.body_part || exercise.category || category,
    sets: 4,
    reps: 10,
    restSec: 60,
    image: findLocalExerciseImage(exercise.id, exercise.name),
  }));
};

export default async function ProgramsPage() {
  // Chỉ hiển thị danh sách preset đã định nghĩa sẵn trong app.
  // Không tải các routine từ DB vào landing page này để tránh lẫn dữ liệu/UX.
  const fallbackWorkouts = PRESET_WORKOUTS.map((workout) => ({
    id: workout.id,
    title: workout.title,
    description: workout.description,
    badge: workout.badge,
    category: workout.category,
    exerciseCount: workout.exerciseCount,
    duration: workout.duration,
    exercises: getFallbackExercises(
      workout.category === "Biceps" ? "upper arms" : workout.category,
      workout.exerciseCount,
    ),
  }));

  const initialWorkouts = fallbackWorkouts;

  return (
    <main className="min-h-screen bg-black text-white antialiased pt-20">
      <Navbar />
      <Suspense fallback={<div>Loading...</div>}>
        <Programs initialWorkouts={initialWorkouts} />
      </Suspense>
    </main>
  );
}
