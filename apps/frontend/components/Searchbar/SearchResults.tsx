import styles from "./SearchResults.module.css";
import React, {PropsWithChildren} from "react";

export const SearchResults = (props: PropsWithChildren) => {
    const {children} = props;

    if (!children || children.length === 0)
        return null;
    return (
        <div className={styles.container}>
            {children}
        </div>
    );
};

interface SearchResultsProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, PropsWithChildren {
    value: string;
}

export const SearchResult = (props: SearchResultsProps) => {
    const {
        value,
        children,
        ...rest
    } = props;

    return (
        <button
            className={styles.item}
            {...rest}>
            {children ?? value}
        </button>
    );
}