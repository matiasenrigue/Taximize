 "use client"

import styles from "./page.module.css";
import { Button } from "../../../components/Button/Button";
import { useRef, useState } from "react";
import { Input } from "../../../components/Input/Input"; 
import { useRouter } from "next/router";
import { useTranslations } from "next-intl";


export default function Signin() {
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmailValid = emailRegex.test(email);
    const isPasswordValid = password.length >= 8;
    const isPasswordMatch = password === confirmPassword;
    const canSubmit = email && username && isEmailValid && isPasswordValid && isPasswordMatch && !loading;

    const t = useTranslations('signup');
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

                    <label className={styles.label} htmlFor="username">{t("username")}</label>
                    <Input
                        id="username"
                        className={styles.input}
                        type="text"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        required
                    />

                    <label className={styles.label} htmlFor="password">{t("password")}</label>
                    <Input
                        id="password"
                        className={`${styles.input} ${!isPasswordValid && password ? 'error' : ''}`}
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        minLength={8}
                    />

                    <label className={styles.label} htmlFor="confirmPassword" style={{ color: !isPasswordMatch && confirmPassword ? 'var(--color-danger)' : undefined }}>{t("confirmPassword")}</label>
                    <Input
                        id="confirmPassword"
                        className={`${styles.input} ${!isPasswordMatch && confirmPassword ? 'error' : ''}`}
                        type="password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        required
                    />
                    {(!isPasswordMatch && confirmPassword) && (
                        <div className={styles.error_text}>
                            Passwords do not match. Please try again.
                        </div>
                    )}
                    {error && (
                        <div className={styles.error_text}>{error}</div>
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
