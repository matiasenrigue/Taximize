import {ForwardedRef, forwardRef} from "react";
import {Modal, ModalHandle} from "../../../../components/Modal/Modal";
import {useTranslations} from "next-intl";
import {FlexGroup} from "../../../../components/FlexGroup/FlexGroup";
import {Button} from "../../../../components/Button/Button";


export const BreakModal = forwardRef((props, ref: ForwardedRef<ModalHandle>) => {
    const t = useTranslations('map');

    function endBreak() {}

    return (
        <Modal
            ref={ref}
            title={t("breakModalTitle")}>
            <FlexGroup
                direction={"column"}
                align={"stretch"}>
                {/* todo: timer */}
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