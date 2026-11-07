import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import useFeature from "hooks/useFeature";
import Icon from "../AppIcon.jsx";
import Button from "./Button.jsx";
import SearchModal from "./SearchModal.jsx";
import AuthModal from "../auth/AuthModal.jsx";
import ThemeControls from "../../pages/portfolio-home-hero/components/ThemeControls.jsx";

const HeaderNavigation = ({ onThemeControlsToggle }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [internalThemeModalOpen, setInternalThemeModalOpen] = useState(false);
  const searchEnabled = useFeature("full_text_search", true);
  const [searchVal, setSearchVal] = useState("");
  const searchDebounceRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userProfile, signOut, isAdmin } = useAuth();
  const themeCtx = useTheme();
  const activeTheme = themeCtx?.theme ?? "cyberpunk";
  const setTheme = themeCtx?.setTheme ?? (() => {});
  const fontSize = themeCtx?.fontSize ?? "medium";
  const setFontSize = themeCtx?.setFontSize ?? (() => {});
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const handleThemeControlsClick = () => {
    if (onThemeControlsToggle) {
      onThemeControlsToggle();
    } else {
      setInternalThemeModalOpen(true);
    }
  };

  const navigationItems = [
    { label: "Home",     path: "/",        icon: "Home",       tooltip: "Portfolio home" },
    { label: "Projects", path: "/projects", icon: "FolderOpen", tooltip: "Browse projects" },
    { label: "Blog",     path: "/blog",     icon: "BookOpen",   tooltip: "Read blog posts" },
    { label: "Docs",     path: "/docs",     icon: "FileText",   tooltip: "Documentation" },
    { label: "Admin",    path: "/admin",    icon: "Settings",   tooltip: "Admin dashboard", adminOnly: true },
  ];

  const filteredNavItems = navigationItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

  const isActivePath = (path) => {
    const p = location.pathname;
    if (path === "/" && (p === "/" || p === "/portfolio-home-hero")) return true;
    if (path === "/projects" && (p === "/projects" || p.startsWith("/project"))) return true;
    if (path === "/blog" && (p === "/blog" || p.startsWith("/blog/"))) return true;
    if (path === "/docs" && (p === "/docs" || p === "/documentation")) return true;
    if (path === "/admin" && (p === "/admin" || p.startsWith("/admin"))) return true;
    return p === path;
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const toggleMobileMenu = () => setIsMobileMenuOpen((v) => !v);

  // Close mobile menu on route change
  useEffect(() => {
    closeMobileMenu();
  }, [location.pathname]);

  // Close on Escape + lock body scroll
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") closeMobileMenu(); };
    if (isMobileMenuOpen) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-md border-b border-border-accent/20 transition-colors duration-300">
        <nav className="max-w-9xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-18">

            {/* Logo */}
            <Link
              to="/"
              className="flex items-center space-x-3 group"
              aria-label="WisdomInTech Portfolio Home"
            >
              <div className="relative">
                <div className="w-8 h-8 bg-gray-800 border border-gray-300 rounded-lg flex items-center justify-center group-hover:shadow-glow-primary transition-all duration-300">
                  <Icon name="Code" size={20} className="text-white" />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
              </div>
              <div className="hidden sm:block">
                <span className="font-heading font-bold text-lg text-primary group-hover:text-secondary transition-colors duration-300">
                  WisdomInTech
                </span>
                <div className="text-xs text-text-secondary font-caption">Portfolio</div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {filteredNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={(e) => {
                    if (item.adminOnly && !isAdmin) {
                      e.preventDefault();
                      setAuthModalOpen(true);
                    }
                  }}
                  className={`
                    relative px-4 py-2 rounded-lg font-medium text-sm
                    flex items-center space-x-2 min-h-[44px]
                    transition-all duration-200 active:scale-95
                    ${
                      isActivePath(item.path)
                        ? "text-primary bg-primary/10 shadow-glow-primary"
                        : "text-text-secondary hover:text-primary hover:bg-primary/5"
                    }
                  `}
                  title={item.tooltip}
                >
                  <Icon name={item.icon} size={18} />
                  <span>{item.label}</span>
                  {isActivePath(item.path) && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                  )}
                </Link>
              ))}
            </div>

            {/* Desktop right controls */}
            <div className="hidden lg:flex items-center space-x-3">
              {searchEnabled && (
                <div className="relative">
                  <input
                    type="text"
                    value={searchVal}
                    onChange={(e) => {
                      const v = e.target.value;
                      setSearchVal(v);
                      clearTimeout(searchDebounceRef.current);
                      searchDebounceRef.current = setTimeout(() => {
                        if (v.trim().length > 1)
                          navigate(`/search?q=${encodeURIComponent(v.trim())}`);
                      }, 300);
                    }}
                    placeholder="Search posts…"
                    className="w-56 px-3 py-2 rounded-lg bg-background/60 border border-border-accent/30 focus:border-primary focus:outline-none text-sm placeholder-text-secondary/50 transition-colors duration-200"
                    aria-label="Search posts"
                  />
                  <Icon
                    name="Search"
                    size={14}
                    className="absolute top-1/2 -translate-y-1/2 right-2 text-text-secondary/60"
                  />
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchModalOpen(true)}
                iconName="Search"
                className="p-2 active:scale-95 transition-all duration-200"
                title="Search portfolio"
              />

              {/* Theme palette — always visible on every page */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleThemeControlsClick}
                iconName="Palette"
                className="p-2 active:scale-95 transition-all duration-200"
                title="Change theme"
              />

              {user ? (
                <div className="flex items-center space-x-2">
                  <div className="hidden xl:flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-surface/80 border border-border-accent/30 text-xs">
                    <span className="text-text-secondary truncate max-w-[120px]">
                      {userProfile?.full_name || user?.email?.split("@")[0]}
                    </span>
                    {isAdmin && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/20 text-primary uppercase">
                        Admin
                      </span>
                    )}
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={signOut}
                    iconName="LogOut"
                    iconPosition="left"
                    className="min-w-[90px] active:scale-95 transition-all duration-200"
                  >
                    Logout
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAuthModalOpen(true)}
                  iconName="LogIn"
                  iconPosition="left"
                  className="min-w-[100px] active:scale-95 transition-all duration-200"
                >
                  Sign In
                </Button>
              )}
            </div>

            {/* Mobile right controls */}
            <div className="lg:hidden flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchModalOpen(true)}
                iconName="Search"
                className="p-2 active:scale-95 transition-all duration-200"
                title="Search"
              />
              {/* Theme palette on mobile — always visible */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleThemeControlsClick}
                iconName="Palette"
                className="p-2 active:scale-95 transition-all duration-200"
                title="Change theme"
              />
              {user ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={signOut}
                  iconName="LogOut"
                  className="p-2 active:scale-95 transition-all duration-200"
                  title="Logout"
                />
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAuthModalOpen(true)}
                  iconName="LogIn"
                  className="p-2 active:scale-95 transition-all duration-200"
                  title="Sign In"
                />
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMobileMenu}
                iconName={isMobileMenuOpen ? "X" : "Menu"}
                className="p-2 active:scale-95 transition-all duration-200"
                title="Toggle navigation menu"
              />
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={closeMobileMenu}>
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
        </div>
      )}

      {/* Mobile Menu Drawer */}
      <div
        className={`
          fixed top-16 right-0 bottom-0 z-50 w-80 max-w-[85vw] bg-surface border-l border-border-accent/20
          transform transition-transform duration-300 ease-out lg:hidden
          ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto py-6">
            <nav className="px-6 space-y-2">
              {filteredNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={(e) => {
                    if (item.adminOnly && !isAdmin) {
                      e.preventDefault();
                      setAuthModalOpen(true);
                      return;
                    }
                    closeMobileMenu();
                  }}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-lg font-medium
                    transition-all duration-200 min-h-[48px] active:scale-95
                    ${
                      isActivePath(item.path)
                        ? "text-primary bg-primary/10 shadow-glow-primary"
                        : "text-text-secondary hover:text-primary hover:bg-primary/5"
                    }
                  `}
                >
                  <Icon name={item.icon} size={20} />
                  <div className="flex-1">
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs text-text-secondary font-caption">{item.tooltip}</div>
                  </div>
                  {isActivePath(item.path) && (
                    <div className="w-2 h-2 bg-primary rounded-full" />
                  )}
                </Link>
              ))}
            </nav>
          </div>

          {/* Mobile Menu Footer */}
          <div className="border-t border-border-accent/20 p-6">
            <div className="text-center">
              <div className="text-sm text-text-secondary font-caption">WisdomInTech</div>
              <div className="text-xs text-text-secondary/60 mt-1">Neo-Cyberpunk Experience</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Modal */}
      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        currentTheme={activeTheme}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode="login"
      />

      {/* Internal Theme Controls (when no parent toggle provided) */}
      <ThemeControls
        isOpen={internalThemeModalOpen}
        onClose={() => setInternalThemeModalOpen(false)}
        currentTheme={activeTheme}
        onThemeChange={setTheme}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
      />

      {/* Floating sign in button when not logged in */}
      {!user && (
        <button
          onClick={() => setAuthModalOpen(true)}
          className="fixed bottom-6 left-6 z-40 px-3 py-1.5 rounded-full bg-surface/90 backdrop-blur border border-primary/30 text-xs text-text-secondary hover:text-primary hover:border-primary transition-all duration-200 shadow-glow-primary flex items-center space-x-1.5 active:scale-95"
          title="Sign in"
        >
          <Icon name="Lock" size={12} className="text-primary" />
          <span>Sign In</span>
        </button>
      )}
    </>
  );
};

export default HeaderNavigation;
