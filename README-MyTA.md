# MyTA: Phase 1 slice

## Install (PowerShell, in your project folder)
```powershell
cd $HOME\Documents\monster-agent-builder
Expand-Archive "$HOME\Downloads\myta-phase1.zip" -DestinationPath . -Force
npm install @dnd-kit/core
npm run dev
```
Open http://localhost:3000. Everything works with fake (mock) answers. No key needed.

## Push to GitHub, then Vercel deploys by itself
```powershell
git status          # .env.local must NOT appear in this list
git add .
git commit -m "MyTA phase 1"
git push
```
Open the Vercel link on your iPad. Add `?debug=1` to the end of the address to get the on-page console.

## Where Muse plugs in (all marked "MUSE: FILL IN")
| File | What to fill in |
|---|---|
| `.env.local` (and Vercel settings) | MUSE_BASE_URL, MUSE_MODEL, MUSE_API_KEY, then MODEL_MODE=muse and NEXT_PUBLIC_ENGINE=server |
| `src/lib/model.ts` | The ONE model call. Change only the marked block if Meta's request format differs (UNVERIFIED) |
| `src/blocks/handlers.ts` | web_search, recipe_sites, places_reviews: use Meta's search grounding recipe. vision_read already sends the picture |
| `src/agents/iconAgent.ts` | Icon agent for new monsters (needs an image-making model) |
| `src/agents/blockGenerator.ts` | Generate Block monster (stretch) |
| `src/guard/rules.ts` | Optional second-model review (`secondReview`) |

## Map of the project
- `src/events.ts` event and recipe types. `src/monsters/` monsters as data (art, tap areas, starter recipes).
- `src/blocks/registry.ts` every block as data. `handlers.ts` server code per brain block. `hands.ts` browser code per hand block.
- `src/engine/` mockEngine (fake), realEngine (server), client (browser side), promptBuilder, index (the one switch).
- `src/guard/rules.ts` plain-code Safety Guard. `src/memory/store.ts` browser memory. `src/ui/` screens, logo, theme.

## What is real vs mocked
Real: screens, drag and tap, on/off switches, puzzle-fit rule, memory with delete buttons, guard rules, server route, Zod validation, Share, .ics, Maps link.
Mocked: model answers, searches, and anything marked "(sample)". The icon agent and block generator say "not connected yet".

## iPad test checklist
1. Home shows 3 monsters. 2. Tap one: it grows, 4 tap areas + thought bubble. 3. Drag a block onto the right part (and tap one). 4. Switch a block off, Run: it is skipped. 5. Run: colors, icons, "May I?" screen. 6. Allow: share sheet opens. 7. Memory: save a note, delete it. 8. Rotate the iPad.
