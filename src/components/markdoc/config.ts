import Markdoc, { type Config } from "@markdoc/markdoc";

/**
 * Markdoc transform config. Tag names here must match the component keys in
 * `keystatic/components.tsx` (the editor side), and each `render` string must
 * match a key in the `markdocComponents` map in `./components.tsx`.
 *
 * Only the nodes/tags we customise are listed; everything else (headings,
 * tables, strikethrough, code fences, lists, blockquotes, …) falls back to
 * Markdoc's defaults, which render as plain HTML tags styled by `.ink-prose`.
 */
export const markdocConfig: Config = {
  tags: {
    callout: {
      render: "Callout",
      attributes: {
        tone: {
          type: String,
          default: "info",
          matches: ["info", "success", "warning", "danger"],
        },
      },
    },
    youtube: {
      render: "YouTube",
      attributes: {
        id: { type: String, required: true },
        title: { type: String },
      },
    },
    imageWithCaption: {
      render: "ImageWithCaption",
      attributes: {
        src: { type: String, required: true },
        alt: { type: String },
        caption: { type: String },
      },
    },
  },
  nodes: {
    // Keep default link parsing/attributes (href, title) but render through our
    // component so external links open in a new tab with rel="noopener".
    link: {
      ...Markdoc.nodes.link,
      render: "Link",
    },
  },
};
