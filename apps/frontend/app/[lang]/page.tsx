import styles from "./page.module.css";
import Link from "next/link";

export default function Home() {
    return (
        <div className={styles.page}>
            <h2>Home</h2>
            <Link href={"/start-shift"}>To app</Link>
        </div>
    );
}
