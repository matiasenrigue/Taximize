import styles from "./FlexGroup.module.css";
import React from "react";
import clsx from "clsx";

export interface ButtonGroupProps extends React.PropsWithChildren {
    direction?: "row" | "column";
    align?: "start" | "end" | "center" | "stretch";
    justify?: "start" | "end" | "center";
}

export const FlexGroup = (props: ButtonGroupProps) => {
    const {
        children,
        direction = "column",
        align = "center",
        justify = "start",
    } = props;

    return (
        <div
            className={clsx(
                styles.flex,
                styles[`_direction_${direction}`],
                styles[`_align_${align}`],
                styles[`_justify_${justify}`],
            )}>
            {children}
        </div>
    );
};