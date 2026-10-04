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

  // Incoming friend requests badge, shared by every page using the site shell.
  const accountLink = document.getElementById("account-nav-link");
  const actions = accountLink?.closest(".site-shell-actions");
  if (accountLink && actions) {
    const bell = document.createElement("a");
    bell.className = "site-shell-notifications";
    bell.href = "amis.html#requests-list";
    bell.setAttribute("aria-label", "Notifications des demandes d’amis");
    bell.title = "Demandes d’amis";
    bell.hidden = false;
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("aria-hidden", "true");
    const outline = document.createElementNS("http://www.w3.org/2000/svg", "path");
    outline.setAttribute("d", "M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4");
    outline.setAttribute("fill", "none");
    outline.setAttribute("stroke", "currentColor");
    outline.setAttribute("stroke-width", "1.8");
    outline.setAttribute("stroke-linecap", "round");
    outline.setAttribute("stroke-linejoin", "round");
    icon.append(outline);
    const count = document.createElement("span");
    count.className = "site-shell-notification-count";
    count.setAttribute("aria-live", "polite");
    count.hidden = true;
    bell.append(icon, count);
    actions.insertBefore(bell, accountLink);

    if (window.supabase?.createClient) {
      const client = window.supabase.createClient(
        "https://bqqbciifmfbsjurkulfo.supabase.co",
        "sb_publishable_czfRsCCIui4YMjCk9ImtpQ_loqFKior"
      );
      let checking = false;
    const updateNotifications = async user => {
      bell.hidden = false;
      if (!user) { count.hidden = true; return; }
      if (checking) return;
      checking = true;
      try {
        const { data, error } = await client.rpc("friends_directory");
        if (error) throw error;
        const incoming = (data || []).filter(item => item.direction === "received").length;
        count.textContent = incoming > 99 ? "99+" : String(incoming);
        count.hidden = incoming === 0;
        bell.setAttribute("aria-label", incoming
          ? incoming + " demande" + (incoming > 1 ? "s" : "") + " d’amitié en attente"
          : "Aucune demande d’ami en attente");
        bell.title = incoming ? incoming + " demande" + (incoming > 1 ? "s" : "") + " d’ami" : "Demandes d’amis";
      } catch {
        count.hidden = true;
        bell.setAttribute("aria-label", "Voir les demandes d’amis");
      } finally {
        checking = false;
      }
    };
    client.auth.getSession().then(({ data }) => updateNotifications(data.session?.user || null)).catch(() => {});
    client.auth.onAuthStateChange((_event, session) => updateNotifications(session?.user || null));
      window.setInterval(() => {
        if (!document.hidden) client.auth.getSession().then(({ data }) => updateNotifications(data.session?.user || null)).catch(() => {});
      }, 60000);
    }
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
