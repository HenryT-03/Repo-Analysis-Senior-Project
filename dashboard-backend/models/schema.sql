-- Users (authenticated via Microsoft, linked to GitLab by username)
CREATE TABLE IF NOT EXISTS users (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    microsoft_id VARCHAR(255) UNIQUE NOT NULL,
    email        VARCHAR(255) UNIQUE NOT NULL,
    name         VARCHAR(255),
    role         ENUM('student', 'ta', 'instructor') DEFAULT 'student',
    gitlab_username VARCHAR(255),
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- GitLab repos being tracked
CREATE TABLE IF NOT EXISTS repos (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    gitlab_id   INT UNIQUE NOT NULL,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    namespace   VARCHAR(255),
    url         VARCHAR(500),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Individual commits synced from GitLab
CREATE TABLE IF NOT EXISTS commits (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    sha          VARCHAR(40) UNIQUE NOT NULL,
    repo_id      INT NOT NULL,
    author_name  VARCHAR(255),
    author_email VARCHAR(255),
    message      TEXT,
    additions    INT DEFAULT 0,
    deletions    INT DEFAULT 0,
    branch       VARCHAR(255),       -- branch the commit was pushed to
    committed_at DATETIME,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (repo_id) REFERENCES repos(id) ON DELETE CASCADE,
    INDEX idx_repo_author (repo_id, author_email),
    INDEX idx_committed_at (committed_at)
);

-- AI detection results per commit
CREATE TABLE IF NOT EXISTS ai_analysis (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    commit_id  INT UNIQUE NOT NULL,
    score      INT NOT NULL DEFAULT 0,   -- 0–100, higher = more likely AI
    flagged    BOOLEAN DEFAULT FALSE,    -- score >= threshold
    reasons    TEXT,                     -- comma-separated list of triggered heuristics
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (commit_id) REFERENCES commits(id) ON DELETE CASCADE,
    INDEX idx_flagged (flagged),
    INDEX idx_score (score)
);

-- Optional: track which repos are assigned to which students
CREATE TABLE IF NOT EXISTS repo_assignments (
    id       INT AUTO_INCREMENT PRIMARY KEY,
    repo_id  INT NOT NULL,
    user_id  INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_repo_user (repo_id, user_id),
    FOREIGN KEY (repo_id) REFERENCES repos(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);