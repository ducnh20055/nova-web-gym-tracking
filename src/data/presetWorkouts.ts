export interface PresetWorkout {
  id: string;
  title: string;
  description: string;
  category: "Chest" | "Back" | "Legs" | "Shoulders" | "Biceps" | "Abs";
  badge: string;
  duration: string;
  exerciseCount: number;
}

export const PRESET_WORKOUTS: PresetWorkout[] = [
  {
    id: "chest-triceps-basic",
    title: "Ngực & Tay Sau Cơ Bản",
    description:
      "Tập trung tối đa vào cơ ngực lớn, ngực trên và đẩy cơ tay sau.",
    category: "Chest",
    badge: "Chest & Triceps",
    duration: "45 phút",
    exerciseCount: 4,
  },
  {
    id: "back-biceps-pull",
    title: "Lưng Xô & Tay Trước",
    description:
      "Tối ưu độ rộng lưng xô, kéo xà và phát triển đỉnh cơ tay trước.",
    category: "Back",
    badge: "Back & Biceps",
    duration: "50 phút",
    exerciseCount: 5,
  },
  {
    id: "legs-quads-glutes",
    title: "Chân & Mông Toàn Diện",
    description: "Tăng cường sức mạnh đùi trước, cơ đùi sau và nhóm cơ mông.",
    category: "Legs",
    badge: "Legs & Lower Body",
    duration: "60 phút",
    exerciseCount: 5,
  },
  {
    id: "shoulders-boulders",
    title: "Vai Đôi Guốc (Shoulders)",
    description:
      "Phát triển toàn diện 3 đầu cơ vai (vai trước, vai giữa và vai sau).",
    category: "Shoulders",
    badge: "Shoulders Focus",
    duration: "40 phút",
    exerciseCount: 4,
  },
  {
    id: "biceps-isolation",
    title: "Chuyên Sâu Tay Trước",
    description:
      "Các bài tập Isolation giúp bùng nổ kích thước và đường nét tay trước.",
    category: "Biceps",
    badge: "Biceps Blast",
    duration: "35 phút",
    exerciseCount: 4,
  },
  {
    id: "abs-core-shred",
    title: "Cơ Bụng & Core Sáu Múi",
    description:
      "Tập trung gập bụng, siết cơ lõi giúp làm rõ nét múi bụng và eo.",
    category: "Abs",
    badge: "Abs & Core",
    duration: "25 phút",
    exerciseCount: 4,
  },
];
