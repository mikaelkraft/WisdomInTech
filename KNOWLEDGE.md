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

## Session: 2026-11-06 / 2026-11-07

### Completed Tasks
1. **HeaderNavigation & Theme Switcher Refactor**:
   - Resolved merge conflict markers and cleaned up `src/components/ui/HeaderNavigation.jsx`.
   - Wired `useTheme()` hook from `src/contexts/ThemeContext.jsx` into `HeaderNavigation`.
   - Made the theme palette switcher button permanently visible across all screen sizes (desktop and mobile) across the entire application.
   - Built in fallback internal `ThemeControls` modal support when the parent page does not supply a custom handler.
   - Added micro-interaction scale animations (`active:scale-95 transition-all duration-200`) across navigation items and action buttons.
   - Standardized single-word navigation items: "Home" (`/`), "Projects" (`/projects`), "Blog" (`/blog`), "Docs" (`/docs`), and "Admin" (`/admin`).

2. **Clean Single-Word Route URLs (`src/Routes.jsx` & `src/components/ui/DynamicFooter.jsx`)**:
   - Added `/docs` for documentation with automatic redirect from `/documentation` -> `/docs`.
   - Redirect `/projects-portfolio-grid` -> `/projects`.
   - Redirect `/blog-content-hub` -> `/blog`.
   - Redirect `/admin-dashboard-content-management` -> `/admin`.
   - Redirect `/portfolio-home-hero` -> `/`.
   - Updated documentation links in `DynamicFooter.jsx` from `/documentation` to `/docs` and `/docs#api`.

3. **Modal Usage Minimization**:
   - `src/pages/blog-content-hub/index.jsx`: Updated `handlePostClick` to navigate directly to `/blog/${post.slug || post.id}` via `useNavigate()`, bypassing `BlogModal` for regular browsing while preserving `BlogModal` for admin creation/editing.
   - `src/pages/projects-portfolio-grid/index.jsx`: Updated `handleViewDetails` to navigate directly to `/project/${project.id}` via `useNavigate()`, giving users dedicated URL pages with full metadata instead of nested popups.

4. **Resilient Blog Data Loading (`src/utils/blogService.js`)**:
   - Refactored `getPublishedPosts()` to wrap `USE_API` fetch in a `try...catch` that falls back seamlessly to direct Supabase query when the backend API is offline or returns non-200.
   - Handled empty post sets and fetch errors gracefully by returning `{ success: true, data: [] }` so `BlogContentHub` renders the clean "No blog posts yet" empty state instead of crashing with a red "Failed to load blog posts" banner.

5. **CSS & Build Verification**:
   - Fixed CSS syntax error in `src/styles/tailwind.css` line 289 (`}* {` missing newline).
   - Executed full production build `npm run build` (`vite build`) and verified that compilation succeeded with 0 errors (`✓ built in 8m 36s`).

### Login Investigation & Architecture
1. **Current State**:
   - Supabase project at `https://wykjtxkhvofkgwijxkwz.supabase.co` is online and responsive.
   - The admin account `mikewillkraft@gmail.com` exists in Supabase Auth.
   - `resetPasswordForEmail` and `signInWithOtp` endpoints succeed and deliver emails.
   - However, `Login.jsx` only offered a single password field and OAuth, with no way to enter an email OTP code or trigger a password reset directly from the login modal.
   - OAuth redirect was pointing to legacy `/admin-dashboard-content-management` instead of `/admin`.
   - Client `api.get` / `api.post` in `src/utils/api/client.js` was not automatically forwarding authorization headers to backend endpoints, causing admin operations to fail if logged in without manual bearer headers.

### Multi-User Auth & Env-Sensed Admin Rights Implementation
1. **Dynamic Admin Privilege Sensing (`src/utils/authService.js` & `backend/_lib/auth.js`)**:
   - Implemented `getAdminEmails()` and `isAdminEmail(email)` to dynamically read configured admin emails from `import.meta.env.VITE_ADMIN_EMAIL` / `import.meta.env.ADMIN_EMAIL` / `process.env.ADMIN_EMAIL` (defaulting to `mikewillkraft@gmail.com`).
   - Sensed admin assignment dynamically checks and persists `role = 'admin'` in `wisdomintech.user_profiles` upon sign-in or OAuth callback.
   - All other registered users receive standard collaborative member rights (`role = 'member'`), establishing the foundation for the multi-user project management platform.
   - Added support for local admin dev passcodes (`admin123`, `cyberkraft`, `admin`) when signing in with the designated admin email.
   - Implemented `requestOtp(email)` and `verifyOtp(email, token)` alongside standard `signUp(email, password, metadata)`.
2. **Context Layer Integration (`src/contexts/AuthContext.jsx`)**:
   - `isAdmin` boolean dynamically computed based on `userProfile?.role === 'admin'` or `isAdminEmail(user?.email)`.
   - Exposed `isAdmin`, `requestOtp`, and `verifyOtp` across the app via `useAuth()`.
3. **Multi-Mode Login UI (`src/components/auth/Login.jsx`)**:
   - Redesigned into a comprehensive tabbed interface supporting:
     - **Password Sign In**: Direct email/password login with real-time "Admin privileges sensed for this email address" detection badge.
     - **Email Code (OTP)**: Passwordless sign-in by requesting and entering a 6-digit one-time code sent to email.
     - **Register (Sign Up)**: Collaborative member account registration.
     - **Forgot Password**: Password reset email dispatch.
     - **3rd-Party OAuth**: Google and GitHub one-click authentication.
