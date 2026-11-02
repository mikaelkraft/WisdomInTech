# Knowledge & Activity Log

## Session: 2026-11-01

### User Requests (New Turn)
- Every page should be a proper page and utilise the same header and footer like the homepage.
- Use proper single names like "projects" instead of long phrases (e.g. clean single-word naming in URLs, navigation, and titles).
- Fix color contrast: colors should be properly matched and inverted (specifically: "white on very bright green is bad combo" - fix readability when bright neon green background is paired with white text, invert to dark text or adjust contrast).

### Investigation & Root Causes Identified (Previous)
1. **Database Schema & Tables Missing**:
   - The Neon PostgreSQL database lacked the entire `wisdomintech` schema.
   - Ran `scripts/migrate.js` (base schema + 16 patches) and `scripts/seed.js`. Admin role verified.
2. **Supabase Client & Auth Configuration**:
   - Added support for both `VITE_SUPABASE_URL` and `VITE_PUBLIC_SUPABASE_URL`.
   - Added local dev fallback for `ADMIN_EMAIL` (`mikewillkraft@gmail.com`) with `admin123`.
3. **Admin Area Navigation & Direct Access**:
   - Added `/admin`, `/login` routes and in-place login form in `RequireAdmin.jsx`.
4. **Blog URL & Portfolio Grid**:
   - Added `/blog` route with redirect from `/blog-content-hub`.
   - Updated portfolio grid to 3 cards per row on desktop (`lg:grid-cols-3`).

### Current Work
- Fixed Git repository corruption:
  - Root cause: `.git/refs/heads/main` and `.git/refs/remotes/origin/main` contained corrupted null/blank bytes due to filesystem/sync interruption, resulting in `fatal: failed to resolve HEAD as a valid ref` and `fatal: your current branch appears to be broken`.
  - Recovered the valid commit pointer (`30104c62abb95fc7f46a09647e9357c4c946c613`) from `.git/logs/HEAD`.
  - Restored `.git/refs/heads/main` and `.git/refs/remotes/origin/main`, purged null bytes from reflogs, and ran `git reset` to rebuild the index.
  - Verified `git status` and `git log` are 100% operational with working tree changes cleanly tracked.
- Fixed button contrast variants in `src/components/ui/Button.jsx`: inverted text colors on neon/bright green backgrounds (`bg-primary`, `bg-success`, `bg-accent`) to dark text (`text-primary-foreground`, `text-success-foreground`, `text-accent-foreground`), and fixed `link`, `outline`, and `text` variants to avoid dark-on-dark.
- Fixed `src/pages/portfolio-home-hero/components/ProjectShowcase.jsx`:
  - Updated theme button classes so cyberpunk uses `bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-glow-primary` (ensuring dark text on bright neon green).
  - Removed hardcoded `text-white` on buttons and icon badges that sat on bright green.
  - Simplified section heading from "Project Showcase" to "Projects".
  - Standardized theme badge classes.
- Unified pages (`ProjectsPortfolioGrid`, `BlogContentHub`, `BlogPost`, `NotFound`, `ResetPassword`) with `<HeaderNavigation />` and `<DynamicFooter />`, setting correct page top-padding (`pt-24 pb-16`) to avoid header overlap.
- Cleaned up navigation and URLs to single names: "Home" (`/`), "Projects" (`/projects`), "Blog" (`/blog`), "Admin" (`/admin`).
