import Link from "next/link";
import styles from "./Header.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faUser} from "@fortawesome/free-solid-svg-icons";

export const Header = () => {
    return (
        <header className={styles.header}>
            <Link
                className={styles.logo}
                href={"/"}>
                TaxiApp
            </Link>
            <Link
                className={styles.account_link}
                href={"/account"}
                aria-label={"Account"}>
                <FontAwesomeIcon
                    icon={faUser}
                />
            </Link>
        </header>
    );
};