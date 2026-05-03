# Quick Setup for Demo Data

⚠️ **Database Configuration Required**

Before you can run the demo setup, you need to configure your database connection.

## Step 1: Create `.env` file

Copy `.env.example` and fill in your database details:

```bash
cp .env.example .env
```

Then edit `.env` and add your MySQL connection info:

```env
# Local MySQL (for testing)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=repo_analysis
DB_PORT=3306

# OR Aiven MySQL
DB_HOST=your-instance.f2d6.c.aivencloud.com
DB_USER=avnadmin
DB_PASSWORD=your_aiven_password
DB_NAME=defaultdb
DB_PORT=22580
DB_SSL_CA=/path/to/ca.pem
```

## Step 2: Initialize Database

```bash
python init_db.py
```

This creates the database schema.

## Step 3: Populate Demo Data  

```bash
python test_setup.py
```

This adds 12 students and 60 commits.

## Step 4: View in Frontend

1. Go to http://localhost:5174
2. Navigate to TA page
3. Select "demo-repo" from dropdown
4. See real data!

---

If you're using **local MySQL**:

```bash
# Option A: Local installation
# Windows: Download from https://dev.mysql.com/downloads/mysql/
# Mac: brew install mysql
# Linux: sudo apt install mysql-server

# Option B: Docker
docker run --name mysql -e MYSQL_ROOT_PASSWORD=password -p 3306:3306 mysql:8.0

# Then create the database
mysql -u root -p
> CREATE DATABASE repo_analysis;
```

If you need help, check the `.env.example` file for all available options.
