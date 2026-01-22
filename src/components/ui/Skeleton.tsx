export default function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={[
        "animate-pulse rounded-md bg-slate-200/70 dark:bg-slate-800/70",
        className,
      ].join(" ")}
    />
  );
}
