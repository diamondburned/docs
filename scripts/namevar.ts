import { assert } from "jsr:@std/assert@0.223.0";
import { forAllElements, html, isElement } from "#/scripts/element.ts";

export type Namevar = {
  // namevar is the name of the namevar.
  // It must be unique among all namevars.
  namevar: string;
  // options is a list of options presented to the user.
  options: string[];
  // preprocessMatcher is used to match the Markdown content for preprocess().
  preprocessMatcher: RegExp;
  // preprocess is called on the Markdown content to transform matched strings
  // into namevar span tags.
  preprocess: (match: string) => () => string;
  // replace is called on the namevar span tag to replace the value.
  // It is executed at runtime.
  replace: (content: string, option: string, element: HTMLElement) => string;
};

function preserveCase(original: string, replace: string): string {
  // First-letter capitalization.
  if (original[0].toUpperCase() == original[0]) {
    return replace[0].toUpperCase() + replace.slice(1);
  }
  // All caps.
  if (original == original.toUpperCase()) {
    return replace.toUpperCase();
  }
  // Lowercase.
  return replace;
}

export const namevars: Namevar[] = [
  {
    namevar: "identifier",
    options: ["Diamond", "d14", "0xd14"],
    preprocessMatcher: /\\?Diamond|\[Diamond\]/g,
    preprocess: (match) =>
      match.startsWith("\\")
        ? () => match.slice(1)
        : html`
            <span class="namevar" data-namevar="identifier">Diamond</span>
          `,
    // Return the option as is, since the span value is constant.
    replace: (_: string, option: string) => option,
  },
  {
    namevar: "pronouns",
    options: ["it/its/its", "she/her/hers"],
    preprocessMatcher:
      /\[(it|it2|its|its3|it's|itself|it\/its|she|her|hers|she's|herself|she\/her)\]/gi,
    preprocess: (match) => {
      match = match.slice(1, -1);

      let pronoun = match.toLowerCase();
      pronoun = pronoun.replace("its3", "its");
      pronoun = preserveCase(match, pronoun);

      return html`
        <span class="namevar" data-namevar="pronouns">${pronoun}</span>
      `;
    },
    replace: (content: string, option: string) => {
      const pronoun = content.toLowerCase();
      const replace = {
        "it/its/its": {
          it2: "it",
          its3: "its",
          she: "it",
          her: "its",
          hers: "its",
          herself: "itself",
          "she's": "it's",
          "she/her": "it/its",
        }[pronoun],
        "she/her/hers": {
          it: "she",
          it2: "her",
          its: "her",
          its3: "hers",
          itself: "herself",
          "it's": "she's",
          "it/its": "she/her",
        }[pronoun],
      }[option];
      return replace ? preserveCase(content, replace) : content;
    },
  },
];

export const presets = {
  default: {
    identifier: "Diamond",
    pronouns: "it/its/its",
  },
  professional: {
    identifier: "Diamond",
    pronouns: "she/her/hers",
  },
  bot: {
    identifier: "d14",
    pronouns: "it/its/its",
  },
};

function currentPreset(): keyof typeof presets | null {
  const namevarValues: Record<string, string> = {};
  for (const namevar of namevars) {
    namevarValues[namevar.namevar] = namevarValue(namevar);
  }

  for (const [preset, values] of Object.entries(presets)) {
    if (
      Object.entries(values).every(
        ([namevar, value]) => namevarValues[namevar] === value,
      )
    ) {
      return preset as keyof typeof presets;
    }
  }

  return null;
}

function findNamevar(namevar: string): Namevar {
  const n = namevars.find((n) => n.namevar == namevar);
  if (!n) {
    throw new Error(`Unknown namevar: ${namevar}`);
  }
  return n;
}

function namevarValue(namevar: Namevar): string {
  return (
    localStorage.getItem(`namevar-v1-${namevar.namevar}`) || namevar.options[0]
  );
}

function saveNamevar(namevar: Namevar, option: string) {
  localStorage.setItem(`namevar-v1-${namevar.namevar}`, option);
  applyNamevar(namevar, option);
}

