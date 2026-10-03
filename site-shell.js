(() => {
  const toggle = document.querySelector(".site-shell-menu-toggle");
  const menu = document.getElementById("site-shell-menu");
  if (toggle && menu) {
    const closeMenu = (focusToggle = false) => {
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Ouvrir le menu de navigation");
      menu.classList.remove("is-open");
      menu.inert = true;
      if (focusToggle) toggle.focus();
    };
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Fermer le menu de navigation" : "Ouvrir le menu de navigation");
      menu.classList.toggle("is-open", open);
      menu.inert = !open;
      if (open) menu.querySelector("a")?.focus({ preventScroll: true });
    });
    menu.addEventListener("click", event => {
      if (event.target.closest("a")) closeMenu();
    });
    document.addEventListener("pointerdown", event => {
      if (!menu.contains(event.target) && !toggle.contains(event.target)) closeMenu();
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") closeMenu(true);
    });
  }

  const timeToggle = document.getElementById("site-shell-mode-toggle");
  if (!timeToggle) return;
  const applyTime = (save = false) => {
    const time = timeToggle.checked ? "nuit" : "jour";
    document.body.dataset.time = time;
    timeToggle.setAttribute("aria-checked", String(timeToggle.checked));
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = time === "nuit" ? "#111724" : "#f1ead9";
    if (save) localStorage.setItem("duskclaw-time", time);
  };
  timeToggle.checked = localStorage.getItem("duskclaw-time") === "nuit";
  applyTime();
  timeToggle.addEventListener("change", () => applyTime(true));
})();
