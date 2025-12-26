# Donna Token

Donna Token is an internal, company-wide task marketplace platform designed to improve collaboration, productivity, and structured task management. The system enables employees to browse tasks, join based on skills, collaborate through a built-in discussion thread, and earn internal tokens for completed work. Tokens are accumulated by users and later converted into monetary payouts distributed monthly by administrators.

## Local Deployment Instructions

### Prerequisites

- Install and run Docker Desktop
- Make local `.env` with `.env.example` (Defaults only for development)

### To Run

```bash
docker compose up --build
```

### To Stop

```bash
docker compose down
```

### To Start Only Database

```bash
docker compose up -d db
```

### URLs

- **Frontend**, built with Docker, with routes handled based on the path: http://localhost:5173
- **Backend**, JSON based web API based on OpenAPI: http://localhost:8000
- **Automatic interactive documentation** with Swagger UI (from the OpenAPI backend): http://localhost:8000/docs
- **Adminer**, database web administration: http://localhost:8080

## Implemented API Endpoints

Base path: `/api/v1`

### Login

- `POST /login/access-token`
- `POST /login/test-token`
- `POST /password-recovery/{email}`
- `POST /reset-password/`
- `POST /password-recovery-html-content/{email}` (admin)

### Users

- `GET /users/` (admin)
- `POST /users/` (admin)
- `GET /users/me`
- `PATCH /users/me`
- `PATCH /users/me/password`
- `POST /users/me/team/{team_id}` (admin)
- `DELETE /users/me`
- `POST /users/signup`
- `GET /users/{user_id}`
- `PATCH /users/{user_id}` (admin)
- `PATCH /users/{user_id}/approve` (admin)
- `PATCH /users/{user_id}/reject` (admin)
- `DELETE /users/{user_id}` (admin)

### Teams

- `GET /teams/` (admin)
- `POST /teams/` (admin)
- `POST /teams/{team_id}` (team manager)
- `GET /teams/{id}/members` (admin)
- `DELETE /teams/{team_id}/members/{user_id}` (team manager)

### Task

- `GET /task/` (admin)
- `POST /task/` (admin)
- `GET /task/{task_id}` (admin)
- `GET /task/{task_id}/participants` (admin)
- `PUT /task/{task_id}` (owner or admin)
- `DELETE /task/{task_id}` (owner or admin)
- `PUT /task/{task_id}/participants/{user_id}` (owner or admin)
- `PATCH /task/{task_id}/reward/total_tokens` (owner or admin)

### Task Participant

- `GET /task_participant/` (admin)
- `POST /task_participant/` (task creator)

### Utils

- `POST /utils/test-email/` (admin)
- `GET /utils/health-check/`

### Private

- `POST /private/users/`

---

## Contributions by Gustavo Flores

*All features, systems, and improvements documented below were implemented by Gustavo Flores.*

### Quick Start: Automated Setup Scripts

Get up and running in minutes with our automated setup scripts:

**Windows (PowerShell):**
```powershell
.\scripts\setup.ps1
```

**macOS/Linux (Bash):**
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

The setup scripts automatically:
- Check prerequisites (Docker, Node.js, Python)
- Create `.env` file with generated secrets
- Install backend and frontend dependencies
- Start Docker services
- Play a completion sound notification

**For detailed setup instructions, troubleshooting, and development workflow, see [Setup_Guide.md](./Setup_Guide.md)**

### Sound Notifications

The setup scripts include sound notifications when setup completes. This provides audio feedback to developers that the setup process has finished successfully.

**Priority Order:**
1. **Custom sound**: `scripts/sounds/setup_complete.wav` (highest priority)
2. **Downloaded notification sounds**: `scripts/sounds/notification.wav` or `notification.mp3`
3. **System sounds**: Windows system notification sounds (Windows Notify.wav, chimes.wav, ding.wav)
4. **Console beeps**: Final fallback if no audio files are available

**For Developers - Testing Sound Notifications:**

**Windows (PowerShell):**
```powershell
# Test sound playback
.\scripts\test-sound.ps1

# Run setup (sound plays automatically on completion)
.\scripts\setup.ps1
```

**macOS/Linux (Bash):**
```bash
# Make script executable (first time only)
chmod +x scripts/test-sound.sh

# Test sound playback
./scripts/test-sound.sh

# Run setup (sound plays automatically on completion)
./scripts/setup.sh
```

