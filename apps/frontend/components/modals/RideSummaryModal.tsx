import {Modal, ModalHandle} from "../Modal/Modal";
import {FlexGroup} from "../FlexGroup/FlexGroup";
import {Button} from "../Button/Button";
import {useTranslations} from "next-intl";
import {ForwardedRef, forwardRef} from "react";
import {CostInput} from "../CostInput/CostInput";
import {useRide} from "../../contexts/RideContext/RideContext";


export const RideSummaryModal = forwardRef((props, ref: ForwardedRef<ModalHandle>) => {
    const t = useTranslations('RideSummaryModal');
    const {endRide} = useRide();

    function closeModal() {
        if (!ref || typeof ref === "function")
            return;
        ref.current.close();
    }

    function endRideAndCloseModal() {
        endRide();
        closeModal();
    }

    return (
        <Modal
            ref={ref}
            title={t("title")}>
            <FlexGroup
                align={"stretch"}>
                <CostInput/>
                <FlexGroup
                    direction={"row"}
                    align={"stretch"}>
                    <Button
                        theme={"secondary"}
                        onClick={closeModal}>
                        {t("cancelButton")}
                    </Button>
                    <Button
                        onClick={endRideAndCloseModal}>
                        {t("confirmButton")}
                    </Button>
                </FlexGroup>
            </FlexGroup>
        </Modal>
    );
});