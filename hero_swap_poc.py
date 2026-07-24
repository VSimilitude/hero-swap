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
 
 
def build_plan(
    swap_tokens: int,
    retiring_heroes: List[str] = None,
    top_ew_heroes: List[str] = None,
    pause_after_first: bool = False,
) -> dict:
    """
    Build a structured, ordered plan for the swap chain.

    This is the single source of truth: both generate_guide() and the animated
    video walkthrough render from the event list this returns. Every key is
    always present; when `error` is set the other fields are empty.
    """
    retiring_heroes = retiring_heroes or []
    top_ew_heroes = top_ew_heroes or []

    plan: dict = {
        "error": None,
        "swap_tokens": None,
        "targets": [],
        "dropped": [],
        "chain": [],
        "events": [],
    }

    if not isinstance(swap_tokens, int) or isinstance(swap_tokens, bool):
        plan["error"] = "swap_tokens must be a whole number (got a non-integer)."
        return plan
    if swap_tokens < 0:
        plan["error"] = "swap_tokens cannot be negative."
        return plan

    plan["swap_tokens"] = swap_tokens

    # ---- Case A: no swaps -------------------------------------------------
    if swap_tokens == 0:
        plan["chain"] = ["Sarah"]
        plan["events"] = [
            {"type": "prep", "hero": "Sarah"},
            {"type": "promote", "hero": "Sarah"},
            {"type": "pickup"},
        ]
        return plan

    # ---- Case B: one or more swaps ---------------------------------------
    targets, dropped = build_targets(swap_tokens, retiring_heroes, top_ew_heroes)
    plan["targets"] = targets
    plan["dropped"] = dropped

    if not targets:
        # Tokens but no named heroes: nothing to animate.
        return plan

    plan["chain"] = ["Sarah"] + targets

    events: List[dict] = [
        {"type": "prep", "hero": "Sarah"},
        {"type": "promote", "hero": "Sarah"},
        {"type": "pickup"},
    ]

    carrier = "Sarah"
    for i, target in enumerate(targets):
        first = i == 0
        events.append({"type": "max_medals", "hero": target})
        events.append({
            "type": "swap",
            "carrier": carrier,
            "target": target,
            "first": first,
            "conversion": "2:1" if first else "1:1",
        })
        carrier = target

        if pause_after_first and first and len(targets) > 1:
            events.append({"type": "pause", "remaining": len(targets) - 1})

    events.append({"type": "rebuild", "hero": carrier})
    events.append({"type": "apply_medals", "sources": ["Sarah"] + targets})

    plan["events"] = events
    return plan


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

    plan = build_plan(
        swap_tokens, retiring_heroes, top_ew_heroes, pause_after_first,
    )

    if cane_mode:
        return _generate_guide_cane(
            swap_tokens, retiring_heroes, top_ew_heroes, pause_after_first,
        )

    return _render_guide(plan)