**How It Works:**
- The test script checks for available audio players (`paplay`, `aplay`, `afplay` on Unix; `System.Media.SoundPlayer` on Windows)
- It tries each sound source in priority order until one succeeds
- If no sound files are found, it falls back to system sounds or console beeps

**Adding Custom Sounds:**
1. Place your sound file at: `scripts/sounds/setup_complete.wav`
2. Supported formats: WAV (recommended) or MP3
3. The setup script will automatically detect and use it
4. Test with: `.\scripts\test-sound.ps1` (Windows) or `./scripts/test-sound.sh` (Unix)

**Troubleshooting:**
- **Sound doesn't play**: Check that your system volume is up and the file exists
- **File not found**: Ensure the sound file is in `scripts/sounds/` directory
- **Format issues**: Use WAV format for best cross-platform compatibility
- **Permissions**: Ensure the script has read access to the sound file

---

### 1. Automated Setup Scripts and Sound Notifications

**Implemented:**
- Cross-platform setup scripts (`setup.ps1` for Windows, `setup.sh` for macOS/Linux)
- Automated environment setup with prerequisite checking
- Sound notification system for setup completion
- Test scripts for sound playback verification

**Files:**
- `scripts/setup.ps1` - Windows PowerShell setup script
- `scripts/setup.sh` - Bash setup script for Unix systems
- `scripts/test-sound.ps1` / `scripts/test-sound.sh` - Sound testing utilities
- `scripts/sounds/setup_complete.wav` - Custom completion sound (424 KB)
- `additions_sound.txt` - Documentation for sound notification system

**Features:**
- Automatic Docker, Node.js, and Python version checking
- `.env` file generation with secure secrets
- Dependency installation automation
- Docker Compose service startup
- Multi-platform sound playback support (Windows, macOS, Linux)

**Sound Playback Methods:**
- **Windows**: Uses `System.Media.SoundPlayer` for WAV files, Windows Media Player COM object for MP3
- **Linux**: Uses `paplay` (PulseAudio), `aplay` (ALSA), or `mpg123`/`mpg321` for MP3
- **macOS**: Uses `afplay` for both WAV and MP3 files
- **Fallback**: System notification sounds or terminal beeps if no audio files are available

### 2. User Status & Authentication System

**Implemented:**
- Comprehensive user status management with four states: PENDING, ACTIVE, INACTIVE, SUSPENDED
- Strict `is_active` flag mapping: "can log in" semantics
- Status-based login enforcement with specific error messages
- Service functions for user lifecycle management

**Key Features:**
- **PENDING**: Cannot log in. Shows: "Your account is pending approval. Please contact admin."
- **ACTIVE**: Can log in. Full permissions via role.
- **INACTIVE**: Can log in. No role permissions (RBAC denies everything).
- **SUSPENDED**: Cannot log in. Shows: "You have been suspended. Please contact admin."

**Implementation Details:**
- Centralized `compute_is_active(status)` helper function
- Status-to-`is_active` mapping: ACTIVE/INACTIVE → True, PENDING/SUSPENDED → False
- `authenticate()` function enforces status checks and returns specific error messages
- All service functions (`approve_user`, `reject_user`, `activate_user`, `deactivate_user`, `suspend_user`, `unsuspend_user`) respect the status rules

**Files Modified:**
- `backend/app/crud/user.py` - User CRUD operations with status logic
- `backend/app/api/routes/login.py` - Login endpoint with status enforcement
- `frontend/src/components/Admin/EditUser.tsx` - Admin UI for user status management

### 3. Task Management System with Expandable Cards

**Implemented:**
- Inline expandable task cards replacing separate landing pages
- Full task detail view within the card expansion
- Join/Decline functionality in expanded view
- Manager controls for participant management
- Real-time openings count updates

**Key Features:**
- **Collapsed View**: Title, description preview, difficulty, reward, openings, deadline, status
- **Expanded View**: Full description, required skills, participation section, participant management (managers), task management controls
- **Smooth Animations**: Expand/collapse transitions with visual feedback
- **State Management**: Tracks which task is expanded, prevents navigation away from list

**Files Created:**
- `frontend/src/components/Tasks/ExpandableTaskCard.tsx` - Main expandable card component

