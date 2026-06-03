# Implementation Plan

## Stack
- **PyScript** (Python running in-browser via Pyodide/WASM)
- Static HTML/CSS/JS hosted on **GitHub Pages**
- All logic in `main.py`

## User Inputs (v1)
1. **Hero swap tokens** — integer (0+)
2. **Hero you plan to stop using** — single hero name (text input, optional?)

## Output
A numbered, step-by-step text guide customized to the user's inputs.

## Guide Generation Logic

### Case: 0 swap tokens
- Steps cover only Sarah's UR promotion and re-applying returned medals/shards.
- No swap occurs, so shards stay as SSR (lower value).
- Shards are used to rebuild Sarah to 5 stars.

### Case: 1+ swap tokens, with a hero to stop using
- Full strategy: promote Sarah → pick up medals + shards → max medals on swap
  target → swap the retiring hero with Sarah → re-apply returned medals →
  rebuild target hero with converted UR shards.
- The retiring hero is the 5-star swap donor. It ends up at 3 stars, and its
  excess medals are returned for re-application.
- Important: medals from Sarah's promotion may be needed to max the swap
  target's medals before performing the swap.

## File Structure
```
hero_swap/
├── index.html          # Page shell, loads PyScript + main.py
├── style.css           # Styling
├── main.py             # All logic: input handling, guide generation, display
└── docs/
    ├── game_mechanics.md
    └── implementation_plan.md
```

## Implementation Steps
1. Build the input form (PyScript DOM manipulation)
2. Write the guide-generation function (pure Python, returns list of step strings)
3. Wire form submission to guide generation and display
4. Style the output for readability
5. Test locally, then set up GitHub Pages deployment

## Future Enhancements (not v1)
- More inputs (hero levels, medal counts, shard counts)
- Point total calculations
- Multiple swap token strategies
- Hero database / dropdown selection
