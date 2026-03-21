function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null) continue;
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k.startsWith("on") && typeof v === "function")
      node.addEventListener(k.slice(2).toLowerCase(), v);
    else node.setAttribute(k, String(v));
  }
  for (const child of Array.isArray(children) ? children : [children]) {
    if (child === null || child === undefined) continue;
    node.append(child.nodeType ? child : document.createTextNode(String(child)));
  }
  return node;
}

const MONTH_NAMES = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

const BRANDING_OVERRIDE_KEY = "sophyron-branding-month-override";

function getBrandingOverrideMonthIndex() {
  try {
    const raw = window.sessionStorage.getItem(BRANDING_OVERRIDE_KEY);
    if (raw === null) return null;
    const monthIndex = Number(raw);
    if (!Number.isInteger(monthIndex) || monthIndex < 0 || monthIndex > 11) return null;
    return monthIndex;
  } catch {
    return null;
  }
}

function setBrandingOverrideMonthIndex(monthIndex) {
  try {
    window.sessionStorage.setItem(BRANDING_OVERRIDE_KEY, String(monthIndex));
  } catch {
    // ignore session storage failures
  }
}

function clearBrandingOverrideMonthIndex() {
  try {
    window.sessionStorage.removeItem(BRANDING_OVERRIDE_KEY);
  } catch {
    // ignore session storage failures
  }
}

function getBrandingPreviewDate(date = new Date()) {
  const overrideMonthIndex = getBrandingOverrideMonthIndex();
  if (overrideMonthIndex === null) return date;
  return new Date(date.getFullYear(), overrideMonthIndex, 1);
}

function getMonthChipLabel(monthIndex) {
  const month = MONTH_NAMES[monthIndex] || MONTH_NAMES[0];
  return month.slice(0, 3).replace(/^./, (c) => c.toUpperCase());
}

function getMonthlyBranding(date = new Date()) {
  const monthIndex = date.getMonth();
  const month = MONTH_NAMES[monthIndex] || MONTH_NAMES[0];
  const monthNumber = String(monthIndex + 1).padStart(2, "0");
  const stem = `${monthNumber}-${month}.png`;

  return {
    icon: `assets/branding/icons/${stem}`,
    hero: `assets/branding/hero/${stem}`,
  };
}

function applyMonthlyBranding() {
  const previewDate = getBrandingPreviewDate();
  const branding = getMonthlyBranding(previewDate);

  document.querySelectorAll(".js-brand-icon").forEach((img) => {
    img.setAttribute("src", branding.icon);
  });

  document.querySelectorAll(".js-brand-hero").forEach((img) => {
    img.setAttribute("src", branding.hero);
  });

  const control = document.querySelector(".js-branding-debug");
  if (control) {
    const overrideMonthIndex = getBrandingOverrideMonthIndex();
    const activeMonthIndex = previewDate.getMonth();
    const label = getMonthChipLabel(activeMonthIndex);
    control.textContent = label;
    control.dataset.active = overrideMonthIndex === null ? "false" : "true";
    control.setAttribute(
      "title",
      overrideMonthIndex === null
        ? `Branding preview: ${label}. Click for next month, Shift-click for previous, double-click to reset.`
        : `Previewing ${label}. Click for next month, Shift-click for previous, double-click to reset.`
    );
  }
}

function cycleMonthlyBranding(step) {
  const currentMonthIndex = getBrandingOverrideMonthIndex() ?? new Date().getMonth();
  const nextMonthIndex = (currentMonthIndex + step + 12) % 12;
  setBrandingOverrideMonthIndex(nextMonthIndex);
  applyMonthlyBranding();
}

function mountBrandingDebugControl() {
  if (document.querySelector(".js-branding-debug")) return;

  const control = el(
    "button",
    {
      type: "button",
      class: "branding-debug js-branding-debug",
      "aria-label": "Preview monthly branding",
    },
    "Now"
  );

  control.addEventListener("click", (event) => {
    cycleMonthlyBranding(event.shiftKey ? -1 : 1);
  });

  control.addEventListener("dblclick", (event) => {
    event.preventDefault();
    clearBrandingOverrideMonthIndex();
    applyMonthlyBranding();
  });

  document.body.append(control);
  applyMonthlyBranding();
}

function formatMonthYear(isoDate) {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return new Intl.DateTimeFormat(undefined, { month: "short", year: "numeric" }).format(d);
}

function formatYear(isoDate) {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return String(d.getFullYear());
}

function formatApproxMinutes(durationStr) {
  if (!durationStr) return "";
  const parts = durationStr.split(":").map((p) => parseInt(p, 10));
  if (parts.some((n) => Number.isNaN(n))) return "";
  let seconds = 0;
  if (parts.length === 3) {
    const [h, m, s] = parts;
    seconds = h * 3600 + m * 60 + s;
  } else if (parts.length === 2) {
    const [m, s] = parts;
    seconds = m * 60 + s;
  } else if (parts.length === 1) {
    seconds = parts[0] * 60;
  }
  const minutes = Math.round(seconds / 60);
  if (!minutes) return "";
  return `~${minutes} min`;
}

