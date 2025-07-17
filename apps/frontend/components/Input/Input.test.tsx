import { render, screen } from "@testing-library/react";
import { Input } from "./Input";
import { expect } from "@jest/globals";
import userEvent from "@testing-library/user-event";

describe("Input", () => {
  it("renders an input component", () => {
    render(
      <Input
        value=""
        onChange={() => {}}
        placeholder="Test Input"
        type="text"
      />
    );

    const input = screen.getByRole("textbox", {});
    expect(input).toBeInTheDocument();
  });

  it("renders with a placeholder", () => {
    const placeholderText = "Enter text here";
    render(<Input placeholder={placeholderText} />);

    const input = screen.getByPlaceholderText(placeholderText, {});
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("placeholder", placeholderText);
  });

  it("pressing the x button should clear the input", async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();

    render(
      <Input
        value="Test"
        onChange={handleChange}
        placeholder="Clearable Input"
        type="text"
      />
    );

    const input = screen.getByRole("textbox", {});
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue("Test");

    const clearButton = screen.getByRole("button", { name: "Clear Input" });
    expect(clearButton).toBeInTheDocument();

    await user.click(clearButton);

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({ target: expect.objectContaining({ value: "" }) })
    );
  });
});
