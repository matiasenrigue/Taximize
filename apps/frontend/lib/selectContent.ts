
export const selectContent = (element: HTMLElement) => {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(element);
    if (!selection)
        return;
    selection.removeAllRanges();
    selection.addRange(range);
}

export const removeAllSelections = () => {
    const selection = window.getSelection();
    if (!selection)
        return;
    selection.removeAllRanges();
};

export const moveCursorToEnd = (element: HTMLElement) => {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    if (!selection)
        return;
    selection.removeAllRanges();
    selection.addRange(range);
};