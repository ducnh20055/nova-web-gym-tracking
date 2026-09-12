import { notFound } from "next/navigation";
import CustomWorkoutSession from "@/components/workout/CustomWorkoutSession";
import { getOrCreateAppUser } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";
import exercisesData from "@/data/exercises.json";
import { DatasetExercise } from "@/types/exercise";

const exerciseAssets = exercisesData as DatasetExercise[];

const getExerciseAsset = (id: string, name: string): DatasetExercise => {
  const asset = exerciseAssets.find(
    (item) =>
      item.id === id ||
      item.name.trim().toLowerCase() === name.trim().toLowerCase(),
  );

  return (
    asset || {
      id,
      name,
      category: "custom",
      body_part: "custom",
      equipment: "unknown",
      target: "custom",
      muscle_group: "custom",
      secondary_muscles: [],
      instructions: { en: "Chưa có hướng dẫn cho bài tập này." },
      image: "",
      gif_url: "",
    }
  );
};

export default async function CustomProgramWorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getOrCreateAppUser();
  if (!user) notFound();

  const routine = await prisma.routine.findFirst({
    where: { id, isCustom: true, userId: user.id },
    include: {
      items: {
        include: { exercise: true },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!routine) notFound();

  const lastLog = await prisma.workoutLog.findFirst({
    where: { routineId: routine.id, userId: user.id },
    orderBy: { completedAt: "desc" },
    include: {
      logItems: {
        select: {
          exerciseId: true,
          setNumber: true,
          weightKg: true,
          repsDone: true,
        },
        orderBy: { setNumber: "asc" },
      },
    },
  });

  const items = routine.items.map((item) => ({
    routineId: item.id,
    exercise: getExerciseAsset(item.exercise.id, item.exercise.name),
    sets: item.sets,
    reps: item.reps,
    restSec: item.restSec,
  }));

  return (
    <CustomWorkoutSession
      routineId={routine.id}
      title={routine.title}
      items={items}
      lastSets={lastLog?.logItems || []}
      onExit="/routine"
    />
  );
}
