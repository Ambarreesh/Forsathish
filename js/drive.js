/* The drive — a pinned, scroll-scrubbed sequence on Team Yaalee's SAE E-BAJA car (E12).
   1) light sweeps the car out of the dark, the amber beacon starts to blink
   2) callouts tie each part of the car to his roles on the team
   3) the camera dives into the front wheel and the photo becomes a blueprint */
(() => {
  const SS = window.SS;
  const sec = document.querySelector(".drive");
  if (!sec) return;
  const $ = (s) => sec.querySelector(s);
  const $$ = (s) => Array.from(sec.querySelectorAll(s));

  const stage = $(".drive__stage");
  const frame = $(".drive__frame");
  const car = $(".drive__car");
  const shade = $(".drive__shade");
  const glows = $$(".drive__glow");
  const bp = $(".drive__blueprint");
  const spin = bp.querySelector(".bp-spin");
  const dims = bp.querySelector(".bp-dims");
  const callouts = $$(".callout");
  const words = $$(".drive__title h2 span");
  const eyebrow = $(".drive__title .kicker");
  const sub = $(".drive__sub");
  const finals = $$(".drive__final span");
  const caption = $(".drive__caption");
  const idx = $$(".drive__index li");

  /* ---------- blueprint detail, generated: knobby off-road tyre, dish rim, drilled disc ---------- */
  const NS = "http://www.w3.org/2000/svg";
  const mk = (tag, attrs, parent) => {
    const el = document.createElementNS(NS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    parent.appendChild(el);
    return el;
  };
  const tread = bp.querySelector(".bp-tread");
  for (let i = 0; i < 28; i++) {
    // alternating tread lugs between the tyre's outer and inner walls
    const a = (i / 28) * Math.PI * 2;
    const d = 0.07, r1 = 148, r2 = i % 2 ? 160 : 168;
    const pt = (r, o) => `${(Math.cos(a + o) * r).toFixed(2)} ${(Math.sin(a + o) * r).toFixed(2)}`;
    mk("path", { class: "bp bp--3", pathLength: 1, d: `M${pt(r1, -d)} L${pt(r2, -d)} L${pt(r2, d)} L${pt(r1, d)}` }, tread);
  }
  const holes = bp.querySelector(".bp-holes");
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    mk("circle", { class: "bp bp--3", cx: (Math.cos(a) * 79).toFixed(2), cy: (Math.sin(a) * 79).toFixed(2), r: 3, pathLength: 1 }, holes);
  }
  const studs = bp.querySelector(".bp-studs");
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    mk("circle", { class: "stud", cx: (Math.cos(a) * 21).toFixed(2), cy: (Math.sin(a) * 21).toFixed(2), r: 4.2 }, studs);
  }
  const bpLines = Array.from(bp.querySelectorAll(".bp"));
  bpLines.forEach((el, i) => { el.dataset.o = (i / bpLines.length) * 0.55; });

  /* ---------- mobile caption ---------- */
  const caps = callouts.map((c) => {
    const d = document.createElement("div");
    d.className = "cap";
    d.innerHTML = c.querySelector("div").innerHTML;
    d.style.cssText = "position:absolute;left:0;right:0;bottom:0;opacity:0;transition:none";
    caption.appendChild(d);
    return d;
  });
  caption.style.height = "92px";

  /* ---------- end veil (merges into the next section) ---------- */
  // blurred copy of the photo fills any space the framed photo doesn't (ultrawide / tall screens)
  const ambient = document.createElement("div");
  ambient.className = "drive__ambient";
  ambient.setAttribute("aria-hidden", "true");
  stage.insertBefore(ambient, stage.firstChild);

  const veil = document.createElement("div");
  veil.style.cssText = "position:absolute;inset:0;background:var(--dark);opacity:0;pointer-events:none;z-index:2";
  stage.appendChild(veil);

  /* ---------- layout: frame the car to fit any screen shape ----------
     Measured on the 1280×960 photo: the car (beacon to tyres) spans x 23–71%,
     y 23.5–78.5%, centred at (47%, 51%). Cover the screen when that still keeps
     the whole car in view; otherwise shrink until the car fits (≤ 74% of the
     height, ≤ 52% of the width on phones). Edges are masked into the stage. */
  const AR = 4 / 3;
  const CAR = { cx: 0.47, cy: 0.51, w: 0.48, h: 0.55 };
  const WHEEL = [0.281, 0.693]; // front-left wheel centre
  let vw = 0, vh = 0, fw = 0, fh = 0, fx = 0, fy = 0, phone = false, nudged = false;
  const layout = () => {
    vw = innerWidth; vh = innerHeight;
    phone = vw < 760;
    const cover = Math.max(vw, vh * AR);
    const byHeight = (vh * 0.86) / CAR.h * AR;      // frame width at which the car is 86% of the height
    const byWidth = (vw * (phone ? 0.92 : 0.86)) / CAR.w;
    fw = Math.min(cover, byHeight, byWidth);
    fh = fw / AR;
    fx = vw / 2 - fw * CAR.cx;
    fy = vh * (phone ? 0.46 : 0.54) - fh * CAR.cy;
    nudged = false;
  };
  layout();
  addEventListener("resize", () => { layout(); render(prog.value, true); });

  // keep every callout label fully on screen, whatever the aspect ratio
  const nudge = () => {
    const st = stage.getBoundingClientRect(); // measure against the stage, not the viewport (it may be off-screen)
    callouts.forEach((c) => {
      const label = c.querySelector("div");
      label.style.translate = "0 0";
      const b = label.getBoundingClientRect();
      if (!b.width) return;
      const r = { left: b.left - st.left, right: b.right - st.left, top: b.top - st.top, bottom: b.bottom - st.top };
      let dx = 0, dy = 0;
      if (r.left < 16) dx = 16 - r.left;
      if (r.right > vw - 16) dx = vw - 16 - r.right;
      if (r.top < 76) dy = 76 - r.top;
      if (r.bottom + dy > vh - 16) dy = vh - 16 - r.bottom;
      label.style.translate = `${dx.toFixed(0)}px ${dy.toFixed(0)}px`;
    });
    nudged = true;
  };

  /* ---------- scrubbed state ---------- */
  const prog = new SS.Spring(0, { damping: 1, response: 0.22 });
  const R = SS.range;
  let lastKey = "";

  function render(p, force) {
    const key = p.toFixed(4);
    if (key === lastKey && !force) return;
    lastKey = key;

    // 1 · title
    words.forEach((w, i) => {
      const k = SS.easeOut(R(p, 0.015 + i * 0.03, 0.09 + i * 0.03));
      const o = SS.easeIn(R(p, 0.33, 0.41));
      w.style.opacity = (k * (1 - o)).toFixed(3);
      w.style.transform = `translate3d(0, ${((1 - k) * 0.5 - o * 0.4).toFixed(3)}em, 0)`;
    });
    const eo = R(p, 0.0, 0.05) * (1 - R(p, 0.31, 0.38));
    eyebrow.style.opacity = eo.toFixed(3);
    const so = SS.easeOut(R(p, 0.1, 0.17));
    const sOut = R(p, 0.32, 0.4);
    sub.style.opacity = (so * (1 - sOut)).toFixed(3);
    sub.style.transform = `translate3d(0, ${((1 - so) * 16 - sOut * 24).toFixed(1)}px, 0)`;

    // 2 · light sweep + the amber beacon on the roll hoop
    const sweep = SS.easeInOut(R(p, 0.12, 0.38));
    shade.style.backgroundPosition = `${((1 - sweep) * 100).toFixed(2)}% 0`;
    const ign = R(p, 0.3, 0.36);
    const zoomK = R(p, 0.64, 0.74);
    glows.forEach((g) => {
      g.style.opacity = Math.max(0, ign * (1 - zoomK)).toFixed(3);
      g.classList.toggle("is-on", ign > 0.9 && zoomK < 1);
    });

    // the ground around the photo lights up with it (no dark band on tall screens)
    const lit = SS.clamp(sweep * 1.15);
    stage.style.backgroundColor = `rgb(${Math.round(26 * lit)}, ${Math.round(23 * lit)}, ${Math.round(20 * lit)})`;
    ambient.style.opacity = (lit * (1 - R(p, 0.66, 0.8))).toFixed(3);

    // 3 · callouts
    let active = -1;
    callouts.forEach((c, i) => {
      const k = SS.easeOut(R(p, 0.42 + i * 0.045, 0.47 + i * 0.045));
      const o = R(p, 0.63, 0.67);
      const v = k * (1 - o);
      c.style.opacity = v.toFixed(3);
      const label = c.firstElementChild.nextElementSibling;
      label.style.transform = `translate3d(0, ${((1 - k) * 14).toFixed(1)}px, 0)`;
      c.firstElementChild.style.transform = `scale(${(0.4 + k * 0.6).toFixed(3)})`;
      if (k > 0.5 && o < 0.5) active = i;
    });
    caps.forEach((c, i) => {
      c.style.opacity = i === active ? "1" : "0";
      c.style.transform = i === active ? "none" : "translateY(8px)";
    });

    // 4 · dive into the wheel — sized in layout pixels (keeps the photo & vector sharp)
    const z = SS.easeInOut(R(p, 0.64, 0.93));
    const sMax = phone ? 3.4 : 3.8;
    const s = Math.pow(sMax, z);
    const W = fw * s, H = fh * s;
    const baseX = fx + WHEEL[0] * fw, baseY = fy + WHEEL[1] * fh;
    const cx = SS.lerp(baseX, vw / 2, z), cy = SS.lerp(baseY, vh * 0.46, z);
    const x = cx - WHEEL[0] * W, y = cy - WHEEL[1] * H;
    frame.style.width = W.toFixed(1) + "px";
    frame.style.height = H.toFixed(1) + "px";
    frame.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    if (!nudged && z === 0) nudge();

    // photo → blueprint
    const dark = R(p, 0.72, 0.86);
    car.style.opacity = (1 - dark * 0.88).toFixed(3);
    bp.style.opacity = (R(p, 0.7, 0.76) * (1 - R(p, 0.97, 1) * 0.6)).toFixed(3);
    const draw = R(p, 0.72, 0.9);
    for (const el of bpLines) {
      const o = +el.dataset.o;
      el.style.strokeDashoffset = (1 - SS.easeOut(SS.clamp((draw - o * 0.5) / 0.5))).toFixed(3);
    }
    dims.style.opacity = R(p, 0.86, 0.91).toFixed(3);
    spin.style.transform = `rotate(${((p - 0.64) * 260).toFixed(2)}deg)`;

    // final line + veil
    finals.forEach((f, i) => {
      const k = SS.easeOut(R(p, 0.87 + i * 0.03, 0.93 + i * 0.03));
      f.style.opacity = k.toFixed(3);
      f.style.transform = `translate3d(0, ${((1 - k) * 0.4).toFixed(3)}em, 0)`;
    });
    veil.style.opacity = R(p, 0.93, 1).toFixed(3);

    // index
    const phase = p < 0.42 ? 0 : p < 0.66 ? 1 : 2;
    idx.forEach((li, i) => li.classList.toggle("is-on", i === phase));
  }

  const measure = () => {
    const r = sec.getBoundingClientRect();
    const total = r.height - innerHeight;
    return SS.clamp(-r.top / Math.max(1, total));
  };

  if (SS.reduced()) {
    render(0.55, true);
    return;
  }

  prog.snap(measure());
  render(prog.value, true);
  SS.whileVisible(sec, (dt) => {
    prog.target = measure();
    // big jumps (nav clicks) shouldn't play the whole film at spring speed
    if (Math.abs(prog.target - prog.value) > 0.25) prog.value = prog.target - Math.sign(prog.target - prog.value) * 0.05;
    prog.step(dt);
    render(prog.value);
  }, "200px");
})();
