import { create } from "zustand";

interface Day0State {
  environment: string | null;
  envInfo: any | null;
  results: any | null;

  setEnvironment: (env: string | null) => void;
  setEnvInfo: (info: any | null) => void;
  setResults: (data: any | null) => void;
}

export const useDay0Store = create<Day0State>((set) => ({
  environment: null,
  envInfo: null,
  results: null,

  setEnvironment: (env) => set({ environment: env }),
  setEnvInfo: (info) => set({ envInfo: info }),
  setResults: (data) => set({ results: data }),
}));
