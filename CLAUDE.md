# Бағдар — персональный маршрут поступления

LOCUS Startup Hackathon 2026, Кейс 02. Дедлайн: 19.09.2026 12:00 (Астана). Код сабмита: LOCUSCASE2.
Рабочее название «Бағдар» (каз. «ориентир»). Можно сменить, но нельзя копировать LOCUS или другую платформу.

## Продукт
Путь: Вход → Анкета → Диагностика → Рекомендации (≥3) → Сравнение (≥2) → Roadmap → Следующий шаг + прогресс.
Аудитория: ученики 10–11 класса из Казахстана, бакалавриат. Казахстанские вузы (ЕНТ, грант) + несколько зарубежных направлений.
Концепция: маршрут поступления = линия метро. Этапы — станции, пользователь всегда видит «вы здесь», пройденные и следующие станции. Эта метафора проходит через навигацию, прогресс и roadmap.

## Оценка (что реально приносит баллы)
Путь и архитектура 30 · UX/UI и дизайн-система 25 · Персонализация 20 · Стабильность 15 · Техника 10.
Жюри меняет бюджет, страну, интерес или экзамен, и результат ОБЯЗАН заметно измениться.

## Стек (не менять)
Next.js App Router + TypeScript strict, Tailwind, Zustand + persist (localStorage), Vitest, Playwright, Vercel.
Без Supabase и без авторизации. Никаких лишних зависимостей: каждая новая библиотека обосновывается в README.

## Железные правила
1. LLM НИКОГДА не выбирает вузы, не придумывает требования и дедлайны. Выбор делает детерминированный движок в `src/engine`. LLM только переформулирует готовые `reasons[]`.
2. Каждый факт (стоимость, требования, дедлайн) имеет `sourceUrl` + `checkedAt`. Поле без подтверждённого источника перечислено в `unverified`, и UI показывает бейдж «демо-данные» точечно на этом поле. Неизвестный дедлайн = `null` и в UI «уточнить на сайте», а не выдуманная дата. Если источник даёт цену в другой единице (вузы КЗ считают в кредитах ECTS), годовая сумма — пересчёт, и он обязан быть подписан в `tuitionNote`.
3. Никаких процентов шансов и гарантий. Только `high | medium | low` + объяснение.
4. Рекомендации и roadmap не хранятся в store. Они вычисляются из профиля (derived). В store лежат только профиль, выбор пользователя и выполненные шаги.
5. Секреты только в `.env.local`. В репо лежит `.env.example`. Ключ API используется только в server route.
6. Никаких TODO, заглушек и `any`. Обрабатывать пустые, загрузочные и ошибочные состояния.
7. Mobile-first: каждый экран проверяется на ширине 375px.
8. Маленькие осмысленные коммиты (conventional commits). Историю Git проверяют.
9. Не лезть в чужую зону (см. ниже). Нужно изменить контракт → остановись и скажи человеку.

## Зоны ответственности
- A (данные + движок): `src/data`, `src/engine`, `src/engine/__tests__`
- B (дизайн + экраны пути): `src/styles`, `src/components/ui`, `src/app/(flow)/start`, `profile`, `diagnosis`
- C (результат + состояние + AI): `src/app/(flow)/results`, `compare`, `roadmap`, `src/store`, `src/app/api`, `README.md`
- Общие контракты (правит только лид): `src/types/index.ts`, `src/lib/flow.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/(flow)/layout.tsx`, конфиги в корне, `e2e/`

## Контракты — `src/types/index.ts`
```ts
export type Country = 'KZ' | 'KR' | 'TR' | 'CZ' | 'HU' | 'MY';
export type Interest = 'it' | 'engineering' | 'business' | 'medicine' | 'design' | 'science' | 'humanities' | 'law';
export type ExamId = 'ENT' | 'IELTS' | 'TOEFL' | 'SAT' | 'NUET' | 'TOPIK' | 'YOS';
export type Level = 'high' | 'medium' | 'low';

export interface ExamScore { id: ExamId; score: number | null; plannedDate: string | null }
export interface Profile {
  grade: 10 | 11;
  interests: Interest[];          // 1..3, порядок = приоритет
  gpa: number;                     // 2..5
  languages: { kz: boolean; ru: boolean; en: 'none' | 'basic' | 'b1' | 'b2' | 'c1' };
  exams: ExamScore[];
  countries: Country[];            // ≥1
  preferredCities: string[];       // мягкое предпочтение, не фильтр; работает через приоритет 'city'
  budgetKztPerYear: number;        // 0 = только грант
  needsGrant: boolean;
  priorities: Array<'cost' | 'prestige' | 'city' | 'career' | 'language'>;
}

export interface Deadline { id: string; label: string; date: string | null; sourceUrl: string | null }
export type VerifiableField =
  | 'tuitionKztPerYear' | 'grantAvailable' | 'requirements' | 'minGpa' | 'deadlines';

export interface Program {
  id: string; university: string; program: string; country: Country; city: string;
  interests: Interest[]; languageOfStudy: 'kz' | 'ru' | 'en' | 'local';
  tuitionKztPerYear: number | null;
  tuitionNote: string | null;      // подпись, если годовая сумма — пересчёт (напр. из цены за кредит ECTS)
  grantAvailable: boolean;
  requirements: { exam: ExamId; minScore: number | null }[];
  minGpa: number | null; deadlines: Deadline[];
  prestige: Level | null;   // редакционная оценка, не факт из источника; шкала грубая намеренно
  career: Level | null;     // то же самое про карьерные перспективы
  sourceUrl: string; checkedAt: string;
  unverified: VerifiableField[];   // поля без источника; пустой массив = всё сверено
}

export interface Reason { kind: 'match' | 'warning' | 'blocker'; code: string; text: string; weight: number }
export interface Recommendation { program: Program; score: number; chance: Level; reasons: Reason[] }
export interface Diagnosis { strengths: string[]; limits: string[]; goal: string; }

export interface RoadmapStep {
  id: string;                      // стабильный: `${programId|global}:${type}:${key}`
  type: 'exam' | 'document' | 'deadline' | 'academic' | 'activity';
  title: string; why: string; dueDate: string | null; sourceUrl: string | null; programIds: string[];
}
```

## Контракт маршрута — `src/lib/flow.ts`
Порядок станций живёт в `FLOW_STEPS` и только там. Навигация (`StepNav`) и прогресс (`MetroProgress`) читают его; захардкоженных `href` между экранами быть не должно.

## Контракт движка — `src/engine/index.ts`
```ts
recommend(profile: Profile, programs: Program[]): Recommendation[]
diagnose(profile: Profile): Diagnosis
buildRoadmap(profile: Profile, recs: Recommendation[], today: Date): RoadmapStep[]
nextStep(steps: RoadmapStep[], completedIds: string[]): RoadmapStep | null
```
Функции чистые: без сети, случайности и чтения текущего времени изнутри. Реализованы зоной A.

## Контракт состояния — `src/store/useJourney.ts`
`{ profile, selectedProgramIds, comparedIds, completedStepIds, hydrated }`, экшены `setProfile`, `patchProfile`, `toggleSelected`, `toggleCompared`, `toggleStep`, `reset`. persist `bagdar-journey`, версия 1. Экраны ждут `hydrated`, иначе получат SSR hydration mismatch.
