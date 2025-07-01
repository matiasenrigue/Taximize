"use client"

import styles from "./Modal.module.css";
import React, {forwardRef, useCallback, useEffect, useImperativeHandle, useRef} from "react";
import {faXmark} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

export type ModalHandle = {
    open: () => void;
    close: () => void;
};

interface ModalProps extends React.PropsWithChildren {
    title?: string;
    className?: string;
    titleStyle?: React.CSSProperties;
}

export const Modal = forwardRef<ModalHandle, ModalProps>((props, ref) => {
    const {
        title,
        children,
        className,
        titleStyle
    } = props;
    const dialogRef = useRef<HTMLDialogElement>(null!);

    const open = useCallback(() => {
        dialogRef.current?.showModal();
    }, []);

    const close = useCallback(() => {
        dialogRef.current?.close();
    }, []);

    useImperativeHandle(ref, () => ({
        open,
        close
    }));

    return (
        <dialog
            ref={dialogRef}
            className={`${styles.dialog} ${className || ''}`}
            data-testid={"modal"}>
            <button
                className={styles.button_close}
                onClick={close}
                aria-label={"close"}>
                <FontAwesomeIcon icon={faXmark}/>
            </button>
            {title && <h4 className={styles.heading} style={titleStyle}>{title}</h4>}
            {children}
        </dialog>
    );
});