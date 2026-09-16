/**
 * Общие контракты проекта «Бағдар».
 * ВЛАДЕЛЕЦ: лид. Зоны A/B/C этот файл не правят — нужно изменить контракт,
 * остановись и скажи лиду (правило 9 в CLAUDE.md).
 */

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
  /**
   * Желаемые города. Пустой массив = без предпочтений.
   * В отличие от countries это НЕ фильтр, а мягкое предпочтение: работает
   * только через приоритет 'city'. Учиться в невыбранной стране бессмысленно,
   * а сильную программу в соседнем городе отбрасывать — нет.
   * Значения сверяются с AVAILABLE_CITIES из @/data без учёта регистра.
   */
  preferredCities: string[];
  budgetKztPerYear: number;        // 0 = только грант
  needsGrant: boolean;
  priorities: Array<'cost' | 'prestige' | 'city' | 'career' | 'language'>;
}

export interface Deadline { id: string; label: string; date: string | null; sourceUrl: string | null }

/**
 * Поля программы, которые обязаны опираться на источник.
 * prestige и career сюда не входят: они редакционные по определению, об этом
 * сказано в самих полях.
 */
export type VerifiableField =
  | 'tuitionKztPerYear'
  | 'grantAvailable'
  | 'requirements'
  | 'minGpa'
  | 'deadlines';

export interface Program {
  id: string; university: string; program: string; country: Country; city: string;
  interests: Interest[]; languageOfStudy: 'kz' | 'ru' | 'en' | 'local';
  tuitionKztPerYear: number | null;
  /**
   * Пояснение к цене, когда источник публикует её в другой единице.
   * Вузы Казахстана считают в кредитах ECTS, а не в годах, поэтому годовая
   * сумма бывает пересчётом (60 ECTS = учебный год). UI обязан показать эту
   * строку рядом с цифрой, иначе пересчёт выглядит цитатой из прайса.
   * null — источник сам даёт стоимость за год.
   */
  tuitionNote: string | null;
  grantAvailable: boolean;
  requirements: { exam: ExamId; minScore: number | null }[];
  minGpa: number | null; deadlines: Deadline[];
  /**
   * Узнаваемость и селективность программы. Оценка редакционная, а не факт из
   * источника, поэтому шкала намеренно грубая: точное число вроде места в
   * рейтинге выглядело бы проверенным фактом, которым оно не является.
   * null — не оценивали.
   */
  prestige: Level | null;
  /** Карьерные перспективы направления. Шкала и оговорка те же, что у prestige. */
  career: Level | null;
  sourceUrl: string; checkedAt: string;
  /**
   * Поля, под которые источника пока нет. Пустой массив = всё подтверждено.
   * Заменил булев isDemo: у одной программы стоимость может быть сверена с
   * прайсом, а требование к GPA — нет, и одним флагом это не выразить.
   * UI ставит бейдж «демо-данные» точечно на перечисленные поля.
   */
  unverified: VerifiableField[];
}

export interface Reason { kind: 'match' | 'warning' | 'blocker'; code: string; text: string; weight: number }
export interface Recommendation { program: Program; score: number; chance: Level; reasons: Reason[] }
export interface Diagnosis { strengths: string[]; limits: string[]; goal: string; }

export interface RoadmapStep {
  id: string;                      // стабильный: `${programId|global}:${type}:${key}`
  type: 'exam' | 'document' | 'deadline' | 'academic' | 'activity';
  title: string; why: string; dueDate: string | null; sourceUrl: string | null; programIds: string[];
}
