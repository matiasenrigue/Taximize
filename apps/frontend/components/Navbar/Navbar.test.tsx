import {expect, test} from "@jest/globals";
import { render, screen } from '@testing-library/react';
import {Navbar} from './Navbar';

test('renders Navbar links', () => {
    render(<Navbar/>);
    // disable type-checking, intellij shows an incorrect error for screen.getByText()
    // @ts-ignore
    const mapElement = screen.getByText("Map");
    expect(mapElement).toBeInTheDocument();
});