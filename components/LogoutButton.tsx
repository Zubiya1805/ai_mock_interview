"use client";

import { useRouter } from "next/navigation";
import { signOut as firebaseSignOut } from "firebase/auth";
import { toast } from "sonner";
import { auth } from "@/firebase/client";
import { signOut } from "@/lib/actions/auth.action";
import { Button } from "@/components/ui/button";

const LogoutButton = () => {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            // Sign out from Firebase client
            await firebaseSignOut(auth);

            // Clear server-side session cookie
            await signOut();

            toast.success("Logged out successfully");

            // Redirect to sign-in page
            router.push("/sign-in");
        } catch (error) {
            console.error("Logout error:", error);
            toast.error("Failed to log out. Please try again.");
        }
    };

    return (
        <Button
            onClick={handleLogout}
            className="btn-secondary"
        >
            Logout
        </Button>
    );
};

export default LogoutButton;