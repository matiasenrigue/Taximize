import {act, render, screen} from "@testing-library/react";
import {expect} from "@jest/globals";
import {Option, Select} from "./Select";


describe("Select", () => {
    it("renders the placeholder", () => {
        const placeholder = "Select me";
        render(<Select placeholder={placeholder}>
            <Option value={"a"}>A</Option>
        </Select>);

        const select = screen.getByRole("button", {});
        expect(select).toHaveTextContent(placeholder);
    });

    it("renders the selected option", () => {
        render(<Select>
            <Option value={"a"} selected>Option A</Option>
            <Option value={"b"}>Option B</Option>
        </Select>);

        const select = screen.getByRole("button", {});
        expect(select).toHaveTextContent("Option A");

        const optionB = screen.getByRole("option", {name: "Option B"});
        expect(optionB).toBeInTheDocument();

        act(() => optionB.click());
        expect(select).toHaveTextContent("Option B");
    });

    it("throws an error when <Option> is used outside of <Select>", () => {
        expect(() => render(<Option value={"test"}>Test</Option>))
            .toThrowError('<Option> can only be used as a child of <Select>!');
    });

    it("is only controllable by its children", () => {
        render(<>
            <Select>
                <Option value={"a1"} selected>A.1</Option>
                <Option value={"a2"}>A.2</Option>
            </Select>
            <Select>
                <Option value={"b1"} selected>B.1</Option>
                <Option value={"b2"}>B.2</Option>
            </Select>
        </>);

        const selectA = screen.getByRole("button", {name: "A.1"});
        expect(selectA).toBeInTheDocument();
        expect(selectA).toHaveTextContent("A.1");

        const selectB = screen.getByRole("button", {name: "B.1"});
        expect(selectB).toBeInTheDocument();
        expect(selectB).toHaveTextContent("B.1");

        const optionB2 = screen.getByRole("option", {name: "B.2"});
        expect(optionB2).toBeInTheDocument();

        act(() => optionB2.click());
        expect(selectA).toHaveTextContent("A.1");
        expect(selectB).toHaveTextContent("B.2");
    });
});