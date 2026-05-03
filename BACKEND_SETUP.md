# Backend Setup Guide

## Prerequisites
- Python 3.8 or newer
- pip (comes with Python)
- A MySQL database (Aiven or local)
- GitLab personal access token (optional for testing)
- Microsoft Azure AD credentials (optional for authentication)

## Quick Start

### Windows
```
cd dashboard-backend
run.bat
```

### Linux/Mac
```
cd dashboard-backend
bash run.sh
```

## Manual Setup (if scripts don't work)

### 1. Create and activate virtual environment

**Windows:**
```
python -m venv venv
venv\Scripts\activate.bat
```

**Linux/Mac:**
```
python3 -m venv venv
source venv/bin/activate
```

### 2. Install dependencies
```
pip install -r requirements.txt
```

### 3. Configure environment

Copy `.env.example` to `.env`:
```
cp .env.example .env
```

Edit `.env` and fill in your configuration:

#### Minimal Setup (for testing without auth):
```
SECRET_KEY=test-key-change-in-production
FRONTEND_URL=http://localhost:3000

# Optional for testing without database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=test_db
```

#### Full Setup (with auth and GitLab):
```
# Microsoft Auth
MS_CLIENT_ID=your_client_id
MS_CLIENT_SECRET=your_client_secret
TENANT_ID=common

# GitLab
GITLAB_URL=https://gitlab.com
GITLAB_TOKEN=your_personal_access_token

# Database
DB_HOST=your_db_host
DB_PORT=22580
DB_USER=avnadmin
DB_PASSWORD=your_password
DB_NAME=defaultdb
DB_SSL_CA=/path/to/ca.pem

# Other
SECRET_KEY=your-secret-key
FRONTEND_URL=http://localhost:3000
REDIRECT_URI=http://localhost:5000/auth/callback
```

### 4. Initialize database

Create the necessary tables. The app expects a database with the following tables:

- `users` - User accounts with roles
- `repos` - GitLab repositories being tracked
- `commits` - Commit data
- `issues` - Issue tracking data

You can create these via SQL or use an ORM migration tool. See `models/schema.sql` for the schema.

### 5. Run the backend

```
python app.py
```

The server will start on `http://localhost:5000`

You should see:
```
 * Serving Flask app 'app'
 * Debug mode: on
 * Running on http://127.0.0.1:5000
```

## Testing the Backend

### Health Check
```bash
curl http://localhost:5000/health
```

Should return: `{"status":"ok"}`

### Testing with Frontend
Make sure the frontend has the correct API URL configured in `.env.local`:

```
VITE_API_URL=http://localhost:5000
```

Then access the TA page at `http://localhost:3000/ta`

## Troubleshooting

### ModuleNotFoundError: No module named 'dotenv'
**Solution:** Activate the virtual environment first
```
venv\Scripts\activate.bat  # Windows
source venv/bin/activate   # Linux/Mac
```

### Database connection error
**Solution:** Check your `.env` file has correct DB credentials and the database is running

### CORS errors in browser
**Solution:** Make sure:
- Backend is running on port 5000
- Frontend is on port 3000
- `FRONTEND_URL` in backend `.env` matches frontend URL

### Port 5000 already in use
**Solution:** Either stop the other process or change the port in app.py:
```python
app.run(debug=True, port=5001)  # Use 5001 instead
```

Then update `VITE_API_URL` in frontend `.env.local` to match.

## Next Steps

1. Set up your database with the schema from `models/schema.sql`
2. Add your GitLab token to `.env`
3. Register a repository using the frontend
4. Sync commits from GitLab
5. View student stats in the TA page

## API Endpoints

- `GET /health` - Health check
- `GET /gitlab/repos` - List tracked repos
- `GET /gitlab/repos/{id}/stats` - Get student stats
- `GET /gitlab/repos/{id}/commits` - List commits  
- `POST /gitlab/repos/{id}/sync` - Sync commits

See `gitlab/routes.py` for complete API documentation.
