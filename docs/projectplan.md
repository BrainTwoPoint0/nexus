# Project Plan: Rebuild Profile System from Schema

## Problem Analysis

**Primary Issue**: Profile data not being stored or visualized correctly

The current profile editing and display system has fundamental issues:

- Profile data from CV parsing isn't being stored correctly in the database
- Profile visualization on `/profile` doesn't match the actual schema
- Misalignment between what's parsed, what's stored, and what's displayed
- Database schema mismatch causing 500 errors (e.g., non-existent `company` field)

**Root Cause**: The profile components were built without proper reference to the actual database schema

## Schema Analysis

**Actual Database Schema:**

**`profiles` table:**

- `id`, `first_name`, `last_name`, `email`, `professional_headline`, `bio`
- `location`, `phone`, `linkedin_url`, `website`, `avatar_url`
- `skills[]`, `languages[]`, `sectors[]`
- `has_board_experience`, `current_board_roles`, `availability_status`
- `profile_completeness`, `onboarding_completed`, `data_sources`

**`work_experience` table:**

- `profile_id`, `company`, `title`, `start_date`, `end_date`, `is_current`
- `description`, `key_achievements[]`, `company_size`, `location`

**`board_experience` table:**

- `profile_id`, `organization`, `role`, `sector`, `start_date`, `end_date`, `is_current`
- `organization_size`, `key_contributions`, `compensation_disclosed`, `annual_fee`

**`education` table:**

- `profile_id`, `institution`, `degree`, `field_of_study`, `graduation_year`
- `gpa`, `honors[]`, `description`

**Current Issues:**

- Profile components don't match this schema
- Data visualization doesn't query the correct tables
- CV parsing maps to non-existent fields

## Todo Items

### Phase 1: Complete Profile Section Overhaul (Priority)

- [x] **Analyze current profile system and schema alignment**
  - ✅ Identified profile page uses components that don't match schema
  - ✅ Found multiple tables (work_experience, board_experience, education) not properly queried
  - ✅ Confirmed CV data mapping errors causing 500 errors

- [ ] **Complete deletion of existing profile system**
  - Delete `/profile/page.tsx`, `/profile/edit/page.tsx`, `/profile/view/page.tsx`
  - Delete all profile manager components (`BoardExperienceManager`, `WorkHistoryManager`, etc.)
  - Delete `/components/profile/` directory entirely
  - Clean up any profile-related API routes that don't work

- [ ] **Design new profile architecture**
  - Create modern, clean profile layout using shadcn/ui components
  - Design responsive profile display with proper visual hierarchy
  - Plan intuitive editing interfaces for each data section
  - Define consistent design patterns and component structure

- [ ] **Build new profile display system**
  - Create `/profile/page.tsx` - modern profile overview page
  - Build profile header with avatar, name, headline, contact info
  - Create work experience timeline with proper date handling
  - Build board experience cards with role details
  - Add education section with institution badges
  - Show skills as interactive tags, languages with proficiency levels

- [ ] **Build new profile editing system**
  - Create `/profile/edit/page.tsx` - comprehensive editing interface
  - Build inline editing components for basic profile info
  - Create modal/drawer forms for adding work experience
  - Build board experience editor with validation
  - Add education form with degree/institution autocomplete
  - Create skills/languages tag editors with suggestions

- [ ] **Build new API layer**
  - Create `/api/profile/` endpoints that properly query all tables
  - Build `/api/profile/work-experience/` CRUD endpoints
  - Create `/api/profile/board-experience/` CRUD endpoints
  - Add `/api/profile/education/` management endpoints
  - Implement proper error handling and validation

- [ ] **Implement modern profile features**
  - Add profile completeness indicator with visual progress
  - Build export profile functionality (PDF generation)
  - Add profile sharing capabilities
  - Implement profile analytics/views tracking
  - Create profile comparison tools

## Review Section

### Current Task: CV Data Review Display Fixes (August 3, 2025)

This task focused on fixing the CV review display issues where parsed data wasn't appearing correctly in the review section.

**Issues Identified:**

1. **Date Display**: Start and end dates weren't showing in work experience and board roles despite being parsed correctly
2. **Missing Sections**: Board experience wasn't displaying at all
3. **Current Role Info**: Professional summary section wasn't showing current role/company
4. **Format Inconsistency**: Review format didn't match the expected UI pattern with "CV" badges

**Root Cause Analysis:**

From the logs, we could see that the CV parser was working correctly:

- Dates were being extracted properly (e.g., "January 2022")
- Board experience was being parsed (3 roles detected)
- Current role and company were being identified

The issue was in the display component (`cv-data-review.tsx`) which wasn't:

- Accessing the correct field names for dates (`start_date` vs `startDate`)
- Displaying board experience section at all
- Showing current role/company information
- Following the expected UI pattern with source badges

