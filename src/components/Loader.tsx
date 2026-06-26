export default function Loader({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-10 text-slate-300">
      <div className="relative h-10 w-10">
        <span className="absolute inset-0 animate-ping rounded-full bg-cosmos-accent/40" />
        <span className="absolute inset-1 rounded-full bg-cosmos-accent" />
      </div>
      {label && <p className="text-sm text-slate-400">{label}</p>}
    </div>
  );
}
