# MySQL Service - Start Instructions

## Windows MySQL Service

Since you just installed MySQL, you need to start it. You have a few options:

### Option 1: Use MySQL Command Line (Easiest)

Open **Command Prompt** (or PowerShell) and run:

```bash
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql" -u root
```

You should see the MySQL prompt (`mysql>`). If so, create the database:

```sql
CREATE DATABASE repo_analysis;
EXIT;
```

Then in your project folder, run the setup scripts again:

```bash
cd dashboard-backend
python init_db.py
python test_setup.py
```

### Option 2: Use MySQL Workbench (GUI)

1. Open **MySQL Workbench** (installed with MySQL)
2. Click on "Local instance MySQL80"
3. Create a new SQL script and run:
   ```sql
   CREATE DATABASE repo_analysis;
   ```
4. Then run the Python scripts as shown above

### Option 3: Start Service (Admin Needed)

**Option 3A:** Open PowerShell **as Administrator** and run:

```powershell
net start MySQL80
```

Then follow Option 1 above.

**Option 3B:** Use Services GUI:

1. Press `Win + R`, type `services.msc`, hit Enter
2. Find **"MySQL80"** in the list
3. Right-click → **Start**
4. Then follow Option 1 above

---

Once MySQL is running and the database is created, run:

```bash
python init_db.py      # Creates tables
python test_setup.py   # Loads demo data
```

Let me know once you have MySQL running!