**Changes Made:**

**1. Fixed Date Display (`cv-data-review.tsx`):**

- Updated `formatWorkExperience` function to check `start_date` first, then fallback to `startDate`
- Added proper current position detection using `is_current` field
- Changed fallback text from "Employment Period Not Specified" to "Not provided"
- Fixed work experience display to show individual date fields instead of formatted range

**2. Added Board Experience Section:**

- Added complete board experience display section after work experience
- Implemented consistent formatting with field labels and "CV" badges
- Added proper date display for board roles (start_date/end_date)
- Included key contributions display when available

**3. Enhanced Professional Summary:**

- Added display for `currentRole` and `currentCompany` fields
- Updated to show current role and company with proper "CV" source badges
- Maintained backward compatibility with existing `title` field

**4. Improved Personal Information Display:**

- Updated all personal info fields to use consistent label + badge + value format
- Added proper "CV" source badges to match expected UI
- Improved layout consistency across all sections

**5. Updated Professional Bio Section:**

- Added "CV" source badge to professional bio
- Maintained existing styling but improved labeling consistency

**Results:**

- ✅ All parsed CV data now displays correctly in the review section
- ✅ Dates show individually as "Start Date: January 2022" / "End Date: Not provided"
- ✅ Board experience section properly displays all 3 roles
- ✅ Current role and company information now visible in Professional Summary
- ✅ Consistent UI pattern with field labels and "CV" source badges throughout

### Follow-up Task: Remove CV Review Section Entirely (August 3, 2025)

After implementing the display fixes, the user decided to remove the entire CV review section since dates were still showing as "Not provided" despite being parsed correctly.

**Changes Made:**

**1. Updated CV Review Page (`/profile/cv-review/page.tsx`):**

- Removed all CV review display components and UI
- Changed to automatically apply CV data without manual review
- Added loading state: "Applying CV Data" with spinner
- Automatically redirects to dashboard after successful application
- Removed manual approve/reject functionality
- Maintained all data loading logic for backward compatibility

**2. Removed Unused Component:**

- Deleted `src/components/ui/cv-data-review.tsx` entirely
- Confirmed no other files were importing this component
- Verified TypeScript compilation and build process still work

**3. Simplified User Flow:**

- CV data now applies automatically after parsing
- No manual review step required
- Users see: "We're automatically applying your CV data to your profile..."
- Direct redirect to dashboard upon completion
- Error handling still in place for failed applications

**Final Results:**

- ✅ CV review section completely removed from `/profile/cv-review`
- ✅ Automatic CV data application implemented
- ✅ User flow simplified from: Parse → Review → Apply → Dashboard to: Parse → Apply → Dashboard
- ✅ No TypeScript errors or build issues
- ✅ All session storage cleanup maintained
- ✅ Error handling preserved for edge cases

### Additional Fix: Remove Review from Onboarding Flow (August 3, 2025)

The user was still seeing the review interface because they were on the onboarding page (`/onboarding`), not the CV review page. The onboarding page was using `CVDataReviewEditable` component which still showed the manual review step.

**Changes Made:**

**1. Updated Onboarding Handler (`/onboarding/page.tsx`):**

- Modified `handleCVPreviewContinue` to automatically submit CV data instead of going to review step
- Added `await handleProfileSubmit(cvData)` to auto-apply data after CV preview
- Removed review step from user flow entirely

**2. Updated Onboarding UI:**

- Changed "Step 2: Review & Submit" to "Step 2: Create Profile"
- Updated description from "Review your complete profile before submission" to "Automatically create your profile from CV data"
- Removed review step rendering (`currentStep === 'review'` section)
- Removed import of unused `CVDataReviewEditable` component

**3. Simplified Onboarding Flow:**

- **Before**: Upload CV → Preview CV → Manual Review → Submit → Complete
- **After**: Upload CV → Preview CV → Auto-Submit → Complete
- Users now go directly from CV preview to profile completion

**Results:**

- ✅ Manual review step completely removed from onboarding flow
- ✅ CV data automatically applied after preview step
- ✅ Onboarding flow now: Upload → Preview → Auto-Create Profile → Dashboard
- ✅ No more confusing review interface with "Not provided" dates
- ✅ Maintained all error handling and session management
- ✅ TypeScript compilation verified successful

## Voice Assistant Implementation Plan (August 3, 2025)

### Overview

Implementing an AI voice assistant after CV parsing step using OpenAI's Realtime API. The assistant will conduct an interactive interview to gather missing profile information, with the following key features:

1. **Dynamic Question Generation**: Analyze parsed CV data against database schema to identify missing fields
2. **Natural Conversation**: Voice-to-voice interaction without intermediate text processing
3. **Real-time Profile Updates**: Update profile fields as information is gathered
4. **Auto-termination**: End conversation when all required data is collected

