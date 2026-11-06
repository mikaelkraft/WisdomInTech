# Knowledge & Activity Log

## Session: 2026-11-01

### User Requests (New Turn)
- Work on the themes: All themes should have their own unique colors applied upon selection (backgrounds, buttons, texts, accents) app-wide, not just in selected sections.
- Smooth animations for selections and clicks; animated down arrow in Hero section.
- Proper single names for pages (e.g. `/blog`, `/projects`, `/admin`, `/docs`) instead of long phrases.
- Minimise modal usage unless strictly needed (favor full dedicated pages).
- Fix loading issues on the blog page.
- Fix all errors in the IDE Problem tab.

### Diagnostics & Root Causes
1. **IDE Problem Tab Errors**:
   - `src/components/ui/HeaderNavigation.jsx` line 235: Leftover Git merge conflict markers (`<<<<<<< HEAD`, `=======`, `>>>>>>> ...`).
   - `src/pages/blog-content-hub/index.jsx` line 515: `{false && <footer ...>}` triggering ESLint error `no-constant-binary-expression`.
   - `src/components/ui/DynamicFooter.jsx`: Unused `React` import.
2. **Themes App-Wide**:
   - Currently, theme switching is only set locally on `document.documentElement` inside `PortfolioHomeHero`. Navigating to other pages does not carry or synchronize the theme globally.
   - In `src/styles/tailwind.css`, themes like `theme-neural`, `theme-futuristic`, and `theme-dark` only define `--color-primary`/`secondary`/`accent` without defining unique `--color-background`, `--color-surface`, `--color-border`, leading to incomplete theming across pages.
3. **Modal Overuse**:
   - `ProjectsPortfolioGrid` opens `ProjectModal` on card clicks despite having a full `/project/:id` page.
   - `BlogContentHub` opens `BlogModal` on card clicks despite having a full `/blog/:slug` page.
4. **Blog Page Loading**:
   - `blogService.getPublishedPosts` hard-errors if the backend API isn't reached, without cascading to Supabase or empty states.

### Implementation Plan Drafted
- Plan prepared for user review covering theme token expansion, global theme provider, animations, clean URL routing, modal reduction, and IDE lint fixes.

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
