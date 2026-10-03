(() => {
  const link = document.getElementById("account-nav-link");
  if (!link || !window.supabase) return;

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
    avatar.setAttribute("aria-hidden", "true");
    Object.assign(avatar.style, {
      display: "inline-grid", width: "28px", height: "28px", placeItems: "center",
      overflow: "hidden", borderRadius: "50%", border: "1px solid currentColor",
      fontSize: ".78rem", fontWeight: "700", verticalAlign: "middle"
    });
    avatar.textContent = name.charAt(0).toUpperCase();

    if (profile?.avatar_path) {
      const { data: image } = await client.storage.from("user-avatars")
        .createSignedUrl(profile.avatar_path, 3600);
      if (image?.signedUrl) {
        const img = new Image();
        img.src = image.signedUrl;
        img.alt = "";
        Object.assign(img.style, { width: "100%", height: "100%", objectFit: "cover" });
        avatar.replaceChildren(img);
      }
    }

    link.replaceChildren(avatar, document.createTextNode(name));
    link.setAttribute("aria-label", `Compte de ${name}`);
  }).catch(() => {});
})();
