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


def update_video(container, plan, cane):
    """Mount (or hide) the animated walkthrough. Degrades silently if the
    bundle failed to load or there is nothing to animate."""
    has_bundle = hasattr(window, "HeroSwapVideo")

    if plan["error"] or not plan["events"]:
        container.hidden = True
        if has_bundle:
            window.HeroSwapVideo.unmount(container)
        return

    if not has_bundle:
        # Text-only fallback: the bundle isn't available.
        container.hidden = True
        return

    window.HeroSwapVideo.mount(container, json.dumps(plan), cane)
    container.hidden = False


@when("submit", "#guide-form")
def on_submit(event):
    event.preventDefault()

    swap_tokens = int(document.querySelector("#swap-tokens").value)
    retiring = parse_csv(document.querySelector("#retiring-heroes").value)
    top_ew = parse_csv(document.querySelector("#top-ew-heroes").value)
    pause = document.querySelector("#pause-after-first").checked
    cane = document.querySelector("#cane-mode").checked
    show_video = document.querySelector("#show-video").checked

    guide_text = generate_guide(
        swap_tokens, retiring, top_ew,
        cane_mode=cane, pause_after_first=pause,
    )

    output = document.querySelector("#guide-output")
    output.innerHTML = markup_to_html(guide_text)

    container = document.querySelector("#output-container")
    container.hidden = False

    video_container = document.querySelector("#video-container")
    if show_video:
        plan = build_plan(
            swap_tokens, retiring, top_ew, pause_after_first=pause,
        )
        update_video(video_container, plan, cane)
    else:
        video_container.hidden = True
        if hasattr(window, "HeroSwapVideo"):
            window.HeroSwapVideo.unmount(video_container)
