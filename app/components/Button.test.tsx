import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./Button";

describe("Button", () => {
  it("should render children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("should call onClick when clicked", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click me</Button>);

    await user.click(screen.getByText("Click me"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should not call onClick when disabled", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(
      <Button onClick={handleClick} disabled>
        Click me
      </Button>
    );

    await user.click(screen.getByText("Click me"));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("should apply primary variant styles by default", () => {
    render(<Button>Primary</Button>);
    const button = screen.getByText("Primary");
    expect(button.className).toContain("bg-blue-600");
  });

  it("should apply secondary variant styles", () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByText("Secondary");
    expect(button.className).toContain("bg-gray-200");
  });

  it("should apply success variant styles", () => {
    render(<Button variant="success">Success</Button>);
    const button = screen.getByText("Success");
    expect(button.className).toContain("bg-green-600");
  });

  it("should apply danger variant styles", () => {
    render(<Button variant="danger">Danger</Button>);
    const button = screen.getByText("Danger");
    expect(button.className).toContain("bg-red-600");
  });

  it("should apply custom className", () => {
    render(<Button className="custom-class">Button</Button>);
    const button = screen.getByText("Button");
    expect(button.className).toContain("custom-class");
  });
});
