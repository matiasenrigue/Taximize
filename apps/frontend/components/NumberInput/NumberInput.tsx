import React from "react";
import styles from "./NumberInput.module.css";
import clsx from "clsx";

export const NumberInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => {
    const {className, ...rest} = props;

    return (
        <input
            {...rest}
            className={clsx(styles.input, className)}
            type={'number'}/>
    );
};