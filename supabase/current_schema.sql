


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."achievement_category_enum" AS ENUM (
    'award',
    'recognition',
    'publication',
    'speaking_engagement',
    'media_coverage',
    'patent',
    'research',
    'thought_leadership'
);


ALTER TYPE "public"."achievement_category_enum" OWNER TO "postgres";


CREATE TYPE "public"."availability_status_enum" AS ENUM (
    'immediately_available',
    'available_3_months',
    'available_6_months',
    'not_available',
    'by_arrangement'
);


ALTER TYPE "public"."availability_status_enum" OWNER TO "postgres";


CREATE TYPE "public"."board_position_enum" AS ENUM (
    'non_executive_director',
    'executive_director',
    'independent_director',
    'chair',
    'deputy_chair',
    'senior_independent_director',
    'board_observer',
    'advisory_board'
);


ALTER TYPE "public"."board_position_enum" OWNER TO "postgres";


CREATE TYPE "public"."compensation_type_enum" AS ENUM (
    'annual',
    'daily',
    'hourly',
    'retainer'
);


ALTER TYPE "public"."compensation_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."currency_enum" AS ENUM (
    'GBP',
    'USD',
    'EUR',
    'CHF',
    'AUD',
    'CAD',
    'JPY',
    'SGD',
    'HKD'
);


ALTER TYPE "public"."currency_enum" OWNER TO "postgres";


CREATE TYPE "public"."degree_type_enum" AS ENUM (
    'certificate',
    'diploma',
    'associate',
    'bachelor',
    'master',
    'mba',
    'phd',
    'professional_doctorate',
    'honorary_doctorate'
);


ALTER TYPE "public"."degree_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."document_category_enum" AS ENUM (
    'resume',
    'cv',
    'cover_letter',
    'certificate',
    'diploma',
    'reference_letter',
    'portfolio',
    'board_pack',
    'other'
);


ALTER TYPE "public"."document_category_enum" OWNER TO "postgres";


CREATE TYPE "public"."grade_classification_enum" AS ENUM (
    'first_class',
    '2_1',
    '2_2',
    'third_class',
    'pass',
    'distinction',
    'merit',
    'summa_cum_laude',
    'magna_cum_laude',
    'cum_laude'
);


ALTER TYPE "public"."grade_classification_enum" OWNER TO "postgres";


CREATE TYPE "public"."interaction_type_enum" AS ENUM (
    'recommendation_view',
    'recommendation_click',
    'recommendation_like',
    'recommendation_dislike',
    'job_application',
    'job_view',
    'job_save',
    'search_query',
    'filter_applied',
    'profile_update'
);


ALTER TYPE "public"."interaction_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."membership_type_enum" AS ENUM (
    'student',
    'associate',
    'member',
    'fellow',
    'chartered',
    'senior_fellow',
    'honorary'
);


ALTER TYPE "public"."membership_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."organization_size_enum" AS ENUM (
    'startup_0_10',
    'small_11_50',
    'medium_51_250',
    'large_251_1000',
    'enterprise_1001_5000',
    'ftse_aim',
    'ftse_small_cap',
    'ftse_250',
    'ftse_100',
    'fortune_500'
);


ALTER TYPE "public"."organization_size_enum" OWNER TO "postgres";


CREATE TYPE "public"."organization_type_enum" AS ENUM (
    'public_company',
    'private_company',
    'startup',
    'scale_up',
    'non_profit',
    'charity',
    'government',
    'academic',
    'investment_fund',
    'family_office'
);


ALTER TYPE "public"."organization_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."rec_type" AS ENUM (
    'home',
    'grab'
);


ALTER TYPE "public"."rec_type" OWNER TO "postgres";


CREATE TYPE "public"."remote_work_enum" AS ENUM (
    'no',
    'hybrid',
    'full',
    'occasional'
);


ALTER TYPE "public"."remote_work_enum" OWNER TO "postgres";


CREATE TYPE "public"."time_commitment_enum" AS ENUM (
    'full-time',
    'part-time',
    'project-based',
    'consulting'
);


ALTER TYPE "public"."time_commitment_enum" OWNER TO "postgres";


CREATE TYPE "public"."travel_willingness_enum" AS ENUM (
    'none',
    'domestic_only',
    'european',
    'international',
    'global'
);


ALTER TYPE "public"."travel_willingness_enum" OWNER TO "postgres";


CREATE TYPE "public"."visibility_status_enum" AS ENUM (
    'public',
    'members_only',
    'premium_only',
    'private',
    'archived'
);


ALTER TYPE "public"."visibility_status_enum" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_enhanced_profile_completeness"("profile_uuid" "uuid") RETURNS smallint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
    completeness_score SMALLINT := 0;
    profile_rec profiles%ROWTYPE;
BEGIN
    SELECT * INTO profile_rec FROM profiles WHERE id = profile_uuid;
    
    IF profile_rec.id IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Basic profile fields (40 points total)
    IF profile_rec.first_name IS NOT NULL AND profile_rec.first_name != '' THEN
        completeness_score := completeness_score + 5;
    END IF;
    
    IF profile_rec.last_name IS NOT NULL AND profile_rec.last_name != '' THEN
        completeness_score := completeness_score + 5;
    END IF;
    
    -- Fixed: Use professional_headline instead of title
    IF profile_rec.professional_headline IS NOT NULL AND profile_rec.professional_headline != '' THEN
        completeness_score := completeness_score + 10;
    END IF;
    
    IF profile_rec.bio IS NOT NULL AND profile_rec.bio != '' THEN
        completeness_score := completeness_score + 20;
    END IF;
    
    -- Contact and availability fields (25 points total)
    IF profile_rec.phone IS NOT NULL AND profile_rec.phone != '' THEN
        completeness_score := completeness_score + 5;
    END IF;
    
    IF profile_rec.linkedin_url IS NOT NULL AND profile_rec.linkedin_url != '' THEN
        completeness_score := completeness_score + 5;
    END IF;
    
    IF profile_rec.availability_status IS NOT NULL THEN
        completeness_score := completeness_score + 5;
    END IF;
    
    IF profile_rec.remote_work_preference IS NOT NULL THEN
        completeness_score := completeness_score + 2;
    END IF;
    
    IF profile_rec.skills IS NOT NULL AND array_length(profile_rec.skills, 1) > 0 THEN
        completeness_score := completeness_score + 8;
    END IF;
    
    -- Professional experience enhancements (35 points total)
    IF EXISTS (SELECT 1 FROM board_experience WHERE profile_id = profile_uuid) THEN
        completeness_score := completeness_score + 20;
    END IF;
    
    -- Fixed: Use work_experience instead of work_history
    IF EXISTS (SELECT 1 FROM work_experience WHERE profile_id = profile_uuid) THEN
        completeness_score := completeness_score + 10;
    END IF;
    
    IF EXISTS (SELECT 1 FROM education WHERE profile_id = profile_uuid) THEN
        completeness_score := completeness_score + 3;
    END IF;
    
    IF EXISTS (SELECT 1 FROM certifications WHERE profile_id = profile_uuid) THEN
        completeness_score := completeness_score + 2;
    END IF;
    
    RETURN LEAST(completeness_score, 100);
END;
$$;


