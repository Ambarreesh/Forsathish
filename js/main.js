/* Page orchestration: hero intro (name fit + letter rise, portrait rise),
   nav (inverts over dark, spring underline, progress), the sticky stack,
   reveals, scrubbed profile copy, counters, chequered seams, project art,
   research printer, copy-email. */
(() => {
  const SS = window.SS;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ==================== hero name: fit the word to the sheet ==================== */
  const word = $("[data-name]");
  const text = word.textContent;
  word.textContent = "";
  const clip = document.createElement("span");
  clip.className = "hero__clip";
  [...text].forEach((c, i) => {
    const s = document.createElement("span");
    s.className = "ch";
    s.style.setProperty("--i", i);
    s.textContent = c;
    clip.appendChild(s);
  });
  word.appendChild(clip);

  const fitName = () => {
    const vw = document.documentElement.clientWidth;
    const target = vw - 2 * (vw < 760 ? 14 : Math.min(56, vw * 0.036));
    word.style.setProperty("--name-size", "100px");
    const w = clip.getBoundingClientRect().width || 1;
    const vh = innerHeight;
    const desk = !matchMedia("(max-width: 760px), (max-width: 1100px) and (orientation: portrait)").matches;
    // fit the width, but never taller than ~40% of the screen (ultrawide, short laptops)
    const nameBox = $(".hero__name");
    let size = Math.min((100 * target) / w, desk ? vh * 0.42 : Infinity);
    if (!desk) { word.style.setProperty("--name-size", size.toFixed(2) + "px"); nameBox.style.top = ""; return; }
    // sit the word between the intro block and the footer, clear of both
    const left = $(".hero__left");
    const leftBottom = left.offsetTop + left.offsetHeight;
    size = Math.max(90, Math.min(size, (vh - 56 - 28 - (leftBottom + 20)) / 0.8));
    word.style.setProperty("--name-size", size.toFixed(2) + "px");
    const h = size * 0.8;
    const ideal = vh * 0.58 - h / 2;
    const top = Math.min(Math.max(ideal, leftBottom + 20), vh - 56 - h - 24);
    nameBox.style.top = Math.max(leftBottom + 8, top).toFixed(0) + "px";
    nameBox.style.translate = "0 0";
  };
  fitName();
  addEventListener("resize", fitName);

  // intro: wait for fonts (so the fit is right) but never longer than 1.2s
  $$("[data-intro]").forEach((el, i) => el.style.setProperty("--d", 300 + i * 120));
  const go = () => { if (document.body.classList.contains("is-ready")) return; fitName(); document.body.classList.add("is-ready"); };
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => setTimeout(go, 60));
  setTimeout(go, 1200);

  /* ==================== in-page links glide (and play the car film on the way) ==================== */
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href");
    if (id.length < 2 && id !== "#") return;
    const el = id === "#" || id === "#top" ? document.body : document.querySelector(id);
    if (!el) return;
    e.preventDefault();
    SS.scrollTo(el);
    if (id !== "#top") history.replaceState(null, "", id);
  });

  $$(".sec__head").forEach((h) => SS.inView(h, (t) => t.classList.add("is-in"), "0px 0px -6% 0px"));

  /* ==================== split + reveal ==================== */
  $$("[data-split]").forEach((el) => { SS.split(el); SS.inView(el, (t) => t.classList.add("is-in"), "0px 0px -8% 0px"); });
  $$("[data-reveal]").forEach((el) => {
    const sib = el.parentElement ? $$(":scope > [data-reveal]", el.parentElement) : [];
    el.style.setProperty("--d", Math.max(0, sib.indexOf(el)) * 70);
    SS.inView(el, (t) => t.classList.add("is-in"));
  });

  /* ==================== counters ==================== */
  $$("[data-count]").forEach((el) => {
    const to = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.decimals || "0", 10);
    SS.inView(el, () => {
      if (SS.reduced()) { el.textContent = to.toFixed(dec); return; }
      const s = new SS.Spring(0, { damping: 1, response: 1.1 });
      s.target = to;
      const off = SS.tick((dt) => {
        const moving = s.step(dt);
        el.textContent = s.value.toFixed(dec);
        if (!moving) { el.textContent = to.toFixed(dec); off(); }
      });
    });
  });

  /* ==================== nav ==================== */
  const nav = $("[data-nav]");
  const links = $$("[data-link]", nav);
  const bar = $(".nav__bar", nav);
  const prog = $(".nav__progress i", nav);
  const bx = new SS.Spring(0, { damping: 0.9, response: 0.35 });
  const bw = new SS.Spring(0, { damping: 0.9, response: 0.35 });
  let barOn = false;
  const targets = links.map((a) => $(a.getAttribute("href")));
  const darks = $$(".drive, .contact");
  let lastY = scrollY;

  SS.tick((dt) => {
    const y = scrollY, vh = innerHeight;
    if (y > vh && y > lastY + 6 && !(SS.navHold > performance.now())) nav.classList.add("is-hidden");
    else if (y < lastY - 6 || y < vh) nav.classList.remove("is-hidden");
    lastY = y;
    const probe = 30;
    nav.classList.toggle("on-dark", darks.some((s) => { const r = s.getBoundingClientRect(); return r.top <= probe && r.bottom >= probe; }));
    const max = document.documentElement.scrollHeight - vh;
    prog.style.transform = `scaleX(${(y / Math.max(1, max)).toFixed(4)})`;

    let cur = null;
    targets.forEach((s, i) => { if (!s) return; const r = s.getBoundingClientRect(); if (r.top <= vh * 0.35 && r.bottom > vh * 0.35) cur = links[i]; });
    links.forEach((a) => a.classList.toggle("is-active", a === cur));
    if (cur) {
      const r = cur.getBoundingClientRect(), pr = cur.parentElement.getBoundingClientRect();
      bx.target = r.left - pr.left + 14; bw.target = r.width - 28;
      if (!barOn) { bx.snap(bx.target); bw.snap(bw.target); barOn = true; }
      bar.style.opacity = "1";
    } else { bar.style.opacity = "0"; barOn = false; }
    bx.step(dt); bw.step(dt);
    bar.style.transform = `translateX(${bx.value.toFixed(2)}px)`;
    bar.style.width = Math.max(0, bw.value).toFixed(2) + "px";
  });

  // mobile sheet
  const menu = $(".nav__menu");
  const sheet = $("#sheet");
  $$("nav a", sheet).forEach((a, i) => a.style.setProperty("--i", i));
  const openSheet = (open) => {
    menu.setAttribute("aria-expanded", String(open));
    menu.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.style.overflow = open ? "hidden" : ""; if (SS.lenis) open ? SS.lenis.stop() : SS.lenis.start();
    if (open) { sheet.hidden = false; requestAnimationFrame(() => sheet.classList.add("is-open")); }
    else { sheet.classList.remove("is-open"); setTimeout(() => { if (menu.getAttribute("aria-expanded") === "false") sheet.hidden = true; }, 320); }
  };
  menu.addEventListener("click", () => openSheet(menu.getAttribute("aria-expanded") !== "true"));
  $$("a", sheet).forEach((a) => a.addEventListener("click", () => openSheet(false)));
  addEventListener("keydown", (e) => { if (e.key === "Escape" && menu.getAttribute("aria-expanded") === "true") { openSheet(false); menu.focus(); } });

  /* ==================== stack: hero recedes, name & portrait parallax ==================== */
  const heroInner = $(".hero .layer__inner");
  const heroShade = $(".hero .layer__shade");
  const profile = $(".profile");
  const nameEl = $(".hero__name");
  const photo = $(".hero__photo");
  const phone = matchMedia("(max-width: 639px)");
  SS.tick(() => {
    const vh = innerHeight || 1;
    const p = SS.clamp(1 - profile.getBoundingClientRect().top / vh);
    const shrink = phone.matches || SS.reduced() ? 0 : 0.06;
    heroInner.style.transform = p > 0 && shrink ? `scale(${(1 - shrink * p).toFixed(4)})` : "";
    heroShade.style.opacity = (0.55 * p).toFixed(3);
    heroInner.style.visibility = p >= 1 ? "hidden" : "";
    if (!SS.reduced()) {
      nameEl.style.transform = `translate3d(0, ${(-p * 60).toFixed(1)}px, 0)`;
      photo.style.transform = `translate3d(0, ${(p * 40).toFixed(1)}px, 0)`;
    }
  });

  /* ==================== profile copy lights up as you read ==================== */
  $$("[data-scrub]").forEach((el) => {
    SS.split(el);
    const ws = $$(".w", el);
    const sm = new SS.Spring(0, { damping: 1, response: 0.3 });
    SS.whileVisible(el, (dt) => {
      const r = el.getBoundingClientRect(), vh = innerHeight;
      sm.target = SS.reduced() ? 1 : SS.clamp((vh * 0.85 - r.top) / (r.height + vh * 0.25));
      sm.step(dt);
      const n = sm.value * (ws.length + 3);
      ws.forEach((w, i) => { w.style.opacity = (0.18 + 0.82 * SS.clamp(n - i)).toFixed(3); });
    });
  });

  /* ==================== chequered flag seams (paper into ink) ==================== */
  const noise = (x, y) => {
    let h = Math.imul(x, 374761393) + Math.imul(y, 668265263);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  };
  const css = getComputedStyle(document.documentElement);
  const PAPER = css.getPropertyValue("--paper").trim() || "#f1efea";
  const ACCENT = css.getPropertyValue("--accent").trim() || "#ff4f00";
  const DARK = css.getPropertyValue("--dark").trim() || "#121212";
  $$(".checker").forEach((cv) => {
    const ctx = cv.getContext("2d");
    const SURF = cv.dataset.carry === "dark" ? DARK : PAPER;
    const host = cv.parentElement;
    let w = 0, h = 0, ratio = 1, last = -1;
    const size = () => { ratio = Math.min(devicePixelRatio || 1, 2); w = cv.clientWidth; h = cv.clientHeight; cv.width = w * ratio; cv.height = h * ratio; last = -1; };
    size(); addEventListener("resize", size);
    const CELL = innerWidth < 640 ? 16 : 24, SOLID = 0.16, LIFT = 2, ACC = 0.05;
    SS.whileVisible(cv, () => {
      const p = SS.clamp(1 - host.getBoundingClientRect().top / innerHeight);
      if (Math.abs(p - last) < 0.0005) return;
      last = p;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const cols = Math.ceil(w / CELL), rows = Math.ceil(h / CELL), lift = p * LIFT;
      for (let y = 0; y < rows; y++) {
        const depth = y / Math.max(1, rows - 1) + lift;
        if (depth > 1) break;
        const solid = depth <= SOLID;
        const fade = SS.clamp(1 - (depth - SOLID) / (1 - SOLID));
        if (!solid && fade <= 0) break;
        for (let x = 0; x < cols; x++) {
          if (!solid) { if ((x + y) % 2) continue; if (noise(x, y) > fade) continue; }
          ctx.fillStyle = !solid && noise(x + 101, y + 57) < ACC ? ACCENT : SURF;
          ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
        }
      }
    }, "0px");
  });

  /* ==================== project art ==================== */
  $$(".proj").forEach((p) => SS.inView(p, (t) => t.classList.add("is-in"), "0px 0px -15% 0px"));
  const pellets = $(".art-peltier .pellets");
  if (pellets) {
    for (let i = 0; i < 10; i++) {
      const r = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      r.setAttribute("x", 100 + i * 20.5); r.setAttribute("y", 102); r.setAttribute("width", 12); r.setAttribute("height", 54);
      r.setAttribute("class", i % 2 ? "n" : "p");
      pellets.appendChild(r);
    }
  }

  /* ==================== research: FFF printing → compression ==================== */
  const printer = $(".printer");
  if (printer) {
    const NS = "http://www.w3.org/2000/svg";
    const layersG = $(".pr-layers", printer);
    const nozzle = $(".pr-nozzle", printer);
    const platen = $(".pr-platen", printer);
    const phaseEl = $(".pr-phase", printer);
    const N = 9, LH = 22, X0 = 110, X1 = 310, BED = 330;
    const layers = [];
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < N; i++) {
      const g = document.createElementNS(NS, "g");
      const rect = document.createElementNS(NS, "rect");
      rect.setAttribute("x", X0); rect.setAttribute("y", BED - (i + 1) * LH); rect.setAttribute("height", LH - 2); rect.setAttribute("width", 0);
      g.appendChild(rect);
      const dots = [];
      for (let k = 0; k < 9; k++) {
        const c = document.createElementNS(NS, "circle");
        const fx = X0 + 8 + rnd() * (X1 - X0 - 16);
        c.setAttribute("cx", fx.toFixed(1)); c.setAttribute("cy", (BED - (i + 1) * LH + 4 + rnd() * (LH - 10)).toFixed(1)); c.setAttribute("r", (1 + rnd() * 1.4).toFixed(2));
        c.setAttribute("opacity", "0");
        g.appendChild(c); dots.push({ c, fx });
      }
      layersG.appendChild(g);
      layers.push({ rect, dots, y: BED - (i + 1) * LH });
    }
    const PRINT = 0.62, T_PRINT = N * PRINT, T_PRESS = 2.6, T_HOLD = 0.8, CYCLE = T_PRINT + T_PRESS + T_HOLD;
    let time = SS.reduced() ? T_PRINT + 1.2 : 0;
    SS.whileVisible(printer, (dt) => {
      if (!SS.reduced()) time = (time + dt) % CYCLE;
      const t = time;
      const printing = t < T_PRINT;
      const li = Math.min(N - 1, Math.floor(t / PRINT));
      const lp = printing ? (t % PRINT) / PRINT : 1;
      const press = printing ? 0 : SS.clamp((t - T_PRINT) / T_PRESS);
      const squash = Math.sin(Math.PI * SS.clamp(press * 1.25)) * 0.06;
      layers.forEach((L, i) => {
        const w = i < li || !printing ? X1 - X0 : i === li ? (X1 - X0) * lp : 0;
        const dir = i % 2 === 0;
        const yy = BED - (BED - L.y) * (1 - squash);
        L.rect.setAttribute("width", w.toFixed(1));
        L.rect.setAttribute("x", (dir ? X0 : X1 - w).toFixed(1));
        L.rect.setAttribute("y", yy.toFixed(1));
        L.rect.setAttribute("height", ((LH - 2) * (1 - squash)).toFixed(2));
        L.dots.forEach(({ c, fx }) => c.setAttribute("opacity", (dir ? fx <= X0 + w : fx >= X1 - w) ? "1" : "0"));
      });
      const top = BED - N * LH * (1 - squash);
      if (printing) {
        const nx = li % 2 === 0 ? X0 + (X1 - X0) * lp : X1 - (X1 - X0) * lp;
        nozzle.setAttribute("transform", `translate(${nx.toFixed(1)} ${(layers[li].y - 2).toFixed(1)})`);
        nozzle.style.opacity = "1";
        phaseEl.textContent = `Printing · layer ${String(li + 1).padStart(2, "0")}`;
      } else {
        nozzle.style.opacity = String(1 - SS.clamp(press * 5));
        phaseEl.textContent = press < 0.9 ? "Compression test" : "Unload";
      }
      const descend = SS.easeInOut(SS.clamp(press * 2.2));
      const lift = SS.easeInOut(SS.clamp((press - 0.75) * 4));
      platen.setAttribute("transform", `translate(0 ${SS.lerp(40, top - 22, descend * (1 - lift)).toFixed(1)})`);
      platen.style.opacity = printing ? "0.3" : "1";
    });
  }

  /* ==================== copy email ==================== */
  const toast = $(".toast");
  let toastT = 0;
  const say = (msg) => { toast.textContent = msg; toast.classList.add("is-on"); clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove("is-on"), 2000); };
  const copy = $("[data-copy]");
  copy.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(copy.dataset.copy); copy.textContent = "Copied ✓"; say("Email address copied"); }
    catch { location.href = "mailto:" + copy.dataset.copy; }
    setTimeout(() => (copy.textContent = "Copy address"), 2000);
  });

  /* ==================== proof photos: tap a drawing, see the real thing ==================== */
  const dlg = $(".proof");
  if (dlg && dlg.showModal) {
    const img = $(".proof__img", dlg), cap = $(".proof__cap", dlg);
    const title = $(".proof__title", dlg), count = $(".proof__count", dlg);
    const prev = $(".proof__nav--prev", dlg), next = $(".proof__nav--next", dlg);
    const stageEl = $(".proof__stage", dlg);
    const EASE_IN = "cubic-bezier(0.22, 1, 0.36, 1)", EASE_OUT = "cubic-bezier(0.33, 0, 0, 1)";
    let list = [], at = 0, origin = null;

    const inset = (r) => `inset(${Math.max(0, r.top)}px ${Math.max(0, innerWidth - r.right)}px ${Math.max(0, innerHeight - r.bottom)}px ${Math.max(0, r.left)}px)`;
    const show = (i, dir = 0) => {
      at = (i + list.length) % list.length;
      const it = list[at];
      img.src = it.src;
      img.alt = it.cap || "";
      cap.textContent = it.cap || "";
      count.textContent = `${at + 1} / ${list.length}`;
      prev.hidden = next.hidden = list.length < 2;
      if (dir && !SS.reduced()) img.animate([{ opacity: 0, transform: `translateX(${dir * 28}px)` }, { opacity: 1, transform: "none" }], { duration: 460, easing: EASE_IN });
    };
    const open = (fig) => {
      try { list = JSON.parse(fig.dataset.proof); } catch { return; }
      if (!list.length) return;
      origin = fig;
      title.textContent = fig.dataset.title || "Proof";
      show(0);
      dlg.showModal();
      if (SS.lenis) SS.lenis.stop();
      // grow out of the drawing that was tapped, and shrink back into it on close
      if (!SS.reduced()) dlg.animate([{ clipPath: inset(fig.getBoundingClientRect()), opacity: 0.5 }, { clipPath: "inset(0px 0px 0px 0px)", opacity: 1 }], { duration: 560, easing: EASE_IN });
    };
    const close = () => {
      if (!dlg.open) return;
      if (SS.reduced() || !origin) { dlg.close(); return; }
      const a = dlg.animate([{ clipPath: "inset(0px 0px 0px 0px)", opacity: 1 }, { clipPath: inset(origin.getBoundingClientRect()), opacity: 0.3 }], { duration: 380, easing: EASE_OUT });
      a.onfinish = () => dlg.close();
    };
    dlg.addEventListener("close", () => { if (SS.lenis) SS.lenis.start(); if (origin) origin.focus({ preventScroll: true }); });
    dlg.addEventListener("cancel", (e) => { e.preventDefault(); close(); });
    $(".proof__close", dlg).addEventListener("click", close);
    prev.addEventListener("click", () => show(at - 1, -1));
    next.addEventListener("click", () => show(at + 1, 1));
    dlg.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft" && list.length > 1) show(at - 1, -1);
      if (e.key === "ArrowRight" && list.length > 1) show(at + 1, 1);
    });
    // swipe between photos; a plain tap on the dark area closes
    let sx = null;
    stageEl.addEventListener("pointerdown", (e) => { sx = e.clientX; });
    stageEl.addEventListener("pointerup", (e) => {
      if (sx === null) return;
      const dx = e.clientX - sx; sx = null;
      if (Math.abs(dx) > 50 && list.length > 1) show(at + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
      else if (Math.abs(dx) < 6 && e.target === stageEl) close();
    });

    $$(".proj__fig[data-proof]").forEach((fig) => {
      let n = 0;
      try { n = JSON.parse(fig.dataset.proof).length; } catch {}
      if (!n) return;
      fig.removeAttribute("aria-hidden");
      const svg = $("svg", fig);
      if (svg) svg.setAttribute("aria-hidden", "true");
      fig.setAttribute("role", "button");
      fig.setAttribute("tabindex", "0");
      fig.setAttribute("aria-label", `View ${n} proof photo${n > 1 ? "s" : ""}: ${fig.dataset.title || "project"}`);
      const badge = document.createElement("span");
      badge.className = "proof-badge";
      badge.setAttribute("aria-hidden", "true");
      badge.textContent = `Proof photos · ${n}`;
      fig.appendChild(badge);
      fig.addEventListener("click", () => open(fig));
      fig.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(fig); } });
    });
  }
})();
