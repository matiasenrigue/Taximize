import {ForwardedRef, forwardRef} from "react";
import {Modal, ModalHandle} from "../../Modal/Modal";
import {FlexGroup} from "../../FlexGroup/FlexGroup";
import {Button} from "../../Button/Button";
import {useTranslations} from "next-intl";
import {useShift} from "../../../contexts/ShiftContext/ShiftContext";


export const StartBreakModal = forwardRef((props, ref: ForwardedRef<ModalHandle>) => {
    const {pauseShift} = useShift();
    const t = useTranslations('StartBreakModal');

    function closeModal() {
        if (!ref || typeof ref === "function")
            return;
        ref.current.close();
    }

    function takeBreakAndCloseModal() {
        pauseShift();
        closeModal();
    }


    return (
        <Modal
            ref={ref}
            title={t("title")}>
            <FlexGroup
                direction={"column"}
                align={"stretch"}>
                <p>{t("text")}</p>
                <FlexGroup
                    direction={"row"}
                    align={"stretch"}>
                    <Button
                        theme={"secondary"}
                        onClick={closeModal}>
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