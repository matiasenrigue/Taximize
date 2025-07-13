import {Modal, ModalHandle} from "../Modal/Modal";
import {FlexGroup} from "../FlexGroup/FlexGroup";
import {Button} from "../Button/Button";
import {useTranslations} from "next-intl";
import {ForwardedRef, forwardRef, useEffect, useState} from "react";
import {useRide} from "../../contexts/RideContext/RideContext";
import {MINUTE_IN_MILLISECONDS} from "../../constants/constants";
import {NumberInput} from "../NumberInput/NumberInput";
import {Label} from "../Label/Label";


export const RideSummaryModal = forwardRef((props, ref: ForwardedRef<ModalHandle>) => {
    const t = useTranslations('RideSummaryModal');
    const {endRide, fare, distance, duration} = useRide();
    const [editedFare, setEditedFare] = useState<string>((fare / 100).toFixed(2));

    useEffect(() => {
        setEditedFare((fare / 100).toFixed(2));
    }, [fare]);

    function closeModal() {
        if (!ref || typeof ref === "function")
            return;
        ref.current.close();
    }

    function endRideAndCloseModal() {
        const fare = Math.round(parseFloat(editedFare) * 100);
        endRide(fare);
        closeModal();
    }

    return (
        <Modal
            ref={ref}
            title={t("title")}>
            <FlexGroup
                align={"stretch"}>
                <span>Distance: {distance / 1000} km</span>
                <span>Duration: {Math.floor(duration / MINUTE_IN_MILLISECONDS)} min</span>
                <Label>Fare</Label>
                <NumberInput
                    placeholder={"0.00"}
                    value={editedFare}
                    onChange={(e) => {
                        setEditedFare(e.target.value);
                    }}
                    onBlur={(e) => {
                        setEditedFare(parseFloat(e.target.value).toFixed(2));
                    }}
                />
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