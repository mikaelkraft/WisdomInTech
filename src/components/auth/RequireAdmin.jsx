import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import authService from "../../utils/authService";
import Login from "./Login.jsx";
import Button from "../ui/Button.jsx";
import Icon from "../AppIcon.jsx";

const RequireAdmin = ({ children }) => {
  const { user, isAdmin: contextIsAdmin, signOut } = useAuth();
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (contextIsAdmin) {
          if (mounted) setAllowed(true);
          return;
        }
        const adminCheck = await authService.isAdmin();
        if (mounted) {
          setAllowed(adminCheck);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [location.pathname, contextIsAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!allowed) {
    // If user is logged in but does NOT have admin rights
    if (user) {
      return (
        <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 py-12">
          <div className="w-full max-w-md bg-surface border border-border-accent/40 rounded-xl p-8 text-center shadow-glow-primary">
            <div className="w-14 h-14 bg-error/20 border border-error/40 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Icon name="ShieldAlert" size={28} className="text-error" />
            </div>
            <h2 className="text-2xl font-heading font-bold text-text-primary mb-2">
              Admin Access Required
            </h2>
            <p className="text-text-secondary text-sm mb-6 leading-relaxed">
              You are signed in as{" "}
              <span className="text-primary font-medium">{user.email}</span>,
              which does not have administrative rights configured for this workspace.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="primary"
                onClick={() => navigate("/workspace")}
                iconName="Layout"
                iconPosition="left"
                className="active:scale-95 transition-all duration-200 bg-cyan-600 hover:bg-cyan-500 text-white"
              >
                Go to Workspace
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                iconName="Home"
                iconPosition="left"
                className="active:scale-95 transition-all duration-200"
              >
                Home
              </Button>
              <Button
                variant="secondary"
                onClick={async () => {
                  await signOut();
                  setAllowed(false);
                }}
                iconName="LogOut"
                iconPosition="left"
                className="active:scale-95 transition-all duration-200"
              >
                Switch Account
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // If not logged in at all
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 py-12">
        <div className="w-full max-w-md">
          <Login onSuccess={() => setAllowed(true)} />
        </div>
      </div>
    );
  }

  return children;
};

export default RequireAdmin;
