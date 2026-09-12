export interface Program {
  id: string;
  category: "strength" | "cardio" | "flexibility";
  title: string;
  description: string;
  level: string;
  duration: string;
  calories: string;
  badgeColor: string;
}
