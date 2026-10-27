# AI in the Research Process – workshop companion

Interactive companion for the workshop *Generative AI in Your Research* (4 November 2026, delivered by Hitachi Solutions). Postgraduate researchers rate AI use cases along the research process in two steps – research value first, technology second – and see the results of the whole room.

**Live:** https://mkern311.github.io/ai-research-companion/

## How it works

- `index.html` is a single static page (built from `src/` with `python3 build.py`). No framework, no external scripts.
- **Sign-in with a group code.** Each table gets its own code; a facilitator code can reset the workshop; a viewer code is read-only. Without a code the page runs in *explore* mode and keeps data in the browser only.
- **Data** lives in Supabase (project `ai-research-companion`, London). The public key in `config.json` can **only** call the RPC functions in `supabase/migrations/` – every table has RLS on, no policies and no grants for `anon`. Each function checks the code on the server; codes are stored as SHA-256 hashes.
- No personal data: the page stores ratings, workshop use cases and table findings only.

## Develop

```bash
python3 build.py          # writes index.html
python3 -m http.server    # open http://localhost:8000
```

Edit content in `src/data.js`, layout in `src/body.html` and `src/style.css`, behaviour in `src/app.js`. Deploy = push to `main` (GitHub Pages serves the repository root).

## Database

`supabase/migrations/20261027000000_init.sql` creates the tables and the RPC API:
`join_workshop`, `load_room`, `save_table`, `save_addition`, `delete_addition`, `reset_workshop`.
Workshops and codes are seeded separately (not in this repository).

---
Prof. Dr. Manuel Kern · Delivered by Hitachi Solutions · no product endorsement
