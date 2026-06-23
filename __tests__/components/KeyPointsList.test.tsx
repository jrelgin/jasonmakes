import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import KeyPointsList from "../../src/components/KeyPointsList";

describe("KeyPointsList", () => {
  it("renders the detail variant as a two-column grid", () => {
    const { container } = render(
      <KeyPointsList items={["a", "b"]} variant="detail" />,
    );

    expect(container.querySelector("ul")?.className).toContain(
      "md:grid-cols-2",
    );
    expect(container.querySelectorAll("li").length).toBe(2);
  });

  it("renders the compact variant and respects max", () => {
    const { container } = render(
      <KeyPointsList items={["a", "b", "c", "d"]} variant="compact" max={3} />,
    );

    expect(container.querySelector("ul")?.className).toContain("space-y-2");
    expect(container.querySelectorAll("li").length).toBe(3);
  });

  it("renders nothing when there are no items", () => {
    const { container } = render(<KeyPointsList items={[]} />);
    expect(container.querySelector("ul")).toBeNull();
  });
});
