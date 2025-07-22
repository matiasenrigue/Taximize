"use client";
/**
 * Custom Input Component 
 * This component is a styled input field with a clear button.
 * It allows users to enter text and clear the input easily.
 * * @module Input
 */
import styles from "./Input.module.css";
import React, { useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmarkCircle } from "@fortawesome/free-solid-svg-icons";

export const Input = ({ placeholder = '', value, onChange, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => {
    const ref = useRef<HTMLInputElement>(null!);

    function focusInput() {
        ref.current.focus();
    }

    function clearInput() {
        if (onChange) {
            onChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>);
        }
        focusInput();
    }

    return (
        <div className={styles.input_box}>
            <input
                {...props}
                ref={ref}
                className={styles.input}
                type={props.type || 'text'}
                placeholder={placeholder}
                aria-label={placeholder}
                value={value}
                onChange={onChange}
                style={{ paddingRight: value ? 40 : 'unset' }}
            />
            {value && (
                <button
                    type="button"
                    className={styles.button_clear}
                    onClick={clearInput}
                    aria-label="Clear Input"
                    tabIndex={-1}
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}
                >
                    <FontAwesomeIcon icon={faXmarkCircle} />
                </button>
            )}
        </div>
    );
};