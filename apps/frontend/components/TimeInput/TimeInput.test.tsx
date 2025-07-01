import {render, screen, act} from "@testing-library/react";
import {TimeInput} from "./TimeInput";
import {expect} from "@jest/globals";
import {userEvent} from "@testing-library/user-event";


describe("TimeInput", () => {
    it("selects the first input segment when clicking the container", () => {
        render(<TimeInput/>);
        const container = screen.getByTestId("time-input", {});
        const hourSegment = screen.getByTestId("segment-hour", {});
        act(() => container.click());
        expect(document.activeElement).toBe(hourSegment);
    });

    it("selects the minute segment after typing two keys in the hour segment", async () => {
        render(<TimeInput/>);
        const container = screen.getByTestId("time-input", {});
        const hourSegment = screen.getByTestId("segment-hour", {});
        const minuteSegment = screen.getByTestId("segment-minute", {});
        act(() => container.click());
        await userEvent.type(hourSegment, "12");
        expect(document.activeElement).toBe(minuteSegment);
    });

    it("selects the minute segment when pressing enter", async () => {
        render(<TimeInput/>);
        const container = screen.getByTestId("time-input", {});
        const hourSegment = screen.getByTestId("segment-hour", {});
        const minuteSegment = screen.getByTestId("segment-minute", {});
        act(() => container.click());
        await userEvent.type(hourSegment, "{enter}");
        expect(document.activeElement).toBe(minuteSegment);
    });

    it("updates the hours", async () => {
        render(<TimeInput/>);
        const container = screen.getByTestId("time-input", {});
        const hourSegment = screen.getByTestId("segment-hour", {});
        act(() => container.click());
        await userEvent.type(hourSegment, "12");
        expect(hourSegment.textContent).toBe("12");
    });

    it("clamps the hours above max value", async () => {
        render(<TimeInput/>);
        const container = screen.getByTestId("time-input", {});
        const hourSegment = screen.getByTestId("segment-hour", {});
        act(() => container.click());
        await userEvent.type(hourSegment, "33");
        expect(hourSegment.textContent).toBe("23");
    });
});