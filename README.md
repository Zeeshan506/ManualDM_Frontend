# Social Lead Operations Platform — Frontend

The user-facing Next.js application for operating on Instagram/Meta-sourced leads: sign in, triage available conversations, communicate with leads, maintain contact records, and monitor team activity.

## Project Context

This repository is the frontend portion of a larger frontend/backend system. It gives authenticated sales and administrative users a single operational interface over backend-managed lead, conversation, payment, notification, and user data.

## Product Experience

Users enter through a role-aware login flow and are routed to the relevant operating view. Sales representatives can monitor an unassigned lead pool, claim a conversation, work in the chat view, and update lead information. Administrative users can view dashboard metrics and activity, inspect leads and chats, and access team and user-management interfaces according to their role.

The interface keeps conversation work close to lead context: an inbox list, a message thread, and lead details are available from the lead route, with live message and notification updates where the backend provides WebSocket events.

## Core Interfaces

- **Authentication:** Username/password login validates the selected Admin or Sales Rep mode against the backend response. Sessions are stored in browser cookies and the root route resolves the current user before redirecting to the appropriate dashboard.
- **Dashboard:** Admin and sales dashboard routes render KPI cards for leads, qualified leads, paid conversions, revenue, and a paginated recent-activity feed supplied by backend endpoints.
- **Unified inbox and chat:** `/chats` presents the active-chat list; `/leads/[id]` opens a three-part conversation workspace. Messages are grouped by direction and time, support loading earlier locally cached messages, delivery states, retry for failed outgoing messages, and live incoming updates.
- **Lead management:** The lead directory supports search and status filtering, ownership/occupancy indicators, and contact-detail editing. The lead detail panel supports name, email, and phone updates, lifecycle actions, and the conversation context for that lead.
- **Lead allocation:** The Unassigned Pool refreshes available leads and lets an authenticated user claim a chat. Sales-rep chat visits attempt engagement and release it when leaving the chat; the UI displays the current owner and occupancy state.
- **Administration:** Admin-facing navigation includes dashboard, users, team activity, leads, and chats. The user-management screen loads staff by role and provides role-governed create, password-update, and deletion controls. Team Activity shows rep-performance data and a periodically refreshed audit log.
- **Payment and lifecycle actions:** The lead panel can submit a custom payment amount and currency to the backend, then refresh lead details. Sales reps can request that a lead be marked dead; admins and sudo admins can mark a lead dead or delete it. The Stripe payment-link option is a visible frontend preview only, not an integrated Stripe flow.
- **Notifications:** A sidebar notification center loads recent events and opens a WebSocket connection for live notifications; notifications associated with a lead can open that lead's chat.

There is no implemented account or workspace-management view in the current source tree.

## Frontend Architecture

The application uses the Next.js App Router. The root layout supplies the shared application shell, authentication context, notification context (outside the login page), and toast surface. Route groups separate admin and sales routes without changing public URLs. `proxy.ts` redirects unauthenticated visitors to login and blocks sales reps from admin and team-activity routes; the admin route layout also performs a client-side role check.

Most operational screens are client components. They fetch data in effects and event handlers rather than using server-side data fetching or local Next.js route handlers. Authentication state is held in `AuthContext`, initialized from `crm_auth_token`, `crm_user_id`, and `crm_user_role` cookies. Logout calls the backend when a token is present, then clears those cookies.

API calls target `NEXT_PUBLIC_API_URL`. Most data reads use `lib/api-client.ts`, which adds request timeouts, throttling, in-flight deduplication for idempotent requests, and limited retry/backoff behavior. A few mutations and authentication calls use `fetch` directly. Screen-level React state, small module-level caches in the chat route, and the two React contexts provide the current state-management approach.

`@tanstack/react-query` is listed in `package.json`, but the current source contains no `QueryClient`, `useQuery`, or `useMutation` usage. TanStack Query is therefore not part of the active API-state implementation yet.

Reusable UI is organized around the app shell and sidebar, local shadcn-style primitives under `components/ui`, dashboard and notification components, and focused lead-chat components such as `InboxColumn`, `MessagesArea`, `MessageInput`, and `LeadDetailsForm`.

## User Workflow

1. Sign in with backend-issued credentials and select the matching Admin or Sales Rep experience.
2. The app stores the authenticated session and routes the user to the sales dashboard, admin dashboard, or sudo-admin user view.
3. A sales user can refresh the Unassigned Pool and claim a lead, then open its chat. The lead route loads the conversation, profile details, and ownership state.
4. The user reads and sends messages, receives live conversation updates, and can retry a failed outgoing message. Incoming notifications can also jump directly to the related lead.
5. From the lead details surface, users can update contact details; permitted roles can submit a custom payment or perform the available lifecycle actions.

