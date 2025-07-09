import {RideContextProvider, useRide} from "./RideContext";
import {expect} from "@jest/globals";
import {render, screen} from "@testing-library/react";
import {UserLocationContextProvider} from "../UserLocationContext/UserLocationContext";
import {ShiftContextProvider} from "../ShiftContext/ShiftContext";
import {PropsWithChildren} from "react";

const RideContextTestWrapper = (props: PropsWithChildren) => {
    const {children} = props;
    return (
        <UserLocationContextProvider>
            <ShiftContextProvider>
                <RideContextProvider>
                    {children}
                </RideContextProvider>
            </ShiftContextProvider>
        </UserLocationContextProvider>
    )
}

const RideContextTestConsumer = () => {
    const context = useRide();
    return <div data-testid={"child"}/>;
};

describe("RideContext", () => {
    it("renders without error", () => {
        expect(() => render(<RideContextTestWrapper>
            <RideContextTestConsumer/>
        </RideContextTestWrapper>))
            .not.toThrowError();
    });

    it("throws an error when useRide is used outside of RideContextProvider", () => {
        expect(() => render(<RideContextTestConsumer/>))
            .toThrowError("useRide can only be used within RideContextProvider!");
    });

    it("renders children", () => {
        render(<RideContextTestWrapper>
            <RideContextTestConsumer/>
        </RideContextTestWrapper>);

        const childElement = screen.getByTestId("child", {});
        expect(childElement).toBeInTheDocument();
    });
});