import {act, render, screen} from "@testing-library/react";
import {Button} from "../../components/Button/Button";
import {expect} from "@jest/globals";
import {useRef} from "react";
import {useClickOutside} from "./useClickOutside";

const UseClickOutsideTest = ({onClick}) => {
    const ref = useRef(null!);
    useClickOutside(ref, onClick);

    return (
        <div
            data-testid={"outside"}>
            <div
                ref={ref}
                data-testid={"inside"}>
                test
            </div>
        </div>
    );
};

describe("useClickOutside", () => {
    it("calls callback on click outside", () => {
        const dummyCallback = jest.fn();
        render(<UseClickOutsideTest onClick={dummyCallback}/>);
        const outsideDiv = screen.getByTestId("outside", {});

        act(() => outsideDiv.click());
        expect(dummyCallback).toHaveBeenCalledTimes(1);
    });

    it("does not call callback on click inside", () => {
        const dummyCallback = jest.fn();
        render(<UseClickOutsideTest onClick={dummyCallback}/>);
        const outsideDiv = screen.getByTestId("inside", {});

        act(() => outsideDiv.click());
        expect(dummyCallback).not.toHaveBeenCalled();
    });
});