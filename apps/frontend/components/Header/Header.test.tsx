import {expect, test} from "@jest/globals";
import { render, screen } from '@testing-library/react';
import {Header} from './Header';
import {ShiftContextProvider} from "../../contexts/ShiftContext/ShiftContext";

const HeaderWithShiftContext = () => {
    return (
        <ShiftContextProvider>
            <Header/>
        </ShiftContextProvider>
    );
};

describe("Header", () => {
    it("renders an element with role 'banner'", () => {
        render(<HeaderWithShiftContext/>);
        const header = screen.getByRole("banner", {});
        expect(header).toBeInTheDocument();
    });

    it("renders a logo", () => {
        render(<HeaderWithShiftContext/>);
        const logo = screen.getByText("TaxiApp", {});
        expect(logo).toBeInTheDocument();
    });

    it("renders link to account", () => {
        render(<HeaderWithShiftContext/>);
        const account_link = screen.getByRole("link", {name: "Account"});
        expect(account_link).toBeInTheDocument();
        expect(account_link).toHaveAttribute("href", "/account");
    });
});