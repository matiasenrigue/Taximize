"use client"

import styles from "./page.module.css";
import { Button } from "../../../components/Button/Button";
import { useRef, useState } from "react";
import { Input } from "../../../components/Input/Input"; 
import { useRouter } from "next/router";
import { useTranslations } from "next-intl";


export default function Signin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    // const [error, setError] = useState("");
    // const [loading, setLoading] = useState(false);
    

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmailValid = emailRegex.test(email);
    const isPasswordValid = password.length >= 8;
    const canSubmit = email && isEmailValid && isPasswordValid

    const t = useTranslations('signin');
    const handleSubmit = async (e: React.FormEvent) => {
         e.preventDefault();

    };

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <form className={styles.form_container} onSubmit={handleSubmit} autoComplete="off">
                    <label className={styles.label} htmlFor="email">{t("email")}</label>
                    <Input
                        id="email"
                        className={styles.input}
                        type="email"
                        placeholder="example@gmail.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                    />

                    <label className={styles.label} htmlFor="password">{t("password")}</label>
                    <Input
                        id="password"
                        className={`${styles.input} ${ password && isPasswordValid ? 'error' : ''}`}
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        minLength={8}
                    />
                    { password && !isPasswordValid && (
                        <div className={styles.error_text}>
                            {t("error")}
                        </div>
                    )}

                    <Button
                        className={styles.button}
                        type="submit"
                        theme="primary"
                        disabled={!canSubmit}
                    >
                        {t("signUp")}
                    </Button>
                </form>
            </div>
        </div>
    )
}
