import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../contexts/ToastContext";
import { isAdminEmail } from "../../utils/authService";
import {
  LogIn,
  UserPlus,
  KeyRound,
  Mail,
  Lock,
  User,
  AlertCircle,
  CheckCircle2,
  Github,
  ShieldCheck,
} from "lucide-react";
import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";

const GoogleIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
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

const Login = ({ onClose, onSuccess, defaultMode = "password" }) => {
  // mode: 'password' | 'otp' | 'signup' | 'forgot'
  const [mode, setMode] = useState(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(null);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const { signIn, signUp, requestOtp, verifyOtp, signInWithOAuth, resetPassword } =
    useAuth();
  const { show: showToast } = useToast();
  const navigate = useNavigate();

  const isAdminTarget = isAdminEmail(email);

  const handleAuthSuccess = (isUserAdmin) => {
    onSuccess?.();
    onClose?.();
    showToast("Signed in successfully", { type: "success" });
    if (isUserAdmin || isAdminTarget) {
      navigate("/admin");
    }
  };

  // 1. Password Sign In
  const handleSignIn = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setInfoMessage("");
    try {
      const result = await signIn(email, password);
      if (result.success) {
        handleAuthSuccess(result.data?.isAdmin);
      } else {
        setError(result.error || "Invalid credentials.");
      }
    } catch (err) {
      setError(err?.message || "An unexpected error occurred during sign in.");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Sign Up
  const handleSignUp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setInfoMessage("");
    try {
      const result = await signUp(email, password, { full_name: fullName });
      if (result.success) {
        setInfoMessage(
          "Account created! Please check your email inbox to confirm your account."
        );
        showToast("Account created successfully", { type: "success" });
      } else {
        setError(result.error || "Sign up failed.");
      }
    } catch (err) {
      setError(err?.message || "An unexpected error occurred during sign up.");
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setInfoMessage("");
    try {
      const result = await requestOtp(email);
      if (result.success) {
        setOtpSent(true);
        setInfoMessage("Verification code sent! Check your email inbox.");
        showToast("Verification code sent to your email", { type: "info" });
      } else {
        setError(result.error || "Failed to send verification code.");
      }
    } catch (err) {
      setError(err?.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setInfoMessage("");
    try {
      const result = await verifyOtp(email, otpCode);
      if (result.success) {
        handleAuthSuccess(isAdminTarget);
      } else {
        setError(result.error || "Invalid or expired code.");
      }
    } catch (err) {
      setError(err?.message || "Verification failed.");
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Send Password Reset
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setInfoMessage("");
    try {
      const result = await resetPassword(email);
      if (result.success) {
        setInfoMessage("Password reset instructions have been sent to your email.");
        showToast("Password reset link sent", { type: "success" });
      } else {
        setError(result.error || "Failed to send reset email.");
      }
    } catch (err) {
      setError(err?.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  // 6. OAuth Sign In
  const handleOAuthSignIn = async (provider) => {
    setOauthLoading(provider);
    setError("");
    try {
      const result = await signInWithOAuth(provider);
      if (result.success) {
        showToast(`Redirecting to ${provider} authentication...`, {
          type: "info",
        });
      } else {
        setError(result.error || `${provider} authentication failed.`);
      }
    } catch (err) {
      setError(err?.message || "OAuth authentication error.");
    } finally {
      setOauthLoading(null);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-surface border border-border-accent/40 rounded-xl p-6 md:p-8 shadow-glow-primary transition-all duration-300">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-primary/20 border border-primary/40 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-glow-primary">
            {mode === "signup" ? (
              <UserPlus className="w-7 h-7 text-primary" />
            ) : mode === "otp" ? (
              <KeyRound className="w-7 h-7 text-primary" />
            ) : (
              <LogIn className="w-7 h-7 text-primary" />
            )}
          </div>
          <h2 className="text-2xl font-heading font-bold text-text-primary tracking-tight">
            {mode === "signup"
              ? "Join Platform"
              : mode === "otp"
              ? "Passwordless Login"
              : mode === "forgot"
              ? "Reset Password"
              : "Welcome Back"}
          </h2>
          <p className="text-text-secondary text-sm mt-1">
            {mode === "signup"
              ? "Create your account for collaborative project management"
              : mode === "otp"
              ? "Sign in securely via a 6-digit email code"
              : mode === "forgot"
              ? "Enter your email to receive recovery instructions"
              : "Access projects, tools, and management dashboards"}
          </p>
        </div>

        {/* Admin Rights Sensed Pill */}
        {isAdminTarget && (
          <div className="mb-4 py-1.5 px-3 rounded-lg bg-primary/10 border border-primary/30 flex items-center gap-2 text-xs text-primary font-medium animate-pulse">
            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
            <span>Admin privileges sensed for this email address.</span>
          </div>
        )}

        {/* Error Feedback */}
        {error && (
          <div className="mb-4 p-3 bg-error/10 border border-error/30 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-error flex-shrink-0" />
            <p className="text-error text-xs md:text-sm">{error}</p>
          </div>
        )}

        {/* Info Message Feedback */}
        {infoMessage && (
          <div className="mb-4 p-3 bg-success/10 border border-success/30 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
            <p className="text-success text-xs md:text-sm">{infoMessage}</p>
          </div>
        )}

        {/* OAuth Buttons (Only on password, otp, or signup modes) */}
        {mode !== "forgot" && (
          <div className="space-y-2.5 mb-5">
            <Button
              onClick={() => handleOAuthSignIn("google")}
              disabled={oauthLoading === "google" || isLoading}
              className="w-full bg-white hover:bg-gray-100 text-gray-900 border border-gray-300 font-medium active:scale-95 transition-all duration-200"
              iconPosition="left"
            >
              {oauthLoading === "google" ? (
                <div className="w-5 h-5 animate-spin rounded-full border-2 border-gray-400 border-t-gray-900" />
              ) : (
                <GoogleIcon />
              )}
              {oauthLoading === "google" ? "Connecting..." : "Continue with Google"}
            </Button>

            <Button
              onClick={() => handleOAuthSignIn("github")}
              disabled={oauthLoading === "github" || isLoading}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white border border-gray-700 font-medium active:scale-95 transition-all duration-200"
              iconPosition="left"
            >
              {oauthLoading === "github" ? (
                <div className="w-5 h-5 animate-spin rounded-full border-2 border-gray-500 border-t-white" />
              ) : (
                <Github className="w-5 h-5" />
              )}
              {oauthLoading === "github" ? "Connecting..." : "Continue with GitHub"}
            </Button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border-accent/30" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wider">
                <span className="px-3 bg-surface text-text-secondary/80 font-medium">
                  Or with email
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Mode Navigation Tabs */}
        {mode !== "forgot" && (
          <div className="flex rounded-lg bg-background/60 p-1 mb-5 border border-border-accent/20">
            <button
              type="button"
              onClick={() => {
                setMode("password");
                setError("");
              }}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                mode === "password"
                  ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("otp");
                setError("");
              }}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                mode === "otp"
                  ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Email Code
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError("");
              }}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                mode === "signup"
                  ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Register
            </button>
          </div>
        )}

        {/* 1. PASSWORD SIGN IN FORM */}
        {mode === "password" && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-text-secondary mb-1">
                Email Address
              </label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  autoComplete="email"
                  className="w-full pl-10 text-sm"
                  disabled={isLoading || !!oauthLoading}
                />
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-xs font-medium text-text-secondary">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode("forgot");
                    setError("");
                  }}
                  className="text-xs text-primary hover:text-secondary transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 text-sm"
                  disabled={isLoading || !!oauthLoading}
                />
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full shadow-glow-primary active:scale-95 transition-all duration-200"
              disabled={isLoading || !!oauthLoading}
              iconName={isLoading ? "Loader2" : "LogIn"}
              iconPosition="left"
            >
              {isLoading ? "Signing In…" : "Sign In"}
            </Button>
          </form>
        )}

        {/* 2. SIGN UP FORM */}
        {mode === "signup" && (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-xs font-medium text-text-secondary mb-1">
                Full Name / Username
              </label>
              <div className="relative">
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your Name"
                  required
                  className="w-full pl-10 text-sm"
                  disabled={isLoading || !!oauthLoading}
                />
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              </div>
            </div>

            <div>
              <label htmlFor="signupEmail" className="block text-xs font-medium text-text-secondary mb-1">
                Email Address
              </label>
              <div className="relative">
                <Input
                  id="signupEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  autoComplete="email"
                  className="w-full pl-10 text-sm"
                  disabled={isLoading || !!oauthLoading}
                />
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              </div>
            </div>

            <div>
              <label htmlFor="signupPassword" className="block text-xs font-medium text-text-secondary mb-1">
                Choose Password
              </label>
              <div className="relative">
                <Input
                  id="signupPassword"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full pl-10 text-sm"
                  disabled={isLoading || !!oauthLoading}
                />
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full shadow-glow-primary active:scale-95 transition-all duration-200"
              disabled={isLoading || !!oauthLoading}
              iconName={isLoading ? "Loader2" : "UserPlus"}
              iconPosition="left"
            >
              {isLoading ? "Creating Account…" : "Create Account"}
            </Button>
          </form>
        )}

        {/* 3. EMAIL OTP (PASSWORDLESS) FORM */}
        {mode === "otp" && (
          <div className="space-y-4">
            {!otpSent ? (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <label htmlFor="otpEmail" className="block text-xs font-medium text-text-secondary mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Input
                      id="otpEmail"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      autoComplete="email"
                      className="w-full pl-10 text-sm"
                      disabled={isLoading || !!oauthLoading}
                    />
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full shadow-glow-primary active:scale-95 transition-all duration-200"
                  disabled={isLoading || !email || !!oauthLoading}
                  iconName={isLoading ? "Loader2" : "ArrowRight"}
                  iconPosition="right"
                >
                  {isLoading ? "Sending Code…" : "Send Verification Code"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label htmlFor="otpCode" className="block text-xs font-medium text-text-secondary mb-1">
                    Enter 6-Digit Code
                  </label>
                  <Input
                    id="otpCode"
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    required
                    maxLength={10}
                    autoFocus
                    className="w-full text-center tracking-widest text-lg font-mono"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-text-secondary/70 mt-1.5 text-center">
                    Code sent to <span className="text-primary font-medium">{email}</span>
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setOtpSent(false);
                      setOtpCode("");
                    }}
                    className="flex-1 active:scale-95 transition-all duration-200"
                    disabled={isLoading}
                  >
                    Resend
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="flex-1 shadow-glow-primary active:scale-95 transition-all duration-200"
                    disabled={isLoading || !otpCode}
                    iconName={isLoading ? "Loader2" : "CheckCircle2"}
                    iconPosition="left"
                  >
                    {isLoading ? "Verifying…" : "Verify & Sign In"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* 4. FORGOT PASSWORD FORM */}
        {mode === "forgot" && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label htmlFor="forgotEmail" className="block text-xs font-medium text-text-secondary mb-1">
                Your Account Email
              </label>
              <div className="relative">
                <Input
                  id="forgotEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  autoComplete="email"
                  className="w-full pl-10 text-sm"
                  disabled={isLoading}
                />
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full shadow-glow-primary active:scale-95 transition-all duration-200"
              disabled={isLoading || !email}
              iconName={isLoading ? "Loader2" : "ArrowRight"}
              iconPosition="right"
            >
              {isLoading ? "Sending Link…" : "Send Reset Link"}
            </Button>

            <button
              type="button"
              onClick={() => {
                setMode("password");
                setError("");
                setInfoMessage("");
              }}
              className="w-full text-center text-xs text-text-secondary hover:text-primary transition-colors mt-2"
            >
              Back to Sign In
            </button>
          </form>
        )}

        {/* Modal Close / Cancel */}
        {onClose && (
          <div className="mt-5 text-center pt-3 border-t border-border-accent/20">
            <button
              type="button"
              onClick={onClose}
              className="text-text-secondary/70 hover:text-text-primary transition-colors text-xs"
              disabled={isLoading || !!oauthLoading}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