ALTER FUNCTION "public"."calculate_enhanced_profile_completeness"("profile_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_profile_completeness"("profile_uuid" "uuid") RETURNS smallint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
    completeness_score SMALLINT := 0;
    profile_rec profiles%ROWTYPE;
BEGIN
    SELECT * INTO profile_rec FROM profiles WHERE id = profile_uuid;
    
    IF profile_rec.id IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Basic profile fields (60 points total)
    IF profile_rec.first_name IS NOT NULL AND profile_rec.first_name != '' THEN
        completeness_score := completeness_score + 10;
    END IF;
    
    IF profile_rec.last_name IS NOT NULL AND profile_rec.last_name != '' THEN
        completeness_score := completeness_score + 10;
    END IF;
    
    IF profile_rec.title IS NOT NULL AND profile_rec.title != '' THEN
        completeness_score := completeness_score + 15;
    END IF;
    
    IF profile_rec.bio IS NOT NULL AND profile_rec.bio != '' THEN
        completeness_score := completeness_score + 25;
    END IF;
    
    -- Additional profile enhancements (40 points total)
    IF EXISTS (SELECT 1 FROM board_experience WHERE profile_id = profile_uuid) THEN
        completeness_score := completeness_score + 20;
    END IF;
    
    IF EXISTS (SELECT 1 FROM work_history WHERE profile_id = profile_uuid) THEN
        completeness_score := completeness_score + 10;
    END IF;
    
    IF EXISTS (SELECT 1 FROM education WHERE profile_id = profile_uuid) THEN
        completeness_score := completeness_score + 5;
    END IF;
    
    IF EXISTS (SELECT 1 FROM certifications WHERE profile_id = profile_uuid) THEN
        completeness_score := completeness_score + 5;
    END IF;
    
    RETURN LEAST(completeness_score, 100);
END;
$$;


ALTER FUNCTION "public"."calculate_profile_completeness"("profile_uuid" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "email" "text",
    "professional_headline" "text",
    "bio" "text",
    "location" "text",
    "phone" "text",
    "linkedin_url" "text",
    "website" "text",
    "avatar_url" "text",
    "skills" "text"[] DEFAULT '{}'::"text"[],
    "languages" "text"[] DEFAULT '{English}'::"text"[],
    "sectors" "text"[] DEFAULT '{}'::"text"[],
    "has_board_experience" boolean DEFAULT false,
    "current_board_roles" integer DEFAULT 0,
    "availability_status" "text" DEFAULT 'immediately_available'::"text",
    "available_from" "date",
    "remote_work_preference" "text" DEFAULT 'hybrid'::"text",
    "compensation_expectation_min" integer,
    "compensation_expectation_max" integer,
    "compensation_currency" "text" DEFAULT 'GBP'::"text",
    "equity_interest" boolean DEFAULT false,
    "profile_completeness" integer DEFAULT 0,
    "onboarding_completed" boolean DEFAULT false,
    "is_verified" boolean DEFAULT false,
    "data_sources" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_profile_update" timestamp with time zone DEFAULT "now"(),
    "is_platform_admin" boolean DEFAULT false,
    CONSTRAINT "profiles_availability_status_enum_check" CHECK (("availability_status" = ANY (ARRAY['immediately_available'::"text", 'available_3_months'::"text", 'available_6_months'::"text", 'not_available'::"text", 'by_arrangement'::"text"]))),
    CONSTRAINT "profiles_remote_work_preference_enum_check" CHECK (("remote_work_preference" = ANY (ARRAY['no'::"text", 'hybrid'::"text", 'full'::"text", 'occasional'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."profiles" IS 'User profiles following LinkedIn-style architecture where all users are individuals who can join organizations';



COMMENT ON COLUMN "public"."profiles"."availability_status" IS 'User availability status - default is immediately_available';



COMMENT ON COLUMN "public"."profiles"."last_profile_update" IS 'Timestamp of last profile modification';



COMMENT ON COLUMN "public"."profiles"."is_platform_admin" IS 'Simple flag for platform administration access';



CREATE OR REPLACE FUNCTION "public"."calculate_profile_completeness"("profile_row" "public"."profiles") RETURNS integer
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
  DECLARE
      completeness INTEGER := 0;
  BEGIN
      -- Core Identity (40 points)
      IF profile_row.first_name IS NOT NULL AND profile_row.first_name != '' THEN completeness := completeness + 10; END IF;
      IF profile_row.last_name IS NOT NULL AND profile_row.last_name != '' THEN completeness := completeness + 10; END IF;
      IF profile_row.email IS NOT NULL AND profile_row.email != '' THEN completeness := completeness + 10; END IF;
      IF profile_row.professional_headline IS NOT NULL AND profile_row.professional_headline != '' THEN completeness := completeness + 10; END IF;

      -- Professional Profile (30 points)
      IF profile_row.bio IS NOT NULL AND profile_row.bio != '' THEN completeness := completeness + 15; END IF;
      IF profile_row.location IS NOT NULL AND profile_row.location != '' THEN completeness := completeness + 5; END IF;
      IF profile_row.skills IS NOT NULL AND array_length(profile_row.skills, 1) > 0 THEN completeness := completeness + 10; END IF;

      -- Contact Info (10 points)
      IF profile_row.phone IS NOT NULL AND profile_row.phone != '' THEN completeness := completeness + 5; END IF;
      IF profile_row.linkedin_url IS NOT NULL AND profile_row.linkedin_url != '' THEN completeness := completeness + 5; END IF;

      -- Additional fields (20 points)
      IF profile_row.languages IS NOT NULL AND array_length(profile_row.languages, 1) > 0 THEN completeness := completeness + 5; END IF;
      IF profile_row.sectors IS NOT NULL AND array_length(profile_row.sectors, 1) > 0 THEN completeness := completeness + 5; END IF;
      IF profile_row.has_board_experience = true THEN completeness := completeness + 5; END IF;
      IF profile_row.availability_status IS NOT NULL AND profile_row.availability_status != '' THEN completeness := completeness + 5; END IF;

      -- Cap at 100
      IF completeness > 100 THEN completeness := 100; END IF;

      RETURN completeness;
  END;
  $$;


ALTER FUNCTION "public"."calculate_profile_completeness"("profile_row" "public"."profiles") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_old_cv_processing_jobs"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  DELETE FROM cv_processing_jobs
  WHERE (status IN ('completed', 'failed', 'cancelled'))
    AND completed_at < NOW() - INTERVAL '7 days';
END;
$$;


ALTER FUNCTION "public"."cleanup_old_cv_processing_jobs"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_organization_owner"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    -- When creating organization, create owner membership
    IF TG_OP = 'INSERT' THEN
        INSERT INTO organization_members (
            organization_id,
            user_id,
            role,
            can_post_jobs,
            can_manage_applications,
            can_manage_organization,
            can_invite_members,
            status
        ) VALUES (
            NEW.id,
            auth.uid(),
            'owner',
            true,
            true,
            true,
            true,
            'active'
        );
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."ensure_organization_owner"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_candidate_recommendations"("p_limit" integer DEFAULT 10) RETURNS TABLE("id" "uuid", "first_name" "text", "last_name" "text", "title" "text", "profile_completeness" integer, "board_positions_count" bigint, "current_board_positions" bigint, "availability_status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.first_name,
        p.last_name,
        -- Fixed: Use professional_headline instead of title
        p.professional_headline as title,
        p.profile_completeness,
        COALESCE((SELECT COUNT(*) FROM board_experience be WHERE be.profile_id = p.id), 0) as board_positions_count,
        COALESCE((SELECT COUNT(*) FROM board_experience be WHERE be.profile_id = p.id AND be.is_current = true), 0) as current_board_positions,
        p.availability_status
    FROM profiles p
    WHERE p.role = 'candidate'
    AND p.profile_completeness >= 60
    ORDER BY p.profile_completeness DESC, p.last_profile_update DESC
    LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."get_candidate_recommendations"("p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_candidate_recommendations"("candidate_id" "uuid", "limit_count" integer DEFAULT 10) RETURNS TABLE("job_id" "uuid", "overall_score" integer, "skills_score" integer, "experience_relevance_score" integer, "sector_score" integer, "cultural_fit_score" integer, "compensation_alignment_score" integer, "location_score" integer, "recommendation_reasons" "jsonb", "job_title" "text", "organization_name" "text", "job_sector" "text", "job_location" "text")
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ns.job_id,
    ns.overall_score,
    ns.skills_score,
    COALESCE(ns.experience_relevance_score, ns.experience_score) as experience_relevance_score,
    COALESCE(ns.sector_score, 50) as sector_score,
    COALESCE(ns.cultural_fit_score, 50) as cultural_fit_score,
    COALESCE(ns.compensation_alignment_score, 50) as compensation_alignment_score,
    COALESCE(ns.location_score, 50) as location_score,
    COALESCE(ns.recommendation_reasons, '[]'::jsonb) as recommendation_reasons,
    j.title as job_title,
    j.organization_name,
    j.sector as job_sector,
    j.location as job_location
  FROM nexus_scores ns
  JOIN jobs j ON ns.job_id = j.id
  WHERE ns.candidate_id = candidate_id
    AND j.status = 'active'
    AND ns.overall_score >= 50
  ORDER BY ns.overall_score DESC, ns.calculated_at DESC
  LIMIT limit_count;
END;
$$;


ALTER FUNCTION "public"."get_candidate_recommendations"("candidate_id" "uuid", "limit_count" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_candidate_recommendations"("candidate_id" "uuid", "limit_count" integer) IS 'Returns top job recommendations for a candidate';



CREATE OR REPLACE FUNCTION "public"."get_job_candidates"("job_uuid" "uuid", "p_limit" integer DEFAULT 20) RETURNS TABLE("candidate_id" "uuid", "first_name" character varying, "last_name" character varying, "title" character varying, "profile_completeness" smallint, "nexus_score" numeric, "board_positions_count" bigint, "availability_status" "public"."availability_status_enum")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as candidate_id,
        p.first_name,
        p.last_name,
        -- Fixed: Use professional_headline instead of title
        p.professional_headline as title,
        p.profile_completeness,
        COALESCE(ns.overall_score, 0) as nexus_score,
        COALESCE((SELECT COUNT(*) FROM board_experience be WHERE be.profile_id = p.id), 0) as board_positions_count,
        p.availability_status
    FROM profiles p
    LEFT JOIN nexus_scores ns ON ns.candidate_id = p.id AND ns.job_id = job_uuid
    WHERE p.role = 'candidate'
    AND p.profile_completeness >= 50
    ORDER BY ns.overall_score DESC NULLS LAST, p.profile_completeness DESC
    LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."get_job_candidates"("job_uuid" "uuid", "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_profile_analytics"("profile_uuid" "uuid") RETURNS TABLE("total_views" bigint, "total_applications" bigint, "profile_completeness" integer, "board_positions_count" bigint, "current_positions" bigint, "last_updated" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        -- Note: user_interactions table not implemented yet, returning 0 for now
        0::bigint as total_views,
        0::bigint as total_applications,
        p.profile_completeness,
        COALESCE((SELECT COUNT(*) FROM board_experience be WHERE be.profile_id = profile_uuid), 0) as board_positions_count,
        COALESCE((SELECT COUNT(*) FROM board_experience be WHERE be.profile_id = profile_uuid AND be.is_current = true), 0) as current_positions,
        p.last_profile_update as last_updated
    FROM profiles p
    WHERE p.id = profile_uuid;
END;
$$;


ALTER FUNCTION "public"."get_profile_analytics"("profile_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_navigation"("user_uuid" "uuid") RETURNS TABLE("navigation_items" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
    user_role user_role_enum;
BEGIN
    SELECT role INTO user_role FROM profiles WHERE id = user_uuid;
    
    RETURN QUERY
    SELECT 
        CASE user_role
            WHEN 'candidate' THEN 
                '[{"label": "Dashboard", "path": "/dashboard"}, {"label": "Profile", "path": "/profile"}, {"label": "Board Positions", "path": "/board-positions"}, {"label": "Applications", "path": "/applications"}]'::jsonb
            WHEN 'organization_admin' THEN 
                '[{"label": "Dashboard", "path": "/dashboard"}, {"label": "Jobs", "path": "/jobs"}, {"label": "Candidates", "path": "/candidates"}, {"label": "Organization", "path": "/organization"}]'::jsonb
            WHEN 'organization_employee' THEN 
                '[{"label": "Dashboard", "path": "/dashboard"}, {"label": "Jobs", "path": "/jobs"}, {"label": "Candidates", "path": "/candidates"}]'::jsonb
            WHEN 'consultant' THEN 
                '[{"label": "Dashboard", "path": "/dashboard"}, {"label": "Placements", "path": "/placements"}, {"label": "Candidates", "path": "/candidates"}, {"label": "Clients", "path": "/clients"}]'::jsonb
            WHEN 'platform_admin' THEN 
                '[{"label": "Dashboard", "path": "/dashboard"}, {"label": "Users", "path": "/users"}, {"label": "Organizations", "path": "/organizations"}, {"label": "Analytics", "path": "/analytics"}]'::jsonb
            ELSE 
                '[{"label": "Dashboard", "path": "/dashboard"}]'::jsonb
        END as navigation_items;
END;
$$;


ALTER FUNCTION "public"."get_user_navigation"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_org_role"("org_id" "uuid", "user_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM organization_members 
    WHERE organization_id = org_id 
    AND organization_members.user_id = get_user_org_role.user_id
    AND status = 'active';
    
    RETURN COALESCE(user_role, 'none');
END;
$$;


ALTER FUNCTION "public"."get_user_org_role"("org_id" "uuid", "user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        first_name,
        last_name,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_org_member_with_permission"("org_id" "uuid", "user_id" "uuid", "required_permission" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM organization_members 
        WHERE organization_id = org_id 
        AND organization_members.user_id = is_org_member_with_permission.user_id
        AND status = 'active'
        AND (
            required_permission IS NULL OR
            (required_permission = 'post_jobs' AND can_post_jobs = true) OR
            (required_permission = 'manage_applications' AND can_manage_applications = true) OR
            (required_permission = 'manage_organization' AND can_manage_organization = true) OR
            (required_permission = 'invite_members' AND can_invite_members = true) OR
            (required_permission = 'admin' AND role IN ('owner', 'admin'))
        )
    );
END;
$$;


ALTER FUNCTION "public"."is_org_member_with_permission"("org_id" "uuid", "user_id" "uuid", "required_permission" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_platform_admin"("user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = user_id 
        AND is_platform_admin = true
    );
END;
$$;


ALTER FUNCTION "public"."is_platform_admin"("user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_platform_admin"("user_id" "uuid") IS 'Check if user has platform admin privileges';



CREATE OR REPLACE FUNCTION "public"."update_cv_processing_jobs_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_cv_processing_jobs_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_job_application_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE public.jobs 
        SET applications_count = (
            SELECT COUNT(*) 
            FROM public.applications 
            WHERE applications.job_id = NEW.job_id
        )
        WHERE id = NEW.job_id;
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        UPDATE public.jobs 
        SET applications_count = (
            SELECT COUNT(*) 
            FROM public.applications 
            WHERE applications.job_id = OLD.job_id
        )
        WHERE id = OLD.job_id;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_job_application_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_job_applications_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE jobs 
        SET applications_count = applications_count + 1 
        WHERE id = NEW.job_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE jobs 
        SET applications_count = GREATEST(applications_count - 1, 0) 
        WHERE id = OLD.job_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."update_job_applications_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_organization_openings"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE public.organizations 
        SET current_openings = (
            SELECT COUNT(*) 
            FROM public.jobs 
            WHERE jobs.organization_id = NEW.organization_id 
            AND jobs.status = 'active'
        )
        WHERE id = NEW.organization_id;
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        UPDATE public.organizations 
        SET current_openings = (
            SELECT COUNT(*) 
            FROM public.jobs 
            WHERE jobs.organization_id = OLD.organization_id 
            AND jobs.status = 'active'
        )
        WHERE id = OLD.organization_id;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_organization_openings"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_profile_completeness"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    NEW.profile_completeness := calculate_profile_completeness(NEW);
    NEW.updated_at := NOW();
    
    SELECT COUNT(*) > 0, COUNT(*) FILTER (WHERE is_current = true)
    INTO NEW.has_board_experience, NEW.current_board_roles
    FROM board_experience WHERE profile_id = NEW.id;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_profile_completeness"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_profile_completeness_enhanced"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    -- Update completeness calculation
    NEW.profile_completeness := calculate_profile_completeness(NEW);
    
    -- Update timestamp
    NEW.updated_at := NOW();
    NEW.last_profile_update := NOW();
    
    -- Update board experience counts
    SELECT COUNT(*) > 0, COUNT(*) FILTER (WHERE is_current = true)
    INTO NEW.has_board_experience, NEW.current_board_roles
    FROM board_experience WHERE profile_id = NEW.id;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_profile_completeness_enhanced"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_profile_completeness_on_oauth"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    NEW.profile_completeness := calculate_profile_completeness(NEW);
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_profile_completeness_on_oauth"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."achievements" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "title" character varying(300) NOT NULL,
    "category" "public"."achievement_category_enum" NOT NULL,
    "description" "text",
    "issuing_organization" character varying(200),
    "co_recipients" character varying(200)[] DEFAULT '{}'::character varying[],
    "date_received" "date" NOT NULL,
    "announcement_date" "date",
    "monetary_value" numeric(15,2),
    "geographic_scope" character varying(50),
    "selection_criteria" "text",
    "impact_description" "text",
    "media_coverage_urls" character varying(255)[] DEFAULT '{}'::character varying[],
    "verification_url" character varying(255),
    "visibility" "public"."visibility_status_enum" DEFAULT 'public'::"public"."visibility_status_enum",
    "featured" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."achievements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_id" "uuid" NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "cover_letter" "text",
    "applied_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "applications_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'reviewing'::"text", 'interview'::"text", 'rejected'::"text", 'accepted'::"text"])))
);


ALTER TABLE "public"."applications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."board_experience" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "organization" "text" NOT NULL,
    "role" "text" NOT NULL,
    "sector" "text",
    "start_date" "date" NOT NULL,
    "end_date" "date",
    "is_current" boolean DEFAULT false,
    "organization_size" "text",
    "key_contributions" "text",
    "compensation_disclosed" boolean DEFAULT false,
    "annual_fee" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "board_experience_organization_size_check" CHECK (("organization_size" = ANY (ARRAY['startup'::"text", 'small'::"text", 'medium'::"text", 'large'::"text", 'public'::"text"])))
);


ALTER TABLE "public"."board_experience" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."certifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "issuer" "text" NOT NULL,
    "issue_date" "date",
    "expiry_date" "date",
    "credential_id" "text",
    "verification_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."certifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cultural_assessment" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "assessment_version" character varying(10) DEFAULT '1.0'::character varying,
    "leadership_style" character varying(100)[] DEFAULT '{}'::character varying[],
    "communication_style" character varying(100)[] DEFAULT '{}'::character varying[],
    "decision_making_approach" character varying(100)[] DEFAULT '{}'::character varying[],
    "work_environment_preferences" character varying(100)[] DEFAULT '{}'::character varying[],
    "values_priorities" character varying(100)[] DEFAULT '{}'::character varying[],
    "change_management_style" character varying(100)[] DEFAULT '{}'::character varying[],
    "conflict_resolution_style" character varying(100)[] DEFAULT '{}'::character varying[],
    "risk_tolerance" character varying(50),
    "innovation_approach" character varying(50),
    "stakeholder_focus" character varying(100)[] DEFAULT '{}'::character varying[],
    "diversity_inclusion_commitment" smallint,
    "esg_commitment" smallint,
    "technology_adoption_rate" character varying(50),
    "global_mindset_score" smallint,
    "crisis_management_experience" character varying(100)[] DEFAULT '{}'::character varying[],
    "board_dynamics_preference" character varying(200),
    "governance_philosophy" "text",
    "completed_at" timestamp with time zone,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '2 years'::interval),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "cultural_assessment_diversity_inclusion_commitment_check" CHECK ((("diversity_inclusion_commitment" >= 1) AND ("diversity_inclusion_commitment" <= 10))),
    CONSTRAINT "cultural_assessment_esg_commitment_check" CHECK ((("esg_commitment" >= 1) AND ("esg_commitment" <= 10))),
    CONSTRAINT "cultural_assessment_global_mindset_score_check" CHECK ((("global_mindset_score" >= 1) AND ("global_mindset_score" <= 10)))
);


ALTER TABLE "public"."cultural_assessment" OWNER TO "postgres";


COMMENT ON TABLE "public"."cultural_assessment" IS 'Cultural fit assessment for board position matching';



CREATE TABLE IF NOT EXISTS "public"."cv_parsing_sessions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "progress" integer DEFAULT 0,
    "current_step" "text",
    "steps_completed" "jsonb" DEFAULT '[]'::"jsonb",
    "error" "text",
    "result" "jsonb",
    "file_name" "text",
    "file_type" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "cv_parsing_sessions_progress_check" CHECK ((("progress" >= 0) AND ("progress" <= 100))),
    CONSTRAINT "cv_parsing_sessions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."cv_parsing_sessions" OWNER TO "postgres";


COMMENT ON TABLE "public"."cv_parsing_sessions" IS 'Tracks CV parsing progress and results for better UX - references auth.users for onboarding compatibility';



CREATE TABLE IF NOT EXISTS "public"."cv_processing_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "filename" "text" NOT NULL,
    "file_size" integer NOT NULL,
    "mime_type" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "progress" integer DEFAULT 0,
    "result" "jsonb",
    "error" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "cv_processing_jobs_progress_check" CHECK ((("progress" >= 0) AND ("progress" <= 100))),
    CONSTRAINT "cv_processing_jobs_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."cv_processing_jobs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."documents" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "original_filename" character varying(255) NOT NULL,
    "stored_filename" character varying(255) NOT NULL,
    "file_path" character varying(500) NOT NULL,
    "file_size" bigint NOT NULL,
    "file_type" character varying(50) NOT NULL,
    "mime_type" character varying(100),
    "document_category" "public"."document_category_enum" NOT NULL,
    "document_subcategory" character varying(100),
    "title" character varying(200),
    "description" "text",
    "version_number" smallint DEFAULT 1,
    "is_primary" boolean DEFAULT false,
    "is_current_version" boolean DEFAULT true,
    "replaced_document_id" "uuid",
    "password_protected" boolean DEFAULT false,
    "access_level" character varying(50) DEFAULT 'private'::character varying,
    "download_count" integer DEFAULT 0,
    "last_accessed" timestamp with time zone,
    "virus_scan_status" character varying(50) DEFAULT 'pending'::character varying,
    "virus_scan_date" timestamp with time zone,
    "content_extracted" "text",
    "tags" character varying(50)[] DEFAULT '{}'::character varying[],
    "upload_ip" "inet",
    "upload_user_agent" "text",
    "retention_until" "date",
    "upload_date" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "documents_file_size_check" CHECK (("file_size" > 0)),
    CONSTRAINT "file_size_limit" CHECK (("file_size" <= 52428800)),
    CONSTRAINT "primary_document_logic" CHECK (((("is_primary" = true) AND ("document_category" = ANY (ARRAY['resume'::"public"."document_category_enum", 'cv'::"public"."document_category_enum"]))) OR ("is_primary" = false)))
);


ALTER TABLE "public"."documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."education" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "institution" "text" NOT NULL,
    "degree" "text" NOT NULL,
    "field_of_study" "text",
    "graduation_year" integer,
    "gpa" "text",
    "honors" "text"[],
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."education" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."nexus_scores" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "candidate_id" "uuid" NOT NULL,
    "job_id" "uuid" NOT NULL,
    "overall_score" numeric(5,2),
    "skills_score" numeric(5,2),
    "experience_score" numeric(5,2),
    "sector_score" numeric(5,2),
    "location_score" numeric(5,2),
    "calculation_metadata" "jsonb",
    "calculated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "cultural_fit_score" integer DEFAULT 50,
    "experience_relevance_score" integer DEFAULT 50,
    "board_experience_weight" numeric(3,2) DEFAULT 0.00,
    "compensation_alignment_score" integer DEFAULT 50,
    "skills_match_detail" "jsonb" DEFAULT '{}'::"jsonb",
    "recommendation_reasons" "jsonb" DEFAULT '[]'::"jsonb",
    "availability_score" integer DEFAULT 50,
    "remote_work_score" integer DEFAULT 50,
    CONSTRAINT "nexus_scores_experience_score_check" CHECK ((("experience_score" >= (0)::numeric) AND ("experience_score" <= (100)::numeric))),
    CONSTRAINT "nexus_scores_location_score_check" CHECK ((("location_score" >= (0)::numeric) AND ("location_score" <= (100)::numeric))),
    CONSTRAINT "nexus_scores_overall_score_check" CHECK ((("overall_score" >= (0)::numeric) AND ("overall_score" <= (100)::numeric))),
    CONSTRAINT "nexus_scores_sector_score_check" CHECK ((("sector_score" >= (0)::numeric) AND ("sector_score" <= (100)::numeric))),
    CONSTRAINT "nexus_scores_skills_score_check" CHECK ((("skills_score" >= (0)::numeric) AND ("skills_score" <= (100)::numeric)))
);


ALTER TABLE "public"."nexus_scores" OWNER TO "postgres";


COMMENT ON COLUMN "public"."nexus_scores"."cultural_fit_score" IS 'Cultural fit score based on cultural assessment (0-100)';



COMMENT ON COLUMN "public"."nexus_scores"."experience_relevance_score" IS 'Experience relevance including board experience weight (0-100)';



COMMENT ON COLUMN "public"."nexus_scores"."board_experience_weight" IS 'Weight factor for board experience (0.00-1.00)';



COMMENT ON COLUMN "public"."nexus_scores"."compensation_alignment_score" IS 'Compensation alignment score (0-100)';



COMMENT ON COLUMN "public"."nexus_scores"."skills_match_detail" IS 'Detailed breakdown of skills matching';



COMMENT ON COLUMN "public"."nexus_scores"."recommendation_reasons" IS 'Array of reasons why this match was recommended';



COMMENT ON COLUMN "public"."nexus_scores"."availability_score" IS 'Availability and timing match score (0-100)';



COMMENT ON COLUMN "public"."nexus_scores"."remote_work_score" IS 'Remote work preference match score (0-100)';



CREATE OR REPLACE VIEW "public"."enhanced_matching_analytics" AS
 SELECT "date_trunc"('day'::"text", "calculated_at") AS "date",
    "count"(*) AS "total_scores_calculated",
    "avg"("overall_score") AS "avg_overall_score",
    "avg"("skills_score") AS "avg_skills_score",
    "avg"(COALESCE(("experience_relevance_score")::numeric, "experience_score")) AS "avg_experience_score",
    "avg"(COALESCE("sector_score", (50)::numeric)) AS "avg_sector_score",
    "avg"(COALESCE("cultural_fit_score", 50)) AS "avg_cultural_fit_score",
    "avg"(COALESCE("compensation_alignment_score", 50)) AS "avg_compensation_score",
    "avg"(COALESCE("location_score", (50)::numeric)) AS "avg_geographic_score",
    "avg"(COALESCE("board_experience_weight", (0)::numeric)) AS "avg_board_experience_weight",
    "count"(*) FILTER (WHERE ("overall_score" >= (80)::numeric)) AS "high_quality_matches",
    "count"(*) FILTER (WHERE ("overall_score" >= (60)::numeric)) AS "good_matches",
    "count"(*) FILTER (WHERE ("overall_score" < (50)::numeric)) AS "poor_matches"
   FROM "public"."nexus_scores"
  WHERE ("calculated_at" >= ("now"() - '30 days'::interval))
  GROUP BY ("date_trunc"('day'::"text", "calculated_at"))
  ORDER BY ("date_trunc"('day'::"text", "calculated_at")) DESC;


ALTER VIEW "public"."enhanced_matching_analytics" OWNER TO "postgres";


COMMENT ON VIEW "public"."enhanced_matching_analytics" IS 'Analytics view for nexus score matching - security definer removed for security';



CREATE TABLE IF NOT EXISTS "public"."jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "posted_by" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "role_type" "text" NOT NULL,
    "description" "text" NOT NULL,
    "requirements" "text",
    "sector" "text",
    "required_skills" "text"[],
    "experience_required" integer,
    "board_experience_required" boolean DEFAULT false,
    "compensation_min" integer,
    "compensation_max" integer,
    "compensation_currency" "text" DEFAULT 'GBP'::"text",
    "equity_offered" boolean DEFAULT false,
    "location" "text",
    "remote_work_allowed" boolean DEFAULT false,
    "application_deadline" "date",
    "start_date" "date",
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "jobs_role_type_check" CHECK (("role_type" = ANY (ARRAY['board'::"text", 'advisory'::"text", 'executive'::"text"]))),
    CONSTRAINT "jobs_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'active'::"text", 'paused'::"text", 'closed'::"text"])))
);


ALTER TABLE "public"."jobs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organization_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid",
    "user_id" "uuid",
    "role" character varying(50) DEFAULT 'member'::character varying NOT NULL,
    "title" character varying(255),
    "department" character varying(100),
    "can_post_jobs" boolean DEFAULT false,
    "can_manage_applications" boolean DEFAULT false,
    "can_manage_organization" boolean DEFAULT false,
    "can_invite_members" boolean DEFAULT false,
    "status" character varying(20) DEFAULT 'active'::character varying,
    "invited_by" "uuid",
    "invitation_token" character varying(100),
    "invitation_expires_at" timestamp with time zone,
    "joined_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_role" CHECK ((("role")::"text" = ANY ((ARRAY['owner'::character varying, 'admin'::character varying, 'hr'::character varying, 'member'::character varying])::"text"[]))),
    CONSTRAINT "valid_status" CHECK ((("status")::"text" = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'pending'::character varying])::"text"[])))
);


