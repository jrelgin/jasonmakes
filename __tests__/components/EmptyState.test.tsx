import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import EmptyState from "../../src/components/EmptyState";

describe("EmptyState", () => {
  it("renders its message", () => {
    render(<EmptyState>No articles yet — check back soon.</EmptyState>);
    expect(screen.getByText("No articles yet — check back soon.")).toBeTruthy();
  });
});
