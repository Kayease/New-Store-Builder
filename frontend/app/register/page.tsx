"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/ui/Header";
import { useAuth } from "../../contexts/AuthContext";
import ProtectedRoute from "../../components/guards/ProtectedRoute";
import { toast as notify } from "react-toastify";
import Loader from "../../components/Loader";
import Link from "next/link";
import { AuthAPI } from "../../lib/api";

export default function RegisterPage() {
  const { login, isLoading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // OTP Modal State
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [registrationEmail, setRegistrationEmail] = useState("");
  const [sentOTP, setSentOTP] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors({
        ...fieldErrors,
        [name]: "",
      });
    }
  };

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case "firstName":
        if (!value.trim()) return "First name is required";
        if (value.trim().length < 2)
          return "First name must be at least 2 characters";
        if (value.trim().length > 50)
          return "First name cannot exceed 50 characters";
        break;
      case "lastName":
        if (!value.trim()) return "Last name is required";
        if (value.trim().length < 2)
          return "Last name must be at least 2 characters";
        if (value.trim().length > 50)
          return "Last name cannot exceed 50 characters";
        break;
      case "email":
        if (!value.trim()) return "Email is required";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value.trim()))
          return "Please enter a valid email address";
        break;
      case "phone":
        if (!value.trim()) return "Phone number is required";
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(value.replace(/\D/g, "")))
          return "Please enter a valid 10-digit phone number";
        break;
      case "password":
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
        if (formData.password && value !== formData.password)
          return "Passwords do not match";
        break;
    }
    return "";
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setFieldErrors({});

    const { firstName, lastName, email, phone, password, confirmPassword } =
      formData;

    // Validate all fields
    const errors: Record<string, string> = {};
    let hasErrors = false;

    Object.entries(formData).forEach(([key, value]) => {
      const error = validateField(key, value);
      if (error) {
        errors[key] = error;
        hasErrors = true;
      }
    });

    if (hasErrors) {
      setFieldErrors(errors);
      setLoading(false);
      return;
    }

    try {
      const response = await AuthAPI.register({
        firstName,
        lastName,
        email: email.trim(),
        phone: phone.trim(),
        password,
      });

      if (response.success) {
        // Store email for OTP verification
        setRegistrationEmail(email.trim());

        // Show OTP modal instead of auto-login
        setShowOTPModal(true);
        // Store the OTP sent by backend for dev testing
        if (response.data?.otp) {
          setSentOTP(response.data.otp);
        }
        notify.success(
          "Registration successful! Please verify your email with the OTP sent."
        );
      } else {
        setError(response.message || "Registration failed");
        notify.error(response.message || "Registration failed");
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || error.message || "Registration failed";

      // Check if it's an email already exists error
      if (
        errorMessage.toLowerCase().includes("email") &&
        errorMessage.toLowerCase().includes("already")
      ) {
        setFieldErrors({
          ...fieldErrors,
          email:
            "This email is already registered. Please sign in or use a different email.",
        });
      } else {
        setError(errorMessage);
      }
      notify.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP Verification
  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      notify.error("Please enter a valid 6-digit OTP");
      return;
    }

    setOtpLoading(true);
    setError(null);

    try {
      const response = await AuthAPI.verifyOTP(formData.phone, otp);

      if (response.success) {
        notify.success("Email verified! Logging you in...");

        // Auto-login after successful verification
        try {
          await login(registrationEmail, formData.password);
          notify.success("Welcome! You're now logged in.");
          router.push("/onboarding");
        } catch (loginError: any) {
          console.error("Auto-login failed:", loginError);
          notify.warning("Verification successful! Please sign in manually.");
          router.push("/login");
        }
      } else {
        setError(response.message || "Invalid OTP");
        notify.error(response.message || "Invalid OTP");
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "OTP verification failed";
      setError(errorMessage);
      notify.error(errorMessage);
    } finally {
      setOtpLoading(false);
    }
  };

  // Handle Resend OTP
  const handleResendOTP = async () => {
    try {
      const response = await AuthAPI.resendOTP(formData.phone);
      if (response.success) {
        notify.success("New OTP sent to your email");
        setSentOTP(response.data.otp);
      }
    } catch (error: any) {
      notify.error("Failed to resend OTP");
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <ProtectedRoute>
      <Header />
      <div className=" bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{" "}
            <Link
              href="/login"
              className="font-medium text-primary hover:text-primary/80"
            >
              sign in to your existing account
            </Link>
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <form className="space-y-6" onSubmit={submit}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium text-gray-700"
                  >
                    First name
                  </label>
                  <div className="mt-1">
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      autoComplete="given-name"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      className={`appearance-none block w-full px-3 py-2 border rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${fieldErrors.firstName
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-300"
                        }`}
                      placeholder="First name"
                    />
                  </div>
                  {fieldErrors.firstName && (
                    <p className="mt-1 text-sm text-red-600">
                      {fieldErrors.firstName}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Last name
                  </label>
                  <div className="mt-1">
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      autoComplete="family-name"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                      className={`appearance-none block w-full px-3 py-2 border rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${fieldErrors.lastName
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-300"
                        }`}
                      placeholder="Last name"
                    />
                  </div>
                  {fieldErrors.lastName && (
                    <p className="mt-1 text-sm text-red-600">
                      {fieldErrors.lastName}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className={`appearance-none block w-full px-3 py-2 border rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${fieldErrors.email
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300"
                      }`}
                    placeholder="Enter your email"
                  />
                </div>
                {fieldErrors.email && (
                  <p className="mt-1 text-sm text-red-600">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700"
                >
                  Mobile number
                </label>
                <div className="mt-1">
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className={`appearance-none block w-full px-3 py-2 border rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${fieldErrors.phone
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300"
                      }`}
                    placeholder="Enter 10-digit mobile number"
                  />
                </div>
                {fieldErrors.phone && (
                  <p className="mt-1 text-sm text-red-600">
                    {fieldErrors.phone}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>
                  <span className="text-xs text-gray-500">
                    Must include uppercase, lowercase & number
                  </span>
                </div>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className={`appearance-none block w-full px-3 py-2 pr-10 border rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${fieldErrors.password
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300"
                      }`}
                    placeholder="Create a password"
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
                {fieldErrors.password && (
                  <p className="mt-1 text-sm text-red-600">
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  Confirm password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`appearance-none block w-full px-3 py-2 pr-10 border rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${fieldErrors.confirmPassword
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300"
                      }`}
                    placeholder="Confirm your password"
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

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Creating account...
                    </div>
                  ) : (
                    "Create account"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* OTP Verification Modal */}
      {showOTPModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                Verify Your Email
              </h3>
              <button
                onClick={() => setShowOTPModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              We've sent a 6-digit verification code to{" "}
              <span className="font-semibold">{registrationEmail}</span>
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-4">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label
                htmlFor="otp"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Enter Verification Code
              </label>
              <input
                id="otp"
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary text-center text-2xl tracking-widest"
                placeholder="000000"
                autoFocus
              />
            </div>

            {/* Dev box to show OTP for testing */}
            {sentOTP && (
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded-md mb-4 text-sm font-mono">
                Dev: Your OTP is {sentOTP}
              </div>
            )}

            <button
              onClick={handleVerifyOTP}
              disabled={otpLoading || otp.length !== 6}
              className="w-full py-2 px-4 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {otpLoading ? "Verifying..." : "Verify Email"}
            </button>

            <div className="mt-4 text-center">
              <button
                onClick={handleResendOTP}
                className="text-sm text-primary hover:text-primary/80"
              >
                Didn't receive code? Resend
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
