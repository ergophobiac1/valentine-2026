/* =========================================================
   Cute "Be My Valentine?" interactions
   - Plain JS + pointer events (desktop + mobile)
   - "No" runs away when pointer gets close
   - After first evade: 5s timer -> "No" fades out + becomes non-interactive
   - Each evade grows the "Yes" button (CSS variable --yes-scale)
   - Clicking "Yes" swaps banner, disables buttons, heart pop + confetti
   - Respects prefers-reduced-motion
   ========================================================= */

(() => {
  // --------------------------
  // Constants (grouped & named)
  // --------------------------
  const EVADE_DISTANCE_MOUSE = 90; // px: how close the pointer can get before "No" flees
  const EVADE_DISTANCE_TOUCH = 110; // slightly larger for touch
  const RUN_DISTANCE = 140; // px: how far the "No" button tries to jump
  const EVADE_COOLDOWN_MS = 220; // prevents rapid-fire triggers
  const NO_DISAPPEAR_MS = 5000; // required: 5 seconds
  const AREA_PADDING = 14; // keeps "No" away from the edges
  const YES_SCALE_STEP = 0.14; // per evade
  const YES_SCALE_MAX = 1.85; // sensible max size

  const CONFETTI_COUNT = 120;
  const CONFETTI_MIN_MS = 1400;
  const CONFETTI_MAX_MS = 2600;

  // --------------------------
  // Elements
  // --------------------------
  const card = document.getElementById("card");
  const title = document.getElementById("title");
  const subtitle = document.getElementById("subtitle");
  const hint = document.getElementById("hint");

  const buttonArea = document.getElementById("buttonArea");
  const yesBtn = document.getElementById("yesBtn");
  const noBtn = document.getElementById("noBtn");

  const heartPop = document.getElementById("heartPop");
  const confettiRoot = document.getElementById("confettiRoot");

  // --------------------------
  // Motion preferences
  // --------------------------
  const reduceMotion = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)"
  )?.matches;

  // --------------------------
  // State
  // --------------------------
  let evades = 0;
  let yesScale = 1;
  let noTimerStarted = false;
  let noIsGone = false;
  let lastEvadeAt = 0;

  // Store "No" position in button-area coordinates (px, button center)
  const noPos = { x: 0, y: 0 };

  // --------------------------
  // Helpers
  // --------------------------
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const rand = (min, max) => Math.random() * (max - min) + min;

  function now() {
    return performance.now();
  }

  function getAreaSize() {
    return {
      w: buttonArea.clientWidth,
      h: buttonArea.clientHeight,
    };
  }

  function getNoHalfSize() {
    // offsetWidth/Height are reliable for positioned elements
    return {
      hw: noBtn.offsetWidth / 2,
      hh: noBtn.offsetHeight / 2,
    };
  }

  function boundsForNo() {
    const { w, h } = getAreaSize();
    const { hw, hh } = getNoHalfSize();

    return {
      minX: AREA_PADDING + hw,
      maxX: w - AREA_PADDING - hw,
      minY: AREA_PADDING + hh,
      maxY: h - AREA_PADDING - hh,
    };
  }

  function setNoPosition(x, y) {
    const b = boundsForNo();
    noPos.x = clamp(x, b.minX, b.maxX);
    noPos.y = clamp(y, b.minY, b.maxY);

    // left/top are the button center coordinates
    noBtn.style.left = `${noPos.x}px`;
    noBtn.style.top = `${noPos.y}px`;
  }

  function placeInitialButtons() {
    // Put "No" on the right side, vertically centered.
    const { w, h } = getAreaSize();
    setNoPosition(w * 0.7, h * 0.5);
  }

  function localPointerPos(evt) {
    const areaRect = buttonArea.getBoundingClientRect();
    return {
      x: evt.clientX - areaRect.left,
      y: evt.clientY - areaRect.top,
    };
  }

  function distanceToNoCenter(evt) {
    const rect = noBtn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = evt.clientX - cx;
    const dy = evt.clientY - cy;
    return Math.hypot(dx, dy);
  }

  function startNoDisappearTimerOnce() {
    if (noTimerStarted) return;
    noTimerStarted = true;

    window.setTimeout(() => {
      // Required: fade out + become non-interactive
      noIsGone = true;
      noBtn.classList.add("is-gone");
      noBtn.setAttribute("aria-hidden", "true");
      noBtn.tabIndex = -1;
    }, NO_DISAPPEAR_MS);
  }

  function growYesButton() {
    yesScale = clamp(yesScale + YES_SCALE_STEP, 1, YES_SCALE_MAX);
    // Store scale on :root via CSS variable (required approach)
    document.documentElement.style.setProperty("--yes-scale", String(yesScale));
  }

  function isEvadeOnCooldown() {
    return now() - lastEvadeAt < EVADE_COOLDOWN_MS;
  }

  function computeEvadeTarget(pointerX, pointerY) {
    // Move away from the pointer, with a bit of randomness.
    const dx = noPos.x - pointerX;
    const dy = noPos.y - pointerY;

    let angle = Math.atan2(dy, dx);

    // If pointer is exactly on the center (rare), pick a random direction.
    if (!Number.isFinite(angle)) angle = rand(0, Math.PI * 2);

    const jitter = reduceMotion ? 0 : rand(-0.4, 0.4);
    angle += jitter;

    const targetX = noPos.x + Math.cos(angle) * RUN_DISTANCE;
    const targetY = noPos.y + Math.sin(angle) * RUN_DISTANCE;

    return { x: targetX, y: targetY };
  }

  function evadeNo(evt) {
    if (noIsGone) return;
    if (isEvadeOnCooldown()) return;

    lastEvadeAt = now();
    evades += 1;

    // Start the 5-second disappearance timer on the *first* evade.
    startNoDisappearTimerOnce();

    // Each successful evade makes "Yes" grow.
    growYesButton();

    // Choose a new "No" position that stays within the button area.
    const p = localPointerPos(evt);
    const target = computeEvadeTarget(p.x, p.y);

    // Clamp and set position
    setNoPosition(target.x, target.y);

    // If clamping kept it too close, pick a random spot (still clamped).
    // This avoids sticky behavior near edges.
    const near = distanceToNoCenter(evt) < 55;
    if (near) {
      const b = boundsForNo();
      setNoPosition(rand(b.minX, b.maxX), rand(b.minY, b.maxY));
    }
  }

  function launchConfetti() {
    // Respect reduced motion: minimize/disable confetti.
    if (reduceMotion) return;

    // Clear any old confetti.
    confettiRoot.textContent = "";

    const colors = [
      "#ff4fa3",
      "#ff7fc1",
      "#73beff",
      "#9dffcf",
      "#ffd166",
      "#c6b6ff",
    ];

    const total = CONFETTI_COUNT;

    for (let i = 0; i < total; i++) {
      const piece = document.createElement("div");
      piece.className = "confetti";

      // Position & motion variables
      const left = rand(0, 100); // vw
      const drift = `${rand(-80, 80)}px`;
      const spin = `${rand(540, 1440)}deg`;
      const delay = rand(0, 300); // ms
      const dur = rand(CONFETTI_MIN_MS, CONFETTI_MAX_MS); // ms

      piece.style.left = `${left}vw`;
      piece.style.background = colors[(Math.random() * colors.length) | 0];
      piece.style.setProperty("--drift", drift);
      piece.style.setProperty("--spin", spin);
      piece.style.setProperty("--delay", `${delay}ms`);
      piece.style.setProperty("--dur", `${dur}ms`);

      // Some variety in size
      const w = rand(7, 12);
      const h = rand(10, 16);
      piece.style.width = `${w}px`;
      piece.style.height = `${h}px`;

      confettiRoot.appendChild(piece);

      // Remove after animation
      window.setTimeout(() => piece.remove(), dur + delay + 200);
    }

    // Also clear container after the longest pieces finish
    window.setTimeout(() => {
      confettiRoot.textContent = "";
    }, CONFETTI_MAX_MS + 700);
  }

  function showHeartPop() {
    // Even in reduced motion we show a heart (just without animation)
    heartPop.classList.remove("show");
    // Force reflow so the animation can restart on repeated clicks (harmless)
    // eslint-disable-next-line no-unused-expressions
    heartPop.offsetHeight;
    heartPop.classList.add("show");
  }

  function acceptValentine() {
    // Replace the initial banner with the new banner text (required).
    title.textContent = "I love you!";
    subtitle.textContent = "Yay! You just made my whole day 💞";
    hint.textContent = "Best. Valentine. Ever. 🥰";

    // Disable/hide the button area (required).
    buttonArea.classList.add("is-disabled");
    buttonArea.setAttribute("aria-hidden", "true");

    yesBtn.disabled = true;
    noBtn.disabled = true;

    // Add accepted class to the card (required).
    card.classList.add("accepted");

    // Celebration
    showHeartPop();
    launchConfetti();
  }

  // --------------------------
  // Event wiring (pointer events)
  // --------------------------
  function onAreaPointerMove(evt) {
    if (noIsGone) return;

    // Only react when the pointer gets close (required).
    const threshold =
      evt.pointerType === "touch" ? EVADE_DISTANCE_TOUCH : EVADE_DISTANCE_MOUSE;

    const dist = distanceToNoCenter(evt);
    if (dist < threshold) {
      evadeNo(evt);
    }
  }

  function onNoPointerDown(evt) {
    // Required: prevent clicking "No" and evade instead.
    evt.preventDefault();
    evadeNo(evt);
  }

  function onYesClick() {
    acceptValentine();
  }

  function onResize() {
    // Keep "No" within bounds on resize/orientation changes.
    if (noIsGone) return;
    setNoPosition(noPos.x, noPos.y);
  }

  // --------------------------
  // Init
  // --------------------------
  function init() {
    placeInitialButtons();

    // Pointer move on the area (required)
    buttonArea.addEventListener("pointermove", onAreaPointerMove);

    // Also helpful on devices where hover is "sticky" or pointermove is rare:
    // a quick move on pointerdown can feel more responsive.
    buttonArea.addEventListener("pointerdown", (evt) => {
      // If the user taps near the No button, it should still try to flee.
      // (No requirement here, but improves mobile feel.)
      const threshold = EVADE_DISTANCE_TOUCH;
      const dist = distanceToNoCenter(evt);
      if (!noIsGone && dist < threshold) evadeNo(evt);
    });

    // No button: evade on pointerdown (required)
    noBtn.addEventListener("pointerdown", onNoPointerDown);

    // Yes button: accept
    yesBtn.addEventListener("click", onYesClick);

    // Keep bounds correct when the layout changes
    window.addEventListener("resize", onResize);
  }

  // Start after layout is ready
  window.addEventListener("DOMContentLoaded", init);
})();
