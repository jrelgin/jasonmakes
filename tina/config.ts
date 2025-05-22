import { defineConfig } from "tinacms";
import type { TinaField } from "tinacms";

// Prioritize main branch to ensure consistent TinaCMS connections
const branch =
  process.env.NEXT_PUBLIC_TINA_BRANCH ||
  "main"; // Always default to main for more predictable deployments

// Define shared fields for both collections
const sharedFields: TinaField[] = [
  {
    type: "string",
    name: "title",
    label: "Title",
    isTitle: true,
    required: true,
  },
  {
    type: "datetime",
    name: "date",
    label: "Publish Date",
    required: true,
    ui: { 
      dateFormat: "MMM DD, YYYY", 
      timeFormat: "HH:mm" 
    },
  },
  {
    type: "string",
    name: "slug",
    label: "Slug",
    required: true,
    ui: { component: "text" },
  },
  {
    type: "string",
    name: "description",
    label: "Description",
    ui: { component: "textarea" },
  },
  {
    type: "rich-text",
    name: "body",
    label: "Content",
    isBody: true,
  },
];

// Define the default template once to be reused across collections
const defaultTemplate = { 
  name: "default", 
  label: "Content", 
  fields: sharedFields 
};

// Define collection base configurations
type SlugValues = { slug?: string; date?: string };

const articles = {
  name: "articles",
  label: "Articles",
  path: "content/articles",
  format: "md" as const,
  ui: {
    filename: {
      // Use the "slug" field as the filename, sanitized
      slugify: (values: SlugValues) => {
        // Optionally prepend date to avoid duplicate slugs
        const datePrefix = values?.date ? `${new Date(values.date).toISOString().split('T')[0]}-` : '';
        return `${datePrefix}${(values?.slug ?? '').toLowerCase().replace(/[^a-z0-9-]+/g, "-")}` || 'article';
      },
    },
  },
};

const caseStudies = {
  name: "caseStudies",
  label: "Case Studies",
  path: "content/case-studies",
  format: "md" as const,
  ui: {
    filename: {
      // Use the "slug" field as the filename, sanitized
      slugify: (values: SlugValues) => {
        // Optionally prepend date to avoid duplicate slugs
        const datePrefix = values?.date ? `${new Date(values.date).toISOString().split('T')[0]}-` : '';
        return `${datePrefix}${(values?.slug ?? '').toLowerCase().replace(/[^a-z0-9-]+/g, "-")}` || 'case-study';
      },
    },
  },
};

export default defineConfig({
  branch,
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID || "", // Client ID from TinaCMS Cloud
  token: process.env.TINA_TOKEN || "", // Token from TinaCMS Cloud
  build: {
    outputFolder: "admin",
    publicFolder: "public",
  },
  media: {
    tina: {
      mediaRoot: "uploads", // Stores media in public/uploads
      publicFolder: "public",
    },
  },
  // Schema with two collections as per implementation plan
  schema: {
    collections: [
      { ...articles, fields: sharedFields },
      { ...caseStudies, fields: sharedFields },
    ],
  },
});
