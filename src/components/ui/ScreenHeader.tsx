/** ВЛАДЕЛЕЦ: зона B. Шапка экрана: заголовок станции и её задача. */
export function ScreenHeader({ title, lead }: { title: string; lead: string }) {
  return (
    <header className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
      <p className="text-base text-muted">{lead}</p>
    </header>
  );
}
