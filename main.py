import json
import re
from html import escape

from pyscript import document, window, when
from hero_swap_poc import build_plan, generate_guide


def parse_csv(value):
    """Parse a comma-separated string into a list of stripped, non-empty names."""
    if not value.strip():
        return []
    return [name.strip() for name in value.split(",") if name.strip()]


def read_field(field_key, input_id):
    """Ordered hero names for a picker field.

    Prefers the chip picker's state (window.HeroSwapChips) when present; falls
    back to parsing the input as CSV if the chip UI isn't available.
    """
    chips = getattr(window, "HeroSwapChips", None)
    if chips is not None:
        try:
            names = [str(n).strip() for n in chips.get(field_key)]
            return [n for n in names if n]
        except Exception:
            pass
    el = document.querySelector(input_id)
    return parse_csv(el.value) if el is not None else []


def markup_to_html(text):
    """Convert guide text with **action** markers to HTML with highlighting."""
    safe = escape(text)
    html = re.sub(
        r"\*\*(.+?)\*\*",
        r'<strong class="action">\1</strong>',
        safe,
    )
    lines = html.split("\n")
    return "\n".join(lines)


def update_video(container, plan, cane, voiceover=False, status_el=None):
    """Mount (or hide) the animated walkthrough. Degrades silently if the
    bundle failed to load or there is nothing to animate.

    When `voiceover` is set, hand off to the async voiceover path, which
    lazy-loads the (heavy) TTS bundle, synthesizes per-scene narration, and
    mounts the player with audio — falling back to the silent video on failure.
    """
    has_bundle = hasattr(window, "HeroSwapVideo")

    if plan["error"] or not plan["events"]:
        container.hidden = True
        if status_el is not None:
            status_el.hidden = True
        if has_bundle:
            window.HeroSwapVideo.unmount(container)
        return

    if not has_bundle:
        # Text-only fallback: the bundle isn't available.
        container.hidden = True
        return

    plan_json = json.dumps(plan)
    container.hidden = False

    if voiceover:
        if status_el is not None:
            status_el.textContent = "Loading voice model…"
            status_el.hidden = False
        # Fire-and-forget: the JS glue drives status updates and mounts the
        # player itself (with audio on success, silent on failure).
        window.HeroSwapVideo.mountWithVoiceover(
            container, plan_json, cane, status_el,
        )
    else:
        if status_el is not None:
            status_el.hidden = True
        window.HeroSwapVideo.mount(container, plan_json, cane)


@when("submit", "#guide-form")
def on_submit(event):
    event.preventDefault()

    # Commit any half-typed hero still sitting in a picker input into a chip.
    chips = getattr(window, "HeroSwapChips", None)
    if chips is not None:
        try:
            chips.commitPending()
        except Exception:
            pass

    swap_tokens = int(document.querySelector("#swap-tokens").value)
    retiring = read_field("retiring", "#retiring-heroes")
    top_ew = read_field("top_ew", "#top-ew-heroes")
    pause = document.querySelector("#pause-after-first").checked
    cane = document.querySelector("#cane-mode").checked
    show_video = document.querySelector("#show-video").checked
    voiceover = document.querySelector("#voiceover").checked

    guide_text = generate_guide(
        swap_tokens, retiring, top_ew,
        cane_mode=cane, pause_after_first=pause,
    )

    output = document.querySelector("#guide-output")
    output.innerHTML = markup_to_html(guide_text)

    container = document.querySelector("#output-container")
    container.hidden = False

    video_container = document.querySelector("#video-container")
    status_el = document.querySelector("#voiceover-status")
    if show_video:
        plan = build_plan(
            swap_tokens, retiring, top_ew, pause_after_first=pause,
        )
        update_video(video_container, plan, cane, voiceover, status_el)
    else:
        video_container.hidden = True
        if status_el is not None:
            status_el.hidden = True
        if hasattr(window, "HeroSwapVideo"):
            window.HeroSwapVideo.unmount(video_container)
