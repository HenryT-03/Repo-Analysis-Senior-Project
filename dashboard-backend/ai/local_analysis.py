import json
from collections import Counter
from statistics import mean

from db import DbCursor
from ai.actions import (
    get_repo_contributor_summary,
    get_commit_message_batch,
    get_commit_time_distribution,
)


TRIVIAL_MESSAGES = {
    "update", "updates", "fix", "fixed", "bug fix", "changes",
    "commit", "initial commit", "test", "final", "done", "work",
}


def _score_commit_volume(commit_count: int) -> tuple[int, str]:
    if commit_count >= 8:
        return 25, f"{commit_count} commits; strong activity volume."
    if commit_count >= 5:
        return 18, f"{commit_count} commits; acceptable activity volume."
    if commit_count >= 2:
        return 10, f"{commit_count} commits; low but nonzero activity."
    if commit_count == 1:
        return 5, "Only 1 commit; very limited activity evidence."
    return 0, "No commits found."


def _score_code_contribution(additions: int, deletions: int) -> tuple[int, str]:
    changed = int(additions or 0) + int(deletions or 0)
    if changed >= 1000:
        return 25, f"{changed} total changed lines; substantial code movement."
    if changed >= 200:
        return 20, f"{changed} total changed lines; meaningful code movement."
    if changed >= 50:
        return 12, f"{changed} total changed lines; modest code movement."
    if changed > 0:
        return 6, f"{changed} total changed lines; minimal code movement."
    return 0, "No changed lines recorded."


def _message_quality(messages: list[dict]) -> tuple[int, list[str], dict]:
    if not messages:
        return 0, ["No commit messages available"], {
            "total_messages": 0,
            "trivial_count": 0,
            "duplicate_count": 0,
            "avg_length": 0,
        }

    cleaned = [(m.get("message") or "").strip().lower() for m in messages]

    counts = Counter(cleaned)
    duplicate_count = sum(c - 1 for c in counts.values() if c > 1)
    trivial_count = sum(1 for m in cleaned if m in TRIVIAL_MESSAGES or len(m) <= 5)
    avg_length = mean(len(m) for m in cleaned) if cleaned else 0

    penalty = 0
    flags = []

    trivial_ratio = trivial_count / len(cleaned)
    duplicate_ratio = duplicate_count / len(cleaned)

    if trivial_ratio >= 0.5:
        penalty += 12
        flags.append("High share of trivial commit messages")
    elif trivial_ratio >= 0.25:
        penalty += 6
        flags.append("Some trivial commit messages")

    if duplicate_ratio >= 0.4:
        penalty += 8
        flags.append("Repeated commit messages")
    elif duplicate_ratio >= 0.2:
        penalty += 4
        flags.append("Some repeated commit messages")

    if avg_length < 10:
        penalty += 5
        flags.append("Very short average commit message length")

    return max(0, 25 - penalty), flags, {
        "total_messages": len(cleaned),
        "trivial_count": trivial_count,
        "duplicate_count": duplicate_count,
        "avg_length": round(avg_length, 1),
    }


def _score_integrity(time_distribution: dict, messages: list[dict]) -> tuple[int, list[str], dict]:
    flags = []
    penalty = 0

    if time_distribution.get("suspicious_burst"):
        penalty += 12
        flags.append("Large share of commits occurred in a narrow time window")

    total_commits = time_distribution.get("total_commits", 0)
    distribution = time_distribution.get("distribution", [])

    if total_commits > 0 and len(distribution) <= 2 and total_commits >= 8:
        penalty += 8
        flags.append("Many commits concentrated into very few time buckets")

    sizes = [
        int(m.get("additions") or 0) + int(m.get("deletions") or 0)
        for m in messages
    ]

    huge_commits = sum(1 for s in sizes if s >= 1000)
    tiny_commits = sum(1 for s in sizes if s <= 3)

    if huge_commits >= 2:
        penalty += 6
        flags.append("Multiple very large commits")

    if messages and tiny_commits / len(messages) >= 0.5:
        penalty += 5
        flags.append("Many commits have tiny recorded changes")

    return max(0, 25 - penalty), flags, {
        "total_commits_in_distribution": total_commits,
        "huge_commits": huge_commits,
        "tiny_commits": tiny_commits,
    }


