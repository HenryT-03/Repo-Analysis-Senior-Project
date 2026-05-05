-- AI individual contributor scores
CREATE TABLE IF NOT EXISTS ai_scores (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    repo_id        INT NOT NULL,           -- matches repos.gitlab_id
    author_email   VARCHAR(255) NOT NULL,
    total_score    INT NOT NULL DEFAULT 0, -- 0-100
    dimension_json TEXT,                  -- {"commit_volume":{...}, ...}
    flags_json     TEXT,                  -- ["flag1", ...]
    summary        TEXT,
    analysed_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_repo_email (repo_id, author_email),
    INDEX idx_repo (repo_id),
    INDEX idx_score (total_score)
);

-- AI team-level scores (one row per repo)
CREATE TABLE IF NOT EXISTS ai_team_scores (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    repo_id             INT NOT NULL UNIQUE,  -- matches repos.gitlab_id
    team_score          INT NOT NULL DEFAULT 0,
    member_scores_json  TEXT,   -- [{"email":"...", "score": 80}, ...]
    flags_json          TEXT,
    summary             TEXT,
    analysed_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_repo (repo_id),
    INDEX idx_team_score (team_score)
);