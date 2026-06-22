import { collection, config, fields, singleton } from "@keystatic/core";

import { BrandMark } from "./keystatic/brand-mark";
import { makeComponents } from "./keystatic/components";

// A single slug field keyed `title`: the admin list shows the Title, and the
// URL slug is auto-generated from it (editable). `slugField` points here.
const titleField = fields.slug({
  name: {
    label: "Title",
    validation: { isRequired: true },
  },
  slug: {
    label: "URL slug",
    description:
      "Auto-generated from the title. Lowercase words separated by dashes, e.g. `designing-with-constraints`.",
    validation: {
      pattern: {
        regex: /^[a-z0-9-]+$/,
        message: "Use lowercase letters, numbers, and dashes only.",
      },
    },
  },
});

const statusField = fields.select({
  label: "Status",
  description:
    "Drafts are hidden on the live site but visible when running locally.",
  options: [
    { label: "Draft", value: "draft" },
    { label: "Published", value: "published" },
  ],
  defaultValue: "draft",
});

/**
 * Fields shared by every content collection. Parameterised by image directory so
 * each collection stores hero/inline/component images in its own folder.
 */
function baseContentFields(imageDirectory: string, imagePublicPath: string) {
  return {
    title: titleField,
    status: statusField,
    excerpt: fields.text({
      label: "Excerpt",
      description:
        "Teaser copy for listing pages, social cards, and meta descriptions.",
      multiline: true,
    }),
    publishDate: fields.date({
      label: "Publish date",
      description: "Determines ordering on listing pages.",
      defaultValue: { kind: "today" },
      validation: { isRequired: true },
    }),
    heroImage: fields.image({
      label: "Hero image",
      directory: imageDirectory,
      publicPath: imagePublicPath,
      description: "Shown on listing cards and the page header. Optional.",
    }),
    tags: fields.array(
      fields.text({ label: "Tag", validation: { isRequired: true } }),
      {
        label: "Tags",
        description: "Used for future taxonomy filtering. Optional.",
        itemLabel: ({ value }) => value ?? "Tag",
      },
    ),
    content: fields.markdoc({
      label: "Body",
      description:
        "Write the main content. Use the + menu to insert callouts, embeds, and captioned images.",
      options: {
        image: { directory: imageDirectory, publicPath: imagePublicPath },
      },
      components: makeComponents(imageDirectory, imagePublicPath),
    }),
  };
}

const articleFields = baseContentFields(
  "public/images/articles",
  "/images/articles/",
);

const caseStudyFields = {
  ...baseContentFields("public/images/case-studies", "/images/case-studies/"),
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
    fields.text({ label: "Outcome", validation: { isRequired: true } }),
    {
      label: "Outcomes",
      description: "Short, scannable results for listings and page headers.",
      itemLabel: ({ value }) => value ?? "Outcome",
    },
  ),
  sortOrder: fields.integer({
    label: "Sort order",
    description:
      "Lower numbers appear first. Leave empty to fall back to publish date.",
  }),
};

const hobbyProjectFields = {
  ...baseContentFields(
    "public/images/hobby-projects",
    "/images/hobby-projects/",
  ),
  projectType: fields.text({
    label: "Project type",
    description: "Short category such as Personal tool, Game, or Plugin.",
  }),
  projectStatus: fields.text({
    label: "Project status",
    description:
      "Lifecycle state such as Active, Usable, Prototype, or Paused.",
  }),
  builtWith: fields.array(
    fields.text({ label: "Technology", validation: { isRequired: true } }),
    {
      label: "Built with",
      description: "Primary tools, frameworks, APIs, or platforms.",
      itemLabel: ({ value }) => value ?? "Technology",
    },
  ),
  highlights: fields.array(
    fields.text({ label: "Highlight", validation: { isRequired: true } }),
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
      "Lower numbers appear first. Leave empty to fall back to publish date.",
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
      mark: BrandMark,
    },
    navigation: {
      Content: ["articles", "caseStudies", "hobbyProjects"],
      Site: ["siteSettings", "about"],
    },
  },
  collections: {
    articles: collection({
      label: "Articles",
      path: "content/articles/*",
      slugField: "title",
      columns: ["publishDate", "status"],
      previewUrl: "/articles/{slug}",
      entryLayout: "content",
      format: { data: "yaml", contentField: "content" },
      schema: articleFields,
    }),
    caseStudies: collection({
      label: "Case Studies",
      path: "content/case-studies/*",
      slugField: "title",
      columns: ["publishDate", "status"],
      previewUrl: "/case-studies/{slug}",
      entryLayout: "content",
      format: { data: "yaml", contentField: "content" },
      schema: caseStudyFields,
    }),
    hobbyProjects: collection({
      label: "Hobby Projects",
      path: "content/hobby-projects/*",
      slugField: "title",
      columns: ["publishDate", "status"],
      previewUrl: "/hobbies/{slug}",
      entryLayout: "content",
      format: { data: "yaml", contentField: "content" },
      schema: hobbyProjectFields,
    }),
  },
  singletons: {
    siteSettings: singleton({
      label: "Site Settings",
      path: "content/settings/site/",
      format: { data: "yaml" },
      schema: {
        siteTitle: fields.text({
          label: "Site title",
          description:
            "Used as the default browser/tab title and OG site name.",
        }),
        siteDescription: fields.text({
          label: "Site description",
          description: "Default meta description for pages without their own.",
          multiline: true,
        }),
        authorName: fields.text({ label: "Author name" }),
        authorTagline: fields.text({
          label: "Author tagline",
          description:
            "Short role line, e.g. Head of Product at Standard Education.",
        }),
        shareImage: fields.image({
          label: "Default share image",
          directory: "public/images/site",
          publicPath: "/images/site/",
          description: "Fallback Open Graph image (1200×630 recommended).",
        }),
        socialLinks: fields.array(
          fields.object({
            label: fields.text({ label: "Label" }),
            url: fields.url({ label: "URL" }),
          }),
          {
            label: "Social links",
            itemLabel: ({ fields: f }) => f.label.value || "Link",
          },
        ),
      },
    }),
    about: singleton({
      label: "About Page",
      path: "content/settings/about/",
      format: { data: "yaml", contentField: "body" },
      entryLayout: "content",
      previewUrl: "/about",
      schema: {
        lede: fields.text({
          label: "Lede",
          description: "The large intro line under your name.",
          multiline: true,
        }),
        body: fields.markdoc({
          label: "Body",
          description: "The main About prose.",
          options: {
            image: {
              directory: "public/images/about",
              publicPath: "/images/about/",
            },
          },
          components: makeComponents("public/images/about", "/images/about/"),
        }),
      },
    }),
  },
});
