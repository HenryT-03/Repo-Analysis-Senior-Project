"""
Database initialization script.
Creates the necessary tables and populates demo data.

Usage:
  python init_db.py
"""

import os
import sys
from config import DB_CONFIG
import mysql.connector

def init_database():
    """Create database schema from schema.sql"""
    
    print("📋 Connecting to MySQL...")
    
    try:
        conn = mysql.connector.connect(
            host=DB_CONFIG.get("host"),
            user=DB_CONFIG.get("user"),
            password=DB_CONFIG.get("password"),
            database=DB_CONFIG.get("database"),
            port=DB_CONFIG.get("port", 3306)
        )
        cursor = conn.cursor()
        
        # Read and execute schema
        schema_path = os.path.join(os.path.dirname(__file__), "models", "schema.sql")
        
        print(f"📂 Reading schema from: {schema_path}")
        with open(schema_path, "r") as f:
            schema_sql = f.read()
        
        # Split by semicolon and execute each statement
        statements = [s.strip() for s in schema_sql.split(";") if s.strip()]
        
        print(f"🔧 Executing {len(statements)} schema statements...")
        for statement in statements:
            cursor.execute(statement)
        
        conn.commit()
        print("✅ Database schema created successfully!")
        
        cursor.close()
        conn.close()
        
    except mysql.connector.Error as err:
        print(f"❌ MySQL Error: {err}")
        sys.exit(1)
    except FileNotFoundError:
        print(f"❌ schema.sql not found at {schema_path}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    init_database()
