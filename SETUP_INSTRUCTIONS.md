# Database Setup Instructions

## Next Steps to Complete the Database Setup

You've already successfully set up the basic profiles table and authentication! Now we need to apply the additional migrations to complete the database schema.

### Step 1: Apply Database Migrations

Run these SQL scripts in your Supabase SQL editor (in order):

1. **002_extend_profiles_and_add_tables.sql** - Adds missing columns to profiles and creates remaining tables
2. **003_rls_policies.sql** - Sets up Row Level Security policies for all tables
3. **004_seed_data.sql** - Populates with sample data for development

### Step 2: Test the Complete Auth Flow

1. **Sign up with a new test account**
   - Go to `/sign-up`
   - Create a new account with first_name and last_name
   - Should automatically redirect to `/dashboard`

2. **Verify Dashboard Works**
   - Dashboard should display your name from the profile
   - Check browser developer console for any errors
   - Profile data should load without issues

3. **Test Route Protection**
   - Sign out and try to access `/dashboard` directly
   - Should redirect to `/sign-in` with return URL
   - Sign in and should redirect back to dashboard

4. **Test Profile Page**
   - Navigate to `/profile`
   - Try updating your profile information
   - Changes should save to the database

### Step 3: Verify Environment Variables

Make sure you have these in your `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (if needed)
```

### What's Been Added

✅ **Database Schema:**

- Extended profiles table with title, company, bio, location, etc.
- Created organizations table for companies
- Created jobs table for board opportunities
- Created applications table for job applications
- Created skills and profile_skills for expertise tracking

✅ **Security:**

- Row Level Security policies for all tables
- Users can only access their own data
- Proper permissions for viewing public data (jobs, organizations)

✅ **Sample Data:**

- 20+ professional skills
- 5 sample organizations
- 5 sample board opportunities
- Ready for development and testing

✅ **Route Protection & Auth Updates:**

- Updated all Supabase auth helpers to use App Router functions (no more deprecation warnings)
- Middleware protects dashboard, profile, and other auth-required pages
- Proper redirects for authenticated/unauthenticated users
- Fixed session detection and cookie handling

### Troubleshooting

**If dashboard shows errors:**

- Check browser console for specific errors
- Verify all migrations applied successfully
- Confirm environment variables are correct

**If middleware isn't working:**

- Restart your Next.js dev server
- Check that middleware.ts is in the root directory

**If profile data isn't saving:**

- Check RLS policies are applied
- Verify user permissions in Supabase dashboard

### Next Development Priorities

After confirming everything works:

1. Replace mock data in dashboard with real database queries
2. Implement opportunities browsing with real job data
3. Add job application functionality
4. Create organization dashboard features

---

**Ready to proceed?** Apply the migrations and test the auth flow, then let me know if you encounter any issues!
