"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { WorkoutItem } from "@/components/workout/PresetWorkouts";

interface WorkoutContextType {
  activeWorkout: WorkoutItem | null;
  setActiveWorkout: (workout: WorkoutItem | null) => void;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export const WorkoutProvider = ({ children }: { children: ReactNode }) => {
  const [activeWorkout, setActiveWorkout] = useState<WorkoutItem | null>(null);

  return (
    <WorkoutContext.Provider value={{ activeWorkout, setActiveWorkout }}>
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkoutContext = () => {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error("useWorkoutContext must be used within a WorkoutProvider");
  }
  return context;
};
