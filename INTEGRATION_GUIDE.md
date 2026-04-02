# Frontend-Backend Integration Setup

The TA page is now fully integrated with the backend API. Here's what you need to do:

## 1. Configure Backend URL

Create a `.env.local` file in `dashboard-frontend/dashboard-frontend/`:

```bash
VITE_API_URL=http://localhost:5000
```

Or copy from the example:
```bash
cp .env.local.example .env.local
```

## 2. Start the Backend

The backend should be running on port 5000 (or change the URL above):

```bash
cd dashboard-backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

## 3. Start the Frontend

```bash
cd dashboard-frontend/dashboard-frontend
npm install
npm run dev
```

Then navigate to `http://localhost:3000` in your browser.

## What's Connected

### API Service (`src/services/api.ts`)
- Authenticated HTTP client for backend communication
- Methods for: repos, student stats, commits, sync operations

### TA Page (`src/TAOverallPage.tsx`)

**New Features:**
- 📡 **Dynamic Repo Selection** - Fetches repos from backend (dropdown selector)
- 🔄 **Live Refresh** - "Refresh" button syncs commits from GitLab and updates stats
- 📊 **Real Data** - Displays actual student stats from database (falls back to mock data if API unavailable)
- ⚠️ **Error Handling** - Shows loading/error states gracefully
- 🔍 **Group Filtering** - Filter by team/group within selected repo

## API Endpoints Used

- `GET /gitlab/repos` - List all tracked repositories
- `GET /gitlab/repos/{id}/stats` - Get student statistics for a repo
- `POST /gitlab/repos/{id}/sync` - Sync commits from GitLab
- `GET /gitlab/repos/{id}/commits` - List commits

## Authentication

The frontend automatically includes auth tokens from localStorage in API requests.
Make sure you're logged in through the auth flow first.

## Fallback Behavior

If the backend is unavailable:
- Frontend uses mock data from the component
- Console shows warnings but UI remains functional
- This allows development/testing without backend

## Next Steps

1. Set up a repo in the backend
2. Sync commits from GitLab
3. Verify student stats appear in the TA page
4. Test group filtering and search
