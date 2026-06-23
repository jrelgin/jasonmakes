import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import MetaGrid from "../../src/components/MetaGrid";

describe("MetaGrid", () => {
  it("renders a term and description for each item", () => {
    const { container } = render(
      <MetaGrid
        items={[
          { label: "Role", value: "Lead" },
          { label: "Scope", value: "UX" },
        ]}
      />,
    );

    expect(container.querySelectorAll("dt").length).toBe(2);
    expect(container.querySelectorAll("dd").length).toBe(2);
    expect(screen.getByText("Role")).toBeTruthy();
    expect(screen.getByText("Lead")).toBeTruthy();
  });

  it("renders nothing when there are no items", () => {
    const { container } = render(<MetaGrid items={[]} />);
    expect(container.querySelector("dl")).toBeNull();
  });
});
