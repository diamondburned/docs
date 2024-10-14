import { html } from "jsr:@mark/html@1";
export { html };

export function isElement<T extends HTMLElement>(
  e: Element,
  T?: new () => T,
): e is T {
  return T ? e instanceof T : e instanceof HTMLElement;
}

export function assertElement<T extends HTMLElement>(
  e: Element,
  T?: new () => T,
): asserts e is T {
  if (!isElement(e, T)) {
    throw new Error("Expected HTMLElement");
  }
}

export function forAllElements<T extends HTMLElement>({
  selector,
  element,
  apply,
  parent,
}: {
  selector: string;
  element?: new () => T;
  apply: (e: T) => void;
  parent?: Element | Document;
}) {
  parent = parent || document;
  parent!.querySelectorAll(selector).forEach((e) => {
    if (!isElement(e, element)) {
      console.debug("Element does not match type", { e, element, selector });
      return;
    }
    try {
      apply(e);
    } catch (err) {
      console.error("Error applying to element", e, err);
    }
  });
}
