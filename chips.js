/*
 * Roster typeahead + chip pickers for the hero-entry fields.
 *
 * Vanilla JS, no build step. Reads the shared hero roster exposed by the video
 * bundle (window.HeroSwapVideo.roster / resolveSlug / portraitUrl) so the list
 * is never duplicated by hand. Each ".chip-field" gets a filtering dropdown and
 * an ordered chip list; insertion order = priority (same as the old CSV order).
 *
 * State is exposed as window.HeroSwapChips.get(fieldKey) -> [names in order],
 * which main.py reads instead of parsing CSV. Free-text (non-roster) heroes are
 * fully supported: they add a plain letter-medallion chip and flow through the
 * text/video fallbacks unchanged. If the roster isn't available (bundle missing)
 * the fields quietly stay usable as plain text inputs and main.py falls back to
 * parse_csv.
 */
(function () {
  "use strict";

  function normalize(name) {
    return String(name || "").trim().toLowerCase().replace(/[\s.'’-]+/g, "");
  }

  var VIDEO = window.HeroSwapVideo || {};
  var ROSTER = Array.isArray(VIDEO.roster) ? VIDEO.roster : [];
  var resolveSlug =
    typeof VIDEO.resolveSlug === "function"
      ? VIDEO.resolveSlug
      : function () {
          return null;
        };
  var portraitUrl =
    typeof VIDEO.portraitUrl === "function"
      ? VIDEO.portraitUrl
      : function (slug) {
          return "assets/heroes/" + slug + ".webp";
        };

  // fieldKey -> array of { name, slug }  (slug null for free-text heroes)
  var state = {};
  // All field controllers, so suggestions can dedupe across every field.
  var controllers = [];

  function allUsed() {
    var slugs = new Set();
    var names = new Set();
    Object.keys(state).forEach(function (k) {
      state[k].forEach(function (chip) {
        if (chip.slug) slugs.add(chip.slug);
        names.add(normalize(chip.name));
      });
    });
    return { slugs: slugs, names: names };
  }

  function makeMedallion(name) {
    var span = document.createElement("span");
    span.className = "chip-medallion";
    span.textContent = (name.trim()[0] || "?").toUpperCase();
    return span;
  }

  function makePortrait(slug, name, cls) {
    var img = document.createElement("img");
    img.className = cls;
    img.src = portraitUrl(slug);
    img.alt = name;
    img.loading = "lazy";
    // If a portrait fails to load, swap in a letter medallion.
    img.addEventListener("error", function () {
      if (img.parentNode) img.parentNode.replaceChild(makeMedallion(name), img);
    });
    return img;
  }

  function createField(fieldEl) {
    var key = fieldEl.getAttribute("data-field");
    var listEl = fieldEl.querySelector(".chip-list");
    var input = fieldEl.querySelector(".chip-input");
    var dropdown = fieldEl.querySelector(".chip-dropdown");
    state[key] = [];

    var activeIndex = -1; // highlighted suggestion
    var suggestions = [];

    function renderChips() {
      listEl.innerHTML = "";
      state[key].forEach(function (chip, i) {
        var el = document.createElement("span");
        el.className = "chip" + (chip.slug ? "" : " chip--freetext");
        if (chip.slug) {
          el.appendChild(makePortrait(chip.slug, chip.name, "chip-portrait"));
        } else {
          el.appendChild(makeMedallion(chip.name));
        }
        var label = document.createElement("span");
        label.className = "chip-label";
        label.textContent = chip.name;
        el.appendChild(label);

        var rm = document.createElement("button");
        rm.type = "button";
        rm.className = "chip-remove";
        rm.setAttribute("aria-label", "Remove " + chip.name);
        rm.textContent = "×"; // ×
        rm.addEventListener("click", function () {
          state[key].splice(i, 1);
          renderChips();
          refreshDropdown();
          input.focus();
        });
        el.appendChild(rm);
        listEl.appendChild(el);
      });
    }

    function computeSuggestions(q) {
      var used = allUsed();
      var nq = normalize(q);
      var pool = ROSTER.filter(function (h) {
        return !used.slugs.has(h.slug);
      });
      if (!nq) return pool.slice(0, 8);
      var exactAlias = resolveSlug(q);
      var scored = [];
      pool.forEach(function (h) {
        var nn = normalize(h.name);
        var starts = nn.indexOf(nq) === 0 || h.slug.indexOf(nq) === 0;
        var has = nn.indexOf(nq) >= 0 || h.slug.indexOf(nq) >= 0;
        if (exactAlias === h.slug || has) {
          scored.push({ h: h, rank: exactAlias === h.slug ? 0 : starts ? 1 : 2 });
        }
      });
      scored.sort(function (a, b) {
        return a.rank - b.rank || a.h.name.localeCompare(b.h.name);
      });
      return scored.slice(0, 8).map(function (s) {
        return s.h;
      });
    }

    function renderDropdown() {
      dropdown.innerHTML = "";
      if (suggestions.length === 0) {
        dropdown.hidden = true;
        input.setAttribute("aria-expanded", "false");
        return;
      }
      suggestions.forEach(function (h, i) {
        var li = document.createElement("li");
        li.className = "chip-option" + (i === activeIndex ? " is-active" : "");
        li.setAttribute("role", "option");
        li.setAttribute("aria-selected", i === activeIndex ? "true" : "false");
        li.appendChild(makePortrait(h.slug, h.name, "chip-option-portrait"));
        var label = document.createElement("span");
        label.textContent = h.name;
        li.appendChild(label);
        // Use mousedown so the pick happens before the input blur closes it.
        li.addEventListener("mousedown", function (e) {
          e.preventDefault();
          addChip(h.name);
        });
        dropdown.appendChild(li);
      });
      dropdown.hidden = false;
      input.setAttribute("aria-expanded", "true");
    }

    function refreshDropdown() {
      suggestions = computeSuggestions(input.value);
      if (activeIndex >= suggestions.length) activeIndex = suggestions.length - 1;
      if (suggestions.length && activeIndex < 0) activeIndex = 0;
      renderDropdown();
    }

    function closeDropdown() {
      suggestions = [];
      activeIndex = -1;
      dropdown.hidden = true;
      input.setAttribute("aria-expanded", "false");
    }

    // Add a chip by display text. Resolves to a roster hero when possible;
    // otherwise adds a free-text chip. Blocks duplicates across all fields.
    function addChip(text) {
      var name = String(text || "").trim();
      if (!name) return false;
      var slug = resolveSlug(name);
      var used = allUsed();
      if (slug && used.slugs.has(slug)) {
        // Already chosen somewhere — just clear the input.
        input.value = "";
        refreshDropdown();
        return false;
      }
      var display = name;
      if (slug) {
        var match = ROSTER.filter(function (h) {
          return h.slug === slug;
        })[0];
        if (match) display = match.name;
      }
      if (!slug && used.names.has(normalize(display))) {
        input.value = "";
        refreshDropdown();
        return false;
      }
      state[key].push({ name: display, slug: slug });
      input.value = "";
      renderChips();
      refreshDropdown();
      return true;
    }

    input.addEventListener("input", function () {
      activeIndex = input.value ? 0 : -1;
      refreshDropdown();
    });

    input.addEventListener("focus", function () {
      refreshDropdown();
    });

    input.addEventListener("blur", function () {
      // Delay so a click/mousedown on an option registers first.
      setTimeout(closeDropdown, 120);
    });

    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (suggestions.length) {
          activeIndex = (activeIndex + 1) % suggestions.length;
          renderDropdown();
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (suggestions.length) {
          activeIndex = (activeIndex - 1 + suggestions.length) % suggestions.length;
          renderDropdown();
        }
      } else if (e.key === "Enter") {
        // Only intercept Enter when we're adding a hero; let an empty input
        // submit the form normally.
        if (input.value.trim() || suggestions.length) {
          e.preventDefault();
          if (activeIndex >= 0 && suggestions[activeIndex]) {
            addChip(suggestions[activeIndex].name);
          } else {
            addChip(input.value);
          }
        }
      } else if (e.key === "Escape") {
        closeDropdown();
      } else if (e.key === "Backspace" && !input.value && state[key].length) {
        e.preventDefault();
        state[key].pop();
        renderChips();
        refreshDropdown();
      }
    });

    var controller = {
      key: key,
      commitPending: function () {
        if (input.value.trim()) addChip(input.value);
      },
      refresh: refreshDropdown,
    };
    controllers.push(controller);
    return controller;
  }

  function init() {
    var fields = document.querySelectorAll(".chip-field");
    if (!fields.length) return;
    if (!ROSTER.length) {
      // No roster available: leave the plain text inputs alone so main.py's
      // parse_csv fallback still works.
      return;
    }
    fields.forEach(createField);

    window.HeroSwapChips = {
      get: function (fieldKey) {
        return (state[fieldKey] || []).map(function (c) {
          return c.name;
        });
      },
      commitPending: function () {
        controllers.forEach(function (c) {
          c.commitPending();
        });
      },
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
