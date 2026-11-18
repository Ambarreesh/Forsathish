/* Motion engine — one ticker, Apple-style springs (damping ratio + response),
   spring-solved CSS easings, text splitting and small math helpers. */
(() => {
  const SS = (window.SS = window.SS || {});
  const mq = matchMedia("(prefers-reduced-motion: reduce)");
  SS.reduced = () => mq.matches;

  /* ---------- math ---------- */
  SS.clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  SS.lerp = (a, b, t) => a + (b - a) * t;
  SS.range = (v, a, b) => SS.clamp((v - a) / (b - a));
  SS.easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  SS.easeOut = (t) => 1 - Math.pow(1 - t, 3);
  SS.easeIn = (t) => t * t * t;

  /* ---------- one rAF ticker ---------- */
  const subs = new Set();
  let raf = 0;
  let last = 0;
  const loop = (t) => {
    const dt = Math.min(0.064, last ? (t - last) / 1000 : 1 / 60);
    last = t;
    for (const fn of Array.from(subs)) fn(dt, t);
    raf = subs.size ? requestAnimationFrame(loop) : 0;
    if (!raf) last = 0;
  };
  SS.tick = (fn) => {
    subs.add(fn);
    if (!raf) raf = requestAnimationFrame(loop);
    return () => subs.delete(fn);
  };

  /* ---------- spring ----------
     damping: 1 = critically damped (no overshoot), <1 bounces.
     response: seconds to (roughly) reach the target. Not a duration. */
  class Spring {
    constructor(value = 0, { damping = 1, response = 0.4 } = {}) {
      this.value = value;
      this.target = value;
      this.velocity = 0;
      this.config({ damping, response });
    }
    config({ damping = this.damping, response = this.response } = {}) {
      this.damping = damping;
      this.response = response;
      this.k = Math.pow((2 * Math.PI) / response, 2);
      this.c = (4 * Math.PI * damping) / response;
      return this;
    }
    step(dt) {
      const n = Math.max(1, Math.ceil(dt / (1 / 240)));
      const h = dt / n;
      for (let i = 0; i < n; i++) {
        const a = -this.k * (this.value - this.target) - this.c * this.velocity;
        this.velocity += a * h;
        this.value += this.velocity * h;
      }
      const settled = Math.abs(this.velocity) < 1e-4 && Math.abs(this.target - this.value) < 1e-4;
      if (settled) { this.value = this.target; this.velocity = 0; }
      return !settled;
    }
    snap(v) { this.value = this.target = v; this.velocity = 0; return this; }
  }
  SS.Spring = Spring;

  /* ---------- spring-solved CSS easing via linear() ---------- */
  function solve(damping, response) {
    const s = new Spring(0, { damping, response });
    s.target = 1;
    const pts = [];
    const dt = 1 / 600;
    let t = 0;
    while (t < 4) {
      pts.push([t, s.value]);
      s.step(dt);
      t += dt;
      if (Math.abs(1 - s.value) < 0.0008 && Math.abs(s.velocity) < 0.01) break;
    }
    const dur = t;
    const N = 48;
    const out = [];
    for (let i = 0; i <= N; i++) {
      const idx = Math.min(pts.length - 1, Math.round((i / N) * (pts.length - 1)));
      out.push(+pts[idx][1].toFixed(4));
    }
    out[out.length - 1] = 1;
    return { easing: `linear(${out.join(", ")})`, ms: Math.round(dur * 1000) };
  }
  if (window.CSS && CSS.supports("transition-timing-function", "linear(0, 1)")) {
    const root = document.documentElement.style;
    const a = solve(0.86, 0.55); // UI spring — a whisper of overshoot
    const b = solve(1, 0.7);     // soft critically-damped for big type
    root.setProperty("--spring", a.easing);
    root.setProperty("--spring-dur", a.ms + "ms");
    root.setProperty("--spring-soft", b.easing);
    root.setProperty("--spring-soft-dur", b.ms + "ms");
  }

  /* ---------- text splitting (keeps inline markup + an accessible copy) ---------- */
  SS.split = (el) => {
    if (el.dataset.splitDone) return;
    el.dataset.splitDone = "1";
    const plain = el.textContent.replace(/\s+/g, " ").trim();
    let i = 0;
    const walk = (node, into) => {
      node.childNodes.forEach((child) => {
        if (child.nodeType === 3) {
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { into.appendChild(document.createTextNode(" ")); return; }
            const w = document.createElement("span");
            w.className = "w";
            w.style.setProperty("--i", i++);
            w.textContent = part;
            into.appendChild(w);
          });
        } else if (child.nodeName === "BR") {
          into.appendChild(document.createElement("br"));
        } else if (child.nodeType === 1) {
          const shell = child.cloneNode(false);
          walk(child, shell);
          into.appendChild(shell);
        }
      });
    };
    const frag = document.createElement("span");
    frag.setAttribute("aria-hidden", "true");
    walk(el, frag);
    const sr = document.createElement("span");
    sr.className = "sr";
    sr.textContent = plain;
    el.textContent = "";
    el.append(sr, frag);
    return i;
  };

  /* ---------- in-view helper ---------- */
  SS.inView = (el, cb, margin = "0px 0px -12% 0px") => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { cb(e.target); io.unobserve(e.target); }
      });
    }, { rootMargin: margin });
    io.observe(el);
  };

  /* visibility gate: runs fn only while el is on screen */
  SS.whileVisible = (el, fn, margin = "100px") => {
    let off = null;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !off) off = SS.tick(fn);
      else if (!e.isIntersecting && off) { off(); off = null; }
    }, { rootMargin: margin });
    io.observe(el);
  };

  /* ---------- smooth scroll (Lenis), never on reduced motion ---------- */
  SS.lenis = null;
  if (window.Lenis && !mq.matches) {
    SS.lenis = new window.Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 1 });
    SS.tick((dt, t) => SS.lenis.raf(t));
  } else {
    document.documentElement.classList.add("native-smooth");
  }
  SS.scrollTo = (target) => {
    const el = typeof target === "string" ? document.querySelector(target) : target;
    if (!el) return;
    let top = 0;
    if (el !== document.body && el.id !== "top") {
      // land on the section's heading, just under the nav — not on its padded outer edge
      const anchor = el.querySelector(".sec__head") || el;
      const nav = document.querySelector("[data-nav]");
      const navH = nav ? nav.offsetHeight : 60;
      top = anchor.getBoundingClientRect().top + scrollY - navH - 28;
      const max = document.documentElement.scrollHeight - innerHeight;
      top = Math.max(0, Math.min(max, top));
    }
    SS.navHold = performance.now() + 2600; // keep the nav on screen through the glide
    if (SS.lenis) {
      const dist = Math.abs(top - scrollY);
      SS.lenis.scrollTo(top, { duration: Math.min(2.2, 0.9 + dist / 6000), easing: (x) => 1 - Math.pow(1 - x, 4) });
    } else window.scrollTo({ top, behavior: mq.matches ? "auto" : "smooth" });
  };
})();
