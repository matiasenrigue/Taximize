import {RideContextProvider, useRide} from "./RideContext";
import {expect} from "@jest/globals";
import {render, screen} from "@testing-library/react";


const RideContextConsumerTest = () => {
    const context = useRide();
    return <div data-testid={"child"}/>;
};

describe("RideContext", () => {
    it("renders without error", () => {
        expect(() => render(<RideContextProvider>
            <RideContextConsumerTest/>
        </RideContextProvider>))
            .not.toThrowError();
    });

    it("throws an error when useRide is used outside of RideContextProvider", () => {
        expect(() => render(<RideContextConsumerTest/>))
            .toThrowError("useRide can only be used within RideContextProvider!");
    });

    it("renders children", () => {
        render(<RideContextProvider>
            <RideContextConsumerTest/>
        </RideContextProvider>);

        const childElement = screen.getByTestId("child", {});
        expect(childElement).toBeInTheDocument();
    });
});