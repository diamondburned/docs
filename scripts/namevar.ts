import { html } from "jsr:@mark/html@1";

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
  if (original[0].toUpperCase() === original[0]) {
    return replace[0].toUpperCase() + replace.slice(1);
  }
  // All caps.
  if (original === original.toUpperCase()) {
    return replace.toUpperCase();
  }
  // Lowercase.
  return replace;
}

export const namevars: Namevar[] = [
  {
    namevar: "identifier",
    options: ["Diamond", "d14", "0xd14"],
    preprocessMatcher: /Diamond|\[Diamond\]/g,
    preprocess: () => html`
      <span class="namevar" data-namevar="identifier">Diamond</span>
    `,
    // Return the option as is, since the span value is constant.
    replace: (_: string, option: string) => option,
  },
  {
    namevar: "pronouns",
    options: ["it/its/its", "she/her/hers"],
    preprocessMatcher: /\[(it|its|its3|she|her|hers)\]/gi,
    preprocess: (match) => {
      match = match.slice(1, -1);

      let pronoun = match.toLowerCase();
      pronoun = pronoun.replace("its3", "its");
      pronoun = preserveCase(match, pronoun);

      return html`
        <span
          class="namevar"
          data-namevar="pronouns"
          data-namevar-value="${match}"
          >${pronoun}</span
        >
      `;
    },
    replace: (content: string, option: string, element: HTMLElement) => {
      const originalValue = element.dataset.namevarValue || content;
      const pronoun = originalValue.toLowerCase();
      const replace = {
        "it/its": {
          she: "it",
          her: "its",
          hers: "its",
        }[pronoun],
        "she/her": {
          it: "she",
          its: "her",
          its3: "hers",
        }[pronoun],
      }[option];
      return replace ? preserveCase(content, replace) : content;
    },
  },
];

function assertSpanElement(e: Element): asserts e is HTMLSpanElement {
  if (e.tagName !== "SPAN") {
    throw new Error("Expected span element");
  }
}

function applyNamevar(namevar: Namevar, option: string) {
  document
    .querySelectorAll(
      `span.namevar[data-namevar=${CSS.escape(namevar.namevar)}]`,
    )
    .forEach((e) => {
      assertSpanElement(e);
      e.textContent = namevar.replace(e.textContent || "", option, e);
    });
}

export function apply() {
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

  addEventListener("storage", (ev) => {
    if (ev.storageArea != localStorage || !ev.key) {
      return;
    }

    const namevarName = ev.key.match(/^namevar-v1-(.*)/)?.[1];
    if (!namevarName) {
      // Invalid key format.
      return;
    }

    const namevar = namevars.find((n) => n.namevar === namevarName);
    if (!namevar) {
      // Unknown namevar.
      return;
    }

    const option = ev.newValue || namevar.options[0];
    applyNamevar(namevar, option);
  });
}
