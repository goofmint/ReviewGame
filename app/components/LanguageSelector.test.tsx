import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { LanguageSelector } from "./LanguageSelector";
import { renderWithRouter } from "../../test/test-utils";

describe("LanguageSelector", () => {
  it("should render available languages", () => {
    renderWithRouter(
      <LanguageSelector availableLanguages={["javascript", "python"]} />
    );

    expect(screen.getByText("JavaScript")).toBeInTheDocument();
    expect(screen.getByText("Python")).toBeInTheDocument();
  });

  it("should not render unavailable languages", () => {
    renderWithRouter(
      <LanguageSelector availableLanguages={["javascript"]} />
    );

    expect(screen.getByText("JavaScript")).toBeInTheDocument();
    expect(screen.queryByText("Python")).not.toBeInTheDocument();
    expect(screen.queryByText("Flutter")).not.toBeInTheDocument();
  });

  it("should render language cards as links", () => {
    renderWithRouter(
      <LanguageSelector availableLanguages={["javascript"]} />
    );

    const link = screen.getByText("JavaScript").closest("a");
    expect(link).toHaveAttribute("href", "/javascript");
  });

  it("should handle all three languages", () => {
    renderWithRouter(
      <LanguageSelector
        availableLanguages={["javascript", "python", "flutter"]}
      />
    );

    expect(screen.getByText("JavaScript")).toBeInTheDocument();
    expect(screen.getByText("Python")).toBeInTheDocument();
    expect(screen.getByText("Flutter")).toBeInTheDocument();
  });
});