### Architecture Design

**Flow**: CV Upload → Parse → Voice Interview → Complete Profile → Dashboard

**Key Components**:

1. **Voice Conversation Component** (`VoiceConversationRealtime`)
   - WebRTC connection for audio streaming
   - Visual interface with recording indicator
   - Real-time transcript display
2. **Token Generation API** (`/api/voice/realtime-token`)
   - Generate ephemeral tokens for secure client connections
   - Cache tokens to reduce API calls
3. **Profile Analysis System**
   - Compare CV data against schema requirements
   - Generate dynamic question list
   - Track field completion status
4. **Data Extraction API** (`/api/voice/extract-data`)
   - Process conversation transcript
   - Extract structured data from responses
   - Update profile in real-time

### Database Schema Fields to Fill

**From profiles table**:

- `phone`, `linkedin_url`, `website` (contact info)
- `skills[]`, `languages[]`, `sectors[]` (professional attributes)
- `availability_status`, `available_from` (availability)
- `remote_work_preference`, `compensation_expectation_min/max` (preferences)

**From work_experience table**:

- `key_achievements[]`, `company_size` (enhance existing entries)

**From board_experience table**:

- `key_contributions`, `compensation_disclosed`, `annual_fee`

**From education table**:

- `honors[]`, `gpa` (additional details)

### Implementation Steps

1. **Create Voice Assistant Integration Point**
   - Add new step after CV preview: 'voice-interview'
   - Update onboarding flow states
   - Create transition UI

2. **Build Token Generation Endpoint**
   - Server-side endpoint for ephemeral tokens
   - Implement caching mechanism
   - Add security headers

3. **Create Voice Conversation Component**
   - WebRTC audio setup
   - Recording UI with visual feedback
   - Transcript display
   - Error handling

4. **Implement Profile Field Analysis**
   - Function to compare CV data vs schema
   - Identify missing/incomplete fields
   - Generate priority question list

5. **Build AI Context System**
   - Initialize session with CV data context
   - Dynamic prompt generation based on missing fields
   - Conversation flow management

6. **Create Data Extraction Pipeline**
   - Parse conversation transcript
   - Extract structured data
   - Map to database fields
   - Update profile in real-time

7. **Implement Auto-termination**
   - Monitor field completion
   - Detect conversation end signals
   - Graceful conversation closure
   - Automatic progression to next step

## Current Issue: CV Preview Continue Button Triggers Profile Save (August 3, 2025)

### Problem Analysis

After CV parsing, when user clicks "Continue" from CV preview step, the system is attempting to save the profile before starting the voice AI interview. This breaks the intended flow of: CV → Voice Interview → Profile Save.

### Investigation Plan

1. **Analyze CV Preview Continue Flow**
   - [ ] Examine `handleCVPreviewContinue()` function in onboarding/page.tsx:94
   - [ ] Check if there are any unintended API calls or profile submission triggers
   - [ ] Verify the step transition logic

2. **Debug Profile Submission Logic**
   - [ ] Review `handleProfileSubmit()` function calls and triggers
   - [ ] Check if CV data processing is accidentally calling submit functions
   - [ ] Verify session storage and state management

3. **Fix the Flow**
   - [ ] Ensure CV preview continue only transitions to voice interview step
   - [ ] Remove any premature profile save calls
   - [ ] Test the corrected flow

4. **Test Complete Flow**
   - [ ] Verify CV upload → CV preview → Voice interview → Profile save works correctly
   - [ ] Ensure no data loss during step transitions

### Expected Outcome

User should be able to:

1. Upload CV and see preview
2. Click "Continue" and proceed directly to voice interview
3. Complete voice interview
4. Have profile automatically saved with merged CV + voice data

This is a simple flow fix that should only require minimal changes to the continue button handler.

### Solution Applied

**Issue Identified**: The CV Preview continue button was labeled "Continue to Review" which was misleading and suggested it would trigger profile saving.

**Root Cause**: Button text confusion rather than a functional bug. The actual flow logic was correct.

**Changes Made**:

1. **Updated Button Text** (`cv-data-preview.tsx:592`):
   - Changed from "Continue to Review" → "Continue to Voice Interview"
   - This clarifies that clicking continues to the voice interview step, not a profile save operation

**Flow Verification**:

- ✅ `handleCVPreviewContinue()` only sets step to 'voice-interview' (no API calls)
- ✅ Profile is only saved after voice interview completion
- ✅ Correct flow: CV Parse → Voice Interview → Profile Save

**Results**:

- Users now clearly understand the next step is the voice interview
- No premature profile saving occurs during CV preview
- Voice assistant integration works as intended
