# Basarometer V4 - Complete Development Guide

## 🎯 **Project Overview**

### **Mission & Purpose**
Basarometer V4 is a social platform helping Israeli families save on meat costs through community-driven price comparison. This is a **social project** with a $0-20/month sustainable cost model, built with modern web technologies and Claude Code assistance.

### **Current Status: Phase 2B Complete ✅**
- **Production URL:** https://v3.basarometer.org
- **Performance:** <2s load time, 119ms API calls, Mobile 90+ score
- **Data:** 6 categories → 14 sub-categories → 13+ meat cuts → 53+ price reports
- **Features:** Hierarchical accordion matrix, admin panel, real-time reporting
- **Architecture:** Next.js 15 + TypeScript + Supabase + Vercel deployment

---

## 🏗️ **Technical Architecture**

### **Tech Stack (Stable & Proven)**
```typescript
Frontend:
├── Next.js 15 (App Router)
├── TypeScript (Strict Mode)
├── Tailwind CSS
├── React Hooks & Context
└── Framer Motion (animations)

Backend:
├── Supabase PostgreSQL
├── Supabase Auth (singleton pattern)
├── Supabase Real-time
├── Supabase Edge Functions
└── Row Level Security (RLS)

Deployment:
├── Vercel (auto-deploy from GitHub)
├── GitHub Repository (public)
└── Environment variables (.env.local)
```

### **Database Schema (Verified Stable)**
```sql
-- CURRENT PRODUCTION SCHEMA - NEVER BREAK THIS
meat_categories (6):
├── id (UUID, PK), name_hebrew (TEXT), name_english (TEXT)
├── display_order (INTEGER), is_active (BOOLEAN), created_at (TIMESTAMP)

meat_sub_categories (14):
├── id (UUID, PK), category_id (UUID, FK)
├── name_hebrew (TEXT), name_english (TEXT), icon (TEXT)
├── display_order (INTEGER), is_active (BOOLEAN), created_at (TIMESTAMP)

meat_cuts (13+):
├── id (UUID, PK), category_id (UUID, FK), sub_category_id (UUID, FK)
├── name_hebrew (TEXT), name_english (TEXT), description (TEXT)
├── typical_price_range_min (INTEGER), typical_price_range_max (INTEGER)
├── attributes (JSONB), is_popular (BOOLEAN), display_order (INTEGER)
├── is_active (BOOLEAN), created_at (TIMESTAMP)

retailers (8):
├── id (UUID, PK), name (TEXT), type (TEXT), logo_url (TEXT)
├── website_url (TEXT), is_chain (BOOLEAN), location_coverage (JSONB)
├── is_active (BOOLEAN), created_at (TIMESTAMP)

price_reports (53+):
├── id (UUID, PK), meat_cut_id (UUID, FK), retailer_id (UUID, FK)
├── price_per_kg (INTEGER), user_id (UUID, FK), location (TEXT)
├── notes (TEXT), purchase_date (DATE), is_on_sale (BOOLEAN)
├── sale_price_per_kg (INTEGER), confidence_score (INTEGER)
├── verified_at (TIMESTAMP), is_active (BOOLEAN), expires_at (TIMESTAMP)
├── created_at (TIMESTAMP)

user_profiles (6+):
├── id (UUID, PK), user_id (UUID, FK), display_name (TEXT)
├── reputation_score (INTEGER), total_reports (INTEGER)
├── verified_reports (INTEGER), created_at (TIMESTAMP)
```

---

## ✅ **Development Patterns (USE THESE)**

### **1. Supabase Singleton Pattern (CRITICAL)**
```typescript
// ✅ ALWAYS USE THIS PATTERN:
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// ✅ In components:
import { supabase } from '@/lib/supabase'
```

### **2. Enhanced Colorful Matrix Algorithm**
```typescript
// ✅ CURRENT WORKING ALGORITHM:
const getEnhancedPriceColor = (price: number | null, meatCut: MeatCut): string => {
  if (!price) return 'bg-gray-50 border-gray-200'
  
  const minRange = meatCut.typical_price_range_min
  const maxRange = meatCut.typical_price_range_max
  
  if (!minRange || !maxRange) {
    return calculateCategoryPriceColor(price, meatCut.category_id)
  }
  
  const normalized = (price - minRange) / (maxRange - minRange)
  
  if (normalized <= 0.3) return 'bg-green-100 border-green-300 text-green-800'
  if (normalized <= 0.7) return 'bg-yellow-100 border-yellow-300 text-yellow-800'
  return 'bg-red-100 border-red-300 text-red-800'
}
```

