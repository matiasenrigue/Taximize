
import {useTranslations} from "next-intl";
import {ForwardedRef, forwardRef, Ref} from "react";
import {Modal, ModalHandle} from "../Modal/Modal";
import {FlexGroup} from "../FlexGroup/FlexGroup";
import {Button} from "../Button/Button";
import {useShift} from "../../contexts/ShiftContext/ShiftContext";

interface BreakReminderModalProps {
    breakModalRef: Ref<ModalHandle>;
}

export const BreakReminderModal = forwardRef((props: BreakReminderModalProps, ref: ForwardedRef<ModalHandle>) => {
    const {breakModalRef} = props;
    const {pauseShift, skipBreak} = useShift();
    const t = useTranslations('map');

    function closeModal() {
        if (!ref || typeof ref === "function")
            return;
        ref.current.close();
    }

    function openBreakModal() {
        if (!breakModalRef || typeof breakModalRef === "function")
            return;
        breakModalRef.current.open();
    }

    function takeBreak() {
        pauseShift();
        closeModal();
        openBreakModal();
    }

    function skipBreakAndCloseModal() {
        skipBreak();
        closeModal();
    }

    return (
        <Modal
            ref={ref}
            title={t("breakReminderModalTitle")}
            onClose={skipBreak}>
            <FlexGroup
                direction={"column"}
                align={"stretch"}>
                <p>{t("breakReminderModalText")}</p>
                <FlexGroup
                    direction={"row"}
                    align={"stretch"}>
                    <Button
                        theme={"secondary"}
                        onClick={skipBreakAndCloseModal}>
                        {t("cancel")}
                    </Button>
                    <Button
                        onClick={takeBreak}>
                        {t("takeBreak")}
                    </Button>
                </FlexGroup>
            </FlexGroup>
        </Modal>
    );
});