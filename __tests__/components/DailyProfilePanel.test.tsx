import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import DailyProfilePanel from "@/src/app/components/DailyProfilePanel";

function mockMotionPreference(reducedMotion = false) {
  window.matchMedia = vi.fn().mockReturnValue({
    addEventListener: vi.fn(),
    addListener: vi.fn(),
    dispatchEvent: vi.fn(),
    matches: reducedMotion,
    media: "(prefers-reduced-motion: reduce)",
    onchange: null,
    removeEventListener: vi.fn(),
    removeListener: vi.fn(),
  });
}

describe("DailyProfilePanel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockMotionPreference();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("delays the sea-glass entrance before enabling the trigger", () => {
    const { container } = render(
      <DailyProfilePanel blurb="A calm dispatch from the waterline.">
        <p>Signals below the surface.</p>
      </DailyProfilePanel>,
    );

    const shell = container.querySelector(".daily-profile-shell");
    const trigger = screen.getByRole("button", {
      name: "What is this daily current?",
    });

    expect(shell?.getAttribute("data-ready")).toBe("false");
    expect(shell?.getAttribute("data-entered")).toBe("false");
    expect(trigger.hasAttribute("disabled")).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1800);
    });

    expect(shell?.getAttribute("data-ready")).toBe("true");
    expect(shell?.getAttribute("data-entered")).toBe("false");
    expect(trigger.hasAttribute("disabled")).toBe(false);

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(shell?.getAttribute("data-entered")).toBe("true");
  });

  it("opens the dialog, closes with Escape, and returns focus", () => {
    const { container } = render(
      <DailyProfilePanel blurb="A calm dispatch from the waterline.">
        <a href="/articles">Latest reads</a>
      </DailyProfilePanel>,
    );

    const shell = container.querySelector(".daily-profile-shell");
    const trigger = screen.getByRole("button", {
      name: "What is this daily current?",
    });

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    trigger.focus();
    fireEvent.click(trigger);

    expect(shell?.getAttribute("data-open")).toBe("true");
    const dialog = screen.getByRole("dialog", { name: "Below the surface" });
    expect(dialog).toBeTruthy();
    expect(dialog.getAttribute("data-visible")).toBe("false");
    expect(screen.getByRole("button", { name: "Close" })).toBe(
      document.activeElement,
    );

    act(() => {
      vi.advanceTimersByTime(30);
    });

    expect(dialog.getAttribute("data-visible")).toBe("true");

    fireEvent.keyDown(document, { key: "Escape" });

    expect(shell?.getAttribute("data-open")).toBe("false");
    expect(dialog.getAttribute("aria-hidden")).toBe("true");
    expect(dialog.getAttribute("data-visible")).toBe("false");
    expect(trigger).toBe(document.activeElement);

    act(() => {
      vi.runOnlyPendingTimers();
    });

    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
