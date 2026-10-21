/* =========================================================
   Ambinight — interactions
   1. Scroll fluide (Lenis) + ScrollTrigger
   2. Hero : la vidéo avance au rythme du scroll
   3. Maison : interrupteurs qui allument chaque pièce
   4. Téléphone, modale démo, apparitions
   ========================================================= */
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  if (reduced) document.documentElement.classList.add('reduced');
  if (!hasGsap) document.documentElement.classList.add('no-js');

  /* ---------- 1. Scroll fluide ---------- */
  let lenis = null;
  if (hasGsap) {
    gsap.registerPlugin(ScrollTrigger);
    if (typeof window.Lenis !== 'undefined' && !reduced) {
      lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }
  }

  // Ancres internes via Lenis
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -20, duration: 1.4 });
      else target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Barre de navigation
  const nav = document.getElementById('nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > window.innerHeight * 0.9);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 2. Hero : vidéo pilotée par le scroll ---------- */
  const video = document.getElementById('heroVideo');
  const hero = document.getElementById('hero');
  let target = 0;
  let current = 0;

  // Charger la vidéo entière en mémoire pour un défilement image par image fluide
  if (location.protocol.startsWith('http')) {
    fetch(video.getAttribute('src'))
      .then((r) => (r.ok ? r.blob() : Promise.reject()))
      .then((blob) => {
        const t = video.currentTime;
        video.src = URL.createObjectURL(blob);
        video.addEventListener('loadedmetadata', () => { video.currentTime = t; }, { once: true });
      })
      .catch(() => {});
  }
  video.pause();

  const heroProgress = () => {
    const r = hero.getBoundingClientRect();
    const total = hero.offsetHeight - window.innerHeight;
    return Math.min(1, Math.max(0, -r.top / total));
  };

  const heroContent = document.querySelector('.hero-content');
  const heroBrands = document.querySelector('.hero-brands');
  const scrollHint = document.querySelector('.scroll-hint');

  const tick = () => {
    const p = heroProgress();
    if (video.duration) {
      target = p * (video.duration - 0.05);
      current += (target - current) * 0.14;
      if (Math.abs(video.currentTime - current) > 0.012) video.currentTime = current;
    }
    // Le texte s'efface doucement à la fin de la séquence
    const fade = Math.min(1, Math.max(0, (p - 0.78) / 0.22));
    heroContent.style.opacity = String(1 - fade);
    heroContent.style.transform = `translateY(${-fade * 40}px)`;
    heroBrands.style.opacity = String(1 - fade);
    scrollHint.style.opacity = String(Math.max(0, 1 - p * 6));
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  // Intro du hero
  if (hasGsap && !reduced) {
    gsap.from('.hero-title .line', { yPercent: 60, opacity: 0, duration: 1.2, ease: 'power3.out', stagger: 0.09, delay: 0.15 });
    gsap.from(['.hero-sub', '.hero-actions', '.hero-proof', '.hero-brands'], { y: 24, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.1, delay: 0.55 });
    gsap.from('.nav', { y: -20, opacity: 0, duration: 1, ease: 'power3.out' });
  }

  /* ---------- 3. Maison : allumer chaque pièce ---------- */
  // Positions des interrupteurs relevées sur la vidéo (repère 1280×720),
  // la scène n'affiche que la bande VIEW (viewBox du SVG)
  const VIEW = { y: 180, h: 530 };
  const ICONS = {
    lamp: '<svg viewBox="0 0 24 24"><path d="M8 4h8l3 8H5z"/><path d="M12 12v6M8 20h8"/></svg>',
    pendant: '<svg viewBox="0 0 24 24"><path d="M12 2v5"/><path d="M5 15a7 7 0 0 1 14 0z"/><path d="M10 18a2 2 0 0 0 4 0"/></svg>',
    desk: '<svg viewBox="0 0 24 24"><path d="M12 3v3"/><circle cx="12" cy="14" r="5"/><path d="M12 9v0"/></svg>',
    bulb: '<svg viewBox="0 0 24 24"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3z"/></svg>',
    tv: '<svg viewBox="0 0 24 24"><path d="M7 4h10l2 7H5z"/><path d="M12 11v5M7 19h10M9 16h6"/></svg>',
  };
  const ROOMS = [
    { id: 'salon',   name: 'Salon',          x: 697,  y: 297, color: '#c76bff', icon: 'tv' },
    { id: 'bureau',  name: 'Bureau',         x: 896,  y: 243, color: '#b05cff', icon: 'desk' },
    { id: 'chambre', name: 'Chambre',        x: 1196, y: 305, color: '#3e8bff', icon: 'lamp' },
    { id: 'cuisine', name: 'Cuisine',        x: 1012, y: 383, color: '#ff8a3c', icon: 'lamp' },
    { id: 'repas',   name: 'Salle à manger', x: 882,  y: 452, color: '#ff6a3c', icon: 'lamp' },
    { id: 'cinema',  name: 'Home cinéma',    x: 1153, y: 496, color: '#3e8bff', icon: 'bulb' },
  ];

  const switches = document.getElementById('switches');
  const chips = document.getElementById('roomChips');
  const hint = document.getElementById('sceneHint');
  const pulses = document.getElementById('pulses');
  const state = {};

  // Flux lumineux : longueur normalisée + impulsion animée par pièce
  document.querySelectorAll('.stream').forEach((path, i) => {
    path.setAttribute('pathLength', '1');
    const pulse = path.cloneNode();
    pulse.setAttribute('class', 'pulse');
    pulse.removeAttribute('stroke');
    pulse.style.animationDelay = `${-i * 0.37}s`;
    pulses.appendChild(pulse);
  });

  const allOnBtn = document.createElement('button');
  allOnBtn.type = 'button';
  allOnBtn.className = 'chip chip-all';
  allOnBtn.textContent = 'Tout allumer';
  chips.appendChild(allOnBtn);

  ROOMS.forEach((room) => {
    state[room.id] = false;

    const sw = document.createElement('button');
    sw.type = 'button';
    sw.className = 'sw';
    sw.dataset.room = room.id;
    sw.style.left = `${(room.x / 1280) * 100}%`;
    sw.style.top = `${((room.y - VIEW.y) / VIEW.h) * 100}%`;
    sw.style.setProperty('--c', room.color);
    sw.setAttribute('aria-pressed', 'false');
    sw.setAttribute('aria-label', `Allumer : ${room.name}`);
    sw.innerHTML = `<span class="sw-icon">${ICONS[room.icon]}<span class="sw-stem"></span></span><span class="sw-toggle"></span>`;
    sw.addEventListener('click', () => setRoom(room.id, !state[room.id]));
    switches.appendChild(sw);

    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.dataset.room = room.id;
    chip.style.setProperty('--c', room.color);
    chip.innerHTML = `<i></i>${room.name}`;
    chip.addEventListener('click', () => setRoom(room.id, !state[room.id]));
    chips.appendChild(chip);
  });

  function setRoom(id, on) {
    state[id] = on;
    switches.classList.add('touched');
    hint.classList.add('hide');
    document.querySelectorAll(`[data-room="${id}"]`).forEach((el) => {
      if (el instanceof SVGElement) {
        el.classList.toggle('on', on);
      } else {
        el.classList.toggle('on', on);
        el.setAttribute('aria-pressed', String(on));
        if (el.classList.contains('sw')) el.setAttribute('aria-label', `${on ? 'Éteindre' : 'Allumer'} : ${ROOMS.find((r) => r.id === id).name}`);
      }
    });
    updateAllBtn();
  }

  function updateAllBtn() {
    const allOn = ROOMS.every((r) => state[r.id]);
    allOnBtn.textContent = allOn ? 'Tout éteindre' : 'Tout allumer';
  }

  allOnBtn.addEventListener('click', () => {
    const turnOn = !ROOMS.every((r) => state[r.id]);
    ROOMS.forEach((r, i) => setTimeout(() => setRoom(r.id, turnOn), i * 180));
  });

  /* ---------- 4. Téléphone 3D ---------- */
  const stage = document.getElementById('phoneStage');
  const p3 = document.getElementById('p3');
  const glare = document.getElementById('p3Glare');
  const simple = document.getElementById('comment');
  const ui = stage.querySelector('.ui');

  // Épaisseur : tranches empilées derrière la façade
  const SLICES = 14;
  const slices = document.getElementById('p3Slices');
  for (let i = 1; i <= SLICES; i++) {
    const s = document.createElement('i');
    s.style.transform = `translateZ(${-i * 0.75}px)`;
    slices.appendChild(s);
  }

  // Orientation de repos + inclinaison qui suit la souris (ressort amorti)
  const BASE = { rx: 6, ry: -14, rz: 7 };
  const tgt = { rx: 0, ry: 0, z: 0 };
  const cur = { rx: 0, ry: 0, z: 0, vrx: 0, vry: 0 };
  let phoneVisible = false;

  simple.addEventListener('pointermove', (e) => {
    const r = stage.getBoundingClientRect();
    const nx = (e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2);
    const ny = (e.clientY - (r.top + r.height * 0.35)) / (window.innerHeight / 2);
    const over = e.clientX > r.left - 40 && e.clientX < r.right + 40 && e.clientY > r.top && e.clientY < r.bottom;
    const k = over ? 1.6 : 1;
    tgt.ry = Math.max(-1, Math.min(1, nx)) * 16 * k;
    tgt.rx = Math.max(-1, Math.min(1, ny)) * -10 * k;
    tgt.z = over ? 30 : 0;
  });
  simple.addEventListener('pointerleave', () => { tgt.rx = 0; tgt.ry = 0; tgt.z = 0; });

  new IntersectionObserver(([en]) => { phoneVisible = en.isIntersecting; }, { rootMargin: '100px' }).observe(simple);

  const phoneLoop = (t) => {
    if (phoneVisible) {
      // ressort : raideur 0.06, amortissement 0.82
      cur.vrx = (cur.vrx + (tgt.rx - cur.rx) * 0.06) * 0.82;
      cur.vry = (cur.vry + (tgt.ry - cur.ry) * 0.06) * 0.82;
      cur.rx += cur.vrx;
      cur.ry += cur.vry;
      cur.z += (tgt.z - cur.z) * 0.08;
      const s = t / 1000;
      const floatY = reduced ? 0 : Math.sin(s * 1.1) * 6;
      const floatR = reduced ? 0 : Math.sin(s * 0.7) * 1.2;
      // montée au scroll
      const r = simple.getBoundingClientRect();
      const prog = Math.min(1, Math.max(0, 1 - r.top / window.innerHeight));
      const rise = (1 - prog) * 140;
      const rx = BASE.rx + cur.rx;
      const ry = BASE.ry + cur.ry + floatR;
      p3.style.transform = `translate3d(0, ${floatY + rise}px, ${cur.z}px) rotateZ(${BASE.rz}deg) rotateX(${rx}deg) rotateY(${ry}deg)`;
      glare.style.setProperty('--gy', `${10 - rx * 2.2}%`);
      glare.style.setProperty('--gx', `${ry * 6}px`);
      stage.style.setProperty('--sx', `${30 - ry * 1.4}px`);
      stage.style.setProperty('--sy', `${40 + rx * 1.4 + rise * 0.4}px`);
    }
    requestAnimationFrame(phoneLoop);
  };
  requestAnimationFrame(phoneLoop);

  // Interface : pièces, interrupteur, intensité, couleurs
  const uiRooms = stage.querySelectorAll('#uiRooms button');
  uiRooms.forEach((b) => b.addEventListener('click', () => {
    uiRooms.forEach((x) => x.classList.remove('active'));
    b.classList.add('active');
    stage.style.setProperty('--c', b.dataset.c);
  }));
  const uiSwitch = document.getElementById('uiSwitch');
  uiSwitch.addEventListener('click', () => {
    const on = uiSwitch.classList.toggle('on');
    ui.classList.toggle('off', !on);
    stage.style.setProperty('--lvl', on ? level : 0);
  });

  let level = 0.8;
  const track = document.getElementById('uiTrack');
  const uiVal = document.getElementById('uiVal');
  const setLevel = (clientX) => {
    const r = track.getBoundingClientRect();
    level = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    stage.style.setProperty('--lvl', level.toFixed(3));
    uiVal.textContent = `${Math.round(level * 100)} %`;
  };
  track.addEventListener('pointerdown', (e) => {
    track.setPointerCapture(e.pointerId);
    setLevel(e.clientX);
    const move = (ev) => setLevel(ev.clientX);
    const up = () => { track.removeEventListener('pointermove', move); track.removeEventListener('pointerup', up); };
    track.addEventListener('pointermove', move);
    track.addEventListener('pointerup', up);
  });

  // Pastilles de couleurs qui suivent "l'écran"
  const dots = document.querySelectorAll('#uiDots i');
  let hue = 280;
  setInterval(() => {
    if (!phoneVisible || ui.classList.contains('off')) return;
    hue = (hue + 37) % 360;
    dots.forEach((d, i) => d.style.setProperty('--h', (hue + i * 48) % 360));
  }, 1400);

  /* ---------- 5. Vitrine de l'application Windows ---------- */
  const appTabs = document.getElementById('appTabs');
  const appWindow = document.getElementById('appWindow');
  if (appTabs && appWindow) {
    const tabs = [...appTabs.querySelectorAll('button')];
    const shots = [...appWindow.querySelectorAll('img')];
    const TAB_MS = 5200;
    appTabs.style.setProperty('--tab-ms', `${TAB_MS}ms`);
    let current = 0;
    let timer = null;
    let inView = false;

    const show = (i) => {
      current = i;
      tabs.forEach((t, k) => { t.classList.toggle('active', k === i); t.setAttribute('aria-selected', String(k === i)); });
      shots.forEach((s, k) => s.classList.toggle('active', k === i));
      // relance la barre de progression de l'onglet
      const bar = tabs[i].querySelector('i');
      bar.style.animation = 'none';
      void bar.offsetWidth;
      bar.style.animation = '';
    };
    const schedule = () => {
      clearInterval(timer);
      if (reduced || appTabs.classList.contains('paused')) return;
      timer = setInterval(() => { if (inView) show((current + 1) % tabs.length); }, TAB_MS);
    };
    tabs.forEach((t, i) => t.addEventListener('click', () => {
      appTabs.classList.add('paused');   // l'utilisateur a choisi : on arrête la rotation
      clearInterval(timer);
      show(i);
    }));
    new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      if (inView) { show(current); schedule(); }
    }, { threshold: 0.35 }).observe(appWindow);

    // inclinaison légère de la fenêtre qui suit la souris
    const stageEl = document.getElementById('appStage');
    if (!reduced && window.matchMedia('(hover: hover)').matches) {
      stageEl.addEventListener('pointermove', (e) => {
        const r = stageEl.getBoundingClientRect();
        appWindow.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - 0.5) * 8}deg`);
        appWindow.style.setProperty('--rx', `${2 - ((e.clientY - r.top) / r.height - 0.5) * 6}deg`);
      });
      stageEl.addEventListener('pointerleave', () => {
        appWindow.style.removeProperty('--ry');
        appWindow.style.removeProperty('--rx');
      });
    }
  }

  /* ---------- Modale démo ---------- */
  const modal = document.getElementById('demoModal');
  const demo = document.getElementById('demoVideo');
  const openModal = () => {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    lenis && lenis.stop();
    demo.currentTime = 0;
    demo.play().catch(() => {});
  };
  const closeModal = () => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    lenis && lenis.start();
    demo.pause();
  };
  document.getElementById('openDemo').addEventListener('click', openModal);
  modal.querySelectorAll('[data-close]').forEach((el) => el.addEventListener('click', closeModal));
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  /* ---------- Apparitions au scroll ---------- */
  if (hasGsap && !reduced) {
    ScrollTrigger.batch('.reveal', {
      start: 'top 85%',
      onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: 0.12 }),
    });
    gsap.fromTo('.emotions-media img', { scale: 1.12 }, {
      scale: 1, ease: 'none',
      scrollTrigger: { trigger: '.emotions', start: 'top bottom', end: 'bottom top', scrub: true },
    });
    gsap.fromTo('.scene', { scale: 0.94, opacity: 0.4 }, {
      scale: 1, opacity: 1, ease: 'none',
      scrollTrigger: { trigger: '.maison', start: 'top bottom', end: 'top 30%', scrub: true },
    });
    gsap.fromTo('.cta-media img', { scale: 1.1 }, {
      scale: 1, ease: 'none',
      scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'bottom bottom', scrub: true },
    });
  } else {
    document.querySelectorAll('.reveal').forEach((el) => { el.style.opacity = 1; el.style.transform = 'none'; });
  }
})();
