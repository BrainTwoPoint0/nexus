# Supabase Integration Plan for Nexus

> **Goal:** Integrate Supabase to handle authentication, authorization, and data storage (profiles, jobs, applications, etc.) while following Nexus design & DevOps best-practices.

---

## 1. Project Setup

| Step | Description                                                                                                               | Outcome                 |
| ---- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| 1.1  | **Create Supabase project** in the Supabase dashboard                                                                     | New project URL & keys  |
| 1.2  | **Configure env vars** (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) in `.env.local` (never commit!) | Local dev can connect   |
| 1.3  | **Install dependencies**<br/>`npm i @supabase/supabase-js @supabase/auth-helpers-nextjs`                                  | Supabase SDK available  |
| 1.4  | **Add Supabase client** (`src/lib/supabase.ts`) using singleton pattern                                                   | Centralized client      |
| 1.5  | **Wrap `<MainLayout>` with `SessionContextProvider`** from `@supabase/auth-helpers-react`                                 | Auth context across app |

---

## 2. Database Schema

> We'll use Postgres row-level security (RLS). All tables default to `SELECT`/`INSERT` disabled until policies added.

### 2.1 Tables

| Table            | Purpose                         | Key Columns                                                                                                                      |
| ---------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `profiles`       | Extended user profile data      | `id (uuid PK, fk auth.users)`, `first_name`, `last_name`, `role`, `bio`, `location`, `avatar_url`, `created_at`                  |
| `organizations`  | Company/organization accounts   | `id (uuid PK)`, `name`, `website`, `logo_url`, `created_by (fk profiles)`                                                        |
| `jobs`           | Board & executive opportunities | `id`, `organization_id`, `title`, `description`, `location`, `sector`, `compensation`, `time_commitment`, `status`, `created_at` |
| `applications`   | Candidate job applications      | `id`, `job_id`, `candidate_id`, `cover_letter`, `status`, `submitted_at`                                                         |
| `skills`         | Normalized skills list          | `id`, `name`                                                                                                                     |
| `profile_skills` | M-M between profiles & skills   | `profile_id`, `skill_id`                                                                                                         |

### 2.2 Row-Level Security Policies (examples)

```sql
-- Only allow the owner to update their profile
create policy "Users can update own profile" on profiles
  for update using ( auth.uid() = id );

-- Candidates can insert application to a job & view their own apps
create policy "Insert own application" on applications
  for insert with check ( auth.uid() = candidate_id );
create policy "Select own application" on applications
  for select using ( auth.uid() = candidate_id );
```

---

## 3. Authentication Flow

1. **Sign-Up / Sign-In pages** – Replace current mock submit with `supabase.auth.signInWithPassword()` / `signUp()`.
2. **Magic-link / social providers** – Optional later; Supabase supports Google, LinkedIn, etc.
3. **Server-side session** – Use `cookies()` helper to fetch session in server components (Next.js App Router).
4. **Protected routes** – Create `middleware.ts` to redirect unauthenticated users.

---

## 4. Frontend Data Fetching Strategy

- **React Query** (optional) or direct Supabase calls via `supabase-js`.
- **Realtime** – Enable `realtime` on `applications` for instant updates in dashboards.
- **Pagination** – Use Supabase range queries.

---

## 5. Incremental Roll-Out Plan

### Phase A – Auth MVP

- [ ] Create Supabase project & env vars
- [ ] Implement `supabase.ts` client & provider wrapper
- [ ] Replace Sign-In / Sign-Up forms with Supabase calls
- [ ] Sync basic `profiles` on first sign-up using DB trigger
- [ ] Protect dashboard routes via middleware

### Phase B – Core Data Models

- [ ] Migrate schema (profiles, organizations, jobs, applications, skills)
- [ ] Write SQL policies for RLS
- [ ] Seed demo data for dev
- [ ] Replace mock data in candidate & org dashboards with live queries

### Phase C – Advanced Features

- [ ] Social auth providers (LinkedIn, Google)
- [ ] Realtime updates (applications & job status)
- [ ] Supabase Storage for file uploads (CVs, logos)
- [ ] Edge Functions for complex matching logic (future)

---

## 6. Helpful Resources

- Supabase Auth Helpers for Next.js: <https://supabase.com/docs/guides/auth/auth-helpers/nextjs>
- RLS Policies Crash Course: <https://supabase.com/docs/guides/auth/row-level-security>
- Supabase CLI Migrations: <https://supabase.com/docs/reference/cli>

---

## 7. Review Checklist

- [ ] Plan approved by project owner
- [ ] Supabase project & env configured
- [ ] Database schema migrated & policies tested
- [ ] Auth flow working end-to-end
- [ ] UI updated to use live data instead of mocks

---

> Once this plan is **approved** we will create a migration folder, install packages, and start implementing tasks one by one (updating this doc with ✅ as each item is completed).