function applyNamevar(namevar: Namevar, option: string) {
  forAllElements({
    selector: `span.namevar[data-namevar=${CSS.escape(namevar.namevar)}]`,
    element: HTMLSpanElement,
    apply: (e) => {
      const oldValue = e.textContent;
      const newValue = namevar.replace(oldValue || "", option, e);

      e.textContent = newValue;
      e.dataset.namevarValue = option;

      if (oldValue != newValue) {
        e.classList.add("changed");
        setTimeout(() => e.classList.remove("changed"), 100);
      }
    },
  });

  forAllElements({
    selector: `.input[data-namevar-for=${CSS.escape(namevar.namevar)}]`,
    apply: (e) => {
      if (isElement(e, HTMLInputElement) || isElement(e, HTMLSelectElement)) {
        e.value = option;
      }
    },
  });

  updatePresets();
}

function updatePresets() {
  const preset = currentPreset();
  forAllElements({
    selector: `.preset input[name="preset"]`,
    element: HTMLInputElement,
    apply: (e) => {
      e.checked = preset === e.value;
    },
  });
}

function applyAllNamevars() {
  for (const namevar of namevars) {
    const storageKey = `namevar-v1-${namevar.namevar}`;

    let option = localStorage.getItem(storageKey);
    if (!option) {
      // Set the first option as the default.
      option = namevar.options[0];
      localStorage.setItem(storageKey, option);
    }

    applyNamevar(namevar, option);
  }
}

const datalists: Record<string, HTMLDataListElement> = {};

function makeOptions(namevar: Namevar): HTMLOptionElement[] {
  return namevar.options.map((option) => {
    const optionElement = document.createElement("option");
    optionElement.value = option;
    optionElement.textContent = option;
    return optionElement;
  });
}

function makeDatalist(namevar: Namevar): HTMLDataListElement {
  let datalist = datalists[namevar.namevar];
  if (datalist) {
    return datalist;
  }

  datalist = document.createElement("datalist");
  datalist.id = `namevar-datalist-${namevar.namevar}`;
  datalist.append(...makeOptions(namevar));

  document.body.append(datalist);
  datalists[namevar.namevar] = datalist;

  return datalist;
}

function assertNamevarNotBound(e: HTMLElement) {
  if (e.dataset.namevarBound) {
    throw new Error("Element is already bound to a namevar");
  }
  e.dataset.namevarBound = "true";
}

function bindNamevarInputs() {
  forAllElements({
    selector: `input.input[data-namevar-for]`,
    element: HTMLInputElement,
    apply: (e) => {
      assertNamevarNotBound(e);
      assert(e.dataset.namevarFor, "Missing data-namevar-for");

      const namevar = findNamevar(e.dataset.namevarFor);

      const datalist = makeDatalist(namevar);

      e.setAttribute("list", datalist.id);
      e.value = namevarValue(namevar);
      e.addEventListener("change", () => saveNamevar(namevar, e.value));
      e.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter") {
          saveNamevar(namevar, e.value);
          e.blur();
        }
      });
    },
  });

  forAllElements({
    selector: `select.input[data-namevar-for]`,
    element: HTMLSelectElement,
    apply: (e) => {
      assertNamevarNotBound(e);
      assert(e.dataset.namevarFor, "Missing data-namevar-for");

      const namevar = findNamevar(e.dataset.namevarFor);

      makeOptions(namevar).forEach((option) => e.appendChild(option));
      e.value = namevarValue(namevar);
      e.addEventListener("change", () => saveNamevar(namevar, e.value));
    },
  });

  forAllElements({
    selector: `button.revert-button[data-namevar-revert]`,
    element: HTMLButtonElement,
    apply: (e) => {
      assertNamevarNotBound(e);
      assert(e.dataset.namevarRevert, "Missing data-namevar-revert");

      const namevar = findNamevar(e.dataset.namevarRevert);

      e.addEventListener("click", () => {
        e.blur();
        saveNamevar(namevar, namevar.options[0]);
      });
    },
  });

  forAllElements({
    selector: `.preset input[name="preset"]`,
    element: HTMLInputElement,
    apply: (e) => {
      assertNamevarNotBound(e);
      e.addEventListener("change", () => {
        if (!e.checked) {
          return;
        }

        const preset = presets[e.value as keyof typeof presets];
        if (!preset) {
          throw new Error(`Unknown preset: ${e.value}`);
        }

        for (const [namevar, value] of Object.entries(preset)) {
          const n = findNamevar(namevar);
          saveNamevar(n, value);
        }
      });
    },
  });
}

// apply is the main function to apply all namevars.
// It is idempotent and can be called multiple times but will properly handle
// new elements.
export function apply() {
  applyAllNamevars();
  bindNamevarInputs();
  updatePresets();
}
