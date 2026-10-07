(() => {
  const SUPABASE_URL = "https://bqqbciifmfbsjurkulfo.supabase.co";
  const SUPABASE_KEY = "sb_publishable_czfRsCCIui4YMjCk9ImtpQ_loqFKior";
  const ASSET_ROOT = "https://ieloreires.github.io/Duskclaw/";
  const client = window.supabase?.createClient(SUPABASE_URL, SUPABASE_KEY);
  const $ = (id) => document.getElementById(id);
  const state = { user: null, profile: {}, collection: [], catalog: [], roster: [], featured: [], avatar: "", theme: "water", settings: {}, editingName: false, editingBio: false };
  const themes = {
    water: ["#257f93", "#163554"], plant: ["#63844d", "#17382f"], ice: ["#90b5d1", "#263e68"],
    rock: ["#b47d55", "#3b2d29"], wind: ["#a0b5b4", "#34495b"]
  };
  const say = (node, message, error = false) => { if (node) { node.textContent = message || ""; node.classList.toggle("error", error); } };
  const message = (text, error = false) => { say($("page-message"), text, error); $("page-message")?.classList.toggle("hidden", !text); };
  const esc = (value) => String(value ?? "");
  const displayDate = (date) => date ? new Intl.DateTimeFormat("fr-FR", { month: "short", year: "numeric" }).format(new Date(date)) : "2026";

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
    const chips = $("hero-chips"); chips.replaceChildren();
    [state.profile.community_role, state.profile.favorite_type].filter(Boolean).forEach((label) => { const chip = document.createElement("span"); chip.className = "hero-chip"; chip.textContent = label; chips.append(chip); });
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
    $("profile-facts").replaceChildren();
    [["Rôle", role], ["Furry favori", furry?.displayName || "À choisir"], ["Type", type || "À choisir"]].forEach(([label, value]) => {
      const row = document.createElement("span"); row.className = "fact-row"; const b = document.createElement("strong"); row.textContent = label; b.textContent = value; row.append(b); $("profile-facts").append(row);
    });
    $("hero-tagline").textContent = state.profile.banner_settings?.tagline || "Choisis ta voie, écris ton histoire.";
  }
  function badge(title, note, icon) {
    const tile = document.createElement("article"); tile.className = "badge earned";
    const seal = document.createElement("span"); seal.textContent = icon; const copy = document.createElement("div");
    const strong = document.createElement("b"); strong.textContent = title; const small = document.createElement("small"); small.textContent = note;
    copy.append(strong, small); tile.append(seal, copy); return tile;
  }
  function renderBadges() {
    const count = state.collection.length, badgeList = $("badge-list"); badgeList.replaceChildren();
    const known = [
      ["Premier pas", count > 0, "Première carte obtenue", "✦"], ["Curiosité", count >= 5, "5 cartes réunies", "⌕"],
      ["Collectionneur", count >= 20, "20 cartes réunies", "❖"], ["Cartographe", state.profile.favorite_furry_id, "Furry favori choisi", "⌖"]
    ];
    known.filter((item) => item[1]).forEach((item) => badgeList.append(badge(item[0], item[2], item[3])));
    if (!badgeList.children.length) badgeList.append(badge("À découvrir", "Tes premiers accomplissements apparaîtront ici", "✧"));
    $("stat-badges").textContent = String(known.filter((item) => item[1]).length);
  }
  function cardTitle(card) { return card?.label?.replace(/^#\d+\s*·\s*/, "") || `Carte #${card?.id ?? "?"}`; }
  function cardNode(card, remove = false) {
    const item = document.createElement("article"); item.className = "featured-card";
    const art = document.createElement("div"); art.className = "showcase-art"; art.dataset.type = card.type || "";
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
    if (!cards.length) { const empty = document.createElement("p"); empty.className = "empty-showcase"; empty.textContent = "Ta vitrine attend ses premières cartes."; gallery.append(empty); }
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
    furrySelect.value = state.profile.favorite_furry_id || ""; $("favorite-type").value = state.profile.favorite_type || "";
    $("profile-visibility").value = state.profile.profile_visibility || "public"; $("collection-visibility").value = state.profile.collection_visibility || "private"; $("wishlist-visibility").value = state.profile.wishlist_visibility || "private";
    $("profile-bio").value = state.profile.bio || ""; $("bio-display").textContent = state.profile.bio || "Ajoute quelques mots pour te présenter."; $("bio-display").classList.toggle("empty", !state.profile.bio); $("bio-count").value = String((state.profile.bio || "").length);
    $("stat-cards").textContent = String(state.collection.length); $("stat-level").textContent = String(Math.max(1, Math.floor(state.collection.length / 5) + 1)).padStart(2, "0"); $("stat-since").textContent = displayDate(state.profile.community_since || user.created_at);
    setAvatar(await signedAvatar(state.profile.avatar_path), $("welcome-name").textContent);
    populateSettings(); renderFacts(); renderBadges(); renderFeatured();
    const nav = $("moderation-nav-link");
    const { data: isModerator } = await client.rpc("is_site_moderator");
    if (isModerator === true) nav.classList.remove("hidden");
    $("profile-state").textContent = "Profil synchronisé";
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
    const { error } = await client.from("user_profiles").upsert(payload, { onConflict: "user_id" });
    button.disabled = false;
    if (error) { say($("save-message"), error.message || "Impossible d’enregistrer le profil.", true); return; }
    state.profile = { ...state.profile, ...payload }; renderFacts(); renderBadges(); say($("save-message"), "Profil enregistré.");
  }
  function setEditingName(active) { state.editingName = active; $("welcome-name").classList.toggle("hidden", active); $("edit-nickname").classList.toggle("hidden", active); $("nickname-input").classList.toggle("hidden", !active); if (active) { $("nickname-input").value = $("welcome-name").textContent; $("nickname-input").focus(); } }
  function finishName() { const value = $("nickname-input").value.trim(); if (value.length >= 2 && value.length <= 15) $("welcome-name").textContent = value; setEditingName(false); }
  async function uploadAvatar(file) {
    if (!file || !state.user) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 10 * 1024 * 1024) { message("Choisis une image JPG, PNG ou WebP de 10 Mo maximum.", true); return; }
    message("Mise à jour de la photo…");
    const ext = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1]; const path = `${state.user.id}/avatar-${Date.now()}.${ext}`;
    const { error: uploadError } = await client.storage.from("user-avatars").upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) { message(uploadError.message || "Échec du téléversement.", true); return; }
    const { error } = await client.from("user_profiles").upsert({ user_id: state.user.id, nickname: $("welcome-name").textContent.trim(), avatar_path: path }, { onConflict: "user_id" });
    if (error) { message(error.message || "La photo n’a pas pu être associée au profil.", true); return; }
    state.profile.avatar_path = path; const url = await signedAvatar(path); setAvatar(url, $("welcome-name").textContent); message("");
  }
  function bind() {
    $("avatar-edit").addEventListener("click", () => $("avatar-file").click()); $("avatar-pencil").addEventListener("click", () => $("avatar-file").click());
    $("avatar-file").addEventListener("change", (event) => uploadAvatar(event.target.files?.[0]));
    $("edit-nickname").addEventListener("click", () => setEditingName(true)); $("nickname-input").addEventListener("keydown", (e) => { if (e.key === "Enter") finishName(); if (e.key === "Escape") setEditingName(false); }); $("nickname-input").addEventListener("blur", finishName);
    $("tagline-setting").addEventListener("input", () => { $("tagline-input").value = $("tagline-setting").value; $("hero-tagline").textContent = $("tagline-setting").value || "Choisis ta voie, écris ton histoire."; });
    $("tagline-input").addEventListener("input", () => { $("tagline-setting").value = $("tagline-input").value; $("hero-tagline").textContent = $("tagline-input").value || "Choisis ta voie, écris ton histoire."; });
    $("toggle-bio").addEventListener("click", () => { state.editingBio = !state.editingBio; $("bio-editor").classList.toggle("hidden", !state.editingBio); $("bio-display").classList.toggle("hidden", state.editingBio); $("profile-bio").focus(); });
    $("profile-bio").addEventListener("input", () => { $("bio-count").value = String($("profile-bio").value.length); $("bio-display").textContent = $("profile-bio").value || "Ajoute quelques mots pour te présenter."; $("bio-display").classList.toggle("empty", !$("profile-bio").value); });
    $("add-featured").addEventListener("click", () => { renderPicker(); $("featured-dialog").showModal(); }); $("close-picker").addEventListener("click", () => $("featured-dialog").close()); $("featured-dialog").addEventListener("click", (e) => { if (e.target === $("featured-dialog")) $("featured-dialog").close(); });
    document.querySelectorAll(".tab[data-tab]").forEach((tab) => tab.addEventListener("click", () => { document.querySelectorAll(".tab[data-tab]").forEach((el) => { const active = el === tab; el.classList.toggle("active", active); el.setAttribute("aria-selected", String(active)); }); document.querySelectorAll(".tab-panel").forEach((el) => el.classList.toggle("active", el.id === `panel-${tab.dataset.tab}`)); }));
    document.querySelectorAll("[data-theme-choice]").forEach((button) => button.addEventListener("click", () => { state.theme = button.dataset.themeChoice; const [a, b] = themes[state.theme]; $("banner-color").value = a; $("banner-color2").value = b; readSettings(); document.querySelectorAll("[data-theme-choice]").forEach((el) => el.setAttribute("aria-pressed", String(el === button))); }));
    ["banner-color", "banner-color2", "banner-glow-color", "accent-color", "banner-pattern", "profile-layout"].forEach((id) => $(id).addEventListener("input", readSettings));
    document.querySelectorAll("[data-setting]").forEach((input) => input.addEventListener("input", () => { updateRange(input); readSettings(); }));
    $("community-role").addEventListener("change", () => { state.profile.community_role = $("community-role").value; renderFacts(); }); $("favorite-furry").addEventListener("change", () => { state.profile.favorite_furry_id = $("favorite-furry").value; renderFacts(); renderBadges(); }); $("favorite-type").addEventListener("change", () => { state.profile.favorite_type = $("favorite-type").value; renderFacts(); });
    $("save-profile").addEventListener("click", saveProfile);
    $("logout-button").addEventListener("click", async () => { await client.auth.signOut(); });
    $("login-form").addEventListener("submit", async (event) => { event.preventDefault(); say($("login-message"), "Connexion…"); const form = new FormData(event.currentTarget); const { error } = await client.auth.signInWithPassword({ email: form.get("email"), password: form.get("password") }); say($("login-message"), error?.message || "", !!error); if (!error) { const redirect = new URLSearchParams(location.search).get("redirect"); if (redirect && /^[a-z0-9-]+\.html$/i.test(redirect)) location.assign(redirect); } });
    $("signup-form").addEventListener("submit", async (event) => { event.preventDefault(); say($("signup-message"), "Création du compte…"); const form = new FormData(event.currentTarget); const nickname = String(form.get("nickname")).trim(); const { data, error } = await client.auth.signUp({ email: form.get("email"), password: form.get("password"), options: { data: { nickname }, emailRedirectTo: `${location.origin}${location.pathname}` } }); if (error) { say($("signup-message"), error.message, true); return; } if (data.user && data.session) await client.from("user_profiles").upsert({ user_id: data.user.id, nickname }, { onConflict: "user_id" }); say($("signup-message"), data.session ? "Compte créé, bienvenue !" : "Vérifie ta boîte mail pour confirmer ton compte."); });
    $("forgot-password").addEventListener("click", async () => { const email = $("login-form").elements.email.value.trim(); if (!email) { say($("login-message"), "Saisis ton adresse e-mail avant de demander un lien.", true); return; } const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}${location.pathname}` }); say($("login-message"), error?.message || "Un lien de réinitialisation vient d’être envoyé.", !!error); });
  }
  async function start() {
    if (!client) { $("profile-state").textContent = "Connexion indisponible"; message("Le service de compte n’est pas disponible pour le moment.", true); return; }
    bind();
    const { data: { session } } = await client.auth.getSession();
    if (session?.user) { try { await loadProfile(session.user); } catch (error) { console.error(error); $("profile-state").textContent = "Profil partiellement chargé"; message("Impossible de charger toutes les données du profil. Tes autres pages restent accessibles.", true); } }
    else { $("profile-state").textContent = "Non connecté"; $("auth-panel").classList.remove("hidden"); }
    client.auth.onAuthStateChange((_event, sessionNext) => { if (sessionNext?.user && sessionNext.user.id !== state.user?.id) setTimeout(() => loadProfile(sessionNext.user).catch((error) => { console.error(error); message("Impossible de charger le profil.", true); }), 0); else if (!sessionNext?.user) { state.user = null; $("logout-button").classList.add("hidden"); $("account-panel").classList.add("hidden"); $("auth-panel").classList.remove("hidden"); $("profile-state").textContent = "Non connecté"; } });
  }
  document.addEventListener("DOMContentLoaded", start);
})();
