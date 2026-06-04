#!/usr/bin/env python3
"""
Hero Swap VS Points Guide — PoC (Last War, Season 4)
 
Generates an ordered, fully-unrolled, step-by-step guide for the Sarah
UR-promotion -> hero-swap chain to maximize VS points.
 
See hero-swap-tool-spec.md for the full spec. This is a proof of concept:
pure input -> text output, no game state.
"""
 
import re
from typing import List, Tuple
 
 
def build_targets(
    swap_tokens: int,
    retiring_heroes: List[str],
    top_ew_heroes: List[str],
) -> Tuple[List[str], List[str]]:
    """
    Build the ordered swap-target list.
 
    Priority: retiring heroes first (in order), then top-EW heroes (in order),
    deduplicated (retiree position wins), truncated to swap_tokens.
 
    Returns (targets, dropped) where `dropped` are named heroes that did not
    fit within the token budget.
    """
    seen = set()
    ordered: List[str] = []
    for name in list(retiring_heroes) + list(top_ew_heroes):
        key = name.strip().lower()
        if not name.strip() or key in seen:
            continue
        seen.add(key)
        ordered.append(name.strip())
 
    targets = ordered[:swap_tokens]
    dropped = ordered[swap_tokens:]
    return targets, dropped


def strip_markup(text: str) -> str:
    """Remove **..** action markers for plain-text output."""
    return re.sub(r"\*\*(.+?)\*\*", r"\1", text)


GLOBAL_NOTE = (
    "NOTE: Do all of this on hero day (Thursday) so the medal/shard "
    "applications score for VS points."
)
 
 
def generate_guide(
    swap_tokens: int,
    retiring_heroes: List[str] = None,
    top_ew_heroes: List[str] = None,
    cane_mode: bool = False,
    pause_after_first: bool = False,
) -> str:
    """Produce the full guide text for the given inputs."""
    retiring_heroes = retiring_heroes or []
    top_ew_heroes = top_ew_heroes or []

    if not isinstance(swap_tokens, int) or isinstance(swap_tokens, bool):
        return "Error: swap_tokens must be a whole number (got a non-integer)."
    if swap_tokens < 0:
        return "Error: swap_tokens cannot be negative."

    if cane_mode:
        return _generate_guide_cane(
            swap_tokens, retiring_heroes, top_ew_heroes, pause_after_first,
        )

    lines: List[str] = [GLOBAL_NOTE, ""]
    n = 1  # running step number

    def step(text: str) -> None:
        nonlocal n
        lines.append(f"{n}. {text}")
        n += 1

    # ---- Case A: no swaps -------------------------------------------------
    if swap_tokens == 0:
        lines.append("You have 0 swap tokens — promotion-only sequence:")
        lines.append("")
        step(
            "**Prep Sarah: max her skill medals and shards before promotion.** "
            "(Precondition: Sarah needs 150+ Wall-of-Honor levels so enough "
            "shards are returned to rebuild her to 5 stars afterward.)"
        )
        step(
            "**Promote Sarah to UR.** She becomes a 3-star UR hero; all skill "
            "medals and most shards are returned to your mailbox."
        )
        step(
            "**Pick up the returned medals + shards.** Apply the skill medals "
            "to any heroes for VS points, and use the returned SSR shards to "
            "rebuild Sarah back to 5 stars."
        )
        return "\n".join(lines)

    # ---- Case B: one or more swaps ---------------------------------------
    targets, dropped = build_targets(swap_tokens, retiring_heroes, top_ew_heroes)

    if not targets:
        lines.append(
            f"You have {swap_tokens} swap token(s) but named no heroes. "
            "Add heroes to retiring_heroes and/or top_ew_heroes to build the "
            "chain."
        )
        return "\n".join(lines)

    chain = " -> ".join(["Sarah"] + targets)
    lines.append(f"Swap chain ({len(targets)} swap(s)): {chain}")
    lines.append("")

    # Fixed opening
    step(
        "**Prep Sarah: max her skill medals before promotion.** "
        "(Precondition: Sarah needs 150+ Wall-of-Honor levels so enough "
        "shards are returned to rebuild a hero to 5 stars later.)"
    )
    step(
        "**Promote Sarah to UR.** She becomes a 3-star UR hero; medals + "
        "shards are returned to your mailbox."
    )
    step(
        "**Pick up the returned medals + shards together — BEFORE any "
        "swap** — so the shards sit on Sarah and participate in the "
        "conversion."
    )

    # Unrolled swaps
    carrier = "Sarah"
    for i, target in enumerate(targets):
        first = i == 0
        conv = (
            "Sarah's SSR shards convert to UR shards (SSR -> UR, 2:1)"
            if first
            else "the shards transfer unchanged (UR -> UR, 1:1)"
        )
        step(f"**Max {target}'s skill medals** before swapping.")
        step(
            f"**Swap {carrier} (3-star) with {target} (5-star):** "
            f"{carrier} rises to 5 stars (done); {target} drops to 3 stars, "
            f"inherits the shards — {conv} — and returns its excess skill "
            f"medals to your mailbox."
        )
        carrier = target

        if pause_after_first and first and len(targets) > 1:
            lines.append("")
            lines.append(
                f"**--- PAUSE --- Sarah is now UR and 5-star.** "
                f"{target} is 3-star and holding the shards. "
                f"You can stop here and save the remaining "
                f"{len(targets) - 1} swap(s) for a future week when you "
                f"need VS points. When ready, continue below:"
            )
            lines.append("")

    # Fixed closing
    step(
        f"**Rebuild {carrier}:** he/she is still 3 stars and holds all the "
        f"inherited UR shards — use them to bring {carrier} back to 5 stars."
    )
    applied_from = ", ".join(["Sarah"] + targets)
    step(
        f"**Apply all remaining returned skill medals** (from "
        f"{applied_from}) to any heroes you like for VS points."
    )

    if dropped:
        lines.append("")
        lines.append(
            "Heads up: these named heroes did not fit your "
            f"{swap_tokens}-token budget and were not used: "
            f"{', '.join(dropped)}."
        )

    return "\n".join(lines)


