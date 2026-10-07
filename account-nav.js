(() => {
  const link = document.getElementById("account-nav-link");
  if (!link || !window.supabase) return;
  link.dataset.avatarSyncStarted = "true";

  const client = window.supabase.createClient(
    "https://bqqbciifmfbsjurkulfo.supabase.co",
    "sb_publishable_czfRsCCIui4YMjCk9ImtpQ_loqFKior"
  );

  client.auth.getSession().then(async ({ data }) => {
    const user = data.session?.user;
    if (!user) return;
    const { data: profile } = await client.from("user_profiles")
      .select("nickname,avatar_path").eq("user_id", user.id).maybeSingle();
    const name = profile?.nickname?.trim() || "Mon compte";
    const avatar = document.createElement("span");
    avatar.className = "site-shell-avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = name.charAt(0).toUpperCase();
    if (profile?.avatar_path) {
      const { data: image } = await client.storage.from("user-avatars")
        .createSignedUrl(profile.avatar_path, 3600);
      if (image?.signedUrl) {
        const img = new Image();
        img.src = image.signedUrl;
        img.alt = "";
        avatar.replaceChildren(img);
      }
    }
    link.replaceChildren(avatar);
    link.setAttribute("aria-label", `Profil de ${name}`);
    link.setAttribute("title", name);
  }).catch(() => {});
})();