function sortNewestFirst(a, b) {
  const da = new Date(a.releaseDate).getTime();
  const db = new Date(b.releaseDate).getTime();
  return (Number.isNaN(db) ? 0 : db) - (Number.isNaN(da) ? 0 : da);
}

function renderFeaturedRelease(release) {
  return el("article", { class: "featured" }, [
    el("div", { class: "cover" }, [
      el("img", {
        src: release.coverImage,
        alt: `Cover art for ${release.title}`,
        loading: "lazy",
      }),
    ]),
    el("div", { class: "featured-body" }, [
      el("div", { class: "kicker", text: "New release" }),
      el("h3", { class: "featured-title", text: release.title }),
      el("p", { class: "featured-blurb", text: release.blurb || "" }),
      el("div", { class: "meta-row" }, [
        el("div", { class: "meta" }, [
          el("div", { class: "meta-label", text: "Release" }),
          el("div", { class: "meta-value", text: formatMonthYear(release.releaseDate) }),
        ]),
        el("div", { class: "meta" }, [
          el("div", { class: "meta-label", text: "Length" }),
          el("div", { class: "meta-value", text: formatApproxMinutes(release.duration) }),
        ]),
      ]),
      el("div", { class: "cta-row" }, [
        el("a", {
          class: "btn btn-primary",
          href: release.bandcampUrl,
          target: "_blank",
          rel: "noreferrer",
        }, "Listen / Buy on Bandcamp"),
        el("a", {
          class: "btn btn-ghost",
          href: release.youtubeUrl,
          target: "_blank",
          rel: "noreferrer",
        }, "Watch on YouTube"),
      ]),
    ]),
  ]);
}

function renderReleaseCard(release) {
  const year = formatYear(release.releaseDate);
  const length = formatApproxMinutes(release.duration);
  const subtitle = length ? `${year} • ${length}` : year;

  return el("article", { class: "card" }, [
    el(
      "a",
      { class: "card-media", href: release.bandcampUrl, target: "_blank", rel: "noreferrer" },
      el("img", { src: release.coverImage, alt: `Cover art for ${release.title}`, loading: "lazy" })
    ),
    el("div", { class: "card-body" }, [
      el("div", { class: "card-title", text: release.title }),
      el("div", { class: "card-sub muted", text: subtitle }),
      el("div", { class: "card-actions" }, [
        el("a", { class: "chip", href: release.bandcampUrl, target: "_blank", rel: "noreferrer" }, "Bandcamp"),
        el("a", { class: "chip", href: release.youtubeUrl, target: "_blank", rel: "noreferrer" }, "YouTube"),
      ]),
    ]),
  ]);
}

function sortNewestVideoFirst(a, b) {
  const da = new Date(a.publishDate).getTime();
  const db = new Date(b.publishDate).getTime();
  return (Number.isNaN(db) ? 0 : db) - (Number.isNaN(da) ? 0 : da);
}

function getYouTubeVideoId(url) {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") {
      const id = u.pathname.replace(/^\/+/, "").split("/")[0];
      return id || null;
    }
    if (u.hostname.endsWith("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      const parts = u.pathname.split("/").filter(Boolean);
      const idx = parts.indexOf("shorts");
      if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
    }
  } catch {
    // ignore
  }
  return null;
}

