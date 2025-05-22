// tina/config.ts
import { defineConfig } from "tinacms";
var branch = process.env.TINA_BRANCH || // explicit override
process.env.VERCEL_GIT_COMMIT_REF || // Vercel
process.env.HEAD || // Netlify & some CI systems
"main";
var sharedFields = [
  {
    type: "string",
    name: "title",
    label: "Title",
    isTitle: true,
    required: true
  },
  {
    type: "datetime",
    name: "date",
    label: "Publish Date",
    required: true,
    ui: {
      dateFormat: "MMM DD, YYYY",
      timeFormat: "HH:mm"
    }
  },
  {
    type: "string",
    name: "slug",
    label: "Slug",
    required: true,
    ui: { component: "text" }
  },
  {
    type: "string",
    name: "description",
    label: "Description",
    ui: { component: "textarea" }
  },
  {
    type: "rich-text",
    name: "body",
    label: "Content",
    isBody: true
  }
];
var articles = {
  name: "articles",
  label: "Articles",
  path: "content/articles",
  format: "md",
  ui: {
    filename: {
      // Use the "slug" field as the filename, sanitized
      slugify: (values) => {
        const datePrefix = values?.date ? `${new Date(values.date).toISOString().split("T")[0]}-` : "";
        return `${datePrefix}${(values?.slug ?? "").toLowerCase().replace(/[^a-z0-9-]+/g, "-")}` || "article";
      }
    }
  }
};
var caseStudies = {
  name: "caseStudies",
  label: "Case Studies",
  path: "content/case-studies",
  format: "md",
  ui: {
    filename: {
      // Use the "slug" field as the filename, sanitized
      slugify: (values) => {
        const datePrefix = values?.date ? `${new Date(values.date).toISOString().split("T")[0]}-` : "";
        return `${datePrefix}${(values?.slug ?? "").toLowerCase().replace(/[^a-z0-9-]+/g, "-")}` || "case-study";
      }
    }
  }
};
var config_default = defineConfig({
  branch,
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID || "",
  // Client ID from TinaCMS Cloud
  token: process.env.TINA_TOKEN || "",
  // Token from TinaCMS Cloud
  build: {
    outputFolder: "admin",
    publicFolder: "public"
  },
  media: {
    tina: {
      mediaRoot: "uploads",
      // Stores media in public/uploads
      publicFolder: "public"
    }
  },
  // Schema with two collections as per implementation plan
  schema: {
    collections: [
      { ...articles, fields: sharedFields },
      { ...caseStudies, fields: sharedFields }
    ]
  }
});
export {
  config_default as default
};
