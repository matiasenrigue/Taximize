import {ForwardedRef, forwardRef, useCallback, useEffect, useState} from "react";
import {Modal, ModalHandle} from "../../Modal/Modal";
import {useTranslations} from "next-intl";
import {FlexGroup} from "../../FlexGroup/FlexGroup";
import {Button} from "../../Button/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faClock} from "@fortawesome/free-solid-svg-icons";
import {useShift} from "../../../contexts/ShiftContext/ShiftContext";
import {formatDuration} from "../../../lib/formatDuration/formatDuration";

export const BreakModal = forwardRef((props, ref: ForwardedRef<ModalHandle>) => {
    const t = useTranslations('BreakModal');
    const {isPaused, continueShift, getRemainingBreakDuration} = useShift();
    const [remainingDuration, setRemainingDuration] = useState(() => getRemainingBreakDuration());

    const safeOpenModal = useCallback(() => {
        if (!ref || typeof ref === "function")
            return;
        ref.current.open();
    }, []);

    const safeCloseModal = useCallback(() => {
        if (!ref || typeof ref === "function")
            return;
        ref.current.close();
    }, []);

    function endBreak() {
        safeCloseModal();
        continueShift();
    }

    useEffect(() => {
        if (!isPaused) {
            safeCloseModal();
            return;
        }
        safeOpenModal();
        setRemainingDuration(getRemainingBreakDuration());
        const intervalId = setInterval(() => {
            setRemainingDuration(getRemainingBreakDuration());
        }, 1000);

        return () => clearInterval(intervalId);
    }, [isPaused, getRemainingBreakDuration, safeCloseModal, safeOpenModal]);

    return (
        <Modal
            ref={ref}
            title={t("title")}
            onClose={continueShift}>
            <FlexGroup
                direction={"column"}
                align={"stretch"}>
                <FlexGroup direction={"row"}>
                    <FontAwesomeIcon icon={faClock}/>
                    <span>
                        {formatDuration(remainingDuration, {
                            hours: false,
                            minutes: true,
                            seconds: true
                        })}
                    </span>
                </FlexGroup>
                <FlexGroup
                    direction={"row"}
                    align={"stretch"}>
                    <Button
                        theme={(remainingDuration > 0 ? "secondary" : "primary")}
                        onClick={endBreak}>
                        {t(remainingDuration > 0 ? "endEarlyButton" : "endButton")}
                    </Button>
                </FlexGroup>
            </FlexGroup>
        </Modal>
    );
});