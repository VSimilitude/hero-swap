// Spoken narration for the walkthrough — one conversational line per scene,
// in the exact order (and count) that planScenes() produces, so the returned
// array can be zipped straight onto the scene list as <Audio> tracks.
//
// Rarities are spelled out ("U R", "S S R", "V S") so Kokoro pronounces them
// as letters rather than trying to say a word.

import { Plan, planScenes } from "./plan";

function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join("");
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

// One spoken line per scene, aligned with planScenes(plan).
export function narrationFor(plan: Plan, caneMode: boolean): string[] {
  const scenes = planScenes(plan);
  const swaps = Math.max(0, plan.chain.length - 1);

  return scenes.map((scene) => {
    switch (scene.kind) {
      case "intro": {
        if (swaps === 0) {
          return caneMode
            ? "Hero swap time! No swaps today — we just promote Sarah!"
            : "Here's the promotion-only sequence. No swap tokens needed — we just promote Sarah.";
        }
        const s = swaps > 1 ? "s" : "";
        return caneMode
          ? `Hero swap time! ${swaps} swap${s} — let's go!`
          : `Here's the plan: ${swaps} swap${s} down the line. The chain goes ${joinNames(plan.chain)}.`;
      }

      case "promote": {
        const hero = scene.event.hero;
        return caneMode
          ? `Promote ${hero} to U R! BOOM!`
          : `First, promote ${hero} to U R. She drops to three stars, and all her medals and shards go back to the mailbox.`;
      }

      case "pickup": {
        if (swaps === 0) {
          return caneMode
            ? "Open your mailbox and grab everything! Put the medals on whoever you want, and rebuild Sarah with the shards!"
            : "Now open your mailbox and pick everything up. Apply the returned medals to any heroes, and use the S S R shards to rebuild Sarah back to five stars.";
        }
        return caneMode
          ? "Open your mailbox and grab everything! Don't swap yet!"
          : "Now open your mailbox and pick up the returned medals and shards, before any swap, so the shards sit on Sarah for the conversion.";
      }

      case "swap": {
        const { carrier, target, first } = scene.event;
        if (caneMode) {
          return `Swap ${carrier} with ${target}! Whooosh!`;
        }
        const maxLead = scene.maxHero
          ? `Max out ${scene.maxHero}'s skill medals first. Then swap `
          : `Swap `;
        const conv = first
          ? ", converting S S R shards to U R at two to one"
          : "";
        return `${maxLead}${carrier} with ${target}. ${carrier} rises to five stars, while ${target} drops to three and inherits the shards${conv}.`;
      }

      case "pause": {
        const remaining = scene.event.remaining;
        const s = remaining > 1 ? "s" : "";
        return caneMode
          ? "Pause! You can stop right here and save the rest for later!"
          : `You can stop here. Sarah is now U R and five stars. Save the remaining ${remaining} swap${s} for a future week, then continue when you're ready.`;
      }

      case "rebuild": {
        const hero = scene.event.hero;
        return caneMode
          ? `Build ${hero} back up to five stars!`
          : `Now rebuild ${hero} back to five stars using the inherited U R shards.`;
      }

      case "finale": {
        const sources = joinNames(scene.event.sources);
        return caneMode
          ? "Put all the leftover medals on your favorites! Points, points, points!"
          : `Finally, apply every returned skill medal, from ${sources}, to your favorite heroes for maximum V S points.`;
      }
    }
  });
}