ALTER TABLE "public"."organization_members" OWNER TO "postgres";


COMMENT ON TABLE "public"."organization_members" IS 'RLS enabled with non-recursive policies to fix security issues';



CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "website" "text",
    "logo_url" "text",
    "sector" "text",
    "size" "text",
    "location" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "organizations_size_check" CHECK (("size" = ANY (ARRAY['startup'::"text", 'small'::"text", 'medium'::"text", 'large'::"text", 'enterprise'::"text"])))
);


ALTER TABLE "public"."organizations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."professional_memberships" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "organization_name" character varying(200) NOT NULL,
    "organization_type" character varying(100),
    "membership_type" "public"."membership_type_enum" NOT NULL,
    "membership_level" character varying(100),
    "start_date" "date" NOT NULL,
    "end_date" "date",
    "is_current" boolean DEFAULT true,
    "membership_number" character varying(100),
    "annual_fee" numeric(10,2),
    "leadership_roles" character varying(100)[] DEFAULT '{}'::character varying[],
    "committees_served" character varying(100)[] DEFAULT '{}'::character varying[],
    "benefits_received" character varying(200)[] DEFAULT '{}'::character varying[],
    "networking_value" character varying(50),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "current_membership_check" CHECK (((("is_current" = true) AND ("end_date" IS NULL)) OR (("is_current" = false) AND ("end_date" IS NOT NULL)))),
    CONSTRAINT "valid_membership_dates" CHECK ((("end_date" IS NULL) OR ("end_date" >= "start_date")))
);


