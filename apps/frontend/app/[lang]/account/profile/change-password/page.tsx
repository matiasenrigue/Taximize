"use client"

import React, { useState, useRef } from "react";
import styles from "./page.module.css";
import { useUser } from "../../../../../hooks/useUser";
import { Input } from "../../../../../components/Input/Input";
import { Button } from "../../../../../components/Button/Button";
import { useTranslations } from "next-intl";
import { Message, MessageType } from "../../../../../components/Message/Message";
import { useRouter } from "next/navigation";

export default function changePassword() {
    const { user, error, updateUserPassword } = useUser();
    const [msg, setMsg] = useState<{ type: MessageType ; message: string } | null>(null);
    const t = useTranslations('changePassword');
    const router = useRouter();
    const [newPassword, setNewPassword] = useState("");

    const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (newPassword && newPassword.length >= 8) {
            const result = await updateUserPassword(newPassword);
            if (result) {
                setMsg(result);
                router.push('/account/profile');
            }
        }
    };

    return (
        <>
        {msg && <Message 
            type={msg.type} 
            text={msg.message} 
            onClose={() => setMsg(null)}
        />}
        <div className={styles.page}>
            <div className={styles.container}>
                <div className={styles.profileInfo}>
                <h2 className={styles.title}>{t('changeUsername')}</h2>
                        <section className={styles.section}>
                            <div className={styles.menu}>
                                <Input
                                    type="text"
                                    value={newPassword}
                                    placeholder={t('newUsernamePlaceholder')}
                                    className={styles.input}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                                <div className={styles.modalActions}>
                                    <Button
                                        onClick={() => router.push('/account/profile')}
                                        theme="secondary"
                                    >
                                        {t('cancel')}
                                    </Button>
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={!newPassword || newPassword.length < 8}
                                        theme="primary"
                                    >
                                        {t('saveChanges')}
                                    </Button>
                                </div>
                            </div>
                        </section>
                </div>
            </div>
        </div>
        </>
    );
}