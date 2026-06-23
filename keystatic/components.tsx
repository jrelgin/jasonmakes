import * as React from "react";

import { fields } from "@keystatic/core";
import { block, wrapper } from "@keystatic/core/content-components";

/**
 * Editor-side definitions for the insertable blocks available in the Markdoc
 * body editor. The object keys here (`callout`, `youtube`, `imageWithCaption`)
 * become the Markdoc tag names on disk (`{% callout %}`, `{% youtube /%}`, …) and
 * must match the `tags` map in `src/components/markdoc/config.ts` that renders
 * them on the site.
 *
 * `makeComponents` is parameterised by image directory/publicPath so each
 * collection reuses the same definitions with its own image folder.
 */

// Inline SVG icons shown in the editor's "+" insert menu. Kept tiny and
// currentColor so they inherit the admin chrome.
const calloutIcon = (
  <svg
    width={20}
    height={20}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="m3 11 18-5v12L3 14v-3z" />
    <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
  </svg>
);

const youtubeIcon = (
  <svg
    width={20}
    height={20}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x={2} y={6} width={20} height={12} rx={3} />
    <path d="m10 9 5 3-5 3V9z" fill="currentColor" stroke="none" />
  </svg>
);

const imageIcon = (
  <svg
    width={20}
    height={20}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x={3} y={3} width={18} height={18} rx={2} />
    <circle cx={9} cy={9} r={2} />
    <path d="m21 15-3.6-3.6a2 2 0 0 0-2.8 0L6 20" />
  </svg>
);

const TONE_OPTIONS = [
  { label: "Info", value: "info" },
  { label: "Success", value: "success" },
  { label: "Warning", value: "warning" },
  { label: "Danger", value: "danger" },
] as const;

const TONE_PREVIEW: Record<
  string,
  { bg: string; border: string; label: string }
> = {
  info: { bg: "#eef4fb", border: "#3b6ea5", label: "Info" },
  success: { bg: "#edf7ef", border: "#3f8f54", label: "Success" },
  warning: { bg: "#fdf4e7", border: "#b3631a", label: "Warning" },
  danger: { bg: "#fbecec", border: "#b3403a", label: "Danger" },
};

export function makeComponents(
  imageDirectory: string,
  imagePublicPath: string,
) {
  return {
    callout: wrapper({
      label: "Callout",
      description: "Highlight a tip, aside, or warning.",
      icon: calloutIcon,
      schema: {
        tone: fields.select({
          label: "Tone",
          options: [...TONE_OPTIONS],
          defaultValue: "info",
        }),
      },
      ContentView: ({ value, children }) => {
        const tone = TONE_PREVIEW[value.tone] ?? TONE_PREVIEW.info;
        return (
          <div
            style={{
              borderLeft: `4px solid ${tone.border}`,
              background: tone.bg,
              borderRadius: 6,
              padding: "10px 14px",
              color: "#1f2933",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: tone.border,
                marginBottom: 4,
              }}
            >
              {tone.label}
            </div>
            {children}
          </div>
        );
      },
    }),

    youtube: block({
      label: "YouTube",
      description: "Embed a YouTube video by URL or ID.",
      icon: youtubeIcon,
      schema: {
        id: fields.text({
          label: "Video URL or ID",
          validation: { isRequired: true },
        }),
        title: fields.text({ label: "Accessible title" }),
      },
      ContentView: ({ value }) => (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "#1f2933",
            color: "white",
            borderRadius: 6,
            padding: "12px 14px",
          }}
        >
          <span aria-hidden="true" style={{ fontSize: 18 }}>
            ▶
          </span>
          <span style={{ fontSize: 13 }}>
            {value.title || value.id || "YouTube video"}
          </span>
        </div>
      ),
    }),

    imageWithCaption: block({
      label: "Image with caption",
      description: "An image with an optional caption rendered as a figure.",
      icon: imageIcon,
      schema: {
        src: fields.image({
          label: "Image",
          directory: imageDirectory,
          publicPath: imagePublicPath,
          validation: { isRequired: true },
        }),
        alt: fields.text({ label: "Alt text" }),
        caption: fields.text({ label: "Caption", multiline: true }),
      },
      ContentView: ({ value }) => (
        <figure
          style={{
            border: "1px dashed #c3ccd6",
            borderRadius: 6,
            padding: "12px 14px",
            margin: 0,
            color: "#52606d",
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600 }}>
            🖼 {value.alt || "Image"}
          </div>
          {value.caption ? (
            <figcaption
              style={{ fontSize: 12, marginTop: 4, fontStyle: "italic" }}
            >
              {value.caption}
            </figcaption>
          ) : null}
        </figure>
      ),
    }),
  };
}
