# Quick Start: Testing with Demo Data

This guide walks you through setting up and viewing real backend data in the TA dashboard.

## Prerequisites

- Backend running on `http://localhost:5000`
- Frontend running on `http://localhost:5174`
- MySQL database configured in `.env`

## Setup Steps

### 1. Initialize the Database Schema

```bash
cd dashboard-backend
python init_db.py
```

This creates all necessary tables (repos, commits, users, etc.) in your MySQL database.

### 2. Populate Demo Data

```bash
python test_setup.py
```

This creates:
- ✅ 1 demo repository ("demo-repo")
- ✅ 12 demo students (3 teams)
- ✅ ~60 demo commits across all students

You should see output like:
```
🚀 Setting up demo data for testing...

✓ Created demo repository with ID: 1
✓ Created/updated 12 student users
✓ Created 60 demo commits

📊 Database Summary:
  Users: 12
  Repos: 1
  Commits: 60

✅ Demo data setup complete!
```

### 3. View Demo Data in Frontend

1. Open browser: `http://localhost:5174`
2. Navigate to **TA Page** (click TA link in sidebar)
3. **Repository Dropdown**: Should show "demo-repo"
4. Select **"demo-repo"** from the dropdown
5. **Real data displays** with all student statistics and commit data!

## What You'll See

The TA page will display:

| Feature | Source |
|---------|--------|
| Student List | Live from database |
| Commit Counts | Aggregated from commits table |
| Commit Activity Graph | Real commit timestamps |
| Group Filtering | Works with backend data |
| Search | Searches live student data |

## Verify Backend is Working

Test the API endpoints:

```bash
# List repos
curl http://localhost:5000/gitlab/repos

# Get stats for repo 1
curl http://localhost:5000/gitlab/repos/1/stats

# List commits for repo 1
curl http://localhost:5000/gitlab/repos/1/commits
```

## Reset Demo Data

To clear and start fresh:

```bash
python init_db.py    # Re-creates empty schema
python test_setup.py # Re-populates demo data
```

## Troubleshooting

**"Connection refused" error**
- Make sure backend is running: `python app.py` from `dashboard-backend`
- Check MySQL is accessible with credentials in `.env`

**"ModuleNotFoundError: No module named 'db'"**
- Make sure you're in the `dashboard-backend` directory
- Activate venv: `.\venv\Scripts\activate`

**"Table already exists" warning**
- Use `IF NOT EXISTS` clauses (already in schema.sql)
- Safe to re-run `init_db.py` multiple times

**No data showing in frontend**
- Refresh the page (Ctrl+R)
- Check browser console for errors
- Make sure repo is selected in dropdown
- Verify backend returned data: `curl http://localhost:5000/gitlab/repos`

## Next Steps

Once demo data is working:

1. **Add Real GitLab Data**: Register an actual GitLab repo via the backend
2. **Test Filtering**: Try different teams and search terms
3. **Verify Roles**: Test TA vs Student access (if auth implemented)
4. **Check Performance**: Monitor database queries as data grows

---

**Have questions?** Check `BACKEND_SETUP.md` or `INTEGRATION_GUIDE.md` for more details.
