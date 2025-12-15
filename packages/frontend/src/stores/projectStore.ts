// src/stores/projectStore.ts
import { create } from "zustand";

interface ProjectState {
  currentProjectId: number | null;
  setCurrentProjectId: (projectId: number | null) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  currentProjectId: null,
  setCurrentProjectId: (projectId) => set({ currentProjectId: projectId }),
}));
