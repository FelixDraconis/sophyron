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

function renderFeatured(release) {
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

function renderCard(release) {
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

async function init() {
  document.getElementById("year").textContent = new Date().getFullYear();

  const featuredMount = document.getElementById("featured-mount");
  const catalogMount = document.getElementById("catalog-mount");

  try {
    const res = await fetch("data/releases.json", { cache: "no-cache" });
    if (!res.ok) throw new Error(`Failed to load releases.json (${res.status})`);
    const releases = await res.json();
    if (!Array.isArray(releases) || releases.length === 0) throw new Error("No releases found.");

    releases.sort(sortNewestFirst);

    featuredMount.replaceChildren(renderFeatured(releases[0]));
    catalogMount.replaceChildren(...releases.map(renderCard));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    featuredMount.replaceChildren(
      el("div", { class: "muted" }, [
        "Could not load releases data. ",
        el("span", { class: "mono" }, msg),
      ])
    );
    catalogMount.replaceChildren(
      el("div", { class: "muted" }, "Add releases to data/releases.json to populate the catalog.")
    );
  }
}

init();

