(() => {
  // The viewport is more reliable than user-agent sniffing: it also adapts
  // when a window is resized or a tablet rotates between portrait/landscape.
  const installPortableLayout = () => {
    const root = document.documentElement;
    const coarsePointer = window.matchMedia("(hover: none) and (pointer: coarse)");
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const width = window.innerWidth || root.clientWidth;
        const mobileBrowser = navigator.userAgentData?.mobile === true || /Android|iPhone|iPod|IEMobile|Windows Phone|Mobile/i.test(navigator.userAgent);
        const portable = mobileBrowser || (coarsePointer.matches && width <= 1024);
        root.dataset.device = portable ? "portable" : "desktop";
        root.classList.toggle("is-portable", portable);
      });
    };
    update();
    window.addEventListener("resize", update, { passive: true });
    window.addEventListener("orientationchange", update, { passive: true });
    coarsePointer.addEventListener?.("change", update);

    if (!document.getElementById("site-portable-layout-style")) {
      const style = document.createElement("style");
      style.id = "site-portable-layout-style";
      style.textContent = `
        html[data-device="portable"]{overflow-x:hidden!important;scrollbar-gutter:auto!important}
        html[data-device="portable"] body{box-sizing:border-box!important;width:100%!important;min-width:0!important;max-width:100%!important;overflow-x:hidden!important}
        html[data-device="portable"] body *{min-width:0}
        html[data-device="portable"] body img,html[data-device="portable"] body video,html[data-device="portable"] body canvas,html[data-device="portable"] body svg{max-width:100%}
        html[data-device="portable"] body:not(.home)>.site-shell-header{box-sizing:border-box!important;width:100%!important;max-width:none!important;margin:0 0 8px!important;padding-inline:clamp(12px,4vw,22px)!important}
        html[data-device="portable"] body>main:not(.home-main):not(.cardex-page):not(.family-page){box-sizing:border-box!important;width:calc(100% - 16px)!important;max-width:100%!important;margin:10px auto 24px!important;padding:clamp(14px,4vw,24px)!important}
        html[data-device="portable"] body .friends-layout,html[data-device="portable"] body .deck-workspace,html[data-device="portable"] body .collection-layout,html[data-device="portable"] body .auth-grid,html[data-device="portable"] body .profile-layout,html[data-device="portable"] body .contact-options,html[data-device="portable"] body .shop-products{grid-template-columns:minmax(0,1fr)!important}
        html[data-device="portable"] body .friends-layout,html[data-device="portable"] body .deck-workspace,html[data-device="portable"] body .collection-layout,html[data-device="portable"] body .auth-grid{width:100%!important;max-width:100%!important}
        html[data-device="portable"] body input,html[data-device="portable"] body select,html[data-device="portable"] body textarea{box-sizing:border-box!important;max-width:100%}
        html[data-device="portable"] body table{max-width:100%;font-size:.86em}
        html[data-device="portable"] body :where(.table-wrap,.table-scroll,.data-table-wrap){max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}
        html[data-device="portable"] body dialog{box-sizing:border-box!important;max-width:calc(100vw - 20px)!important;max-height:calc(100dvh - 20px)!important;overflow:auto!important}
        html[data-device="portable"] body .site-shell-footer{box-sizing:border-box!important;width:calc(100% - 24px)!important;max-width:none!important;flex-wrap:wrap!important;margin-top:24px!important}
        @media(max-width:560px){html[data-device="portable"] body>main:not(.home-main):not(.cardex-page):not(.family-page){width:calc(100% - 12px)!important;margin:8px auto 20px!important;padding:14px 11px!important}html[data-device="portable"] body .site-shell-mode{bottom:10px!important;left:10px!important}}
        @media(prefers-reduced-motion:reduce){html[data-device="portable"] body *{scroll-behavior:auto!important}}
      `;
      document.head.append(style);
    }
  };
  installPortableLayout();

  const installUnifiedHeader = () => {
    if (document.getElementById("site-shell-unified-header-style")) return;
    const style = document.createElement("style");
    style.id = "site-shell-unified-header-style";
    style.textContent = `
      body:not(.home) .site-shell-header{position:relative!important;z-index:1200!important;display:grid!important;grid-template-columns:1fr auto!important;grid-template-rows:1fr!important;align-items:center!important;width:100%!important;max-width:none!important;min-height:68px!important;margin:0 0 10px!important;padding:12px clamp(18px,2.3vw,44px)!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;color:#f8efd9!important;backdrop-filter:none!important}
      body:not(.home) .site-shell-header:after{display:none!important}
      body:not(.home) .site-shell-brand{grid-column:1!important;grid-row:1!important;justify-self:start!important;color:#fff3d6!important;text-shadow:0 2px 8px #100b08c9!important}
      body:not(.home) .site-shell-brand span{color:#e4bf70!important}
      body:not(.home) .site-shell-menu-toggle,body:not(.home) .site-shell-actions>a.site-shell-support,body:not(.home) .site-shell-actions>a.site-shell-moderation{display:none!important}
      body:not(.home) .site-shell-actions{grid-column:2!important;grid-row:1!important;justify-content:flex-end!important;gap:11px!important;margin:0!important}
      body:not(.home) .site-shell-header .site-shell-actions>a.site-shell-account{display:inline-flex!important;min-width:0!important;min-height:0!important;width:48px!important;height:48px!important;padding:0!important;border:0!important;border-radius:50%!important;background:transparent!important;box-shadow:none!important}
      body .site-shell-header .site-shell-profile-wrap>a.site-shell-account{display:inline-flex!important;min-width:0!important;min-height:0!important;width:48px!important;height:48px!important;padding:0!important;border:0!important;border-radius:50%!important;background:transparent!important;box-shadow:none!important}
      body:not(.home) .site-shell-avatar{width:48px!important;height:48px!important;border:2px solid #e7c77d!important;border-radius:50%!important;background:#26374b!important;box-shadow:0 0 0 2px #1b26359c!important}
      body:not(.home) .site-shell-header .site-shell-actions .site-shell-notifications{width:48px!important;height:48px!important;flex-basis:48px!important;border:1px solid #f0cd78!important;border-radius:50%!important;background:linear-gradient(145deg,#796039,#392d22)!important;color:#ffe8a8!important;box-shadow:0 0 0 3px #e8c66d24,0 4px 14px #0907068a,inset 0 1px #fff3c066!important;transition:transform .18s ease,box-shadow .18s ease,background .18s ease!important}
      body:not(.home) .site-shell-header .site-shell-actions .site-shell-notifications svg{width:23px!important;height:23px!important}
      body:not(.home) .site-shell-header .site-shell-actions .site-shell-notifications:hover,body:not(.home) .site-shell-header .site-shell-actions .site-shell-notifications:focus-visible{transform:translateY(-2px)!important;background:linear-gradient(145deg,#947443,#483724)!important;box-shadow:0 0 0 4px #e8c66d30,0 7px 18px #090706a6,inset 0 1px #fff5ce88!important;outline:0!important}
      body:not(.home) .site-shell-notification-count{border-color:#1e2838!important}
      .site-shell-profile-wrap{position:relative;display:inline-flex;align-items:center;flex:0 0 auto}
      .site-shell-profile-menu{position:absolute;top:calc(100% + 13px);right:0;z-index:1400;width:min(290px,calc(100vw - 24px));padding:9px;border:1px solid #c4a461;border-radius:5px;background:linear-gradient(145deg,#f6edda,#e8dcc0);color:#26354c;box-shadow:0 18px 44px #09070672;opacity:0;visibility:hidden;pointer-events:none;transform:translateY(-7px);transition:opacity .18s ease,transform .18s ease,visibility .18s}
      .site-shell-profile-menu.is-open{opacity:1;visibility:visible;pointer-events:auto;transform:translateY(0)}
      .site-shell-profile-menu a{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:10px;min-height:39px;padding:7px 9px;border-bottom:1px solid #b8a77e55;color:#26354c;text-decoration:none;font:600 .88rem Georgia,'Times New Roman',serif}
      .site-shell-profile-menu a:last-child{border-bottom:0}
      .site-shell-profile-menu a:hover,.site-shell-profile-menu a:focus-visible{background:#d9c79755;outline:1px solid #ad8b4a}
      .site-shell-profile-menu .profile-menu-arrow{color:#9a7245;font-size:.76rem}
      .site-shell-profile-menu .profile-menu-first{margin-bottom:4px;border-bottom:1px solid #927747!important;font-weight:700}
      body:not(.home){background-color:#23180f!important;background-image:linear-gradient(118deg,#64517818 0%,transparent 38%,#b0804312 67%,#4d675219 100%),linear-gradient(#170f0a9c,#170f0a9c),url("duskclaw-tavern-wood.png")!important;background-size:cover!important;background-position:center!important;background-attachment:fixed!important}
      body:not(.home) .site-global-candle-glow{position:fixed;z-index:1000;inset:0;pointer-events:none;background:radial-gradient(ellipse 48% 55% at 7% 0%,#ff8a3975 0%,#f36f2c52 28%,#d9562028 58%,transparent 100%),radial-gradient(ellipse 82% 78% at 8% 4%,#e86a2928 0%,#ca4e1b14 48%,transparent 100%),radial-gradient(ellipse 112% 98% at 10% 9%,#bb42100b 0%,transparent 100%);mix-blend-mode:screen;filter:blur(14px) saturate(1.1)}
      body:not(.home) .site-global-candle-glow:before{position:absolute;inset:0;background:radial-gradient(ellipse 53% 43% at 8% 2%,#ff9b524d 0%,#ef712920 44%,transparent 100%),radial-gradient(ellipse 72% 68% at 17% 14%,#dc5e2118 0%,transparent 100%);content:"";mix-blend-mode:screen}
      body:not(.home) .site-global-candle-glow.is-random-flicker{mix-blend-mode:normal!important;opacity:var(--flame-strength,.62);filter:blur(var(--flame-blur,14px)) saturate(var(--flame-saturation,1.1)) brightness(var(--flame-brightness,1.06));transition:opacity var(--flame-transition,650ms) ease-in-out,filter var(--flame-transition,650ms) ease-in-out}
      body:not(.home) .site-global-candle-glow.is-random-flicker:before{mix-blend-mode:normal!important;opacity:var(--flame-reflection,.4);transition:opacity var(--flame-transition,650ms) ease-in-out}
      .site-global-firefly{position:fixed;z-index:1300;width:5px;height:5px;border-radius:50%;background:#ffd18a;box-shadow:0 0 7px 2px #ffca7bcc,0 0 17px 5px #e9903d75;opacity:0;pointer-events:none;will-change:transform,opacity}
      @keyframes home-firefly-flight{0%{opacity:0;transform:translate3d(0,0,0) scale(.45)}12%{opacity:.8;transform:translate3d(var(--flight-x1),var(--flight-y1),0) scale(.8)}32%{opacity:.32;transform:translate3d(var(--flight-x2),var(--flight-y2),0) scale(.55)}57%{opacity:.95;transform:translate3d(var(--flight-x3),var(--flight-y3),0) scale(1)}79%{opacity:.48;transform:translate3d(var(--flight-x4),var(--flight-y4),0) scale(.68)}100%{opacity:0;transform:translate3d(var(--flight-x5),var(--flight-y5),0) scale(.4)}}
      body.home .home-index-links a{grid-template-columns:minmax(0,1fr) auto!important}.home-index-links a>span{display:none!important}
      body:not(.home)::before{display:none!important}
      @media(prefers-reduced-motion:reduce){.site-global-candle-glow.is-random-flicker,.site-global-candle-glow.is-random-flicker:before{transition:none!important}.site-global-firefly{display:none!important}}
      @media(max-width:760px){body:not(.home){background-image:url("duskclaw-tavern-wood.png")!important}}
      @media(max-width:600px){body:not(.home) .site-shell-header{min-height:62px!important;padding:10px 15px!important}body:not(.home) .site-shell-header .site-shell-actions>a.site-shell-account,body:not(.home) .site-shell-avatar,body:not(.home) .site-shell-header .site-shell-actions .site-shell-notifications{width:42px!important;height:42px!important;flex-basis:42px!important}body:not(.home) .site-shell-header .site-shell-actions .site-shell-notifications svg{width:20px!important;height:20px!important}}
      @media(prefers-reduced-motion:reduce){.site-shell-profile-menu{transition:none}}
    `;
    document.head.append(style);
  };
  installUnifiedHeader();

  const installSharedAtmosphere = () => {
    if (document.body.classList.contains("home")) return;
    if (!document.querySelector(".site-global-candle-glow")) {
      const glow = document.createElement("div");
      glow.className = "site-global-candle-glow";
      glow.setAttribute("aria-hidden", "true");
      document.body.append(glow);
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        glow.classList.add("is-random-flicker");
        const flicker = () => {
          glow.style.setProperty("--flame-strength", (.4 + Math.random() * .31).toFixed(2));
          glow.style.setProperty("--flame-reflection", (.24 + Math.random() * .3).toFixed(2));
          glow.style.setProperty("--flame-brightness", (1.08 + Math.random() * .22).toFixed(2));
          glow.style.setProperty("--flame-saturation", (1.04 + Math.random() * .12).toFixed(2));
          glow.style.setProperty("--flame-blur", `${12 + Math.random() * 5}px`);
          glow.style.setProperty("--flame-transition", `${(420 + Math.random() * 680) | 0}ms`);
          window.setTimeout(flicker, 420 + Math.random() * 1050);
        };
        window.setTimeout(flicker, 350);
      }
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const random = (min, max) => min + Math.random() * (max - min);
    const fly = particle => {
      const width = window.innerWidth, height = window.innerHeight;
      const startX = random(0, width), startY = random(0, height);
      let endX = random(0, width), endY = random(0, height);
      if (Math.random() < .38) { endX = Math.random() < .5 ? -18 : width + 18; endY = random(-12, height + 12); }
      else if (Math.random() < .2) { endX = random(-12, width + 12); endY = Math.random() < .5 ? -18 : height + 18; }
      const dx = endX - startX, dy = endY - startY;
      particle.style.left = `${startX}px`; particle.style.top = `${startY}px`;
      for (const [key, fraction] of [[1, .14], [2, .32], [3, .55], [4, .79], [5, 1]]) {
        particle.style.setProperty(`--flight-x${key}`, `${dx * fraction + random(-105, 105)}px`);
        particle.style.setProperty(`--flight-y${key}`, `${dy * fraction + random(-80, 80)}px`);
      }
      const duration = random(17000, 33000);
      particle.style.animation = "none"; void particle.offsetWidth;
      particle.style.animation = `home-firefly-flight ${duration}ms ease-in-out both`;
    };
    for (let index = 0; index < 8; index++) {
      const particle = document.createElement("span");
      particle.className = "site-global-firefly";
      particle.setAttribute("aria-hidden", "true");
      const size = random(4, 7); particle.style.width = `${size}px`; particle.style.height = `${size}px`;
      document.body.append(particle);
      particle.addEventListener("animationend", () => window.setTimeout(() => fly(particle), random(500, 4200)), { passive: true });
      window.setTimeout(() => fly(particle), random(0, 12000));
    }
  };
  installSharedAtmosphere();

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
  if (accountLink && !accountLink.dataset.avatarSyncStarted && window.supabase?.createClient) {
    accountLink.dataset.avatarSyncStarted = "true";
    const avatarClient = window.supabase.createClient(
      "https://bqqbciifmfbsjurkulfo.supabase.co",
      "sb_publishable_czfRsCCIui4YMjCk9ImtpQ_loqFKior"
    );
    avatarClient.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user;
      if (!user) return;
      const { data: profile } = await avatarClient.from("user_profiles")
        .select("nickname,avatar_path").eq("user_id", user.id).maybeSingle();
      const name = profile?.nickname?.trim() || "Mon compte";
      const avatar = document.createElement("span");
      avatar.className = "site-shell-avatar";
      avatar.setAttribute("aria-hidden", "true");
      avatar.textContent = name.charAt(0).toUpperCase();
      if (profile?.avatar_path) {
        const { data: image } = await avatarClient.storage.from("user-avatars")
          .createSignedUrl(profile.avatar_path, 3600);
        if (image?.signedUrl) {
          const photo = new Image();
          photo.src = image.signedUrl;
          photo.alt = "";
          avatar.replaceChildren(photo);
        }
      }
      accountLink.replaceChildren(avatar);
      accountLink.setAttribute("aria-label", `Profil de ${name}`);
      accountLink.setAttribute("title", name);
    }).catch(() => {});
  }
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

    const profileWrap = document.createElement("div");
    profileWrap.className = "site-shell-profile-wrap";
    accountLink.parentNode.insertBefore(profileWrap, accountLink);
    profileWrap.append(accountLink);
    accountLink.setAttribute("aria-haspopup", "true");
    accountLink.setAttribute("aria-expanded", "false");
    accountLink.setAttribute("aria-controls", "site-shell-profile-menu");
    const profileMenu = document.createElement("nav");
    profileMenu.id = "site-shell-profile-menu";
    profileMenu.className = "site-shell-profile-menu";
    profileMenu.setAttribute("aria-label", "Menu du profil");
    const profileItems = [
      ["mon-compte.html", "Profil", "profile-menu-first"],
      ["regles.html", "Les règles"],
      ["personnages.html", "Cardex"],
      ["amis.html", "Amis"],
      ["univers.html", "Univers"],
      ["deck-builder.html", "Deck Builder"],
      ["evenements.html", "Événements"],
      ["faq.html", "FAQ"],
      ["soutenir.html", "Soutenir"]
    ];
    profileItems.forEach(([href, label, extraClass]) => {
      const link = document.createElement("a");
      link.href = href;
      if (extraClass) link.classList.add(extraClass);
      const text = document.createElement("span");
      text.textContent = label;
      const arrow = document.createElement("span");
      arrow.className = "profile-menu-arrow";
      arrow.setAttribute("aria-hidden", "true");
      arrow.textContent = "↗";
      link.append(text, arrow);
      profileMenu.append(link);
    });
    profileWrap.append(profileMenu);
    const closeProfileMenu = (returnFocus = false) => {
      profileMenu.classList.remove("is-open");
      accountLink.setAttribute("aria-expanded", "false");
      profileMenu.inert = true;
      if (returnFocus) accountLink.focus({ preventScroll: true });
    };
    profileMenu.inert = true;
    accountLink.addEventListener("click", event => {
      event.preventDefault();
      const open = !profileMenu.classList.contains("is-open");
      profileMenu.classList.toggle("is-open", open);
      accountLink.setAttribute("aria-expanded", String(open));
      profileMenu.inert = !open;
      if (open) profileMenu.querySelector("a")?.focus({ preventScroll: true });
    });
    profileMenu.addEventListener("click", event => {
      if (event.target.closest("a")) closeProfileMenu();
    });
    document.addEventListener("pointerdown", event => {
      if (!profileWrap.contains(event.target)) closeProfileMenu();
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && accountLink.getAttribute("aria-expanded") === "true") closeProfileMenu(true);
    });

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
    const notebookColorKey = userId => `duskclaw-notebook-color:${userId}`;
    const validNotebookColor = color => /^#[\da-f]{6}$/i.test(String(color || ""));
    const setNotebookColor = (color, userId = currentUserId) => {
      if (!validNotebookColor(color)) return;
      document.documentElement.style.setProperty("--duskclaw-book-color", color);
      if (userId) { try { localStorage.setItem(notebookColorKey(userId), color); } catch (_) {} }
    };
    window.setDuskclawNotebookColor = setNotebookColor;
    window.addEventListener("storage", event => {
      if (currentUserId && event.key === notebookColorKey(currentUserId) && validNotebookColor(event.newValue)) setNotebookColor(event.newValue, currentUserId);
    });
    const installNotebookColorRules = () => {
      if (document.getElementById("duskclaw-book-color-rules")) return;
      const style = document.createElement("style"); style.id = "duskclaw-book-color-rules";
      style.textContent = `
        :root{--duskclaw-book-color:#203b61}
        body.home .home-open-book{border-color:color-mix(in srgb,var(--duskclaw-book-color) 68%,#d0ad5e)!important;background:linear-gradient(90deg,color-mix(in srgb,var(--duskclaw-book-color) 58%,#d0ad5e),color-mix(in srgb,var(--duskclaw-book-color) 80%,#101b2d) 24%,var(--duskclaw-book-color) 58%,color-mix(in srgb,var(--duskclaw-book-color) 76%,#101b2d))!important}
        main.cardex-page,main.rules-page,main.family-page,main.dusk-main:not(.home-main),html body:not(.home):not(.dual-page)>main:not(.family-page):not(.dusk-main){border-color:var(--duskclaw-book-color)!important;outline-color:color-mix(in srgb,var(--duskclaw-book-color) 64%,#d4b46d)!important}
        .travel-book{border-color:color-mix(in srgb,var(--duskclaw-book-color) 66%,#d2ad5e)!important;background:linear-gradient(135deg,color-mix(in srgb,var(--duskclaw-book-color) 78%,#fff) 0%,var(--duskclaw-book-color) 44%,color-mix(in srgb,var(--duskclaw-book-color) 68%,#080f19) 100%)!important}
      `;
      document.head.append(style);
    };
    const syncNotebookColor = async () => {
      installNotebookColorRules();
      if (!currentUserId || !supabaseClient) { document.documentElement.style.setProperty("--duskclaw-book-color", "#203b61"); return; }
      try { const cached = localStorage.getItem(notebookColorKey(currentUserId)); if (validNotebookColor(cached)) setNotebookColor(cached, currentUserId); } catch (_) {}
      try {
        const { data } = await supabaseClient.from("user_profiles").select("banner_settings").eq("user_id", currentUserId).maybeSingle();
        const color = data?.banner_settings?.book_color;
        if (validNotebookColor(color)) setNotebookColor(color, currentUserId);
      } catch (_) {}
    };
    installNotebookColorRules();
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
      const sendPresence = async () => {
        if (!currentUserId || document.hidden) return;
        try { await supabaseClient.rpc("update_my_presence"); } catch (_) {}
      };
      supabaseClient.auth.getSession().then(({ data }) => {
        currentUserId = data.session?.user?.id || null;
        syncNotebookColor();
        if (currentUserId) { loadNotifications(); sendPresence(); }
      }).catch(() => {});
      supabaseClient.auth.onAuthStateChange((_event, session) => {
        currentUserId = session?.user?.id || null;
        syncNotebookColor();
        rows = [];
        if (currentUserId) { loadNotifications(); sendPresence(); } else { updateCount(); if (!panel.hidden) renderRows(); }
      });
      const subscribe = () => {
        if (!currentUserId) return;
        if (realtimeChannel) supabaseClient.removeChannel(realtimeChannel);
        realtimeChannel = supabaseClient.channel("site-notifications-" + currentUserId)
          .on("postgres_changes", { event: "*", schema: "public", table: "user_notifications", filter: "recipient_id=eq." + currentUserId }, loadNotifications)
          .subscribe();
      };
      supabaseClient.auth.onAuthStateChange((_event, session) => { if (session?.user?.id) subscribe(); else if (realtimeChannel) { supabaseClient.removeChannel(realtimeChannel); realtimeChannel = null; } });
      window.setInterval(() => { if (!document.hidden && currentUserId) { loadNotifications(); sendPresence(); } }, 45000);
      document.addEventListener("visibilitychange", () => { if (!document.hidden && currentUserId) sendPresence(); });
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
