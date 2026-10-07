(() => {
  const SUPABASE_URL = "https://bqqbciifmfbsjurkulfo.supabase.co";
  const SUPABASE_KEY = "sb_publishable_czfRsCCIui4YMjCk9ImtpQ_loqFKior";
  const ASSET_ROOT = "https://ieloreires.github.io/Duskclaw/";
  const client = window.supabase?.createClient(SUPABASE_URL, SUPABASE_KEY);
  const $ = (id) => document.getElementById(id);
  const state = { user: null, profile: {}, collection: [], catalog: [], roster: [], featured: [], badges: [], avatar: "", pendingAvatarFile: null, pendingAvatarUrl: "", theme: "water", settings: {}, editingName: false, editingBio: false };
  const themes = {
    water: ["#257f93", "#163554"], plant: ["#63844d", "#17382f"], ice: ["#90b5d1", "#263e68"],
    rock: ["#b47d55", "#3b2d29"], wind: ["#a0b5b4", "#34495b"]
  };
  let activeSpread = 0, turning = false;
  const say = (node, message, error = false) => { if (node) { node.textContent = message || ""; node.classList.toggle("error", error); } };
  const message = (text, error = false) => { say($("page-message"), text, error); $("page-message")?.classList.toggle("hidden", !text); };
  const esc = (value) => String(value ?? "");
  const displayDate = (date) => date ? new Intl.DateTimeFormat("fr-FR", { month: "short", year: "numeric" }).format(new Date(date)) : "2026";

  function setEditMode(active) {
    const panel = $("account-panel"), toggle = $("profile-edit-toggle");
    panel.classList.toggle("is-editing", active);
    document.body.classList.toggle("is-profile-editing", active);
    $("customizer").classList.toggle("hidden", !active);
    toggle.setAttribute("aria-expanded", String(active));
    toggle.setAttribute("aria-label", active ? "Fermer les réglages" : "Modifier mon profil");
    toggle.title = active ? "Fermer les réglages" : "Modifier mon profil";
    toggle.querySelector("span").textContent = active ? "×" : "✎";
    state.editingName = false; state.editingBio = false;
    $("welcome-name").classList.remove("hidden"); $("edit-nickname").classList.remove("hidden"); $("nickname-input").classList.add("hidden");
    $("bio-editor").classList.add("hidden"); $("bio-display").classList.remove("hidden");
    if (active) requestAnimationFrame(() => $("customizer").scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function buildProfileBook() {
    const panel = $("account-panel");
    if (panel.dataset.bookBuilt) return;
    panel.dataset.bookBuilt = "true";
    const layout = panel.querySelector(".profile-layout"), main = layout.querySelector(".main-column"), side = layout.querySelector(".side-column");
    const [featured, about, badgeSurface, customizer] = [...main.children];
    const quickLinks = side.querySelector(".quick-links");
    const facts = side.querySelector(".side-facts");
    const book = document.createElement("section"); book.className = "travel-book"; book.setAttribute("aria-label", "Carnet de voyage du joueur");
    const toolbar = document.createElement("nav"); toolbar.className = "book-toolbar cardex-pagination"; toolbar.setAttribute("aria-label", "Pages du carnet");
    const prev = document.createElement("button"); prev.type = "button"; prev.className = "book-turn"; prev.dataset.turn = "previous"; prev.setAttribute("aria-label", "Feuillet précédent"); prev.textContent = "‹";
    const counter = document.createElement("span"); counter.className = "book-page-counter"; counter.id = "book-page-counter";
    const next = document.createElement("button"); next.type = "button"; next.className = "book-turn"; next.dataset.turn = "next"; next.setAttribute("aria-label", "Feuillet suivant"); next.textContent = "›";
    toolbar.append(prev, counter, next);
    const spread = document.createElement("div"); spread.className = "profile-book-spread"; spread.id = "profile-book-spread";
    const pages = Array.from({ length: 4 }, (_, index) => { const page = document.createElement("article"); page.className = `profile-leaf profile-leaf-${index + 1}`; page.dataset.profilePage = String(index + 1); page.setAttribute("aria-label", `Page ${index + 1}`); spread.append(page); return page; });
    const [one, two, three, four] = pages;
    one.append(panel.querySelector(".profile-hero"), panel.querySelector(".stat-strip"), about);
    const favoritePanel = document.createElement("section"); favoritePanel.className = "surface favorite-panel";
    favoritePanel.innerHTML = '<div class="section-head"><div><small>TES REPÈRES</small><h3>Favoris de voyage</h3><p>Les compagnons, forces et paysages que tu préfères.</p></div></div><div class="favorite-portraits"><article class="favorite-furry"><div class="favorite-picture" id="favorite-furry-picture"><span>✦</span></div><div><small>FURRY FAVORI</small><strong id="favorite-furry-name">À choisir</strong><span id="favorite-furry-meta">Compagnon de route</span></div></article><article class="favorite-marker"><span class="type-mark" id="favorite-type-mark">✧</span><div><small>TYPE FAVORI</small><strong id="favorite-type-name">À choisir</strong></div></article><article class="favorite-marker terrain-marker"><span class="terrain-art" id="favorite-terrain-mark" data-terrain="unknown" aria-hidden="true">⌁</span><div><small>TERRAIN FAVORI</small><strong id="favorite-terrain-name">À choisir</strong></div></article></div>';
    const featuredHead = featured.querySelector(".section-head");
    const favoriteEdit = document.createElement("p"); favoriteEdit.className = "favorite-edit-hint"; favoriteEdit.textContent = "Ces préférences se modifient avec le crayon du carnet.";
    favoritePanel.append(facts, favoriteEdit);
    two.append(featured, favoritePanel);
    three.append(badgeSurface);
    const journal = document.createElement("section"); journal.className = "surface journey-page";
    journal.innerHTML = '<div class="section-head"><div><small>REGISTRE DES TROUVAILLES</small><h3>Atlas de collection</h3><p>Les familles, les types et les raretés déjà découverts.</p></div></div><div class="ledger-cover"><img src="duskclaw-map-antique.png" alt="Carte ancienne de Duskclaw"><div><small>COLLECTION PERSONNELLE</small><strong id="journey-total">0 / 75</strong><span>cartes découvertes</span></div></div><div class="journey-meter"><span id="journey-meter-fill"></span></div><div class="ledger-lower"><section class="ledger-section"><h4>Raretés trouvées</h4><div class="rarity-ledger" id="rarity-ledger"></div></section><section class="ledger-section"><h4>Types explorés</h4><div class="type-ledger" id="type-ledger"></div></section></div><p class="next-insignia" id="journey-next">La prochaine étape commence avec ta première carte.</p><div class="journey-links"><h4>Continuer l’exploration</h4></div>';
    if (quickLinks) journal.querySelector(".journey-links").append(quickLinks);
    four.append(journal);
    book.append(spread, toolbar);
    layout.replaceWith(book);
    book.after(customizer);
    toolbar.addEventListener("click", (event) => { const button = event.target.closest("[data-turn]"); if (!button) return; turnSpread(button.dataset.turn === "next" ? 1 : -1); });
    window.addEventListener("resize", updateSpread, { passive: true });
    document.addEventListener("keydown", (event) => { if (!panel.classList.contains("hidden") && !event.altKey && !event.ctrlKey && !event.metaKey && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "")) { if (event.key === "ArrowRight") turnSpread(1); if (event.key === "ArrowLeft") turnSpread(-1); } });
    updateSpread();
  }
  function updateSpread() {
    const pages = document.querySelectorAll(".profile-leaf");
    const single = matchMedia("(max-width: 620px)").matches;
    if (!single && activeSpread % 2) activeSpread -= 1;
    pages.forEach((page, index) => { const visible = single ? index === activeSpread : Math.floor(index / 2) === Math.floor(activeSpread / 2); page.classList.toggle("is-visible", visible); page.setAttribute("aria-hidden", String(!visible)); });
    const firstPage = single ? activeSpread + 1 : Math.floor(activeSpread / 2) * 2 + 1;
    const count = $("book-page-counter"); if (count) count.textContent = `${String(firstPage).padStart(2, "0")}${single ? "" : ` — ${String(firstPage + 1).padStart(2, "0")}`} / 04`;
    const previous = document.querySelector('[data-turn="previous"]'), next = document.querySelector('[data-turn="next"]');
    if (previous) previous.disabled = activeSpread === 0 || turning;
    if (next) next.disabled = activeSpread >= (single ? 3 : 2) || turning;
  }
  async function turnSpread(direction) {
    const step = matchMedia("(max-width: 620px)").matches ? 1 : 2;
    if (turning || activeSpread + direction * step < 0 || activeSpread + direction * step > 3) return;
    turning = true; updateSpread();
    const spread = $("profile-book-spread"), leaf = document.createElement("div");
    leaf.className = `profile-turning-leaf ${direction > 0 ? "turn-forward" : "turn-back"}`; leaf.setAttribute("aria-hidden", "true"); spread.append(leaf);
    const duration = matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : 360;
    try {
      await leaf.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" }).finished;
      activeSpread += direction * step; updateSpread();
      leaf.style.transformOrigin = direction > 0 ? "left center" : "right center";
      await leaf.animate([{ transform: "scaleX(1)" }, { transform: "scaleX(0)" }], { duration, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" }).finished;
    } catch { updateSpread(); }
    leaf.remove(); turning = false; updateSpread();
  }

  function setAvatar(url, fallback) {
    state.avatar = url || "";
    const btn = $("avatar-edit");
    if (!btn) return;
    btn.replaceChildren();
    if (url) { const img = document.createElement("img"); img.src = url; img.alt = "Photo de profil"; btn.append(img); }
    else btn.textContent = (fallback || "D").trim().slice(0, 1).toUpperCase();
    const nav = $("account-nav-link");
    if (nav && url) { nav.textContent = ""; const img = document.createElement("img"); img.src = url; img.alt = ""; img.className = "site-shell-avatar"; nav.append(img); nav.setAttribute("aria-label", "Mon compte"); }
  }
  function applyBanner() {
    const hero = $("profile-hero"); if (!hero) return;
    const s = state.settings || {};
    hero.dataset.pattern = s.pattern || "waves";
    hero.dataset.layout = s.layout || "classic";
    hero.style.setProperty("--cover-a", s.color || themes[state.theme]?.[0] || themes.water[0]);
    hero.style.setProperty("--cover-b", s.color2 || themes[state.theme]?.[1] || themes.water[1]);
    hero.style.setProperty("--glow-color", s.glowColor || "#b8a6df");
    hero.style.setProperty("--profile-accent", s.accent || "#9c8cff");
    hero.style.setProperty("--pattern-opacity", (Number(s.pattern_opacity ?? 28) / 100).toString());
    hero.style.setProperty("--pattern-size", `${s.pattern_size ?? 100}%`);
    hero.style.setProperty("--gradient-angle", `${s.gradient_angle ?? 125}deg`);
    hero.style.setProperty("--glow-strength", `${Number(s.glow ?? 35)}%`);
    hero.style.setProperty("--glow-x", `${s.glow_x ?? 78}%`);
    hero.style.setProperty("--glow-y", `${s.glow_y ?? 18}%`);
  }
  function populateSettings() {
    const s = state.settings || {};
    $("banner-color").value = s.color || themes[state.theme]?.[0] || themes.water[0];
    $("banner-color2").value = s.color2 || themes[state.theme]?.[1] || themes.water[1];
    $("banner-glow-color").value = s.glowColor || "#b8a6df"; $("accent-color").value = s.accent || "#9c8cff";
    $("banner-pattern").value = s.pattern || "waves"; $("profile-layout").value = s.layout || "classic";
    document.querySelectorAll("[data-setting]").forEach((input) => { if (s[input.dataset.setting] != null) input.value = s[input.dataset.setting]; updateRange(input); });
    document.querySelectorAll("[data-theme-choice]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.themeChoice === state.theme)));
    applyBanner();
  }
  function readSettings() {
    const s = { ...(state.settings || {}), color: $("banner-color").value, color2: $("banner-color2").value, glowColor: $("banner-glow-color").value, accent: $("accent-color").value, pattern: $("banner-pattern").value, layout: $("profile-layout").value };
    document.querySelectorAll("[data-setting]").forEach((input) => s[input.dataset.setting] = Number(input.value));
    state.settings = s; applyBanner();
  }
  function updateRange(input) {
    const key = input.dataset.setting, out = $(`${key.replaceAll("_", "-")}-value`);
    if (out) out.textContent = key === "gradient_angle" ? `${input.value}°` : `${input.value} %`;
  }
  function renderFacts() {
    const role = state.profile.community_role || "Joueur";
    const furry = state.roster.find((item) => String(item.id) === String(state.profile.favorite_furry_id));
    const type = state.profile.favorite_type || "";
    $("side-role").textContent = role; $("side-furry").textContent = furry?.displayName || "À choisir"; $("side-type").textContent = type || "À choisir";
    $("hero-tagline").textContent = state.profile.banner_settings?.tagline || "Une nouvelle aventure commence ici.";
    renderFavorites();
  }
  function renderFavorites() {
    const furry = state.roster.find((item) => String(item.id) === String(state.profile.favorite_furry_id));
    const illustratedFurry = furry?.image ? furry : furry && state.roster.find((item) => Number(item.family) === Number(furry.family) && item.image);
    const picture = $("favorite-furry-picture");
    if (picture) {
      picture.replaceChildren();
      if (illustratedFurry?.image) { const image = document.createElement("img"); image.src = new URL(illustratedFurry.image, ASSET_ROOT).href; image.alt = furry?.displayName || "Furry favori"; picture.append(image); }
      else { const fallback = document.createElement("span"); fallback.textContent = furry?.displayName?.slice(0, 1) || "✦"; picture.append(fallback); }
    }
    if ($("favorite-furry-name")) $("favorite-furry-name").textContent = furry?.displayName || "À choisir";
    if ($("favorite-furry-meta")) $("favorite-furry-meta").textContent = furry ? `${furry.type} · ${furry.rarity}` : "Compagnon de route";
    const type = state.profile.favorite_type || "";
    const typeIcons = { Glace: "❄", Eau: "≈", Vent: "〰", Plante: "❧", Roche: "◈" };
    if ($("favorite-type-name")) $("favorite-type-name").textContent = type || "À choisir";
    if ($("favorite-type-mark")) { $("favorite-type-mark").textContent = typeIcons[type] || "✧"; $("favorite-type-mark").dataset.type = type; }
    const terrain = state.settings.favorite_terrain || "";
    if ($("favorite-terrain-name")) $("favorite-terrain-name").textContent = terrain || "À choisir";
    const terrainCode = { Prairie: "prairie", Forêt: "forest", "Pinède nordique": "forest", Rivière: "water", Lac: "water", Fjord: "water", "Lac gelé": "ice", Roche: "rock", Montagne: "mountain", Glace: "ice", "Ruine nordique": "ruins", "Pierre runique": "rune", "Maison longue": "hall", Vent: "wind" };
    if ($("favorite-terrain-mark")) $("favorite-terrain-mark").dataset.terrain = terrainCode[terrain] || "unknown";
    renderCollectionLedger();
  }
  function renderCollectionLedger() {
    if (!$('rarity-ledger')) return;
    const owned = new Set(state.collection.map((row) => Number(row.card_number)));
    const cards = state.catalog.filter((card) => owned.has(Number(card.id)));
    const total = Math.min(75, owned.size);
    $('journey-total').textContent = `${total} / 75`;
    $('journey-meter-fill').style.width = `${total / 75 * 100}%`;
    const rarityHost = $('rarity-ledger'); rarityHost.replaceChildren();
    ["Commun", "Peu commun", "Rare", "Épique", "Légendaire"].forEach((rarity, index) => {
      const count = cards.filter((card) => card.rarity === rarity).length;
      const row = document.createElement('div'); row.className = 'rarity-row'; row.dataset.rarity = String(index);
      const label = document.createElement('span'); label.textContent = rarity;
      const track = document.createElement('i'); const fill = document.createElement('b'); fill.style.width = `${Math.min(100, count / 75 * 100)}%`; track.append(fill);
      const value = document.createElement('strong'); value.textContent = String(count);
      row.append(label, track, value); rarityHost.append(row);
    });
    const typeHost = $('type-ledger'); typeHost.replaceChildren();
    const symbols = { Glace: '❄', Eau: '≈', Vent: '〰', Plante: '❧', Roche: '◈' };
    Object.entries(symbols).forEach(([type, symbol]) => {
      const count = cards.filter((card) => card.type === type).length;
      const item = document.createElement('div'); item.className = count ? 'type-discovered' : 'type-undiscovered'; item.title = `${type} · ${count} carte${count === 1 ? '' : 's'}`;
      const glyph = document.createElement('i'); glyph.textContent = symbol; const label = document.createElement('span'); label.textContent = type; item.append(glyph, label); typeHost.append(item);
    });
    const next = state.badges.find((item) => !item.earned);
    $('journey-next').textContent = next ? `Prochaine inscription : ${next.name} — ${next.note}.` : 'Toutes les étapes du registre sont complétées. La carte est à toi.';
  }
  function badge(title, note, icon, earned, number, tier = "bronze") {
    const tile = document.createElement("article"); tile.className = `badge ${earned ? "earned" : "locked"} badge-${tier}`; tile.title = `${title} — ${note}`;
    const seal = document.createElement("span"); seal.className = "badge-seal"; seal.textContent = earned ? icon : "◇";
    const copy = document.createElement("div"); const strong = document.createElement("b"); strong.textContent = title;
    const small = document.createElement("small"); small.textContent = earned ? "Obtenu" : note;
    const serial = document.createElement("i"); serial.textContent = String(number).padStart(2, "0");
    copy.append(strong, small); tile.append(serial, seal, copy); return tile;
  }
  function renderBadges() {
    const owned = new Set(state.collection.map((row) => Number(row.card_number)));
    const cards = state.catalog.filter((card) => owned.has(Number(card.id)));
    const total = Math.min(75, owned.size), families = new Set(cards.map((card) => card.family)).size;
    const raritySet = new Set(cards.map((card) => card.rarity).filter(Boolean));
    const types = new Set(cards.map((card) => card.type).filter(Boolean));
    const profile = state.profile;
    const milestones = [
      ["Première trouvaille", "Obtenir une carte", "✦", total >= 1, "bronze"],
      ["Poche de voyage", "Réunir 10 cartes", "✦", total >= 10, "bronze"],
      ["Éclaireur", "Réunir 25 cartes", "✦", total >= 25, "bronze"],
      ["Archiviste", "Réunir 50 cartes", "✦", total >= 50, "silver"],
      ["Cardex complet", "Réunir 75 cartes", "✦", total >= 75, "gold"],
      ["Petit bestiaire", "Découvrir 5 familles", "✦", families >= 5, "bronze"],
      ["Grand bestiaire", "Découvrir 15 familles", "✦", families >= 15, "silver"],
      ["Collection des éléments", "Trouver une carte de chaque type", "✦", ["Glace", "Eau", "Vent", "Plante", "Roche"].every((type) => types.has(type)), "gold"],
      ["Éclat rare", "Trouver une carte Rare", "✦", raritySet.has("Rare") || raritySet.has("Épique") || raritySet.has("Légendaire"), "silver"],
      ["Trophée épique", "Trouver une carte Épique", "✦", raritySet.has("Épique") || raritySet.has("Légendaire"), "gold"],
      ["Légende retrouvée", "Trouver une carte Légendaire", "✦", raritySet.has("Légendaire"), "platinum"],
      ["Palette complète", "Découvrir les cinq raretés", "✦", ["Commun", "Peu commun", "Rare", "Épique", "Légendaire"].every((rarity) => raritySet.has(rarity)), "platinum"],
      ["Maître du Cardex", "Compléter les 75 cartes et les cinq raretés", "✦", total >= 75 && ["Commun", "Peu commun", "Rare", "Épique", "Légendaire"].every((rarity) => raritySet.has(rarity)), "platinum"]
    ];
    state.badges = milestones.map(([name, note, icon, earned, tier], index) => ({ name, note, icon, earned: !!earned, number: index + 1, tier }));
    const earnedCount = state.badges.filter((item) => item.earned).length;
    $("stat-badges").textContent = `${earnedCount}/${state.badges.length}`; $("badge-count-inline").textContent = `${earnedCount}/${state.badges.length}`;
    const badgeList = $("badge-list"); badgeList.replaceChildren();
    const preview = [...state.badges.filter((item) => item.earned), ...state.badges.filter((item) => !item.earned)];
    preview.forEach((item) => badgeList.append(badge(item.name, item.note, item.icon, item.earned, item.number, item.tier)));
    const all = $("all-badges"); all.replaceChildren();
    state.badges.forEach((item) => all.append(badge(item.name, item.note, item.icon, item.earned, item.number, item.tier)));
    $("badge-dialog-count").textContent = `${earnedCount}/${state.badges.length} obtenus`;
    renderCollectionLedger();
  }
  function cardTitle(card) { return card?.label?.replace(/^#\d+\s*·\s*/, "") || `Carte #${card?.id ?? "?"}`; }
  function cardNode(card, remove = false) {
    const item = document.createElement("article"); item.className = "featured-card";
    const art = document.createElement("div"); art.className = "showcase-art"; art.dataset.type = card.type || "";
    const stage = card.level === "Niveau 2" ? 2 : card.level === "Niveau 1" ? 1 : 0;
    const illustration = state.roster.find((entry) => Number(entry.family) === Number(card.family) && entry.stageIndex === stage && entry.image);
    if (illustration) { const image = document.createElement("img"); image.className = "card-art-image"; image.src = new URL(illustration.image, ASSET_ROOT).href; image.alt = ""; image.loading = "lazy"; art.append(image); }
    const number = document.createElement("small"); number.className = "card-number"; number.textContent = `#${String(card.id).padStart(2, "0")}`;
    const emblem = document.createElement("span"); emblem.className = "card-emblem"; emblem.textContent = ({ Glace: "❄", Eau: "≈", Vent: "〰", Plante: "❧", Roche: "◈" })[card.type] || "✦";
    const title = document.createElement("strong"); title.textContent = cardTitle(card);
    const meta = document.createElement("span"); meta.textContent = `${card.type || "Furry"} · ${card.level || "Base"}`;
    art.dataset.emblem = emblem.textContent; art.append(number, emblem, title, meta); item.append(art);
    if (remove) { const btn = document.createElement("button"); btn.className = "remove-card"; btn.type = "button"; btn.textContent = "×"; btn.setAttribute("aria-label", "Retirer cette carte"); btn.addEventListener("click", () => { state.featured = state.featured.filter((id) => id !== card.id); renderFeatured(); }); item.append(btn); }
    return item;
  }
  function renderFeatured() {
    const gallery = $("featured-gallery"); gallery.replaceChildren();
    const cards = state.featured.map((id) => state.catalog.find((card) => Number(card.id) === Number(id))).filter(Boolean);
    if (!cards.length) { const empty = document.createElement("p"); empty.className = "empty-showcase"; empty.textContent = "Aucune carte mise à l’honneur pour le moment."; gallery.append(empty); }
    cards.forEach((card) => gallery.append(cardNode(card, true)));
    $("add-featured").disabled = state.featured.length >= 3 || !state.collection.length;
  }
  function renderPicker() {
    const picker = $("card-picker"); picker.replaceChildren();
    const owned = new Set(state.collection.map((row) => Number(row.card_number)));
    const available = state.catalog.filter((card) => owned.has(Number(card.id)) && !state.featured.includes(Number(card.id)));
    if (!available.length) { const empty = document.createElement("p"); empty.className = "empty-showcase"; empty.textContent = state.collection.length ? "Toutes tes cartes disponibles sont déjà dans la vitrine." : "Ajoute des cartes à ta collection pour pouvoir les mettre en avant."; picker.append(empty); return; }
    available.forEach((card) => { const item = document.createElement("button"); item.type = "button"; item.className = "picker-card"; const name = document.createElement("strong"); name.textContent = cardTitle(card); const detail = document.createElement("span"); detail.textContent = `#${String(card.id).padStart(2, "0")} · ${card.type} · ${card.level}`; item.append(name, detail); item.addEventListener("click", () => { if (state.featured.length < 3) state.featured.push(Number(card.id)); renderFeatured(); renderPicker(); if (state.featured.length >= 3) $("featured-dialog").close(); }); picker.append(item); });
  }
  async function signedAvatar(path) {
    if (!path) return "";
    const { data } = await client.storage.from("user-avatars").createSignedUrl(path, 3600);
    return data?.signedUrl || "";
  }
  async function loadProfile(user) {
    state.user = user;
    $("auth-panel").classList.add("hidden"); $("account-panel").classList.remove("hidden");
    $("profile-main").classList.add("is-authenticated");
    document.body.classList.add("has-profile");
    $("profile-edit-toggle").classList.remove("hidden");
    $("logout-button").classList.remove("hidden");
    $("profile-state").textContent = "Synchronisation";
    const [profileResult, collectionResult, rosterResult, cardsResult] = await Promise.all([
      client.from("user_profiles").select("nickname,avatar_path,banner_theme,banner_color,banner_settings,featured_cards,bio,community_role,favorite_furry_id,favorite_type,profile_visibility,collection_visibility,wishlist_visibility,community_since").eq("user_id", user.id).maybeSingle(),
      client.from("user_collection").select("card_number").eq("user_id", user.id),
      fetch(`${ASSET_ROOT}character-roster.json`).then((r) => r.ok ? r.json() : []),
      fetch(`${ASSET_ROOT}collection-cards.json`).then((r) => r.ok ? r.json() : [])
    ]);
    if (profileResult.error) throw profileResult.error;
    state.profile = profileResult.data || {};
    state.collection = collectionResult.data || []; state.roster = Array.isArray(rosterResult) ? rosterResult : []; state.catalog = Array.isArray(cardsResult) ? cardsResult : [];
    state.featured = Array.isArray(state.profile.featured_cards) ? [...new Set(state.profile.featured_cards.map(Number))].filter((id) => state.collection.some((row) => Number(row.card_number) === id)).slice(0, 3) : [];
    state.theme = themes[state.profile.banner_theme] ? state.profile.banner_theme : "water";
    state.settings = { ...(state.profile.banner_settings || {}) };
    if (state.profile.banner_color) state.settings.color = state.profile.banner_color;
    $("welcome-name").textContent = state.profile.nickname || user.user_metadata?.nickname || user.email?.split("@")[0] || "Joueur";
    $("nickname-input").value = $("welcome-name").textContent;
    const tagline = state.settings.tagline || ""; $("tagline-setting").value = tagline; $("tagline-input").value = tagline;
    $("community-role").value = state.profile.community_role || "Joueur";
    const furrySelect = $("favorite-furry"); state.roster.filter((furry) => furry.stageIndex === 0).forEach((furry) => { const option = document.createElement("option"); option.value = String(furry.id); option.textContent = furry.displayName; furrySelect.append(option); });
    furrySelect.value = state.profile.favorite_furry_id || ""; $("favorite-type").value = state.profile.favorite_type || ""; $("favorite-terrain").value = state.settings.favorite_terrain || "";
    $("profile-visibility").value = state.profile.profile_visibility || "public"; $("collection-visibility").value = state.profile.collection_visibility || "private"; $("wishlist-visibility").value = state.profile.wishlist_visibility || "private";
    $("profile-bio").value = state.profile.bio || ""; $("bio-display").textContent = state.profile.bio || "Aucune présentation pour le moment."; $("bio-display").classList.toggle("empty", !state.profile.bio); $("bio-count").value = String((state.profile.bio || "").length);
    $("stat-cards").textContent = `${Math.min(75, new Set(state.collection.map((row) => Number(row.card_number))).size)}/75`; $("stat-since").textContent = displayDate(state.profile.community_since || user.created_at);
    setAvatar(await signedAvatar(state.profile.avatar_path), $("welcome-name").textContent);
    populateSettings(); renderFacts(); renderBadges(); renderFeatured();
    const nav = $("moderation-nav-link");
    const { data: isModerator } = await client.rpc("is_site_moderator");
    if (isModerator === true) nav.classList.remove("hidden");
    $("profile-state").textContent = "Profil synchronisé";
    setEditMode(false);
  }
  function collectPayload() {
    const tagline = $("tagline-input").value.trim().slice(0, 90); state.settings.tagline = tagline;
    return { user_id: state.user.id, nickname: $("welcome-name").textContent.trim(), banner_theme: state.theme, banner_color: state.settings.color, banner_settings: state.settings,
      featured_cards: state.featured, bio: $("profile-bio").value.trim(), community_role: $("community-role").value,
      favorite_furry_id: $("favorite-furry").value ? Number($("favorite-furry").value) : null, favorite_type: $("favorite-type").value || null,
      profile_visibility: $("profile-visibility").value, collection_visibility: $("collection-visibility").value, wishlist_visibility: $("wishlist-visibility").value };
  }
  async function saveProfile() {
    if (!state.user) return;
    const button = $("save-profile"); button.disabled = true; say($("save-message"), "Enregistrement…");
    const payload = collectPayload();
    let uploadedAvatarPath = "";
    if (state.pendingAvatarFile) {
      const file = state.pendingAvatarFile, ext = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
      uploadedAvatarPath = `${state.user.id}/avatar-${Date.now()}.${ext}`;
      const { error: uploadError } = await client.storage.from("user-avatars").upload(uploadedAvatarPath, file, { contentType: file.type });
      if (uploadError) { button.disabled = false; say($("save-message"), uploadError.message || "La photo n’a pas pu être envoyée.", true); return; }
      payload.avatar_path = uploadedAvatarPath;
    }
    const { error } = await client.from("user_profiles").upsert(payload, { onConflict: "user_id" });
    button.disabled = false;
    if (error) { if (uploadedAvatarPath) await client.storage.from("user-avatars").remove([uploadedAvatarPath]); say($("save-message"), error.message || "Impossible d’enregistrer le profil.", true); return; }
    state.profile = { ...state.profile, ...payload }; renderFacts(); renderBadges();
    if (uploadedAvatarPath) { state.profile.avatar_path = uploadedAvatarPath; setAvatar(await signedAvatar(uploadedAvatarPath), $("welcome-name").textContent); }
    if (state.pendingAvatarUrl) URL.revokeObjectURL(state.pendingAvatarUrl);
    state.pendingAvatarFile = null; state.pendingAvatarUrl = "";
    say($("save-message"), "Profil enregistré."); setEditMode(false);
  }
  function setEditingName(active) { state.editingName = active; $("welcome-name").classList.toggle("hidden", active); $("edit-nickname").classList.toggle("hidden", active); $("nickname-input").classList.toggle("hidden", !active); if (active) { $("nickname-input").value = $("welcome-name").textContent; $("nickname-input").focus(); } }
  function finishName() { const value = $("nickname-input").value.trim(); if (value.length >= 2 && value.length <= 15) $("welcome-name").textContent = value; setEditingName(false); }
  async function cancelEditing() {
    setEditMode(false);
    if (state.pendingAvatarUrl) URL.revokeObjectURL(state.pendingAvatarUrl);
    state.pendingAvatarFile = null; state.pendingAvatarUrl = "";
    say($("save-message"), "Modifications annulées.");
    if (state.user) { try { await loadProfile(state.user); } catch (error) { console.error(error); } }
  }
  async function uploadAvatar(file) {
    if (!file || !state.user) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 10 * 1024 * 1024) { message("Choisis une image JPG, PNG ou WebP de 10 Mo maximum.", true); return; }
    if (state.pendingAvatarUrl) URL.revokeObjectURL(state.pendingAvatarUrl);
    state.pendingAvatarFile = file; state.pendingAvatarUrl = URL.createObjectURL(file); setAvatar(state.pendingAvatarUrl, $("welcome-name").textContent); message("");
  }
  function bind() {
    $("profile-edit-toggle").addEventListener("click", () => { if ($("account-panel").classList.contains("is-editing")) cancelEditing(); else setEditMode(true); });
    $("cancel-edit").addEventListener("click", cancelEditing);
    $("avatar-edit").addEventListener("click", () => { if ($("account-panel").classList.contains("is-editing")) $("avatar-file").click(); }); $("avatar-pencil").addEventListener("click", () => { if ($("account-panel").classList.contains("is-editing")) $("avatar-file").click(); });
    $("avatar-file").addEventListener("change", (event) => uploadAvatar(event.target.files?.[0]));
    $("edit-nickname").addEventListener("click", () => setEditingName(true)); $("nickname-input").addEventListener("keydown", (e) => { if (e.key === "Enter") finishName(); if (e.key === "Escape") setEditingName(false); }); $("nickname-input").addEventListener("blur", finishName);
    $("tagline-setting").addEventListener("input", () => { $("tagline-input").value = $("tagline-setting").value; $("hero-tagline").textContent = $("tagline-setting").value || "Une nouvelle aventure commence ici."; });
    $("tagline-input").addEventListener("input", () => { $("tagline-setting").value = $("tagline-input").value; $("hero-tagline").textContent = $("tagline-input").value || "Une nouvelle aventure commence ici."; });
    $("toggle-bio").addEventListener("click", () => { state.editingBio = !state.editingBio; $("bio-editor").classList.toggle("hidden", !state.editingBio); $("bio-display").classList.toggle("hidden", state.editingBio); if (state.editingBio) $("profile-bio").focus(); });
    $("profile-bio").addEventListener("input", () => { $("bio-count").value = String($("profile-bio").value.length); $("bio-display").textContent = $("profile-bio").value || "Aucune présentation pour le moment."; $("bio-display").classList.toggle("empty", !$("profile-bio").value); });
    $("add-featured").addEventListener("click", () => { renderPicker(); $("featured-dialog").showModal(); }); $("close-picker").addEventListener("click", () => $("featured-dialog").close()); $("featured-dialog").addEventListener("click", (e) => { if (e.target === $("featured-dialog")) $("featured-dialog").close(); });
    $("open-badges").addEventListener("click", () => $("badges-dialog").showModal()); $("close-badges").addEventListener("click", () => $("badges-dialog").close()); $("badges-dialog").addEventListener("click", (e) => { if (e.target === $("badges-dialog")) $("badges-dialog").close(); });
    document.querySelectorAll(".tab[data-tab]").forEach((tab) => tab.addEventListener("click", () => { document.querySelectorAll(".tab[data-tab]").forEach((el) => { const active = el === tab; el.classList.toggle("active", active); el.setAttribute("aria-selected", String(active)); }); document.querySelectorAll(".tab-panel").forEach((el) => el.classList.toggle("active", el.id === `panel-${tab.dataset.tab}`)); }));
    document.querySelectorAll("[data-theme-choice]").forEach((button) => button.addEventListener("click", () => { state.theme = button.dataset.themeChoice; const [a, b] = themes[state.theme]; $("banner-color").value = a; $("banner-color2").value = b; readSettings(); document.querySelectorAll("[data-theme-choice]").forEach((el) => el.setAttribute("aria-pressed", String(el === button))); }));
    ["banner-color", "banner-color2", "banner-glow-color", "accent-color", "banner-pattern", "profile-layout"].forEach((id) => $(id).addEventListener("input", readSettings));
    document.querySelectorAll("[data-setting]").forEach((input) => input.addEventListener("input", () => { updateRange(input); readSettings(); }));
    $("community-role").addEventListener("change", () => { state.profile.community_role = $("community-role").value; renderFacts(); }); $("favorite-furry").addEventListener("change", () => { state.profile.favorite_furry_id = $("favorite-furry").value; renderFacts(); renderBadges(); }); $("favorite-type").addEventListener("change", () => { state.profile.favorite_type = $("favorite-type").value; renderFacts(); }); $("favorite-terrain").addEventListener("change", () => { state.settings.favorite_terrain = $("favorite-terrain").value; renderFavorites(); });
    $("save-profile").addEventListener("click", saveProfile);
    $("logout-button").addEventListener("click", async () => { await client.auth.signOut(); });
    $("login-form").addEventListener("submit", async (event) => { event.preventDefault(); say($("login-message"), "Connexion…"); const form = new FormData(event.currentTarget); const { error } = await client.auth.signInWithPassword({ email: form.get("email"), password: form.get("password") }); say($("login-message"), error?.message || "", !!error); if (!error) { const redirect = new URLSearchParams(location.search).get("redirect"); if (redirect && /^[a-z0-9-]+\.html$/i.test(redirect)) location.assign(redirect); } });
    $("signup-form").addEventListener("submit", async (event) => { event.preventDefault(); say($("signup-message"), "Création du compte…"); const form = new FormData(event.currentTarget); const nickname = String(form.get("nickname")).trim(); const { data, error } = await client.auth.signUp({ email: form.get("email"), password: form.get("password"), options: { data: { nickname }, emailRedirectTo: `${location.origin}${location.pathname}` } }); if (error) { say($("signup-message"), error.message, true); return; } if (data.user && data.session) await client.from("user_profiles").upsert({ user_id: data.user.id, nickname }, { onConflict: "user_id" }); say($("signup-message"), data.session ? "Compte créé, bienvenue !" : "Vérifie ta boîte mail pour confirmer ton compte."); });
    $("forgot-password").addEventListener("click", async () => { const email = $("login-form").elements.email.value.trim(); if (!email) { say($("login-message"), "Saisis ton adresse e-mail avant de demander un lien.", true); return; } const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}${location.pathname}` }); say($("login-message"), error?.message || "Un lien de réinitialisation vient d’être envoyé.", !!error); });
  }
  async function start() {
    if (!client) { $("profile-state").textContent = "Connexion indisponible"; message("Le service de compte n’est pas disponible pour le moment.", true); return; }
    buildProfileBook(); bind();
    const { data: { session } } = await client.auth.getSession();
    if (session?.user) { try { await loadProfile(session.user); } catch (error) { console.error(error); $("profile-state").textContent = "Profil partiellement chargé"; message("Impossible de charger toutes les données du profil. Tes autres pages restent accessibles.", true); } }
    else { $("profile-state").textContent = "Non connecté"; $("auth-panel").classList.remove("hidden"); }
    client.auth.onAuthStateChange((_event, sessionNext) => { if (sessionNext?.user && sessionNext.user.id !== state.user?.id) setTimeout(() => loadProfile(sessionNext.user).catch((error) => { console.error(error); message("Impossible de charger le profil.", true); }), 0); else if (!sessionNext?.user) { state.user = null; document.body.classList.remove("has-profile"); $("profile-main").classList.remove("is-authenticated"); $("logout-button").classList.add("hidden"); $("account-panel").classList.add("hidden"); $("auth-panel").classList.remove("hidden"); $("profile-state").textContent = "Non connecté"; } });
  }
  document.addEventListener("DOMContentLoaded", start);
})();
