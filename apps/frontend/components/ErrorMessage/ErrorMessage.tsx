import styles from "./ErrorMessage.module.css";
import {PropsWithChildren} from "react";

export const ErrorMessage = (props: PropsWithChildren) => {
    const {children} = props;

    return (
        <p className={styles.message}>
            {children}
        </p>
    );
};