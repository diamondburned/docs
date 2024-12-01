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

const el = <T extends HTMLElement = HTMLElement>(id: string, must = true) => {
  const el = document.getElementById(id) as T;
  if (must && !el) {
    throw new Error(`Element with id "${id}" not found.`);
  }
  return el;
};

function apply() {
  encryption.apply();
  namevars.apply();
  tocsummary.apply();
  anchor.apply();

  const contentAlert = document.getElementById("content-alert");
  if (!contentAlert) {
    throw new Error("Content alert not found. Not continuing out of safety.");
  }

  if (localStorage.getItem("content-alert")) {
    contentAlert.remove();
  } else {
    const backBtn = el<HTMLButtonElement>("content-alert-back");
    backBtn.addEventListener("click", () => respondContentAlert(false));

    const continueBtn = el<HTMLButtonElement>("content-alert-continue");
    continueBtn.addEventListener("click", () => respondContentAlert(true));
    continueBtn.disabled = true;
    setTimeout(() => {
      continueBtn.disabled = false;
    }, 5000);

    let countdown = 5;
    const continueCountdown = el<HTMLSpanElement>("content-alert-countdown");
    const updateCountdown = () => {
      continueCountdown.textContent = countdown > 0 ? `(${countdown})` : "";
    };

    updateCountdown();
    const interval = setInterval(() => {
      countdown--;
      updateCountdown();
      if (countdown <= 0) clearInterval(interval);
    }, 1000);
  }

  addEventListener("scroll", () => {
    document.body.classList.toggle("scrolled", globalThis.scrollY > 0);
  });

  forAllElements({
    selector: ".require-javascript",
    apply: (element) => {
      element.classList.remove("require-javascript");
    },
  });
}

apply();
