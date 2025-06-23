"use client"

import styles from "./Searchbar.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faMagnifyingGlass, faXmarkCircle} from "@fortawesome/free-solid-svg-icons";
import {ForwardedRef, forwardRef, InputHTMLAttributes, useImperativeHandle, useRef} from "react";

export interface SearchbarProps extends InputHTMLAttributes<HTMLInputElement>{
    onConfirm?: (value: string) => void;
    onClear?: () => void;
}

export interface SearchbarHandle {
    focus: () => void;
    blur: () => void;
    clear: () => void;
    setValue: (value) => void;
}

export const Searchbar = forwardRef((props: SearchbarProps, ref: ForwardedRef<SearchbarHandle>) => {
    const {
        placeholder = "Search Address...",
        onKeyDown,
        onBlur,
        onConfirm,
        onClear,
        ...rest
    } = props;
    const inputRef = useRef<HTMLInputElement>(null!);

    function focus() {
        inputRef.current.focus();
    }

    function blur() {
        inputRef.current.blur();
    }

    function clear() {
        inputRef.current.value = "";
        focus();
        if (onClear) onClear();
    }

    function setValue(value) {
        inputRef.current.value = value;
    }

    useImperativeHandle(ref, () => ({
        focus,
        blur,
        clear,
        setValue
    }));

    return (
        <div className={styles.searchbar}>
            <div
                onClick={focus}
                className={styles.icon}>
                <FontAwesomeIcon icon={faMagnifyingGlass}/>
            </div>
            <input
                {...rest}
                ref={inputRef}
                className={styles.input}
                type={"text"}
                placeholder={placeholder}
                aria-label={"Address"}
                onBlur={(e) => {
                    if (onBlur) onBlur(e);
                    if (onConfirm) onConfirm(e.target.value);
                }}
                onKeyDown={(e) => {
                    if (onKeyDown) onKeyDown(e);
                    if (onConfirm && e.key === "Enter") onConfirm(e.target.value);
                }}/>
            <button
                className={styles.button_clear}
                onClick={clear}
                aria-label={"Clear Input"}>
                <FontAwesomeIcon icon={faXmarkCircle}/>
            </button>
        </div>
    );
});