ALTER TABLE "public"."professional_memberships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."professional_references" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "reference_type" character varying(50) DEFAULT 'professional'::character varying,
    "name" character varying(200) NOT NULL,
    "title" character varying(200),
    "company" character varying(200),
    "email" character varying(255),
    "phone" character varying(20),
    "linkedin_url" character varying(255),
    "relationship" character varying(200) NOT NULL,
    "relationship_duration_years" smallint,
    "direct_supervisor" boolean DEFAULT false,
    "board_colleague" boolean DEFAULT false,
    "can_contact" boolean DEFAULT false,
    "preferred_contact_method" character varying(50) DEFAULT 'email'::character varying,
    "best_contact_time" character varying(100),
    "reference_strength" character varying(50),
    "reference_provided" boolean DEFAULT false,
    "reference_text" "text",
    "reference_rating" smallint,
    "date_provided" "date",
    "last_contacted" "date",
    "notes" "text",
    "visibility" "public"."visibility_status_enum" DEFAULT 'private'::"public"."visibility_status_enum",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "professional_references_reference_rating_check" CHECK ((("reference_rating" >= 1) AND ("reference_rating" <= 10)))
);


ALTER TABLE "public"."professional_references" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."work_experience" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "company" "text" NOT NULL,
    "title" "text" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date",
    "is_current" boolean DEFAULT false,
    "description" "text",
    "key_achievements" "text"[],
    "company_size" "text",
    "location" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "work_experience_company_size_check" CHECK (("company_size" = ANY (ARRAY['startup'::"text", 'small'::"text", 'medium'::"text", 'large'::"text", 'enterprise'::"text"])))
);


