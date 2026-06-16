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
  client: fields.text({
    label: "Client",
    description: "Company or organization featured in the case study.",
  }),
  role: fields.text({
    label: "Role",
    description: "Your role on the project.",
  }),
  scope: fields.text({
    label: "Scope",
    description: "Primary workstreams or responsibilities.",
    multiline: true,
  }),
  industry: fields.text({
    label: "Industry",
    description: "Market, product category, or business context.",
  }),
  outcomes: fields.array(
    fields.text({
      label: "Outcome",
      validation: { isRequired: true },
    }),
    {
      label: "Outcomes",
      description: "Short, scannable results for listings and page headers.",
      itemLabel: ({ value }) => value ?? "Outcome",
    },
  ),
  sortOrder: fields.integer({
    label: "Sort order",
    description:
      "Lower numbers appear first on the case studies listing. Leave empty to fall back to publish date.",
  }),
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

const hobbyProjectFields = {
  title: articleFields.title,
  slug: articleFields.slug,
  excerpt: articleFields.excerpt,
  publishDate: articleFields.publishDate,
  heroImage: fields.image({
    label: "Hero image",
    directory: "public/images/hobby-projects",
    publicPath: "/images/hobby-projects/",
    description:
      "Displayed on listing cards and the hobby project header. Optional.",
  }),
  projectType: fields.text({
    label: "Project type",
    description: "Short category such as Personal tool, Game, or Plugin.",
  }),
  status: fields.text({
    label: "Status",
    description: "Current state such as Active, Prototype, or Paused.",
  }),
  builtWith: fields.array(
    fields.text({
      label: "Technology",
      validation: { isRequired: true },
    }),
    {
      label: "Built with",
      description: "Primary tools, frameworks, APIs, or platforms.",
      itemLabel: ({ value }) => value ?? "Technology",
    },
  ),
  highlights: fields.array(
    fields.text({
      label: "Highlight",
      validation: { isRequired: true },
    }),
    {
      label: "Highlights",
      description: "Short points shown on listing cards and project headers.",
      itemLabel: ({ value }) => value ?? "Highlight",
    },
  ),
  liveUrl: fields.text({
    label: "Live URL",
    description: "Optional public URL for the running project.",
  }),
  repoUrl: fields.text({
    label: "Repository URL",
    description: "Optional public GitHub URL.",
  }),
  sortOrder: fields.integer({
    label: "Sort order",
    description:
      "Lower numbers appear first on the hobbies listing. Leave empty to fall back to publish date.",
  }),
  tags: articleFields.tags,
  content: fields.mdx({
    label: "Body",
    description: "Write the main hobby project writeup in Markdown or MDX.",
    options: {
      image: {
        directory: "public/images/hobby-projects",
        publicPath: "/images/hobby-projects/",
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
      Content: ["articles", "caseStudies", "hobbyProjects"],
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
    hobbyProjects: collection({
      label: "Hobby Projects",
      path: "content/hobby-projects/*",
      slugField: "slug",
      entryLayout: "content",
      format: {
        data: "yaml",
        contentField: "content",
      },
      schema: hobbyProjectFields,
    }),
  },
});
