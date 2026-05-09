type KnowledgeQualityPanelProps = {
  qualityChecks: string[];
};

export function KnowledgeQualityPanel({
  qualityChecks,
}: KnowledgeQualityPanelProps) {
  return (
    <>
      <div className="mt-5 border-t border-slate-200 pt-4">
        <h2 className="text-sm font-bold text-slate-950">
          Проверка перед AI
        </h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Эти пункты помогут подготовить базу знаний к автоматическим ответам.
        </p>
      </div>

      <div className="mt-4 space-y-2">
        {qualityChecks.map((check) => (
          <label
            key={check}
            className="flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-700"
          >
            <input
              type="checkbox"
              className="mt-1 h-3.5 w-3.5 rounded border-slate-300"
            />
            <span>{check}</span>
          </label>
        ))}
      </div>

      <div className="mt-4 rounded-md border border-slate-200 bg-slate-950 px-3 py-3 text-white">
        <p className="text-xs font-semibold uppercase text-white/50">
          Следующий этап
        </p>
        <p className="mt-2 text-sm font-semibold">
          Новые карточки и категории сохраняются через Supabase Edge Function.
        </p>
      </div>
    </>
  );
}
