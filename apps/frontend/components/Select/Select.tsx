"use client";

import React from "react";
import styles from "./Select.module.css";


export const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => {
    const {children, ...rest} = props;

    return (
        <select
            className={styles.select_button}
            {...rest}>
            {children}
        </select>
    );
};