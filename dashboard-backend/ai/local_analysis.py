import json
from statistics import mean

from db import DbCursor


def analyse_team_local(repo_id: int):
    with DbCursor() as cursor:
        cursor.execute(
            """
            SELECT
                author_name,
                author_email,
                COUNT(*) AS commit_count,
                SUM(additions) AS total_additions,
                SUM(deletions) AS total_deletions,
                SUM(is_merge) AS merge_count,
                GROUP_CONCAT(DISTINCT branch) AS branches
            FROM commits
            WHERE repo_id = %s
              AND author_email IS NOT NULL
              AND author_email != ''
            GROUP BY author_email, author_name
            ORDER BY commit_count DESC
            """,
            (repo_id,),
        )
        contributors = cursor.fetchall()

    if not contributors:
        return None

    individuals = []

    for c in contributors:
        commit_count = int(c["commit_count"] or 0)
        additions = int(c["total_additions"] or 0)
        deletions = int(c["total_deletions"] or 0)
        merge_count = int(c["merge_count"] or 0)
        branches = c["branches"].split(",") if c["branches"] else []

        score = 0

        if commit_count >= 8:
            score += 25
        elif commit_count >= 5:
            score += 18
        elif commit_count >= 2:
            score += 10
        elif commit_count == 1:
            score += 5

        changed_lines = additions + deletions
        if changed_lines >= 1000:
            score += 25
        elif changed_lines >= 200:
            score += 20
        elif changed_lines >= 50:
            score += 12
        elif changed_lines > 0:
            score += 6

        if merge_count >= 2:
            score += 20
        elif merge_count == 1:
            score += 12

        if "main" in branches or "master" in branches:
            score += 15
        elif len(branches) > 1:
            score += 8

        score += 15  # baseline: no integrity penalty without stronger evidence
        score = max(0, min(100, score))

        flags = []
        if commit_count <= 1:
            flags.append("Very low commit count")
        if changed_lines >= 5000 and commit_count <= 3:
            flags.append("Large code dump in few commits")
        if merge_count == 0:
            flags.append("No merge commits recorded")

        individuals.append({
            "repo_id": repo_id,
            "author_name": c["author_name"],
            "author_email": c["author_email"],
            "total_score": score,
            "flags": flags,
            "summary": (
                f"{c['author_name'] or c['author_email']} scored {score}/100 from "
                f"{commit_count} commits, +{additions}/-{deletions} lines, "
                f"{merge_count} merge commits."
            ),
            "raw_stats": {
                "commit_count": commit_count,
                "total_additions": additions,
                "total_deletions": deletions,
                "merge_count": merge_count,
                "branches": branches,
            },
        })

    team_score = round(mean([i["total_score"] for i in individuals]))

    team_flags = []
    scores = [i["total_score"] for i in individuals]
    if max(scores) - min(scores) >= 40:
        team_flags.append("Large contribution imbalance between team members")

    total_commits = sum(i["raw_stats"]["commit_count"] for i in individuals)
    total_additions = sum(i["raw_stats"]["total_additions"] for i in individuals)
    total_deletions = sum(i["raw_stats"]["total_deletions"] for i in individuals)

    team_summary = (
        f"Local analysis scored this repo {team_score}/100. "
        f"The team has {len(individuals)} contributors, {total_commits} commits, "
        f"+{total_additions}/-{total_deletions} changed lines. "
    )

    if team_flags:
        team_summary += "Concerns: " + "; ".join(team_flags) + "."
    else:
        team_summary += "No major team-level imbalance was detected."

    return {
        "team": {
            "repo_id": repo_id,
            "team_score": team_score,
            "member_scores": [
                {
                    "email": i["author_email"],
                    "name": i["author_name"],
                    "score": i["total_score"],
                }
                for i in individuals
            ],
            "team_flags": team_flags,
            "team_summary": team_summary,
            "source": "local",
        },
        "individuals": individuals,
    }


def persist_local_team_result(repo_id: int, result: dict):
    team = result["team"]

    with DbCursor() as cursor:
        cursor.execute(
            """
            INSERT INTO ai_team_scores
                (repo_id, team_score, member_scores_json,
                 flags_json, summary, analysed_at)
            VALUES (%s, %s, %s, %s, %s, NOW())
            ON DUPLICATE KEY UPDATE
                team_score = VALUES(team_score),
                member_scores_json = VALUES(member_scores_json),
                flags_json = VALUES(flags_json),
                summary = VALUES(summary),
                analysed_at = NOW()
            """,
            (
                repo_id,
                team["team_score"],
                json.dumps(team["member_scores"]),
                json.dumps(team["team_flags"]),
                team["team_summary"],
            ),
        )