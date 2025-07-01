import {Switch} from "./Switch";
import {render, act} from "@testing-library/react";
import {expect} from "@jest/globals";


describe("Switch", () => {
    it("calls a function with the correct value when clicked", () => {
        const dummyCallback = jest.fn();
        const handleClick = (e) => dummyCallback(e.target.checked);
        const {container} = render(<Switch onClick={handleClick}/>);

        const switchContainer = container.firstChild as HTMLElement;
        expect(switchContainer).toBeInTheDocument();

        act(() => switchContainer.click());
        expect(dummyCallback).toHaveBeenCalledTimes(1);
        expect(dummyCallback).toHaveBeenCalledWith(true);

        act(() => switchContainer.click());
        expect(dummyCallback).toHaveBeenCalledTimes(2);
        expect(dummyCallback).toHaveBeenCalledWith(false);
    });
});