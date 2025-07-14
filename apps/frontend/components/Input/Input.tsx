"use client";
/**
 * Custom Input Component 
 * This component is a styled input field with a clear button.
 * It allows users to enter text and clear the input easily.
 * It is designed to be flexible and the width can be customized.
 * * @module Input
 */
import styles from "./input.module.css";
import React, { useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmarkCircle } from "@fortawesome/free-solid-svg-icons";

export interface CustomInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    width?: string | number;
}

export const Input = ({ placeholder = '', width = '100%', value, onChange, ...props }: CustomInputProps) => {
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
        <div 
            className={styles.input_box} 
            style={{ width }}
        >
            <input
                {...props}
                ref={ref}
                className={styles.input}
                type={props.type || 'text'}
                placeholder={placeholder}
                aria-label={placeholder}
                value={value}
                onChange={onChange}
                style={{ flex: 1, paddingRight: value ? 40 : undefined }}
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