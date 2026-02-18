import React from "react";
import StoreLayout from "../../../components/store/StoreLayout";
import AuthGuard from "../../../components/AuthGuard";
import StoreGuard from "../../../components/guards/StoreGuard";

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ store: string }>;
}) {
  const resolvedParams = await params;
  const store = resolvedParams.store || "feedback";
  return (
    <AuthGuard>
      <StoreGuard>
        <StoreLayout store={store}>{children}</StoreLayout>
      </StoreGuard>
    </AuthGuard>
  );
}
