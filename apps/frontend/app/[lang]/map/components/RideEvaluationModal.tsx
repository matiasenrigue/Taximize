import {ForwardedRef, forwardRef} from "react";
import {useTranslations} from "next-intl";
import {Modal, ModalHandle} from "../../../../components/Modal/Modal";
import {FlexGroup} from "../../../../components/FlexGroup/FlexGroup";
import {Button} from "../../../../components/Button/Button";
import {Rating} from "../../../../components/Rating/Rating";
import {useRide} from "../../../../contexts/RideContext/RideContext";


export const RideEvaluationModal = forwardRef((props, ref: ForwardedRef<ModalHandle>) => {
    const t = useTranslations('map');
    const {startRide} = useRide();

    function closeModal() {
        if (!ref || typeof ref === "function")
            return;
        ref.current.close();
    }

    function startRideAndCloseModal() {
        startRide();
        closeModal();
    }

    return (
        <Modal
            ref={ref}
            title={t("startRideModalTitle")}>
            <FlexGroup
                align={"stretch"}>
                <Rating rating={3}/>
                <p>{t("startRideModalText")}</p>
                <FlexGroup
                    direction={"row"}
                    align={"stretch"}>
                    <Button
                        theme={"secondary"}
                        onClick={closeModal}>
                        {t("cancel")}
                    </Button>
                    <Button
                        onClick={startRideAndCloseModal}>
                        {t("startRide")}
                    </Button>
                </FlexGroup>
            </FlexGroup>
        </Modal>
    );
});