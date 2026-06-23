import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import DetailPageHeader from "../../src/components/DetailPageHeader";

describe("DetailPageHeader", () => {
  it("renders the back link, the eyebrow above the title, and children", () => {
    render(
      <DetailPageHeader
        backHref="/hobbies"
        backLabel="Hobbies"
        eyebrow="Plugin"
        title="My Project"
      >
        <p>child content</p>
      </DetailPageHeader>,
    );

    const back = screen.getByRole("link", { name: "Hobbies" });
    expect(back.getAttribute("href")).toBe("/hobbies");
    expect(back.textContent).toContain("←");

    const heading = screen.getByRole("heading", {
      level: 1,
      name: "My Project",
    });
    expect(heading).toBeTruthy();

    expect(screen.getByText("Plugin")).toBeTruthy();
    expect(screen.getByText("child content")).toBeTruthy();
  });
});
