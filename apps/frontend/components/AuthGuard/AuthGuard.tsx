"use client";

import { useEffect, useState  } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getToken } from "../../lib/token";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);

    const langs = ["en", "de"];
    const basePublicPaths = ["/signin", "/signup", "/", "/introduction", "/account/signin", "/account/signup"];
    const publicPaths = langs.flatMap(lang =>
        basePublicPaths.map(path =>
            path === "/" ? `/${lang}` : `/${lang}${path}`
        )
        );

    useEffect(() => {
        if (!publicPaths.includes(pathname)) {
            const token = getToken();
            if (!token) {
                router.replace("/signin");
                return;
            }
        }
        setLoading(false);
    }, [router, pathname, publicPaths]);

    if (loading) {
        return <div>Loading...</div>;
    }

    return <>{children}</>;
}