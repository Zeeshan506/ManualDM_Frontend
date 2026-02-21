# PSC CRM Frontend

A modern, responsive CRM dashboard built with **Next.js**, **React 19**, and **Tailwind CSS**. This frontend provides a sleek interface for managing leads, viewing conversations, and tracking sales metrics.

## Overview

This is the frontend application for the PSC CRM system. It provides:
- **Dashboard** - High-level KPI metrics and activity insights
- **Leads Directory** - Searchable and filterable lead management
- **Chat View** - Real-time messaging with Instagram lead conversations
- **Contact Management** - Quick lead information updates
- **Responsive Design** - Works seamlessly on desktop and tablet devices

## Tech Stack

- **Framework:** Next.js 16.1.6 with TypeScript
- **UI Library:** React 19.2.3
- **Styling:** Tailwind CSS 4 + PostCSS
- **Icons:** Lucide React
- **State Management:** TanStack React Query
- **UI Components:** shadcn/ui (custom Radix UI components)
- **Animations:** Framer Motion

## Prerequisites

- Node.js 18+ or higher
- npm or yarn package manager
- Backend API running (test_server on port 8000)

## Installation

1. **Navigate to the project directory:**
```bash
cd crm_frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment variables** (create `.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Running the Project

### Development Mode
```bash
npm run dev
```
The application will be available at `http://localhost:3000`

### Production Build
```bash
npm run build
npm start
```

### Linting
```bash
npm run lint
```

## Project Structure

```
crm_frontend/
├── app/
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Dashboard page
│   └── leads/
│       ├── page.tsx          # Leads directory
│       └── [id]/
│           └── page.tsx      # Chat/detail view for specific lead
├── components/
│   ├── app-sidebar.tsx       # Main navigation sidebar
│   └── ui/                   # Reusable UI components
│       ├── button.tsx
│       ├── input.tsx
│       ├── sidebar.tsx
│       ├── skeleton.tsx
│       ├── tooltip.tsx
│       └── ...
├── hooks/
│   └── use-mobile.ts         # Mobile detection hook
├── lib/
│   └── utils.ts              # Utility functions
├── public/                   # Static assets
├── tsconfig.json             # TypeScript config
├── tailwind.config.js        # Tailwind CSS config
└── next.config.ts            # Next.js config
```

## UI Features

### Sidebar Navigation
- **Collapsible Design:** The sidebar collapses to show only icons instead of hiding completely
- **Toggle Shortcut:** Press `Ctrl+B` (or `Cmd+B` on Mac) to collapse/expand
- **Icon Tooltips:** Hover over icons to see menu labels when sidebar is collapsed
- **Navigation Items:**
  - Dashboard
  - All Leads
  - Active Chats
  - User profile section with logout option

### Dark Mode
- Dark theme with `bg-gray-900` background
- Light text (`text-gray-300`) for readability
- Consistent styling across all components

### Dashboard Features
- Real-time KPI cards showing:
  - Total Leads count
  - Qualified Leads (with LeadSubmitted Meta event)
  - Converted Leads (paid status)
  - Total Revenue
- Activity charts and recent updates
- Welcome header with current date

### Leads Directory
- Searchable table with Instagram handle, ID, and email
- Status filtering (New, Invoiced, Paid)
- Quick action buttons for messaging and adding contact info
- Visual indicators for missing email/phone
- Last active timestamp for each lead

### Chat View (Split Layout)
- **Left Panel (25%):** Active inbox with recent contacts
- **Middle Panel (50%):** Full message history with timestamps
- **Right Panel (25%):** Lead details and status management
- Update contact information without leaving conversation

## API Integration

The frontend connects to the backend API with the following key endpoints:

```
GET  /api/leads              # Fetch all leads with optional filters
GET  /api/leads/{lead_id}    # Get specific lead details
GET  /api/leads/{lead_id}/messages  # Fetch chat messages
GET  /api/dashboard/stats    # Get dashboard KPI metrics
POST /leads/{lead_id}/contact-details  # Update lead info
POST /leads/{lead_id}/mock-purchase    # Create mock purchase event
```

Configure the API URL in `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Key Pages

### Dashboard (`/`)
Displays real-time metrics:
- Total leads count
- Qualified leads (LeadSubmitted event status)
- Converted leads (with paid status)
- Total revenue aggregation
- Activity feed and charts

### Leads Directory (`/leads`)
Browse and manage all leads:
- Search by Instagram handle, ID, or email
- Filter by status (New, Invoiced, Paid)
- Toggle to show leads missing contact info
- Quick actions for adding info or messaging
- Sortable by last active time

### Chat View (`/leads/[id]`)
Three-column layout for seamless communication:
- **Left (25%):** Active inbox with recent contacts
- **Middle (50%):** Full message history with timestamps
- **Right (25%):** Lead details, status management, and contact info
- Update lead information without leaving the conversation

## Features

- ✅ Real-time lead status tracking
- ✅ Integrated messaging interface with inbound/outbound messages
- ✅ Contact information management with Meta CAPI sync
- ✅ Dashboard analytics and KPIs
- ✅ Mobile-responsive design
- ✅ Keyboard shortcuts (Ctrl+B to toggle sidebar)
- ✅ Search and filtering capabilities
- ✅ Toast notifications for user feedback
- ✅ Smooth animations and transitions
- ✅ Dark mode theme

## 📱 Responsive Design

The app is optimized for:
- **Desktop:** Full three-column layout (1920px and up)
- **Tablet:** Adjusted spacing and responsive grids (768px and up)
- **Mobile:** Collapsible offcanvas sidebar for better space utilization

## Development

### Code Style
- Uses ESLint for code quality
- TypeScript for type safety
- Tailwind CSS for utility-first styling

### Component System
Custom UI components are located in `components/ui/` and use:
- Radix UI for accessible, unstyled components
- Tailwind CSS for styling
- TypeScript for full type safety

### Adding New Components
1. Create new component in `components/ui/`
2. Use Tailwind classes for styling
3. Export from `components/ui/`
4. Import and use in pages/other components

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend API endpoint |

## Development Notes

- The frontend assumes the backend API is running and accessible on port 8000
- All data flows through the REST API layer
- Client-side state is managed with React Query for efficient caching and synchronization
- The sidebar uses Next.js responsive utilities for mobile optimization
- TypeScript ensures type safety across components

## Getting Started

1. Start the backend API (see test_server README)
2. Run `npm install` in this directory
3. Create `.env.local` with backend API URL
4. Run `npm run dev`
5. Open `http://localhost:3000` in your browser

## Common Issues

**API Connection Errors:**
- Ensure backend API is running on `http://localhost:8000`
- Check `NEXT_PUBLIC_API_URL` in `.env.local`

**Build Errors:**
- Run `npm install` to ensure all dependencies are installed
- Clear `.next` folder: `rm -rf .next && npm run dev`

**Type Errors:**
- Run TypeScript compiler: `npx tsc --noEmit`
- Check for missing type definitions in `tsconfig.json`

## License

Proprietary - Code Ninety

## Support

For issues or questions about the frontend, contact the development team.

