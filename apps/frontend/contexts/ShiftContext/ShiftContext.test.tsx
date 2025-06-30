import {render, screen} from "@testing-library/react";
import {ShiftContextProvider, useShift} from "./ShiftContext";
import {expect} from "@jest/globals";
import {UserLocationContextProvider} from "../UserLocationContext/UserLocationContext";

const ShiftContextConsumerTest = () => {
    const context = useShift();
    return <div data-testid={"child"}/>;
};

describe("ShiftContext", () => {
    it("renders without error", () => {
        expect(() => render(
            <ShiftContextProvider>
                <ShiftContextConsumerTest/>
            </ShiftContextProvider>))
            .not.toThrowError();
    });

    it("throws an error when useShiftContext is used outside of ShiftContextProvider", () => {
        expect(() => render(<ShiftContextConsumerTest/>))
            .toThrowError('useShiftContext can only be used within ShiftContextProvider!');
    });

    it("renders children", () => {
        render(<ShiftContextProvider>
            <ShiftContextConsumerTest/>
        </ShiftContextProvider>);

        const childElement = screen.getByTestId("child", {});
        expect(childElement).toBeInTheDocument();
    });
});