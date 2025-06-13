"use client"

import styles from "./Searchbar.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faMagnifyingGlass, faXmarkCircle} from "@fortawesome/free-solid-svg-icons";
import {InputHTMLAttributes, useRef} from "react";

export interface SearchbarProps extends InputHTMLAttributes<HTMLInputElement>{
    onConfirm?: (value: string) => void;
}

export const Searchbar = (props: SearchbarProps) => {
    const {
        placeholder = "Search Address...",
        onKeyDown,
        onBlur,
        onConfirm,
        ...rest
    } = props;
    const ref = useRef<HTMLInputElement>(null!);

    function focusInput() {
        ref.current.focus();
    }

    function clearInput() {
        ref.current.value = "";
        focusInput();
    }

    return (
        <div className={styles.searchbar}>
            <div
                onClick={focusInput}
                className={styles.icon}>
                <FontAwesomeIcon icon={faMagnifyingGlass}/>
            </div>
            <input
                {...rest}
                ref={ref}
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
                onClick={clearInput}
                aria-label={"Clear Input"}>
                <FontAwesomeIcon icon={faXmarkCircle}/>
            </button>
        </div>
    );
};