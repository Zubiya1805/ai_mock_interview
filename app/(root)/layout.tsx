"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase/client";
import Link from "next/link";
import Image from "next/image";
import { ReactNode } from "react";

const Layout = ({ children }: { children: ReactNode }) => {
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user && pathname !== "/sign-in") {
                router.push("/sign-in");
            } else if (user) {
                setAuthenticated(true);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [router, pathname]);

    if (loading) return <div className="text-center mt-20">Loading...</div>;

    if (!authenticated && pathname !== "/sign-in") return null;

    return (
        <div className="root-layout">
            <nav>
                <Link href="/" className="flex items-center gap-2">
                    <Image src="/logo.svg" alt="PrepWise Logo" width={38} height={32} />
                    <h2 className="text-primary-100">PrepWise</h2>
                </Link>
            </nav>

            {children}
        </div>
    );
};

export default Layout;
