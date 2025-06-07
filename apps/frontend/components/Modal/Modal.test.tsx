import {Modal} from "./Modal";
import {render, screen} from "@testing-library/react";
import {expect} from "@jest/globals";

describe("Modal", function () {
    it("renders its title", () => {
        const title = "Hello, World!";
        render(<Modal title={title}/>);

        const modal = screen.getByTestId("modal", {});
        expect(modal).toBeInTheDocument();
        expect(modal).toHaveTextContent(title);
    });

    it("is initially hidden", () => {
        render(<Modal/>);

        const modal = screen.getByTestId("modal", {});
        expect(modal).not.toHaveAttribute("open");
        expect(modal).not.toBeVisible();
    });

    /*
    * Because the HTML dialog's showModal() and close() functions are browser APIs that jest does not implement, the
    * correct opening & closing behaviour of the modal component cannot be tested here.
    * */
});