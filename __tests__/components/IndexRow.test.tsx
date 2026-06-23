import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import IndexRow from "../../src/components/IndexRow";

describe("IndexRow", () => {
  it("renders a thumbnail variant with the running number in the eyebrow and a Unicode arrow", () => {
    const { container } = render(
      <ul>
        <IndexRow
          href="/articles/hello"
          displayNumber={1}
          eyebrow="January 1, 2026"
          title="Hello World"
          excerpt="An excerpt"
          thumbnail={{ src: "/images/hello.webp" }}
        />
      </ul>,
    );

    const link = screen.getByRole("link", { name: /Hello World/ });
    expect(link.getAttribute("href")).toBe("/articles/hello");
    expect(link.className).toContain("index-row--thumb");
    expect(container.querySelector("img")).not.toBeNull();
    expect(container.querySelector(".index-row__index")?.textContent).toBe(
      "01",
    );
    expect(link.textContent).toContain("→");
    expect(link.textContent).not.toContain("->");
  });

  it("renders a no-thumbnail variant with a leading index number", () => {
    const { container } = render(
      <ul>
        <IndexRow
          href="/case-studies/foo"
          displayNumber={2}
          eyebrow="Acme · Lead"
          title="Foo Study"
        />
      </ul>,
    );

    const link = screen.getByRole("link", { name: /Foo Study/ });
    expect(link.className).not.toContain("index-row--thumb");
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector(".index-row__index")?.textContent).toBe(
      "02",
    );
  });
});
