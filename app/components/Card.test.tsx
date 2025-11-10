import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Card } from "./Card";

describe("Card", () => {
  it("should render children", () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText("Card content")).toBeInTheDocument();
  });

  it("should render as div by default", () => {
    const { container } = render(<Card>Content</Card>);
    const card = container.firstChild;
    expect(card?.nodeName).toBe("DIV");
  });

  it("should render as button when onClick is provided", () => {
    const handleClick = vi.fn();
    const { container } = render(<Card onClick={handleClick}>Content</Card>);
    const card = container.firstChild;
    expect(card?.nodeName).toBe("BUTTON");
  });

  it("should call onClick when clicked", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Card onClick={handleClick}>Click me</Card>);

    await user.click(screen.getByText("Click me"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should apply hoverable styles when hoverable is true", () => {
    const { container } = render(<Card hoverable>Content</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("hover:shadow-lg");
    expect(card.className).toContain("hover:scale-105");
  });

  it("should not apply hoverable styles when hoverable is false", () => {
    const { container } = render(<Card hoverable={false}>Content</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).not.toContain("hover:shadow-lg");
  });

  it("should apply custom className", () => {
    const { container } = render(<Card className="custom-class">Content</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("custom-class");
  });
});
