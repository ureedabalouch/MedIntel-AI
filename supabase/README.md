# Supabase Database Configuration & Migrations

This folder contains the Supabase database migrations and seed files for the **MedIntel AI** relational database.

## Folder Structure

```
supabase/
├── migrations/          # SQL files containing database schema definitions and state updates
│   └── 001_initial_schema.sql
└── seed/                # SQL files containing local development seed data
    └── seed.sql
```

## Setup Instructions

To apply these migrations to your local Supabase instance or production database:

1. **Local Development (via Supabase CLI):**
   ```bash
   # Initialize Supabase in this project (if not already done)
   supabase init

   # Start the local Supabase container environment
   supabase start

   # Apply all migrations located in supabase/migrations/
   supabase db reset
   ```

2. **Deploying to Supabase Cloud:**
   You can push migrations to your remote project using the Supabase CLI:
   ```bash
   supabase db push
   ```
   Alternatively, you can copy the contents of `supabase/migrations/001_initial_schema.sql` and run them directly in the **SQL Editor** of your Supabase Dashboard.
