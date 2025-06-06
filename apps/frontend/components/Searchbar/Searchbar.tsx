"use client"

import styles from "./Searchbar.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faMagnifyingGlass, faXmarkCircle} from "@fortawesome/free-solid-svg-icons";
import {useRef} from "react";

export interface SearchbarProps extends React.InputHTMLAttributes<HTMLInputElement>{

}

export const Searchbar = (props: SearchbarProps) => {
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
                {...props}
                ref={ref}
                className={styles.input}
                type={"text"}
                placeholder={"Search Address..."}
                aria-label={"Address"}/>
            <button
                className={styles.button_clear}
                onClick={clearInput}
                aria-label={"Clear Input"}>
                <FontAwesomeIcon icon={faXmarkCircle}/>
            </button>
        </div>
    );
};