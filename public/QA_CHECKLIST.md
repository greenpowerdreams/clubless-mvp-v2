# Clubless Collective MVP - QA Checklist

## Last Updated: December 30, 2025

---

## 1. Profit Calculator (`/calculator`)

### Calculations
- [ ] Ticket revenue = attendance × ticket price
- [ ] Bar revenue = attendance × drinks per guest × drink price
- [ ] Total revenue = ticket revenue + bar revenue
- [ ] Staffing costs calculate correctly with locked rates (Bartender: $40/hr, Security: $25/hr)
- [ ] Service markup applies to staffing + catering only (not venue)
- [ ] Catering modes work: per-person and flat rate
- [ ] Service fee uses user's level rate when logged in
- [ ] Profit share mode calculates 50/50 split
- [ ] Net profit = total revenue - total costs
- [ ] Your take-home = net profit - clubless fee

### UI/UX
- [ ] All sliders update values in real-time
- [ ] Currency formatting consistent ($X,XXX)
- [ ] Auto-fill staffing recommends 1 bartender per 75 guests, 1 security per 100
- [ ] Level discount banner shows when logged in user has reduced fee
- [ ] "Submit This Event" button passes calculator data to submission form

---

## 2. Event Submission (`/submit`)

### Form Validation
- [ ] Name: required, 2-100 characters
- [ ] Email: required, valid email format
- [ ] City: required, 2-100 characters
- [ ] Preferred Date: required
- [ ] Event Concept: required, 20-2000 characters
- [ ] Fee Model: required selection
- [ ] Instagram handle: optional, max 50 characters

### Submission Behavior
- [ ] Submit button disabled while submitting (prevents double-click)
- [ ] Calculator data pre-fills if navigated from calculator
- [ ] Projected revenue/costs/profit saved to database
- [ ] full_calculator_json saved with all details
- [ ] Success screen shows with correct messaging

### Error Handling
- [ ] Invalid inputs show inline error messages
- [ ] Server errors show toast notification
- [ ] Form data preserved on failed submission

---

## 3. Auto-Account Creation

### New User Flow
- [ ] New email → user created in auth.users
- [ ] user_id linked to proposal
- [ ] Magic link generated and sent via email
- [ ] Success message indicates to check email

### Existing User Flow
- [ ] Existing email → user found and linked
- [ ] No duplicate user created
- [ ] Proposal linked to existing user_id
- [ ] Success message prompts to sign in

### Security
- [ ] Does NOT expose whether email already exists
- [ ] Multiple proposals allowed per email

---

## 4. Email Sending (Resend)

### Welcome Email (New Users)
- [ ] Subject: "Welcome to Clubless Collective! Access Your Dashboard"
- [ ] Contains: submitter name, city, event date, fee model, projected profit
- [ ] Magic link button works and redirects to /portal
- [ ] Clubless branding applied

### Status Update Emails
- [ ] under_review: "Your Event Proposal is Under Review"
- [ ] needs_info: "Action Required: We Need More Information" (includes notes)
- [ ] approved: "Congratulations! Your Event is Approved"
- [ ] published: "Your Event is Now Live!"
- [ ] completed: "Thank You for Hosting with Clubless Collective"
- [ ] rejected: "Update on Your Event Proposal" (includes notes)

### Error Handling
- [ ] Email failures logged to error_logs table
- [ ] Proposal still saves if email fails
- [ ] User shown appropriate message about email status

---

## 5. Authentication

### Magic Link Login (`/portal/login`)
- [ ] Email input validates format
- [ ] Magic link sent via Supabase auth
- [ ] Success screen shows "Check your email"
- [ ] Clicking link logs in and redirects to /portal
- [ ] Link expires after 24 hours

### Password Login
- [ ] Password mode available as alternative
- [ ] Error messages for invalid credentials
- [ ] Redirects to /portal on success

### Session Handling
- [ ] onAuthStateChange listener active
- [ ] Session persists across page refreshes
- [ ] Sign out clears session
- [ ] Protected routes redirect to login when not authenticated