**Files Modified:**
- `frontend/src/routes/_layout/items.tsx` - Task list page with expandable cards
- `frontend/src/routes/_layout/items.$taskId.tsx` - (Deprecated, functionality moved to expandable cards)

### 4. Participant Management System

**Implemented:**
- Manager/Admin ability to add users to tasks
- Manager/Admin ability to remove users from tasks
- Real-time participant list with user names and emails
- Dynamic openings count that updates when users join/leave
- Participant status tracking and display

**Key Features:**
- **Add Participants**: Dropdown selector showing available users (excludes already participating)
- **Remove Participants**: Remove button on each participant card with confirmation
- **User Display**: Shows full name and email instead of just user IDs
- **Openings Tracking**: Automatically calculates remaining openings (excludes REJECTED participants)
- **Permission-Based**: Only MANAGER, ADMIN, and SUPER_ADMIN can manage participants

**Backend Endpoints:**
- `PUT /api/v1/task/{task_id}/participants/{user_id}` - Add participant (MANAGER+)
- `DELETE /api/v1/task/{task_id}/participants/{user_id}` - Remove participant (MANAGER+)
- `POST /api/v1/task/{task_id}/join` - User self-join endpoint

**Files Modified:**
- `backend/app/api/routes/task.py` - Added participant management endpoints
- `backend/app/crud/task.py` - Updated `add_participant_to_task` to accept `current_user_id`
- `frontend/src/routes/_layout/items.$taskId.tsx` - Participant management UI

### 5. Design System: Calm Bento

**Implemented:**
- Comprehensive design token system
- Low-contrast, easy-on-the-eyes color palette
- Glassmorphism effects with soft depth
- Bento layout pattern (modular tiles)
- Modern/hologram aesthetic with subtle effects

**Design Tokens:**
- **Colors**: `bg.page`, `bg.surface.low/high`, `border.subtle/strong`, `text.primary/muted/inverse`, `accent.primary/secondary/highlight/danger/success/warning`
- **Radii**: `radius.sm/md/lg/xl` (6px, 10px, 16px, 24px)
- **Shadows**: `shadow.soft/glass/pop` for depth
- **Typography**: `font.family.ui/code`, `font.size.xs/2xl`, `font.weight.regular/medium/semibold`
- **Spacing**: `space.xs/2xl` (4px to 32px)

