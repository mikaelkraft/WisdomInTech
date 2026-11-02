import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button.jsx";
import Icon from "../components/AppIcon.jsx";
import HeaderNavigation from "../components/ui/HeaderNavigation.jsx";
import DynamicFooter from "../components/ui/DynamicFooter.jsx";

const NotFound = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate("/");
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.__SUPPRESS_CANONICAL = true;
    }
    return () => {
      if (typeof window !== "undefined") delete window.__SUPPRESS_CANONICAL;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between pt-24">
      <HeaderNavigation />
      <div className="flex-grow flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md mx-auto">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <h1 className="text-9xl font-bold text-primary opacity-20">404</h1>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-text-primary mb-2">
            Page Not Found
          </h2>
          <p className="text-text-secondary mb-8">
            The page you're looking for doesn't exist. Let's get you back!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="primary"
              icon={<Icon name="ArrowLeft" />}
              iconPosition="left"
              onClick={() => window.history.back()}
            >
              Go Back
            </Button>

            <Button
              variant="outline"
              icon={<Icon name="Home" />}
              iconPosition="left"
              onClick={handleGoHome}
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
      <DynamicFooter />
    </div>
  );
};

export default NotFound;
