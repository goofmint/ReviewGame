import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RequirementsDisplay } from "./RequirementsDisplay";

describe("RequirementsDisplay", () => {
  const sampleRequirements = "要件1\n要件2\n要件3";

  it("should render requirements text", () => {
    render(<RequirementsDisplay requirements={sampleRequirements} />);

    expect(screen.getByText("要件1")).toBeInTheDocument();
    expect(screen.getByText("要件2")).toBeInTheDocument();
    expect(screen.getByText("要件3")).toBeInTheDocument();
  });

  it("should display title", () => {
    render(<RequirementsDisplay requirements={sampleRequirements} />);
    expect(screen.getByText("要件")).toBeInTheDocument();
  });

  it("should call onRequirementClick when requirement is clicked", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(
      <RequirementsDisplay
        requirements={sampleRequirements}
        onRequirementClick={handleClick}
      />
    );

    await user.click(screen.getByText("要件1"));
    expect(handleClick).toHaveBeenCalledWith("要件1");
  });

  it("should not call onRequirementClick for empty lines", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    const requirementsWithEmptyLine = "要件1\n\n要件3";

    render(
      <RequirementsDisplay
        requirements={requirementsWithEmptyLine}
        onRequirementClick={handleClick}
      />
    );

    const emptyLine = screen.getAllByRole("paragraph").find(
      (p) => p.textContent === ""
    );

    if (emptyLine) {
      await user.click(emptyLine);
      expect(handleClick).not.toHaveBeenCalled();
    }
  });

  it("should handle multiline requirements", () => {
    const multilineRequirements = "要件1の詳細説明\n要件2の詳細説明";
    render(<RequirementsDisplay requirements={multilineRequirements} />);

    expect(screen.getByText("要件1の詳細説明")).toBeInTheDocument();
    expect(screen.getByText("要件2の詳細説明")).toBeInTheDocument();
  });
});
