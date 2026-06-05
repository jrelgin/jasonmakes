import Image from "next/image";
import Link from "next/link";

import { type Article, listArticles } from "../../../lib/data/content";
import { PageIntro, SitePage } from "../../components/site-page";

export const metadata = {
  title: "Articles | Jason Makes",
  description: "Articles and thoughts on design, development, and creativity",
};

export const dynamic = "force-static";

export default async function ArticlesPage() {
  const articles = await listArticles();

  return (
    <SitePage width="wide">
      <PageIntro
        eyebrow="Articles"
        title="Notes from the product shoreline."
        description="Short field notes on design, development, strategy, and the creative systems that sit between them."
      />

      {articles.length === 0 ? (
        <p className="empty-state">No articles found. Check back soon.</p>
      ) : (
        <div className="tide-list">
          {articles.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      )}
    </SitePage>
  );
}

function ArticleCard({ article }: { article: Article }) {
  const { title, slug, publishDate, excerpt, heroImage } = article;
  const formattedDate = new Date(publishDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Link href={`/articles/${slug}`} className="group block" prefetch>
      <article className="tide-card tide-card--article">
        {heroImage ? (
          <div className="tide-card__media">
            <Image
              src={heroImage}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition duration-500 group-hover:scale-[1.03]"
            />
          </div>
        ) : (
          <div className="tide-card__media tide-card__media--empty">
            <span>Article</span>
          </div>
        )}
        <div className="tide-card__body">
          <p className="tide-card__meta">{formattedDate}</p>
          <h2>{title}</h2>
          {excerpt && <p>{excerpt}</p>}

          <span className="tide-card__link">Read more &rarr;</span>
        </div>
      </article>
    </Link>
  );
}
