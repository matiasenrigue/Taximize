import {ForwardedRef, forwardRef, useState} from "react";
import {Modal, ModalHandle} from "../../Modal/Modal";
import {FlexGroup} from "../../FlexGroup/FlexGroup";
import {Button} from "../../Button/Button";
import {useTranslations} from "next-intl";
import {useShift} from "../../../contexts/ShiftContext/ShiftContext";
import {NumberInput} from "../../NumberInput/NumberInput";
import {DEFAULT_BREAK_DURATION, MINUTE_IN_MILLISECONDS} from "../../../constants/constants";


export const StartBreakModal = forwardRef((props, ref: ForwardedRef<ModalHandle>) => {
    const {pauseShift} = useShift();
    const t = useTranslations('StartBreakModal');
    const [durationInMinutes, setDurationInMinutes] = useState<number>(DEFAULT_BREAK_DURATION / MINUTE_IN_MILLISECONDS);

    function closeModal() {
        if (!ref || typeof ref === "function")
            return;
        ref.current.close();
    }

    function takeBreakAndCloseModal() {
        const durationInMs = durationInMinutes * MINUTE_IN_MILLISECONDS;
        pauseShift(durationInMs);
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
                    align={"center"}
                    justify={"start"}>
                    <NumberInput
                        value={durationInMinutes}
                        onChange={(e) => setDurationInMinutes(e.target.value)}
                    />
                    <span>min</span>
                </FlexGroup>
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