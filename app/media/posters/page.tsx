import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { PosterReviewBoard } from "@/components/media/poster-review-board";
import { getPosterReviewData } from "@/lib/data/media";

export const dynamic = "force-dynamic";

type PosterReviewPageProps = {
  searchParams?: Promise<{
    libraryId?: string;
    sourceFolder?: string;
    posterState?: "all" | "missing" | "auto" | "custom";
    recentOnly?: string;
    needsReviewOnly?: string;
    page?: string;
  }>;
};

export default async function PosterReviewPage({ searchParams }: PosterReviewPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const data = await getPosterReviewData({
    libraryId: params?.libraryId,
    sourceFolder: params?.sourceFolder,
    posterState: params?.posterState,
    recentOnly: params?.recentOnly === "1",
    needsReviewOnly: params?.needsReviewOnly === "1",
    page: Number(params?.page ?? 1),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          eyebrow="Poster Review"
          title="Curate posters in bulk"
          description="Review auto-generated posters, pick better storyboard frames, and move through the queue without opening every video detail page."
        />
        <Link
          href="/media"
          className="inline-flex shrink-0 items-center justify-center rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/[0.04] hover:text-white"
        >
          Back To Media
        </Link>
      </div>

      <PosterReviewBoard data={data} />
    </div>
  );
}
