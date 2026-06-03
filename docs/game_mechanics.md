# Hero Swap VS Points Strategy — Season 4

## Overview

This guide maximizes VS points by chaining together Sarah's
one-time UR promotion with a hero swap to generate large amounts of returnable
skill medals and hero shards, which can then be re-applied for VS points.

## Key Concepts

### Sarah's UR Promotion (one-time, Season 4)
- Sarah can be promoted from SSR to UR once this season.
- On promotion she becomes a **3-star UR** hero.
- All of her **skill medals** are returned.
- Most of her **hero shards** are returned.
- The returned medals and shards sit in a mailbox/inbox — you choose **when** to
  pick them up. The timing of pickup determines whether the shards participate
  in a subsequent hero swap.

### Skill Medals
- Returned medals can be re-applied to **any** hero for VS points.
- A hero's skill medal capacity is tied to their **star level** — a 3-star hero
  has a much lower cap than a 5-star hero.
- When a hero's star level drops (e.g., via swap), excess medals beyond the new
  cap are returned.

### Hero Shards
- Shards returned from Sarah's promotion are **SSR shards**, specific to Sarah.
- SSR shards are worth **8,750 VS points per shard**.
- Natural-UR hero shards are worth **25,000 VS points per shard**.
- When hero-swapping, Sarah's SSR shards convert **2:1** into the target hero's
  UR shards (e.g., 2,000 Sarah shards → 1,000 Murphy shards).
- Despite the 2:1 ratio, converting is more valuable:
  - 2,000 SSR shards × 8,750 = **17,500,000 points**
  - 1,000 UR shards × 25,000 = **25,000,000 points** (+43%)

### Hero Swap Mechanics
- Costs 1 hero swap token per swap.
- Swaps **star level** between the two heroes.
- All **hero-specific shards move to the hero that drops to 3-star** (with type
  conversion if needed).
- The 3-star status + shards travel together as a "hot potato" through each
  swap in a chain.
- **Shard conversion on swap #1 only:** Sarah's SSR shards convert **2:1** into
  UR shards. Every subsequent swap is **UR → UR (1:1)** — no further conversion.
- When a 5-star hero is swapped with a 3-star hero:
  - The 5-star hero drops to 3-star → skill medal cap drops → excess medals
    returned. It inherits the shards.
  - The 3-star hero rises to 5-star (done for the chain).

### Wall-of-Honor Requirement
- Sarah needs **at least 150 Wall-of-Honor levels** before promotion.
- Wall-of-Honor is where you invest extra shards after reaching 5 stars.
- This ensures enough shards are returned post-promotion to rebuild the final
  hero (Sarah or the swap target) back to 5 stars.
- Sarah (SSR) requires **2x as many shards** to reach 5 stars compared to a
  natural-UR hero, so either path yields enough shards to rebuild.

## The Optimal Sequence — With Swap Token(s)

**Opening (always the same):**
1. **Pre-promotion prep**: Max Sarah's skill medals. Ensure 150+ Wall-of-Honor.
2. **Promote Sarah to UR**: She becomes 3-star UR. Medals + shards returned
   to mailbox.
3. **Pick up returned medals + shards** (picked up together). Do this BEFORE
   any swap so shards participate in the conversion.

**For each swap target (fully unrolled in the guide):**
4. **Max skill medals on the target hero**: Use some of the returned medals if
   needed to ensure the target's medals are fully maxed before swapping.
5. **Hero swap** the current 3-star carrier with the target (5-star, maxed):
   - Target drops to 3-star → skill medal cap drops → excess medals returned.
     It inherits the shards.
   - On swap #1: Sarah's SSR shards convert 2:1 to UR shards.
   - On later swaps: UR → UR, 1:1 (no conversion).
   - The carrier rises to 5-star (done).

**Closing (always the same):**
6. **Rebuild the final hero**: The last hero in the chain is still 3-star —
   use the inherited UR shards to bring it back to 5 stars.
7. **Apply all remaining returned skill medals** (from Sarah + every target)
   to any heroes for VS points.

## The Sequence — Without Swap Token (0 tokens)

1. **Pre-promotion prep**: Max Sarah's skill medals. Ensure 150+ Wall-of-Honor.
2. **Promote Sarah to UR**: She becomes 3-star UR. Medals + shards returned.
3. **Pick up returned medals + shards**: Re-apply medals to any hero for VS
   points. Use SSR shards to rebuild Sarah to 5 stars.

## Inputs → Guide Logic

- **`swap_tokens`** (int >= 0): Number of swaps available = length of the chain.
- **`retiring_heroes`** (list, ordered): Natural-UR 5-star heroes the user is
  done using. These get priority in the swap chain.
- **`top_ew_heroes`** (list, ordered highest EW first): Natural-UR 5-star heroes
  to backfill remaining swap slots. Higher-EW heroes return more medals on the
  drop to 3-star, so ordering matters.
- **Target list**: `dedupe(retiring_heroes + top_ew_heroes)[:swap_tokens]`
- **Swap tokens = 0**: Generate the short sequence (promote + re-apply only).
- **Swap tokens >= 1**: Generate the full chain. All targets must be natural-UR
  5-star heroes. Every hero in the chain ends at 5-star.
