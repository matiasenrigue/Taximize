import {ForwardedRef, forwardRef} from "react";
import {useTranslations} from "next-intl";
import {Modal, ModalHandle} from "../Modal/Modal";
import {FlexGroup} from "../FlexGroup/FlexGroup";
import {Button} from "../Button/Button";
import {Rating} from "../Rating/Rating";
import {useRide} from "../../contexts/RideContext/RideContext";


export const RideEvaluationModal = forwardRef((props, ref: ForwardedRef<ModalHandle>) => {
    const t = useTranslations('RideEvaluationModal');
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
            title={t("title")}>
            <FlexGroup
                align={"stretch"}>
                <Rating rating={3}/>
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
                        onClick={startRideAndCloseModal}>
                        {t("confirmButton")}
                    </Button>
                </FlexGroup>
            </FlexGroup>
        </Modal>
    );
});