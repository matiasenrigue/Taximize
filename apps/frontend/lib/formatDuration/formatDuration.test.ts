import {expect} from "@jest/globals";
import {formatDuration} from "./formatDuration";

describe("formatDuration", () => {
    it("formats hours and minutes", () => {
        const result = formatDuration(1000 * 60 * 63);
        expect(result).toBe("1:03");
    });

    it("floors seconds", () => {
        const result = formatDuration((1000 * 60 * 60 * 21) + 5);
        expect(result).toBe("21:00");
    });
});