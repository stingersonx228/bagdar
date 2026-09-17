/** ВЛАДЕЛЕЦ: зона A. План подготовки и ближайший шаг. */
import { describe, expect, it } from 'vitest';
import { buildRoadmap, nextStep, recommend } from '@/engine';
import { PROGRAMS } from '@/data';
import { BASE_PROFILE, TODAY, profileOf, programWithDeadline } from './fixtures';

const ID_PATTERN = /^[a-z0-9-]+(:[a-z0-9-]+)*:(exam|document|deadline|academic|activity):.+$/;

function roadmapFor(profile = BASE_PROFILE) {
  return buildRoadmap(profile, recommend(profile, PROGRAMS), TODAY);
}

describe('buildRoadmap', () => {
  it('строит непустой план для заполненного профиля', () => {
    expect(roadmapFor().length).toBeGreaterThan(0);
  });

  it('детерминирован', () => {
    expect(roadmapFor()).toEqual(roadmapFor());
  });

  it('id шагов уникальны', () => {
    const steps = roadmapFor();
    expect(new Set(steps.map((step) => step.id)).size).toBe(steps.length);
  });

  it('id стабильного формата ${programId|global}:${type}:${key}', () => {
    for (const step of roadmapFor()) {
      expect(step.id).toMatch(ID_PATTERN);
      expect(step.id.split(':')).toContain(step.type);
    }
  });

  it('у каждого шага есть заголовок и объяснение', () => {
    for (const step of roadmapFor()) {
      expect(step.title.length).toBeGreaterThan(0);
      expect(step.why.length).toBeGreaterThan(0);
    }
  });

  it('пустые рекомендации дают пустой план, а не падение', () => {
    expect(buildRoadmap(BASE_PROFILE, [], TODAY)).toEqual([]);
  });

  it('несданный экзамен превращается в шаг', () => {
    const steps = roadmapFor(profileOf({ exams: [] }));
    const entStep = steps.find((step) => step.id === 'global:exam:ENT');

    expect(entStep).toBeDefined();
    expect(entStep!.type).toBe('exam');
    expect(entStep!.programIds.length).toBeGreaterThan(0);
  });

  it('сданный на нужный балл экзамен шага не создаёт', () => {
    const steps = roadmapFor(
      profileOf({
        interests: ['it'],
        countries: ['KZ'],
        exams: [{ id: 'ENT', score: 140, plannedDate: null }],
      }),
    );

    expect(steps.some((step) => step.id === 'global:exam:ENT')).toBe(false);
  });

  it('низкий балл экзамена даёт шаг на улучшение', () => {
    const steps = roadmapFor(
      profileOf({ exams: [{ id: 'ENT', score: 95, plannedDate: null }] }),
    );
    const entStep = steps.find((step) => step.id === 'global:exam:ENT');

    expect(entStep?.title).toContain('95');
  });

  it('низкий средний балл даёт академический шаг', () => {
    const steps = roadmapFor(profileOf({ gpa: 3.6 }));
    const academic = steps.find((step) => step.id === 'global:academic:gpa');

    expect(academic).toBeDefined();
    expect(academic!.type).toBe('academic');
  });

  it('достаточный средний балл академического шага не создаёт', () => {
    const steps = roadmapFor(profileOf({ gpa: 5 }));
    expect(steps.some((step) => step.id === 'global:academic:gpa')).toBe(false);
  });

  it('неизвестный дедлайн даёт шаг «уточнить» без даты, но со ссылкой', () => {
    const steps = roadmapFor();
    const unknown = steps.filter((step) => step.type === 'deadline' && step.dueDate === null);

    expect(unknown.length).toBeGreaterThan(0);
    for (const step of unknown) {
      expect(step.title).toContain('Уточнить');
      expect(step.sourceUrl).not.toBeNull();
    }
  });

  it('прошедший дедлайн в план не попадает', () => {
    const program = programWithDeadline('2020-01-01');
    const recs = recommend(BASE_PROFILE, [program]);

    const steps = buildRoadmap(BASE_PROFILE, recs, TODAY);
    expect(steps.some((step) => step.type === 'deadline')).toBe(false);
  });

  it('будущий дедлайн попадает в план с датой', () => {
    const program = programWithDeadline('2027-01-15');
    const recs = recommend(BASE_PROFILE, [program]);

    const deadline = buildRoadmap(BASE_PROFILE, recs, TODAY).find((step) => step.type === 'deadline');
    expect(deadline?.dueDate).toBe('2027-01-15');
  });

  it('шаги с датой идут раньше шагов без даты', () => {
    const program = programWithDeadline('2027-01-15');
    const steps = buildRoadmap(BASE_PROFILE, recommend(BASE_PROFILE, [program]), TODAY);

    const firstUndated = steps.findIndex((step) => step.dueDate === null);
    const lastDated = steps.map((step) => step.dueDate !== null).lastIndexOf(true);

    expect(lastDated).toBeLessThan(firstUndated);
  });

  it('зарубежные программы добавляют шаг с загранпаспортом', () => {
    const steps = roadmapFor(profileOf({ countries: ['CZ'] }));
    expect(steps.some((step) => step.id === 'global:document:passport')).toBe(true);
  });

  it('только казахстанские программы паспорт не требуют', () => {
    const steps = roadmapFor(profileOf({ countries: ['KZ'] }));
    expect(steps.some((step) => step.id === 'global:document:passport')).toBe(false);
  });

  it('10 класс добавляет шаг про год подготовки', () => {
    expect(roadmapFor(profileOf({ grade: 10 })).some((step) => step.type === 'activity')).toBe(true);
    expect(roadmapFor(profileOf({ grade: 11 })).some((step) => step.type === 'activity')).toBe(false);
  });

  it('в план не попадают программы мимо направления', () => {
    const profile = profileOf({ interests: ['it'], countries: ['KZ'] });
    const steps = roadmapFor(profile);

    const offTopicIds = recommend(profile, PROGRAMS)
      .filter((rec) => rec.reasons.some((item) => item.code === 'interest_none'))
      .map((rec) => rec.program.id);

    expect(offTopicIds.length).toBeGreaterThan(0);
    for (const step of steps) {
      for (const id of step.programIds) {
        expect(offTopicIds).not.toContain(id);
      }
    }
  });

  it('смена страны меняет план', () => {
    const kz = roadmapFor(profileOf({ countries: ['KZ'] })).map((step) => step.id);
    const cz = roadmapFor(profileOf({ countries: ['CZ'] })).map((step) => step.id);

    expect(kz).not.toEqual(cz);
  });
});

describe('nextStep', () => {
  it('возвращает первый невыполненный шаг', () => {
    const steps = roadmapFor();
    expect(nextStep(steps, [])).toEqual(steps[0]);
  });

  it('пропускает выполненные', () => {
    const steps = roadmapFor();
    expect(nextStep(steps, [steps[0].id])).toEqual(steps[1]);
  });

  it('возвращает null, когда всё выполнено', () => {
    const steps = roadmapFor();
    expect(nextStep(steps, steps.map((step) => step.id))).toBeNull();
  });

  it('на пустом плане возвращает null', () => {
    expect(nextStep([], [])).toBeNull();
  });

  it('не спотыкается о лишние id в выполненных', () => {
    const steps = roadmapFor();
    expect(nextStep(steps, ['какой-то:другой:шаг'])).toEqual(steps[0]);
  });
});
