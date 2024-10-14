import * as anchor from "#/scripts/anchor.ts";
import * as namevars from "#/scripts/namevar.ts";
import * as tocsummary from "#/scripts/toc-summary.ts";
import * as encryption from "#/scripts/encryption.ts";
import { forAllElements } from "#/scripts/element.ts";

function respondContentAlert(agree: boolean) {
  if (!agree) {
    history.back();
    return;
  }

  localStorage.setItem("content-alert", "true");

  const contentAlert = document.getElementById("content-alert")!;
  if (contentAlert) {
    contentAlert.remove();
  }
}

function apply() {
  encryption.apply();
  namevars.apply();
  tocsummary.apply();
  anchor.apply();

  forAllElements({
    selector: ".require-javascript",
    apply: (element) => {
      element.classList.remove("require-javascript");
    },
  });

  const contentAlert = document.getElementById("content-alert");
  if (contentAlert) {
    if (localStorage.getItem("content-alert")) {
      contentAlert.remove();
    } else {
      document
        .getElementById("content-alert-back")!
        .addEventListener("click", () => respondContentAlert(false));
      document
        .getElementById("content-alert-continue")!
        .addEventListener("click", () => respondContentAlert(true));
    }
  }

  addEventListener("scroll", () => {
    document.body.classList.toggle("scrolled", globalThis.scrollY > 0);
  });
}

apply();
