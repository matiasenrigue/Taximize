import {expect, test} from "@jest/globals";
import { render, screen } from '@testing-library/react';
import {Header} from './Header';

describe("Header", () => {
    it("renders an element with role 'banner'", () => {
        render(<Header/>);
        const header = screen.getByRole("banner", {});
        expect(header).toBeInTheDocument();
    });

    it("renders a logo", () => {
        render(<Header/>);
        const logo = screen.getByText("TaxiApp", {});
        expect(logo).toBeInTheDocument();
    });

    it("renders link to account", () => {
        render(<Header/>);
        const account_link = screen.getByRole("link", {name: "Account"});
        expect(account_link).toBeInTheDocument();
        expect(account_link).toHaveAttribute("href", "/account");
    });
});