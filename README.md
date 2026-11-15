# ElderCare 360 -- Smart, Connected Elderly Care

**ElderCare 360** is a smart elderly-care platform designed to help
older adults manage everyday care while keeping family members and
caregivers informed. It brings medication tracking, caregiver
follow-ups, appointment information, and accessible voice assistance
into one connected experience.

> **Our vision:** No missed care, no unanswered alerts, and no elderly
> person left feeling alone.

## The Problem

Elderly people may need support with medication routines, appointments,
and day-to-day care. Family members and caregivers can find it difficult
to coordinate responsibilities, especially when they are not physically
together. A missed reminder or an unanswered request for help can go
unnoticed.

## Our Solution

ElderCare 360 aims to make care more coordinated and proactive through a
shared platform for elderly users, family members, and caregivers.

### Key Features

-   **Medication Management** -- View medication schedules and record
    medication actions such as Taken, Skip, Snooze, or Need Help.
-   **CareLoop -- Caregiver Follow-up** -- When a medication dose
    remains unconfirmed or help is requested, the workflow can create a
    caregiver follow-up task. Caregivers can acknowledge the task and
    record an outcome.
-   **Escalation Workflow** -- Unresolved follow-ups can be escalated to
    another nominated caregiver.
-   **Shared Care Timeline** -- Keep a chronological view of
    care-related events, acknowledgements, and resolutions.
-   **VoiceCare** -- A voice-oriented experience intended to make
    information and common actions easier to access, including
    multilingual support.
-   **Appointments** -- Organise and view doctor appointment
    information.
-   **Family and Caregiver Collaboration** -- Bring care
    responsibilities and updates into a shared experience.

*Feature availability depends on the current deployed build and
configured services. Browser speech recognition and speech synthesis
support varies by browser and device.*

## What Makes ElderCare 360 Different?

The central idea is **CareLoop**: a medication reminder should not
simply disappear when it is ignored. If a dose is not confirmed, the
system can turn that uncertainty into a follow-up for a caregiver. A
caregiver acknowledgement is kept separate from the medication outcome,
so acknowledging a task does not automatically mean the medicine was
taken.

This helps create a clearer, accountable care process instead of relying
only on reminders.

## Technology Stack

-   **Frontend:** React, TypeScript, Vite
-   **Styling:** Tailwind CSS
-   **Backend services:** Supabase
-   **Database:** PostgreSQL (Supabase)
-   **Authentication:** Supabase Auth
-   **Testing:** Vitest
-   **Code quality:** ESLint, SonarQube
-   **Version control:** Git and GitHub
-   **Deployment:** Render

## Architecture Overview

``` text
Elderly User / Family Member / Caregiver
                  |
                  v
          React + TypeScript UI
                  |
                  v
             Supabase Client
              /          \
             v            v
      Supabase Auth   PostgreSQL
                         |
                         v
              Care data and workflows
```

The frontend communicates with Supabase using the project URL and a
public client key. Database access should be protected by Row Level
Security (RLS) policies.

## Getting Started

### Prerequisites

-   Node.js (LTS recommended)
-   npm
-   A Supabase project

### 1. Clone the repository

``` bash
git clone https://github.com/Irin356/ElderCare.git
cd ElderCare
```

### 2. Install dependencies

``` bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root. Use the exact variable
names expected by `src/lib/supabase.ts` and `.env.example`.

Example:

``` env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
```

Do not add `/rest/v1/` to the Project URL. Use the base URL.

**Security:** Never put a Supabase service-role key or other secret key
in frontend environment variables, source code, or GitHub. Variables
prefixed with `VITE_` are exposed to the browser.

### 4. Set up the Supabase database

The project includes SQL migration files in `supabase/migrations/`.

Run the migrations in chronological order using the Supabase SQL Editor,
or apply them using the Supabase CLI if the project is configured for
it. Review the SQL and confirm that the tables, policies, functions, and
triggers are created successfully.

### 5. Configure Supabase Authentication

In the Supabase Dashboard:

1.  Enable the required sign-in provider (for example, Email).
2.  Configure the Site URL to your deployed application URL.
3.  Add the local development URL and deployed application URL to the
    allowed Redirect URLs.
4.  Configure email confirmation and email delivery settings according
    to your testing or production needs.

### 6. Run locally

``` bash
npm run dev
```

Vite normally serves the app at `http://localhost:5173`.

### 7. Run checks

Use the scripts available in `package.json`. Common project checks
include:

``` bash
npm run typecheck
npm run lint
npm run test
npm run build
```

If a script is not defined in your current `package.json`, use the
corresponding configured script or omit that check.

## Deployment

The frontend can be deployed as a **Render Static Site**.

Typical Render configuration for a Vite application:

-   **Branch:** `main`
-   **Build command:** `npm ci && npm run build`
-   **Publish directory:** `dist`

Add the required public Supabase environment variables in the Render
service's Environment settings, using the exact names expected by the
source code. Redeploy after changing build-time environment variables.

For client-side routing, configure a Render rewrite from `/*` to
`/index.html` if required by the router.

The Supabase database and authentication configuration are managed
separately in Supabase; deploying the frontend does not automatically
apply migrations or configure database security.

**Live Demo:** `https://eldercare-j2gy.onrender.com`{=html}\
**Source Code:** `https://github.com/Irin356/ElderCare.git`{=html}

## Privacy and Security Notes

-   Use Row Level Security to restrict access to each user's data and
    authorised care-circle members.
-   Do not expose service-role keys in the frontend.
-   Use test accounts and fictional data during demonstrations.
-   Do not enter real patient or sensitive health information into a
    hackathon demo unless the required privacy, consent, and security
    safeguards are in place.
-   Review authentication, access policies, and data handling before
    using the platform for real care.

## Current Scope and Limitations

ElderCare 360 is a hackathon project and should be treated as a
prototype until all workflows are tested end to end.

-   Confirm that Supabase authentication, database operations, and RLS
    policies work with separate test accounts and roles.
-   Verify that caregiver follow-ups and escalation behave correctly
    under real multi-user conditions.
-   Browser-based voice features depend on browser and device support.
    Reliable background or lock-screen reminders may require a native
    application and additional testing.
-   Email delivery, scheduled checks, and real-time notifications
    require their respective provider and server-side configuration;
    they should not be assumed to work merely because the frontend is
    deployed.

## Future Improvements

-   Reliable push notifications and scheduled medication checks.
-   More robust multilingual voice interaction and accessibility testing
    with older adults.
-   Secure caregiver invitations and granular care-circle permissions.
-   Refill reminders and improved appointment preparation.
-   Expanded audit history, monitoring, and end-to-end testing.

## Contributing

Contributions and feedback are welcome. For changes, create a focused
commit and include relevant tests where possible.

## Team

Built as a hackathon project.

------------------------------------------------------------------------

**ElderCare 360 -- Making elderly care more connected, proactive, and
compassionate.**

