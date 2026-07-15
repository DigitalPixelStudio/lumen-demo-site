/* ============================================================
   Lumen — interactions, motion, PWA
   ============================================================ */
(() => {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- Theme ---------- */
  const root = document.documentElement;
  const THEMES = ["dark", "light", "crimson"];
  const stored = localStorage.getItem("lumen-theme");
  const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
  const initial = stored || (prefersLight ? "light" : "crimson");
  applyTheme(initial);

  function applyTheme(theme) {
    if (!THEMES.includes(theme)) theme = "crimson";
    root.setAttribute("data-theme", theme);
    const meta = $('meta[name="theme-color"]');
    const colors = { dark: "#0d0f1a", light: "#f6f7fb", crimson: "#0a0304" };
    if (meta) meta.setAttribute("content", colors[theme]);
    $$(".theme-switch button").forEach((b) =>
      b.classList.toggle("active", b.dataset.setTheme === theme)
    );
  }
  $$(".theme-switch button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const t = btn.dataset.setTheme;
      applyTheme(t);
      localStorage.setItem("lumen-theme", t);
    });
  });

  /* ---------- Nav: scroll state + burger ---------- */
  const nav = $("#nav");
  const burger = $("#navBurger");
  const links = $("#navLinks");
  const onScroll = () => {
    nav.classList.toggle("scrolled", window.scrollY > 20);
    const h = document.documentElement;
    const pct = (h.scrollTop || document.body.scrollTop) / ((h.scrollHeight - h.clientHeight) || 1) * 100;
    $("#scrollProgress").style.width = pct + "%";
    $("#toTop").classList.toggle("show", window.scrollY > 600);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  burger.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    burger.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", String(open));
  });
  $$("#navLinks a").forEach((a) => a.addEventListener("click", () => {
    links.classList.remove("open"); burger.classList.remove("open"); burger.setAttribute("aria-expanded", "false");
  }));
  $("#toTop").addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.15 });
  $$(".reveal").forEach((el) => io.observe(el));

  /* ---------- Hero typed words ---------- */
  const typed = $("#typed");
  const words = ["lightning-fast", "beautiful", "accessible", "installable"];
  let wi = 0;
  function cycle() {
    typed.style.opacity = "0";
    setTimeout(() => {
      wi = (wi + 1) % words.length;
      typed.textContent = words[wi];
      typed.style.opacity = "1";
    }, 320);
  }
  if (typed && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    typed.style.transition = "opacity .3s ease";
    setInterval(cycle, 2600);
  }

  /* ---------- Stat counters ---------- */
  const statIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = +el.dataset.target;
      const suffix = el.dataset.suffix || "";
      const dur = 1400; const start = performance.now();
      const step = (now) => {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(eased * target) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      statIO.unobserve(el);
    });
  }, { threshold: 0.5 });
  $$(".stat__num").forEach((el) => statIO.observe(el));

  /* ---------- Leaflet map ---------- */
  function initMap() {
    if (typeof L === "undefined" || !$("#map")) return;
    const pos = [37.7749, -122.4194]; // San Francisco
    const map = L.map("map", { scrollWheelZoom: false, attributionControl: true }).setView(pos, 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19, attribution: "&copy; OpenStreetMap"
    }).addTo(map);
    const pin = L.marker(pos).addTo(map);
    pin.bindPopup("<b>Lumen Studio</b><br>1 Lumen Lane, San Francisco").openPopup();
    setTimeout(() => map.invalidateSize(), 300);
    map.on("focus", () => map.scrollWheelZoom.enable());
    map.on("blur", () => map.scrollWheelZoom.disable());
  }
  if (document.readyState === "complete") initMap();
  else window.addEventListener("load", initMap);

  /* ---------- PWA: install + service worker ---------- */
  let deferred = null;
  const installBtn = $("#installBtn");
  window.addEventListener("beforeinstallprompt", (ev) => {
    ev.preventDefault();
    deferred = ev;
    installBtn.hidden = false;
  });
  installBtn.addEventListener("click", async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    installBtn.hidden = true;
    deferred = null;
  });
  window.addEventListener("appinstalled", () => { installBtn.hidden = true; });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }

  onScroll();

  /* ---------- Cursor glow ---------- */
  const glow = $("#cursorGlow");
  if (glow && matchMedia("(hover: hover)").matches) {
    window.addEventListener("pointermove", (e) => {
      glow.classList.add("show");
      glow.style.left = e.clientX + "px";
      glow.style.top = e.clientY + "px";
    }, { passive: true });
    window.addEventListener("pointerleave", () => glow.classList.remove("show"));
  }

  /* ---------- 3D card tilt ---------- */
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const tiltEls = $$(".card, .service");
    tiltEls.forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `translateY(-8px) rotateX(${(-py * 8).toFixed(2)}deg) rotateY(${(px * 8).toFixed(2)}deg)`;
      });
      el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    });
  }
})();
