"use client"

import styles from "./Select.module.css";
import React, {useCallback, useRef, useState, createContext, useContext, useEffect, useId} from "react";
import {useClickOutside} from "../../hooks/useClickOutside/useClickOutside";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faChevronDown} from "@fortawesome/free-solid-svg-icons";
import clsx from "clsx";

interface SelectContextValue {
    onClick?: (value, label) => void;
}

const SelectContext = createContext<SelectContextValue|null>(null);

interface SelectProps extends React.PropsWithChildren {
    elevated?: boolean;
    placeholder?: string;
}

export const Select = (props: SelectProps) => {
    const {
        elevated = false,
        placeholder = "Select an option...",
        children,
    } = props;
    const [value, setValue] = useState<string|null>(null);
    const [label, setLabel] = useState<string|null>(null);
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const ref = useRef<HTMLDivElement>(null!);
    const optionContainerId = useId();

    const handleClickOutside = useCallback(() => setIsOpen(false), []);
    useClickOutside(ref, handleClickOutside);

    const selectOption = (value: string, label: string) => {
        setValue(value);
        setLabel(label);
        setIsOpen(false);
    };

    return (
        <div
            className={styles.container}
            ref={ref}>
            <button
                className={clsx(
                    styles.select_button,
                    elevated && styles.select_button_elevated,
                )}
                onClick={() => setIsOpen(prev => !prev)}
                aria-haspopup={"listbox"}
                aria-expanded={isOpen}
                aria-controls={optionContainerId}>
                <span className={styles.select_value}>
                    {value
                        ? label
                        : <span className={styles.placeholder}>{placeholder}</span>}
                </span>
                <div className={styles.select_icon}>
                    <FontAwesomeIcon
                        icon={faChevronDown}/>
                </div>
            </button>
            <div
                className={styles.options_container}
                data-open={isOpen}
                role={"listbox"}>
                <SelectContext.Provider value={{onClick: selectOption}}>
                    {children}
                </SelectContext.Provider>
            </div>
        </div>
    );
};

interface OptionProps extends React.PropsWithChildren {
    value: string;
    selected?: boolean;
}

export const Option = (props: OptionProps) => {
    const {
        value,
        selected = false,
        children,
    } = props;
    const context = useContext(SelectContext);

    if (!context)
        throw new Error('Option can only be used as a child of Select!');

    useEffect(() => {
        if (selected)
            context!.onClick!(value, children);
    }, []);

    return (
        <button
            className={styles.option}
            onClick={() => context!.onClick!(value, children)}
            role={"option"}>
            {children}
        </button>
    );
};