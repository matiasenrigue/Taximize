import Link from "next/link";
import styles from "./Navbar.module.css";

export const Navbar = () => {
    return (
        <nav className={styles.nav}>
            <ul className={styles.list}>
                <li className={styles.item}>
                    <Link
                        className={styles.item}
                        href={"/"}>
                        Home
                    </Link>
                </li>
                <li className={styles.item}>
                    <Link
                        className={styles.item}
                        href={"/map"}>
                        Map
                    </Link>
                </li>
            </ul>
        </nav>
    )
};