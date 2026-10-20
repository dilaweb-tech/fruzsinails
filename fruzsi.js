/* ==========================================================================
   Fruzsinails – saját réteg a termék site.js-e után
   Minden itt indul, miután a site.js kirajzolta a lapot (html.pv-ready).
   Csökkentett mozgásnál csak a szerkezet épül fel (szóvédjegy, legyező),
   mozgató osztály egy sem kerül fel – a lap így is teljes.
   ========================================================================== */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const next = (fn) => requestAnimationFrame(() => requestAnimationFrame(fn));

  /* --- Szóvédjegy a fejlécben: ugyanaz a dőlt „nails”, mint a heróban ----- */
  function brand() {
    const h1 = $("#pv-company"), sm = $("#pv-company-sm");
    if (h1 && sm && h1.querySelector("em")) sm.innerHTML = h1.innerHTML;
  }

  /* --- Név betűnként: a képernyőolvasó az aria-label-t olvassa egyben ----- */
  function splitName() {
    const h1 = $("#pv-company");
    if (!h1 || h1.dataset.split) return;
    h1.dataset.split = "1";
    h1.setAttribute("aria-label", h1.textContent);
    let k = 0;
    const split = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          [...n.textContent].forEach((ch) => {
            const s = document.createElement("span");
            s.className = "fz-ch";
            s.setAttribute("aria-hidden", "true");
            s.style.setProperty("--k", k++);
            s.textContent = ch;
            frag.append(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) split(n);
      });
    };
    split(h1);
  }

  /* --- Körömtip-legyező a galéria kézfotóiból (pedikűr nélkül) ------------ */
  const SPARK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0c.6 6.2 5.8 11.4 12 12-6.2.6-11.4 5.8-12 12-.6-6.2-5.8-11.4-12-12C6.2 11.4 11.4 6.2 12 0z"/></svg>';
  /* hely (%), méret, szín, ütem – kézzel elszórva, hogy ne rácsszerű legyen */
  const SPARKS = [
    [8, 18, "1.1rem", "var(--pv-primary)", "3.2s", "0s"],
    [88, 12, "0.8rem", "var(--pv-secondary)", "2.6s", "0.8s"],
    [94, 52, "1.3rem", "var(--pv-primary)", "3.8s", "1.6s"],
    [3, 60, "0.7rem", "var(--pv-secondary)", "2.9s", "2.1s"],
    [50, 2, "0.9rem", "var(--fz-milk)", "3.4s", "1.1s"],
    [72, 30, "0.6rem", "var(--fz-milk)", "2.4s", "0.4s"],
    [24, 34, "0.65rem", "var(--fz-milk)", "3s", "2.6s"],
  ];
  function fan() {
    const inner = $(".pv-hero__inner");
    if (!inner || $(".fz-fan", inner)) return null;
    const srcs = $$('#sec-gallery .pv-item:not([data-cat="Pedikűr"]) img')
      .map((img) => img.getAttribute("src")).filter(Boolean).slice(0, 5);
    if (srcs.length < 3) return null;
    const mid = (srcs.length - 1) / 2;
    const el = document.createElement("div");
    el.className = "fz-fan";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML =
      `<div class="fz-fan__sway">` +
      srcs.map((src, k) =>
        `<span class="fz-tip" style="--i:${k - mid};--d:${Math.abs(k - mid)}"><img src="${src}" alt="" decoding="async"></span>`).join("") +
      `</div>` +
      SPARKS.map(([x, y, s, c, t, dl]) =>
        `<span class="fz-spark" style="left:${x}%;top:${y}%;--s:${s};--c:${c};--t:${t};--dl:${dl}">${SPARK}</span>`).join("");
    inner.append(el);
    return el;
  }

  /* --- Görgetésre: a legyező tovább nyílik, ahogy a hero kifut ------------ */
  function fanScroll(el) {
    const hero = $("#sec-hero");
    let ticking = false;
    const sync = () => {
      ticking = false;
      const p = Math.min(1, Math.max(0, scrollY / (hero.offsetHeight || 1)));
      el.style.setProperty("--fz-p", p.toFixed(3));
    };
    addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(sync); } }, { passive: true });
  }

  /* --- Beúszás görgetésre ------------------------------------------------- */
  const RV = [".pv-head", ".pv-item", ".pv-prices li", ".pv-about__media", ".pv-about__copy",
    ".pv-contact__list li", ".pv-map__frame", ".pv-chips", "#bk-root"];
  function reveal() {
    /* a kikapcsolt (rejtett) szekciók elemei soha nem érnének be – kimaradnak */
    /* a kikapcsolt (rejtett) szekciók elemei soha nem érnének be – kimaradnak;
       a szolgáltatás-kártyák kitűzve egymásra csúsznak, azoknak saját mozgásuk van */
    const els = $$(RV.map((s) => `main section:not(#sec-hero) ${s}`).join(","))
      .filter((el) => el.offsetParent && !el.matches("#pv-items > li, .fz-cat-group"));
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-in");
      io.unobserve(e.target);
      if (e.target.closest("#sec-rating") && e.target.matches(".pv-item")) countUp(e.target);
    }), { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    els.forEach((el) => {
      /* rácsban a testvérek egymás után érkeznek; a késleltetés legfeljebb 5 lépés */
      const sibs = [...el.parentElement.children].filter((c) => c.matches(RV.join(",")));
      el.style.setProperty("--k", Math.min(5, Math.max(0, sibs.indexOf(el))));
      el.classList.add("fz-rv");
      io.observe(el);
    });
  }

  /* --- Értékelés: a szám nulláról pörög fel a valódi értékig -------------- */
  function countUp(item) {
    const h = $("h3", item);
    const m = h && h.textContent.trim().match(/^(\d+)(?:,(\d+))?$/);
    if (!m) return;
    const dec = (m[2] || "").length, to = parseFloat(m[1] + "." + (m[2] || "0"));
    const t0 = performance.now(), dur = 1400;
    const step = (t) => {
      const q = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - q, 3);
      h.textContent = (to * e).toFixed(dec).replace(".", ",");
      if (q < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* --- Menü: oldalsáv (fotó, elérhetőség, foglalás), görgetés zárolva ----- */
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
  /* a menüpont képe: a célszekció első fotója – új szekciónál sem kell kézzel párosítani */
  const sectionImg = (href) => {
    const sec = href && href.startsWith("#") ? $(href) : null;
    return (sec && $$("img", sec).map((i) => i.getAttribute("src")).find((s) => s && !s.startsWith("data:"))) || "";
  };
  function menu() {
    const burger = $("#pv-burger"), nav = $("#pv-nav");
    if (!nav) return;
    $$(".pv-nav__item", nav).forEach((it, k) => it.style.setProperty("--k", k));
    if (!$(".fz-menu-aside", nav)) {
      const tel = $("#pv-topbar-phone"), addr = $("#pv-topbar-addr"), open = $("#pv-topbar-status");
      const first = sectionImg("#sec-about") || sectionImg("#sec-services");
      const aside = document.createElement("div");
      aside.className = "pv-nav__item fz-menu-aside";
      aside.style.setProperty("--k", $$(".pv-nav__item", nav).length);
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
      const open = burger.getAttribute("aria-expanded") === "true";
      document.documentElement.classList.toggle("fz-menu", open);
    }).observe(burger, { attributes: true, attributeFilter: ["aria-expanded"] });
  }

  /* --- Szolgáltatás-kártyák: időtartam és ár a foglalás adataiból ---------- */
  const norm = (s) => String(s ?? "").toLowerCase().replace(/\s+/g, " ").trim();
  const huf = (v) => (Number(v) ? Number(v).toLocaleString("hu-HU") + " Ft" : "");
  /* a site.js a beállítást zárt hatókörben tartja – a foglalás szolgáltatásait
     innen olvassuk (a böngésző a már letöltött site.json-t adja vissza) */
  const bookingServices = () => fetch("site.json").then((r) => r.json())
    .then((c) => c?.content?.booking?.services || []).catch(() => []);
  function services(book = []) {
    const items = $$("#pv-items > li");
    items.forEach((li, k) => {
      li.style.setProperty("--k", k);
      const body = $(".pv-item__body", li);
      if (!body) return;
      $$(".fz-meta, .fz-want", body).forEach((el) => el.remove());
      const s = book.find((b) => norm(b.name) === norm($("h3", body)?.textContent));
      const tags = s ? [s.durationMin ? `${s.durationMin} perc` : "", s.price ? `${huf(s.price)}-tól` : ""].filter(Boolean) : [];
      body.insertAdjacentHTML("beforeend",
        (tags.length ? `<p class="fz-meta">${tags.map((t) => `<span class="fz-tag">${esc(t)}</span>`).join("")}</p>` : "") +
        `<a class="fz-want" href="#sec-booking">Ezt kérem <span aria-hidden="true">→</span></a>`);
    });
    return items;
  }
  /* amelyik kártyára a következő ráfut, az kicsit hátrébb lép */
  function stack(items) {
    if (items.length < 2) return;
    let ticking = false;
    const sync = () => {
      ticking = false;
      items.forEach((li, i) => {
        const nx = items[i + 1];
        if (!nx) return;
        /* a saját méretét az offsetHeight adja: a skálázás a bounding boxot torzítaná */
        const h = li.offsetHeight || 1, top = li.getBoundingClientRect().top;
        const p = Math.min(1, Math.max(0, (top + h - nx.getBoundingClientRect().top) / h));
        li.style.setProperty("--fz-back", p.toFixed(3));
      });
    };
    addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(sync); } }, { passive: true });
    sync();
  }

  /* --- Árlista: kategóriánként csoport, élén a dőlt cím --------------------
     A csoport ugyanazt a data-cat-ot kapja, mint a tételei, így a termék
     szűrője (site.js: [data-cat] → hidden) vele együtt rejti; két hasábban a
     csoport egyben marad, a cím nem szakad el a tételeitől. */
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

  /* --- Galéria: számláló és haladás-csík a húzható sorhoz ------------------ */
  function gallery() {
    const list = $("#sec-gallery .pv-items");
    if (!list || $("#sec-gallery .fz-strip")) return;
    const strip = document.createElement("p");
    strip.className = "fz-strip";
    strip.setAttribute("aria-hidden", "true");
    list.after(strip);
    const two = (n) => String(n).padStart(2, "0");
    const sync = () => {
      const vis = [...list.children].filter((li) => !li.hidden);
      if (!vis.length) return;
      const step = vis.length > 1 ? vis[1].offsetLeft - vis[0].offsetLeft : 1;
      const at = Math.min(vis.length - 1, Math.max(0, Math.round(list.scrollLeft / (step || 1))));
      strip.innerHTML = `<b>${two(at + 1)}</b> / ${two(vis.length)} <i></i>`;
      strip.style.setProperty("--fz-g", ((at + 1) / vis.length).toFixed(3));
    };
    list.addEventListener("scroll", () => requestAnimationFrame(sync), { passive: true });
    $("#sec-gallery").addEventListener("click", (e) => {
      if (e.target.closest(".pv-chip")) setTimeout(() => { list.scrollLeft = 0; sync(); }, 0);
    });
    sync();
  }

  function build() {
    brand();
    menu();
    const cards = services();
    bookingServices().then((b) => b.length && services(b));
    pricing();
    gallery();
    const el = fan();
    if (calm) return;
    stack(cards);
    const copy = $(".pv-hero__copy");
    splitName();
    copy?.classList.add("fz-intro");
    reveal();
    next(() => {
      copy?.classList.add("is-in");
      if (!el) return;
      el.classList.add("is-open");
      /* a nyitás után a görgetés közvetlenül vezeti a szöget, lassú átmenet nélkül */
      setTimeout(() => { el.classList.add("is-live"); fanScroll(el); }, 1900);
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
