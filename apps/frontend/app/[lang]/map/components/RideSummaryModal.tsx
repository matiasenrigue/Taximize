import {Modal, ModalHandle} from "../../../../components/Modal/Modal";
import {FlexGroup} from "../../../../components/FlexGroup/FlexGroup";
import {Button} from "../../../../components/Button/Button";
import {useTranslations} from "next-intl";
import {ForwardedRef, forwardRef} from "react";
import {CostInput} from "../../../../components/CostInput/CostInput";
import {useRide} from "../../../../contexts/RideContext/RideContext";


export const RideSummaryModal = forwardRef((props, ref: ForwardedRef<ModalHandle>) => {
    const t = useTranslations('map');
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
            title={t("endRideModalTitle")}>
            <FlexGroup
                align={"stretch"}>
                <CostInput/>
                <FlexGroup
                    direction={"row"}
                    align={"stretch"}>
                    <Button
                        theme={"secondary"}
                        onClick={closeModal}>
                        {t("cancel")}
                    </Button>
                    <Button
                        onClick={endRideAndCloseModal}>
                        {t("endRide")}
                    </Button>
                </FlexGroup>
            </FlexGroup>
        </Modal>
    );
});