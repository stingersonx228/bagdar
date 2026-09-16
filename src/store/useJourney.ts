/**
 * ВЛАДЕЛЕЦ: зона C. Состояние маршрута.
 *
 * Правило 4 из CLAUDE.md: здесь лежат ТОЛЬКО профиль, выбор пользователя и
 * выполненные шаги. Рекомендации и roadmap не хранятся — они вычисляются из
 * профиля движком (derived) на каждом рендере.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Profile } from '@/types';

export const JOURNEY_STORAGE_KEY = 'bagdar-journey';
export const JOURNEY_STORAGE_VERSION = 1;

interface JourneyData {
  profile: Profile | null;
  /** Программы, отмеченные пользователем на экране рекомендаций. */
  selectedProgramIds: string[];
  /** Программы, отправленные в сравнение (нужно ≥2). */
  comparedIds: string[];
  /** Выполненные шаги маршрута, id из RoadmapStep.id. */
  completedStepIds: string[];
}

interface JourneyState extends JourneyData {
  /** false до окончания регидратации — экраны ждут его, чтобы не ловить SSR mismatch. */
  hydrated: boolean;
  setHydrated: (value: boolean) => void;
  setProfile: (profile: Profile) => void;
  patchProfile: (patch: Partial<Profile>) => void;
  toggleSelected: (programId: string) => void;
  toggleCompared: (programId: string) => void;
  toggleStep: (stepId: string) => void;
  reset: () => void;
}

const EMPTY: JourneyData = {
  profile: null,
  selectedProgramIds: [],
  comparedIds: [],
  completedStepIds: [],
};

function toggle(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

export const useJourney = create<JourneyState>()(
  persist(
    (set) => ({
      ...EMPTY,
      hydrated: false,
      setHydrated: (value) => set({ hydrated: value }),
      setProfile: (profile) => set({ profile }),
      patchProfile: (patch) =>
        set((state) => (state.profile ? { profile: { ...state.profile, ...patch } } : state)),
      toggleSelected: (programId) =>
        set((state) => ({ selectedProgramIds: toggle(state.selectedProgramIds, programId) })),
      toggleCompared: (programId) =>
        set((state) => ({ comparedIds: toggle(state.comparedIds, programId) })),
      toggleStep: (stepId) =>
        set((state) => ({ completedStepIds: toggle(state.completedStepIds, stepId) })),
      reset: () => set({ ...EMPTY }),
    }),
    {
      name: JOURNEY_STORAGE_KEY,
      version: JOURNEY_STORAGE_VERSION,
      // hydrated — рантайм-флаг, в localStorage ему делать нечего.
      partialize: (state): JourneyData => ({
        profile: state.profile,
        selectedProgramIds: state.selectedProgramIds,
        comparedIds: state.comparedIds,
        completedStepIds: state.completedStepIds,
      }),
      // Данные старых версий не доверяем: начинаем с чистого состояния,
      // чтобы в стор не попал профиль, не соответствующий текущим типам.
      migrate: (persisted, version): JourneyData => {
        if (version === JOURNEY_STORAGE_VERSION) return persisted as JourneyData;
        return { ...EMPTY };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
