# Plugin Routing Strategy

Routing is intentionally **index-first** to keep plugin selection fast and deterministic.

## Candidate Selection Flow

1. Load `plugins/<plugin>/commands/index.json` or `plugins/<plugin>/agents/index.json`.
2. Score candidates using frontmatter metadata only (`intent`, `tags`, `risk`, `cost`).
3. Pick the highest-ranked candidate.
4. Load full markdown from disk **only for the selected candidate**.

## Stable Ranking Formula

Each candidate receives a deterministic score:

```text
score = (intent_match * 10) - (risk_penalty * 3) - (cost_penalty)
```

Where:

- `intent_match`: token overlap between user query and candidate `intent` + `tags`
- `risk_penalty`: `low=0`, `medium=1`, `high=2`
- `cost_penalty`: `low=0`, `medium=1`, `high=2`

### Tie-Breaking

When scores are equal:

1. Keep stable sort order from index generation (alphabetical by file path).
2. Prefer lower `risk`.
3. Prefer lower `cost`.

This keeps routing reproducible across runs and CI environments.
