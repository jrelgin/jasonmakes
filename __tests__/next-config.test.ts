import { describe, expect, it } from "vitest";

import nextConfig from "../next.config";

describe("Next.js config", () => {
  it("traces filesystem content for routed collections", () => {
    expect(nextConfig.outputFileTracingIncludes).toMatchObject({
      "/articles": ["./content/articles/**/*"],
      "/articles/[slug]": ["./content/articles/**/*"],
      "/case-studies": ["./content/case-studies/**/*"],
      "/case-studies/[slug]": ["./content/case-studies/**/*"],
      "/hobbies": ["./content/hobby-projects/**/*"],
      "/hobbies/[slug]": ["./content/hobby-projects/**/*"],
    });
  });
});
