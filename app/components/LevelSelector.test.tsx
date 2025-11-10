import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { LevelSelector } from "./LevelSelector";
import type { ProgressState } from "~/types/problem";
import { renderWithRouter } from "../../test/test-utils";

describe("LevelSelector", () => {
  it("should render all levels", () => {
    const progress: ProgressState = {};

    renderWithRouter(
      <LevelSelector
        language="javascript"
        levels={[1, 2, 3]}
        progress={progress}
      />
    );

    expect(screen.getByText("Level 1")).toBeInTheDocument();
    expect(screen.getByText("Level 2")).toBeInTheDocument();
    expect(screen.getByText("Level 3")).toBeInTheDocument();
  });

  it("should show level 1 as unlocked by default", () => {
    const progress: ProgressState = {};

    renderWithRouter(
      <LevelSelector
        language="javascript"
        levels={[1]}
        progress={progress}
      />
    );

    const level1Card = screen.getByText("Level 1").closest("a");
    expect(level1Card).toBeInTheDocument();
  });

  it("should show locked levels without link", () => {
    const progress: ProgressState = {};

    renderWithRouter(
      <LevelSelector
        language="javascript"
        levels={[1, 2]}
        progress={progress}
      />
    );

    const level2Text = screen.getByText((content, element) => {
      return element?.textContent === "Level 2" && element?.tagName === "H3";
    });

    const level2Card = level2Text.closest("a");
    expect(level2Card).not.toBeInTheDocument();
  });

  it("should display best score when available", () => {
    const progress: ProgressState = {
      javascript: {
        1: { unlocked: true, bestScore: 85, attempts: 1 },
      },
    };

    renderWithRouter(
      <LevelSelector
        language="javascript"
        levels={[1]}
        progress={progress}
      />
    );

    expect(screen.getByText("最高スコア: 85点")).toBeInTheDocument();
  });

  it("should show unlocked levels as clickable", () => {
    const progress: ProgressState = {
      javascript: {
        1: { unlocked: true, bestScore: 85, attempts: 1 },
        2: { unlocked: true, attempts: 0 },
      },
    };

    renderWithRouter(
      <LevelSelector
        language="javascript"
        levels={[1, 2]}
        progress={progress}
      />
    );

    const level1Link = screen.getByText("Level 1").closest("a");
    const level2Link = screen.getByText((content, element) => {
      return element?.textContent === "Level 2" && element?.tagName === "H3";
    })?.closest("a");

    expect(level1Link).toHaveAttribute("href", "/javascript/1");
    expect(level2Link).toHaveAttribute("href", "/javascript/2");
  });

  it("should display lock message for locked levels", () => {
    const progress: ProgressState = {};

    renderWithRouter(
      <LevelSelector
        language="javascript"
        levels={[1, 2]}
        progress={progress}
      />
    );

    expect(
      screen.getByText("前のレベルで70点以上を獲得してアンロック")
    ).toBeInTheDocument();
  });
});
