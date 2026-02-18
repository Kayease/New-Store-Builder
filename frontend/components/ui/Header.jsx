"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { Store } from "../../lib/api";

export default function Header() {
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    hasStore,
    userStore,
    logout,
    switchActiveStore,
  } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userStores, setUserStores] = useState([]);
  const [loadingStores, setLoadingStores] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch user stores
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserStores();
    }
  }, [isAuthenticated]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchUserStores = async () => {
    setLoadingStores(true);
    try {
      const response = await Store.list();
      setUserStores(response.data || []);
    } catch (error) {
      console.error("Failed to fetch stores:", error);
    } finally {
      setLoadingStores(false);
    }
  };

  const handleCreateStore = () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    router.push("/plans");
  };

  const handleCreateAnotherStore = () => {
    router.push("/onboarding");
  };

  const handleDashboard = () => {
    if (user?.role === "admin") {
      router.push("/admin/dashboard");
      return;
    }
    if (hasStore && userStore?.storeSlug) {
      router.push(`/store/${userStore.storeSlug}/general`);
      return;
    }
    router.push("/plans");
  };

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
  };

  const handleSelectStore = (store) => {
    // Switch the active store in AuthContext
    switchActiveStore(store);
    // Navigate to the selected store
    router.push(`/store/${store.storeSlug}/general`);
    setDropdownOpen(false);
  };

  const handleCreateNewStore = () => {
    // Allow all authenticated users (user or merchant) to create new stores
    // They will be prompted to select a plan on the onboarding/plans page
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    // Navigate to plans to select a subscription for the new store
    router.push("/plans");
  };

  const getInitials = (name) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserRole = () => {
    const role = user?.role;
    if (role === "admin") return "Administrator";
    if (role === "merchant") return "Merchant";
    return "User";
  };

  return (
    <header>
      <nav className="bg-white border-gray-200 px-4 lg:px-6 py-2.5">
        <div className="flex flex-wrap justify-between items-center mx-auto max-w-screen-xl">
          <Link href="/" className="flex items-center">
            <img
              src="https://flowbite.com/docs/images/logo.svg"
              className="mr-3 h-6 sm:h-9"
              alt="Flowbite Logo"
            />
            <span className="self-center text-xl font-semibold whitespace-nowrap">
              StoreCraft
            </span>
          </Link>
          <div className="flex items-center lg:order-2 space-x-2">
            {/* Auth CTA */}
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                {/* User Avatar Button */}
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 focus:outline-none  rounded-lg p-2 hover:bg-gray-50"
                >
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    {getInitials(`${user?.firstName} ${user?.lastName}`) || "U"}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.firstName || "User"}
                    </p>
                    <p className="text-xs text-gray-500">{getUserRole()}</p>
                  </div>
                  <svg
                    className={`w-4 h-4 text-gray-500 transition-transform ${dropdownOpen ? "transform rotate-180" : ""
                      }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    {/* Section 1: User Info */}
                    <div className="px-4 py-3 border-b border-gray-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center text-lg font-semibold">
                          {getInitials(
                            `${user?.firstName} ${user?.lastName}`
                          ) || "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {user?.firstName} {user?.lastName}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {user?.email}
                          </p>
                          <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded">
                            {getUserRole()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Stores */}
                    <div className="px-2 py-2 max-h-64 overflow-y-auto">
                      {isAuthenticated && user?.role === "merchant" ? (
                        <>
                          <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            My Stores
                          </p>
                          {loadingStores ? (
                            <div className="px-3 py-2 text-sm text-gray-500">
                              Loading stores...
                            </div>
                          ) : userStores.length > 0 ? (
                            <div className="space-y-1">
                              {userStores.map((store) => (
                                <button
                                  key={store._id}
                                  onClick={() => handleSelectStore(store)}
                                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium truncate">
                                      {store.storeName}
                                    </span>
                                    {store.isActive === true ? (
                                      <span className="text-xs text-green-500 font-medium">
                                        Active
                                      </span>
                                    ) : (
                                      <span className="text-xs text-red-500 font-medium">
                                        Inactive
                                      </span>
                                    )}
                                  </div>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="px-3 py-2 text-sm text-gray-500">
                              No stores yet
                            </div>
                          )}
                          <button
                            onClick={handleCreateNewStore}
                            className="w-full mt-2 px-3 py-2 text-sm font-medium text-primary bg-primary/5 hover:bg-primary/10 rounded-md transition-colors flex items-center justify-center space-x-1 hover:bg-gray-200 hover:text-primary"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                              />
                            </svg>
                            <span>Create New Store</span>
                          </button>
                        </>
                      ) : isAuthenticated && user?.role === "user" ? (
                        <button
                          onClick={handleCreateNewStore}
                          className="w-full mt-2 px-3 py-2 text-sm font-medium text-primary bg-primary/5 hover:bg-primary/10 rounded-md transition-colors flex items-center justify-center space-x-1"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                          <span>Create New Store</span>
                        </button>
                      ) : (
                        <button
                          onClick={handleDashboard}
                          className="w-full mt-2 px-3 py-2 text-sm font-medium text-primary bg-primary/5 hover:bg-primary/10 rounded-md transition-colors flex items-center justify-center space-x-1"
                        >
                          <span>Admin Dashboard</span>
                        </button>
                      )}
                    </div>

                    {/* Section 3: Sign Out */}
                    <div className="px-2 py-2 border-t border-gray-200">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors flex items-center space-x-2"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/register"
                className="text-gray-800 hover:bg-gray-50 focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-4 lg:px-5 py-2 lg:py-2.5 mr-2"
              >
                Get Started
              </Link>
            )}
            <button
              data-collapse-toggle="mobile-menu-2"
              type="button"
              className="inline-flex items-center p-2 ml-1 text-sm text-gray-500 rounded-lg lg:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
              aria-controls="mobile-menu-2"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="w-6 h-6"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                ></path>
              </svg>
              <svg
                className="hidden w-6 h-6"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </button>
          </div>
          <div
            className="hidden justify-between items-center w-full lg:flex lg:w-auto lg:order-1"
            id="mobile-menu-2"
          >
            <ul className="flex flex-col mt-4 font-medium lg:flex-row lg:space-x-8 lg:mt-0">
              <li>
                <Link
                  href="/"
                  className="block py-2 pr-4 pl-3 text-primary-700"
                >
                  Home
                </Link>
              </li>
              <li>
                <a href="/plans" className="block py-2 pr-4 pl-3 text-gray-700">
                  Plans
                </a>
              </li>
              <li>
                <a href="/theme" className="block py-2 pr-4 pl-3 text-gray-700">
                  Themes
                </a>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
}
