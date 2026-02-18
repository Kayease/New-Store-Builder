"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "../AppIcon";
import Button from "../ui/Button";
import SidebarItem from "../SidebarItem";
import { ShieldHalf } from "lucide-react";
import { PageLoadingWrapper } from "../ui/LoadingWrapper";
import { usePageLoading } from "../../hooks/useLoading";
import { useStoreCtx } from "../../contexts/StoreContext";
import { useAuth } from "../../contexts/AuthContext";

const StoreLayout = ({
  store,
  children,
  title,
}: {
  store: string;
  children: React.ReactNode;
  title?: string;
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [storeName, setStoreName] = useState(store);
  const sidebarNavRef = useRef(null);
  const { isPageLoading, loadPage } = usePageLoading(`store-${store}`);
  const router = useRouter();
  const { storeSlug, setStoreSlug, setStoreId, pageTitle } = useStoreCtx();

  // Sync store context with current store parameter
  useEffect(() => {
    if (store && store !== storeSlug) {
      setStoreSlug(store);
    }
  }, [store, storeSlug, setStoreSlug]);

  const { logout } = useAuth();
  const handleLogout = () => logout();

  // Fetch store name from settings
  useEffect(() => {
    // Skip fetching if on plans page (store might be inactive)
    const currentPath = window.location?.pathname;
    if (currentPath?.includes("/plans")) {
      setStoreName(store);
      return;
    }

    const fetchStoreName = async () => {
      try {
        // dynamic import
        const { StoreSettings, Store } = await import("../../lib/api");

        let doc: any = null;

        // Try getting by list filter first (legacy)
        try {
          const res = await StoreSettings.list({
            filter: JSON.stringify({ storeSlug: store }),
          });

          if (res?.data && !Array.isArray(res.data)) {
            // It returned a single object (getBySlug wrapper)
            doc = res.data;
          } else {
            const items = Array.isArray(res?.items) ? res.items : Array.isArray(res?.data) ? res.data : [];
            doc = items[0];
          }
        } catch (e) {
          console.warn("StoreSettings.list failed, trying direct slug fetch");
        }

        // Fallback: Get directly by slug if doc is still missing
        if (!doc) {
          try {
            const directRes = await Store.getBySlug(store);
            if (directRes?.success && directRes?.data) {
              doc = directRes.data;
            } else if (directRes?.id) {
              doc = directRes;
            }
          } catch (e) {
            console.error("Direct fetch failed", e);
          }
        }

        if (doc) {
          if (doc.storeName || doc.name) setStoreName(doc.storeName || doc.name);
          const sid = doc.id || doc._id;
          if (sid) {
            console.log("Setting Store Context ID:", sid);
            setStoreId(sid);
          }
        } else {
          // If we really can't find it, maybe defaults?
          setStoreName(store);
        }

      } catch (error) {
        console.error("Failed to fetch store name/id:", error);
        setStoreName(store);
      }
    };

    fetchStoreName();
  }, [store]);

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
        title: "Store Settings",
        items: [
          {
            name: "General",
            href: `/store/${store}/general`,
            icon: "Home",
            showCount: false,
          },
          {
            name: "Plans",
            href: `/store/${store}/plans`,
            icon: "Book",
            showCount: false,
          },
          {
            name: "Domains",
            href: `/store/${store}/domains`,
            icon: "Globe",
            showCount: false,
          },
          {
            name: "Products",
            href: `/store/${store}/products`,
            icon: "Package",
            showCount: false,
          },
          {
            name: "Themes",
            href: `/store/${store}/themes`,
            icon: "Palette",
            showCount: false,
          },
          {
            name: "Store View",
            href: `/store/${store}/storeView`,
            icon: "Eye",
            showCount: false,
          },
          {
            name: "Shipping & Delivery",
            href: `/store/${store}/shipping`,
            icon: "Truck",
            showCount: false,
          },
          {
            name: "Payment",
            href: `/store/${store}/payment`,
            icon: "CreditCard",
            showCount: false,
          },
          {
            name: "Notifications",
            href: `/store/${store}/notifications`,
            icon: "Bell",
            showCount: false,
          },
          {
            name: "Team Management",
            href: `/store/${store}/team`,
            icon: "Users",
            showCount: false,
          },
        ],
      },
    ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
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
                  STORE • MERCHANT
                </div>
                <div className="font-semibold text-slate-900 truncate">
                  {storeName || store.charAt(0).toUpperCase() + store.slice(1)}
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
                  <h1 className="text-2xl font-bold text-slate-800">
                    {title || pageTitle}
                  </h1>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* Quick actions */}
                <Link
                  href={`/theme/${store}/preview`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 text-slate-500 hover:text-primary rounded-xl hover:bg-primary/5 transition-all duration-300"
                  title="View Live Store"
                >
                  <Icon name="ExternalLink" size={18} />
                </Link>

                <a
                  href={`/manager/${store}/home`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg flex items-center border px-3 py-1.5 text-sm hover:bg-green-50 text-green-700 border-green-200"
                  title="Go to Store manager Portal"
                >
                  <ShieldHalf className="mr-2" width={14} /> Manager
                </a>

                {/* User menu */}
                <div className="flex items-center space-x-3">
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
          <main className="min-h-screen bg-slate-50">
            <PageLoadingWrapper
              isLoading={isPageLoading}
              loadingText="Loading store settings..."
            >
              {children}
            </PageLoadingWrapper>
          </main>
        </div>
      </div>
    </div>
  );
};

export default StoreLayout;