## Role-Based Experience

The implemented roles are `sales_rep`, `admin`, and `sudo_admin`.

- Sales reps see the unassigned pool, leads, and My Chats. Their lead-chat flow engages/releases conversations, and they can request a dead-lead review.
- Admins receive dashboard, user, team-activity, leads, and all-chat navigation. The UI permits administrative lead lifecycle actions and exposes user-management controls subject to its role checks.
- Sudo admins are routed first to Users and receive the broadest navigation set. The user-management screen has separate sudo-admin permission checks for staff actions.

Backend authorization remains authoritative: the frontend sends the session token with protected requests and also applies proxy and UI-level route guards.

## Engineering Highlights

- **API-state synchronization:** A shared fetch wrapper controls timeouts, retryable reads, throttling, and duplicate in-flight GET requests. Lead, dashboard, team, and notification views refresh state after relevant actions.
- **Conversation interaction:** The chat view merges fetched, WebSocket, and optimistic messages; it reconciles optimistic outbound messages with confirmed server events, reports delivery status, and offers retry on failure.
- **Live operations:** Lead-level and notification-level WebSocket clients reconnect after unexpected closure. Inbox, unassigned-pool, and audit-log lists also poll while the page is visible.
- **Role-aware navigation:** The sidebar, route redirects, and action controls adapt to the authenticated role and current engagement state.
- **Responsive workspace:** The shell changes from a vertical mobile layout to a sidebar layout on larger screens. The chat hides secondary panels on small screens and exposes details in a modal; directories, tables, and dashboard cards provide compact mobile presentations.
- **Component boundaries:** Shared layout, UI primitives, notifications, dashboard rendering, and lead-chat components keep individual routes focused on data orchestration.

## Technology Stack

- **Framework and language:** Next.js 16, React 19, TypeScript
- **Styling and UI:** Tailwind CSS 4, shadcn-style local primitives, Radix UI, Lucide icons, `tw-animate-css`
- **Client data and feedback:** native `fetch`, local `apiFetch` utility, React Context, Sonner toasts, `date-fns`
- **Realtime:** browser WebSocket API for lead messages and notifications
- **Included but not currently wired:** `@tanstack/react-query`
- **Tooling:** ESLint 9, PostCSS, TypeScript

## Repository Role

This repository contains the user-facing Next.js application. Webhook ingestion, lead processing, persistence, Meta integrations and background tasks live in the backend repository.

## Related Repository

[ManualDM backend repository](https://github.com/Zeeshan506/ManualDM)

## Project Structure

```text
app/
├── (admin)/                 # Admin dashboard, users, and team activity routes
├── (sales)/                 # Sales dashboard and unassigned-lead pool
├── leads/                   # Lead directory and conversation/detail route
├── chats/                   # Inbox landing view
├── login/                   # Authentication screen
├── layout.tsx               # Root providers and application shell
└── page.tsx                 # Role-based entry routing
components/
├── dashboard/
├── layout/
├── notifications/
└── ui/
contexts/                    # Authentication and notifications
lib/api-client.ts            # Client request controls and retry logic
proxy.ts                     # Authentication and role route guard
```

## Local Setup

Prerequisites: Node.js and npm, plus a reachable backend API.

```bash
npm install
```

Create `.env.local` in the repository root:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Then start the development server:

```bash
npm run dev
```

Open `http://localhost:3000`. The backend must expose the API and WebSocket routes used by the application.

## Environment Configuration

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Yes | Base URL used by client-side API requests and as the basis for WebSocket URLs. Example: `http://localhost:8000`. |

No other environment variable names are referenced in the current frontend source.

## Build / Quality Checks

The following scripts are defined in `package.json`:

```bash
npm run lint
npm run build
```

`npm run start` serves a production build after `npm run build`.

## Current Status

The core authenticated operational UI is implemented: login/session routing, role-aware navigation, lead lists, unassigned-lead claiming, conversation handling, dashboard data, administrative user/team views, notifications, and custom-payment/lifecycle actions are present in the frontend.

The project has lint and build scripts, but no automated test script is currently defined. Dependency installation is required before running those checks.

## Limitations / Future Work

- Stripe payments are not integrated: the displayed Stripe link is generated locally as a frontend preview.
- TanStack Query is installed but not yet used; current API state is managed with effects, local state/caches, contexts, and `apiFetch`.
- There is no implemented account/workspace-management surface or invoice-management screen.
- The dashboard Export Report button, the Team Activity filter selector, the inbox search input, and the login assistance/reset affordances do not have corresponding backend or filtering behavior in the current frontend code.
- No automated test command is configured in `package.json`.
