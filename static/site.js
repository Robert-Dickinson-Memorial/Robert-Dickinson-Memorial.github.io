document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("[data-migration-form]");
  const message = document.querySelector("[data-migration-message]");
  if (!(form instanceof HTMLFormElement) || !(message instanceof HTMLElement)) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    message.hidden = false;
    message.scrollIntoView({ behavior: "smooth", block: "center" });
  });
});
