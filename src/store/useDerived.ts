'use client';

/**
 * ВЛАДЕЛЕЦ: зона C. Производные данные маршрута.
 *
 * Правило 4 из CLAUDE.md: рекомендации, диагностика и план НЕ хранятся в сторе.
 * Они пересчитываются здесь из профиля на каждом рендере — поэтому правка
 * любого ответа в анкете мгновенно меняет всё, что ниже по пути.
 */
import { useMemo } from 'react';
import { PROGRAMS } from '@/data';
import { buildRoadmap, diagnose, nextStep, recommend } from '@/engine';
import type { Diagnosis, Profile, Recommendation, RoadmapStep } from '@/types';
import { useJourney } from './useJourney';

/**
 * Дата берётся один раз за загрузку страницы. Движок чистый и получает её
 * аргументом; если бы мы звали new Date() внутри useMemo, план пересобирался
 * бы на каждый рендер.
 */
const TODAY = new Date();

export interface JourneyView {
  hydrated: boolean;
  profile: Profile | null;
  recommendations: Recommendation[];
  diagnosis: Diagnosis | null;
  /** Программы, отправленные в сравнение, в порядке рекомендаций. */
  compared: Recommendation[];
  steps: RoadmapStep[];
  nextStep: RoadmapStep | null;
  completedStepIds: string[];
  doneCount: number;
}

const EMPTY: Omit<JourneyView, 'hydrated' | 'completedStepIds'> = {
  profile: null,
  recommendations: [],
  diagnosis: null,
  compared: [],
  steps: [],
  nextStep: null,
  doneCount: 0,
};

export function useJourneyView(): JourneyView {
  const hydrated = useJourney((state) => state.hydrated);
  const profile = useJourney((state) => state.profile);
  const comparedIds = useJourney((state) => state.comparedIds);
  const completedStepIds = useJourney((state) => state.completedStepIds);

  return useMemo<JourneyView>(() => {
    if (!profile) return { ...EMPTY, hydrated, completedStepIds };

    const recommendations = recommend(profile, PROGRAMS);
    const chosen = new Set(comparedIds);
    const compared = recommendations.filter((rec) => chosen.has(rec.program.id));

    // План строим вокруг выбранных программ, если выбор есть: человек уже
    // сказал, что его интересует, и навязывать ему остальные шаги незачем.
    const focus = compared.length > 0 ? compared : recommendations;
    const steps = buildRoadmap(profile, focus, TODAY);
    const done = new Set(completedStepIds);

    return {
      hydrated,
      profile,
      recommendations,
      diagnosis: diagnose(profile),
      compared,
      steps,
      nextStep: nextStep(steps, completedStepIds),
      completedStepIds,
      doneCount: steps.filter((step) => done.has(step.id)).length,
    };
  }, [hydrated, profile, comparedIds, completedStepIds]);
}
