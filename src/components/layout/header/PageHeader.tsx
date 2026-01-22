type Props = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
};

export default function PageHeader({ title, subtitle, right }: Props) {
  return (
    <div className="border-b bg-white px-5 py-4 dark:bg-slate-900 dark:border-slate-700">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-3">{right}</div>
      </div>
    </div>
  );
}
