# Right Time Parts Tracker

A role-based parts request tracking web app for internal use. Replace paper parts request forms with a modern, auditable digital solution.

## Features

- **Role-based access**: Staff and Boss (Admin) roles with different permissions
- **Parts requests**: Staff can create multi-item parts requests
- **Status tracking**: 
  - Boss can set order status (Ordered, Backorder, Discontinued)
  - Staff can set receiving status (Received, Part Defective)
- **Bulk operations**: Boss can bulk update status on multiple items
- **Audit trail**: All status changes are logged for accountability
- **Mobile friendly**: Responsive design works on all devices
- **Search & filter**: Find items by job bag, manufacturer, status

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js Server Actions
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth with Row Level Security

## Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- A Supabase project ([create one here](https://supabase.com))

### 1. Clone and Install

```bash
cd right-time-parts-tracker
npm install
```

### 2. Configure Environment

Copy the example environment file and add your Supabase credentials:

```bash
cp env.example .env.local
```

Edit `.env.local` with your Supabase project details:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional: Allow boss to modify staff_status (emergency override)
ADMIN_CAN_MODIFY_STAFF_STATUS=false
```

### 3. Set Up Database

1. Go to your Supabase Dashboard → SQL Editor
2. Run the migration file: `supabase/migrations/001_initial_schema.sql`

This creates:
- Tables: `user_roles`, `requests`, `request_items`, `audit_logs`
- Row Level Security policies for all tables
- Indexes for efficient queries

### 4. Create Test Users

1. Go to Supabase Dashboard → Authentication → Users
2. Create two users:
   - `boss@example.com` (password: `Password123!`)
   - `staff@example.com` (password: `Password123!`)
3. Copy their user IDs
4. Edit `supabase/seed.sql` and replace the placeholder UUIDs
5. Run the seed script in SQL Editor

### 5. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Usage

### Staff Workflow

1. **Login** at `/login` with staff credentials
2. **Create Request** at `/new-request`:
   - Add job bag number, manufacturer, part name, quantity
   - Add multiple items to one request
   - Submit to send to boss for ordering
3. **Receive Parts** at `/receiving`:
   - View all items with their order status
   - Update staff status when parts arrive (Received / Part Defective)

### Boss Workflow

1. **Login** at `/login` with boss credentials
2. **Manage Orders** at `/pick-list`:
   - View all pending parts requests
   - Update boss status (Ordered, Backorder, Discontinued)
   - Select multiple items and bulk update
3. **View Details**: Click any job bag number to see full history

### Both Roles

- Access job bag details at `/job-bag/[jobBagNumber]`
- View complete audit trail of status changes
- Use search and filters to find specific items

## Testing

Run unit tests:

```bash
npm test
```

## Project Structure

```
├── app/
│   ├── actions/        # Server actions for data mutations
│   ├── login/          # Login page
│   ├── new-request/    # Create parts request (staff)
│   ├── pick-list/      # Order management (boss)
│   ├── receiving/      # Receive parts (staff)
│   └── job-bag/        # Job bag detail pages
├── components/         # Reusable UI components
├── lib/
│   ├── supabase/       # Supabase client configuration
│   └── types.ts        # TypeScript type definitions
├── supabase/
│   ├── migrations/     # Database schema SQL
│   └── seed.sql        # Sample data script
└── __tests__/          # Unit tests
```

## Security

- **Authentication**: Supabase Auth with email/password
- **Authorization**: Row Level Security (RLS) policies on all tables
- **Server-side validation**: All mutations verify user role
- **Audit logging**: Every status change is recorded

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key | Yes |
| `ADMIN_CAN_MODIFY_STAFF_STATUS` | Allow boss to edit staff_status | No (default: false) |

## License

Internal use only.
