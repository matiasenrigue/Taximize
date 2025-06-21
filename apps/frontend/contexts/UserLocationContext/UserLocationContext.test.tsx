import {render} from "@testing-library/react";
import {expect} from "@jest/globals";
import {UserLocationContextProvider, useUserLocationContext} from "./UserLocationContext";

const UserLocationContextConsumerTest = () => {
    const context = useUserLocationContext();
    return null;
};

describe("UserLocationContext", () => {
    it("renders without error", () => {
        expect(() => render(<UserLocationContextProvider>
            <UserLocationContextConsumerTest/>
        </UserLocationContextProvider>))
            .not.toThrowError();
    });

    it("throws an error when useUserLocationContext is used outside of UserLocationContextProvider", () => {
        expect(() => render(<UserLocationContextConsumerTest/>))
            .toThrowError("useUserLocationContext can only be used within <UserLocationContextProvider>!");
    });
});