import type { SubsectionsOutput } from "#/preprocessors/toc-summary.ts";
import { assertElement, html } from "#/scripts/element.ts";

async function fetchSubsectionIndex(): Promise<SubsectionsOutput> {
  const response = await fetch("/scripts/dist/subsectionindex.json");
  return response.json();
}

async function updateSidebar(subsectionIndex: SubsectionsOutput) {
  const chapterList = document.querySelector("#sidebar ol.chapter");
  if (!chapterList) {
    console.warn("No chapter list found in sidebar");
    return;
  }

  if (chapterList.classList.contains("root")) {
    return;
  }
  chapterList.classList.add("root");

  chapterList.querySelectorAll("li").forEach((li) => {
    assertElement(li, HTMLLIElement);

    const a = li.querySelector("a")!;
    assertElement(a, HTMLAnchorElement);

    // a.href is a relative path, so we have to resolve it.
    const pageURL = new URL(a.href, location.origin);

    const i = subsectionIndex.findIndex((s) => s.link === pageURL.pathname);
    if (i == -1) {
      console.warn("No indexed section found for", a.href);
      return;
    }

    const section = subsectionIndex[i];
    if (!section.subsections) {
      return;
    }

    const tmpl = document.createElement("template");
    tmpl.innerHTML = html`
      <ol class="chapter subchapter">
        ${section.subsections.map(
          (subsection) => html`
            <li class="chapter-item">
              <a href="${subsection.link}" tabindex="-1">${subsection.name}</a>
            </li>
          `,
        )}
      </ol>
    `();
    li.append(...[...tmpl.content.children]);
  });
}

function updatePageTitle(subsectionIndex: SubsectionsOutput) {
  const content = document.querySelector(".content")! as HTMLHeadingElement;
  if (content.dataset.numbered) {
    return;
  }

  const i = subsectionIndex.findIndex((s) => s.link === location.pathname);
  if (i == -1) {
    console.warn("No indexed section found for", location.pathname);
    return;
  }

  content.dataset.numbered = "";
  content.style.setProperty(`--section-number`, `${i}`);
}

export async function apply() {
  const subsectionIndex = await fetchSubsectionIndex();
  updateSidebar(subsectionIndex);
  updatePageTitle(subsectionIndex);
}
