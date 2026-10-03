(() => {
  const toggle = document.getElementById("site-shell-mode-toggle");
  if (!toggle) return;
  const apply = (save = false) => {
    const time = toggle.checked ? "nuit" : "jour";
    document.body.dataset.time = time;
    toggle.setAttribute("aria-checked", String(toggle.checked));
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = time === "nuit" ? "#111724" : "#f1ead9";
    if (save) localStorage.setItem("duskclaw-time", time);
  };
  toggle.checked = localStorage.getItem("duskclaw-time") === "nuit";
  apply();
  toggle.addEventListener("change", () => apply(true));
})();