function getYouTubeThumbnailUrl(youtubeUrl) {
  const id = getYouTubeVideoId(youtubeUrl);
  if (!id) return null;
  // Common, widely-supported thumbnail endpoint (no API key required).
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

function getVideoThumbnail(video) {
  return video.thumbnailImage || getYouTubeThumbnailUrl(video.youtubeUrl) || "assets/og-image.svg";
}

function renderFeaturedVideo(video) {
  return el("article", { class: "featured" }, [
    el("div", { class: "cover" }, [
      el("img", {
        src: getVideoThumbnail(video),
        alt: `Thumbnail for ${video.title}`,
        loading: "lazy",
      }),
    ]),
    el("div", { class: "featured-body" }, [
      el("div", { class: "kicker", text: "New video" }),
      el("h3", { class: "featured-title", text: video.title }),
      el("p", { class: "featured-blurb", text: video.blurb || "" }),
      el("div", { class: "meta-row" }, [
        el("div", { class: "meta" }, [
          el("div", { class: "meta-label", text: "Published" }),
          el("div", { class: "meta-value", text: formatMonthYear(video.publishDate) }),
        ]),
        el("div", { class: "meta" }, [
          el("div", { class: "meta-label", text: "Type" }),
          el("div", { class: "meta-value", text: video.type || "Video" }),
        ]),
      ]),
      el("div", { class: "cta-row" }, [
        el(
          "a",
          { class: "btn btn-primary", href: video.youtubeUrl, target: "_blank", rel: "noreferrer" },
          "Watch on YouTube"
        ),
      ]),
    ]),
  ]);
}

function renderVideoCard(video) {
  const year = formatYear(video.publishDate);
  const subtitle = video.type ? `${year} • ${video.type}` : year;

  return el("article", { class: "card" }, [
    el(
      "a",
      { class: "card-media", href: video.youtubeUrl, target: "_blank", rel: "noreferrer" },
      el("img", { src: getVideoThumbnail(video), alt: `Thumbnail for ${video.title}`, loading: "lazy" })
    ),
    el("div", { class: "card-body" }, [
      el("div", { class: "card-title", text: video.title }),
      el("div", { class: "card-sub muted", text: subtitle }),
      el("div", { class: "card-actions" }, [
        el("a", { class: "chip", href: video.youtubeUrl, target: "_blank", rel: "noreferrer" }, "YouTube"),
      ]),
    ]),
  ]);
}

async function loadJson(path) {
  const res = await fetch(path, { cache: "no-cache" });
  if (!res.ok) throw new Error(`Failed to load ${path} (${res.status})`);
  return await res.json();
}

async function init() {
  mountBrandingDebugControl();
  applyMonthlyBranding();

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const featuredReleaseMount = document.getElementById("featured-release-mount");
  const releaseCatalogMount = document.getElementById("release-catalog-mount");
  const featuredVideoMount = document.getElementById("featured-video-mount");
  const videoCatalogMount = document.getElementById("video-catalog-mount");

  if (featuredReleaseMount && releaseCatalogMount) {
    try {
      const releases = await loadJson("data/releases.json");
      if (!Array.isArray(releases) || releases.length === 0) throw new Error("No releases found.");
      releases.sort(sortNewestFirst);
      featuredReleaseMount.replaceChildren(renderFeaturedRelease(releases[0]));
      releaseCatalogMount.replaceChildren(...releases.map(renderReleaseCard));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      featuredReleaseMount.replaceChildren(
        el("div", { class: "muted" }, ["Could not load releases data. ", el("span", { class: "mono" }, msg)])
      );
      releaseCatalogMount.replaceChildren(
        el("div", { class: "muted" }, "Add releases to data/releases.json to populate the catalog.")
      );
    }
  }

  if (featuredVideoMount && videoCatalogMount) {
    try {
      const videos = await loadJson("data/videos.json");
      if (!Array.isArray(videos) || videos.length === 0) throw new Error("No videos found.");
      videos.sort(sortNewestVideoFirst);

      const search = new URLSearchParams(window.location.search);
      const categoryParam = (search.get("category") || "").trim().toLowerCase();
      const selectedCategory =
        categoryParam === "music" || categoryParam === "story" ? categoryParam : "all";

      const filtered =
        selectedCategory === "all"
          ? videos
          : videos.filter((v) => (v.category || "").toLowerCase() === selectedCategory);

      // Update filter UI + catalog title.
      const titleEl = document.getElementById("videos-catalog-title");
      if (titleEl) {
        const pretty =
          selectedCategory === "all"
            ? "All videos"
            : selectedCategory === "music"
              ? "Music videos"
              : "Story videos";
        titleEl.textContent = pretty;
      }

      const latestTitleEl = document.getElementById("videos-latest-title");
      if (latestTitleEl) {
        const pretty =
          selectedCategory === "all"
            ? "Latest video"
            : selectedCategory === "music"
              ? "Latest music video"
              : "Latest story video";
        latestTitleEl.textContent = pretty;
      }

      const chipAll = document.getElementById("filter-all");
      const chipMusic = document.getElementById("filter-music");
      const chipStory = document.getElementById("filter-story");
      if (chipAll) chipAll.classList.toggle("active", selectedCategory === "all");
      if (chipMusic) chipMusic.classList.toggle("active", selectedCategory === "music");
      if (chipStory) chipStory.classList.toggle("active", selectedCategory === "story");

      if (filtered.length === 0) {
        featuredVideoMount.replaceChildren(el("div", { class: "muted" }, "No videos found for this filter."));
        videoCatalogMount.replaceChildren(
          el("div", { class: "muted" }, "Add videos to the selected category in data/videos.json.")
        );
      } else {
        featuredVideoMount.replaceChildren(renderFeaturedVideo(filtered[0]));
        videoCatalogMount.replaceChildren(...filtered.map(renderVideoCard));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      featuredVideoMount.replaceChildren(
        el("div", { class: "muted" }, ["Add videos to ", el("code", {}, "data/videos.json"), " to populate this page."])
      );
      videoCatalogMount.replaceChildren(
        el("div", { class: "muted" }, ["No videos yet. When you add some, they’ll appear here. ", el("span", { class: "mono" }, msg)])
      );
    }
  }
}

init();
