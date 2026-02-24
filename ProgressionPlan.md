 [X]PHASE 1: AUTHENTICATION AND FOUNDATION
Goal: Establish who the user is and protect routes without touching the existing chat logic.

* File: app/login/page.tsx (NEW)
Details: Create a simple login form. Add a role toggle (Admin vs Sales Rep). Add password assistance logic: if Admin, show a standard reset link; if Sales Rep, open a modal triggering a request to their manager.
* File: middleware.ts (NEW)
Details: Create a root-level middleware. Check for a valid session/token. Redirect unauthenticated users to /login. Prevent Sales Reps from accessing any /admin routes.
* File: contexts/AuthContext.tsx OR lib/store.ts (NEW)
Details: Set up a lightweight global state (using React Context or Zustand) to store the logged-in user's ID and Role. This allows child components to adapt their UI safely.

[] PHASE 2: NAVIGATION AND ROUTE GROUPS
Goal: Separate the dashboards logically while reusing the main layout wrapper.

* File: app/(admin)/layout.tsx AND app/(sales)/layout.tsx (NEW)
Details: Create route groups. These layouts will simply wrap their respective pages, allowing you to isolate specific UI elements if needed later.
* File: components/app-sidebar.tsx (MODIFY)
Details: Update the sidebar to consume the Auth Context. Conditionally render navigation items.
Admin Links: Dashboard, Team Activity, All Chats.
Sales Links: Unassigned Pool, My Chats.
* File: app/page.tsx (MODIFY)
Details: Transform the current root page into a routing hub. It should check the user's role and immediately redirect them to either the Admin Dashboard or the Sales Dashboard.

[] PHASE 3: THE SALES REP EXPERIENCE
Goal: Build the unassigned pool and ensure sales reps only see their claimed chats.

* File: app/(sales)/dashboard/page.tsx (NEW)
Details: This is the "Unassigned Pool". Build a UI that fetches and displays only leads that do not have an assigned sales rep.
* File: app/(sales)/dashboard/components/ClaimLeadButton.tsx (NEW)
Details: A button component attached to the unassigned leads. On click, it sends a request to the backend to assign the lead to the current User ID, then uses next/navigation to push the user to /leads/[id].
* File: app/leads/page.tsx AND app/leads/[id]/components/InboxColumn.tsx (MODIFY)
Details: Safely update the fetch requests. If the logged-in user is a Sales Rep, pass their User ID to the backend so the list ONLY populates with their active chats. If the user is an Admin, fetch everything.

[] PHASE 4: THE ADMIN DASHBOARD
Goal: Build the analytical and tracking views for management.

* File: app/(admin)/dashboard/page.tsx (NEW)
Details: Build the metrics dashboard. Use existing UI components (like your ui/skeleton or cards) to display Revenue, Leads Captured, and Leads Converted.
* File: app/(admin)/team-activity/page.tsx (NEW)
Details: Build the sales rep tracking page.
* File: app/(admin)/team-activity/components/ActivityTable.tsx (NEW)
Details: Create a tabular view listing all sales reps, their current active chat count, and recent activity status.

[] PHASE 5: CHAT INTERFACE CONTEXT ADAPTATION
Goal: Make the existing chat interface smart enough to know if an Admin is viewing it, without breaking the Sales Rep flow.

* File: app/leads/[id]/page.tsx (MODIFY)
Details: Keep the existing data fetching. Read the user role from your Auth Context. Pass a simple boolean prop like "isReadOnlyMode" or "isAdmin" down to the child components.
* File: app/leads/[id]/components/MessageInput.tsx (MODIFY)
Details: Accept the "isAdmin" prop. If true, disable the input field and display a small message saying "Read-Only: Viewing as Admin".
* File: app/leads/[id]/components/RightDetailsPanel.tsx (MODIFY)
Details: Accept the "isAdmin" prop. If true, you can add an extra section here for Admins to "Reassign" the chat to a different rep or force-close it.