ALTER TABLE "public"."work_experience" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."profile_summary" AS
 SELECT "id",
    "first_name",
    "last_name",
    "professional_headline",
    "bio",
    "location",
    "skills",
    "languages",
    "has_board_experience",
    "current_board_roles",
    "availability_status",
    "is_verified",
    "profile_completeness",
    ( SELECT "we"."company"
           FROM "public"."work_experience" "we"
          WHERE ("we"."profile_id" = "p"."id")
          ORDER BY "we"."start_date" DESC
         LIMIT 1) AS "current_company",
    ( SELECT EXTRACT(year FROM "age"((COALESCE("max"(
                CASE
                    WHEN "we"."is_current" THEN CURRENT_DATE
                    ELSE "we"."end_date"
                END), CURRENT_DATE))::timestamp with time zone, ("min"("we"."start_date"))::timestamp with time zone)) AS "extract"
           FROM "public"."work_experience" "we"
          WHERE ("we"."profile_id" = "p"."id")) AS "years_experience",
    "created_at",
    "updated_at"
   FROM "public"."profiles" "p";


ALTER VIEW "public"."profile_summary" OWNER TO "postgres";


COMMENT ON VIEW "public"."profile_summary" IS 'Summary view of user profiles with corrected field references';



CREATE TABLE IF NOT EXISTS "public"."user_interactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "job_id" "uuid",
    "interaction_type" "public"."interaction_type_enum" NOT NULL,
    "interaction_data" "jsonb" DEFAULT '{}'::"jsonb",
    "session_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_interactions" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_interactions" IS 'Tracks user interactions for ML data collection and analytics';



