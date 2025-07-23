 "use client"

import styles from "./page.module.css";
import { Button } from "../../../components/Button/Button";
import React, { useState } from "react";
import { Input } from "../../../components/Input/Input"; 
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import Message from "../../../components/Message/Message";
import api from "../../../lib/axios";
import { EMAIL_REGEX } from "../../../constants/constants";
import clsx from "clsx";


export default function Signup() {
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [msg, setMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);
    const router = useRouter();

    const isEmailValid = EMAIL_REGEX.test(email);
    const isPasswordValid = password.length >= 8;
    const isPasswordMatch = password === confirmPassword;
    const canSubmit = email && username && isEmailValid && isPasswordValid && isPasswordMatch;

    const t = useTranslations('signup');
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        api.post("/auth/signup", {
            email,
            username,
            password
        }).then((response) => { 
            // when the status is 200, the response will contain a token
            setMsg({type: "success", text: response.data.message || t("signupSuccess")});
            // Redirect to signin page after successful signup
            router.push("/signin");
        }
        ).catch((err) => {
            // when the status is not 200, the response will contain an error message
            console.warn("Signup error:", err);
            if (err.response?.data?.error) {
                setMsg({type: "error", text: err.response.data.error});
            } else {
                setMsg({type: "error", text: t("signUpError")});
            }
        })       
    };


    return (
        <>
            { msg && (<Message 
                type={msg.type}
                text={msg.text}
                onClose={() => {}}
            />
            )}
        <div className={styles.page}>
            <div className={styles.container}>
                <form className={styles.form_container} onSubmit={handleSubmit} autoComplete="off">
                    <label className={styles.label} htmlFor="email" style={{ color: !isEmailValid && email ? 'var(--color-danger)' : 'unset' }}>{t("email")}</label>
                    <Input
                        id="email"
                        className={clsx(styles.input, !isEmailValid && email && 'error')}
                        type="email"
                        placeholder="example@gmail.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                    />
                    { email && !isEmailValid && (
                        <div className={styles.error_text}>
                             {t("emailError")}
                        </div>
                    )}

                    <label className={styles.label} htmlFor="username">{t("username")}</label>
                    <Input
                        id="username"
                        className={styles.input}
                        type="text"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        required
                    />

                    <label className={styles.label} htmlFor="password" style={{ color: !isPasswordValid && password ? 'var(--color-danger)' : 'unset' }}>{t("password")}</label>
                    <Input
                        id="password"
                        className={clsx(styles.input, !isPasswordValid && password && 'error')}
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        minLength={8}
                    />
                    { password && !isPasswordValid && (
                        <div className={styles.error_text}>
                            {t("passwordError")}
                        </div>
                    )}

                    <label className={styles.label} htmlFor="confirmPassword" style={{ color: !isPasswordMatch && confirmPassword ? 'var(--color-danger)' : 'unset' }}>{t("confirmPassword")}</label>
                    <Input
                        id="confirmPassword"
                        className={clsx(styles.input, !isPasswordMatch && confirmPassword && 'error')}
                        type="password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        required
                    />
                    {(!isPasswordMatch && confirmPassword) && (
                        <div className={styles.error_text}>
                            {t("passwordMatchError")}
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
                <div className={styles.links_container}>
                    <Link href="/signin" className={styles.link}>
                        {t("alreadyHaveAccount")}
                    </Link>
                </div>
                
            </div>
        </div>
    </>
    )
}
