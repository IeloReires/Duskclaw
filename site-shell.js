(() => {
  const toggle = document.querySelector(".site-shell-menu-toggle");
  const menu = document.getElementById("site-shell-menu");
  if (menu) {
    const addMenuLink = (href, label) => {
      if (menu.querySelector(`a[href="${href}"]`)) return;
      const link = document.createElement("a");
      link.href = href;
      link.textContent = label;
      const anchor = menu.querySelector('a[href="univers.html"]');
      anchor ? anchor.after(link) : menu.append(link);
    };
    addMenuLink("deck-builder.html", "Deck Builder");
    addMenuLink("evenements.html", "Événements");
  }
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

  // Account notifications shared by every page using the site shell.
  const accountLink = document.getElementById("account-nav-link");
  const actions = accountLink?.closest(".site-shell-actions");
  if (accountLink && actions) {
    const wrap = document.createElement("div");
    wrap.className = "site-shell-notification-wrap";
    const bell = document.createElement("button");
    bell.type = "button";
    bell.className = "site-shell-notifications";
    bell.setAttribute("aria-label", "Ouvrir les notifications");
    bell.setAttribute("aria-expanded", "false");
    bell.setAttribute("aria-haspopup", "dialog");
    bell.title = "Notifications";
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

    const panel = document.createElement("section");
    panel.className = "site-shell-notification-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Notifications");
    panel.hidden = true;
    const heading = document.createElement("div");
    heading.className = "site-shell-notification-heading";
    const title = document.createElement("strong");
    title.textContent = "Notifications";
    heading.append(title);
    const list = document.createElement("div");
    list.className = "site-shell-notification-list";
    list.setAttribute("aria-live", "polite");
    panel.append(heading, list);
    wrap.append(bell, panel);
    actions.insertBefore(wrap, accountLink);

    const showMessage = text => {
      list.replaceChildren();
      const empty = document.createElement("p");
      empty.className = "site-shell-notification-empty";
      empty.textContent = text;
      list.append(empty);
    };
    const notificationLink = row => {
      if (row.kind === "friend_request") return "amis.html#requests-list";
      if (row.kind === "friend_accepted") return "amis.html";
      if (row.kind === "badge_awarded") return "mon-compte.html";
      if (row.kind === "trade_offer") return "collection.html";
      return "amis.html";
    };
    const formatDate = value => {
      const date = new Date(value);
      return Number.isNaN(date.valueOf()) ? "" : new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(date);
    };
    let supabaseClient = null;
    let currentUserId = null;
    let rows = [];
    let realtimeChannel = null;
    const updateCount = () => {
      const unread = rows.filter(row => !row.read_at).length;
      count.textContent = "";
      count.hidden = unread === 0;
      bell.classList.toggle("has-unread", unread > 0);
      bell.setAttribute("aria-label", unread ? "Ouvrir les notifications, " + unread + " non lue" + (unread > 1 ? "s" : "") : "Ouvrir les notifications");
    };
    const renderRows = () => {
      list.replaceChildren();
      if (!currentUserId) { showMessage("Connecte-toi pour consulter tes notifications."); return; }
      if (!rows.length) { showMessage("Tu n’as pas encore de notification."); return; }
      for (const row of rows) {
        const item = document.createElement("a");
        item.className = "site-shell-notification-item" + (row.read_at ? " is-read" : " is-unread");
        item.href = notificationLink(row);
        item.dataset.notificationId = String(row.id);
        const dot = document.createElement("span");
        dot.className = "site-shell-notification-dot";
        dot.setAttribute("aria-hidden", "true");
        const content = document.createElement("span");
        content.className = "site-shell-notification-copy";
        const itemTitle = document.createElement("strong");
        itemTitle.textContent = row.title || "Notification";
        const message = document.createElement("span");
        message.textContent = row.message || "";
        const date = document.createElement("small");
        date.textContent = formatDate(row.created_at);
        content.append(itemTitle, message, date);
        item.append(dot, content);
        if (row.kind === "friend_request" && !row.read_at) {
          const actions = document.createElement("span");
          actions.className = "site-shell-notification-item-actions";
          const accept = document.createElement("button");
          accept.type = "button";
          accept.className = "site-shell-notification-accept";
          accept.textContent = "Accepter";
          accept.addEventListener("click", async event => {
            event.preventDefault();
            event.stopPropagation();
            accept.disabled = true;
            const [user_low, user_high] = [currentUserId, row.actor_id].sort();
            const { data, error } = await supabaseClient.from("friendships").update({ status: "accepted" })
              .eq("user_low", user_low).eq("user_high", user_high).eq("requested_by", row.actor_id)
              .eq("status", "pending").select("status").maybeSingle();
            if (error || !data) {
              accept.disabled = false;
              accept.textContent = "Réessayer";
              return;
            }
            await supabaseClient.from("user_notifications").update({ read_at: new Date().toISOString() })
              .eq("id", row.id).eq("recipient_id", currentUserId);
            await loadNotifications();
          });
          actions.append(accept);
          content.append(actions);
        }
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "site-shell-notification-delete";
        remove.setAttribute("aria-label", "Supprimer cette notification");
        remove.title = "Supprimer cette notification";
        const trash = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        trash.setAttribute("viewBox", "0 0 24 24");
        trash.setAttribute("aria-hidden", "true");
        const trashPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        trashPath.setAttribute("d", "M4 7h16M10 11v6m4-6v6M5 7l1 14h12l1-14M9 7V4h6v3");
        trashPath.setAttribute("fill", "none");
        trashPath.setAttribute("stroke", "currentColor");
        trashPath.setAttribute("stroke-width", "1.7");
        trashPath.setAttribute("stroke-linecap", "round");
        trashPath.setAttribute("stroke-linejoin", "round");
        trash.append(trashPath);
        remove.append(trash);
        remove.addEventListener("click", async event => {
          event.preventDefault();
          event.stopPropagation();
          remove.disabled = true;
          const { error } = await supabaseClient.from("user_notifications").delete()
            .eq("id", row.id).eq("recipient_id", currentUserId);
          if (!error) { rows = rows.filter(item => item.id !== row.id); updateCount(); renderRows(); }
          else remove.disabled = false;
        });
        item.append(remove);
        if (!row.read_at) {
          const acknowledge = document.createElement("button");
          acknowledge.type = "button";
          acknowledge.className = "site-shell-notification-dismiss";
          acknowledge.textContent = "×";
          acknowledge.setAttribute("aria-label", "Marquer comme lue");
          acknowledge.title = "Marquer comme lue";
          acknowledge.addEventListener("click", async event => {
            event.preventDefault();
            event.stopPropagation();
            acknowledge.disabled = true;
            const readAt = new Date().toISOString();
            const { error } = await supabaseClient.from("user_notifications").update({ read_at: readAt })
              .eq("id", row.id).eq("recipient_id", currentUserId);
            if (!error) { row.read_at = readAt; updateCount(); renderRows(); }
            else acknowledge.disabled = false;
          });
          item.append(acknowledge);
        }
        item.addEventListener("click", async event => {
          if (!row.read_at && supabaseClient) {
            event.preventDefault();
            const { error } = await supabaseClient.from("user_notifications").update({ read_at: new Date().toISOString() }).eq("id", row.id);
            if (!error) { row.read_at = new Date().toISOString(); updateCount(); item.classList.remove("is-unread"); item.classList.add("is-read"); }
            window.location.href = notificationLink(row);
          }
        });
        list.append(item);
      }
    };
    const loadNotifications = async () => {
      if (!supabaseClient || !currentUserId) return;
      const { data, error } = await supabaseClient.from("user_notifications")
        .select("id,kind,title,message,href,actor_id,created_at,read_at")
        .eq("recipient_id", currentUserId).order("created_at", { ascending: false }).order("id", { ascending: false }).limit(6);
      if (error) { showMessage("Les notifications n’ont pas pu être chargées."); return; }
      rows = data || [];
      updateCount();
      renderRows();
    };
    bell.addEventListener("click", async () => {
      const opening = panel.hidden;
      panel.hidden = !opening;
      bell.setAttribute("aria-expanded", String(opening));
      if (opening) {
        if (!supabaseClient) showMessage("Le service de notifications n’est pas disponible.");
        else if (!currentUserId) showMessage("Connecte-toi pour consulter tes notifications.");
        else await loadNotifications();
      }
    });

    document.addEventListener("pointerdown", event => {
      if (!wrap.contains(event.target)) { panel.hidden = true; bell.setAttribute("aria-expanded", "false"); }
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && !panel.hidden) { panel.hidden = true; bell.setAttribute("aria-expanded", "false"); bell.focus(); }
    });
    if (window.supabase?.createClient) {
      supabaseClient = window.supabase.createClient(
        "https://bqqbciifmfbsjurkulfo.supabase.co",
        "sb_publishable_czfRsCCIui4YMjCk9ImtpQ_loqFKior"
      );
      supabaseClient.auth.getSession().then(({ data }) => {
        currentUserId = data.session?.user?.id || null;
        if (currentUserId) loadNotifications();
      }).catch(() => {});
      supabaseClient.auth.onAuthStateChange((_event, session) => {
        currentUserId = session?.user?.id || null;
        rows = [];
        if (currentUserId) loadNotifications(); else { updateCount(); if (!panel.hidden) renderRows(); }
      });
      const subscribe = () => {
        if (!currentUserId) return;
        if (realtimeChannel) supabaseClient.removeChannel(realtimeChannel);
        realtimeChannel = supabaseClient.channel("site-notifications-" + currentUserId)
          .on("postgres_changes", { event: "*", schema: "public", table: "user_notifications", filter: "recipient_id=eq." + currentUserId }, loadNotifications)
          .subscribe();
      };
      supabaseClient.auth.onAuthStateChange((_event, session) => { if (session?.user?.id) subscribe(); else if (realtimeChannel) { supabaseClient.removeChannel(realtimeChannel); realtimeChannel = null; } });
      window.setInterval(() => { if (!document.hidden && currentUserId) loadNotifications(); }, 60000);
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
