"""
Test setup script to populate the database with demo student data.
This helps test the TA dashboard without needing real GitLab data.

Usage:
  python test_setup.py
"""

import os
import sys
from datetime import datetime, timedelta
from db import DbCursor

# Demo students and teams
DEMO_STUDENTS = [
    {"name": "Thakker, Fioni", "email": "fioni@example.com", "gitlab_username": "fioni", "team": "5_mh_1", "role": "BE"},
    {"name": "Deshmukh, Deesha", "email": "ddeesha7@example.com", "gitlab_username": "ddeesha7", "team": "5_mh_1", "role": "BE"},
    {"name": "Alqahtani, Joud", "email": "joud@example.com", "gitlab_username": "joud", "team": "5_mh_1", "role": "FE"},
    {"name": "Almutairi, Mary", "email": "maryam1@example.com", "gitlab_username": "maryam1", "team": "5_mh_1", "role": "FE"},
    
    {"name": "Saengchanpher, Jaylens", "email": "jaylens@example.com", "gitlab_username": "jaylens", "team": "5_mh_2", "role": "FE"},
    {"name": "Steele, Isaiah V", "email": "vsteele@example.com", "gitlab_username": "vsteele", "team": "5_mh_2", "role": "BE"},
    {"name": "Bravo Garza, Andres", "email": "bgb@example.com", "gitlab_username": "bgb", "team": "5_mh_2", "role": "FE"},
    {"name": "Tomson, Troy T", "email": "troytom@example.com", "gitlab_username": "troytom", "team": "5_mh_2", "role": "BE"},
    
    {"name": "Fouts, Dustin R", "email": "drfouts@example.com", "gitlab_username": "drfouts", "team": "5_mh_3", "role": "BE"},
    {"name": "Garner, Quade", "email": "qmgarners@example.com", "gitlab_username": "qmgarners", "team": "5_mh_3", "role": "BE"},
    {"name": "Keister, Shea L", "email": "sdkeist@example.com", "gitlab_username": "sdkeist", "team": "5_mh_3", "role": "FE"},
    {"name": "Rayyan, Syed I", "email": "smrayyan@example.com", "gitlab_username": "smrayyan", "team": "5_mh_3", "role": "FE"},
]

DEMO_COMMITS = [
    # Generate commits for each student
    # Format: (author_email, author_name, message_prefix, count)
    ("fioni@example.com", "Thakker, Fioni", "Backend implementation", 5),
    ("ddeesha7@example.com", "Deshmukh, Deesha", "Database schema", 5),
    ("joud@example.com", "Alqahtani, Joud", "UI component", 2),
    ("maryam1@example.com", "Almutairi, Mary", "Frontend feature", 7),
    ("jaylens@example.com", "Saengchanpher, Jaylens", "React component", 5),
    ("vsteele@example.com", "Steele, Isaiah V", "API endpoint", 8),
    ("bgb@example.com", "Bravo Garza, Andres", "Merge PR", 5),
    ("troytom@example.com", "Tomson, Troy T", "Bug fix", 2),
    ("drfouts@example.com", "Fouts, Dustin R", "Feature development", 4),
    ("qmgarners@example.com", "Garner, Quade", "Code review", 7),
    ("sdkeist@example.com", "Keister, Shea L", "UI update", 1),
    ("smrayyan@example.com", "Rayyan, Syed I", "Testing", 2),
]

def create_demo_repo():
    """Create a demo repository."""
    with DbCursor() as cursor:
        cursor.execute(
            """
            INSERT INTO repos (gitlab_id, name, path, created_at, updated_at)
            VALUES (%s, %s, %s, NOW(), NOW())
            """,
            (1001, "demo-repo", "demo/repo"),
        )
        cursor.execute("SELECT LAST_INSERT_ID() as id")
        repo_id = cursor.fetchone()["id"]
    
    print(f"✓ Created demo repository with ID: {repo_id}")
    return repo_id

def create_users():
    """Create demo student users."""
    user_count = 0
    with DbCursor() as cursor:
        for student in DEMO_STUDENTS:
            try:
                cursor.execute(
                    """
                    INSERT INTO users (name, email, gitlab_username, team, role, created_at)
                    VALUES (%s, %s, %s, %s, %s, NOW())
                    ON DUPLICATE KEY UPDATE updated_at = NOW()
                    """,
                    (student["name"], student["email"], student["gitlab_username"], student["team"], student["role"]),
                )
                user_count += 1
            except Exception as e:
                print(f"  ⚠ Skipping {student['name']}: {str(e)[:50]}")
    
    print(f"✓ Created/updated {user_count} student users")

def create_commits(repo_id):
    """Create demo commits."""
    commit_count = 0
    base_date = datetime.now() - timedelta(days=30)
    
    with DbCursor() as cursor:
        for author_email, author_name, message_prefix, count in DEMO_COMMITS:
            for i in range(count):
                commit_date = base_date + timedelta(days=i, hours=i % 24)
                message = f"{message_prefix} #{i+1}"
                sha = f"{hash(author_email + message + str(i))%1000000:06x}"
                
                try:
                    cursor.execute(
                        """
                        INSERT INTO commits 
                        (repo_id, sha, author_email, author_name, message, committed_at, created_at)
                        VALUES (%s, %s, %s, %s, %s, %s, NOW())
                        """,
                        (repo_id, sha, author_email, author_name, message, commit_date),
                    )
                    commit_count += 1
                except Exception as e:
                    print(f"  ⚠ Skipping commit: {str(e)[:50]}")
    
    print(f"✓ Created {commit_count} demo commits")

def verify_data():
    """Verify the data was created."""
    with DbCursor() as cursor:
        cursor.execute("SELECT COUNT(*) as count FROM users")
        user_count = cursor.fetchone()["count"]
        
        cursor.execute("SELECT COUNT(*) as count FROM repos")
        repo_count = cursor.fetchone()["count"]
        
        cursor.execute("SELECT COUNT(*) as count FROM commits")
        commit_count = cursor.fetchone()["count"]
    
    print("\n📊 Database Summary:")
    print(f"  Users: {user_count}")
    print(f"  Repos: {repo_count}")
    print(f"  Commits: {commit_count}")

def main():
    print("🚀 Setting up demo data for testing...\n")
    
    try:
        # Create demo data
        repo_id = create_demo_repo()
        create_users()
        create_commits(repo_id)
        
        # Verify
        verify_data()
        
        print("\n✅ Demo data setup complete!")
        print(f"\n📋 To test on the frontend:")
        print(f"  1. Go to http://localhost:5174 (frontend)")
        print(f"  2. Navigate to the TA page")
        print(f"  3. Select 'demo-repo' from the repository dropdown")
        print(f"  4. Real student data will be displayed!")
        
    except Exception as e:
        print(f"\n❌ Error during setup: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