### **3. Database Functions (Tested & Working)**
```sql
-- ✅ VERIFIED WORKING FUNCTIONS:
get_categories_with_subcategories() -- Returns hierarchical data for accordion
get_meat_categories_enhanced() -- Enhanced category data with counts
get_meat_cuts_hierarchical() -- Complete hierarchy for forms
submit_price_report_final() -- Handles price submissions with validation
check_user_admin() -- Admin authentication check
```

### **4. TypeScript Patterns**
```typescript
// ✅ PROPER TYPE DEFINITIONS:
interface MeatCategory {
  id: string
  name_hebrew: string
  name_english: string
  display_order: number
  is_active: boolean
  created_at: string
}

interface MeatSubCategory {
  id: string
  category_id: string
  name_hebrew: string
  name_english: string
  icon: string
  display_order: number
  is_active: boolean
  created_at: string
}

// ✅ HIERARCHICAL DATA STRUCTURE:
interface CategoryWithSubCategories extends MeatCategory {
  sub_categories: SubCategoryWithCuts[]
}

interface SubCategoryWithCuts extends MeatSubCategory {
  meat_cuts: MeatCut[]
}
```

---

## ❌ **Anti-Patterns (NEVER DO THESE)**

### **1. Multiple Supabase Instances**
```typescript
// ❌ NEVER DO THIS - CAUSES GOTRUECLIENT CONFLICTS:
const supabase1 = createClient(url, key)
const supabase2 = createClient(url, key) // BAD!

// ✅ ALWAYS USE SINGLETON:
import { supabase } from '@/lib/supabase'
```

### **2. Hardcoded Secrets**
```typescript
// ❌ NEVER HARDCODE SECRETS:
const url = 'https://ergxrxtuncymyqslmoen.supabase.co'
const key = 'eyJhbGci...'

// ✅ ALWAYS USE ENVIRONMENT VARIABLES:
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
```

### **3. Old Color Algorithm**
```typescript
// ❌ NEVER USE HEIGHT-BASED LOGIC:
const oldColorLogic = (height: number) => { /* deprecated */ }

// ✅ USE PRICE-RANGE ALGORITHM:
const getEnhancedPriceColor = (price: number, meatCut: MeatCut) => { /* current */ }
```

### **4. SQL Function Mistakes**
```sql
-- ❌ NEVER USE $ SYNTAX:
CREATE FUNCTION bad_function() RETURNS TEXT AS $
-- Hebrew text in functions -- BAD!

-- ✅ USE SINGLE QUOTES & ENGLISH:
CREATE FUNCTION good_function() RETURNS TEXT AS '
-- English messages only
'
```

### **5. Wrong Column Names**
```sql
-- ❌ WRONG COLUMN NAMES:
name_he, name_en, total_reports

-- ✅ CORRECT COLUMN NAMES:
name_hebrew, name_english, reputation_score
```

---

## 🎨 **UI/UX Patterns**

### **1. Accordion Matrix Structure**
```typescript
// ✅ CURRENT WORKING STRUCTURE:
<AccordionMatrixContainer>
  <MatrixSearch />
  {categories.map(category => (
    <CategoryAccordion key={category.id} category={category}>
      {category.sub_categories.map(subCategory => (
        <SubCategorySection key={subCategory.id} subCategory={subCategory}>
          {subCategory.meat_cuts.map(cut => (
            <EnhancedPriceCell key={cut.id} cut={cut} />
          ))}
        </SubCategorySection>
      ))}
    </CategoryAccordion>
  ))}
</AccordionMatrixContainer>
```

### **2. Admin Panel Structure**
```typescript
// ✅ ADMIN PANEL ARCHITECTURE:
/admin/dashboard - Main hub with statistics
/admin/categories - Category/sub-category management
/admin/cuts - Meat cuts management and linking
/admin/bulk-add - Bulk addition interface
```

### **3. Hebrew RTL Support**
```css
/* ✅ PROPER RTL SUPPORT: */
.rtl-text {
  direction: rtl;
  text-align: right;
}

.price-cell {
  /* Numbers stay LTR even in RTL context */
  direction: ltr;
  text-align: center;
}
```

---

## ⚡ **Performance Targets (MUST MAINTAIN)**

### **Critical Metrics:**
- **Page Load:** <2s (currently achieving <1.5s)
- **API Calls:** <120ms (currently 119ms)
- **Mobile Score:** 90+ (currently 94)
- **Bundle Size:** Optimized (no significant increases)
- **Console Errors:** Zero (strict policy)
- **TypeScript:** Strict mode passing
- **Build Time:** <1s for incremental builds

