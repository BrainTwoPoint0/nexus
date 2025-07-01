# Learning Center - Page Specification

## Overview

The Learning Center is a core differentiator for Nexus, providing professional development specifically for board roles and governance expertise.

## Page Structure: `/learning`

### Hero Section

- **Headline**: "Advance Your Board Career"
- **Subheading**: "Professional development courses designed specifically for board members and aspiring directors"
- **CTA**: "Start Learning Today" → Sign up flow
- **Stats**: "500+ Courses • 10k+ Graduates • 95% Completion Rate"

### Course Categories (Filterable)

```
┌─────────────────┬─────────────────┬─────────────────┐
│ 🏛️ Governance    │ 💰 Finance      │ ⚖️ Legal & Risk  │
│ 📊 Strategy     │ 👥 Leadership   │ 🌱 ESG & Ethics │
│ 💻 Digital      │ 🎯 Industry     │ 📜 Certification│
└─────────────────┴─────────────────┴─────────────────┘
```

### Course Grid

- **Course Cards** with:
  - Course thumbnail/icon
  - Title & brief description
  - Duration (e.g., "2.5 hours")
  - Difficulty level (Beginner/Intermediate/Advanced)
  - Rating stars
  - Progress bar (if enrolled)
  - "Enroll" or "Continue" button

### Featured Section

- **"Popular This Month"** - Trending courses
- **"Certification Paths"** - Multi-course programs
- **"New Releases"** - Latest content

## Course Categories & Sample Content

### 🏛️ Governance Fundamentals

- Board Roles & Responsibilities
- Meeting Management & Parliamentary Procedure
- Committee Structures & Operations
- Board Evaluation & Assessment

### 💰 Financial Oversight

- Reading Financial Statements for Directors
- Risk Management Fundamentals
- Audit Committee Essentials
- Investment Oversight

### ⚖️ Legal & Compliance

- Fiduciary Duties & Liability
- Regulatory Compliance Overview
- D&O Insurance Fundamentals
- Whistleblower Policies

### 📊 Strategic Planning

- Strategic Planning for Boards
- Performance Metrics & KPIs
- Mergers & Acquisitions Oversight
- Crisis Management

### 👥 Leadership & Culture

- Board Diversity & Inclusion
- Executive Succession Planning
- Organizational Culture Assessment
- Stakeholder Engagement

### 🌱 ESG & Sustainability

- ESG Reporting & Metrics
- Climate Risk Governance
- Social Impact Measurement
- Sustainable Business Models

## Component Requirements

### Course Card Component

```jsx
interface CourseCardProps {
  id: string
  title: string
  description: string
  category: string
  duration: string
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  rating: number
  enrolledCount: number
  thumbnailUrl: string
  progress?: number // 0-100 if user is enrolled
  isEnrolled: boolean
  isCertified: boolean
}
```

### Filter Sidebar

- Category checkboxes
- Duration filters (< 1hr, 1-3hr, 3-6hr, 6+ hr)
- Level filters
- Rating filters
- "Clear All" option

### Search & Sort

- Search bar with autocomplete
- Sort by: Popular, Newest, Rating, Duration
- Results count display

## Interactive Features

### Progress Tracking

- Visual progress bars on course cards
- "Continue where you left off" section
- Completion certificates
- Learning streaks/achievements

### Bookmarking & Lists

- Save courses to "Watchlist"
- Create custom learning paths
- Share course recommendations

### Social Proof

- Course reviews & ratings
- "Students also viewed" recommendations
- Success stories/testimonials

## Responsive Design

### Mobile Optimizations

- Horizontal scroll for category chips
- Stack course cards in single column
- Collapsible filter drawer
- Touch-friendly course card interactions

### Tablet & Desktop

- 2-3 column course grid
- Persistent filter sidebar
- Hover effects and animations
- Quick preview on hover

## Accessibility Considerations

- Keyboard navigation for filters and course cards
- Screen reader-friendly course descriptions
- High contrast mode support
- Focus indicators on interactive elements

## Performance Optimizations

- Lazy loading course thumbnails
- Virtualized scrolling for large course lists
- Debounced search input
- Cached filter results

## Implementation Components Needed

- CourseCard component
- CategoryFilter component
- SearchBar component
- ProgressIndicator component
- RatingStars component
- DurationBadge component
- LevelBadge component

## Sample Data Structure

```typescript
interface Course {
  id: string
  title: string
  description: string
  longDescription: string
  category: CourseCategory
  subcategory?: string
  instructor: {
    name: string
    title: string
    avatar: string
  }
  duration: number // minutes
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  rating: number
  reviewCount: number
  enrolledCount: number
  thumbnailUrl: string
  videoUrl: string
  materials: string[]
  prerequisites: string[]
  learningObjectives: string[]
  certificate: boolean
  price: number
  tags: string[]
  createdAt: Date
  updatedAt: Date
}
```

This Learning Center will position Nexus as more than just a job board - it's a comprehensive professional development platform for board careers!
