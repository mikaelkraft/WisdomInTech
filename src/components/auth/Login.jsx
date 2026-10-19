import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../contexts/ToastContext";
import { ADMIN_EMAIL } from "../../utils/authService";
import { LogIn, AlertCircle, Mail, Lock, Github } from "lucide-react";
import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.27v3.14C3.26 21.36 7.34 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.59H1.27C.46 8.21 0 10.05 0 12s.46 3.79 1.27 5.41l4.01-3.14z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.27 6.59l4.01 3.14c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

const Login = ({ onClose, onSuccess }) => {
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(null);
  const [error, setError] = useState("");

  const { signIn, signInWithOAuth } = useAuth();
  const { show: showToast } = useToast();
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const result = await signIn(email, password);
      if (result.success) {
        onSuccess?.();
        onClose?.();
        navigate("/admin-dashboard-content-management");
        showToast("Login successful", { type: "success" });
      } else {
        setError(result.error || "Invalid credentials");
        showToast(result.error || "Invalid credentials", { type: "error" });
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error("Sign in error:", err);
      showToast("An unexpected error occurred", { type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider) => {
    setOauthLoading(provider);
    setError("");
    try {
      const result = await signInWithOAuth(provider);
      if (result.success) {
        showToast(`Redirecting to ${provider} authentication...`, {
          type: "info",
        });
        // OAuth will redirect, so we don't close the modal here
      } else {
        setError(result.error || "OAuth authentication failed");
        showToast(result.error || "OAuth authentication failed", {
          type: "error",
        });
      }
    } catch (err) {
      setError("An unexpected error occurred during OAuth authentication");
      console.error("OAuth sign in error:", err);
      showToast("An unexpected error occurred during OAuth authentication", {
        type: "error",
      });
    } finally {
      setOauthLoading(null);
    }
  };

  // Removed unused GoogleIcon component

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-surface border border-border-accent rounded-lg p-6 shadow-glow-primary">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-heading font-bold text-text-primary mb-2">
            Admin Access
          </h2>
          <p className="text-text-secondary">
            Sign in to manage your portfolio
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-error/10 border border-error/30 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-error flex-shrink-0" />
            <p className="text-error text-sm">{error}</p>
          </div>
        )}

        {/* OAuth Buttons */}
        <div className="space-y-3 mb-6">
          <Button
            onClick={() => handleOAuthSignIn("google")}
            disabled={oauthLoading === "google" || isLoading}
            className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-300"
            iconPosition="left"
          >
            {oauthLoading === "google" ? (
              <div className="w-5 h-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
            ) : (
              <GoogleIcon />
            )}
            {oauthLoading === "google"
              ? "Connecting..."
              : "Continue with Google"}
          </Button>

          <Button
            onClick={() => handleOAuthSignIn("github")}
            disabled={oauthLoading === "github" || isLoading}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white"
            iconPosition="left"
          >
            {oauthLoading === "github" ? (
              <div className="w-5 h-5 animate-spin rounded-full border-2 border-gray-600 border-t-white" />
            ) : (
              <Github className="w-5 h-5" />
            )}
            {oauthLoading === "github"
              ? "Connecting..."
              : "Continue with GitHub"}
          </Button>
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border-accent"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-surface text-text-secondary">
              Or continue with email
            </span>
          </div>
        </div>

        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-text-primary mb-2"
            >
              Admin Email
            </label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={ADMIN_EMAIL}
                required
                autoComplete="email"
                className="w-full pl-10"
                disabled={isLoading || oauthLoading}
              />
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-text-primary mb-2"
            >
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                className="w-full pl-10"
                disabled={isLoading || oauthLoading}
              />
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full shadow-glow-primary"
            disabled={isLoading || oauthLoading}
            iconName={isLoading ? "Loader2" : "LogIn"}
            iconPosition="left"
          >
            {isLoading ? "Signing In…" : "Sign In"}
          </Button>
        </form>

        {onClose && (
          <div className="mt-4 text-center">
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary transition-colors text-sm"
              disabled={isLoading || oauthLoading}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