CREATE TABLE IF NOT EXISTS "public"."voice_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "session_data" "jsonb" DEFAULT '{}'::"jsonb",
    "transcript" "text",
    "profile_updates" "jsonb" DEFAULT '{}'::"jsonb",
    "completed" boolean DEFAULT false,
    "session_duration" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone
);


ALTER TABLE "public"."voice_sessions" OWNER TO "postgres";


ALTER TABLE ONLY "public"."achievements"
    ADD CONSTRAINT "achievements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_job_id_profile_id_key" UNIQUE ("job_id", "profile_id");



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."board_experience"
    ADD CONSTRAINT "board_experience_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."certifications"
    ADD CONSTRAINT "certifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cultural_assessment"
    ADD CONSTRAINT "cultural_assessment_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cv_parsing_sessions"
    ADD CONSTRAINT "cv_parsing_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cv_processing_jobs"
    ADD CONSTRAINT "cv_processing_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."education"
    ADD CONSTRAINT "education_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nexus_scores"
    ADD CONSTRAINT "nexus_scores_candidate_id_job_id_key" UNIQUE ("candidate_id", "job_id");



ALTER TABLE ONLY "public"."nexus_scores"
    ADD CONSTRAINT "nexus_scores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_organization_id_user_id_key" UNIQUE ("organization_id", "user_id");



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."professional_memberships"
    ADD CONSTRAINT "professional_memberships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."professional_references"
    ADD CONSTRAINT "professional_references_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_interactions"
    ADD CONSTRAINT "user_interactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."voice_sessions"
    ADD CONSTRAINT "voice_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."work_experience"
    ADD CONSTRAINT "work_experience_pkey" PRIMARY KEY ("id");



CREATE INDEX "cv_processing_jobs_created_at_idx" ON "public"."cv_processing_jobs" USING "btree" ("created_at" DESC);



CREATE INDEX "cv_processing_jobs_status_idx" ON "public"."cv_processing_jobs" USING "btree" ("status");



CREATE INDEX "cv_processing_jobs_user_id_idx" ON "public"."cv_processing_jobs" USING "btree" ("user_id");



CREATE INDEX "idx_achievements_profile_id" ON "public"."achievements" USING "btree" ("profile_id");



CREATE INDEX "idx_applications_job" ON "public"."applications" USING "btree" ("job_id");



CREATE INDEX "idx_applications_profile" ON "public"."applications" USING "btree" ("profile_id");



CREATE INDEX "idx_applications_status" ON "public"."applications" USING "btree" ("status");



CREATE INDEX "idx_board_experience_current" ON "public"."board_experience" USING "btree" ("is_current");



CREATE INDEX "idx_board_experience_profile" ON "public"."board_experience" USING "btree" ("profile_id");



CREATE INDEX "idx_board_experience_sector" ON "public"."board_experience" USING "btree" ("sector");



CREATE INDEX "idx_cultural_assessment_profile_id" ON "public"."cultural_assessment" USING "btree" ("profile_id");



CREATE INDEX "idx_cv_parsing_sessions_created_at" ON "public"."cv_parsing_sessions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_cv_parsing_sessions_status" ON "public"."cv_parsing_sessions" USING "btree" ("status");



CREATE INDEX "idx_cv_parsing_sessions_user_id" ON "public"."cv_parsing_sessions" USING "btree" ("user_id");



CREATE INDEX "idx_documents_category" ON "public"."documents" USING "btree" ("profile_id", "document_category");



CREATE INDEX "idx_documents_current" ON "public"."documents" USING "btree" ("profile_id", "is_current_version") WHERE ("is_current_version" = true);



CREATE INDEX "idx_documents_primary" ON "public"."documents" USING "btree" ("profile_id", "is_primary") WHERE ("is_primary" = true);



CREATE INDEX "idx_documents_profile_id" ON "public"."documents" USING "btree" ("profile_id");



CREATE INDEX "idx_jobs_organization" ON "public"."jobs" USING "btree" ("organization_id");



CREATE INDEX "idx_jobs_role_type" ON "public"."jobs" USING "btree" ("role_type");



CREATE INDEX "idx_jobs_sector" ON "public"."jobs" USING "btree" ("sector");



CREATE INDEX "idx_jobs_status" ON "public"."jobs" USING "btree" ("status");



CREATE INDEX "idx_nexus_scores_availability" ON "public"."nexus_scores" USING "btree" ("availability_score");



CREATE INDEX "idx_nexus_scores_board_experience_weight" ON "public"."nexus_scores" USING "btree" ("board_experience_weight");



CREATE INDEX "idx_nexus_scores_compensation_alignment" ON "public"."nexus_scores" USING "btree" ("compensation_alignment_score");



CREATE INDEX "idx_nexus_scores_cultural_fit" ON "public"."nexus_scores" USING "btree" ("cultural_fit_score");



CREATE INDEX "idx_nexus_scores_enhanced_composite" ON "public"."nexus_scores" USING "btree" ("overall_score", "availability_score", "remote_work_score");



CREATE INDEX "idx_nexus_scores_experience_relevance" ON "public"."nexus_scores" USING "btree" ("experience_relevance_score");



