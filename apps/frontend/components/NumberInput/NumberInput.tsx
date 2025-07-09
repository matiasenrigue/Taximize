import React from "react";
import styles from "./NumberInput.module.css";
import clsx from "clsx";
import {isCharacterKey} from "../../lib/isCharacterKey";

const FLOAT_REGEX = /^-?(?:\d+|\d*\.\d*)?$/;

export const NumberInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => {
    const {className, ...rest} = props;

    return (
        <input
            {...rest}
            className={clsx(styles.input, className)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                // ignore non-character keys (e.g. shift, alt, ArrowKeys)
                if (!isCharacterKey(e))
                    return;
                // check if new key results in a valid number, else prevent it
                const newValue = e.target.value + "" + e.key;
                if (!FLOAT_REGEX.test(newValue))
                    e.preventDefault();
            }}
            type={'text'}/>
    );
};