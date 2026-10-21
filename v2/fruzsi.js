/* ==========================================================================
   Fruzsinails v2 – „Lookbook” réteg a termék site.js-e után
   Minden itt indul, miután a site.js kirajzolta a lapot (html.pv-ready).
   Kézjegy: színkártya a heróban – a lookbook első mintái körömtipként, a
   tip színe a fotóból mintázva (új ügyfélnél sincs mit beállítani). A minta
   receptje (szolgáltatás · idő · ár) a site.json galéria-tételének `text`
   mezőjéből és a foglalás szolgáltatásaiból jön, így sosem mond mást.
   ========================================================================== */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
  const norm = (s) => String(s ?? "").toLowerCase().replace(/\s+/g, " ").trim();
  const huf = (v) => (Number(v) ? Number(v).toLocaleString("hu-HU") + " Ft" : "");
  /* a site.js a beállítást zárt hatókörben tartja – innen olvassuk (a böngésző
     a már letöltött site.json-t adja vissza) */
  const config = fetch("site.json").then((r) => r.json()).catch(() => ({}));
  const RAIL = 8;                                     /* ennyi minta a színkártyán */
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- Szóvédjegy a fejlécben: ugyanaz a dőlt „nails”, mint a heróban ----- */
  function brand() {
    const h1 = $("#pv-company"), sm = $("#pv-company-sm");
    if (h1 && sm && h1.querySelector("em")) sm.innerHTML = h1.innerHTML;
  }

  /* --- Menü: oldalsáv (fotó, elérhetőség, foglalás), görgetés zárolva ----- */
  /* a menüpont képe: a célszekció első fotója – új szekciónál sem kell kézzel párosítani */
  const sectionImg = (href) => {
    const sec = href && href.startsWith("#") ? $(href) : null;
    return (sec && $$("img", sec).map((i) => i.getAttribute("src")).find((s) => s && !s.startsWith("data:"))) || "";
  };
  function menu() {
    const burger = $("#pv-burger"), nav = $("#pv-nav");
    if (!nav) return;
    if (!$(".fz-menu-aside", nav)) {
      const tel = $("#pv-topbar-phone"), addr = $("#pv-topbar-addr"), open = $("#pv-topbar-status");
      const first = sectionImg("#sec-about") || sectionImg("#sec-services");
      const aside = document.createElement("div");
      aside.className = "pv-nav__item fz-menu-aside";
      aside.innerHTML =
        (first ? `<figure class="fz-menu-img"><img src="${esc(first)}" alt="" decoding="async"></figure>` : "") +
        `<div class="fz-menu-info">` +
        (open && !open.hidden && open.textContent.trim() ? `<strong>${esc(open.textContent.trim())}</strong>` : "") +
        (addr && addr.textContent.trim() ? `<span>${esc(addr.textContent.trim())}</span>` : "") +
        (tel && tel.textContent.trim() ? `<a href="${esc(tel.getAttribute("href"))}">${esc(tel.textContent.trim())}</a>` : "") +
        `</div><a class="fz-menu-book" href="#sec-booking">Időpontot foglalok</a>`;
      nav.append(aside);
      /* asztalon a fölé vitt pont a saját szekciója képét mutatja */
      const fig = $(".fz-menu-img", aside), pic = fig && $("img", fig);
      let want = first, timer;
      nav.addEventListener("pointerover", (e) => {
        const a = e.target.closest(".pv-nav__top");
        const src = a && sectionImg(a.getAttribute("href"));
        if (!pic || !src || src === want) return;
        want = src;
        fig.classList.add("is-swap");
        clearTimeout(timer);
        timer = setTimeout(() => { pic.src = want; fig.classList.remove("is-swap"); }, 260);
      });
    }
    if (!burger) return;
    new MutationObserver(() => {
      document.documentElement.classList.toggle("fz-menu", burger.getAttribute("aria-expanded") === "true");
    }).observe(burger, { attributes: true, attributeFilter: ["aria-expanded"] });
  }

  /* --- Recept: a galéria-tétel `text` mezője → a foglalás szolgáltatása ---- */
  const recipeOf = (text, book) => {
    const s = book.find((b) => norm(b.name) === norm(text));
    const from = s?.price ? `${huf(s.price)}-tól` : "";
    return {
      id: s?.id || "",
      line: [text, s?.durationMin ? `${s.durationMin} perc` : "", from].filter(Boolean).join(" · "),
      short: [text, from].filter(Boolean).join(" · "),     /* a keskeny lookbook-hasábba */
    };
  };
  const wantLink = (id) => `<a class="fz-want" href="#sec-booking"${id ? ` data-service="${esc(id)}"` : ""}>Ezt kérem <span aria-hidden="true">→</span></a>`;

  /* --- Szolgáltatás-kártyák: időtartam és ár a foglalás adataiból ---------- */
  function services(book) {
    $$("#pv-items > li").forEach((li) => {
      const body = $(".pv-item__body", li);
      if (!body) return;
      $$(".fz-meta, .fz-want", body).forEach((el) => el.remove());
      const s = book.find((b) => norm(b.name) === norm($("h3", body)?.textContent));
      const tags = s ? [s.durationMin ? `${s.durationMin} perc` : "", s.price ? `${huf(s.price)}-tól` : ""].filter(Boolean) : [];
      body.insertAdjacentHTML("beforeend",
        (tags.length ? `<p class="fz-meta">${tags.map((t) => `<span class="fz-tag">${esc(t)}</span>`).join("")}</p>` : "") + wantLink(s?.id));
    });
  }

  /* --- Árlista: kategóriánként csoport, élén a dőlt cím -------------------- */
  function pricing() {
    const list = $("#pv-prices");
    if (!list || $(".fz-cat-group", list)) return;
    const groups = new Map();
    $$(":scope > li[data-cat]", list).forEach((li) => {
      const cat = li.dataset.cat;
      if (!cat) return;
      if (!groups.has(cat)) {
        const g = document.createElement("li");
        g.className = "fz-cat-group";
        g.dataset.cat = cat;
        g.innerHTML = `<h3>${esc(cat)}</h3><ul class="fz-cat-list"></ul>`;
        li.before(g);
        groups.set(cat, $(".fz-cat-list", g));
      }
      groups.get(cat).append(li);
    });
  }

  /* --- Fotóból tip-szín: a legtelítettebb árnyalat-csoport átlaga ----------
     A bőr, a szürke és a halvány háttér alig számít, így a köröm színe nyer.
     Ha semmi nem marad (natúr francia), nude. Ahol a fotó félrevezet (kék
     póló a háttérben), a galéria-tétel `color` mezője dönt. */
  function tint(img) {
    try {
      const w = 48, h = 60, cv = document.createElement("canvas");
      cv.width = w; cv.height = h;
      const cx = cv.getContext("2d", { willReadFrequently: true });
      cx.drawImage(img, 0, 0, w, h);
      const px = cx.getImageData(0, 0, w, h).data, bins = new Map();
      for (let i = 0; i < px.length; i += 4) {
        const r = px[i] / 255, g = px[i + 1] / 255, b = px[i + 2] / 255;
        const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
        if (!d || l < 0.1 || l > 0.93) continue;
        const s = d / (1 - Math.abs(2 * l - 1));
        if (s < 0.3) continue;
        let hue = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
        hue = (hue * 60 + 360) % 360;
        const skin = hue >= 5 && hue < 45 && (s < 0.8 || l > 0.68);
        const pale = l > 0.72 && d < 0.3;
        const wt = s * s * (0.4 + l) * (skin ? 0.02 : 1) * (pale ? 0.15 : 1);
        const k = Math.floor(hue / 15), bin = bins.get(k) || { w: 0, r: 0, g: 0, b: 0 };
        bin.w += wt; bin.r += px[i] * wt; bin.g += px[i + 1] * wt; bin.b += px[i + 2] * wt;
        bins.set(k, bin);
      }
      const top = [...bins.values()].sort((a, b) => b.w - a.w)[0];
      return top && top.w > 2 ?`rgb(${[top.r, top.g, top.b].map((v) => Math.round(v / top.w)).join(" ")})` : "";
    } catch { return ""; }
  }

  /* --- Kézjegy: színkártya a heróban --------------------------------------- */
  function look(looks) {
    const media = $("#sec-hero .pv-hero__media");
    if (!media || looks.length < 2 || $(".fz-look", media)) return;
    const box = document.createElement("div");
    box.className = "fz-look";
    box.innerHTML =
      `<div class="fz-look__frame"><img class="is-on" alt="" fetchpriority="high" decoding="async"><img alt="" decoding="async"></div>` +
      `<p class="fz-rail__hint" aria-hidden="true">Koppints egy mintára</p>` +
      `<div class="fz-rail" role="group" aria-label="Válassz mintát Fruzsi munkái közül">` +
      looks.map((l, k) => `<button type="button" class="fz-tip" aria-pressed="${k ? "false" : "true"}" aria-label="${esc(l.name)}"></button>`).join("") +
      `<a class="fz-rail__more" href="#sec-gallery">Mind a ${$$("#sec-gallery .pv-item").length || looks.length}</a></div>` +
      `<div class="fz-look__cap" aria-live="polite"><p class="fz-look__name"></p><p class="fz-look__spec"></p><span class="fz-look__go"></span></div>`;
    media.append(box);
    media.classList.add("fz-on");
    const imgs = $$(".fz-look__frame img", box), tips = $$(".fz-tip", box);
    let at = -1, front = 0;
    const show = (k) => {
      if (k === at) return;
      at = k;
      const l = looks[k];
      tips.forEach((t, i) => t.setAttribute("aria-pressed", String(i === k)));
      $(".fz-look__name", box).textContent = l.name;
      $(".fz-look__spec", box).textContent = l.recipe.line;
      $(".fz-look__go", box).outerHTML = `<span class="fz-look__go">${wantLink(l.recipe.id)}</span>`;
      const back = imgs[1 - front];
      back.alt = l.name;
      back.onload = () => { back.classList.add("is-on"); imgs[front].classList.remove("is-on"); front = 1 - front; };
      back.src = l.src;
      if (back.complete && back.naturalWidth) back.onload();
    };
    /* az első kép azonnal a látható rétegre – nincs átúszás a betöltéskor */
    imgs[0].src = looks[0].src;
    imgs[0].alt = looks[0].name;
    at = 0;
    $(".fz-look__name", box).textContent = looks[0].name;
    $(".fz-look__spec", box).textContent = looks[0].recipe.line;
    $(".fz-look__go", box).outerHTML = `<span class="fz-look__go">${wantLink(looks[0].recipe.id)}</span>`;
    tips.forEach((t, k) => t.addEventListener("click", () => show(k)));
    /* nyilakkal is lapozható a sor */
    $(".fz-rail", box).addEventListener("keydown", (e) => {
      const i = tips.indexOf(e.target), d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (i < 0 || !d) return;
      e.preventDefault();
      const n = (i + d + tips.length) % tips.length;
      tips[n].focus();
      show(n);
    });
    /* a tipek színe a lap betöltése után – a képek a lookbookban úgyis kellenek */
    const paint = () => looks.forEach((l, k) => {
      if (l.color) return tips[k].style.setProperty("--c", l.color);
      const im = new Image();
      im.decoding = "async";
      im.onload = () => { const c = tint(im); if (c) tips[k].style.setProperty("--c", c); };
      im.src = l.src;
    });
    if (document.readyState === "complete") (window.requestIdleCallback || setTimeout)(paint);
    else addEventListener("load", () => (window.requestIdleCallback || setTimeout)(paint), { once: true });
  }

  /* --- Lookbook: recept a kép alá, nagyításban „Ezt kérem” ------------------ */
  function gallery(recipes) {
    const list = $("#sec-gallery .pv-items");
    if (!list) return;
    $$(".pv-item", list).forEach((li) => {
      const name = $(".pv-item__cap", li)?.textContent.trim();
      const r = recipes.get(norm(name)), img = $("img", li);
      if (img && !img.alt && name) img.alt = name;          /* a termék üresen hagyja */
      if (r?.short && !$(".fz-recipe", li)) li.insertAdjacentHTML("beforeend", `<p class="fz-recipe">${esc(r.short)}</p>`);
    });
    zoom(list, recipes);
  }

  /* Natív <dialog>: felső réteg, Esc zár, a fókusz visszatér a képre. A képre
     vagy a háttérre kattintva zár; az „Ezt kérem” a foglaláshoz visz. */
  function zoom(list, recipes) {
    const lb = document.createElement("dialog");
    lb.className = "fz-lb";
    lb.setAttribute("aria-label", "Nagyított kép");
    document.body.append(lb);
    lb.addEventListener("click", (e) => { if (!e.target.closest("figcaption") || e.target.closest(".fz-want")) lb.close(); });
    $$(".pv-item__media", list).forEach((m) => {
      m.tabIndex = 0;
      m.setAttribute("role", "button");
      m.setAttribute("aria-label", "Nagyítás: " + ($(".pv-item__cap", m)?.textContent.trim() || "kép"));
    });
    const open = (m) => {
      const img = $("img", m);
      if (!img) return;
      const cap = $(".pv-item__cap", m)?.textContent.trim() || "", r = recipes.get(norm(cap));
      lb.innerHTML = `<figure><img src="${esc(img.currentSrc || img.src)}" alt="${esc(cap)}">` +
        `<figcaption>${cap ? `<b>${esc(cap)}</b>` : ""}${r?.line ? `<small>${esc(r.line)}</small>` : ""}${wantLink(r?.id)}</figcaption></figure>`;
      lb.showModal();
    };
    list.addEventListener("click", (e) => { const m = e.target.closest(".pv-item__media"); if (m) open(m); });
    list.addEventListener("keydown", (e) => {
      if ((e.key === "Enter" || e.key === " ") && e.target.matches(".pv-item__media")) { e.preventDefault(); open(e.target); }
    });
  }

  /* --- Rólam: az első mondat nagy, dőlt bevezető ---------------------------- */
  function about() {
    const p = $("#pv-about");
    if (!p || $(".fz-lede", p) || !p.firstChild || p.firstChild.nodeType !== 3) return;
    const t = p.firstChild.textContent, m = t.match(/^[^.!?]+[.!?]\s*/);
    if (!m) return;
    const lede = document.createElement("span");
    lede.className = "fz-lede";
    lede.textContent = m[0].trim();
    p.firstChild.textContent = t.slice(m[0].length);
    p.prepend(lede);
  }

  /* --- Próbapad: öt tip a mintapálcán – forma, szín, felület ---------------
     A króm / cat-eye fénycsíkja az ujjat követi (--x). Az „Ezt kérem” a
     formához illő szolgáltatást választja ki a varázslóban. */
  const SHAPES = { mandula: "Mandula", szogletes: "Szögletes", kocka: "Kocka", stiletto: "Stiletto" };
  const FINISH = { fenyes: "Fényes", matt: "Matt", krom: "Króm", cateye: "Cat-eye" };
  const COLORS = [["Neon fukszia", "#f5428f"], ["Bordó", "#6e1a2c"], ["Óceánkék", "#2e5d8a"], ["Natúr rózsa", "#e9c3b8"], ["Piros", "#b3141c"], ["Sötétlila", "#4a2460"], ["Tejfehér", "#f3ece6"]];
  function tryOn(book) {
    if ($("#sec-probapad")) return;
    const id = (name) => book.find((b) => norm(b.name) === norm(name))?.id || "";
    const chips = (key, map, on) => Object.entries(map).map(([k, v]) =>
      `<button type="button" class="fz-chip" data-${key}="${k}" aria-pressed="${k === on}">${v}</button>`).join("");
    const sec = document.createElement("section");
    sec.className = "pv-section fz-try";
    sec.id = "sec-probapad";
    sec.style.order = "3";                              /* a hero után, a szolgáltatások előtt */
    sec.innerHTML = `<div class="pv-wrap">
      <header class="pv-head"><p class="pv-eyebrow"><span>Próbapad</span></p><h2>Próbáld fel, <em>mielőtt kéred</em></h2>
      <p class="pv-muted">Válassz formát, színt és felületet – a mintapálcán rögtön látod. Króm és cat-eye felületnél húzd az ujjad a tipeken.</p></header>
      <div class="fz-stick" data-shape="mandula" data-finish="krom" aria-hidden="true">${"<i></i>".repeat(5)}</div>
      <div class="fz-try__ctl">
        <div class="fz-chips" role="group" aria-label="Forma">${chips("shape", SHAPES, "mandula")}</div>
        <div class="fz-swatches" role="group" aria-label="Szín">${COLORS.map((c, k) =>
          `<button type="button" class="fz-sw" style="--c:${c[1]}" aria-label="${c[0]}" aria-pressed="${!k}"></button>`).join("")}</div>
        <div class="fz-chips" role="group" aria-label="Felület">${chips("finish", FINISH, "krom")}</div>
      </div>
      <p class="fz-try__out" aria-live="polite"></p>
      <span class="fz-try__go"></span>
    </div>`;
    $("#sec-hero").after(sec);
    const stick = $(".fz-stick", sec);
    let color = COLORS[0];
    const sync = () => {
      stick.style.setProperty("--c", color[1]);
      const shape = stick.dataset.shape, svc = shape === "kocka" || shape === "stiletto" ? "Műköröm építés" : "Géllakk";
      $(".fz-try__out", sec).innerHTML = `<b>${esc(color[0])}, ${SHAPES[shape].toLowerCase()}</b> · ${FINISH[stick.dataset.finish].toLowerCase()} felület · ${svc}`;
      $(".fz-try__go", sec).innerHTML = wantLink(id(svc));
    };
    sec.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      $$("button", b.parentElement).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      if (b.dataset.shape) stick.dataset.shape = b.dataset.shape;
      if (b.dataset.finish) stick.dataset.finish = b.dataset.finish;
      if (b.matches(".fz-sw")) color = COLORS[$$(".fz-sw", sec).indexOf(b)];
      sync();
    });
    const follow = (e) => { const r = stick.getBoundingClientRect(); stick.style.setProperty("--x", Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)).toFixed(3)); };
    stick.addEventListener("pointermove", follow);
    stick.addEventListener("pointerdown", follow);
    sync();
  }

  /* --- Sötét lookbook: a kép helyben marad, görgetésre cserélődik alatta ---- */
  function scrolly(looks) {
    const wrap = $("#sec-gallery .pv-wrap"), list = $("#sec-gallery .pv-items");
    if (!wrap || !list || looks.length < 3 || $(".fz-scrolly", wrap)) return;
    const box = document.createElement("div");
    box.className = "fz-scrolly";
    box.style.setProperty("--n", looks.length);
    box.innerHTML = `<div class="fz-scrolly__stage"><div class="fz-scrolly__frame">${looks.map((l, k) =>
      `<img src="${esc(l.src)}" alt="${esc(l.name)}" loading="lazy" decoding="async"${k ? "" : ' class="is-on"'}>`).join("")}</div>
      <p class="fz-scrolly__cap" aria-live="polite"></p><p class="fz-scrolly__count" aria-hidden="true"></p></div>`;
    list.before(box);
    const imgs = $$("img", box), cap = $(".fz-scrolly__cap", box), cnt = $(".fz-scrolly__count", box);
    let at = -1;
    const show = (k) => {
      if (k === at) return;
      at = k;
      imgs.forEach((im, i) => im.classList.toggle("is-on", i === k));
      cap.innerHTML = `${esc(looks[k].name)}<small>${esc(looks[k].recipe?.line || "")}</small>`;
      cnt.textContent = `${String(k + 1).padStart(2, "0")} / ${String(looks.length).padStart(2, "0")}`;
    };
    const sync = () => {
      const r = box.getBoundingClientRect(), run = Math.max(1, r.height - innerHeight);
      show(Math.min(looks.length - 1, Math.max(0, Math.floor((-r.top / run) * looks.length))));
    };
    addEventListener("scroll", () => requestAnimationFrame(sync), { passive: true });
    sync();
  }

  /* --- Rólam: a bevezető mondat szóról szóra telik meg görgetésre ---------- */
  function kinetic() {
    const lede = $(".fz-lede");
    if (!lede || calm || lede.dataset.kin) return;
    lede.dataset.kin = "1";
    lede.setAttribute("aria-label", lede.textContent);
    lede.innerHTML = lede.textContent.split(" ").map((w) => `<span aria-hidden="true">${esc(w)}</span>`).join(" ");
    const words = $$("span", lede);
    const fill = () => {
      const r = lede.getBoundingClientRect(), vh = innerHeight;
      const n = Math.round(Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (vh * 0.5))) * words.length);
      words.forEach((w, i) => w.classList.toggle("is-on", i < n));
    };
    addEventListener("scroll", () => requestAnimationFrame(fill), { passive: true });
    fill();
  }

  /* --- Lábléc: óriás szóvédjegy, a króm fénye a mutatót követi ------------- */
  function giant() {
    const ft = $(".pv-footer"), h1 = $("#pv-company");
    if (!ft || !h1 || $(".fz-giant", ft)) return;
    const g = document.createElement("p");
    g.className = "fz-giant";
    g.setAttribute("aria-hidden", "true");
    g.innerHTML = h1.innerHTML;
    ft.prepend(g);
    ft.addEventListener("pointermove", (e) => { const r = g.getBoundingClientRect(); g.style.setProperty("--x", ((e.clientX - r.left) / r.width).toFixed(3)); });
  }

  function build() {
    brand();
    menu();
    pricing();
    about();
    /* „Ezt kérem": a varázslóban ki is választja a szolgáltatást, így a látogató
       egyből az időpontoknál nyit (ha a varázsló az 1. lépésen áll) */
    document.addEventListener("click", (e) => {
      const id = e.target.closest(".fz-want[data-service]")?.dataset.service;
      if (id) $$("#bk-root [data-service]").find((b) => b.dataset.service === id)?.click();
    });
    config.then((cfg) => {
      const c = cfg?.content || {}, book = c.booking?.services || [];
      services(book);
      const items = (c.lists?.gallery || []).filter((g) => g.image);
      const recipes = new Map(items.map((g) => [norm(g.name), recipeOf(g.text, book)]));
      const src = (s) => (/^(https?:|data:|\/|\.)/.test(s) ? s : "images/" + s);
      const looks = items.map((g) => ({ name: g.name, src: src(g.image), color: g.color, recipe: recipes.get(norm(g.name)) }));
      look(looks.slice(0, RAIL));
      tryOn(book);
      scrolly(looks.slice(RAIL, RAIL + 5));               /* a színkártyán nem szereplő munkák */
      gallery(recipes);
      kinetic();
      giant();
    });
  }

  const html = document.documentElement;
  if (html.classList.contains("pv-ready")) build();
  else new MutationObserver((_, obs) => {
    if (!html.classList.contains("pv-ready")) return;
    obs.disconnect();
    build();
  }).observe(html, { attributes: true, attributeFilter: ["class"] });
})();
