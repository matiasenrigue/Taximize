import '@testing-library/jest-dom';

// runs once before all tests
beforeAll(() => {
    if (typeof HTMLDialogElement !== "undefined") {
        HTMLDialogElement.prototype.showModal = HTMLDialogElement.prototype.showModal || jest.fn();
        HTMLDialogElement.prototype.close = HTMLDialogElement.prototype.close || jest.fn();
    } else {
        // In case JSDOM doesn't define HTMLDialogElement at all
        // (rare but happens in older Jest versions)
        // Define a mock class globally
        global.HTMLDialogElement = class {
            showModal() {}
            close() {}
        } as any;
    }
});