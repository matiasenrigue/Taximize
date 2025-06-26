"use client"

import styles from "./Modal.module.css";
import React, {ForwardedRef, forwardRef, useCallback, useImperativeHandle, useRef} from "react";
import {faXmark} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

export type ModalHandle = {
    open: () => void;
    close: () => void;
};

interface ModalProps extends React.PropsWithChildren {
    title?: string;
}

export const Modal = forwardRef<ModalHandle>((props: ModalProps, ref: ForwardedRef<ModalHandle>) => {
    const {
        title,
        children
    } = props;
    const dialogRef = useRef<HTMLDialogElement>(null!);

    const open = useCallback(() => {
        dialogRef.current?.showModal();
    }, []);

    const close = useCallback(() => {
        dialogRef.current?.close();
    }, []);

    useImperativeHandle(ref, () => ({
        test: "hello world",
        open,
        close
    }));

    return (
        <dialog
            ref={dialogRef}
            className={styles.dialog}
            data-testid={"modal"}>
            <button
                className={styles.button_close}
                onClick={close}
                aria-label={"close"}>
                <FontAwesomeIcon icon={faXmark}/>
            </button>
            {title && <h4 className={styles.heading}>{title}</h4>}
            {children}
        </dialog>
    );
});