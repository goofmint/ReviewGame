import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { ResultView } from "./ResultView";
import { renderWithRouter } from "../../test/test-utils";

describe("ResultView", () => {
  it("should display score", () => {
    renderWithRouter(
      <ResultView
        score={85}
        passed={true}
        review="Great review"
        language="javascript"
        level={1}
      />
    );

    expect(screen.getByText("85点")).toBeInTheDocument();
  });

  it("should display passed message when score >= 70", () => {
    renderWithRouter(
      <ResultView
        score={75}
        passed={true}
        review="Good review"
        language="javascript"
        level={1}
      />
    );

    expect(
      screen.getByText("合格！次のレベルがアンロックされました")
    ).toBeInTheDocument();
  });

  it("should display failed message when score < 70", () => {
    renderWithRouter(
      <ResultView
        score={65}
        passed={false}
        review="Needs improvement"
        language="javascript"
        level={1}
      />
    );

    expect(
      screen.getByText("不合格。もう一度挑戦してください")
    ).toBeInTheDocument();
  });

  it("should display user review", () => {
    const review = "This is my detailed review of the code.";
    renderWithRouter(
      <ResultView
        score={80}
        passed={true}
        review={review}
        language="javascript"
        level={1}
      />
    );

    expect(screen.getByText(review)).toBeInTheDocument();
  });

  it("should show retry button", () => {
    renderWithRouter(
      <ResultView
        score={50}
        passed={false}
        review="Review"
        language="javascript"
        level={1}
      />
    );

    expect(screen.getByText("もう一度挑戦")).toBeInTheDocument();
  });

  it("should show next level button when passed", () => {
    renderWithRouter(
      <ResultView
        score={80}
        passed={true}
        review="Review"
        language="javascript"
        level={1}
      />
    );

    expect(screen.getByText("次のレベルへ")).toBeInTheDocument();
  });

  it("should not show next level button when failed", () => {
    renderWithRouter(
      <ResultView
        score={60}
        passed={false}
        review="Review"
        language="javascript"
        level={1}
      />
    );

    expect(screen.queryByText("次のレベルへ")).not.toBeInTheDocument();
  });

  it("should show back to language selection button", () => {
    renderWithRouter(
      <ResultView
        score={75}
        passed={true}
        review="Review"
        language="javascript"
        level={1}
      />
    );

    expect(screen.getByText("言語選択に戻る")).toBeInTheDocument();
  });

  it("should display Phase 1 indicator", () => {
    renderWithRouter(
      <ResultView
        score={85}
        passed={true}
        review="Review"
        language="javascript"
        level={1}
      />
    );

    expect(
      screen.getByText("Phase 1: 静的評価モード（LLM評価は未実装）")
    ).toBeInTheDocument();
  });
});
