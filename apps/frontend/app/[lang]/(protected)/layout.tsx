import {PropsWithChildren} from "react";
import AuthGuard from "../../../components/AuthGuard/AuthGuard";


export default function ProtectedLayout(props: PropsWithChildren) {
    const {children} = props;

    return (
        <AuthGuard>
            {children}
        </AuthGuard>
    );
}