---

## 6. User Portal (`/portal`)

### Authentication
- [ ] Redirects to /portal/login if not authenticated
- [ ] Shows loading state while checking auth

### Dashboard Display
- [ ] User's name shown in greeting
- [ ] Level card shows current level and progress
- [ ] Perks card shows active benefits
- [ ] Stats show completed events, published events, total profit

### Events List
- [ ] Only shows user's own proposals (RLS enforced)
- [ ] Status badges color-coded correctly
- [ ] Empty state shows "Submit New Event" prompt
- [ ] Clicking event navigates to detail page

### Event Detail (`/portal/events/:id`)
- [ ] Shows only if user owns the proposal
- [ ] Status timeline accurate
- [ ] "Needs Info" callout shown when applicable with notes
- [ ] Profit projection displayed
- [ ] Calculator details shown if available
- [ ] Submission details displayed

---

## 7. Admin Dashboard (`/admin`)

### Authentication
- [ ] Redirects to /admin/login if not authenticated
- [ ] Redirects to /admin/login if authenticated but not admin
- [ ] useAdminAuth hook checks user_roles table

### Proposals List
- [ ] Shows ALL proposals (admin RLS)
- [ ] Sortable by: submit date, event date, city, profit
- [ ] Filterable by status
- [ ] Export to CSV works

### Proposal Detail Panel
- [ ] Full proposal details displayed
- [ ] Status change dropdown available
- [ ] Status notes editable

### Status Updates
- [ ] Changing status updates: status, status_updated_at, status_notes
- [ ] approved → sets approved_at
- [ ] published → sets published_at
- [ ] completed → sets completed_at
- [ ] Status email sent on change (via edge function)
- [ ] Toast confirms success

### Eventbrite Integration
- [ ] URL input for Eventbrite link
- [ ] "Mark as Published" saves URL and updates status

### Error Logs (TODO)
- [ ] Error log viewer accessible in admin
- [ ] Shows: timestamp, event type, user email, error message
- [ ] Can mark as resolved

---

## 8. Security / RLS Policies

### event_proposals
- [ ] Users can SELECT where user_id = auth.uid()
- [ ] Users can INSERT (anyone)
- [ ] Users cannot UPDATE status fields
- [ ] Admins can SELECT all
- [ ] Admins can UPDATE all
- [ ] Admins can DELETE

### user_roles
- [ ] Users can SELECT their own roles
- [ ] Only admins can INSERT/UPDATE/DELETE

### user_stats
- [ ] Users can SELECT their own stats
- [ ] Admins can manage all

### user_levels
- [ ] Anyone can SELECT (public reference data)
- [ ] No INSERT/UPDATE/DELETE for non-admins

### error_logs
- [ ] Only admins can SELECT
- [ ] Only admins can UPDATE (mark resolved)
- [ ] Service role can INSERT

---

## 9. Routes

- [ ] `/` - Landing page loads
- [ ] `/how-it-works` - How it works page loads
- [ ] `/calculator` - Calculator loads and functions
- [ ] `/submit` - Submission form loads
- [ ] `/portal` - Redirects to login if not authenticated
- [ ] `/portal/login` - Login page loads
- [ ] `/portal/events/:id` - Event detail loads (if authorized)
- [ ] `/admin` - Redirects to login if not admin
- [ ] `/admin/login` - Admin login page loads
- [ ] `/status` - Status check page loads
- [ ] `/*` - 404 page for unknown routes

---

## 10. Console Errors

- [ ] No console errors on landing page
- [ ] No console errors on calculator
- [ ] No console errors on submission
- [ ] No console errors on portal
- [ ] No console errors on admin dashboard
- [ ] No unhandled promise rejections

---

## Changelog

### 2025-12-30
- Added input validation with zod schema
- Added error_logs table for admin visibility
- Added completed_at column to event_proposals
- Created send-status-email edge function
- Improved submit-proposal error handling and logging
- Added structured console logging with event prefixes
- Created QA checklist document
