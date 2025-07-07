"use client"

import React, { useState, useRef } from "react";
import styles from "./page.module.css";
import { useUser } from "../../../../../hooks/useUser";
import { Input } from "../../../../../components/Input/Input";
import { Button } from "../../../../../components/Button/Button";
import { useTranslations } from "next-intl";
import { Message, MessageType } from "../../../../../components/Message/Message";
import { useRouter } from "next/navigation";

export default function changeUsername() {
    const { user, error, updateUsername } = useUser();
    const [msg, setMsg] = useState<{ type: MessageType ; message: string } | null>(null);
    const t = useTranslations('changeUsername');
    const router = useRouter();
    const [newUsername, setNewUsername] = useState(user?.username || "");

    const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (newUsername && newUsername !== user?.username) {
            const result = await updateUsername(newUsername);
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
                                    value={newUsername}
                                    placeholder={t('newUsernamePlaceholder')}
                                    className={styles.input}
                                    onChange={(e) => setNewUsername(e.target.value)}
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
                                        disabled={!newUsername || newUsername === user?.username}
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