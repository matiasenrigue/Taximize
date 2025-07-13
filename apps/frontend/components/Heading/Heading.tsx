import {PropsWithChildren} from "react";
import styles from "./Heading.module.css";

export const Heading = (props: PropsWithChildren) => {
    const {children} = props;

    return (
        <h1 className={styles.heading}>
            {children}
        </h1>
    );
}