CREATE INDEX "idx_nexus_scores_overall_score" ON "public"."nexus_scores" USING "btree" ("overall_score");



CREATE INDEX "idx_nexus_scores_remote_work" ON "public"."nexus_scores" USING "btree" ("remote_work_score");



CREATE INDEX "idx_organization_members_org_id" ON "public"."organization_members" USING "btree" ("organization_id");



CREATE INDEX "idx_organization_members_role_status" ON "public"."organization_members" USING "btree" ("role", "status");



CREATE INDEX "idx_organization_members_user_id" ON "public"."organization_members" USING "btree" ("user_id");



CREATE INDEX "idx_professional_memberships_profile_id" ON "public"."professional_memberships" USING "btree" ("profile_id");



CREATE INDEX "idx_profiles_availability" ON "public"."profiles" USING "btree" ("availability_status");



CREATE INDEX "idx_profiles_last_update" ON "public"."profiles" USING "btree" ("last_profile_update" DESC);



CREATE INDEX "idx_profiles_location" ON "public"."profiles" USING "btree" ("location");



CREATE INDEX "idx_profiles_onboarding" ON "public"."profiles" USING "btree" ("onboarding_completed");



CREATE INDEX "idx_profiles_sectors" ON "public"."profiles" USING "gin" ("sectors");



CREATE INDEX "idx_profiles_skills" ON "public"."profiles" USING "gin" ("skills");



CREATE INDEX "idx_references_profile_id" ON "public"."professional_references" USING "btree" ("profile_id");



CREATE INDEX "idx_user_interactions_created_at" ON "public"."user_interactions" USING "btree" ("created_at");



CREATE INDEX "idx_user_interactions_job_id" ON "public"."user_interactions" USING "btree" ("job_id");



CREATE INDEX "idx_user_interactions_type" ON "public"."user_interactions" USING "btree" ("interaction_type");



CREATE INDEX "idx_user_interactions_user_id" ON "public"."user_interactions" USING "btree" ("user_id");



CREATE INDEX "idx_voice_sessions_completed" ON "public"."voice_sessions" USING "btree" ("completed");



CREATE INDEX "idx_voice_sessions_created_at" ON "public"."voice_sessions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_voice_sessions_user_id" ON "public"."voice_sessions" USING "btree" ("user_id");



CREATE INDEX "idx_work_experience_company" ON "public"."work_experience" USING "btree" ("company");



CREATE INDEX "idx_work_experience_current" ON "public"."work_experience" USING "btree" ("is_current");



CREATE INDEX "idx_work_experience_profile" ON "public"."work_experience" USING "btree" ("profile_id");



CREATE INDEX "nexus_scores_candidate_idx" ON "public"."nexus_scores" USING "btree" ("candidate_id");



CREATE INDEX "nexus_scores_job_idx" ON "public"."nexus_scores" USING "btree" ("job_id");



CREATE INDEX "nexus_scores_overall_idx" ON "public"."nexus_scores" USING "btree" ("overall_score" DESC);



CREATE OR REPLACE TRIGGER "trigger_update_profile_completeness_enhanced" BEFORE INSERT OR UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_profile_completeness_enhanced"();



CREATE OR REPLACE TRIGGER "update_cv_parsing_sessions_updated_at" BEFORE UPDATE ON "public"."cv_parsing_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_cv_processing_jobs_updated_at" BEFORE UPDATE ON "public"."cv_processing_jobs" FOR EACH ROW EXECUTE FUNCTION "public"."update_cv_processing_jobs_updated_at"();



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."board_experience"
    ADD CONSTRAINT "board_experience_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."certifications"
    ADD CONSTRAINT "certifications_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cv_parsing_sessions"
    ADD CONSTRAINT "cv_parsing_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cv_processing_jobs"
    ADD CONSTRAINT "cv_processing_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_replaced_document_id_fkey" FOREIGN KEY ("replaced_document_id") REFERENCES "public"."documents"("id");



ALTER TABLE ONLY "public"."education"
    ADD CONSTRAINT "education_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_posted_by_fkey" FOREIGN KEY ("posted_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."work_experience"
    ADD CONSTRAINT "work_experience_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Active jobs are viewable" ON "public"."jobs" FOR SELECT USING (("status" = 'active'::"text"));



CREATE POLICY "Admins can delete organization members" ON "public"."organization_members" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."organization_members" "existing"
  WHERE (("existing"."organization_id" = "organization_members"."organization_id") AND ("existing"."user_id" = "auth"."uid"()) AND (("existing"."role")::"text" = ANY ((ARRAY['owner'::character varying, 'admin'::character varying])::"text"[])) AND (("existing"."status")::"text" = 'active'::"text")))));



CREATE POLICY "Admins can insert organization members" ON "public"."organization_members" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."organization_members" "existing"
  WHERE (("existing"."organization_id" = "organization_members"."organization_id") AND ("existing"."user_id" = "auth"."uid"()) AND (("existing"."role")::"text" = ANY ((ARRAY['owner'::character varying, 'admin'::character varying])::"text"[])) AND (("existing"."status")::"text" = 'active'::"text")))));



CREATE POLICY "Admins can update organization members" ON "public"."organization_members" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."organization_members" "existing"
  WHERE (("existing"."organization_id" = "organization_members"."organization_id") AND ("existing"."user_id" = "auth"."uid"()) AND (("existing"."role")::"text" = ANY ((ARRAY['owner'::character varying, 'admin'::character varying])::"text"[])) AND (("existing"."status")::"text" = 'active'::"text")))));



CREATE POLICY "All organizations are viewable" ON "public"."organizations" FOR SELECT USING (true);



CREATE POLICY "Candidates can view own nexus scores" ON "public"."nexus_scores" FOR SELECT USING (("auth"."uid"() = "candidate_id"));



CREATE POLICY "Completed profiles are publicly viewable" ON "public"."profiles" FOR SELECT USING (("onboarding_completed" = true));



CREATE POLICY "Job posters can view applications to their jobs" ON "public"."applications" FOR SELECT USING (("job_id" IN ( SELECT "jobs"."id"
   FROM "public"."jobs"
  WHERE ("jobs"."posted_by" = "auth"."uid"()))));



CREATE POLICY "Service role can update parsing sessions" ON "public"."cv_parsing_sessions" FOR UPDATE USING (true);



CREATE POLICY "Users can create own parsing sessions" ON "public"."cv_parsing_sessions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own jobs" ON "public"."cv_processing_jobs" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own documents" ON "public"."documents" FOR DELETE USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can delete own profile" ON "public"."profiles" FOR DELETE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can delete own voice_sessions" ON "public"."voice_sessions" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can delete their own achievements" ON "public"."achievements" FOR DELETE USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can delete their own cultural assessment" ON "public"."cultural_assessment" FOR DELETE USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can delete their own jobs" ON "public"."cv_processing_jobs" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own professional memberships" ON "public"."professional_memberships" FOR DELETE USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can delete their own professional references" ON "public"."professional_references" FOR DELETE USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can insert own documents" ON "public"."documents" FOR INSERT WITH CHECK (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can insert own interactions" ON "public"."user_interactions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert own voice_sessions" ON "public"."voice_sessions" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert their own achievements" ON "public"."achievements" FOR INSERT WITH CHECK (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can insert their own cultural assessment" ON "public"."cultural_assessment" FOR INSERT WITH CHECK (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can insert their own professional memberships" ON "public"."professional_memberships" FOR INSERT WITH CHECK (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can insert their own professional references" ON "public"."professional_references" FOR INSERT WITH CHECK (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can manage own applications" ON "public"."applications" USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can manage own board experience" ON "public"."board_experience" USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can manage own certifications" ON "public"."certifications" USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can manage own education" ON "public"."education" USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can manage own job postings" ON "public"."jobs" USING (("posted_by" = "auth"."uid"()));



CREATE POLICY "Users can manage own organizations" ON "public"."organizations" USING (("created_by" = "auth"."uid"()));



CREATE POLICY "Users can manage own work experience" ON "public"."work_experience" USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can select own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own documents" ON "public"."documents" FOR UPDATE USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can update own interactions" ON "public"."user_interactions" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own voice_sessions" ON "public"."voice_sessions" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own achievements" ON "public"."achievements" FOR UPDATE USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can update their own cultural assessment" ON "public"."cultural_assessment" FOR UPDATE USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can update their own jobs" ON "public"."cv_processing_jobs" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own professional memberships" ON "public"."professional_memberships" FOR UPDATE USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can update their own professional references" ON "public"."professional_references" FOR UPDATE USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can view organization members" ON "public"."organization_members" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR ("organization_id" IN ( SELECT "om2"."organization_id"
   FROM "public"."organization_members" "om2"
  WHERE (("om2"."user_id" = "auth"."uid"()) AND (("om2"."status")::"text" = 'active'::"text"))))));