# --------------------------------------------------------------------------
# Cane-mode: same logic, phrased for a small child
# --------------------------------------------------------------------------

_CANE_GLOBAL_NOTE = (
    "OKAY LISTEN UP! Do all of this on THURSDAY! Let's go!"
)


def _generate_guide_cane(
    swap_tokens: int,
    retiring_heroes: List[str],
    top_ew_heroes: List[str],
    pause_after_first: bool = False,
) -> str:
    lines: List[str] = [_CANE_GLOBAL_NOTE, ""]
    n = 1

    def step(text: str) -> None:
        nonlocal n
        lines.append(f"{n}. {text}")
        n += 1

    if swap_tokens == 0:
        step("**Max Sarah's skill medals and shards!**")
        step("**PROMOTE Sarah to UR!** BOOM!")
        step("**Open mailbox, grab everything!** Put medals on whoever you want!")
        return "\n".join(lines)

    targets, dropped = build_targets(swap_tokens, retiring_heroes, top_ew_heroes)

    if not targets:
        lines.append("You didn't tell me any hero names, silly!")
        return "\n".join(lines)

    chain = " -> ".join(["Sarah"] + targets)
    lines.append(f"Swap chain: {chain}")
    lines.append("")

    step("**Max Sarah's skill medals!** (150+ Wall-of-Honor first!)")
    step("**PROMOTE Sarah to UR!** BOOM!")
    step("**Open mailbox, grab EVERYTHING!** Don't swap yet!")

    carrier = "Sarah"
    for i, target in enumerate(targets):
        step(f"**Max {target}'s skill medals!**")
        step(f"**SWAP {carrier} with {target}!** WHOOOOSH!")
        carrier = target

        if pause_after_first and i == 0 and len(targets) > 1:
            lines.append("")
            lines.append("--- PAUSE --- You can stop here and save the rest for later!")
            lines.append("")

    step(f"**Build {carrier} back to 5 stars!**")
    step("**Put ALL leftover medals on your favorites!** POINTS POINTS POINTS!")

    if dropped:
        lines.append("")
        lines.append(
            f"Sorry {', '.join(dropped)} — not enough tokens, maybe next time!"
        )

    return "\n".join(lines)
 
 
# --------------------------------------------------------------------------
# Interactive entry point
# --------------------------------------------------------------------------
 
def _prompt_int(prompt: str) -> int:
    while True:
        raw = input(prompt).strip()
        try:
            return int(raw)
        except ValueError:
            print("  Please enter a whole number.")
 
 
def _prompt_list(prompt: str) -> List[str]:
    raw = input(prompt).strip()
    if not raw:
        return []
    return [part.strip() for part in raw.split(",") if part.strip()]
 
 
def main() -> None:
    print("Hero Swap VS Points Guide (Season 4)\n")
    swap_tokens = _prompt_int("How many hero swap tokens do you have? ")
    retiring = _prompt_list(
        "Heroes you're done using (natural-UR, comma-separated, or blank)? "
    )
    top_ew = _prompt_list(
        "Top exclusive-weapon heroes to backfill, highest first "
        "(comma-separated, or blank)? "
    )
    print("\n" + "=" * 64 + "\n")
    print(strip_markup(generate_guide(swap_tokens, retiring, top_ew)))
 
 
# --------------------------------------------------------------------------
# Self-test against the spec's worked example
# --------------------------------------------------------------------------
 
def _self_test() -> None:
    out = generate_guide(2, ["Murphy"], ["Gordon"])
    assert "**Swap Sarah (3-star) with Murphy (5-star):**" in out
    assert "SSR -> UR, 2:1" in out
    assert "**Swap Murphy (3-star) with Gordon (5-star):**" in out
    assert "UR -> UR, 1:1" in out
    assert "**Rebuild Gordon:**" in out
    # 3 opening + 2 swaps*2 + 2 closing = 9 numbered steps
    assert "9. **Apply all remaining returned skill medals**" in out

    # verify strip_markup works
    plain = strip_markup(out)
    assert "**" not in plain
    assert "Swap Sarah (3-star) with Murphy (5-star):" in plain

    # 0-token case
    zero = generate_guide(0)
    assert "promotion-only" in zero
    assert "rebuild Sarah back to 5 stars" in zero
 
    # dedupe + surplus
    targets, dropped = build_targets(2, ["Murphy", "Gordon"], ["Gordon", "Kim"])
    assert targets == ["Murphy", "Gordon"]
    assert dropped == ["Kim"]
 
    print("self-test: OK")
 
 
if __name__ == "__main__":
    import sys
 
    if "--test" in sys.argv:
        _self_test()
    else:
        main()
 