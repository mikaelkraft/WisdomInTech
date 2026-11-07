import { X } from "lucide-react";
import Login from "./Login.jsx";

const AuthModal = ({ isOpen, onClose, defaultMode = "password" }) => {
  if (!isOpen) return null;

  const handleSuccess = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-full p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Modal Content */}
        <div className="relative w-full max-w-md my-8">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute -top-3 -right-3 z-10 w-8 h-8 bg-surface border border-border-accent rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-primary transition-all shadow-glow-primary active:scale-90"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Auth Form */}
          <Login
            onClose={onClose}
            onSuccess={handleSuccess}
            defaultMode={defaultMode}
          />
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
