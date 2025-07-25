import React, {useEffect, useState} from "react";

interface useHoverProps {
    onHoverStart?: (e: HTMLElementEventMap["mouseover"]) => void;
    onHoverEnd?: (e: HTMLElementEventMap["mouseout"]) => void;
}

export const useHover = (ref: React.RefObject<HTMLElement|null>, props?: useHoverProps): boolean => {
    const {
        onHoverStart,
        onHoverEnd
    } = props ?? {};

    const [isHovered, setIsHovered] = useState<boolean>(false);

    useEffect(() => {
        const element = ref?.current;
        if (!element)
            return;

        const handleHoverStart = (e: HTMLElementEventMap["mouseover"]) => {
            setIsHovered(true);
            if (onHoverStart)
                onHoverStart(e);
        };
        const handleHoverEnd = (e: HTMLElementEventMap["mouseout"]) => {
            setIsHovered(false);
            if (onHoverEnd)
                onHoverEnd(e);
        };

        element.addEventListener("mouseover", handleHoverStart);
        element.addEventListener("mouseout", handleHoverEnd);
        return () => {
            element.removeEventListener("mouseover", handleHoverStart);
            element.removeEventListener("mouseout", handleHoverEnd);
        }
    }, [onHoverStart, onHoverEnd]);

    return isHovered;
};