import {expect} from "@jest/globals";
import {calculateDistance} from "./calculateDistance";

describe("calculateDistance", () => {
    it("is +/- 1 meters correct on 100 meters along the latitude", () => {
        const position1 = {lat: 40.712800, lng: -74.006000};
        const position2 = {lat: 40.713698, lng: -74.006000};
        const distance = calculateDistance(position1, position2);

        expect(distance).toBeCloseTo(100., 0)
    });
});