import React, {PropsWithChildren} from "react";
import {ButtonTheme} from "./Button";
import clsx from "clsx";
import styles from "./Button.module.css";
import Link, {LinkProps} from "next/link";

export interface LinkButtonProps extends LinkProps, PropsWithChildren {
    theme?: ButtonTheme;
    elevated?: boolean;
}

export const LinkButton = (props: LinkButtonProps) => {
    const {
        children,
        theme = 'primary',
        elevated = false,
        ...rest
    } = props;

    return (
        <Link
            {...rest}
            className={clsx(
                styles.button,
                elevated && styles.button_elevated,
                theme === 'primary' && styles.button_primary,
                theme === 'secondary' && styles.button_secondary,
                theme === 'danger' && styles.button_danger
            )}>
            {children}
        </Link>
    );
}