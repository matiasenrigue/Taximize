import {MenuOption, OptionsMenu} from "./OptionsMenu";
import {act, render, screen} from "@testing-library/react";
import {expect} from "@jest/globals";

describe("OptionsMenu", () => {
    it("is initially closed", () => {
        render(<OptionsMenu>
            <MenuOption>Test</MenuOption>
        </OptionsMenu>);

        const button = screen.getByTestId("menu-button", {});
        const container = screen.getByTestId("menu-container", {});
        expect(button).toBeInTheDocument();
        expect(container).toBeInTheDocument();
        expect(container).toHaveAttribute("data-open", "false");
    });

    it("opens on click", () => {
        render(<OptionsMenu>
            <MenuOption>Test</MenuOption>
        </OptionsMenu>);

        const button = screen.getByTestId("menu-button", {});
        const container = screen.getByTestId("menu-container", {});
        act(() => button.click());
        expect(container).toHaveAttribute("data-open", "true");
    });

    it("closes on click outside", () => {
        render(<div data-testid={"outside"}>
            <OptionsMenu>
                <MenuOption>Test</MenuOption>
            </OptionsMenu>
        </div>);

        const outside = screen.getByTestId("outside", {});
        const button = screen.getByTestId("menu-button", {});
        const container = screen.getByTestId("menu-container", {});

        act(() => {
            button.click();
            outside.click();
        });
        expect(container).toHaveAttribute("data-open", "false");
    });
});