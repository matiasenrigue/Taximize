import {ForwardedRef, forwardRef} from "react";
import {useTranslations} from "next-intl";
import {Modal, ModalHandle} from "../../../../components/Modal/Modal";
import {FlexGroup} from "../../../../components/FlexGroup/FlexGroup";
import {Button} from "../../../../components/Button/Button";
import {useShiftContext} from "../../../../contexts/ShiftContext/ShiftContext";
import {Rating} from "../../../../components/Rating/Rating";


export const RideEvaluationModal = forwardRef((props, ref: ForwardedRef<ModalHandle>) => {
    const t = useTranslations('map');
    const {startRide} = useShiftContext();

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
                        onClick={() => ref?.current?.close()}>
                        {t("cancel")}
                    </Button>
                    <Button
                        onClick={() => {
                            startRide();
                            ref?.current?.close();
                        }}>
                        {t("startRide")}
                    </Button>
                </FlexGroup>
            </FlexGroup>
        </Modal>
    );
});