def analyse_contributor_local(
    repo_id: int,
    contributor: dict,
    start_date: str = None,
    end_date: str = None,
) -> dict:
    email = contributor["author_email"]

    messages = get_commit_message_batch(
        repo_id,
        email,
        limit=50,
        start_date=start_date,
        end_date=end_date,
    )

    time_distribution = get_commit_time_distribution(
        repo_id,
        email,
        start_date=start_date,
        end_date=end_date,
    )

    commit_volume_score, commit_volume_reason = _score_commit_volume(
        int(contributor.get("commit_count") or 0)
    )

    code_score, code_reason = _score_code_contribution(
        int(contributor.get("total_additions") or 0),
        int(contributor.get("total_deletions") or 0),
    )

    message_score, message_flags, message_stats = _message_quality(messages)
    integrity_score, integrity_flags, integrity_stats = _score_integrity(
        time_distribution,
        messages,
    )

    total = commit_volume_score + code_score + message_score + integrity_score
    flags = message_flags + integrity_flags

    return {
        "repo_id": repo_id,
        "author_name": contributor.get("author_name"),
        "author_email": email,
        "total_score": int(total),
        "dimensions": {
            "commit_volume": {
                "score": commit_volume_score,
                "rationale": commit_volume_reason,
            },
            "code_contribution": {
                "score": code_score,
                "rationale": code_reason,
            },
            "commit_quality": {
                "score": message_score,
                "rationale": (
                    f"{message_stats['total_messages']} messages; "
                    f"{message_stats['trivial_count']} trivial; "
                    f"{message_stats['duplicate_count']} duplicates; "
                    f"average length {message_stats['avg_length']} chars."
                ),
            },
            "integrity_patterns": {
                "score": integrity_score,
                "rationale": (
                    f"{integrity_stats['huge_commits']} huge commits; "
                    f"{integrity_stats['tiny_commits']} tiny commits; "
                    f"suspicious burst={bool(time_distribution.get('suspicious_burst'))}."
                ),
            },
        },
        "flags": flags,
        "raw_stats": {
            "commit_count": int(contributor.get("commit_count") or 0),
            "total_additions": int(contributor.get("total_additions") or 0),
            "total_deletions": int(contributor.get("total_deletions") or 0),
            "merge_count": int(contributor.get("merge_count") or 0),
            "branches": contributor.get("branches") or [],
            "message_stats": message_stats,
            "integrity_stats": integrity_stats,
        },
        "summary": _format_contributor_summary(contributor, total, flags),
    }


def _format_contributor_summary(contributor: dict, total: int, flags: list[str]) -> str:
    name = contributor.get("author_name") or contributor.get("author_email")
    flag_text = (
        " No major local-analysis flags."
        if not flags
        else " Flags: " + "; ".join(flags) + "."
    )

    return (
        f"{name}: local score {int(total)}/100 from "
        f"{contributor.get('commit_count', 0)} commits, "
        f"+{contributor.get('total_additions', 0)}/-{contributor.get('total_deletions', 0)} lines."
        f"{flag_text}"
    )


def analyse_team_local(
    repo_id: int,
    start_date: str = None,
    end_date: str = None,
) -> dict | None:
    contributors = get_repo_contributor_summary(
        repo_id,
        start_date=start_date,
        end_date=end_date,
    )

    if not contributors:
        return None

    individuals = [
        analyse_contributor_local(
            repo_id,
            c,
            start_date=start_date,
            end_date=end_date,
        )
        for c in contributors
    ]

    member_scores = [
        {
            "email": r["author_email"],
            "name": r.get("author_name"),
            "score": r["total_score"],
        }
        for r in individuals
    ]

    scores = [m["score"] for m in member_scores]
    team_score = round(mean(scores)) if scores else 0

    team_flags = []
    if scores and max(scores) - min(scores) >= 40:
        team_flags.append("Large contribution imbalance between team members")

    total_commits = sum(i["raw_stats"]["commit_count"] for i in individuals)
    total_additions = sum(i["raw_stats"]["total_additions"] for i in individuals)
    total_deletions = sum(i["raw_stats"]["total_deletions"] for i in individuals)
    all_flags = [flag for i in individuals for flag in i["flags"]]
    common_flags = Counter(all_flags).most_common(5)

    team_summary = (
        f"Local analysis scored this repo {team_score}/100. "
        f"The team has {len(individuals)} contributors, {total_commits} commits, "
        f"+{total_additions}/-{total_deletions} total changed lines. "
    )

    if start_date or end_date:
        team_summary += (
            f"Date range: {start_date or 'beginning'} to {end_date or 'present'}. "
        )

    if team_flags:
        team_summary += "Team-level concerns: " + "; ".join(team_flags) + ". "

    if common_flags:
        team_summary += "Most common contributor flags: " + "; ".join(
            f"{flag} ({count})" for flag, count in common_flags
        ) + "."
    else:
        team_summary += "No major local-analysis flags were found."

    return {
        "team": {
            "repo_id": repo_id,
            "team_score": team_score,
            "member_scores": member_scores,
            "team_flags": team_flags,
            "team_summary": team_summary,
            "source": "local",
            "date_range": {
                "start_date": start_date,
                "end_date": end_date,
            },
            "raw_stats": {
                "contributors": len(individuals),
                "total_commits": total_commits,
                "total_additions": total_additions,
                "total_deletions": total_deletions,
                "common_flags": common_flags,
            },
        },
        "individuals": individuals,
    }


def format_local_analysis_plain(result: dict) -> str:
    team = result["team"]

    lines = [
        "Local Analysis Summary",
        f"Repo ID: {team['repo_id']}",
        f"Team score: {team['team_score']}/100",
        "Source: deterministic local rules",
        "",
        team["team_summary"],
        "",
        "Members:",
    ]

    for person in result["individuals"]:
        lines.append(
            f"- {person.get('author_name') or person['author_email']}: "
            f"{person['total_score']}/100; "
            f"{person['raw_stats']['commit_count']} commits; "
            f"+{person['raw_stats']['total_additions']}/-{person['raw_stats']['total_deletions']} lines; "
            f"flags: {', '.join(person['flags']) if person['flags'] else 'none'}"
        )

    return "\n".join(lines)


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