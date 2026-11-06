import { Routes as RouterRoutes, Route, Navigate } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";
import PortfolioHomeHero from "./pages/portfolio-home-hero";
import ProjectsPortfolioGrid from "./pages/projects-portfolio-grid";
import ProjectDetail from "./pages/project-detail";
import BlogContentHub from "./pages/blog-content-hub";
import BlogPost from "./pages/blog-post";
import Documentation from "./pages/documentation";
import ResetPassword from "./pages/ResetPassword.jsx";
import RequireAdmin from "./components/auth/RequireAdmin.jsx";
import AdminDashboardContentManagement from "./pages/admin-dashboard-content-management";
import FeatureFlagsPage from "./pages/admin-dashboard-content-management/FeatureFlags.jsx";
import NotFound from "./pages/NotFound.jsx";

// Temporarily reuse BlogContentHub for search while SearchResultsPage is not built
const SearchResultsPage = BlogContentHub;

const Routes = () => {
  return (
    <ErrorBoundary>
      <ScrollToTop />
      <RouterRoutes>
        {/* Home */}
        <Route path="/" element={<PortfolioHomeHero />} />
        <Route path="/portfolio-home-hero" element={<Navigate to="/" replace />} />

        {/* Projects */}
        <Route path="/projects" element={<ProjectsPortfolioGrid />} />
        <Route path="/project/:id" element={<ProjectDetail />} />
        <Route path="/projects-portfolio-grid" element={<Navigate to="/projects" replace />} />

        {/* Blog */}
        <Route path="/blog" element={<BlogContentHub />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/blog-content-hub" element={<Navigate to="/blog" replace />} />

        {/* Search */}
        <Route path="/search" element={<SearchResultsPage />} />

        {/* Docs — single-word canonical URL */}
        <Route path="/docs" element={<Documentation />} />
        <Route path="/documentation" element={<Navigate to="/docs" replace />} />

        {/* Auth */}
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminDashboardContentManagement />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin-dashboard-content-management"
          element={<Navigate to="/admin" replace />}
        />
        <Route
          path="/login"
          element={
            <RequireAdmin>
              <AdminDashboardContentManagement />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/feature-flags"
          element={
            <RequireAdmin>
              <FeatureFlagsPage />
            </RequireAdmin>
          }
        />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </RouterRoutes>
    </ErrorBoundary>
  );
};

export default Routes;
