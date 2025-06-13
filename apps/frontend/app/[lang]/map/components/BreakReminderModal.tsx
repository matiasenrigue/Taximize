
import {useTranslations} from "next-intl";
import {ForwardedRef, forwardRef} from "react";
import {Modal, ModalHandle} from "../../../../components/Modal/Modal";
import {FlexGroup} from "../../../../components/FlexGroup/FlexGroup";
import {Button} from "../../../../components/Button/Button";


export const BreakReminderModal = forwardRef((props, ref: ForwardedRef<ModalHandle>) => {
    const t = useTranslations('map');

    function takeBreak() {}

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