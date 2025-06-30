import React, {useCallback, useEffect} from "react";

export const useClickOutside = (ref: React.RefObject<HTMLElement|null>, callback: () => void) => {

    const handleClick = useCallback((e: MouseEvent) => {
        if (!ref.current)
            return;
        if (!(e.target instanceof Node))
            return;
        if (!ref.current!.contains(e.target))
            callback();
    }, [callback, ref]);

    useEffect(() => {
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, [handleClick]);
};