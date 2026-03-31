# خدمة طلب صيانة مركبة - Vehicle Maintenance Request Portal

A production-quality, Arabic-first RTL internal portal for managing the full lifecycle of vehicle maintenance requests.

## Tech Stack

- **React 19** + **Vite 8**
- **TypeScript** (strict)
- **Tailwind CSS v4**
- **Zustand** (state management)
- **React Hook Form** + **Zod** (form validation)
- **React Router v6** (routing)
- **lucide-react** (icons)
- **date-fns** (Arabic date formatting)

## Features

- ✅ Full Arabic RTL layout
- ✅ Role-based access control (5 roles)
- ✅ State machine workflow with 18 states
- ✅ Multi-step request form with validation
- ✅ Dashboard with KPI cards
- ✅ Request list with search, filter, sort, pagination
- ✅ Case management view with tabs
- ✅ Activity timeline / audit trail
- ✅ Comments system
- ✅ Notifications center
- ✅ Demo role switcher in topbar
- ✅ 13 seeded Arabic mock requests
- ✅ Responsive (desktop + tablet)

## Roles

| رقم الموظف | الدور              | كلمة المرور |
|------------|---------------------|-------------|
| EMP-1042   | مسؤول الحركة        | 123456      |
| EMP-2018   | مدير الشؤون الإدارية | 123456      |
| EMP-3055   | مدير النقل والصيانة  | 123456      |
| EMP-4011   | مدير التوجيه         | 123456      |
| EMP-5099   | مسؤول الصيانة        | 123456      |

## Getting Started

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build
```

Then open http://localhost:5173 and log in with any of the demo accounts above.

## Workflow

```
مسودة → تقديم → مراجعة إدارية → مراجعة النقل → توجيه → تنفيذ → قرار نهائي → مغلق
```

Each step:
1. Validates acting user's role
2. Records a timeline entry
3. Updates the request status and owner
4. Preserves full history

## Project Structure

```
src/
├── app/          # Router + App root
├── components/
│   ├── layout/   # AppShell, Sidebar, Topbar
│   └── shared/   # Reusable design system components
├── data/         # Mock seed data
├── features/     # Feature-based pages
│   ├── auth/
│   ├── dashboard/
│   ├── requests/
│   └── notifications/
├── lib/          # Utilities
├── store/        # Zustand stores
├── styles/       # Global CSS
├── types/        # TypeScript types & enums
└── utils/        # Workflow, formatters, Arabic labels
```
