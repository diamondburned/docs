import * as namevars from "#/scripts/namevar.ts";
import { forAllElements } from "#/scripts/element.ts";

function apply() {
  forAllElements({
    selector: ".require-javascript",
    apply: (element) => {
      element.classList.remove("require-javascript");
    },
  });

  namevars.apply();
}

apply();
