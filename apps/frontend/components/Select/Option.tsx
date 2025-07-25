"use client";

import React from "react";
import styles from "./Select.module.css";

export const Option = (props: React.OptionHTMLAttributes<HTMLOptionElement>) => {
    const {
        children,
        ...rest
    } = props;

    return (
        <option
            className={styles.option}
            {...rest}>
            {children}
        </option>
    );
};