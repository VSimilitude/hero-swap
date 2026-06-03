# Hero Swap VS Points Guide — Tool Spec (Season 4)

## Purpose

A simple guide generator. The user provides a small number of inputs; the tool
emits an ordered, step-by-step text guide for executing the Sarah UR-promotion →
hero-swap chain to maximize VS points. No game state is read or written — the
tool only produces instructions.

## Scope (PoC)

- Pure input → text output. The user names their own heroes; the tool does not
  read game state or infer EW levels.
- The generated guide is **fully unrolled** — every swap is its own explicit,
  named step. No "repeat for each hero" loops in the output.
- All actions assumed to occur on **hero day (Thursday)** — stated once as a
  global note, not gated per step.
- Wall-of-Honor minimum is a **precondition note** on the prep step, not a
  validated input.

## Inputs

| Input | Type | Notes |
|---|---|---|
| `swap_tokens` | int ≥ 0 | Number of hero swaps available = number of swap slots. |
| `retiring_heroes` | list[str] | Ordered, optional, may be empty. Natural-UR heroes the user is done using. |
| `top_ew_heroes` | list[str] | Ordered (highest EW first), optional. Natural-UR heroes to backfill remaining slots. |

All named heroes are assumed to be maxed natural-UR 5★. EW (exclusive weapon)
raises the 5★ skill-medal cap, so higher-EW heroes return more medals on the
drop to 3★ — hence `top_ew_heroes` is ordered highest-first.

**Building the target list** (when `swap_tokens ≥ 1`):
1. Take `retiring_heroes` in order.
2. Then `top_ew_heroes` in order, skipping any already in the list.
3. Truncate to `swap_tokens`:
   `targets = dedupe(retiring_heroes + top_ew_heroes)[:swap_tokens]`

Order within the chain doesn't affect value (the SSR→UR conversion lands on
whichever hero is swap #1 regardless), so this simple priority is purely about
which heroes get used, not sequencing.

## Fixed Facts the Logic Relies On

- **All swap targets are natural-UR 5★ heroes.** Sarah is the only non-natural
  piece, and only as the starting point (SSR → promoted to UR in step 1). Never
  swap a previously-converted hero back in.
- A hero swap **exchanges star levels** between the two heroes and **moves all
  hero-specific shards onto the hero that ends at the lower star level** (the
  one dropping to 3★).
- The 3★ status + the shards travel together down the chain as a "hot potato."
  Each swap: the incoming 3★ hero (carrying shards) jumps to 5★; the maxed 5★
  target drops to 3★, inherits the shards, and returns its excess skill medals.
- **Shard conversion happens once, on swap #1:** Sarah's SSR shards convert
  **2:1** into UR shards (e.g. 2,000 SSR → 1,000 UR). UR shards are worth
  25,000 pts vs 8,750 for SSR — net +43% despite the 2:1 ratio. Every later
  swap is UR → UR (1:1).
- The **final hero in the chain** stays at 3★ and is rebuilt to 5★ manually
  using the inherited UR shards. (Minor WoH overflow may also land here — not
  worth optimizing.)
- Every hero in the chain ends at 5★.

## Output Logic

### Global note (printed first, always)
> Do all of this on **hero day (Thursday)** so the medal/shard applications
> score for VS points.

### Case A — `swap_tokens == 0`

1. **Prep Sarah.** Max Sarah's skill medals and shards before promotion.
   *(Precondition: Sarah needs 150+ Wall-of-Honor levels so enough shards are
   returned to rebuild her to 5★ afterward.)*
2. **Promote Sarah to UR.** She becomes 3★ UR. All skill medals and most shards
   are returned to the mailbox.
3. **Pick up the returned medals + shards.** Re-apply the skill medals to any
   hero for VS points. Use the returned SSR shards to rebuild Sarah back to 5★.

### Case B — `swap_tokens ≥ 1`

Build `targets` as above, then emit the steps fully unrolled — one numbered step
per action, naming the actual hero each time. The generator walks the chain and
tracks `carrier` = the hero currently holding the shards (starts as Sarah).

**Fixed opening steps:**

1. **Prep Sarah.** Max Sarah's skill medals before promotion.
   *(Precondition: Sarah needs 150+ Wall-of-Honor levels so enough shards are
   returned to rebuild a hero to 5★ afterward.)*
2. **Promote Sarah to UR.** She becomes 3★ UR. Medals + shards returned to
   the mailbox.
3. **Pick up the returned medals + shards together — before any swap** so the
   shards sit on Sarah and participate in the conversion. `carrier = Sarah`.

**Then, for each target in order, emit two explicit steps** (the generator
unrolls these by name — no loop shown to the user):

- *Max `target`'s skill medals* before swapping, so its drop returns the most.
- *Swap `carrier` (3★) with `target` (5★).* `carrier` → 5★ (done); `target` →
  3★, inherits the shards, returns its excess medals to the mailbox.
  - On the **first** swap the shards convert **SSR → UR, 2:1**.
  - On every later swap the transfer is **UR → UR, 1:1**.
  - Then set `carrier = target`.

**Fixed closing steps:**

- **Rebuild the final hero.** `carrier` is still 3★ and holds all the inherited
  UR shards — use them to rebuild it to 5★.
- **Apply all returned skill medals.** Apply every medal returned across the
  chain (Sarah's promotion + each target's drop) to any heroes you like for VS
  points.

#### Worked example — `swap_tokens = 2`, `targets = [Murphy, Gordon]`

1. Prep Sarah: max her skill medals. *(150+ Wall-of-Honor required.)*
2. Promote Sarah to UR → 3★ UR; medals + shards returned to mailbox.
3. Pick up the returned medals + shards (before swapping).
4. Max Murphy's skill medals.
5. Swap Sarah (3★) ⇄ Murphy (5★): Sarah → 5★; Murphy → 3★, inherits Sarah's
   shards (**SSR → UR, 2:1**), returns excess medals to mailbox.
6. Max Gordon's skill medals.
7. Swap Murphy (3★) ⇄ Gordon (5★): Murphy → 5★; Gordon → 3★, inherits the
   shards (**UR → UR, 1:1**), returns excess medals to mailbox.
8. Rebuild Gordon: he's still 3★ — use the inherited UR shards to bring him to 5★.
9. Apply all returned skill medals (from Sarah, Murphy, and Gordon) to any
   heroes for VS points.

### Surplus / edge handling
- More named heroes than tokens (`len(dedupe(retiring + ew)) > swap_tokens`):
  use the first `swap_tokens` after dedupe; tell the user which named heroes
  won't fit this season's token budget.
- Fewer named heroes than tokens: build the chain with what's given and note
  that the user has unused tokens — they can name more heroes to fill them.
- Same hero in both lists: deduplicate (retiree position wins).
- `swap_tokens` negative or non-int: reject with a clear message.

## Corrections to fold back into the mechanics doc

A few items in the current mechanics doc are now superseded:
- Drop any "special slot 1" framing — **all** targets are natural-UR; there's no
  privileged first slot beyond it being the swap where the SSR→UR conversion
  occurs.
- Make the shard cascade explicit: shards ride with the 3★ hero through *every*
  swap and land on the final hero — it's not a "medals-only follow-up."
- Note the conversion is 2:1 on swap #1 only; subsequent swaps are 1:1 UR→UR.

## Open / deferred (not in PoC)

- Auto-ordering EW heroes by actual EW level (user currently supplies the order
  manually as `top_ew_heroes`).
- Validating that a named target is in fact a maxed natural-UR 5★.
- Estimating total VS points from medal/shard counts.
