import styles from "./page.module.css";
import Image from 'next/image';
import {useTranslations} from "next-intl";
import {LinkButton} from "../../components/Button/LinkButton";
import {Select, Option} from "../../components/Select/Select";

export default function Home() {
    const t = useTranslations("home");

    return (
        <div className={styles.page}>
            <div className={styles.hero_container}>
                <Image
                    className={styles.hero_image}
                    fill={true}
                    src={"/images/hero.jpg"}
                    alt={"Taxis on a Road"}/>
            </div>
            <h1 className={styles.hero_title}>{t("title")}</h1>
            <LinkButton href={"/start-shift"}>To app</LinkButton>
        </div>
    );
}
