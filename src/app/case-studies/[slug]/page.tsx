import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { getCaseStudy, listCaseStudies } from "../../../../lib/data/content";
import Markdown from "../../../components/Markdown";
import {
  InstrumentHeader,
  InstrumentMeta,
  InstrumentPage,
} from "../../../components/instrument-page";

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

  return {
    title: `${caseStudy.title} | Jason Makes`,
    description:
      caseStudy.excerpt || `View case study: ${caseStudy.title} by Jason Elgin`,
  };
}

export default async function Page({ params }: Params) {
  const { slug } = await params;
  const caseStudy = await getCaseStudy(slug);

  if (!caseStudy) {
    notFound();
  }

  return (
    <InstrumentPage width="standard">
      <article className="reading-instrument">
        <InstrumentHeader
          eyebrow={caseStudy.client || "Case study"}
          title={caseStudy.title}
          description={caseStudy.excerpt}
          className="instrument-header--detail"
        />

        {caseStudy.heroImage && (
          <div className="reading-hero">
            <Image
              src={caseStudy.heroImage}
              alt={caseStudy.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
            />
          </div>
        )}

        <InstrumentMeta
          items={[
            { label: "Role", value: caseStudy.role },
            { label: "Scope", value: caseStudy.scope },
            { label: "Industry", value: caseStudy.industry },
          ]}
        />

        {caseStudy.outcomes.length > 0 && (
          <ul className="instrument-outcomes">
            {caseStudy.outcomes.map((outcome) => (
              <li key={outcome}>{outcome}</li>
            ))}
          </ul>
        )}

        <div className="instrument-prose">
          <Markdown source={caseStudy.content} />
        </div>
      </article>
    </InstrumentPage>
  );
}
