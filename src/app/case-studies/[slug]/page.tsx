import type { Metadata } from "next";
import { notFound } from "next/navigation";

import DetailPageHeader from "@/components/DetailPageHeader";
import FeatureImage from "@/components/FeatureImage";
import KeyPointsList from "@/components/KeyPointsList";
import MetaGrid from "@/components/MetaGrid";
import PageShell from "@/components/PageShell";
import { buildContentMetadata } from "../../../../lib/config/site";
import { getCaseStudy, listCaseStudies } from "../../../../lib/data/content";
import Markdown from "../../../components/Markdown";

interface Params {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateStaticParams() {
  const caseStudies = await listCaseStudies();
  return caseStudies.map((caseStudy) => ({ slug: caseStudy.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const caseStudy = await getCaseStudy(slug);

  if (!caseStudy) {
    return {
      title: "Case Study Not Found | Jason Makes",
    };
  }

  return buildContentMetadata({
    title: caseStudy.title,
    description:
      caseStudy.excerpt || `View case study: ${caseStudy.title} by Jason Elgin`,
    path: `/case-studies/${slug}`,
    image: caseStudy.heroImage ?? undefined,
  });
}

export default async function Page({ params }: Params) {
  const { slug } = await params;
  const caseStudy = await getCaseStudy(slug);

  if (!caseStudy) {
    notFound();
  }

  const meta = [
    { label: "Role", value: caseStudy.role },
    { label: "Scope", value: caseStudy.scope },
    { label: "Industry", value: caseStudy.industry },
  ].filter((item) => item.value);

  return (
    <PageShell>
      <article className="container mx-auto max-w-4xl px-4 py-16 md:py-24">
        <div className="read-veil">
          <DetailPageHeader
            backHref="/case-studies"
            backLabel="Case Studies"
            eyebrow={caseStudy.client}
            title={caseStudy.title}
          >
            <MetaGrid items={meta} />
            <KeyPointsList items={caseStudy.outcomes} variant="detail" />
          </DetailPageHeader>

          {caseStudy.heroImage && (
            <FeatureImage
              src={caseStudy.heroImage}
              alt={caseStudy.title}
              aspect="video"
            />
          )}

          <div className="ink-prose ink-prose--dropcap u-rise u-rise-2 mt-12">
            <Markdown source={caseStudy.content} />
          </div>
        </div>
      </article>
    </PageShell>
  );
}