### **Monitoring Points:**
```typescript
// ✅ PERFORMANCE MONITORING:
- Large image optimization (Next.js Image component)
- Code splitting by route (App Router automatic)
- Database query optimization (indexed properly)
- Caching strategy (Supabase built-in + browser)
- Bundle analysis (npm run analyze)
```

---

## 🔒 **Security Patterns**

### **1. Environment Variables**
```bash
# ✅ .env.local STRUCTURE:
NEXT_PUBLIC_SUPABASE_URL=your_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_key_here
```

### **2. Row Level Security (RLS)**
```sql
-- ✅ RLS POLICIES IN PLACE:
- Anonymous users: can read price_reports and meat_cuts
- Authenticated users: can insert price_reports
- Admin users: can manage categories and cuts
- User profiles: users can only edit their own data
```

### **3. Admin Protection**
```typescript
// ✅ ADMIN ROUTE PROTECTION:
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin } = useAuth()
  
  if (!user || !isAdmin) {
    redirect('/login')
  }
  
  return <div>{children}</div>
}
```

---

## 🧪 **Testing & Validation**

### **Build Verification:**
```bash
# ✅ ALWAYS RUN THESE BEFORE DEPLOYMENT:
npm run build        # Must complete without errors
npm run type-check   # TypeScript validation
npm run lint        # ESLint compliance
npm run test        # Unit tests (if implemented)
```

### **Manual Testing Checklist:**
- [ ] Colorful matrix displays 53+ reports correctly
- [ ] Accordion animation smooth on mobile
- [ ] Admin panel accessible only to admins
- [ ] Search functionality works across categories
- [ ] Price submission form validates properly
- [ ] Hebrew RTL text flows correctly
- [ ] No console errors in browser
- [ ] Performance <2s on 3G connection

---

## 🚀 **Deployment Process**

### **Current Deployment:**
```bash
# ✅ AUTOMATIC DEPLOYMENT PIPELINE:
1. Push to GitHub main branch
2. Vercel automatically builds and deploys
3. Environment variables loaded from Vercel settings
4. Build verification runs automatically
5. Live at: https://v3.basarometer.org
```

### **Environment Setup:**
```bash
# ✅ NEW DEVELOPER SETUP:
1. Clone repository
2. Copy .env.example to .env.local
3. Add Supabase credentials to .env.local
4. npm install
5. npm run dev
6. Verify localhost:3000 loads correctly
```

---

## 📚 **Lessons Learned**

### **Major Breakthroughs:**
1. **Supabase Singleton Pattern** - Eliminated Multiple GoTrueClient errors
2. **Enhanced Color Algorithm** - Replaced height-based with price-range logic  
3. **Hierarchical Database Design** - Categories → Sub-Categories → Cuts
4. **Claude Code Workflow** - Comprehensive tasks with complete context
5. **Security-First Approach** - No hardcoded secrets in repository

### **Development Principles:**
1. **Documentation-First** - Always update claude.md with changes
2. **Preservation-First** - Never break existing 53+ price reports
3. **Performance-First** - Maintain <2s load times always
4. **Security-First** - All secrets in environment variables
5. **User-First** - Hebrew RTL support and mobile optimization

### **Future Enhancement Guidelines:**
1. **New Features** - Always follow established patterns
2. **Database Changes** - Test migrations carefully, preserve data
3. **UI Updates** - Maintain accordion structure and colorful matrix
4. **Admin Features** - Follow existing admin panel architecture
5. **Performance** - Monitor bundle size and API response times

---

## 🎯 **Quick Reference Commands**

```bash
# Development
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Production server

# Database
npx supabase gen types typescript --local > src/types/database.ts
npx supabase db reset --local # Reset local database

# Deployment
git push origin main # Auto-deploys to Vercel

# Security
git log --grep="password\|key\|secret" # Check for exposed secrets
```

---

## 📞 **Support & Maintenance**

### **When Things Break:**
1. Check build logs in Vercel dashboard
2. Verify environment variables are set
3. Check Supabase project status
4. Review recent commits for breaking changes
5. Test locally with npm run dev

### **Performance Issues:**
1. Run lighthouse audit
2. Check API response times in Network tab
3. Analyze bundle size with npm run analyze
4. Review database query performance in Supabase

### **Adding New Features:**
1. Read this claude.md file completely
2. Follow established patterns
3. Test with existing 53+ price reports
4. Update documentation
5. Verify performance targets maintained

---

**This documentation serves as the complete reference for Basarometer V4 development. Always refer to these patterns and anti-patterns before making changes. Keep this file updated with any new discoveries or changes.**

**Last Updated:** Phase 2B Completion - All major features implemented and stable.