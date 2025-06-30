
import styles from "./OptionsMenu.module.css";
import {faEllipsis} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import React, {PropsWithChildren, useCallback, useRef, useState} from "react";
import {useClickOutside} from "../../hooks/useClickOutside/useClickOutside";
import clsx from "clsx";


export const OptionsMenu = (props: PropsWithChildren) => {
    const {children} = props;
    const ref = useRef<HTMLDivElement>(null!);
    const [isOpen, setIsOpen] = useState<boolean>(false);

    const handleClickOutside = useCallback(() => setIsOpen(false), []);
    useClickOutside(ref, handleClickOutside);

    return (
        <div
            ref={ref}
            className={styles.container}>
            <button
                className={styles.button}
                aria-label={"Options"}
                data-testid={"menu-button"}
                onClick={() => setIsOpen(prev => !prev)}>
                <FontAwesomeIcon icon={faEllipsis}/>
            </button>
            <div
                className={styles.options_container}
                data-open={isOpen}
                data-testid={"menu-container"}>
                {children}
            </div>
        </div>
    );
};

export const MenuOption = (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
    const {children, className, ...rest} = props;
    return (
        <button
            {...rest}
            className={clsx(
                styles.option,
                className
            )}>
            {children}
        </button>
    );
};