export const exerciseTranslations: Record<string, string> = {
  "3/4 sit-up": "Gập bụng 3/4",
  "barbell bench press": "Đẩy tạ ngực",
  "barbell deadlift": "Kéo tạ gấp",
  "barbell row": "Kéo tạ hàng",
  "barbell squat": "Squat tạ",
  "bent-over row": "Kéo hàng gập người",
  "bench press": "Đẩy ngực",
  "biceps curl": "Gập tay trước",
  "dumbbell curl": "Gập tay tạ đơn",
  "jumping jacks": "Nhảy jack",
  "lat pulldown": "Kéo xà xuống",
  "leg raise": "Nâng chân",
  plank: "Plank",
  "push-up": "Hít đất",
  "shoulder press": "Đẩy vai",
  squat: "Squat",
  "tricep dip": "Dips ba đầu tay",
  "triceps pushdown": "Kéo dây ba đầu tay",
  "walking lunge": "Lunge đi bộ",
  "overhead press": "Đẩy vai trên đầu",
};

export const exerciseInstructionTranslations: Record<string, string> = {
  "45° side bend":
    "Đứng hai chân rộng bằng vai, hai tay duỗi thẳng sang hai bên. Gập người sang phải, đưa tay phải về phía bàn chân phải trong khi vẫn giữ tay trái duỗi sang bên. Trở về tư thế ban đầu, sau đó gập người sang trái và đưa tay trái về phía bàn chân trái trong khi giữ tay phải duỗi sang bên. Lặp lại động tác gập người luân phiên hai bên theo số lần mong muốn.",
};

export const translateExerciseName = (name?: string) => {
  if (!name) return "Bài tập";
  const normalized = name.trim().toLowerCase();
  return exerciseTranslations[normalized] || name;
};

export const formatExerciseName = (name?: string) => {
  const translated = translateExerciseName(name);
  return translated
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const translateExerciseInstructions = (
  name?: string,
  instructions?: string,
) => {
  if (!instructions) return "Chưa có hướng dẫn cho bài tập này.";
  const normalized = name?.trim().toLowerCase();
  return (
    (normalized && exerciseInstructionTranslations[normalized]) || instructions
  );
};
