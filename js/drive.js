/* The drive — a pinned, scroll-scrubbed studio sequence on the ultra-HD car.
   1) studio lights sweep the car out of the dark, headlights ignite
   2) HUD callouts tie each part of the car to real work
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

  // the photograph only needs the top tier once the camera starts diving in
  car.src = "assets/car-3840.jpg";
  car.removeAttribute("srcset");

  /* ---------- blueprint detail, generated ---------- */
  const NS = "http://www.w3.org/2000/svg";
  const mk = (tag, attrs, parent) => {
    const el = document.createElementNS(NS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    parent.appendChild(el);
    return el;
  };
  const holes = bp.querySelector(".bp-holes");
  for (let ring = 0; ring < 2; ring++) {
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2 + ring * 0.17;
      const r = 100 + ring * 9;
      mk("circle", { class: "bp bp--3", cx: (Math.cos(a) * r).toFixed(2), cy: (Math.sin(a) * r).toFixed(2), r: 2.6, pathLength: 1 }, holes);
    }
  }
  const spokes = bp.querySelector(".bp-spokes");
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const p = (r, d) => `${(Math.cos(a + d) * r).toFixed(2)} ${(Math.sin(a + d) * r).toFixed(2)}`;
    mk("path", { class: "bp bp--2", pathLength: 1, d: `M${p(34, 0.12)} L${p(88, 0.06)} L${p(148, 0.2)} M${p(34, -0.12)} L${p(88, -0.06)} L${p(148, -0.2)} M${p(88, 0.06)} L${p(148, 0.05)} M${p(88, -0.06)} L${p(148, -0.05)}` }, spokes);
  }
  const studs = bp.querySelector(".bp-studs");
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2 + Math.PI / 5;
    mk("circle", { class: "stud", cx: (Math.cos(a) * 19).toFixed(2), cy: (Math.sin(a) * 19).toFixed(2), r: 4 }, studs);
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
  const veil = document.createElement("div");
  veil.style.cssText = "position:absolute;inset:0;background:var(--dark);opacity:0;pointer-events:none;z-index:2";
  stage.appendChild(veil);

  /* ---------- layout: frame the car to fit any screen shape ----------
     In the photo the car spans ~60% of the width and ~50% of the height, centred
     at (51.5%, 52%). Size the frame so the car fits the viewport with breathing
     room, then centre the car. The frame edges are masked into the stage colour,
     so the photo never needs to "cover". */
  const AR = 16 / 9;
  const WHEEL = [0.561, 0.606];
  let vw = 0, vh = 0, fw = 0, fh = 0, fx = 0, fy = 0, phone = false, nudged = false;
  const layout = () => {
    vw = innerWidth; vh = innerHeight;
    phone = vw < 760;
    fw = Math.min(vw * (phone ? 1.6 : 1.42), vh * 2.45);
    fw = Math.max(fw, Math.min(vw * 1.05, vh * AR * 1.4));
    fh = fw / AR;
    fx = vw / 2 - fw * 0.515;
    fy = vh * (phone ? 0.5 : 0.55) - fh * 0.52;
    nudged = false;
  };
  layout();
  addEventListener("resize", () => { layout(); render(prog.value, true); });

  // keep every callout label fully on screen, whatever the aspect ratio
  const nudge = () => {
    callouts.forEach((c) => {
      const label = c.querySelector("div");
      label.style.translate = "0 0";
      const r = label.getBoundingClientRect();
      if (!r.width) return;
      let dx = 0, dy = 0;
      if (r.left < 16) dx = 16 - r.left;
      if (r.right > vw - 16) dx = vw - 16 - r.right;
      if (r.top < 76) dy = 76 - r.top;
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

    // 2 · studio sweep + headlights
    const sweep = SS.easeInOut(R(p, 0.12, 0.38));
    shade.style.backgroundPosition = `${((1 - sweep) * 100).toFixed(2)}% 0`;
    const ign = R(p, 0.3, 0.36);
    const bump = Math.sin(Math.PI * R(p, 0.3, 0.42));
    const zoomK = R(p, 0.66, 0.8);
    glows.forEach((g, i) => {
      const flick = ign > 0 && ign < 1 ? (Math.sin(ign * 40 + i) > 0 ? 1 : 0.35) : 1;
      g.style.opacity = Math.max(0, (ign * flick * 0.85 + bump * 0.45) * (1 - zoomK)).toFixed(3);
    });

    // the studio around the photo lights up with it (no black band on tall screens)
    const lit = SS.clamp(sweep * 1.15);
    stage.style.backgroundColor = `rgb(${Math.round(34 * lit)}, ${Math.round(27 * lit)}, ${Math.round(45 * lit)})`;

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
    const sMax = phone ? 4.2 : 5.6;
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
