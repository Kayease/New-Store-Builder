import "./globals.css";
import { AppProviders } from "../providers/AppProviders";
import Script from "next/script";

export const metadata = {
  title: "StoreCraft Store Admin",
  description: "Manage your store",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
        {/* Ensure Razorpay SDK is present globally across pages */}
        <Script
          id="razorpay-sdk"
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
