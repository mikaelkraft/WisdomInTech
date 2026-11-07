import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../contexts/ToastContext";
import { isAdminEmail } from "../../utils/authService";
import { useFeature } from "../../hooks/useFeature";
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
  Linkedin,
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

const DiscordIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0 fill-current" viewBox="0 0 24 24">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

const XIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0 fill-current" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const GitLabIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
    <path fill="#E24329" d="m12 21.42 4.15-12.78H7.85z" />
    <path fill="#FC6D26" d="M12 21.42 7.85 8.64H1.67z" />
    <path fill="#FCA326" d="m1.67 8.64 6.18 12.78-4.81-3.5a1.05 1.05 0 0 1-.37-.93z" />
    <path fill="#E24329" d="m1.67 8.64 2.29-7.05a.53.53 0 0 1 1 0l2.89 7.05z" />
    <path fill="#FC6D26" d="M12 21.42l4.15-12.78h6.18z" />
    <path fill="#FCA326" d="m22.33 8.64-6.18 12.78 4.81-3.5a1.05 1.05 0 0 0 .37-.93z" />
    <path fill="#E24329" d="m22.33 8.64-2.29-7.05a.53.53 0 0 0-1 0l-2.89 7.05z" />
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

  // Admin-toggled OAuth Providers (from Neon feature flags / site settings)
  const googleEnabled = useFeature("auth_google", true);
  const githubEnabled = useFeature("auth_github", true);
  const discordEnabled = useFeature("auth_discord", false);
  const twitterEnabled = useFeature("auth_twitter", false);
  const linkedinEnabled = useFeature("auth_linkedin", false);
  const gitlabEnabled = useFeature("auth_gitlab", false);

  const activeProviders = [
    googleEnabled && {
      id: "google",
      name: "Google",
      icon: <GoogleIcon />,
      className:
        "bg-white hover:bg-gray-100 text-gray-900 border border-gray-300 font-medium",
    },
    githubEnabled && {
      id: "github",
      name: "GitHub",
      icon: <Github className="w-5 h-5 flex-shrink-0" />,
      className:
        "bg-gray-900 hover:bg-gray-800 text-white border border-gray-700 font-medium",
    },
    discordEnabled && {
      id: "discord",
      name: "Discord",
      icon: <DiscordIcon />,
      className:
        "bg-[#5865F2] hover:bg-[#4752C4] text-white border border-[#4752C4] font-medium",
    },
    twitterEnabled && {
      id: "twitter",
      name: "X",
      icon: <XIcon />,
      className:
        "bg-black hover:bg-neutral-900 text-white border border-neutral-700 font-medium",
    },
    linkedinEnabled && {
      id: "linkedin_oidc",
      name: "LinkedIn",
      icon: <Linkedin className="w-5 h-5 flex-shrink-0 text-[#0A66C2]" />,
      className:
        "bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 font-medium",
    },
    gitlabEnabled && {
      id: "gitlab",
      name: "GitLab",
      icon: <GitLabIcon />,
      className:
        "bg-[#FC6D26] hover:bg-[#E24329] text-white border border-[#E24329] font-medium",
    },
  ].filter(Boolean);

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

        {/* OAuth Buttons (Only when enabled by admin and in non-forgot modes) */}
        {mode !== "forgot" && activeProviders.length > 0 && (
          <div className="mb-5">
            <div
              className={
                activeProviders.length > 2
                  ? "grid grid-cols-1 sm:grid-cols-2 gap-2.5"
                  : "space-y-2.5"
              }
            >
              {activeProviders.map((provider) => (
                <Button
                  key={provider.id}
                  onClick={() => handleOAuthSignIn(provider.id)}
                  disabled={oauthLoading === provider.id || isLoading}
                  className={`w-full active:scale-95 transition-all duration-200 ${provider.className}`}
                  iconPosition="left"
                >
                  {oauthLoading === provider.id ? (
                    <div className="w-5 h-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    provider.icon
                  )}
                  <span className="truncate">
                    {oauthLoading === provider.id
                      ? "Connecting..."
                      : activeProviders.length > 2
                      ? provider.name
                      : `Continue with ${provider.name}`}
                  </span>
                </Button>
              ))}
            </div>

            <div className="relative py-2.5">
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
