import { collection, config, fields } from "@keystatic/core";

const articleFields = {
  title: fields.text({
    label: "Title",
    validation: { isRequired: true },
  }),
  slug: fields.slug({
    name: {
      label: "Slug source",
      description:
        "Used to generate the URL slug. Keep it short and descriptive.",
      validation: { isRequired: true },
    },
    slug: {
      label: "Slug",
      description:
        "Lowercase words separated by dashes, e.g. `designing-with-constraints`.",
      validation: {
        pattern: {
          regex: /^[a-z0-9-]+$/,
          message: "Use lowercase letters, numbers, and dashes only.",
        },
      },
    },
  }),
  excerpt: fields.text({
    label: "Excerpt",
    description:
      "Optional teaser copy for listing pages and meta descriptions.",
    multiline: true,
  }),
  publishDate: fields.date({
    label: "Publish date",
    description: "Determines ordering on listing pages.",
    validation: { isRequired: true },
  }),
  heroImage: fields.image({
    label: "Hero image",
    directory: "public/images/articles",
    publicPath: "/images/articles/",
    description: "Displayed on listing cards and the article header. Optional.",
  }),
  tags: fields.array(
    fields.text({
      label: "Tag",
      validation: { isRequired: true },
    }),
    {
      label: "Tags",
      description:
        "Used for future taxonomy filtering. Leave empty if not needed.",
      itemLabel: ({ value }) => value ?? "Tag",
    },
  ),
  content: fields.mdx({
    label: "Body",
    description: "Write the main article content in Markdown or MDX.",
    options: {
      image: {
        directory: "public/images/articles",
        publicPath: "/images/articles/",
      },
    },
  }),
};

const caseStudyFields = {
  ...articleFields,
  heroImage: fields.image({
    label: "Hero image",
    directory: "public/images/case-studies",
    publicPath: "/images/case-studies/",
    description:
      "Displayed on listing cards and the case study header. Optional.",
  }),
  content: fields.mdx({
    label: "Body",
    description: "Write the main case study content in Markdown or MDX.",
    options: {
      image: {
        directory: "public/images/case-studies",
        publicPath: "/images/case-studies/",
      },
    },
  }),
};

export default config({
  storage: {
    kind: "github",
    repo: "jrelgin/jasonmakes",
  },
  ui: {
    brand: {
      name: "Jason Makes",
    },
    navigation: {
      Content: ["articles", "caseStudies"],
    },
  },
  collections: {
    articles: collection({
      label: "Articles",
      path: "content/articles/*",
      slugField: "slug",
      entryLayout: "content",
      format: {
        data: "yaml",
        contentField: "content",
      },
      schema: articleFields,
    }),
    caseStudies: collection({
      label: "Case Studies",
      path: "content/case-studies/*",
      slugField: "slug",
      entryLayout: "content",
      format: {
        data: "yaml",
        contentField: "content",
      },
      schema: caseStudyFields,
    }),
  },
});
