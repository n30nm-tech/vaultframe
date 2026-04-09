type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <div className="mb-6 sm:mb-8">
      <p className="text-sm uppercase tracking-[0.24em] text-accent">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">{description}</p>
    </div>
  );
}
