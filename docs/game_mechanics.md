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
- Costs 1 hero swap token.
- Swaps **star level** between the two heroes.
- Swaps all **hero-specific shards** to the new hero (with type conversion).
- When a 5-star hero (e.g., Murphy) is swapped with a 3-star hero (Sarah):
  - Murphy drops to 3-star → skill medal cap drops → excess medals returned.
  - Sarah rises to 5-star.

### Wall-of-Honor Requirement
- Sarah needs **at least 150 Wall-of-Honor levels** before promotion.
- Wall-of-Honor is where you invest extra shards after reaching 5 stars.
- This ensures enough shards are returned post-promotion to rebuild the final
  hero (Sarah or the swap target) back to 5 stars.
- Sarah (SSR) requires **2x as many shards** to reach 5 stars compared to a
  natural-UR hero, so either path yields enough shards to rebuild.

## The Optimal Sequence — With Swap Token

1. **Pre-promotion prep**: Max Sarah's skill medals. Ensure 150+ Wall-of-Honor.
2. **Promote Sarah to UR**: She becomes 3-star UR. Medals + shards returned
   to mailbox.
3. **Pick up returned medals + shards** from Sarah's promotion (picked up
   together). Do this BEFORE the swap so shards participate in the conversion.
4. **Max skill medals on the swap target hero**: Use some of Sarah's returned
   medals if needed to ensure the target hero's medals are fully maxed before
   swapping.
5. **Hero swap** the target hero (5-star, maxed medals) with Sarah (3-star):
   - Target hero drops to 3-star → skill medal cap drops → excess medals
     returned.
   - Sarah's SSR shards convert 2:1 to target hero's UR shards (higher value).
   - Sarah rises to 5-star.
6. **Re-apply** the medals returned from the swapped hero for more VS points.
7. **Use returned UR shards** to rebuild the target hero back to 5 stars.

## The Sequence — Without Swap Token (0 tokens)

1. **Pre-promotion prep**: Max Sarah's skill medals. Ensure 150+ Wall-of-Honor.
2. **Promote Sarah to UR**: She becomes 3-star UR. Medals + shards returned.
3. **Pick up returned medals + shards**: Re-apply medals to any hero for VS
   points. Use SSR shards to rebuild Sarah to 5 stars.

## Inputs → Guide Logic

- **Swap target hero** = the hero the user plans to stop using. This is the
  5-star natural-UR hero that will be swapped down to 3-star. Its purpose is
  to return its skill medals (so they can be re-applied elsewhere) and to
  convert Sarah's SSR shards into higher-value UR shards.
- **Swap tokens = 0**: Generate the short sequence (promote + re-apply only).
- **Swap tokens >= 1**: Generate the full sequence with swap.
- Any natural-UR 5-star hero can serve as the swap target.
