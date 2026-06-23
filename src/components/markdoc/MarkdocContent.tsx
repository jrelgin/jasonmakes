import Markdoc, { type RenderableTreeNode } from "@markdoc/markdoc";
import * as React from "react";

import { markdocComponents } from "./components";

/**
 * Renders a transformed Markdoc tree (produced in `lib/data/content.ts` via
 * `Markdoc.transform`) to React. Server component — no client JS shipped.
 */
export default function MarkdocContent({
  content,
}: {
  content: RenderableTreeNode;
}) {
  return (
    <>
      {Markdoc.renderers.react(content, React, {
        components: markdocComponents,
      })}
    </>
  );
}
