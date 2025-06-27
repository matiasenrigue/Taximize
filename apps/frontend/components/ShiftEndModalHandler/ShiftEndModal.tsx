import {ForwardedRef, forwardRef} from "react";
import {Modal, ModalHandle} from "../Modal/Modal";
import {useTranslations} from "next-intl";
import {FlexGroup} from "../FlexGroup/FlexGroup";
import {Button} from "../Button/Button";
import {useShift} from "../../contexts/ShiftContext/ShiftContext";

export const ShiftEndModal = forwardRef((props, ref: ForwardedRef<ModalHandle>) => {
    const t = useTranslations('ShiftEndModal');
    const {endShift, startOvertime} = useShift();

    function closeModalAndEndShift() {
        if (!ref || typeof ref === "function")
            return;
        ref?.current?.close();
        endShift();
    }

    function closeModalAndStartOvertime() {
        if (!ref || typeof ref === "function")
            return;
        ref?.current?.close();
        startOvertime();
    }

    return (
        <Modal
            ref={ref}
            title={t("title")}
            onClose={startOvertime}>
            <FlexGroup
                align={"stretch"}>
                <p>
                    {t("text")}
                </p>
                <FlexGroup
                    direction={"row"}
                    align={"stretch"}>
                    <Button
                        theme={"secondary"}
                        onClick={closeModalAndStartOvertime}>
                        {t("cancelButton")}
                    </Button>
                    <Button
                        theme={"primary"}
                        onClick={closeModalAndEndShift}>
                        {t("confirmButton")}
                    </Button>
                </FlexGroup>
            </FlexGroup>
        </Modal>
    );
});