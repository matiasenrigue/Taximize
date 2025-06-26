import {ForwardedRef, forwardRef} from "react";
import {Modal, ModalHandle} from "../Modal/Modal";
import {useTranslations} from "next-intl";
import {FlexGroup} from "../FlexGroup/FlexGroup";
import {Button} from "../Button/Button";
import {useShift} from "../../contexts/ShiftContext/ShiftContext";

export const ShiftEndModal = forwardRef((props, ref: ForwardedRef<ModalHandle>) => {
    const t = useTranslations('ShiftEndModal');
    const {endShift} = useShift();

    function closeModalAndEndShift() {
        ref?.current?.close();
        endShift();
    }

    return (
        <Modal
            ref={ref}
            title={t("title")}>
            <FlexGroup
                align={"stretch"}>
                <p>
                    {t("text")}
                </p>
                <FlexGroup
                    direction={"row"}
                    align={"stretch"}>
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