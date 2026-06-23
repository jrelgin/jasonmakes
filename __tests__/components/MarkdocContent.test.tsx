import Markdoc from "@markdoc/markdoc";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import MarkdocContent from "../../src/components/markdoc/MarkdocContent";
import { markdocConfig } from "../../src/components/markdoc/config";

/** Mirror the production pipeline: parse -> transform -> render. */
function renderMarkdoc(source: string) {
  const node = Markdoc.parse(source);
  const tree = Markdoc.transform(node, markdocConfig);
  return render(<MarkdocContent content={tree} />);
}

describe("MarkdocContent", () => {
  it("opens external links in a new tab but leaves internal links alone", () => {
    renderMarkdoc(
      [
        "I wrote my [week in preview](https://example.com/preview).",
        "",
        "See the [archive](/articles) for more.",
      ].join("\n"),
    );

    const external = screen.getByRole("link", { name: "week in preview" });
    expect(external.getAttribute("href")).toBe("https://example.com/preview");
    expect(external.getAttribute("target")).toBe("_blank");
    expect(external.getAttribute("rel")).toBe("noopener noreferrer");

    const internal = screen.getByRole("link", { name: "archive" });
    expect(internal.getAttribute("href")).toBe("/articles");
    expect(internal.getAttribute("target")).toBeNull();
  });

  it("renders GFM tables (which the old parser dropped)", () => {
    const { container } = renderMarkdoc(
      ["| Metric | Value |", "| --- | --- |", "| Seats | 42 |"].join("\n"),
    );

    expect(container.querySelector("table")).not.toBeNull();
    expect(screen.getByText("Seats")).toBeTruthy();
    expect(screen.getByText("42")).toBeTruthy();
  });

  it("renders a custom callout component with its tone class", () => {
    const { container } = renderMarkdoc(
      ['{% callout tone="warning" %}', "Heads up.", "{% /callout %}"].join(
        "\n",
      ),
    );

    const callout = container.querySelector(".ink-callout");
    expect(callout).not.toBeNull();
    expect(callout?.classList.contains("ink-callout--warning")).toBe(true);
    expect(screen.getByText("Heads up.")).toBeTruthy();
  });
});
