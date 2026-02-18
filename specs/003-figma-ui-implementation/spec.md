# Feature Specification: Figma UI Implementation for Event Attendance

**Feature Branch**: `003-figma-ui-implementation`  
**Created**: February 17, 2026  
**Status**: Draft  
**Input**: User description: "Implement the Figma design for Event Attendance UI screens: Employee Home, New Request form, View Request details, Approver Home dashboard, and Approve/Reject Request actions"

**Figma Source**: [Event Attendance Design](https://www.figma.com/design/UyhNeV4lXNaLjhHeNV0aXr/Event-Attendance)

## User Scenarios & Testing

### User Story 1 - Employee Submits a New Event Request (Priority: P1)

An employee navigates to the "New Request" screen and fills out a form to request approval for attending an event. The form collects event information (name, website, role), travel details (transportation mode, origin, destination), and estimated costs (registration, travel, hotel, meals, other). The system automatically calculates the total estimated cost. The employee submits the request and is returned to their dashboard.

**Why this priority**: Submitting a request is the entry point for the entire workflow. Without new requests, no other screens have data to display.

**Independent Test**: Can be fully tested by navigating to the New Request screen, filling out the form, and verifying submission creates a request visible on the dashboard.

**Acceptance Scenarios**:

1. **Given** an employee is on the New Request screen, **When** they fill in all required fields (Event Name, Event Website, Role, Transportation Mode, Origin, Destination) and submit, **Then** the request is created with a "Pending" status and the employee is redirected to the dashboard.
2. **Given** an employee is filling out the form, **When** they enter cost values for Registration, Travel, Hotel, Meals, and Other, **Then** the Total Estimated Cost updates automatically with the sum of all entered costs.
3. **Given** an employee is on the New Request form, **When** they leave a required field empty and attempt to submit, **Then** the form displays a validation error for the missing field and does not submit.
4. **Given** an employee is on the New Request form, **When** they click "Cancel", **Then** they are returned to the dashboard without creating a request.
5. **Given** an employee opens the Role dropdown, **When** they view the options, **Then** they see "Speaker", "Organizer", and "Assistant" as choices.
6. **Given** an employee opens the Transportation Mode dropdown, **When** they view the options, **Then** they see "Flight" and other applicable transportation modes.

---

### User Story 2 - Employee Views Their Dashboard (Priority: P1)

An employee lands on the "My Event Requests" dashboard which shows a summary of their requests by status (Total, Pending, Approved, Rejected) and a list of their submitted request cards. Each card displays the event name, status badge, role, submission date, destination, and total cost. The employee can click "View Details" to see the full request.

**Why this priority**: The dashboard is the primary landing screen and the central navigation hub for employees.

**Independent Test**: Can be tested by loading the dashboard and verifying summary counts match listed requests, and that request cards display correct information.

**Acceptance Scenarios**:

1. **Given** an employee has submitted requests, **When** they view the dashboard, **Then** they see four summary cards showing Total Requests, Pending, Approved, and Rejected counts.
2. **Given** requests exist in different statuses, **When** the dashboard loads, **Then** each count card displays the correct number with color-coded values (amber for Pending, green for Approved, red for Rejected).
3. **Given** an employee has one or more requests, **When** the dashboard loads, **Then** each request card shows the event name, status badge, role, submission date, destination, and estimated cost.
4. **Given** a request card is displayed, **When** the employee clicks "View Details", **Then** they navigate to the request detail view for that request.

---

### User Story 3 - Employee Views Request Details (Priority: P2)

An employee navigates from their dashboard to a detailed view of a specific request. The detail view shows the event header (name, submission date, status badge), requester information (name, event website link, role), travel details (transportation mode with icon, origin, destination), a comments section, and a cost breakdown sidebar showing itemized costs and total.

**Why this priority**: Viewing details provides transparency and allows the employee to review their submitted request before and after approval.

**Independent Test**: Can be tested by clicking "View Details" on a request card and verifying all fields display correctly.

**Acceptance Scenarios**:

1. **Given** an employee clicks "View Details" on a request card, **When** the detail view loads, **Then** it displays the event name, submission date, and status badge.
2. **Given** the detail view is loaded, **When** the employee views the request info, **Then** they see the requester name, a clickable event website link, and the role.
3. **Given** the detail view is loaded, **When** the employee views Travel Details, **Then** they see the transportation mode (with appropriate icon), origin, and destination.
4. **Given** the detail view is loaded, **When** the employee views the Cost Breakdown sidebar, **Then** they see itemized costs (Registration, Travel, Hotel, Meals, Other) and a highlighted total.
5. **Given** the detail view is loaded, **When** the employee clicks "Back", **Then** they return to the dashboard.
6. **Given** the detail view has a comments section, **When** no comments have been added, **Then** the section displays "No comments yet" with an "Add Comment" button.

---

### User Story 4 - Approver Reviews All Event Requests (Priority: P2)

An approver views the "All Event Requests" dashboard showing all team requests. The dashboard includes summary cards (Total, Pending, Approved, Rejected) and request cards with additional approver context: requester name ("Requested by:") and the latest comment. Approved and Rejected requests show their latest comment in a muted background strip.

**Why this priority**: The approver dashboard is the entry point for the approval workflow and enables approvers to triage requests.

**Independent Test**: Can be tested by signing in as an approver and viewing the dashboard with a mix of pending, approved, and rejected requests.

**Acceptance Scenarios**:

1. **Given** an approver navigates to the dashboard, **When** the page loads, **Then** they see "All Event Requests" title with the subtitle "Review and manage event attendance requests from your team".
2. **Given** the approver dashboard loads, **When** requests exist, **Then** summary cards show correct counts for Total, Pending, Approved, and Rejected.
3. **Given** request cards are displayed, **When** the approver views a card, **Then** it shows the event name, status badge, role, date, destination, cost, and "Requested by: [employee name]".
4. **Given** a request has been approved or rejected, **When** the approver views the card, **Then** a muted strip at the bottom shows "Latest comment: [comment text]".
5. **Given** a request card is displayed, **When** the approver clicks "View Details", **Then** they navigate to the approval detail view for that request.
6. **Given** the approver dashboard navigation, **When** the "Approvals" link is viewed, **Then** it displays a red badge with the count of pending approvals.

---

### User Story 5 - Approver Approves or Rejects a Request (Priority: P1)

An approver navigates from the approver dashboard to the detail view of a pending request. The view shows all request details (same as employee view) plus an "Actions" sidebar containing a comment textarea and Approve/Reject buttons. A comment is optional for approval but required for rejection. Upon action, the request status is updated and the approver is returned to the dashboard.

**Why this priority**: Approval/rejection is the core business action in the workflow and the reason the application exists.

**Independent Test**: Can be tested by navigating to a pending request, entering a comment, and clicking Approve or Reject, then verifying the status change.

**Acceptance Scenarios**:

1. **Given** an approver opens a pending request, **When** the detail view loads, **Then** they see an "Actions" section with a comment textarea and "Approve Request" (green) and "Reject Request" (red) buttons.
2. **Given** the approver views the Actions section, **When** they see the textarea placeholder, **Then** it reads "Add a comment (optional for approval, required for rejection)...".
3. **Given** an approver clicks "Approve Request" without entering a comment, **When** the action is processed, **Then** the request status changes to "Approved" and the approver is returned to the dashboard.
4. **Given** an approver clicks "Approve Request" with a comment, **When** the action is processed, **Then** the request is approved and the comment is saved.
5. **Given** an approver clicks "Reject Request" without entering a comment, **When** the action is attempted, **Then** the system prevents the rejection and prompts for a required comment.
6. **Given** an approver enters a comment and clicks "Reject Request", **When** the action is processed, **Then** the request status changes to "Rejected", the comment is saved, and the approver is returned to the dashboard.

---

### User Story 6 - User Switches Between Employee and Approver Roles (Priority: P3)

A user who has both employee and approver permissions can switch between roles using the "Switch to Approver" / "Switch to Employee" button in the header navigation. The navigation bar, dashboard, and available actions change accordingly.

**Why this priority**: Role switching is a convenience feature; the core flows work independently for each role.

**Independent Test**: Can be tested by clicking the role switch button and verifying the navigation, dashboard title, and available actions change correctly.

**Acceptance Scenarios**:

1. **Given** a user is in the employee view, **When** they click "Switch to Approver", **Then** the navigation changes to show "Dashboard" and "Approvals" (with badge), the user label changes, and the button becomes "Switch to Employee".
2. **Given** a user is in the approver view, **When** they click "Switch to Employee", **Then** the navigation changes to show "Dashboard" and "New Request", and the button becomes "Switch to Approver".
3. **Given** a user with only the employee role, **When** they view the header, **Then** the "Switch to Approver" button is not shown.

---

### User Story 7 - User Adds Comments to a Request (Priority: P3)

Both employees and approvers can add comments to a request from the detail view. The comments section shows existing comments or "No comments yet" when empty. An "Add Comment" button opens the ability to add a new comment.

**Why this priority**: Comments support collaboration but are not required for the core submit/approve/reject workflow.

**Independent Test**: Can be tested by opening a request detail view, clicking "Add Comment", typing a comment, and verifying it appears in the comments section.

**Acceptance Scenarios**:

1. **Given** a request has no comments, **When** the detail view loads, **Then** the comments section displays "No comments yet".
2. **Given** a user clicks "Add Comment", **When** the comment input is shown, **Then** the user can type and submit a comment.
3. **Given** a comment has been submitted, **When** the detail view is refreshed, **Then** the comment appears in the comments section.

---

### Edge Cases

- What happens when the employee submits a request with all cost fields set to zero?
- How does the system handle an approver attempting to approve/reject a request that has already been decided by another approver?
- What happens when the event website URL is invalid or unreachable?
- How does the dashboard behave when there are no requests at all (empty state)?
- What happens if a user's session expires while filling out the New Request form?
- How does the system handle very long event names or comments that exceed display boundaries?

## Requirements

### Functional Requirements

- **FR-001**: System MUST display an Employee Dashboard ("My Event Requests") with four summary cards showing Total Requests, Pending, Approved, and Rejected counts, each with color-coded values.
- **FR-002**: System MUST display request cards on the employee dashboard showing event name, status badge (Pending/Approved/Rejected), role, submission date, destination, and total cost.
- **FR-003**: System MUST provide a "New Request" form with three sections: Event Information (Event Name, Event Website, Role), Travel Details (Transportation Mode, Origin, Destination), and Estimated Costs (Registration, Travel, Hotel, Meals, Other).
- **FR-004**: System MUST auto-calculate and display the Total Estimated Cost as the sum of all cost fields in real-time as the user enters values.
- **FR-005**: System MUST validate required form fields (marked with *) before allowing submission: Event Name, Event Website, Role, Transportation Mode, Origin, and Destination.
- **FR-006**: System MUST provide a request detail view showing event header (name, date, status), requester info (name, website link, role), travel details (mode with icon, origin, destination), comments section, and cost breakdown sidebar.
- **FR-007**: System MUST display an Approver Dashboard ("All Event Requests") with the same summary cards as the employee dashboard but showing all team requests, including "Requested by" and latest comment information.
- **FR-008**: System MUST provide an Actions section in the approver's request detail view with a comment textarea, an "Approve Request" button (green), and a "Reject Request" button (red).
- **FR-009**: System MUST require a comment when an approver rejects a request, and make comments optional when approving.
- **FR-010**: System MUST update request status to "Approved" or "Rejected" when the approver takes action and redirect the approver to the dashboard.
- **FR-011**: System MUST provide a "Switch to Approver" / "Switch to Employee" toggle in the header for users with dual roles.
- **FR-012**: System MUST display the Approvals navigation link with a red badge showing the count of pending requests in the approver view.
- **FR-013**: System MUST provide "Back" navigation from detail views to return to the respective dashboard.
- **FR-014**: System MUST display the event website as a clickable link (in blue) in the request detail view.
- **FR-015**: System MUST display status badges with distinct colors: amber/yellow for Pending, green for Approved, red for Rejected.
- **FR-016**: Feature MUST define code quality expectations (lint/format/static analysis) and failure conditions — all screens must pass existing lint and format rules with zero errors.
- **FR-017**: Feature MUST define required tests (unit/integration as applicable) — each screen/component must have corresponding unit tests; approval workflow must have integration tests.
- **FR-018**: Feature MUST define UX consistency rules — loading states must show skeletons or spinners, empty states must show descriptive messages, and error states must show user-friendly messages matching the design system.
- **FR-019**: Feature MUST define measurable performance budgets — screens must render initial content within acceptable thresholds.

### Key Entities

- **Event Request**: Represents an employee's request to attend an event. Key attributes: event name, event website URL, role (Speaker/Organizer/Assistant), transportation mode, origin, destination, cost breakdown (registration, travel, hotel, meals, other), total cost, status (Pending/Approved/Rejected), submission date, requester, assigned approver.
- **Comment**: A text note attached to a request. Key attributes: author, content, timestamp. Associated with an Event Request.
- **User**: A person using the system. Can have one or both roles: Employee (submits requests) and Approver (reviews and decides on requests).

## Success Criteria

### Measurable Outcomes

- **SC-001**: Employees can submit a complete event attendance request in under 3 minutes.
- **SC-002**: All five screens (Employee Home, New Request, View Request, Approver Home, Approve Request) visually match the Figma designs with no significant deviations in layout, color, typography, or spacing.
- **SC-003**: The total cost auto-calculation updates within 200 milliseconds of user input.
- **SC-004**: Approvers can approve or reject a request in under 30 seconds from opening the detail view.
- **SC-005**: 0 lint errors and 0 formatter diffs in CI for all new and modified files.
- **SC-006**: All required test suites pass — unit tests for each UI component/screen and integration tests for the approval workflow.
- **SC-007**: All screens display appropriate loading, empty, and error states consistent with the design system.
- **SC-008**: Each screen renders initial meaningful content within 2 seconds on a standard connection.
- **SC-009**: Navigation between all screens (dashboard to detail, detail back to dashboard, role switching) completes without full page reloads.
- **SC-010**: The application correctly enforces role-based access — employees see only their own requests; approvers see all team requests with action capabilities.

## Assumptions

- The application uses a role-based model where a user can hold both Employee and Approver roles simultaneously, with the ability to toggle between them at runtime.
- The "Role" field on the request form has three fixed options: Speaker, Organizer, and Assistant.
- Cost fields accept numeric (decimal) values in US dollars.
- The event website URL should be validated as a properly formed URL.
- The Transportation Mode dropdown includes at least "Flight" as an option; other modes (e.g., Train, Car, Bus) may be available.
- The navigation header is consistent across all screens, adapting only the active link highlight and the role-switch button text based on the current view mode.
- The "Approvals" badge count reflects the number of requests with "Pending" status assigned to the current approver.
- Status badges use the following color mapping: Pending = amber (#f0b100), Approved = green (#00c950), Rejected = red (#fb2c36).
- The design uses the Arimo font family.
- The application is a single-page application using client-side routing.
