import {render, screen} from "@testing-library/react";
import {Button} from "./Button";
import {expect} from "@jest/globals";


describe("Button", () => {
    it("renders children", () => {
        render(<Button>Confirm</Button>);
        const button = screen.getByRole("button", {name: "Confirm"});
        expect(button).toBeInTheDocument();
    })
});