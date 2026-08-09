export default function TopBar({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-500">{description}</p>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      </div>
    </div>
  );
}
