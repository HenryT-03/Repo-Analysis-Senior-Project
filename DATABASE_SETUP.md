# ⚠️ Database Setup Required

Your `.env` file has been created at `dashboard-backend/.env`. 

Before you can load demo data, you need a MySQL database running.

## Option 1: Install MySQL Locally (Recommended for Development)

### Windows:
1. Download from: https://dev.mysql.com/downloads/installer/
2. Run the installer and select "MySQL Server"
3. Configure to run on default port 3306
4. Create database: 
   ```bash
   mysql -u root -p
   > CREATE DATABASE repo_analysis;
   > EXIT;
   ```

### Mac (Homebrew):
```bash
brew install mysql
brew services start mysql
mysql -u root
> CREATE DATABASE repo_analysis;
```

### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install mysql-server
sudo mysql
> CREATE DATABASE repo_analysis;
```

## Option 2: Use MySQL via WSL (Windows Subsystem for Linux)

If you have WSL installed:

```bash
# In WSL terminal:
sudo apt update
sudo apt install mysql-server
sudo service mysql start

# Create database:
mysql -u root
> CREATE DATABASE repo_analysis;
```

Then update `.env`:
```env
DB_HOST=your_wsl_ip  # Usually 172.x.x.x - check with: ipconfig in PowerShell
DB_USER=root
DB_PASSWORD=
DB_NAME=repo_analysis
```

## Option 3: Cloud Database (Aiven)

Use the credentials from `.env.example` if you have Aiven MySQL set up:
```env
DB_HOST=your_instance.f2d6.c.aivencloud.com
DB_PORT=22580
DB_USER=avnadmin
DB_PASSWORD=your_password
DB_NAME=defaultdb
```

---

## Once MySQL is Running:

```bash
# Initialize schema
python init_db.py

# Load demo data
python test_setup.py

# Start backend
python app.py
```

Then go to http://localhost:5174 and view the TA page!

---

**Already have MySQL running?** 
→ Try running `python init_db.py` again and let me know the error.
