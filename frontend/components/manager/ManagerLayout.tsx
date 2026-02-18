"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Icon from "../AppIcon";
import { PageLoadingWrapper } from "../ui/LoadingWrapper";
import { usePageLoading } from "../../hooks/useLoading";
import Button from "../ui/Button";
import SidebarItem from "../SidebarItem";
import Head from "next/head";

const ManagerLayout = ({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) => {
  const params = useParams();
  const store = (params as any)?.store || "feedback";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarNavRef = useRef(null);
  const { isPageLoading, loadPage } = usePageLoading(`manager-${store}`);
  const userProfile = JSON.parse(localStorage.getItem("kx_profile"));
  const userRole = userProfile?.role?.toLowerCase();

  // Persist sidebar scroll position between page navigations
  useEffect(() => {
    const savedScroll = Number(
      sessionStorage.getItem("adminSidebarScroll") || 0
    );
    if (sidebarNavRef.current) {
      // @ts-ignore
      sidebarNavRef.current.scrollTop = savedScroll;
    }

    const handleScroll = () => {
      if (!sidebarNavRef.current) return;
      // @ts-ignore
      sessionStorage.setItem(
        "adminSidebarScroll",
        // @ts-ignore
        String(sidebarNavRef.current.scrollTop)
      );
    };

    const navEl = sidebarNavRef.current as any;
    if (navEl) navEl.addEventListener("scroll", handleScroll);
    return () => {
      if (navEl) navEl.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Handle logout
  const handleLogout = () => {
    try {
      const { toast } = require("react-toastify");
      toast.success("Signed out");
    } catch { }
    window.location.href = "/login";
  };

  // Sidebar sections and items (organized to match provided design)
  const sidebarSections: {
    title: string;
    items: {
      name: string;
      href: string;
      icon: string;
      showCount?: boolean;
      count?: number;
    }[];
  }[] = [
      {
        title: "Dashboard",
        items: [
          {
            name: "Home",
            href: `/manager/${store}/home`,
            icon: "Home",
            showCount: false,
          },

          {
            name: "My Clients",
            href: `/manager/${store}/clients`,
            icon: "Users",
            showCount: false,
          },
          {
            name: "Orders",
            href: `/manager/${store}/orders`,
            icon: "ShoppingCart",
            showCount: false,
          },
          {
            name: "Products",
            href: `/manager/${store}/products`,
            icon: "Package",
            showCount: false,
          },
          {
            name: "Brands",
            href: `/manager/${store}/brands`,
            icon: "Tags",
            showCount: false,
          },
          {
            name: "Categories",
            href: `/manager/${store}/categories`,
            icon: "Layers",
            showCount: false,
          },
          {
            name: "Promocodes",
            href: `/manager/${store}/promocodes`,
            icon: "Percent",
            showCount: false,
          },
          {
            name: "Taxes",
            href: `/manager/${store}/taxes`,
            icon: "ReceiptPercent",
            showCount: false,
          },
          {
            name: "Reports",
            href: `/manager/${store}/reports`,
            icon: "BarChart2",
            showCount: false,
          },
          {
            name: "Contact Enquiries",
            href: `/manager/${store}/contact-enquiries`,
            icon: "Mail",
            showCount: false,
          },
          {
            name: "Callback Requests",
            href: `/manager/${store}/callback-requests`,
            icon: "PhoneCall",
            showCount: false,
          },
          {
            name: "Questions",
            href: `/manager/${store}/questions`,
            icon: "MessageSquare",
            showCount: false,
          },
          {
            name: "Newsletter",
            href: `/manager/${store}/newsletter`,
            icon: "Mail",
            showCount: false,
          },
          {
            name: "Ratings & Reviews",
            href: `/manager/${store}/reviews`,
            icon: "Star",
            showCount: false,
          },
          {
            name: "My Team",
            href: `/manager/${store}/team`,
            icon: "Users",
            showCount: false,
          },
          {
            name: "Smart Banners",
            href: `/manager/${store}/smart-banners`,
            icon: "Image",
            showCount: false,
          },
          {
            name: "Banners",
            href: `/manager/${store}/banners`,
            icon: "Image",
            showCount: false,
          },
          {
            name: "Blogs",
            href: `/manager/${store}/blogs`,
            icon: "Newspaper",
            showCount: false,
          },
          {
            name: "Notice",
            href: `/manager/${store}/notice`,
            icon: "Megaphone",
            showCount: false,
          },
          {
            name: "Themes",
            href: `/manager/${store}/themes`,
            icon: "Palette",
            showCount: false,
          },
        ],
      },
    ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <head>
        <title>{`${store.charAt(0).toUpperCase() + store.slice(1)
          } | Manager`}</title>
        <meta
          name="description"
          content="Manage your StoreCraft storefront: orders, products, categories, brands, taxes, reports, contact enquiries, callback requests, questions, subscriptions, ratings & reviews, team, smart banners, banners, blogs, notice."
        />
        <meta
          name="keywords"
          content="ecommerce, online store, manager, orders, products, categories, brands, taxes, reports, contact enquiries, callback requests, questions, subscriptions, ratings & reviews, team, smart banners, banners, blogs, notice, StoreCraft"
        />
        <link
          rel="canonical"
          href={`${process.env.NEXT_PUBLIC_PLATFORM_URL}/manager/${store}`}
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:title"
          content={`Manager – ${store.charAt(0).toUpperCase() + store.slice(1)
            }`}
        />
        <meta
          property="og:description"
          content="Manage your StoreCraft storefront: orders, products, categories, brands, taxes, reports, contact enquiries, callback requests, questions, subscriptions, ratings & reviews, team, smart banners, banners, blogs, notice."
        />
      </head>
      <div>
        {/* Sidebar (fixed on large screens, overlay on mobile) */}
        <div
          className={`fixed inset-y-0 left-0 z-40 w-72 transform bg-white border-r border-slate-300 shadow-lg lg:translate-x-0 transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
            } lg:fixed`}
        >
          {/* Sidebar Header */}
          <div className="px-6 py-5 bg-white border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Icon name="Store" size={20} className="text-primary" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] tracking-wider text-slate-500">
                  STORE • MANAGER
                </div>
                <div className="font-semibold text-slate-900 truncate">
                  {store.charAt(0).toUpperCase() + store.slice(1)}
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="ml-auto lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors duration-200"
                aria-label="Close sidebar"
              >
                <Icon name="X" size={16} className="text-slate-600" />
              </button>
            </div>
          </div>

          {/* Sidebar Navigation */}
          <nav
            ref={sidebarNavRef}
            className="h-[calc(100vh-160px)] overflow-y-auto"
          >
            {sidebarSections.map((section, idx) => (
              <div key={idx} className="px-3 py-4">
                <h3 className="px-3 mb-2 text-xs font-semibold tracking-wide text-slate-500">
                  {section.title}
                </h3>
                <ul className="space-y-1">
                  {section.items.map((item) => (
                    <li key={item.href}>
                      <SidebarItem
                        name={item.name}
                        href={item.href}
                        icon={item.icon}
                        showCount={item.showCount}
                        count={item.count}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          {/* Logout button */}
          <div className="px-4 py-6 border-t border-slate-300 bg-gradient-to-r from-slate-50 to-white">
            <Button
              onClick={handleLogout}
              variant="default"
              size="lg"
              className="w-full bg-white hover:bg-red-50 border-red-200 hover:border-red-300 text-red-600 hover:text-red-700 transition-all duration-300 shadow-sm"
              iconName="LogOut"
              iconPosition="left"
            >
              Sign Out
            </Button>
          </div>
        </div>

        {/* Main content area with proper spacing for fixed sidebar */}
        <div className="lg:ml-72">
          {/* Top bar */}
          <div className="sticky top-0 z-30 bg-white border-b border-slate-300 shadow-sm">
            <div className="flex items-center justify-between px-8 py-4">
              <div className="flex items-center space-x-6">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors duration-200"
                >
                  <Icon name="Menu" size={20} className="text-slate-600" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* Quick actions */}
                <Link
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 text-slate-500 hover:text-primary rounded-xl hover:bg-primary/5 transition-all duration-300"
                  title="View Website"
                >
                  <Icon name="Home" size={18} />
                </Link>

                {/* User menu */}
                <div className="flex items-center space-x-3 ">
                  {userRole === "merchant" && (
                    <button
                      onClick={() => {
                        window.open(`/merchant/portal`, "_blank");
                      }}
                      className="rounded-lg border px-3 py-1.5 text-sm hover:bg-green-50 text-green-600 border-green-200"
                    >
                      Merchant
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="rounded-lg border px-3 py-1.5 text-sm hover:bg-red-50 text-red-600 border-red-200"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Scrollable page content */}
          <main className="min-h-[calc(100vh-160px)] p-8 bg-slate-50">
            <PageLoadingWrapper
              isLoading={isPageLoading}
              loadingText="Loading page..."
            >
              {children}
            </PageLoadingWrapper>
          </main>
        </div>
      </div>
    </div>
  );
};

export default ManagerLayout;
