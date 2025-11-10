import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReviewInput } from "./ReviewInput";

describe("ReviewInput", () => {
  it("should render textarea with value", () => {
    render(
      <ReviewInput
        value="Test review"
        onChange={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    const textarea = screen.getByPlaceholderText("コードのレビューをここに入力してください...");
    expect(textarea).toHaveValue("Test review");
  });

  it("should call onChange when text is entered", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(
      <ReviewInput
        value=""
        onChange={handleChange}
        onSubmit={vi.fn()}
      />
    );

    const textarea = screen.getByPlaceholderText("コードのレビューをここに入力してください...");
    await user.type(textarea, "New review");

    expect(handleChange).toHaveBeenCalled();
  });

  it("should call onSubmit when submit button is clicked", async () => {
    const handleSubmit = vi.fn();
    const user = userEvent.setup();

    render(
      <ReviewInput
        value="Some review"
        onChange={vi.fn()}
        onSubmit={handleSubmit}
      />
    );

    const submitButton = screen.getByText("レビューを送信");
    await user.click(submitButton);

    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });

  it("should disable submit button when value is empty", () => {
    render(
      <ReviewInput
        value=""
        onChange={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    const submitButton = screen.getByText("レビューを送信");
    expect(submitButton).toBeDisabled();
  });

  it("should disable submit button when value is only whitespace", () => {
    render(
      <ReviewInput
        value="   "
        onChange={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    const submitButton = screen.getByText("レビューを送信");
    expect(submitButton).toBeDisabled();
  });

  it("should enable submit button when value is not empty", () => {
    render(
      <ReviewInput
        value="Review text"
        onChange={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    const submitButton = screen.getByText("レビューを送信");
    expect(submitButton).not.toBeDisabled();
  });

  it("should disable all inputs when disabled prop is true", () => {
    render(
      <ReviewInput
        value="Review"
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        disabled
      />
    );

    const textarea = screen.getByPlaceholderText("コードのレビューをここに入力してください...");
    const submitButton = screen.getByText("レビューを送信");

    expect(textarea).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });
});
