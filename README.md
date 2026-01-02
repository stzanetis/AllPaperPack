# AllPaperPack

AllPaperPack frontend website using React with TypeScript, Vite and TailwindCSS

## Differnces from the Deliverables 1 & 2

### **New Table Features**

1. Added a default VAT value to the `products` table set at 24%
2. Added a `color` value to the `tags` table to differentiate them better
3. Added `created_at` timestamps to `orders` table to work better with supabase

### **Advanced Features**

In addition to RLS policies, custom functions where added to synchronize the `users` table with supabase users used to handle secure login.
Note that some RLS policies may be incomplete as security was not a priority for this deliverable

## Setup Guide

### **Prerequisites**

- Node.js (v18+)
- npm or yarn
- Git
- Supabase account

### **Step 1: Install Dependencies**

You can either clone the GitHub reposity containing the web app code or use the one in the deliverable.
If you want to use the GitHub code, make sure to test the `Databases` branch

```bash
git clone https://github.com/stzanetis/AllPaperPack.git
cd AllPaperPack
git switch Databases
```

After traversing to the project's directory, just install all necessary dependancies

```bash
npm install
```

### **Step 2: Supabase Setup**

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for project initialization
3. Copy the entire contents of `database/allpaperpackdb_V2.sql` to the SQL editor and execute the script
4. Execute all `*_rows` files from the supabase SQL editor to add more data to the database
5. Copy the `.env.local` file containing the database URL and public key by pressing on supabase:
    1. Connect
    2. App Frameworks -> Framework: React, Using: Vite, With: Supabase-js
6. Make sure the variable names match the names in `src/lib/supabase/client.ts`

### **Step 3: Start Development Server**

Start a developemnt server for the web app by running:

```bash
npm run dev
```

Alternatively, you can access an up-to-date version of the site at [allpaperpack.onrender.com](https://allpaperpack.onrender.com).

## Important Info

Authentication in the database with creating new users works differently in supabase, since the platform generates its own users tables in its auth schema. For this reason a trigger function is used to sunchronize supabase's users table with the custom database's users table. This is why authentication can't be made with the mock users. There are two solutions for this problem:

- Create a new user via the login page (authentication is required)
- If you plan to use the existing database hosted in supabase, use these pre-existin accounts for evaluation:
  - **E-mail**: `admin@allpaperpack.com`         **Password**: `secretpassword`
  - **E-mail**: `order.manager@allpaperpack.com` **Password**: `secretpassword`
  - **E-mail**: `customer@allpaperpack.com`      **Password**: `secretpassword`
