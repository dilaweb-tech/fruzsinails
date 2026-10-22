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
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  /* Egy közös görgetés-ütem: képkockánként EGY rAF, előbb minden mérés, utána
     minden írás – így a feladatok nem kényszerítenek egymásra újratördelést.
     A feladat mér, és ha változás kell, egy író függvényt ad vissza.
     Teljesítmény: görgetés közben NEM `is-on` (a pv.css `.pv:has(.pv-cta-bar.is-on)`
     miatt minden `is-on` váltás az egész lapot újraszámolja), hanem `is-lit`; és
     CSS-változó sosem a <html>-re, csak arra az elemre, amelyik használja. */
  const jobs = [];
  let ticking = false;
  const tick = () => { ticking = false; jobs.map((j) => j()).forEach((w) => w && w()); };
  const onScroll = (job) => {
    if (!jobs.length) addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(tick); } }, { passive: true });
    jobs.push(job);
    job()?.();
  };

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
        `</div>`;
      /* a foglalás a menüpontok között (az alsó CTA-sáv helyett) */
      const book = document.createElement("div");
      book.className = "pv-nav__item fz-nav-book";
      book.innerHTML = `<a class="pv-nav__top" href="#sec-booking">Időpontfoglalás</a>`;
      nav.append(book, aside);
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

  /* --- Hero-kép: egy fotó (site.json „Hero” képhely), erre épül a nyitás ---- */
  function look(hero) {
    const media = $("#sec-hero .pv-hero__media");
    if (!media || !hero?.src || $(".fz-look", media)) return;
    const box = document.createElement("div");
    box.className = "fz-look";
    box.innerHTML = `<div class="fz-look__frame"><img class="is-lit" src="${esc(hero.src)}" alt="${esc(hero.alt || "")}" fetchpriority="high" decoding="async"></div>`;
    media.append(box);
    media.classList.add("fz-on");
    intro(box);
  }

  /* --- Nyitás: makró → köröm ------------------------------------------------
     Kitűzött színpad (.fz-pin): belépéskor a köröm-ablak a teljes képernyőre
     nagyítva (közeli a lakkra), rajta fehér, óriás név. Görgetésre (--p 0→1)
     az ablak a helyére húzódik, a szavak a helyükre úsznak és meggyre váltanak.
     Csak scale/translate/opacity mozog. */
  function intro(box) {
    const sec = $("#sec-hero"), h1 = $("#pv-company"), inner = $(".pv-hero__inner", sec || document);
    if (!sec || !h1 || !inner || $(".fz-pin", sec)) return;
    const em = h1.querySelector("em"), b = em?.textContent.trim() || "", a = h1.textContent.replace(b, "").trim();
    const word = (t, cls, it) => `<span class="fz-w ${cls}"><span class="fz-w__ink">${it ? `<em>${esc(t)}</em>` : esc(t)}</span>` +
      `<span class="fz-w__light" aria-hidden="true">${esc(t)}</span></span>`;
    h1.setAttribute("aria-label", a + b);
    h1.innerHTML = word(a, "fz-w--a", false) + (b ? word(b, "fz-w--b", true) : "");
    const pin = document.createElement("div");
    pin.className = "fz-pin";
    pin.innerHTML = `<div class="fz-pin__stage"><span class="fz-pin__hint" aria-hidden="true">Görgess</span></div>`;
    const stage = $(".fz-pin__stage", pin), frame = $(".fz-look__frame", box);
    /* fedőlap: ugyanaz a kép szögletes keretben, az ablakkal együtt nagyítva.
       Nyitáskor ez tölti ki a képernyőt, és elhalványulva felfedi a mandula-
       ablakot – így a sarkot nem kell képkockánként újrafesteni. */
    const cover = document.createElement("div");
    cover.className = "fz-cover";
    cover.setAttribute("aria-hidden", "true");
    cover.innerHTML = `<img alt="" decoding="async" src="${esc($("img.is-lit", frame)?.getAttribute("src") || "")}">`;
    frame.after(cover);
    stage.prepend(h1, box);
    inner.prepend(pin);
    $(".pv-hero__media", sec)?.classList.add("fz-moved");
    if (calm) return pin.classList.add("is-calm");
    /* a szavak és az ablak középpontja transzform nélkül mérve */
    const measure = () => {
      stage.classList.add("is-measure");
      const s = stage.getBoundingClientRect(), f = frame.getBoundingClientRect();
      const cx = f.left + f.width / 2, cy = f.top + f.height / 2;
      /* annyi nagyítás, hogy az ablak a színpad mind a négy szélét takarja */
      const sx = Math.max(cx - s.left, s.right - cx) / (f.width / 2), sy = Math.max(cy - s.top, s.bottom - cy) / (f.height / 2);
      stage.style.setProperty("--s", (Math.max(sx, sy) * 1.02).toFixed(3));
      $$(".fz-w", stage).forEach((w, k) => {
        const r = w.getBoundingClientRect();
        w.style.setProperty("--dx", `${(cx - (r.left + r.width / 2)).toFixed(1)}px`);
        w.style.setProperty("--dy", `${(cy - (r.top + r.height / 2) + (k ? 0.42 : -0.42) * r.height).toFixed(1)}px`);
      });
      stage.classList.remove("is-measure");
    };
    let last = "";
    const update = () => {
      const r = pin.getBoundingClientRect(), run = Math.max(1, pin.offsetHeight - innerHeight);
      const p = Math.min(1, Math.max(0, -r.top / run)).toFixed(3);
      if (p !== last) return () => { last = p; stage.style.setProperty("--p", p); };
    };
    measure();
    onScroll(update);
    addEventListener("resize", () => requestAnimationFrame(() => { measure(); last = ""; update()?.(); }));
    document.fonts?.ready.then(measure);
    requestAnimationFrame(() => pin.classList.add("is-in"));
  }

  /* --- Lookbook: fotópakli → nézegető --------------------------------------
     A képrács helyett egy pakli: három egymásra dobott fotó (a görgetős
     galéria már letöltött képei), ami görgetésre (--p) legyezőként szétnyílik.
     Koppintásra a felső fotó átrepül teljes képernyőre (View Transitions, ahol
     van), és megnyílik a lapozható lookbook. A 17 kép csak ekkor töltődik, és
     akkor is lustán, ahogy lapozol – aki egyből foglal, annak semmi nem jön le. */
  function lookbook(looks) {
    const sec = $("#sec-gallery"), list = $("#sec-gallery .pv-items");
    if (!sec || !list || looks.length < 3 || $(".fz-pile", sec)) return;
    const start = Math.min(8, looks.length - 3);            /* a pakli teteje = a görgetős galéria első képe */
    const top3 = [2, 1, 0].map((k) => looks[start + k]);    /* alulról felfelé */
    sec.classList.add("fz-has-pile");
    const pile = document.createElement("button");
    pile.type = "button";
    pile.className = "fz-pile";
    pile.setAttribute("aria-haspopup", "dialog");
    pile.innerHTML = `<span class="fz-pile__stack" aria-hidden="true">${top3.map((l) =>
      `<img src="${esc(l.src)}" alt="" loading="lazy" decoding="async">`).join("")}</span>
      <span class="fz-pile__txt"><b>Lapozd végig mind a ${looks.length} munkát</b><small>Lookbook megnyitása →</small></span>`;
    list.after(pile);

    const dlg = document.createElement("dialog");
    dlg.className = "fz-viewer";
    dlg.setAttribute("aria-label", "Lookbook – Fruzsi munkái");
    dlg.innerHTML = `<div class="fz-viewer__bar"><span class="fz-viewer__count" aria-live="polite"></span>
      <button type="button" class="fz-viewer__x" aria-label="Bezárás">×</button></div>
      <ul class="fz-viewer__track">${looks.map((l) => `<li><figure><img src="${esc(l.src)}" alt="${esc(l.name)}" loading="lazy" decoding="async"></figure>
        <div class="fz-viewer__cap"><b>${esc(l.name)}</b>${l.recipe?.line ? `<small>${esc(l.recipe.line)}</small>` : ""}${wantLink(l.recipe?.id)}</div></li>`).join("")}</ul>
      <button type="button" class="fz-viewer__nav" data-d="-1" aria-label="Előző munka">←</button>
      <button type="button" class="fz-viewer__nav" data-d="1" aria-label="Következő munka">→</button>`;
    document.body.append(dlg);
    const track = $(".fz-viewer__track", dlg), count = $(".fz-viewer__count", dlg), two = (n) => String(n).padStart(2, "0");
    const at = () => Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
    const sync = () => { count.textContent = `${two(at() + 1)} / ${two(looks.length)}`; };
    track.addEventListener("scroll", () => requestAnimationFrame(sync), { passive: true });
    const go = (d) => track.scrollBy({ left: d * track.clientWidth, behavior: calm ? "auto" : "smooth" });
    /* zárás: az éppen nézett kép visszarepül a pakli tetejére (a nyitás tükre) */
    const close = () => {
      if (!dlg.open) return;
      const cur = $("img", track.children[at()]), to = $(".fz-pile__stack img:last-child", pile);
      if (!document.startViewTransition || calm || !cur) return dlg.close();
      cur.style.viewTransitionName = "fz-look";
      const vt = document.startViewTransition(() => { cur.style.viewTransitionName = ""; dlg.close(); to.style.viewTransitionName = "fz-look"; });
      vt.finished.finally(() => { to.style.viewTransitionName = ""; });
    };
    dlg.addEventListener("cancel", (e) => { e.preventDefault(); close(); });     /* Esc */
    dlg.addEventListener("click", (e) => {
      const nav = e.target.closest(".fz-viewer__nav");
      if (nav) return go(+nav.dataset.d);
      if (e.target.closest(".fz-want")) return dlg.close();                      /* a foglaláshoz ugrik, nincs idő animálni */
      if (e.target === dlg || e.target.closest(".fz-viewer__x")) close();
    });
    dlg.addEventListener("keydown", (e) => {
      const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (d) { e.preventDefault(); go(d); }
    });

    /* nyitás: a pakli felső fotója átrepül a nézegető képére */
    pile.addEventListener("click", () => {
      const from = $(".fz-pile__stack img:last-child", pile), to = $("img", track.children[start]);
      to.loading = "eager";
      const show = () => { dlg.showModal(); track.scrollLeft = start * track.clientWidth; sync(); };
      if (!document.startViewTransition || calm) return show();
      from.style.viewTransitionName = "fz-look";
      const vt = document.startViewTransition(() => { from.style.viewTransitionName = ""; show(); to.style.viewTransitionName = "fz-look"; });
      vt.finished.finally(() => { to.style.viewTransitionName = ""; });
    });

    /* a pakli görgetésre szétnyílik */
    if (calm) return pile.style.setProperty("--p", 1);
    let last = "";
    onScroll(() => {
      const r = pile.getBoundingClientRect(), vh = innerHeight;
      const p = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.65))).toFixed(3);
      if (p !== last) return () => { last = p; pile.style.setProperty("--p", p); };
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

  /* --- Sötét lookbook: a kép helyben marad, görgetésre cserélődik alatta ---- */
  function scrolly(looks) {
    const wrap = $("#sec-gallery .pv-wrap"), list = $("#sec-gallery .pv-items");
    if (!wrap || !list || looks.length < 3 || $(".fz-scrolly", wrap)) return;
    const box = document.createElement("div");
    box.className = "fz-scrolly";
    box.style.setProperty("--n", looks.length);
    box.innerHTML = `<div class="fz-scrolly__stage"><div class="fz-scrolly__frame">${looks.map((l, k) =>
      `<img src="${esc(l.src)}" alt="${esc(l.name)}" loading="lazy" decoding="async"${k ? "" : ' class="is-lit"'}>`).join("")}</div>
      <p class="fz-scrolly__cap" aria-live="polite"></p><p class="fz-scrolly__count" aria-hidden="true"></p></div>`;
    list.before(box);
    const imgs = $$("img", box), cap = $(".fz-scrolly__cap", box), cnt = $(".fz-scrolly__count", box);
    /* a rejtett (átlátszó) képet a böngésző csak a váltáskor bontaná ki – telefonon
       a váltás ezen akad meg. Betöltéskor előre kibontjuk. */
    imgs.forEach((im) => im.addEventListener("load", () => im.decode().catch(() => {}), { once: true }));
    let at = -1;
    const show = (k) => {
      if (k === at) return;
      at = k;
      imgs.forEach((im, i) => im.classList.toggle("is-lit", i === k));
      cap.innerHTML = `${esc(looks[k].name)}<small>${esc(looks[k].recipe?.line || "")}</small>`;
      cnt.textContent = `${String(k + 1).padStart(2, "0")} / ${String(looks.length).padStart(2, "0")}`;
    };
    onScroll(() => {
      const r = box.getBoundingClientRect(), run = Math.max(1, r.height - innerHeight);
      const k = Math.min(looks.length - 1, Math.max(0, Math.floor((-r.top / run) * looks.length)));
      if (k !== at) return () => show(k);
    });
  }

  /* --- Rólam: „olvasd el velem” -------------------------------------------
     A szekció kitűzve áll (.fz-story); görgetésre (--p 0→1) Fruzsi szövege
     szóról szóra megtelik tintával, a fotó polaroidként ferdén becsúszik és
     kiegyenesedik. Ha a színpad nem fér ki a
     képernyőre (kis telefon), kitűzés nélkül, a szöveg helyzetéből számol.
     A szavak valódi szövegként maradnak (span-ekben), a felolvasó egyben olvassa. */
  function story() {
    const sec = $("#sec-about"), inner = sec && $(".pv-about__inner", sec), text = $("#pv-about");
    if (!inner || !text || $(".fz-story", sec)) return;
    const words = [];
    const walk = (node) => [...node.childNodes].forEach((n) => {
      if (n.nodeType === 1) return walk(n);
      if (n.nodeType !== 3 || !n.textContent.trim()) return;
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach((t) => {
        if (!t) return;
        if (/^\s+$/.test(t)) return frag.append(t);
        const s = document.createElement("span");
        s.className = "fz-wd";
        s.textContent = t;
        words.push(s);
        frag.append(s);
      });
      n.replaceWith(frag);
    });
    walk(text);
    const box = document.createElement("div");
    box.className = "fz-story";
    box.innerHTML = '<div class="fz-story__stage"></div>';
    const stage = box.firstChild;
    stage.append(...inner.children);
    inner.append(box);
    if (calm) { words.forEach((w) => w.classList.add("is-lit")); return box.classList.add("is-calm"); }
    let pinTop = 0, travel = 1, pinned = false;
    const size = () => {
      box.style.height = "";
      pinned = stage.offsetHeight < innerHeight - (parseFloat(getComputedStyle(stage).top) || 0) - 16;
      box.classList.toggle("is-pinned", pinned);
      travel = Math.max(innerHeight, words.length * 14);
      pinTop = parseFloat(getComputedStyle(stage).top) || 0;
      if (pinned) box.style.height = `${stage.offsetHeight + travel}px`;
    };
    size();
    addEventListener("resize", () => requestAnimationFrame(size));
    document.fonts?.ready.then(size);
    let lastP = "", shown = -1;
    onScroll(() => {
      const r = (pinned ? box : text).getBoundingClientRect(), vh = innerHeight;
      const p = pinned ? (pinTop - r.top) / travel : (vh * 0.85 - r.top) / (r.height + vh * 0.35);
      const s = Math.min(1, Math.max(0, p)).toFixed(3);
      if (s === lastP) return;
      return () => {
        lastP = s;
        stage.style.setProperty("--p", s);
        /* a szavak az út 95%-ában telnek meg – a vége pihenő */
        const n = Math.round(Math.min(1, s / 0.95) * words.length);
        if (n !== shown) {
          const from = Math.min(n, Math.max(shown, 0)), to = Math.max(n, shown);
          for (let i = from; i < to; i++) words[i]?.classList.toggle("is-lit", i < n);
          shown = n;
        }
      };
    });
  }


  /* --- Lábléc: függöny + beúszó sorok ---------------------------------------
     Az oldal tartalma függönyként felcsúszik, alóla előtűnik a helyben álló
     sötét lábléc (sticky). Amikor előjön (.is-in), előbb egy fukszia vonal
     rajzolódik végig, aztán a sorai a képernyő széléről, felváltva balról és
     jobbról, egymás után becsúsznak (--i: sorrend, --dir: irány). Kifelé
     görgetve visszaáll, így újra lejátszódik. Függöny csak akkor, ha a
     lábléc elfér a képernyőn. */
  function footer() {
    const ft = $(".pv-footer");
    if (!ft || ft.classList.contains("fz-foot")) return;
    ft.classList.add("fz-foot");
    ft.insertAdjacentHTML("afterbegin", '<i class="fz-foot__line" aria-hidden="true"></i>');
    [...ft.children].forEach((el, i) => { el.style.setProperty("--i", i); el.style.setProperty("--dir", i % 2 ? 1 : -1); });
    const fit = () => ft.classList.toggle("is-curtain", ft.offsetHeight < innerHeight * 0.92);
    fit();
    addEventListener("resize", () => requestAnimationFrame(fit));
    if (calm) ft.classList.add("is-in");
    /* nem IntersectionObserver: függönynél a lábléc végig a képernyő alján áll
       (csak takarva), ezért azt mérjük, mennyi bukkant elő a tartalom alól. */
    const main = $(".pv-main");
    let on = false;
    onScroll(() => {
      const shown = innerHeight - (ft.classList.contains("is-curtain") ? main.getBoundingClientRect().bottom : ft.getBoundingClientRect().top);
      const want = shown > ft.offsetHeight * 0.35;
      if (want !== on) return () => { on = want; if (!calm) ft.classList.toggle("is-in", want); };
    });
  }

  /* --- Árlista: lapozó étlap ------------------------------------------------
     A szalon menükönyve: kategóriánként egy lap, egymásra rakva. Kitűzött
     színpadon görgetésre a felső lap a felső élén felhajlik (rotateX) és eltűnik,
     alatta a következő lap feljebb lép; a fülek mutatják, hol jársz, és oda
     is ugranak. Ami előkerül, annak az ára felpörög. Egy sorra koppintva a
     foglalás azzal a szolgáltatással nyílik. Adat: a termék árlistája (DOM). */
  function menuBook(book) {
    const sec = $("#sec-pricing"), list = $("#pv-prices");
    const groups = list ? $$(".fz-cat-group", list) : [];
    if (!sec || groups.length < 2 || $(".fz-book", sec)) return;
    const svc = (name) => book.find((b) => norm(name).includes(norm(b.name)))?.id || "";
    const pages = groups.map((g) => ({
      cat: $("h3", g).textContent.trim(),
      rows: $$(".fz-cat-list > li", g).map((li) => {
        const nm = $(".pv-price__name", li);
        return { name: nm?.firstChild?.textContent.trim() || "", time: $("small", nm || li)?.textContent.trim() || "", price: $("b", li)?.textContent.trim() || "" };
      }),
    }));
    const n = pages.length;
    const box = document.createElement("div");
    box.className = "fz-book";
    box.style.setProperty("--n", n);
    box.innerHTML = `<div class="fz-book__stage">
      <div class="fz-book__tabs" role="group" aria-label="Árlista kategóriák">${pages.map((p, i) =>
        `<button type="button" class="fz-book__tab" aria-pressed="${!i}">${esc(p.cat)}</button>`).join("")}</div>
      <div class="fz-book__deck">${pages.map((p, i) => `<article class="fz-page" style="z-index:${n - i}" aria-label="${esc(p.cat)}">
        <h3>${esc(p.cat)}</h3>
        <ul>${p.rows.map((r) => `<li><a class="fz-mrow" href="#sec-booking"${svc(r.name) ? ` data-service="${esc(svc(r.name))}"` : ""}>
          <span class="fz-mrow__name">${esc(r.name)}${r.time ? `<small>${esc(r.time)}</small>` : ""}</span>
          <b class="fz-mrow__price" data-price="${esc(r.price)}">${esc(r.price)}</b></a></li>`).join("")}</ul>
        <p class="fz-page__foot"><span>${i + 1} / ${n}</span><span>${i < n - 1 ? "Görgess, lapozz" : "Koppints egy sorra a foglaláshoz"}</span></p>
      </article>`).join("")}</div></div>`;
    list.before(box);
    sec.classList.add("fz-has-book");
    const els = $$(".fz-page", box), tabs = $$(".fz-book__tab", box);
    if (calm) return box.classList.add("is-calm");
    /* Méret a tartalomhoz: minden lap a leghosszabb magasságát kapja, a pakli
       ennyi + a hátsó lapok kilógása, az út pedig a színpad + a lapozás. Így a
       kitűzés végén nem marad üres képernyőnyi hely a következő szekcióig. */
    const stage = $(".fz-book__stage", box), deck = $(".fz-book__deck", box);
    let pinTop = 0, travel = 1;                     /* a színpad ragadási pontja és a lapozás útja (px) */
    const size = () => {
      box.style.setProperty("--ph", "auto");
      const ph = Math.max(...els.map((el) => el.offsetHeight));
      box.style.setProperty("--ph", ph + "px");
      travel = (n - 0.4) * 0.6 * innerHeight;
      pinTop = parseFloat(getComputedStyle(stage).top) || 0;
      box.style.height = `${stage.offsetHeight + travel}px`;
    };
    size();
    addEventListener("resize", () => requestAnimationFrame(size));
    document.fonts?.ready.then(size);

    /* ár felpörgetése: számjegyek 0-tól a valódi értékig, egyszer lapenként */
    const roll = (page) => {
      if (page.dataset.rolled) return;
      page.dataset.rolled = "1";
      $$(".fz-mrow__price", page).forEach((b) => {
        const txt = b.dataset.price, to = Number(txt.replace(/\D/g, ""));
        if (!to) return;
        const t0 = performance.now(), dur = 700;
        const step = (t) => {
          const q = Math.min(1, (t - t0) / dur), v = Math.round(to * (1 - Math.pow(1 - q, 3)) / 100) * 100;
          const s = q < 1 ? txt.replace(/[\d\s ]+\d/, v.toLocaleString("hu-HU")) : txt;
          if (b.textContent !== s) b.textContent = s;              /* azonos szövegre ne tördeljen újra */
          if (q < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    };
    /* t: hol tart a lapozás (0 … n-1); minden lapnak 40% pihenő, 60% fordulás */
    let lastT = -1, cur = -1;
    onScroll(() => {
      const r = box.getBoundingClientRect();
      const t = +(Math.min(1, Math.max(0, (pinTop - r.top) / travel)) * (n - 0.6)).toFixed(3);
      if (t === lastT) return;
      return () => {
        lastT = t;
        els.forEach((el, i) => {
          el.style.setProperty("--f", i < n - 1 ? Math.min(1, Math.max(0, (t - i - 0.4) / 0.6)).toFixed(3) : 0);
          el.style.setProperty("--k", Math.max(0, i - t).toFixed(3));
        });
        const k = Math.min(n - 1, Math.floor(t + 0.15));
        if (k !== cur) {
          cur = k;
          tabs.forEach((b, i) => b.setAttribute("aria-pressed", String(i === k)));
          roll(els[k]);
        }
      };
    });
    /* fül: a görgetés oda ugrik, ahol az a lap pihen */
    tabs.forEach((b, i) => b.addEventListener("click", () => {
      const top = box.getBoundingClientRect().top + scrollY - pinTop;
      scrollTo({ top: top + travel * Math.min(1, (i + 0.1) / (n - 0.6)), behavior: "smooth" });
    }));
  }

  /* --- Foglalás: reflektorfény-mód -----------------------------------------
     Amikor a foglaló kártya a képernyő középső sávjába ér, egy fátyol
     (backdrop-filter) elmossa az oldal többi részét; a foglalás címe és
     kártyája fölötte, élesen marad. A fátyolra koppintva vagy Esc-re kilép;
     ha a kártya kimegy a sávból, a kilépés feledésbe merül. */
  function spotlight() {
    const sec = $("#sec-booking"), root = $("#bk-root");
    if (!sec || sec.hidden || !root || $(".fz-veil")) return;
    const html = document.documentElement;
    const veil = document.createElement("div");
    veil.className = "fz-veil";
    veil.innerHTML = `<span aria-hidden="true">Koppints a kártya mellé a kilépéshez</span>`;
    sec.before(veil);
    sec.classList.add("fz-spot");
    /* --fz-focus 0→1 a görgetésből: a kártya teteje a képernyő aljától a
       felső tizedéig tartó úton (~0.9 képernyő) erősödik, a kártya alja a
       felső harmadhoz érve ugyanígy oldódik. Kilépés után nulla marad, amíg
       a kártya teljesen ki nem ment. */
    let away = false, last = "";
    /* a változó csak a fátyolra, a foglalásra és a fejlécre megy – a <html>-en
       képkockánként az egész lapot újraszámolná */
    const users = [veil, sec, $(".pv-header")].filter(Boolean);
    const write = (p) => () => {
      last = p.toFixed(3);
      users.forEach((el) => el.style.setProperty("--fz-focus", last));
      html.classList.toggle("fz-near", p > 0);
      html.classList.toggle("fz-focus", p > 0.6);
    };
    /* a kártya kitűzve áll egy darabig (CSS: .pv-wrap sticky + 80svh tartalék
       a szekció alján), így a homály és a nagyítás hosszabb úton épül fel */
    const wrap = $(".pv-wrap", sec);
    onScroll(() => {
      const vh = innerHeight, s = sec.getBoundingClientRect(), w = wrap.getBoundingClientRect();
      const enter = (vh - s.top) / (vh * 1.45), exit = (w.bottom - vh * 0.15) / (vh * 0.6);
      let p = Math.min(1, Math.max(0, Math.min(enter, exit)));
      if (p === 0) away = false;
      if (away) p = 0;
      if (p.toFixed(3) !== last) return write(p);
    });
    const leave = () => { away = true; write(0)(); };
    veil.addEventListener("click", leave);
    addEventListener("keydown", (e) => { if (e.key === "Escape" && html.classList.contains("fz-focus")) leave(); });
  }

  /* --- Navbar: csúszó kiemelés ------------------------------------------------
     Egy kapszula ül az aktív menüpont alatt (a termék aria-current-et tesz rá
     görgetéskor), és oda csúszik, ahol a mutató jár. Csak a vízszintes sávban;
     a nyitott mobilmenüben rejtve. Csak translate/width mozog. */
  function navPill() {
    const nav = $("#pv-nav");
    if (!nav || $(".fz-nav-pill", nav)) return;
    const pill = document.createElement("span");
    pill.className = "fz-nav-pill";
    pill.setAttribute("aria-hidden", "true");
    nav.prepend(pill);
    let hover = null;
    const move = () => {
      const a = hover || $(".pv-nav__top[aria-current]", nav);
      if (!a || nav.classList.contains("is-open") || !a.offsetWidth) return pill.classList.remove("is-lit");
      const n = nav.getBoundingClientRect(), r = a.getBoundingClientRect();
      pill.style.setProperty("--x", `${(r.left - n.left).toFixed(1)}px`);
      pill.style.setProperty("--y", `${(r.top - n.top).toFixed(1)}px`);
      pill.style.setProperty("--w", `${r.width.toFixed(1)}px`);
      pill.style.setProperty("--h", `${r.height.toFixed(1)}px`);
      pill.classList.add("is-lit");
    };
    /* NEM MutationObserver: a saját írásaink újra kiváltották, és a lap
       lefagyott. Az aktív pont görgetésre vált (site.js), ezért a közös
       görgetés-ütemben nézzük, változott-e. */
    let last = null;
    onScroll(() => {
      const a = $(".pv-nav__top[aria-current]", nav);
      if (a !== last) return () => { last = a; move(); };
    });
    $("#pv-burger")?.addEventListener("click", () => requestAnimationFrame(move));
    nav.addEventListener("pointerover", (e) => { const a = e.target.closest(".pv-nav__top"); if (a && a !== hover) { hover = a; move(); } });
    nav.addEventListener("pointerleave", () => { hover = null; move(); });
    addEventListener("resize", () => requestAnimationFrame(move));
    document.fonts?.ready.then(move);
    move();
  }

  /* --- Szolgáltatások: vízszintes polc --------------------------------------
     A szekció kitűzve áll; lefelé görgetve a kártyák oldalra gördülnek, mint a
     lakkok a polcon. A középen álló kártya a fókuszban (--f 0→1: nagyobb,
     teljes fényű), a kép a kártyán belül enyhén ellenmozog (--d). Ha a színpad
     nem fér ki a képernyőre, a függőleges lista marad. Csak translate/scale/
     opacity mozog. */
  function shelf() {
    const sec = $("#sec-services"), wrap = sec && $(".pv-wrap", sec), list = $("#pv-items");
    const head = sec && $(".pv-head", sec), cards = list ? $$(":scope > li", list) : [];
    if (!wrap || !head || cards.length < 2 || $(".fz-shelf", sec) || calm) return;
    const box = document.createElement("div");
    box.className = "fz-shelf";
    box.innerHTML = `<div class="fz-shelf__stage"></div>`;
    const stage = box.firstChild;
    stage.append(head, list);
    stage.insertAdjacentHTML("beforeend", `<div class="fz-shelf__bar" aria-hidden="true"><span></span><i></i></div>`);
    wrap.append(box);
    const count = $(".fz-shelf__bar span", stage), two = (n) => String(n).padStart(2, "0");
    let pinTop = 0, run = 1, travel = 0, offs = [], on = false;
    const size = () => {
      box.classList.add("is-pinned");
      box.style.height = "";
      list.style.setProperty("--x", "0px");
      pinTop = parseFloat(getComputedStyle(stage).top) || 0;
      on = stage.offsetHeight < innerHeight - pinTop - 8;
      if (!on) return box.classList.remove("is-pinned");
      const pad = parseFloat(getComputedStyle(stage).paddingRight) || 0;
      travel = Math.max(0, list.scrollWidth - (stage.clientWidth - list.offsetLeft - pad));
      run = Math.max(1, travel * 1.1);
      offs = cards.map((c) => [c.offsetLeft, c.offsetWidth]);
      box.style.height = `${stage.offsetHeight + run}px`;
    };
    size();
    addEventListener("resize", () => requestAnimationFrame(size));
    document.fonts?.ready.then(size);
    let last = "";
    onScroll(() => {
      if (!on) return;
      const p = Math.min(1, Math.max(0, (pinTop - box.getBoundingClientRect().top) / run));
      const key = p.toFixed(4);
      if (key === last) return;
      const x = -p * travel, mid = stage.clientWidth / 2 - list.offsetLeft;
      const vals = offs.map(([l, w]) => (l + w / 2 + x - mid) / Math.max(1, stage.clientWidth));
      return () => {
        last = key;
        list.style.setProperty("--x", `${x.toFixed(1)}px`);
        let best = 0;
        vals.forEach((d, i) => {
          cards[i].style.setProperty("--d", d.toFixed(3));
          cards[i].style.setProperty("--f", Math.max(0, 1 - Math.abs(d) * 1.8).toFixed(3));
          if (Math.abs(d) < Math.abs(vals[best])) best = i;
        });
        const txt = `${two(best + 1)} / ${two(cards.length)}`;
        if (count.textContent !== txt) count.textContent = txt;      /* csak váltáskor: a szövegcsere újratördel */
        stage.style.setProperty("--p", key);
      };
    });
  }

  function build() {
    /* nincs alsó CTA-sáv: a foglalás a menüben van. Kivéve a lapból, hogy a
       pv.css :has(.pv-cta-bar.is-on) szabályai (eltűnő fejléc, megemelt
       „fel” gomb) se lépjenek életbe – így a fejléc és a menü mindig elérhető. */
    $("#pv-cta-bar")?.remove();
    brand();
    menu();
    navPill();
    pricing();
    about();
    /* „Ezt kérem": a varázslóban ki is választja a szolgáltatást, így a látogató
       egyből az időpontoknál nyit (ha a varázsló az 1. lépésen áll) */
    document.addEventListener("click", (e) => {
      const id = e.target.closest("a[data-service]")?.dataset.service;
      if (id) $$("#bk-root [data-service]").find((b) => b.dataset.service === id)?.click();
    });
    config.then((cfg) => {
      const c = cfg?.content || {}, book = c.booking?.services || [];
      services(book);
      shelf();
      menuBook(book);
      const items = (c.lists?.gallery || []).filter((g) => g.image);
      const recipes = new Map(items.map((g) => [norm(g.name), recipeOf(g.text, book)]));
      const src = (s) => (/^(https?:|data:|\/|\.)/.test(s) ? s : "images/" + s);
      const looks = items.map((g) => ({ name: g.name, src: src(g.image), color: g.color, recipe: recipes.get(norm(g.name)) }));
      const hero = (c.images || []).find((i) => i.hero && i.src);
      look(hero && { src: src(hero.src), alt: hero.alt });
      scrolly(looks.slice(8, 13));                        /* a rács első sorait nem ismétli */
      lookbook(looks);
      story();
      footer();
      spotlight();
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
