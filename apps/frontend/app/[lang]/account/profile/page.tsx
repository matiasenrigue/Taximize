"use client"

import React, { useState, useRef } from "react";
import styles from "./page.module.css";
import { useTranslations } from "next-intl";
import { MenuItem } from "../../../../components/MenuItem/MenuItem";
import { useUser } from "../../../../hooks/useUser";
import { Modal, ModalHandle } from "../../../../components/Modal/Modal";
import { Button } from "../../../../components/Button/Button";
import { Message, MessageType } from "../../../../components/Message/Message";
import BackButton from "../../../../components/BackButton/BackButton";


export default function Profile() {
    const { user, error, signOut, deleteUser } = useUser();
    const email = user?.email || "example@gmail.com";
    const username = user?.username || "John Doe";
    const t = useTranslations('profile');
    const [msg, setMsg] = useState<{ type: MessageType; message: string } | null>(null);

    // manage the delete modal visibility
    const deleteModalRef = useRef<ModalHandle>(null!);
    // function to open the modal
    const handleOpenDeleteModal = () => {
        deleteModalRef.current?.open();
    };

    // function to close it from the parent if needed
    const handleCloseDeleteModal = () => {
        deleteModalRef.current?.close();
    };
    const handleDeleteClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        // Here you would typically handle the account deletion logic
        console.log("Account deletion confirmed");
        // Call the deleteUser function from useUser hook
        const result = await deleteUser();
        // Close the modal after confirmation
        if (result) {
            setMsg(result);
        } 
        handleCloseDeleteModal();
    }
     if (error) {
        const errorMessage = error || 'Failed to fetch user data';
        console.error(errorMessage);
    }

    // manage the sign out modal visibility
    const signOutModalRef = useRef<ModalHandle>(null!);
    // function to open the modal
    const handleOpenSignOutModal = () => {
        signOutModalRef.current?.open();
    };
    // function to close it from the parent if needed
    const handleCloseSignOutModal = () => {
        signOutModalRef.current?.close();
    };

    const handleSignOutClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        // Here you would typically handle the sign out logic
        console.log("Sign out confirmed");
        // Call the sign out function from useUser hook
        const result = await signOut();
        if (result) {
            setMsg(result);
        }
        handleCloseSignOutModal();
    }


    return (
        <>
        {msg && 
            <Message 
                type={msg.type}
                text={msg.message}
                onClose={() => setMsg(null)}/>
        }
        <div className={styles.page}>
             <div className={styles.container}>
                <div className={styles.backButtonContainer}>
                    <BackButton href="/account" pageName="Account" />
                </div>
                 <h2 className={styles.title}>{t('profile')}</h2>
                    <div className={styles.profileInfo}>
                        {/* personal information */}
                        <section className={styles.section}>
                            <h3 className={styles.sectionTitle}>{t('personalInformation')}</h3>
                            <div>
                                <MenuItem href="/account/profile/change-username">
                                    <span>{t('username')}</span>
                                    <div className={styles.itemValue}>
                                        <span>{username}</span>
                                    </div>
                                </MenuItem>
                            </div>
                            <div>
                                <MenuItem href="/account/profile/change-email">
                                    <span>{t('email')}</span>
                                    <div className={styles.itemValue}>
                                        <span>{email}</span>
                                    </div>
                                </MenuItem>
                            </div>
                        </section>
                        <section className={styles.section}>
                            <h3 className={styles.sectionTitle}>{t('manageAccount')}</h3>
                            <div>
                                <MenuItem href="/account/profile/change-password">
                                    <span>{t('changePassword')}</span>
                                </MenuItem>
                            </div>
                            <div onClick={handleOpenDeleteModal}>
                                <MenuItem href="#">
                                    <span>{t('deleteAccount')}</span>
                                </MenuItem>
                            </div>
                            <div onClick={handleOpenSignOutModal}>
                                <MenuItem href="#">
                                    <span>{t('signout')}</span>
                                </MenuItem>
                            </div>
                        </section>
                        {/* modal for sign out  */}
                        <Modal 
                            ref={signOutModalRef} 
                            title={t('signout')}
                        >
                            <div className={styles.modalContent}>
                                <p className={styles.warning}>{t('signOutWarning')}</p>
                                <div className={styles.modalActions}>
                                    <Button onClick={handleCloseSignOutModal} theme="primary">{t('cancel')}</Button>
                                    <Button onClick={handleSignOutClick} theme="danger">{t('confirm')}</Button>
                                </div>
                            </div>
                        </Modal>
                        {/* modal for delete account */}
                        <Modal 
                            ref={deleteModalRef} 
                            title={t('deleteAccount')}
                        >
                            <div className={styles.modalContent}>
                                <p className={styles.warning}>{t('deleteAccountWarning')}</p>
                                <div className={styles.modalActions}>
                                    <Button onClick={handleCloseDeleteModal} theme="primary">{t('cancel')}</Button>
                                    <Button onClick={handleDeleteClick} theme="danger">{t('confirm')}</Button>
                                </div>
                            </div>
                        </Modal>
                    </div>
             </div>
        </div>
        </>
    );
}