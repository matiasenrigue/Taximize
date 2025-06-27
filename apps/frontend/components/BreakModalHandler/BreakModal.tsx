import {ForwardedRef, forwardRef} from "react";
import {Modal, ModalHandle} from "../Modal/Modal";
import {useTranslations} from "next-intl";
import {FlexGroup} from "../FlexGroup/FlexGroup";
import {Button} from "../Button/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faClock} from "@fortawesome/free-solid-svg-icons";
import {useShift} from "../../contexts/ShiftContext/ShiftContext";

export const BreakModal = forwardRef((props, ref: ForwardedRef<ModalHandle>) => {
    const t = useTranslations('map');
    const {continueShift} = useShift();

    function endBreak() {
        if (!ref || typeof ref === "function")
            return;
        ref.current.close();
        continueShift();
    }

    return (
        <Modal
            ref={ref}
            title={t("breakModalTitle")}
            onClick={continueShift}>
            <FlexGroup
                direction={"column"}
                align={"stretch"}>
                <FlexGroup direction={"row"}>
                    <FontAwesomeIcon icon={faClock}/>
                    <span>00:00 min</span>
                </FlexGroup>
                <FlexGroup
                    direction={"row"}
                    align={"stretch"}>
                    <Button
                        onClick={endBreak}>
                        {t("endBreak")}
                    </Button>
                </FlexGroup>
            </FlexGroup>
        </Modal>
    );
});