CREATE POLICY "Users can view own documents" ON "public"."documents" FOR SELECT USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can view own interactions" ON "public"."user_interactions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own parsing sessions" ON "public"."cv_parsing_sessions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own voice_sessions" ON "public"."voice_sessions" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own achievements" ON "public"."achievements" FOR SELECT USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can view their own cultural assessment" ON "public"."cultural_assessment" FOR SELECT USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can view their own jobs" ON "public"."cv_processing_jobs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own professional memberships" ON "public"."professional_memberships" FOR SELECT USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can view their own professional references" ON "public"."professional_references" FOR SELECT USING (("auth"."uid"() = "profile_id"));



ALTER TABLE "public"."achievements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."applications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."board_experience" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."certifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cultural_assessment" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cv_parsing_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cv_processing_jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."education" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."nexus_scores" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organization_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."professional_memberships" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."professional_references" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_interactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."voice_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."work_experience" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."calculate_enhanced_profile_completeness"("profile_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_enhanced_profile_completeness"("profile_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_enhanced_profile_completeness"("profile_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_profile_completeness"("profile_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_profile_completeness"("profile_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_profile_completeness"("profile_uuid" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_profile_completeness"("profile_row" "public"."profiles") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_profile_completeness"("profile_row" "public"."profiles") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_profile_completeness"("profile_row" "public"."profiles") TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_old_cv_processing_jobs"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_cv_processing_jobs"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_cv_processing_jobs"() TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_organization_owner"() TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_organization_owner"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_organization_owner"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_candidate_recommendations"("p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_candidate_recommendations"("p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_candidate_recommendations"("p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_candidate_recommendations"("candidate_id" "uuid", "limit_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_candidate_recommendations"("candidate_id" "uuid", "limit_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_candidate_recommendations"("candidate_id" "uuid", "limit_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_job_candidates"("job_uuid" "uuid", "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_job_candidates"("job_uuid" "uuid", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_job_candidates"("job_uuid" "uuid", "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_profile_analytics"("profile_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_profile_analytics"("profile_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_profile_analytics"("profile_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_navigation"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_navigation"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_navigation"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_org_role"("org_id" "uuid", "user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_org_role"("org_id" "uuid", "user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_org_role"("org_id" "uuid", "user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_org_member_with_permission"("org_id" "uuid", "user_id" "uuid", "required_permission" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."is_org_member_with_permission"("org_id" "uuid", "user_id" "uuid", "required_permission" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_org_member_with_permission"("org_id" "uuid", "user_id" "uuid", "required_permission" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_platform_admin"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_platform_admin"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_platform_admin"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_cv_processing_jobs_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_cv_processing_jobs_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_cv_processing_jobs_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_job_application_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_job_application_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_job_application_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_job_applications_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_job_applications_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_job_applications_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_organization_openings"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_organization_openings"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_organization_openings"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_profile_completeness"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_profile_completeness"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_profile_completeness"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_profile_completeness_enhanced"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_profile_completeness_enhanced"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_profile_completeness_enhanced"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_profile_completeness_on_oauth"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_profile_completeness_on_oauth"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_profile_completeness_on_oauth"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."achievements" TO "anon";
GRANT ALL ON TABLE "public"."achievements" TO "authenticated";
GRANT ALL ON TABLE "public"."achievements" TO "service_role";



GRANT ALL ON TABLE "public"."applications" TO "anon";
GRANT ALL ON TABLE "public"."applications" TO "authenticated";
GRANT ALL ON TABLE "public"."applications" TO "service_role";



GRANT ALL ON TABLE "public"."board_experience" TO "anon";
GRANT ALL ON TABLE "public"."board_experience" TO "authenticated";
GRANT ALL ON TABLE "public"."board_experience" TO "service_role";



GRANT ALL ON TABLE "public"."certifications" TO "anon";
GRANT ALL ON TABLE "public"."certifications" TO "authenticated";
GRANT ALL ON TABLE "public"."certifications" TO "service_role";



GRANT ALL ON TABLE "public"."cultural_assessment" TO "anon";
GRANT ALL ON TABLE "public"."cultural_assessment" TO "authenticated";
GRANT ALL ON TABLE "public"."cultural_assessment" TO "service_role";



GRANT ALL ON TABLE "public"."cv_parsing_sessions" TO "anon";
GRANT ALL ON TABLE "public"."cv_parsing_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."cv_parsing_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."cv_processing_jobs" TO "anon";
GRANT ALL ON TABLE "public"."cv_processing_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."cv_processing_jobs" TO "service_role";



GRANT ALL ON TABLE "public"."documents" TO "anon";
GRANT ALL ON TABLE "public"."documents" TO "authenticated";
GRANT ALL ON TABLE "public"."documents" TO "service_role";



GRANT ALL ON TABLE "public"."education" TO "anon";
GRANT ALL ON TABLE "public"."education" TO "authenticated";
GRANT ALL ON TABLE "public"."education" TO "service_role";



GRANT ALL ON TABLE "public"."nexus_scores" TO "anon";
GRANT ALL ON TABLE "public"."nexus_scores" TO "authenticated";
GRANT ALL ON TABLE "public"."nexus_scores" TO "service_role";



GRANT ALL ON TABLE "public"."enhanced_matching_analytics" TO "anon";
GRANT ALL ON TABLE "public"."enhanced_matching_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."enhanced_matching_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."jobs" TO "anon";
GRANT ALL ON TABLE "public"."jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."jobs" TO "service_role";



GRANT ALL ON TABLE "public"."organization_members" TO "anon";
GRANT ALL ON TABLE "public"."organization_members" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_members" TO "service_role";



GRANT ALL ON TABLE "public"."organizations" TO "anon";
GRANT ALL ON TABLE "public"."organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."organizations" TO "service_role";



GRANT ALL ON TABLE "public"."professional_memberships" TO "anon";
GRANT ALL ON TABLE "public"."professional_memberships" TO "authenticated";
GRANT ALL ON TABLE "public"."professional_memberships" TO "service_role";



GRANT ALL ON TABLE "public"."professional_references" TO "anon";
GRANT ALL ON TABLE "public"."professional_references" TO "authenticated";
GRANT ALL ON TABLE "public"."professional_references" TO "service_role";



GRANT ALL ON TABLE "public"."work_experience" TO "anon";
GRANT ALL ON TABLE "public"."work_experience" TO "authenticated";
GRANT ALL ON TABLE "public"."work_experience" TO "service_role";



GRANT ALL ON TABLE "public"."profile_summary" TO "anon";
GRANT ALL ON TABLE "public"."profile_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."profile_summary" TO "service_role";



GRANT ALL ON TABLE "public"."user_interactions" TO "anon";
GRANT ALL ON TABLE "public"."user_interactions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_interactions" TO "service_role";



GRANT ALL ON TABLE "public"."voice_sessions" TO "anon";
GRANT ALL ON TABLE "public"."voice_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."voice_sessions" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
