import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Markdown from "../../src/components/Markdown";

describe("Markdown", () => {
  it("renders inline links as anchors", () => {
    render(
      <Markdown
        source={[
          "I would write my [week in preview](https://example.com/preview), a practice I've had for years.",
          "",
          "See the [archive](/articles) for more.",
        ].join("\n")}
      />,
    );

    const external = screen.getByRole("link", { name: "week in preview" });
    expect(external.getAttribute("href")).toBe("https://example.com/preview");
    expect(external.getAttribute("target")).toBe("_blank");
    expect(external.getAttribute("rel")).toBe("noopener noreferrer");

    const internal = screen.getByRole("link", { name: "archive" });
    expect(internal.getAttribute("href")).toBe("/articles");
    expect(internal.getAttribute("target")).toBeNull();
    expect(internal.getAttribute("rel")).toBeNull();
  });

  it("renders standalone images with captions", () => {
    const { container } = render(
      <Markdown
        source={[
          "Before the screenshot.",
          "",
          "![Survey export interface](/images/case-studies/glass-exports/01-filter-search.jpg)",
          "_This omni-search filters survey export data._",
          "",
          "After the screenshot.",
        ].join("\n")}
      />,
    );

    const image = screen.getByRole("img", {
      name: "Survey export interface",
    });

    expect(image.getAttribute("src")).toBe(
      "/images/case-studies/glass-exports/01-filter-search.jpg",
    );
    expect(container.querySelector("figure")).not.toBeNull();
    expect(
      screen.getByText("This omni-search filters survey export data."),
    ).toBeTruthy();
    expect(screen.getByText("After the screenshot.")).toBeTruthy();
  });
});
