import {ForwardedRef, forwardRef} from "react";
import {Modal, ModalHandle} from "../Modal/Modal";
import {useTranslations} from "next-intl";
import {FlexGroup} from "../FlexGroup/FlexGroup";
import {Button} from "../Button/Button";

export const NoRouteFoundModal = forwardRef((props, ref: ForwardedRef<ModalHandle>) => {
    const t = useTranslations('NoRouteFoundModal');

    function closeModal() {
        if (!ref || typeof ref === "function"  || !ref.current)
            return;
        ref.current.close();
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
                    align={"stretch"}>
                    <Button
                        onClick={closeModal}>
                        {t("confirmButton")}
                    </Button>
                </FlexGroup>
            </FlexGroup>
        </Modal>
    );
});

NoRouteFoundModal.displayName = "NoRouteFoundModal";