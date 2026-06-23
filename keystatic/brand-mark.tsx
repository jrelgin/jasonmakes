import * as React from "react";
import type { ReactElement } from "react";

/**
 * Logo shown in the Keystatic admin header. Swaps between the black and white
 * wordmark to stay legible in the admin's light/dark chrome.
 */
export function BrandMark({
  colorScheme,
}: {
  colorScheme: "light" | "dark";
}): ReactElement {
  const src =
    colorScheme === "dark"
      ? "/images/logo-white.svg"
      : "/images/logo-black.svg";
  return (
    <img
      src={src}
      alt="Jason Makes"
      style={{ height: 24, width: "auto", display: "block" }}
    />
  );
}
