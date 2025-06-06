import {render, screen} from "@testing-library/react";
import {Searchbar} from "./Searchbar";
import {expect} from "@jest/globals";


describe("Searchbar",  () => {
    it("renders an input component", () => {
        render(<Searchbar/>);

        const input = document.getElementsByTagName("input")?.[0];
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
});