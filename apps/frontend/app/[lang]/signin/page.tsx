"use client";

import styles from "./page.module.css";
import { Button } from "../../../components/Button/Button";
import { useState } from "react";
import { Input } from "../../../components/Input/Input"; 
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import api from "../../../lib/axios";
import { setToken } from "../../../lib/token";
import { Message } from "../../../components/Message/Message";

export default function Signin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    // const [loading, setLoading] = useState(false);
    const router = useRouter();
    const [msg, setMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmailValid = emailRegex.test(email);
    const isPasswordValid = password.length >= 8;
    const canSubmit = email && isEmailValid && isPasswordValid

    const t = useTranslations('signin');
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        api.post("/auth/signin", {
                email,
                password
            }).then((response) => {
                // when the status is 200, the response will contain a token
                if (response.data.success === true) {
                setToken(response.data.data.token);
                setMsg({ type: "success", text: response.data.message || t("signinSuccess") });
                // Redirect to home page after successful signin
                router.push("/start-shift");
                } else {
                // when the status is 200, but the response does not contain a token(e.g. invalid credentials)
                    setMsg({ type: "error", text: response.data.message || t("signinFailed") });
                }
            }).catch((err) => {
                // when the status is not 200, the response will contain an error message
                console.error("Signin error:", err);
                if (err.response && err.response.data && err.response.data.error) {
                    setMsg({ type: "error", text: err.response.data.error });
                } else {
                    setMsg({ type: "error", text: t("signinFailed") });
                }
        });
    };

    return (
        <>
            {msg && (
                <Message
                    type={msg.type}
                    text={msg.text}
                    onClose={() => setMsg(null)}
                />
            )}
            <div className={styles.page}>
                <div className={styles.container}>
                    <form className={styles.form_container} onSubmit={handleSubmit} autoComplete="off">
                        <label className={styles.label} htmlFor="email" style={{ color: !isEmailValid && email ? 'var(--color-danger)' : undefined }}>{t("email")}</label>
                        <Input
                            id="email"
                            className={`${styles.input} ${!isEmailValid && email ? 'error' : ''}`}
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

                        <label className={styles.label} htmlFor="password" style={{ color: password && !isPasswordValid ? 'var(--color-danger)' : undefined }}>{t("password")}</label>
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
                                {t("passwordError")}
                            </div>
                        )}

                        <Button
                            className={styles.button}
                            type="submit"
                            theme="primary"
                            disabled={!canSubmit}
                        >
                            {t("signIn")}
                        </Button>
                    </form>
                    <div className={styles.links_container}>
                        <div 
                            className={styles.link} 
                            onClick={() => router.push('/signup')}
                            style={{ cursor: 'pointer' }}
                        >
                            {t("noAccount")}
                        </div>
                        <div 
                            className={styles.link} 
                            onClick={() => router.push('/forgot-password')}
                            style={{ cursor: 'pointer' }}
                        >
                            {t("forgotPassword")}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
