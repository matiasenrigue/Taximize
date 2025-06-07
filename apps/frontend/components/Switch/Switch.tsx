import React, {useId} from "react";
import styles from "./Switch.module.css";

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {

}

export const Switch = (props: SwitchProps) => {
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