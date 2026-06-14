import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import ThemeControl from "../../src/components/theme-control";

describe("ThemeControl", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the three theme options as radios", () => {
    render(<ThemeControl value="system" onChange={() => {}} />);

    expect(screen.getByRole("radio", { name: "Day" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Auto" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Night" })).toBeTruthy();
  });

  it("marks the selected preference as checked", () => {
    render(<ThemeControl value="twilight" onChange={() => {}} />);

    expect(
      screen.getByRole("radio", { name: "Night" }).getAttribute("aria-checked"),
    ).toBe("true");
    expect(
      screen.getByRole("radio", { name: "Day" }).getAttribute("aria-checked"),
    ).toBe("false");
  });

  it("calls onChange with the matching preference on click", () => {
    const onChange = vi.fn();
    render(<ThemeControl value="system" onChange={onChange} />);

    fireEvent.click(screen.getByRole("radio", { name: "Day" }));
    expect(onChange).toHaveBeenCalledWith("hokusai");

    fireEvent.click(screen.getByRole("radio", { name: "Night" }));
    expect(onChange).toHaveBeenCalledWith("twilight");

    fireEvent.click(screen.getByRole("radio", { name: "Auto" }));
    expect(onChange).toHaveBeenCalledWith("system");
  });

  it("moves the selection with arrow keys", () => {
    const onChange = vi.fn();
    render(<ThemeControl value="system" onChange={onChange} />);

    fireEvent.keyDown(screen.getByRole("radio", { name: "Auto" }), {
      key: "ArrowRight",
    });
    expect(onChange).toHaveBeenCalledWith("twilight");

    fireEvent.keyDown(screen.getByRole("radio", { name: "Auto" }), {
      key: "ArrowLeft",
    });
    expect(onChange).toHaveBeenCalledWith("hokusai");
  });
});
