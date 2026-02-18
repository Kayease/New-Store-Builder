
"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import SignupForm from "../api/signup";
import { CustomerAuthProvider } from "../api/auth";
import { CustomerService } from "../api/client";

export default function SignupPage() {
    const params = useParams();
    const slug = params?.slug as string;
    const [storeId, setStoreId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (slug) {
            CustomerService.getStoreBySlug(slug)
                .then(res => {
                    setStoreId(res.data?.store?.id);
                })
                .finally(() => setLoading(false));
        }
    }, [slug]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <CustomerAuthProvider storeId={storeId || ""}>
            <div className="min-h-screen bg-gray-50 py-20">
                <SignupForm slug={slug} />
            </div>
        </CustomerAuthProvider>
    );
}
