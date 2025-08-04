# Nexus - Branding, UI & UX Guidelines

## Brand Identity

### Brand Concept

**Nexus** represents the central connection point where executive talent meets opportunity. The name suggests a sophisticated network hub that facilitates meaningful professional relationships and board appointments.

### Brand Values

- **Connection**: Bringing together the right people at the right time
- **Precision**: Data-driven matching and expert curation
- **Trust**: Secure, reliable, and professional platform
- **Growth**: Fostering career development and organizational excellence
- **Innovation**: Technology-enhanced traditional executive search

### Brand Personality

- **Professional yet approachable**
- **Sophisticated but not intimidating**
- **Trustworthy and reliable**
- **Forward-thinking and innovative**
- **Results-oriented**

### Tagline Options

- "Where Executive Excellence Connects"
- "The Executive Connection Point"
- "Connecting Leadership, Driving Growth"
- "Your Gateway to Executive Opportunity"

---

## Color System

### Primary Palette

Based on the [Coolors palette](https://coolors.co/palette/ffffff-d1dede-646e68-101935-011638):

```css
/* Nexus Brand Colors - Direct Usage */
colors: {
  nexus: {
    white: '#FFFFFF',      // Pure white - backgrounds, text on dark
    silver: '#D1DEDE',     // Light gray-blue - subtle backgrounds, borders
    slate: '#646E68',      // Medium gray - secondary text, inactive states
    navy: '#101935',       // Primary dark blue - main brand color
    midnight: '#011638',   // Deep blue-black - headers, emphasis
  }
}

/* shadcn/ui Semantic Colors (Mapped to Nexus Colors) */
:root {
  --background: 0 0% 100%; /* Nexus White */
  --foreground: 205 9% 37%; /* Nexus Slate */
  --primary: 210 88% 14%; /* Nexus Navy */
  --secondary: 195 20% 83%; /* Nexus Silver */
  /* ... other semantic mappings */
}
```

### Color Usage Guidelines

#### Primary Colors (Use shadcn/ui semantic colors)

- **`bg-primary`**: Main brand actions, primary buttons, key navigation
- **`bg-secondary`**: Secondary backgrounds, subtle emphasis
- **`text-foreground`**: Primary text color
- **`text-muted-foreground`**: Secondary text, placeholders

#### Supporting Colors

- **`bg-card`**: Card backgrounds and surfaces
- **`border`**: Borders and dividers
- **`bg-accent`**: Hover states and highlights

#### Functional Colors

```css
colors: {
  nexus: {
    success: '#10B981',    // Green for success states
    warning: '#F59E0B',    // Amber for warnings
    danger: '#EF4444',     // Red for errors
    info: '#3B82F6',       // Blue for information
  }
}
```

### Color Accessibility

- Ensure minimum 4.5:1 contrast ratio for normal text
- Use 3:1 ratio for large text (18px+ or 14px+ bold)
- Test color combinations with accessibility tools
- Provide alternative indicators beyond color alone

---

## Typography

### Font Stack

```css
/* Primary Font - Professional Sans-Serif */
font-family: 'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif;

/* Secondary Font - For headings/emphasis */
font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;

/* Monospace - For code/data */
font-family: 'JetBrains Mono', 'Fira Code', monospace;
```

### Typography Scale

```css
/* Tailwind Custom Typography */
fontSize: {
  'xs': ['0.75rem', { lineHeight: '1rem' }],
  'sm': ['0.875rem', { lineHeight: '1.25rem' }],
  'base': ['1rem', { lineHeight: '1.5rem' }],
  'lg': ['1.125rem', { lineHeight: '1.75rem' }],
  'xl': ['1.25rem', { lineHeight: '1.75rem' }],
  '2xl': ['1.5rem', { lineHeight: '2rem' }],
  '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
  '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
  '5xl': ['3rem', { lineHeight: '1' }],
  '6xl': ['3.75rem', { lineHeight: '1' }],
}
```

### Typography Usage

#### Headings

- **H1**: `text-5xl font-bold text-foreground` - Page titles
- **H2**: `text-3xl font-semibold text-foreground` - Section headers
- **H3**: `text-2xl font-medium text-foreground` - Subsection headers
- **H4**: `text-xl font-medium text-muted-foreground` - Component headers

#### Body Text

- **Primary**: `text-base text-foreground leading-relaxed`
- **Secondary**: `text-sm text-muted-foreground`
- **Caption**: `text-xs text-muted-foreground/70`

#### Interactive Text

- **Links**: `text-primary hover:text-primary/80 transition-colors`
- **Buttons**: `font-medium` (handled by shadcn/ui Button component)

---

## Layout & Spacing

### Grid System

```css
/* Container Sizes */
.container-sm: max-width: 640px
.container-md: max-width: 768px
.container-lg: max-width: 1024px
.container-xl: max-width: 1280px
.container-2xl: max-width: 1536px
```

### Spacing Scale

```css
/* Tailwind Spacing (rem values) */
spacing: {
  '0': '0px',
  '1': '0.25rem',    // 4px
  '2': '0.5rem',     // 8px
  '3': '0.75rem',    // 12px
  '4': '1rem',       // 16px
  '5': '1.25rem',    // 20px
  '6': '1.5rem',     // 24px
  '8': '2rem',       // 32px
  '10': '2.5rem',    // 40px
  '12': '3rem',      // 48px
  '16': '4rem',      // 64px
  '20': '5rem',      // 80px
  '24': '6rem',      // 96px
}
```

### Layout Guidelines

- **Page margins**: `px-4 md:px-8 lg:px-12`
- **Section spacing**: `py-16 md:py-24`
- **Component spacing**: `space-y-8` for vertical, `space-x-6` for horizontal
- **Card padding**: `p-6 md:p-8`

---

## Component Library (shadcn/ui Based)

### Using shadcn/ui Components

**Installation Pattern:**

```bash
npx shadcn@latest add [component-name]
```

**Import Pattern:**

```jsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
```

### Buttons

#### Primary Button

```jsx
import { Button } from '@/components/ui/button';

<Button variant="default" size="default">
  Primary Action
</Button>;
```

#### Secondary Button

```jsx
<Button variant="outline" size="default">
  Secondary Action
</Button>
```

#### Ghost Button

```jsx
<Button variant="ghost" size="default">
  Ghost Action
</Button>
```

#### Destructive Button

```jsx
<Button variant="destructive" size="default">
  Delete Action
</Button>
```

#### With Icon

```jsx
import { Plus } from 'lucide-react';

<Button variant="default" size="default">
  <Plus className="h-4 w-4" />
  Add Item
</Button>;
```

#### Loading State

```jsx
import { Loader2 } from 'lucide-react';

<Button disabled>
  <Loader2 className="h-4 w-4 animate-spin" />
  Please wait
</Button>;
```

### Cards

#### Base Card

```jsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Card content goes here.</p>
  </CardContent>
</Card>;
```

#### Featured Card (Custom styling)

```jsx
<Card className="border-2 border-primary/10 bg-gradient-to-br from-card to-secondary/30 shadow-lg">
  <CardHeader>
    <CardTitle className="gradient-text">Featured Content</CardTitle>
  </CardHeader>
  <CardContent>
    <p>This is a featured card with enhanced styling.</p>
  </CardContent>
</Card>
```

### Form Elements

#### Input Field

```jsx
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="Enter your email" />
</div>;
```

#### Select Dropdown

```jsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select an option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>;
```

#### Textarea

```jsx
import { Textarea } from '@/components/ui/textarea';

<Textarea placeholder="Enter your message" />;
```

### Additional Components to Add

**Essential Components:**

```bash
npx shadcn@latest add card input label select textarea badge avatar dialog sheet dropdown-menu navigation-menu
```

**Advanced Components:**

```bash
npx shadcn@latest add data-table calendar date-picker form table pagination breadcrumb tabs accordion
```

---

## Animation Guidelines (Framer Motion)

### Motion Principles

- **Purposeful**: Every animation should have a clear functional purpose
- **Subtle**: Animations enhance UX without being distracting
- **Fast**: Keep durations between 200-500ms for micro-interactions
- **Natural**: Use easing functions that feel organic

### Standard Transitions

```jsx
// Page transitions
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const pageTransition = {
  type: 'tween',
  ease: 'easeInOut',
  duration: 0.3,
};

// Card hover effects
const cardVariants = {
  rest: { scale: 1 },
  hover: {
    scale: 1.02,
    transition: { duration: 0.2 },
  },
};

// Button interactions (enhance shadcn/ui buttons)
const buttonVariants = {
  tap: { scale: 0.98 },
  hover: { scale: 1.02 },
};
```

### Enhancing shadcn/ui with Framer Motion

```jsx
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

// Animated Button Wrapper
const MotionButton = motion(Button)

<MotionButton
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: "spring", stiffness: 400, damping: 17 }}
>
  Animated Button
</MotionButton>
```

### Loading States

```jsx
// Skeleton loading for cards
const skeletonVariants = {
  loading: {
    opacity: [0.5, 1, 0.5],
    transition: { duration: 1.5, repeat: Infinity },
  },
};

// Page loading spinner
const spinnerVariants = {
  spinning: {
    rotate: 360,
    transition: { duration: 1, repeat: Infinity, ease: 'linear' },
  },
};
```

---

## User Experience Guidelines

### Navigation Principles

#### Primary Navigation

- Keep main navigation items to 5-7 maximum
- Use clear, descriptive labels
- Maintain consistent navigation across all pages
- Highlight current page/section
- Use shadcn/ui NavigationMenu component

#### Information Architecture

```
Nexus Platform Structure:
├── Home
├── Find Opportunities (Candidates)
│   ├── Browse Roles
│   ├── Saved Searches
│   └── Applications
├── Find Talent (Organizations)
│   ├── Post Role
│   ├── Browse Candidates
│   └── Manage Searches
├── Community
│   ├── Events
│   ├── Resources
│   └── Networking
├── Learning
│   ├── Courses
│   ├── Certifications
│   └── Webinars
└── Profile/Account
```

### Content Strategy

#### Tone of Voice

- **Professional**: Authoritative but approachable
- **Clear**: Jargon-free, easy to understand
- **Confident**: Decisive and trustworthy
- **Helpful**: Supportive and encouraging

#### Content Hierarchy

1. **Primary Message**: Main value proposition (H1)
2. **Supporting Details**: Key benefits (H2, body text)
3. **Call to Action**: Clear next steps (buttons, links)
4. **Secondary Information**: Additional context (smaller text)

### Interaction Patterns

#### Progressive Disclosure

- Show essential information first
- Provide "Show more" options for detailed content
- Use expandable sections for complex forms (Accordion component)
- Implement step-by-step wizards for onboarding

#### Feedback Mechanisms

- Immediate visual feedback for all interactions
- Loading states for processes taking >200ms
- Success/error messages with clear next steps (Toast component)
- Progress indicators for multi-step processes

---

## Responsive Design

### Breakpoint Strategy

```css
/* Tailwind Breakpoints */
sm: 640px   // Small tablets, large phones
md: 768px   // Tablets
lg: 1024px  // Small laptops
xl: 1280px  // Large laptops
2xl: 1536px // Desktop monitors
```

### Mobile-First Approach

- Design for mobile first, enhance for larger screens
- Touch targets minimum 44px × 44px
- Readable text without zooming (16px minimum)
- Easy thumb navigation on mobile devices

### Layout Adaptations

```jsx
// Responsive grid example
<div className="
  grid grid-cols-1 gap-4
  sm:grid-cols-2 sm:gap-6
  lg:grid-cols-3 lg:gap-8
  xl:grid-cols-4
">
  {/* Grid items */}
</div>

// Responsive typography
<h1 className="
  text-2xl sm:text-3xl
  md:text-4xl lg:text-5xl
  font-bold text-foreground
">
  Responsive Heading
</h1>

// Responsive spacing
<section className="
  py-8 px-4
  sm:py-12 sm:px-6
  lg:py-16 lg:px-8
">
  {/* Section content */}
</section>
```

---

## Accessibility Guidelines

### WCAG 2.1 AA Compliance

#### Color & Contrast

- Minimum 4.5:1 contrast for normal text
- Minimum 3:1 contrast for large text
- Don't rely solely on color to convey information
- Test with color blindness simulators

#### Keyboard Navigation

- All interactive elements must be keyboard accessible
- Visible focus indicators on all focusable elements
- Logical tab order throughout the interface
- Skip links for main content areas

#### Screen Reader Support

```jsx
// Semantic HTML structure with shadcn/ui
<main role="main">
  <section aria-labelledby="section-heading">
    <h2 id="section-heading">Board Opportunities</h2>
    {/* Content */}
  </section>
</main>

// ARIA labels with Button component
<Button
  aria-label="Apply for Senior Marketing Director position"
  aria-describedby="application-info"
>
  Apply Now
</Button>
<div id="application-info">
  Application deadline: March 15, 2024
</div>
```

#### Form Accessibility

- Associate labels with form controls (Label component)
- Provide clear error messages
- Group related form fields
- Use fieldsets and legends for complex forms

---

## Performance Guidelines

### Core Web Vitals Targets

- **LCP (Largest Contentful Paint)**: < 2.5 seconds
- **FID (First Input Delay)**: < 100 milliseconds
- **CLS (Cumulative Layout Shift)**: < 0.1

### Optimization Strategies

#### Images

- Use Next.js Image component for automatic optimization
- Implement lazy loading for below-the-fold images
- Provide appropriate alt text for accessibility
- Use WebP format where possible

#### Code Splitting

```jsx
// Dynamic imports for code splitting
const DashboardComponent = dynamic(() => import('./Dashboard'), {
  loading: () => <LoadingSkeleton />,
  ssr: false,
});

// Route-based code splitting with Next.js
// Automatic with pages/ directory structure
```

#### Loading States

- Show skeleton screens for content areas
- Use progressive loading for data-heavy components
- Implement optimistic UI updates where appropriate

---

## Design Tokens (Tailwind Config)

### Complete Tailwind Configuration

```javascript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // shadcn/ui semantic colors (mapped to our Nexus colors)
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // ... other semantic colors
        // Direct Nexus colors (for specific use cases)
        nexus: {
          white: "#FFFFFF",
          silver: "#D1DEDE",
          slate: "#646E68",
          navy: "#101935",
          midnight: "#011638",
          success: "#10B981",
          warning: "#F59E0B",
          danger: "#EF4444",
          info: "#3B82F6",
        },
      },
      fontFamily: {
        sans: ["Inter", "Segoe UI", "Roboto", "Helvetica Neue", "sans-serif"],
        display: ["Plus Jakarta Sans", "Inter", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      // Custom animations for Framer Motion integration
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/aspect-ratio"),
    // Note: Not using tailwindcss-animate since we use Framer Motion
  ],
};

export default config;
```

---

## Implementation Checklist

### Phase 1: Foundation ✅ COMPLETED

- [x] Set up Tailwind CSS with custom Nexus configuration
- [x] Implement base typography system
- [x] Set up shadcn/ui component system
- [x] Set up Framer Motion for animations
- [x] Establish responsive grid system
- [x] Configure CSS variables for theme system

### Phase 2: Components ✅ COMPLETED

- [x] Install core shadcn/ui components (button, card, input, etc.) - _Complete: 20+ components installed_
- [x] Build navigation components with NavigationMenu - _Header with responsive navigation created_
- [x] Create dashboard layouts - _MainLayout with Header/Footer structure created_
- [x] Implement form components with validation - _All form components available via shadcn/ui_
- [x] Design loading and error states - _Comprehensive loading and error components created_
- [x] Build modal and overlay components (Dialog, Sheet) - _Available via shadcn/ui installation_

### Phase 3: Core Pages ✅ COMPLETED

- [x] Home/landing page - _Modern landing page with navigation, hero, features, and CTA sections_
- [x] Authentication pages (sign-in, sign-up) - _Professional forms with validation, social login options, and user experience_
- [x] Dashboard pages (candidate dashboard) - _Interactive dashboard with stats, opportunities, and activity feed_
- [x] Organization dashboard - _Company-focused dashboard for posting roles, managing candidates, and tracking applications_
- [x] Profile and settings pages - _Comprehensive tabbed profile with personal info, experience, skills, and preferences_
- [x] Search and browse interfaces - _Advanced opportunity search with filtering, bookmarking, and detailed results_

### Phase 3.5: Extended Platform Pages 🚧 IN PROGRESS

#### Detailed User Flows

- [ ] **Job Posting Creation** - Multi-step form for organizations to post roles
- [ ] **Detailed Opportunity View** - Full job descriptions, application process, company info
- [ ] **Application Flow** - Step-by-step application process with document upload
- [ ] **Advanced Search/Filters** - Enhanced search with saved filters, alerts
- [ ] **Messaging System** - In-platform communication between users and organizations

#### Company & Legal Pages

- [ ] **About Us** - Company story, team, mission, values
- [ ] **Pricing** - Subscription tiers, feature comparison, billing
- [ ] **Legal Pages** - Privacy policy, terms of service, cookie policy, GDPR
- [ ] **Contact** - Contact forms, office locations, support channels
- [ ] **Careers** - Open positions, company culture, benefits

#### Account & Settings

- [ ] **Account Settings** - Password, email, notifications, privacy preferences
- [ ] **Billing & Subscriptions** - Payment methods, invoices, subscription management
- [ ] **API Documentation** - For enterprise clients and integrations
- [ ] **Admin Dashboard** - Platform management, user moderation, analytics

### Phase 4: Polish & Optimization 🔄 NEXT

- [x] **Accessibility improvements** - Skip links, focus indicators, ARIA attributes, screen reader support
- [x] **Mobile UX enhancements** - Better footer layout, navigation animations, touch targets
- [ ] Performance optimization
- [ ] Cross-browser testing
- [ ] Mobile device testing
- [ ] User testing and iteration

---

## shadcn/ui Component Installation Guide

### Essential Components for Nexus

```bash
# Core UI Components
npx shadcn@latest add button card input label textarea select

# Navigation & Layout
npx shadcn@latest add navigation-menu breadcrumb separator sheet

# Data Display
npx shadcn@latest add table badge avatar skeleton

# Feedback & Interaction
npx shadcn@latest add dialog alert-dialog toast dropdown-menu

# Forms & Inputs
npx shadcn@latest add form checkbox radio-group switch

# Advanced Components
npx shadcn@latest add data-table calendar date-picker pagination tabs accordion
```

### Custom Nexus Components

Create enhanced versions of shadcn/ui components with Framer Motion:

```jsx
// components/nexus/animated-button.tsx
"use client"

import { motion } from "framer-motion"
import { Button, ButtonProps } from "@/components/ui/button"

export const AnimatedButton = motion(Button)

// Usage
<AnimatedButton
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: "spring", stiffness: 400, damping: 17 }}
>
  Animated Button
</AnimatedButton>
```

---

## Brand Assets & Resources

### Logo Usage

- Minimum size: 120px width for digital
- Clear space: Equal to the height of the wordmark
- Dark backgrounds: Use white/silver version
- Light backgrounds: Use navy/midnight version

### Voice & Messaging

- **Elevator Pitch**: "Nexus is the premier platform connecting executive talent with board opportunities through intelligent matching and professional development."
- **Key Benefits**: Expert curation, AI-powered matching, professional growth, trusted network
- **Differentiators**: Technology + human expertise, community focus, ongoing support

### Photography Style

- Professional but approachable
- Diverse representation across all demographics
- Clean, modern environments
- Natural lighting preferred
- Focus on connection and collaboration

---

## Development Best Practices

### Component Architecture

- Use shadcn/ui as the foundation
- Enhance with Framer Motion for animations
- Create custom Nexus-specific components when needed
- Maintain consistent import patterns
- Follow component composition patterns

### Styling Approach

- Use semantic color tokens (`bg-primary`, `text-foreground`)
- Leverage Tailwind utility classes
- Use CSS variables for theme consistency
- Implement dark mode support
- Maintain responsive design principles

### Performance Considerations

- Lazy load non-critical components
- Use React.memo for expensive computations
- Implement proper loading states
- Optimize Framer Motion animations
- Follow Next.js performance best practices

This comprehensive guide provides the foundation for building a cohesive, professional, and user-friendly interface for the Nexus platform using modern web technologies and established design systems.
