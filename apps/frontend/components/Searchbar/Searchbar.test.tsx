import {render, screen} from "@testing-library/react";
import {Searchbar} from "./Searchbar";
import {expect} from "@jest/globals";
import {userEvent} from "@testing-library/user-event";


describe("Searchbar",  () => {
    it("renders an input component", () => {
        render(<Searchbar/>);

        const input = screen.getByRole("textbox", {name: "Address"});
        expect(input).toBeInTheDocument();
    });

    it("pressing the x button should clear the input", () => {
        render(<Searchbar defaultValue={"Test"}/>);

        const input = screen.getByRole("textbox", {name: "Address"});
        expect(input).toBeInTheDocument();
        expect(input).toHaveValue("Test");

        const clear_button = screen.getByRole("button", {name: "Clear Input"});
        expect(clear_button).toBeInTheDocument();

        clear_button.click();
        expect(input).toHaveValue("");
    });

    it("calls onConfirm", async () => {
        const dummyCallback = jest.fn();
        render(<Searchbar onConfirm={dummyCallback}/>);

        const input = screen.getByRole("textbox", {name: "Address"}) as HTMLInputElement;
        expect(input).toBeInTheDocument();

        await userEvent.type(input, "Hello World{enter}");
        expect(dummyCallback).toHaveBeenCalledTimes(1);
        expect(dummyCallback).toHaveBeenCalledWith("Hello World");
    });
});