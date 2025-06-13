import {render, screen, act} from "@testing-library/react";
import {TimeInput} from "./TimeInput";
import {expect} from "@jest/globals";


describe("TimeInput", () => {
    it("selects the first input segment when clicking the container", () => {
        render(<TimeInput/>);
        const container = screen.getByTestId("time-input", {});
        const hourSegment = screen.getByTestId("segment-hour", {});
        act(() => container.click());
        expect(document.activeElement).toBe(hourSegment);
    });
});