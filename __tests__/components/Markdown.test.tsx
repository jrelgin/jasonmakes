import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Markdown from "../../src/components/Markdown";

describe("Markdown", () => {
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
