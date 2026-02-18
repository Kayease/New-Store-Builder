"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Icon from "../AppIcon";
import { useAuth } from "../../contexts/AuthContext";
import SidebarItem from "../SidebarItem";
import Button from "../ui/Button";

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarNavRef = useRef<HTMLDivElement>(null);

  // Sidebar sections and items for Super Admin portal
  const sidebarSections = [
    {
      title: "DASHBOARD",
      items: [
        { name: "Home", href: `/admin/dashboard`, icon: "Home" },
        { name: "Users & Clients", href: `/admin/users`, icon: "Users" },
        { name: "Active Stores", href: `/admin/stores`, icon: "Store" },
      ],
    },
    {
      title: "CORE MANAGEMENT",
      items: [
        { name: "Subscription Plans", href: `/admin/subscription-plans`, icon: "Zap" },
        { name: "All Subscriptions", href: `/admin/subscriptions`, icon: "ShieldCheck" },
        { name: "Payment Logs", href: `/admin/payment-transactions`, icon: "CreditCard" },
      ],
    },
    {
      title: "PLATFORM TOOLS",
      items: [
        { name: "Theme Gallery", href: `/admin/themes`, icon: "Palette" },
      ],
    },
  ];

  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#f8faff] font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-all duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Fixed Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-white border-r border-[#e5eaf2] transform transition-all duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="flex items-center h-[70px] px-8 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <Icon name="Rocket" size={18} />
              </div>
              <span className="text-xl font-bold tracking-tight text-[#1a2333]">
                STORE<span className="text-indigo-600">CRAFT</span>
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav
            ref={sidebarNavRef}
            className="flex-1 px-4 space-y-7 overflow-y-auto scrollbar-hide py-2"
          >
            {sidebarSections.map((section, idx) => (
              <div key={idx} className="space-y-1">
                <div className="px-4 text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.15em] mb-3">
                  {section.title}
                </div>
                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <SidebarItem
                      key={item.href}
                      name={item.name}
                      href={item.href}
                      icon={item.icon}
                    />
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* User Footer */}
          <div className="p-4 mt-auto">
            <button
              onClick={() => logout()}
              className="group flex items-center w-full gap-3 px-4 py-3 text-sm font-semibold text-[#64748b] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-200"
            >
              <div className="p-2 bg-slate-50 group-hover:bg-rose-100 group-hover:text-rose-600 rounded-lg transition-colors">
                <Icon name="LogOut" size={18} />
              </div>
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-[260px] min-h-screen flex flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-[70px] bg-white border-b border-[#e5eaf2] flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
            >
              <Icon name="Menu" size={20} />
            </button>
            <h1 className="text-lg font-bold text-[#1a2333]">Admin Panel</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end mr-3">
              <span className="text-xs font-bold text-[#1a2333]">Super Admin</span>
              <span className="text-[10px] text-slate-400 font-medium">Platform Controller</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold shadow-sm cursor-pointer hover:bg-indigo-100 transition-colors">
              AD
            </div>
          </div>
        </header>

        {/* Page Area */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
