import { forAllElements } from "#/scripts/element.ts";

export function apply(parent?: Element) {
  forAllElements({
    selector: "a.email:not([href])",
    element: HTMLAnchorElement,
    parent,
    apply: (element) => {
      element.href = `mailto:${element.textContent}`;
    },
  });

  forAllElements<HTMLAnchorElement>({
    selector: "a.phone:not([href])",
    element: HTMLAnchorElement,
    parent,
    apply: (element) => {
      element.href = `tel:${element.textContent}`;
    },
  });

  forAllElements<HTMLAnchorElement>({
    selector: "a[href^='http']:not([href*='://mark.localhost'])",
    element: HTMLAnchorElement,
    parent,
    apply: (element) => {
      element.target = "_blank";
      element.rel = "noopener";
    },
  });
}
