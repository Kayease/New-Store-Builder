// Debug utility for authentication state
export const debugAuthState = () => {
  if (typeof window === "undefined") return;
  const profile = localStorage.getItem("kx_profile");
  if (profile) {
    try {
      const userData = JSON.parse(profile);
    } catch (error) {
      console.error("❌ Failed to parse profile:", error);
    }
  }
};

// Call this function in browser console to debug auth state
(window as any).debugAuth = debugAuthState;
