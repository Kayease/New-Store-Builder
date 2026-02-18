import React from "react";
import Header from "../components/ui/Header";

export const metadata = {
  title: "StoreCraft – Create your online store in minutes",
  description:
    "Build and manage your e‑commerce store with StoreCraft. Beautiful themes, powerful management, and flexible plans.",
  keywords: "ecommerce, online store, themes, store builder, shop, StoreCraft",
  openGraph: {
    type: "website",
    title: "StoreCraft – Create your online store in minutes",
    description:
      "Build and manage your e‑commerce store with StoreCraft. Beautiful themes, powerful management, and flexible plans.",
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_PLATFORM_URL
  }
};

export default function page() {
  return (
    <>
      <Header />
      <main className=" dark:bg-gray-800 bg-white relative overflow-hidden mx-auto w-full max-w-screen-xl p-4 py-6 lg:py-8">
        <div className="bg-white dark:bg-gray-800 flex relative z-20 items-center overflow-hidden h-full">
          <div className="container mx-auto px-6 flex relative py-16">
            <div className="sm:w-3/3 lg:w-4/5 flex flex-col relative z-20">
              <span className="w-20 h-2 bg-gray-800 dark:bg-white mb-12"></span>
              <h1 className="font-bebas-neue uppercase text-4xl sm:text-6xl font-black flex flex-col leading-none dark:text-white text-gray-800">
                Get Your Store in
                <span className="text-5xl sm:text-7xl text-primary">
                  Minute's
                </span>
              </h1>
              <p className="text-sm sm:text-base text-gray-700 dark:text-white">
                Dimension of reality that makes change possible and
                understandable. An indefinite and homogeneous environment in
                which natural events and human existence take place.
              </p>
              <div className="flex mt-8">
                <a
                  href="/login"
                  className="uppercase py-2 px-4 rounded-lg bg-primary border-2 border-transparent text-white text-md mr-4 hover:bg-primary"
                >
                  Get started
                </a>
                <a
                  href="#"
                  className="uppercase py-2 px-4 rounded-lg bg-transparent border-2 border-primary text-primary dark:text-white hover:bg-primary hover:text-white text-md"
                >
                  Read more
                </a>
              </div>
            </div>
            <div className="hidden sm:block sm:w-1/3 lg:w-3/5 relative">
              <img
                src="https://res.cloudinary.com/diiqpkysw/image/upload/v1761292536/hero-img_fblhrk.jpg"
                className="max-w-xs md:max-w-sm m-auto"
              />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
