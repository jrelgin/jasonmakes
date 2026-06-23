import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import FeatureCard from "../../src/components/FeatureCard";

describe("FeatureCard", () => {
  it("renders the title, CTA, link, and at most three points", () => {
    render(
      <FeatureCard
        href="/case-studies/foo"
        image={{ src: "/img.webp", alt: "Foo" }}
        eyebrow="Acme · Lead"
        title="Foo Study"
        excerpt="Summary"
        points={["one", "two", "three", "four"]}
        cta="Read case study"
      />,
    );

    const link = screen.getByRole("link", { name: /Foo Study/ });
    expect(link.getAttribute("href")).toBe("/case-studies/foo");
    expect(screen.getByText("Read case study")).toBeTruthy();
    expect(screen.getByText("one")).toBeTruthy();
    expect(screen.getByText("three")).toBeTruthy();
    expect(screen.queryByText("four")).toBeNull();
  });

  it("omits the image column and spans the full grid when no image is provided", () => {
    const { container } = render(
      <FeatureCard href="/x" title="No Image" cta="View project" />,
    );

    expect(container.querySelector("img")).toBeNull();
    expect(container.innerHTML).toContain("md:col-span-5");
  });
});