def _render_guide(plan: dict) -> str:
    """Render the standard guide text from a plan (byte-identical output)."""
    swap_tokens = plan["swap_tokens"]
    targets = plan["targets"]
    zero = swap_tokens == 0

    lines: List[str] = [GLOBAL_NOTE, ""]
    n = 1  # running step number

    def step(text: str) -> None:
        nonlocal n
        lines.append(f"{n}. {text}")
        n += 1

    # ---- Header ----------------------------------------------------------
    if zero:
        lines.append("You have 0 swap tokens — promotion-only sequence:")
        lines.append("")
    elif not targets:
        lines.append(
            f"You have {swap_tokens} swap token(s) but named no heroes. "
            "Add heroes to retiring_heroes and/or top_ew_heroes to build the "
            "chain."
        )
        return "\n".join(lines)
    else:
        chain = " -> ".join(plan["chain"])
        lines.append(f"Swap chain ({len(targets)} swap(s)): {chain}")
        lines.append("")

    last_target = ""
    for ev in plan["events"]:
        kind = ev["type"]
        if kind == "prep":
            if zero:
                step(
                    "**Prep Sarah: max her skill medals and shards before "
                    "promotion.** (Precondition: Sarah needs 150+ Wall-of-Honor "
                    "levels so enough shards are returned to rebuild her to 5 "
                    "stars afterward.)"
                )
            else:
                step(
                    "**Prep Sarah: max her skill medals before promotion.** "
                    "(Precondition: Sarah needs 150+ Wall-of-Honor levels so "
                    "enough shards are returned to rebuild a hero to 5 stars "
                    "later.)"
                )
        elif kind == "promote":
            if zero:
                step(
                    "**Promote Sarah to UR.** She becomes a 3-star UR hero; all "
                    "skill medals and most shards are returned to your mailbox."
                )
            else:
                step(
                    "**Promote Sarah to UR.** She becomes a 3-star UR hero; "
                    "medals + shards are returned to your mailbox."
                )
        elif kind == "pickup":
            if zero:
                step(
                    "**Pick up the returned medals + shards.** Apply the skill "
                    "medals to any heroes for VS points, and use the returned "
                    "SSR shards to rebuild Sarah back to 5 stars."
                )
            else:
                step(
                    "**Pick up the returned medals + shards together — BEFORE "
                    "any swap** — so the shards sit on Sarah and participate in "
                    "the conversion."
                )
        elif kind == "max_medals":
            step(f"**Max {ev['hero']}'s skill medals** before swapping.")
        elif kind == "swap":
            carrier = ev["carrier"]
            target = ev["target"]
            last_target = target
            conv = (
                "Sarah's SSR shards convert to UR shards (SSR -> UR, 2:1)"
                if ev["first"]
                else "the shards transfer unchanged (UR -> UR, 1:1)"
            )
            step(
                f"**Swap {carrier} (3-star) with {target} (5-star):** "
                f"{carrier} rises to 5 stars (done); {target} drops to 3 stars, "
                f"inherits the shards — {conv} — and returns its excess skill "
                f"medals to your mailbox."
            )
        elif kind == "pause":
            lines.append("")
            lines.append(
                f"**--- PAUSE --- Sarah is now UR and 5-star.** "
                f"{last_target} is 3-star and holding the shards. "
                f"You can stop here and save the remaining "
                f"{ev['remaining']} swap(s) for a future week when you "
                f"need VS points. When ready, continue below:"
            )
            lines.append("")
        elif kind == "rebuild":
            carrier = ev["hero"]
            step(
                f"**Rebuild {carrier}:** he/she is still 3 stars and holds all "
                f"the inherited UR shards — use them to bring {carrier} back to "
                f"5 stars."
            )
        elif kind == "apply_medals":
            applied_from = ", ".join(ev["sources"])
            step(
                f"**Apply all remaining returned skill medals** (from "
                f"{applied_from}) to any heroes you like for VS points."
            )

    if plan["dropped"]:
        lines.append("")
        lines.append(
            "Heads up: these named heroes did not fit your "
            f"{swap_tokens}-token budget and were not used: "
            f"{', '.join(plan['dropped'])}."
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
    plan = build_plan(
        swap_tokens, retiring_heroes, top_ew_heroes, pause_after_first,
    )
    return _render_guide_cane(plan)


def _render_guide_cane(plan: dict) -> str:
    """Render the Cane-mode guide text from a plan (byte-identical output)."""
    swap_tokens = plan["swap_tokens"]
    targets = plan["targets"]
    zero = swap_tokens == 0

    lines: List[str] = [_CANE_GLOBAL_NOTE, ""]
    n = 1

    def step(text: str) -> None:
        nonlocal n
        lines.append(f"{n}. {text}")
        n += 1

    if not zero and not targets:
        lines.append("You didn't tell me any hero names, silly!")
        return "\n".join(lines)

    if not zero:
        chain = " -> ".join(plan["chain"])
        lines.append(f"Swap chain: {chain}")
        lines.append("")

    for ev in plan["events"]:
        kind = ev["type"]
        if kind == "prep":
            if zero:
                step("**Max Sarah's skill medals and shards!**")
            else:
                step("**Max Sarah's skill medals!** (150+ Wall-of-Honor first!)")
        elif kind == "promote":
            step("**PROMOTE Sarah to UR!** BOOM!")
        elif kind == "pickup":
            if zero:
                step("**Open mailbox, grab everything!** Put medals on whoever you want!")
            else:
                step("**Open mailbox, grab EVERYTHING!** Don't swap yet!")
        elif kind == "max_medals":
            step(f"**Max {ev['hero']}'s skill medals!**")
        elif kind == "swap":
            step(f"**SWAP {ev['carrier']} with {ev['target']}!** WHOOOOSH!")
        elif kind == "pause":
            lines.append("")
            lines.append("--- PAUSE --- You can stop here and save the rest for later!")
            lines.append("")
        elif kind == "rebuild":
            step(f"**Build {ev['hero']} back to 5 stars!**")
        elif kind == "apply_medals":
            step("**Put ALL leftover medals on your favorites!** POINTS POINTS POINTS!")

    if plan["dropped"]:
        lines.append("")
        lines.append(
            f"Sorry {', '.join(plan['dropped'])} — not enough tokens, maybe next time!"
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

    # ---- build_plan: worked example --------------------------------------
    plan = build_plan(2, ["Murphy"], ["Gordon"])
    assert plan["error"] is None
    assert plan["swap_tokens"] == 2
    assert plan["targets"] == ["Murphy", "Gordon"]
    assert plan["dropped"] == []
    assert plan["chain"] == ["Sarah", "Murphy", "Gordon"]
    assert [e["type"] for e in plan["events"]] == [
        "prep", "promote", "pickup",
        "max_medals", "swap",
        "max_medals", "swap",
        "rebuild", "apply_medals",
    ]
    swaps = [e for e in plan["events"] if e["type"] == "swap"]
    assert swaps[0] == {
        "type": "swap", "carrier": "Sarah", "target": "Murphy",
        "first": True, "conversion": "2:1",
    }
    assert swaps[1] == {
        "type": "swap", "carrier": "Murphy", "target": "Gordon",
        "first": False, "conversion": "1:1",
    }
    assert plan["events"][-1] == {
        "type": "apply_medals", "sources": ["Sarah", "Murphy", "Gordon"],
    }

    # dropped heroes surface in the plan
    plan_dropped = build_plan(2, ["Murphy", "Gordon"], ["Gordon", "Kim"])
    assert plan_dropped["dropped"] == ["Kim"]

    # ---- build_plan: 0-token case ----------------------------------------
    plan0 = build_plan(0)
    assert plan0["error"] is None
    assert plan0["targets"] == []
    assert plan0["chain"] == ["Sarah"]
    assert [e["type"] for e in plan0["events"]] == ["prep", "promote", "pickup"]

    # ---- build_plan: tokens but no named heroes --------------------------
    plan_empty = build_plan(2)
    assert plan_empty["error"] is None
    assert plan_empty["targets"] == []
    assert plan_empty["events"] == []

    # ---- build_plan: error cases -----------------------------------------
    plan_neg = build_plan(-1)
    assert plan_neg["error"] == "swap_tokens cannot be negative."
    assert plan_neg["events"] == []
    plan_bad = build_plan("2")
    assert plan_bad["error"] == "swap_tokens must be a whole number (got a non-integer)."
    assert plan_bad["events"] == []
    plan_bool = build_plan(True)
    assert plan_bool["error"] == "swap_tokens must be a whole number (got a non-integer)."

    # ---- build_plan: pause event placement -------------------------------
    plan_pause = build_plan(2, ["Murphy"], ["Gordon"], pause_after_first=True)
    types = [e["type"] for e in plan_pause["events"]]
    assert types == [
        "prep", "promote", "pickup",
        "max_medals", "swap", "pause",
        "max_medals", "swap",
        "rebuild", "apply_medals",
    ]
    pause_ev = [e for e in plan_pause["events"] if e["type"] == "pause"][0]
    assert pause_ev == {"type": "pause", "remaining": 1}
    # single swap: no pause even when requested
    plan_one = build_plan(1, ["Murphy"], pause_after_first=True)
    assert not any(e["type"] == "pause" for e in plan_one["events"])

    print("self-test: OK")
 
 
if __name__ == "__main__":
    import sys
 
    if "--test" in sys.argv:
        _self_test()
    else:
        main()
 