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
    const els = $$(RV.map((s) => `main section:not(#sec-hero) ${s}`).join(",")).filter((el) => el.offsetParent);
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

  /* --- Menü: görgetés zárolva, amíg nyitva; pontok sorszáma a beúszáshoz -- */
  function menu() {
    const burger = $("#pv-burger");
    $$("#pv-nav .pv-nav__item").forEach((it, k) => it.style.setProperty("--k", k));
    /* a lap alján a hívás: menüből is egy érintés a foglalásig */
    const tel = $("#pv-topbar-phone");
    if (tel && tel.textContent.trim() && !$("#pv-nav .fz-menu-foot")) {
      const foot = document.createElement("div");
      foot.className = "pv-nav__item fz-menu-foot";
      foot.style.setProperty("--k", $$("#pv-nav .pv-nav__item").length);
      foot.innerHTML = `<a href="${tel.getAttribute("href")}">Hívj: ${tel.textContent.trim()}</a>`;
      $("#pv-nav").append(foot);
    }
    if (!burger) return;
    new MutationObserver(() => {
      const open = burger.getAttribute("aria-expanded") === "true";
      document.documentElement.classList.toggle("fz-menu", open);
    }).observe(burger, { attributes: true, attributeFilter: ["aria-expanded"] });
  }

  function build() {
    brand();
    menu();
    const el = fan();
    if (calm) return;
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
