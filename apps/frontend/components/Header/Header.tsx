import Link from "next/link";
import styles from "./Header.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faUser} from "@fortawesome/free-solid-svg-icons";
import {ShiftTimer} from "../ShiftTimer/ShiftTimer";
import {FlexGroup} from "../FlexGroup/FlexGroup";

export const Header = () => {

    return (
        <header className={styles.header}>
            <Link
                className={styles.logo}
                href={"/"}>
                Taximize
            </Link>
            <FlexGroup direction={"row"}>
                <ShiftTimer/>
                <Link
                    className={styles.account_link}
                    href={"/account"}
                    aria-label={"Account"}>
                    <FontAwesomeIcon
                        icon={faUser}
                    />
                </Link>
            </FlexGroup>
        </header>
    );
};