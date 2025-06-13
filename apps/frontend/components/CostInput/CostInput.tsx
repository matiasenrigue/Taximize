import styles from "./CostInput.module.css";

export const CostInput = () => {
    return (
        <input
            className={styles.input}
            type={"number"}
            placeholder={"00.00€"}/>
    );
};