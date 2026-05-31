# contextdb playground

Hosted kitchen-sink playground for contextdb. It demonstrates source credibility, contradiction tracking, agent memory, auditor workflows, DSL queries, and the current system-level acquisition/ranking surfaces.

## Run locally

This repo expects a sibling checkout of `contextdb` because `go.mod` uses:

```go
replace github.com/antiartificial/contextdb => ../contextdb
```

Start the backend:

```bash
go run . --dev --addr :8080
```

Start the frontend:

```bash
cd frontend
npm install
npm run dev
```

The default password is `contextdb`, or set `PLAYGROUND_PASSWORD`.

## Current surface

| Area | Status |
|:-----|:-------|
| Scenario explorer | Live |
| Newsroom source credibility and conflicts | Live |
| Agent memory decay and retrieval scoring | Live |
| Auditor narratives, belief diff, gaps, calibration, retraction, erasure, active learning | Live |
| Pipe/CQL DSL REPL with rerank syntax | Live |
| Acquisition dry-run preview | Live in the System tab |
| Acquisition receipts and retry recommendations | Live in the System tab |
| Explain-rank comparison | Live in the System tab |
| Full Svelte admin dashboard metrics/ranking/debugger | Lives in the main contextdb server on observe port `7702` |
| Release-health artifacts, schema catalog, closure bundle, ranking baseline verification | Lives in the main contextdb repo and docs |

## Notes

The playground is intentionally demo-first. It embeds contextdb in-process with seeded datasets. Production APIs, release-health workflows, docs, and the full admin dashboard live in [`antiartificial/contextdb`](https://github.com/antiartificial/contextdb).
