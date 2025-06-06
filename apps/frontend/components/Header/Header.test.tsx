import {expect, test} from "@jest/globals";
import { render, screen } from '@testing-library/react';
import {Header} from './Header';

describe("Header", () => {
    it("renders an element with role 'banner'", () => {
        render(<Header/>);
        // @ts-ignore
        const header = screen.getByRole("banner");
        expect(header).toBeInTheDocument();
    });

    it("renders a logo", () => {
        render(<Header/>);
        // @ts-ignore
        const logo = screen.getByText("TaxiApp");
        expect(logo).toBeInTheDocument();
    });

    it("renders link to account", () => {
        render(<Header/>);
        // @ts-ignore
        const account_link = screen.getByRole("link", {name: /account/i});
        expect(account_link).toBeInTheDocument();
    });
});