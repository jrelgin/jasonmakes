import PageShell from "@/components/PageShell";

export default function ArticleLoading() {
  return (
    <PageShell>
      <article className="container mx-auto max-w-3xl animate-pulse px-4 py-14 md:py-20">
        <div className="h-3 w-24 rounded bg-[var(--panel-2)]" />
        <div className="mt-6 h-10 w-3/4 rounded bg-[var(--panel-2)]" />
        <div className="mt-4 h-4 w-40 rounded bg-[var(--panel-2)]" />
        <div className="mt-10 aspect-video w-full rounded-[4px] bg-[var(--panel-2)]" />
        <div className="mt-12 space-y-4">
          <div className="h-4 w-full rounded bg-[var(--panel-2)]" />
          <div className="h-4 w-5/6 rounded bg-[var(--panel-2)]" />
          <div className="h-4 w-full rounded bg-[var(--panel-2)]" />
          <div className="h-4 w-4/5 rounded bg-[var(--panel-2)]" />
          <div className="my-6 h-32 w-full rounded bg-[var(--panel-2)]" />
          <div className="h-4 w-full rounded bg-[var(--panel-2)]" />
          <div className="h-4 w-3/4 rounded bg-[var(--panel-2)]" />
        </div>
      </article>
    </PageShell>
  );
}