**Visual Effects:**
- Thin neon accent line on expanded task cards (gradient: #2F81FF → #7A4DFF)
- Subtle grid pattern in card headers (3% opacity radial dots)
- Futuristic typography for labels (code font, uppercase, letter spacing)
- Smooth transitions and hover effects

**Files Created:**
- `frontend/src/theme.tsx` - Global design tokens and theme configuration
- `frontend/src/theme/button.recipe.ts` - Button component styling
- `frontend/src/theme/card.recipe.ts` - Card/panel component styling
- `frontend/src/theme/input.recipe.ts` - Input field styling

**Files Modified:**
- All frontend components updated to use design tokens instead of hardcoded values

### 6. Task Soft Delete with Audit Tracking

**Implemented:**
- Soft delete functionality for tasks (marks as deleted instead of removing from database)
- Audit fields: `deleted_at` (timestamp) and `deleted_by` (user ID)
- Filtered queries to exclude deleted tasks from listings
- Permission-based deletion (task owners and MANAGER+ roles)

**Database Changes:**
- Added `deleted_at` and `deleted_by` columns to `task` table
- Updated `get_task_by_id` and `get_tasks` to filter out deleted tasks
- `delete_task` CRUD function now performs soft delete

**Files Modified:**
- `backend/app/models/task.py` - Added audit fields to Task model
- `backend/app/crud/task.py` - Implemented soft delete logic
- `backend/app/api/routes/task.py` - Updated delete endpoint to pass current_user_id
- `backend/app/alembic/versions/001_initial_schema.py` - Migration for audit fields

### 7. Task Audit Fields

**Implemented:**
- Audit tracking for task participant status changes
- Fields: `last_status_change_at`, `last_updated_by_id`
- Automatic timestamp and user ID tracking on status transitions

**Files Modified:**
- `backend/app/models/task_participant.py` - Added audit fields
- `backend/app/crud/task_participant.py` - Updated status change functions to set audit fields

### 8. Task Creation Permissions

**Implemented:**
- Expanded task creation permissions to include TEAM_MANAGER role
- Roles that can create tasks: TEAM_MANAGER, MANAGER, ADMIN, SUPER_ADMIN
- Task owner is set to `created_by` field automatically

**Files Modified:**
- `backend/app/core/roles.py` - Updated `can_create_tasks` function
- `backend/app/api/routes/task.py` - Changed dependency from `require_admin` to `require_team_manager`
- `frontend/src/routes/_layout/items.tsx` - Updated "Create Task" button visibility logic

### 9. Task Deletion Permissions

**Implemented:**
- Full control over task deletion for higher roles
- Task owners, MANAGER+, ADMIN, and SUPER_ADMIN can delete tasks
- Soft delete with audit tracking

**Files Modified:**
- `backend/app/api/permissions.py` - Updated `require_task_owner` to allow MANAGER+ deletion
- `frontend/src/components/Tasks/ExpandableTaskCard.tsx` - Delete button with confirmation dialog

### 10. Task Reward Ledger System

**Implemented:**
- Immutable event log for all token transactions
- Complete audit trail of rewards, bonuses, adjustments, and reversals
- Atomic balance updates with ledger entry creation
- Aggregate views for analytics (top earners, most rewarding tasks, admin activity)

**Key Features:**
- **Immutable Ledger**: All reward events recorded as append-only entries
- **Balance Tracking**: Automatic calculation of previous_balance and new_balance
- **Action Types**: AWARD_ON_COMPLETION, BONUS, ADJUSTMENT, REVERSAL
- **Audit Fields**: task_id, user_id, actor_id, task_participant_id, timestamps
- **Aggregate Queries**: Top earning users, most rewarding tasks, most active admins/managers

**Database Schema:**
- `reward_ledger` table with fields: id, task_id, user_id, actor_id, task_participant_id, amount, unit, action_type, previous_balance, new_balance, notes, created_at
- `user.token_balance` field for current balance (derived from ledger)

**Backend Endpoints:**
- `GET /api/v1/ledger/` - List ledger entries with filtering (date range, user, actor, task, action type)
- `GET /api/v1/ledger/top-users` - Top earning users aggregate
- `GET /api/v1/ledger/top-tasks` - Most rewarding tasks aggregate
- `GET /api/v1/ledger/top-actors` - Most active admins/managers aggregate
- `GET /api/v1/ledger/high-adjustment-users` - Users with frequent adjustments

**Files Created:**
- `backend/app/models/reward_ledger.py` - Ledger models and schemas
- `backend/app/crud/reward_ledger.py` - CRUD operations and aggregate queries
- `backend/app/services/reward_ledger_service.py` - Service layer for atomic balance updates
- `backend/app/api/routes/reward_ledger.py` - API endpoints
- `frontend/src/routes/_layout/ledger.tsx` - Admin ledger view with filters and aggregates

**Files Modified:**
- `backend/app/models/user.py` - Added `token_balance` field
- `backend/app/alembic/versions/002_add_reward_ledger_and_user_balance.py` - Migration

### 11. Task Submission & Review Workflow

**Implemented:**
- Complete submission workflow with evidence, notes, and file uploads
- Manager review system with confirm/reject actions
- Submission details tracking (notes, URLs, uploaded files)
- Review notes and reviewer tracking

**Key Features:**
- **User Submission**: Users submit completion with notes, optional URL, and optional file upload
- **Evidence Collection**: Support for submission notes, proof URLs, and file uploads (images/PDFs)
- **Manager Review**: Managers can confirm (award tokens) or reject submissions with review notes
- **Status Workflow**: JOINED → SUBMITTED → CONFIRMED/REJECTED
- **Audit Trail**: All submissions and reviews tracked with timestamps and user IDs

**Database Schema:**
- Added to `taskparticipant` table:
  - `submission_notes` - User's description of work completed
  - `submission_url` - Optional link to proof (repo, doc, dashboard)
  - `completion_image_path` - Path to uploaded file
  - `review_notes` - Manager's comments on confirm/reject
  - `reviewed_by_id` - Who confirmed/rejected (manager/admin)

**Backend Endpoints:**
- `POST /api/v1/task/{task_id}/submit` - Submit task completion (multipart form with file upload)
- `POST /api/v1/task/{task_id}/participants/{user_id}/confirm` - Confirm submission and award tokens
- `POST /api/v1/task/{task_id}/participants/{user_id}/reject` - Reject submission with notes
- `GET /api/v1/task-submission/pending` - Get pending submissions for managers

**Files Created:**
- `backend/app/core/file_storage.py` - File upload utilities (save, validate, delete)
- `backend/app/models/task_participant.py` - Extended with submission/review fields
- `backend/app/api/routes/task_submission.py` - Submission endpoints
- `frontend/src/components/Tasks/TaskSubmissionDialog.tsx` - Submission dialog component
- `frontend/src/components/Tasks/ReviewSubmissionDialog.tsx` - Review dialog component
- `frontend/src/routes/_layout/submissions.tsx` - Submissions inbox page for managers

**Files Modified:**
- `backend/app/crud/task_participant.py` - Updated submission/review functions
- `backend/app/api/routes/task.py` - Added submit, confirm, reject endpoints
- `backend/app/alembic/versions/003_add_task_submission_fields.py` - Migration

### 12. In-App Notifications System

**Implemented:**
- Real-time notification system for task submissions and reviews
- Notification types: task submitted, task confirmed, task rejected
- Unread count tracking and mark-as-read functionality
- Deep linking to specific submissions

**Key Features:**
- **Notification Types**: TASK_SUBMITTED, TASK_CONFIRMED, TASK_REJECTED
- **Payload System**: Flexible JSON payload for notification data
- **Read Status**: Track read/unread state with timestamps
- **User Targeting**: Notifications sent to relevant users (managers for submissions, users for confirmations/rejections)

**Database Schema:**
- `notification` table with fields: id, user_id, type, task_id, task_participant_id, payload (JSON), is_read, created_at

**Backend Endpoints:**
- `GET /api/v1/notification/` - List user's notifications
- `GET /api/v1/notification/unread-count` - Get unread notification count
- `POST /api/v1/notification/{id}/read` - Mark notification as read
- `POST /api/v1/notification/read-all` - Mark all notifications as read

**Files Created:**
- `backend/app/models/notification.py` - Notification model
- `backend/app/crud/notification.py` - Notification CRUD operations
- `backend/app/services/notification_service.py` - Notification service functions
- `backend/app/api/routes/notification.py` - Notification API endpoints
- `backend/app/alembic/versions/004_add_notification_table.py` - Migration

**Files Modified:**
- `backend/app/api/routes/task.py` - Integrated notification service calls
- `backend/app/api/main.py` - Added notification router

### 13. Submissions Inbox for Managers

**Implemented:**
- Dedicated page for managers to review pending task submissions
- Table view with task, participant, submission details, and review actions
- Deep linking support for direct navigation to specific submissions
- Filtering by task and participant

**Key Features:**
- **Pending Submissions Table**: Shows all SUBMITTED participants awaiting review
- **Submission Details**: Displays submission notes, proof URLs, and file upload indicators
- **Quick Review**: "Review" button opens review dialog for each submission
- **Deep Linking**: URL parameters (`?task_id=X&participant_id=Y`) auto-open review dialog
- **Pagination**: Handles large numbers of pending submissions

**Frontend Components:**
- `frontend/src/routes/_layout/submissions.tsx` - Main submissions inbox page
- Integrated with `ReviewSubmissionDialog` for review actions
- Badge indicators on task cards showing pending submission counts

**Files Modified:**
- `frontend/src/components/Common/SidebarItems.tsx` - Added "Submissions" link for managers
- `frontend/src/routes/_layout/items.tsx` - Added "Needs Review" filter and pending count badges

---

## Additional Resources

### Documentation Files

- **[Setup_Guide.md](./Setup_Guide.md)** - Complete setup guide with all commands and workflows
- **[development.md](./development.md)** - Detailed development workflow and local development
- **[deployment.md](./deployment.md)** - Production deployment instructions
- **[backend/README.md](./backend/README.md)** - Backend-specific documentation
- **[frontend/README.md](./frontend/README.md)** - Frontend-specific documentation

### Design Documents

- **[Donna Token Backend Design Report.md](./Donna%20Token%20Backend%20Design%20Report.md)** - Original backend design specification

---

## License

See [LICENSE](./LICENSE) file for details.
