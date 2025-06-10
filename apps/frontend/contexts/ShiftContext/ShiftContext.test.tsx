import {render} from "@testing-library/react";
import {ShiftContextProvider, useShiftContext} from "./ShiftContext";
import {expect} from "@jest/globals";

const ShiftContextConsumerTest = () => {
    const context = useShiftContext();
    return null;
};

describe("ShiftContext", () => {
    it("renders without error", () => {
        expect(() => render(<ShiftContextProvider>
            <ShiftContextConsumerTest/>
        </ShiftContextProvider>))
            .not.toThrowError();
    });

    it("throws an error when useShiftContext is used outside of ShiftContextProvider", () => {
        expect(() => render(<ShiftContextConsumerTest/>))
            .toThrowError('useShiftContext can only be used within <ShiftContextProvider>!');
    });
});