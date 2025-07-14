import React from "react";
import clsx from "clsx";
import styles from "./Label.module.css";


export const Label = (props: React.LabelHTMLAttributes<HTMLLabelElement>) => {
    const {
        children,
        className,
        ...rest
    } = props;

    return (
        <label
            className={clsx(styles.label, className)}
            {...rest}>
            {children}
        </label>
    );
};