"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "../../components/ui/Header";
import { toast as notify } from "react-toastify";
import Loader from "../../components/Loader";
import Link from "next/link";
import { api } from "../../lib/api";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifyingToken, setVerifyingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const hasVerifiedToken = useRef(false);

  // Get token from URL
  useEffect(() => {
    const urlToken = searchParams.get("token");
    if (urlToken && !hasVerifiedToken.current) {
      hasVerifiedToken.current = true;
      setToken(urlToken);
      verifyResetToken(urlToken);
    } else if (!urlToken) {
      notify.error("Invalid reset link");
      router.push("/login");
    }
  }, [searchParams, router]);

  const verifyResetToken = async (resetToken: string) => {
    try {
      const response = await api.post("/auth/verify-reset-token", {
        token: resetToken,
      });

      if (response.data.success) {
        setTokenValid(true);
        notify.success("Reset link is valid. Please enter your new password.");
      } else {
        notify.error("Invalid or expired reset link");
        router.push("/login");
      }
    } catch (error: any) {
      notify.error("Invalid or expired reset link");
      router.push("/login");
    } finally {
      setVerifyingToken(false);
    }
  };

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case "newPassword":
        if (!value) return "Password is required";
        if (value.length < 6) return "Password must be at least 6 characters";
        if (!/(?=.*[a-z])/.test(value))
          return "Password must contain at least one lowercase letter";
        if (!/(?=.*[A-Z])/.test(value))
          return "Password must contain at least one uppercase letter";
        if (!/(?=.*\d)/.test(value))
          return "Password must contain at least one number";
        break;
      case "confirmPassword":
        if (!value) return "Please confirm your password";
        if (newPassword && value !== newPassword)
          return "Passwords do not match";
        break;
    }
    return "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "newPassword") {
      setNewPassword(value);
    } else if (name === "confirmPassword") {
      setConfirmPassword(value);
    }

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors({
        ...fieldErrors,
        [name]: "",
      });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const newPasswordError = validateField("newPassword", newPassword);
    const confirmPasswordError = validateField(
      "confirmPassword",
      confirmPassword
    );

    const errors = {
      newPassword: newPasswordError,
      confirmPassword: confirmPasswordError,
    };

    setFieldErrors(errors);

    // Check if there are any errors
    if (newPasswordError || confirmPasswordError) {
      notify.error("Please fix the errors below");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/reset-password", {
        token,
        newPassword,
      });

      if (response.data.success) {
        notify.success("Password reset successfully! Redirecting to login...");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        notify.error(response.data.message || "Failed to reset password");
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to reset password";
      notify.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (verifyingToken) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!tokenValid) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Reset Your Password
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Enter your new password below
          </p>

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  New Password
                </label>
                <span className="text-xs text-gray-500">
                  Must include uppercase, lowercase & number
                </span>
              </div>
              <div className="mt-1 relative">
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 pr-10 border rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${
                    fieldErrors.newPassword
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder="Enter new password"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.newPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {fieldErrors.newPassword}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Confirm New Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 pr-10 border rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${
                    fieldErrors.confirmPassword
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder="Confirm new password"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 rounded-md bg-primary text-white font-semibold hover:bg-primary/90 focus:ring-4 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Resetting Password..." : "Reset Password"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm text-primary hover:text-primary/80"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
