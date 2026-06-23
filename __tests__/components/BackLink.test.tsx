import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import BackLink from "../../src/components/BackLink";

describe("BackLink", () => {
  it("links to the section and renders the Unicode left arrow", () => {
    render(<BackLink href="/hobbies" label="Hobbies" />);

    const link = screen.getByRole("link", { name: "Hobbies" });
    expect(link.getAttribute("href")).toBe("/hobbies");
    expect(link.textContent).toContain("←");
    expect(link.textContent).not.toContain("<-");
  });
});
