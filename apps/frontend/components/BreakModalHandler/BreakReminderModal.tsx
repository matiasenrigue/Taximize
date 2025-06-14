
import {useTranslations} from "next-intl";
import {ForwardedRef, forwardRef} from "react";
import {Modal, ModalHandle} from "../Modal/Modal";
import {FlexGroup} from "../FlexGroup/FlexGroup";
import {Button} from "../Button/Button";
import {useShiftContext} from "../../contexts/ShiftContext/ShiftContext";

interface BreakReminderModalProps {
    breakModalRef: ModalHandle;
}

export const BreakReminderModal = forwardRef((props: BreakReminderModalProps, ref: ForwardedRef<ModalHandle>) => {
    const {breakModalRef} = props;
    const {pauseShift} = useShiftContext();
    const t = useTranslations('map');

    function takeBreak() {
        pauseShift();
        ref.current.close();
        breakModalRef.current.open();
    }

    return (
        <Modal
            ref={ref}
            title={t("breakReminderModalTitle")}>
            <FlexGroup
                direction={"column"}
                align={"stretch"}>
                <p>{t("breakReminderModalText")}</p>
                <FlexGroup
                    direction={"row"}
                    align={"stretch"}>
                    <Button
                        theme={"secondary"}
                        onClick={() => ref?.current?.close()}>
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