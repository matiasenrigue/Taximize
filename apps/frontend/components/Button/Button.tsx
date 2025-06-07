import styles from "./Button.module.css";
import clsx from "clsx";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>{
    theme?: 'primary' | 'secondary';
    elevated?: boolean;
}

export const Button = (props: ButtonProps) => {
    const {
        children,
        theme = 'primary',
        elevated = false,
        ...rest
    } = props;

    return (
        <button
            {...rest}
            className={clsx(
                styles.button,
                elevated && styles.button_elevated,
                theme === 'primary' && styles.button_primary,
                theme === 'secondary' && styles.button_secondary
            )}>
            {children}
        </button>
    );
};