import React, {useId} from "react";
import styles from "./Switch.module.css";

export const Switch = (props: React.InputHTMLAttributes<HTMLInputElement>) => {
    const defaultId = useId();
    const {
        id = defaultId
    } = props;

    return (
        <label
            className={styles.container}
            htmlFor={id}>
            <input
                {...props}
                id={id}
                className={styles.checkbox}
                type={'checkbox'}/>
            <span
                className={styles.switch}/>
        </label>
    );
};