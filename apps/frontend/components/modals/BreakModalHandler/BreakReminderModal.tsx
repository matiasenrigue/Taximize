
import {useTranslations} from "next-intl";
import {ForwardedRef, forwardRef, useState} from "react";
import {Modal, ModalHandle} from "../../Modal/Modal";
import {FlexGroup} from "../../FlexGroup/FlexGroup";
import {Button} from "../../Button/Button";
import {useShift} from "../../../contexts/ShiftContext/ShiftContext";
import {DEFAULT_BREAK_DURATION, MINUTE_IN_MILLISECONDS} from "../../../constants/constants";
import {NumberInput} from "../../NumberInput/NumberInput";

export const BreakReminderModal = forwardRef((props, ref: ForwardedRef<ModalHandle>) => {
    const {pauseShift, skipBreak} = useShift();
    const t = useTranslations('BreakReminderModal');
    const [durationInMinutes, setDurationInMinutes] = useState<number>(DEFAULT_BREAK_DURATION / MINUTE_IN_MILLISECONDS);

    function closeModal() {
        if (!ref || typeof ref === "function" || !ref.current)
            return;
        ref.current.close();
    }

    function takeBreakAndCloseModal() {
        const durationInMs = durationInMinutes * MINUTE_IN_MILLISECONDS;
        pauseShift(durationInMs);
        closeModal();
    }

    function skipBreakAndCloseModal() {
        skipBreak();
        closeModal();
    }

    return (
        <Modal
            ref={ref}
            title={t("title")}
            onClose={skipBreak}>
            <FlexGroup
                direction={"column"}
                align={"stretch"}>
                <p>{t("text")}</p>
                <FlexGroup
                    direction={"row"}
                    align={"center"}
                    justify={"start"}>
                    <NumberInput
                        value={durationInMinutes}
                        onChange={(e) => setDurationInMinutes(Number(e.target.value))}
                    />
                    <span>min</span>
                </FlexGroup>
                <FlexGroup
                    direction={"row"}
                    align={"stretch"}>
                    <Button
                        theme={"secondary"}
                        onClick={skipBreakAndCloseModal}>
                        {t("cancelButton")}
                    </Button>
                    <Button
                        onClick={takeBreakAndCloseModal}>
                        {t("confirmButton")}
                    </Button>
                </FlexGroup>
            </FlexGroup>
        </Modal>
    );
});

BreakReminderModal.displayName = "BreakReminderModal";