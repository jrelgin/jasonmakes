/**
 * Utilities for working with TinaCMS content
 */
// Now that TinaCMS has generated the client files, we can import the client
import { client } from '../tina/__generated__/client'

// Now using the actual client from TinaCMS generated files
// We'll use the generated types from TinaCMS
import type { ArticlesConnection, ArticlesFilter, CaseStudiesConnection, CaseStudiesFilter } from '../tina/__generated__/types';

/**
 * Fetches all articles from TinaCMS
 */
export async function getArticles() {
  const response = await client.queries.articlesConnection()
  return response.data.articlesConnection.edges?.map((edge) => edge?.node) || []
}

/**
 * Fetches a single article by slug
 */
export async function getArticleBySlug(slug: string) {
  const response = await client.queries.articlesConnection({
    filter: { slug: { eq: slug } } as ArticlesFilter
  })
  const edges = response.data.articlesConnection.edges
  return edges?.length ? edges[0]?.node : null
}

/**
 * Fetches all case studies from TinaCMS
 */
export async function getCaseStudies() {
  const response = await client.queries.caseStudiesConnection()
  return response.data.caseStudiesConnection.edges?.map((edge) => edge?.node) || []
}

/**
 * Fetches a single case study by slug
 */
export async function getCaseStudyBySlug(slug: string) {
  const response = await client.queries.caseStudiesConnection({
    filter: { slug: { eq: slug } } as CaseStudiesFilter
  })
  const edges = response.data.caseStudiesConnection.edges
  return edges?.length ? edges[0]?.node : null
}

/**
 * Utility to get all slugs for a collection (used for generateStaticParams)
 */
interface SlugParam {
  slug: string;
}

export async function getAllSlugs(collection: 'articles' | 'caseStudies'): Promise<SlugParam[]> {
  if (collection === 'articles') {
    const articles = await getArticles()
    return articles.map((article) => ({ slug: article?.slug || '' }))
  }
  
  // If not articles, then it's case studies
  const caseStudies = await getCaseStudies()
  return caseStudies.map((caseStudy) => ({ slug: caseStudy?.slug || '' }))
}
