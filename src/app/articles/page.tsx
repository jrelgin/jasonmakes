import Image from "next/image";
import Link from "next/link";

import { type Article, listArticles } from "../../../lib/data/content";
import {
  InstrumentHeader,
  InstrumentPage,
} from "../../components/instrument-page";

export const metadata = {
  title: "Articles | Jason Makes",
  description: "Articles and thoughts on design, development, and creativity",
};

export const dynamic = "force-static";

export default async function ArticlesPage() {
  const articles = await listArticles();

  return (
    <InstrumentPage width="wide">
      <InstrumentHeader
        eyebrow="Articles"
        readout={`${articles.length.toString().padStart(2, "0")} entries`}
        title="Notes from the instruments."
        description="Short writing on product, design, development, and the odd connective tissue between those systems."
      />

      {articles.length === 0 ? (
        <p className="instrument-empty">No articles found. Check back soon.</p>
      ) : (
        <div className="instrument-list">
          {articles.map((article, index) => (
            <ArticleCard
              key={article.slug}
              article={article}
              index={index + 1}
            />
          ))}
        </div>
      )}
    </InstrumentPage>
  );
}

function ArticleCard({ article, index }: { article: Article; index: number }) {
  const { title, slug, publishDate, excerpt, heroImage } = article;
  const formattedDate = new Date(publishDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Link href={`/articles/${slug}`} className="instrument-row" prefetch>
      <article>
        <div className="instrument-row__index">
          <span>{index.toString().padStart(2, "0")}</span>
          <small>{formattedDate}</small>
        </div>

        <div className="instrument-row__body">
          <h2>{title}</h2>
          {excerpt && <p>{excerpt}</p>}
        </div>

        <div className="instrument-row__signal">
          {heroImage ? (
            <Image
              src={heroImage}
              alt=""
              width={72}
              height={72}
              className="instrument-row__thumb"
            />
          ) : (
            <span />
          )}
          <strong>Open</strong>
        </div>
      </article>
    </Link>
  );
}
