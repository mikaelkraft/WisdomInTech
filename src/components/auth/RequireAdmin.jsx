import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import authService from "../../utils/authService";
import Login from "./Login.jsx";

const RequireAdmin = ({ children }) => {
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const isAdmin = await authService.isAdmin();
        if (mounted) {
          setAllowed(isAdmin);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!allowed) {
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
