/* ==========================================================================
   Fruzsinails – saját réteg a termék site.js-e után
   A körömtip-legyező (fruzsi.css) a galéria első öt kézfotójából (pedikűr nélkül) épül, miután a
   site.js kirajzolta a lapot (html.pv-ready). Dísz: a képek alt szövege a
   galériában van, itt aria-hidden.
   ========================================================================== */
(() => {
  const build = () => {
    const inner = document.querySelector(".pv-hero__inner");
    if (!inner || inner.querySelector(".fz-fan")) return;
    const srcs = [...document.querySelectorAll("#sec-gallery .pv-item:not([data-cat=\"Pedikűr\"]) img")]
      .map((img) => img.getAttribute("src"))
      .filter(Boolean)
      .slice(0, 5);
    if (srcs.length < 3) return;
    const mid = (srcs.length - 1) / 2;
    const fan = document.createElement("div");
    fan.className = "fz-fan";
    fan.setAttribute("aria-hidden", "true");
    fan.innerHTML = srcs
      .map((src, k) => `<span class="fz-tip" style="--i:${k - mid};--d:${Math.abs(k - mid)}"><img src="${src}" alt="" decoding="async"></span>`)
      .join("");
    inner.append(fan);
  };

  const html = document.documentElement;
  if (html.classList.contains("pv-ready")) build();
  else new MutationObserver((_, obs) => {
    if (!html.classList.contains("pv-ready")) return;
    obs.disconnect();
    build();
  }).observe(html, { attributes: true, attributeFilter: ["class"] });
})();
