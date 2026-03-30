# CivicFIX

**Empowering communities through real-time civic accountability.**

CivicFIX is a premium, open-source platform designed to modernize civic engagement. It provides citizens with a seamless way to report local issues (like potholes, security concerns, or service outages) while empowering local authorities to track, manage, and resolve them in a transparent, real-time ecosystem.

## Key Features

- **Anonymous & Trackable Reporting**: Citizens can post reports anonymously and track progress using unique `CP-XXXXXX` Public IDs.
- **Dedicated Authority Portal**: A secure `/admin/dashboard` for civic leaders to view mentions, assign officials, and update report statuses.
- **Progressive Web App (PWA)** *(Experimental)*: Built-in offline capabilities are partially implemented. The app shell and data layer are designed to cache content via a Service Worker and `localStorage`, but offline behavior is not fully reliable due to limitations with Next.js App Router's server-side rendering and dynamic RSC payloads.
- **Full Internationalization (i18n)**: Native support for English, French, and Kinyarwanda, dynamically translatable across the entire interface.
- **Real-Time Sync**: Powered by WebSocket connections, updates to reports and internal notifications appear instantly without refreshing the page.
- **Rich Media Support**: Integrated cloud storage allows users to upload images and videos directly from their devices to document civic issues.

---

## Tech Stack

- **Frontend**: [Next.js 16](https://nextjs.org/) (App Router), React 19
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (modern aesthetics, dark mode, glassmorphism)
- **Database & Realtime**: [Supabase](https://supabase.com/) (PostgreSQL + Realtime WebSockets)
- **Authentication**: [Firebase Auth](https://firebase.google.com/docs/auth) (handling credential lifecycle) bridged to Supabase Profiles for row-level security.
- **Offline Storage**: Custom Service Worker (`sw.js`) combined with `localStorage` API caching.

---

## Local Setup Guide

Follow these steps to set up the CivicFIX development environment on your local machine.

### Prerequisites
- **Node.js**: v18.17 or higher
- **npm** or **pnpm** installed
- A [Firebase Console](https://console.firebase.google.com/) account
- A [Supabase Dashboard](https://supabase.com/dashboard) account

### 1. Clone & Install
Begin by cloning the repository and installing the necessary NPM dependencies:
```bash
git clone https://github.com/your-username/civicfix.git
cd civicfix
npm install
```

### 2. Configure Firebase (Authentication)
Firebase is used to securely manage user passwords and sessions.
1. Go to the [Firebase Console](https://console.firebase.google.com/) and click **Add Project**.
2. Once created, click the **Web icon (`</>`)** to register a new Web App. Copy the `firebaseConfig` variables.
3. In the left sidebar, navigate to **Build -> Authentication**.
4. Click **Get Started**, go to the **Sign-in method** tab, and explicitly enable the **Email/Password** provider.

### 3. Configure Supabase (Database & API)
Supabase handles the PostgreSQL database, real-time subscriptions, and file storage.
1. Go to the [Supabase Dashboard](https://supabase.com/dashboard) and create a **New Project**.
2. Once provisioned, navigate to **Project Settings -> API** to retrieve your `URL` and `anon public` key.

### 4. Environment Variables
Create a `.env` file in the root directory and populate it with your newly acquired credentials.

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="your_supabase_project_url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY="your_api_key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your_project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your_project_id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your_project.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
NEXT_PUBLIC_FIREBASE_APP_ID="your_app_id"
```

### 5. Database Initialization
You must set up the database schema for the application to function. In your Supabase Dashboard, open the **SQL Editor** and run the provided SQL scripts sequentially:

1. **`supabase_setup.sql`**: Creates the base schema, ENUM types, core tables, and sets up preliminary Row Level Security (RLS) policies.
2. **`update_reports_category.sql`**: Injects the `category` column into the `reports` table.
3. **`firebase_schema_update.sql`**: Alters the `profiles` table to drop the default UUID constraint in favor of syncing `firebase_uid` columns, bridging Firebase and Supabase.
4. **`enable_realtime.sql`**: Turns on the PostgreSQL logical replication for the tables, crucial for instant WebSocket updates.

### 6. Storage Bucket Configuration
For users to upload photos of potholes or broken pipes, the media bucket must be configured.
1. Go to **Storage** in your Supabase Dashboard.
2. Create a **New Bucket** strictly named **`content`** and set it to **Public**.
3. **Configure Access Policies**:
   - Create a policy for **SELECT** that grants `anon` (public) access.
   - Create a policy for **INSERT** that grants `anon` access so unauthenticated citizens can successfully upload media to their reports.

### 7. Run the Application
Start the Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. 

---

## Architecture Notes
- **Authentication Bridge**: When an official signs up, Firebase creates their Auth Record, and the frontend immediately pushes a corresponding `profile` record to Supabase, linking them via `firebase_uid`.
- **Progressive Web App (Experimental)**: The offline fallback is managed by `/public/sw.js`. The PWA implementation is currently **not fully functional** — while the Service Worker and `localStorage` data caching layers are in place, Next.js App Router's reliance on server-side rendering and dynamic RSC chunk requests means a truly seamless offline experience is not guaranteed. Hard reloads while offline may still redirect users to the landing page. For the best chance of offline functionality, first load the app online to populate the cache, then disconnect. Testing is best done via a production build (`npm run build && npm run start`).
- **Translations Store**: Modify `/src/store/translations.js` to change or add new languages.