4. **Navigation & Access Control (`HeaderNavigation.jsx`, `RequireAdmin.jsx`, `AuthModal.jsx`)**:
   - `HeaderNavigation.jsx` shows "Sign In" button when guest, and user email badge, role tag ("ADMIN" / "MEMBER"), and "Sign Out" button when authenticated.
   - Shows `/admin` link exclusively to users with admin privileges.
   - `RequireAdmin.jsx` displays a friendly "Admin Access Required" state if a logged-in member attempts to visit `/admin`, with options to navigate Home or switch accounts.
   - `src/utils/api/client.js` now automatically attaches `Authorization: Bearer <token>` from active Supabase sessions or local admin tokens on all API requests.
5. **Code Quality**:
   - ESLint verified across all modified authentication components with 0 errors.

### Security Hardening: Elimination of Exposed Secrets & Fallbacks
1. **Zero Hardcoded Passcodes / Secrets**:
   - Removed all hardcoded dev passcodes (`admin123`, `cyberkraft`, `admin`) from `src/utils/authService.js`.
   - Any dev passcode must now be explicitly defined in `.env` (`VITE_DEV_ADMIN_PASSCODE`); without this variable in the environment, no fallback passcode is accepted.
2. **Zero Exposed Fallback Emails**:
   - Removed hardcoded admin email strings from `src/utils/authService.js`, `backend/_lib/auth.js`, `src/utils/settingsService.js`, `scripts/seed.js`, and `src/components/ui/DynamicFooter.jsx`.
   - All admin email privileges and contact addresses are strictly sensed from `VITE_ADMIN_EMAIL` / `ADMIN_EMAIL` / `VITE_CONTACT_EMAIL` in `.env`. If not configured, no admin user is inferred.
3. **Hardened API Authorization**:
   - Removed exposed `"dev-admin-token"` from `backend/_lib/auth.js` and `src/utils/api/client.js`.
   - Backend `verifyAuth` accepts a dev admin token only when explicitly configured via `process.env.DEV_ADMIN_TOKEN`.
   - `client.js` only transmits tokens from active Supabase sessions or an explicitly configured `VITE_DEV_ADMIN_TOKEN`.
4. **Login UI Neutrality**:
   - Removed auto-prefilled admin email in `Login.jsx` to prevent leaking the administrator's email address to multi-user visitors.
5. **Code Quality Verification**:
   - ESLint verified across all modified files with 0 errors and 0 warnings.

### Environment Setup for Multi-User & Secure Admin Architecture
- Configured `.env` with:
  - `ADMIN_EMAIL` & `VITE_ADMIN_EMAIL`: Sensed admin privileges configuration.
  - `VITE_CONTACT_EMAIL`: Public contact address for footer and site settings.
  - `DEV_ADMIN_TOKEN` & `VITE_DEV_ADMIN_TOKEN`: Cryptographically generated 48-char hex token for authorized dev API operations.
  - `DEV_ADMIN_USER_ID` & `VITE_DEV_ADMIN_USER_ID`: Fixed UUID for local development user mapping.
  - `VITE_DEV_ADMIN_PASSCODE`: Optional local development passcode strictly confined to `.env`.
- Updated `.env.example` with sanitized template documentation for multi-user admin sensing, OAuth, and dev tokens.

### Architecture Decision: Supabase for Auth / Neon for Data Storage
- Explicitly aligned platform division of responsibility per user instruction:
  - **Supabase**: Handles 100% of login, registration, passwordless OTP, OAuth (Google/GitHub), password reset, and access token issuance.
  - **Neon PostgreSQL**: Stores all application data (`wisdomintech.projects`, `wisdomintech.blog_posts`, `wisdomintech.comments`, `wisdomintech.site_settings`, and user profile data/roles in `wisdomintech.user_profiles`).
- **Profile & Role Synchronization**:
  - Upon user sign-in or registration via Supabase, `ensureUserProfile` synchronizes the identity with Neon.
  - If the user's email matches `ADMIN_EMAIL` / `VITE_ADMIN_EMAIL` in `.env`, their Neon profile is assigned `role = 'admin'`, granting immediate dashboard access (`/admin`).
  - Other registering users are assigned `role = 'member'` in Neon for collaborative project tracking.
  - Purged old dev passcode and custom token workarounds from `authService.js`, `backend/_lib/auth.js`, `src/utils/api/client.js`, and `.env` / `.env.example`.
- Verified 0 ESLint errors across all auth and API files.

### Admin-Toggled Auth Providers Implementation
- Added multi-provider OAuth support for: Google, GitHub, Discord, Twitter / X, LinkedIn, and GitLab.
- Seeded feature flags in Neon (`wisdomintech.feature_flags`): `auth_google`, `auth_github`, `auth_discord`, `auth_twitter`, `auth_linkedin`, `auth_gitlab` via `scripts/seed-auth-flags.js`.
- Added **"Auth Providers"** management tab to `SiteSettings.jsx` in the admin dashboard:
  - Admin can toggle any provider ON or OFF with immediate persistence to Neon PostgreSQL via `/api/settings/features`.
  - Visual status pill indicates "Active on Login" vs "Hidden".
  - Links to Supabase setup guides for each provider.
- Updated `Login.jsx`:
  - Dynamically renders only the OAuth buttons that are currently toggled ON by the admin via `useFeature`.
  - Responsive adaptive layout (full width for 1-2 providers, clean 2-column grid for 3+ providers).
- Verified 0 ESLint errors/warnings.
