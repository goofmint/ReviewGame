import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CodeDisplay } from "./CodeDisplay";

describe("CodeDisplay", () => {
  const sampleCode = `function test() {\n  return true;\n}`;

  it("should render code with line numbers", () => {
    render(<CodeDisplay code={sampleCode} language="javascript" />);

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("function test() {")).toBeInTheDocument();
    expect(screen.getByText("return true;")).toBeInTheDocument();
  });

  it("should display language label", () => {
    render(<CodeDisplay code={sampleCode} language="javascript" />);
    expect(screen.getByText("javascript")).toBeInTheDocument();
  });

  it("should call onLineClick when a line is clicked", async () => {
    const handleLineClick = vi.fn();
    const user = userEvent.setup();

    render(
      <CodeDisplay
        code={sampleCode}
        language="javascript"
        onLineClick={handleLineClick}
      />
    );

    const firstLine = screen.getByText("function test() {").closest("div");
    if (firstLine) {
      await user.click(firstLine);
      expect(handleLineClick).toHaveBeenCalledWith(1);
    }
  });

  it("should not call onLineClick when not provided", async () => {
    const user = userEvent.setup();

    render(<CodeDisplay code={sampleCode} language="javascript" />);

    const firstLine = screen.getByText("function test() {").closest("div");
    if (firstLine) {
      await user.click(firstLine);
      // Should not throw error
    }
  });

  it("should handle empty lines", () => {
    const codeWithEmptyLine = "line1\n\nline3";
    render(<CodeDisplay code={codeWithEmptyLine} language="javascript" />);

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
