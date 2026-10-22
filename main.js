/* =========================================================
   Ambinight — page d'accueil
   1. Scroll fluide, ancres, barre de navigation
   2. Hero : vidéo en lecture automatique
   3. Compatibilité : recherche des appareils animée
   4. Démo 3D : le téléphone allume les pièces de la maison
   5. Application PC : onglets des captures
   6. Modale démo, apparitions
   ========================================================= */
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  if (reduced) document.documentElement.classList.add('reduced');
  if (!hasGsap) document.documentElement.classList.add('no-js');

  /* ---------- 1. Scroll fluide, ancres, navigation ---------- */
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

  // Liens vers une ancre de la page courante (y compris « index.html#… »)
  const samePage = (url) => {
    const norm = (p) => p.replace(/index\.html$/, '');
    return url.origin === location.origin && norm(url.pathname) === norm(location.pathname);
  };
  document.querySelectorAll('a[href*="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const url = new URL(a.href, location.href);
      if (!samePage(url) || url.hash.length < 2) return;
      const target = document.querySelector(url.hash);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -60, duration: 1.3 });
      else target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  const nav = document.getElementById('nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 2. Hero ---------- */
  const heroVideo = document.querySelector('.hero-video');
  if (heroVideo && reduced) heroVideo.pause();
  if (hasGsap && !reduced) {
    gsap.from(['.hero-title', '.hero-sub', '.hero-actions', '.hero-brands', '.hero-facts'], { y: 22, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.08, delay: 0.15 });
  }

  /* ---------- 3. Recherche des appareils ---------- */
  const scan = document.getElementById('scan');
  if (scan) {
    const items = [...scan.querySelectorAll('.scan-list li')];
    const status = document.getElementById('scanStatus');
    let played = false;
    const play = () => {
      if (played) return;
      played = true;
      items.forEach((li, i) => setTimeout(() => {
        li.classList.add('found');
        status.textContent = `${i + 1} appareil${i ? 's' : ''} trouvé${i ? 's' : ''}…`;
        if (i === items.length - 1) setTimeout(() => { scan.classList.add('done'); status.textContent = 'Recherche terminée'; }, 600);
      }, reduced ? 0 : 500 + i * 650));
    };
    new IntersectionObserver(([e]) => { if (e.isIntersecting) play(); }, { threshold: 0.4 }).observe(scan);
  }

  /* ---------- 4. Démo 3D pilotée par le téléphone ---------- */
  const ROOMS = [
    { id: 'salon',   name: 'Salon',          color: '#c76bff' },
    { id: 'cinema',  name: 'Home cinéma',    color: '#3f7bff' },
    { id: 'repas',   name: 'Salle à manger', color: '#ff7a3c' },
    { id: 'cuisine', name: 'Cuisine',        color: '#ff9a3c' },
    { id: 'chambre', name: 'Chambre',        color: '#4f8dff' },
    { id: 'bureau',  name: 'Bureau',         color: '#b05cff' },
  ];
  const demo = document.getElementById('demo');
  const stage = document.getElementById('phoneStage');
  const roomsList = document.getElementById('appRooms');
  const pulses = document.getElementById('pulses');
  const state = {};

  if (demo && stage && roomsList) {
    // impulsions lumineuses qui suivent chaque flux TV → pièce
    document.querySelectorAll('.stream').forEach((path, i) => {
      path.setAttribute('pathLength', '1');
      const pulse = path.cloneNode();
      pulse.setAttribute('class', 'pulse');
      pulse.removeAttribute('stroke');
      pulse.style.animationDelay = `${-i * 0.37}s`;
      pulses.appendChild(pulse);
    });

    const allBtn = document.getElementById('appAll');
    const live = document.getElementById('appLive');
    const playBtn = document.getElementById('appPlay');
    let syncing = true;
    let touched = false;

    const setRoom = (id, on) => {
      state[id] = on;
      document.querySelectorAll(`#scene [data-room="${id}"]`).forEach((el) => el.classList.toggle('on', on && syncing));
      const li = roomsList.querySelector(`[data-room="${id}"]`);
      li.classList.toggle('on', on);
      li.setAttribute('aria-checked', String(on));
      li.querySelector('small').textContent = on ? 'Suit l\'écran' : 'Éteinte';
      if (on) stage.style.setProperty('--c', ROOMS.find((r) => r.id === id).color);
      allBtn.textContent = ROOMS.every((r) => state[r.id]) ? 'Tout éteindre' : 'Tout allumer';
    };

    const bulbSvg = '<svg viewBox="0 0 24 24"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3z"/></svg>';
    ROOMS.forEach((room) => {
      state[room.id] = false;
      const li = document.createElement('li');
      li.className = 'app-room';
      li.dataset.room = room.id;
      li.style.setProperty('--c', room.color);
      li.setAttribute('role', 'switch');
      li.setAttribute('aria-checked', 'false');
      li.tabIndex = 0;
      li.innerHTML = `<span class="bulb">${bulbSvg}</span><span><b>${room.name}</b><small>Éteinte</small></span><span class="tgl"></span>`;
      const toggle = () => { touched = true; setRoom(room.id, !state[room.id]); };
      li.addEventListener('click', toggle);
      li.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); } });
      roomsList.appendChild(li);
    });

    allBtn.addEventListener('click', () => {
      touched = true;
      const turnOn = !ROOMS.every((r) => state[r.id]);
      ROOMS.forEach((r, i) => setTimeout(() => setRoom(r.id, turnOn), i * 160));
    });

    // Démarrer / arrêter la synchro : coupe la lumière sans perdre les choix
    playBtn.addEventListener('click', () => {
      touched = true;
      syncing = !syncing;
      playBtn.classList.toggle('on', syncing);
      playBtn.querySelector('span').textContent = syncing ? 'En cours' : 'Démarrer';
      live.classList.toggle('off', !syncing);
      live.textContent = syncing ? 'Synchro active' : 'En pause';
      ROOMS.forEach((r) => setRoom(r.id, state[r.id]));
    });

    document.querySelectorAll('#appSeg button').forEach((b, i, all) => b.addEventListener('click', () => {
      all.forEach((x) => x.classList.remove('on'));
      b.classList.add('on');
    }));

    // Aperçu TV du téléphone : couleurs qui changent comme l'image
    const halo = document.getElementById('appHalo');
    const tv = document.getElementById('appTvScreen');
    let hue = 290;
    const paintTv = () => {
      const a = `hsl(${hue} 90% 66%)`;
      const b = `hsl(${(hue + 70) % 360} 85% 62%)`;
      const c = `hsl(${(hue + 150) % 360} 80% 64%)`;
      tv.style.setProperty('--tv', `linear-gradient(135deg, ${a}, ${b} 50%, ${c})`);
      halo.style.setProperty('--halo', `radial-gradient(${a}, ${c})`);
    };
    paintTv();
    if (!reduced) setInterval(() => { if (syncing) { hue = (hue + 23) % 360; paintTv(); } }, 1600);

    // À la première apparition, le salon s'allume tout seul pour montrer l'effet
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !touched) setTimeout(() => { if (!touched) setRoom('salon', true); }, 700);
    }, { threshold: 0.5 }).observe(demo);

    // Taille du téléphone selon la hauteur d'écran + cadrage de la scène
    const sceneSvg = document.getElementById('sceneSvg');
    const fit = () => {
      const narrow = window.innerWidth <= 900;
      const ps = narrow
        ? Math.min(0.8, (window.innerWidth - 40) / 360)
        : Math.min(1, Math.max(0.62, (window.innerHeight - 150) / 680));
      demo.style.setProperty('--ps', ps.toFixed(3));
      stage.style.setProperty('--ps', ps.toFixed(3));
      sceneSvg.setAttribute('viewBox', narrow ? '520 200 760 500' : '-260 190 1540 520');
    };
    fit();
    window.addEventListener('resize', fit);

    // Inclinaison du téléphone qui suit la souris (ressort amorti)
    const p3 = document.getElementById('p3');
    const glare = document.getElementById('p3Glare');
    const slices = p3.querySelector('.p3-slices');
    for (let i = 1; i <= 14; i++) {
      const s = document.createElement('i');
      s.style.transform = `translateZ(${-i * 0.75}px)`;
      slices.appendChild(s);
    }
    const tgt = { rx: 0, ry: 0 };
    const cur = { rx: 0, ry: 0, vrx: 0, vry: 0 };
    let visible = false;
    demo.addEventListener('pointermove', (e) => {
      const r = stage.getBoundingClientRect();
      const nx = (e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2);
      const ny = (e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2);
      tgt.ry = Math.max(-1, Math.min(1, nx)) * 14;
      tgt.rx = Math.max(-1, Math.min(1, ny)) * -9;
    });
    demo.addEventListener('pointerleave', () => { tgt.rx = 0; tgt.ry = 0; });
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: '100px' }).observe(demo);
    const loop = (t) => {
      if (visible) {
        cur.vrx = (cur.vrx + (tgt.rx - cur.rx) * 0.06) * 0.82;
        cur.vry = (cur.vry + (tgt.ry - cur.ry) * 0.06) * 0.82;
        cur.rx += cur.vrx;
        cur.ry += cur.vry;
        const narrow = window.innerWidth <= 900;
        const floatY = reduced ? 0 : Math.sin(t / 900) * 5;
        const rx = (narrow ? 6 : 4) + cur.rx;
        const ry = (narrow ? 0 : 12) + cur.ry;
        p3.style.transform = `translate3d(0, ${floatY}px, 0) rotateX(${rx}deg) rotateY(${ry}deg)`;
        glare.style.setProperty('--gy', `${10 - rx * 2.2}%`);
        glare.style.setProperty('--gx', `${ry * 6}px`);
        stage.style.setProperty('--sx', `${30 - ry * 1.4}px`);
        stage.style.setProperty('--sy', `${40 + rx * 1.4}px`);
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  /* ---------- 4 bis. Salon : éteindre, allumer ou synchroniser chaque lampe avec la TV ---------- */
  const colors = document.getElementById('couleurs');
  if (colors) {
    // couleurs relevées dans chaque image : bande LED (gauche, droite), plafonnier, lampadaire, lampe gauche, lampe droite
    const SCENES = [
      { img: 'assets/room/tv-ocean.webp',  tv: 'assets/screens/ocean.jpg',  pal: { tv: '#2fd0ff', tv2: '#1e5bff', ceiling: '#36c8ff', floor: '#1fd6c0', left: '#2a8bff', right: '#33e0ff' } },
      { img: 'assets/room/tv-sunset.webp', tv: 'assets/screens/sunset.jpg', pal: { tv: '#ff9a3d', tv2: '#ff6a3d', ceiling: '#ffb35c', floor: '#ff7d3b', left: '#ffc06a', right: '#ff8a3d' } },
      { img: 'assets/room/tv-city.webp',   tv: 'assets/screens/city.jpg',   pal: { tv: '#ff4fd8', tv2: '#3ee8ff', ceiling: '#a45cff', floor: '#ff4fb8', left: '#3ee8ff', right: '#ff6ad5' } },
      { img: 'assets/room/tv-race.webp',   tv: 'assets/screens/race.jpg',   pal: { tv: '#3f7bff', tv2: '#ff3d5a', ceiling: '#ff3d6e', floor: '#4f6bff', left: '#ff5a3d', right: '#c04dff' } },
    ];
    const LAMPS = [
      { id: 'tv',      name: 'Bande LED TV' },
      { id: 'ceiling', name: 'Plafonnier' },
      { id: 'floor',   name: 'Lampadaire' },
      { id: 'left',    name: 'Lampe gauche' },
      { id: 'right',   name: 'Lampe droite' },
    ];
    const WARM = '#ffd2a1';
    const ICONS = {
      off: '<svg viewBox="0 0 24 24"><path d="M12 3v9"/><path d="M6.3 7.3a8 8 0 1 0 11.4 0"/></svg>',
      on: '<svg viewBox="0 0 24 24"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3z"/></svg>',
      tv: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="11" rx="1.5"/><path d="M9 20h6M12 16v4"/></svg>',
    };
    const LABELS = { off: 'Éteinte', on: 'Allumée', tv: 'Synchronisée avec la TV' };
    const tvImgs = [...colors.querySelectorAll('#roomTv img')];
    const buttons = [...colors.querySelectorAll('#tvScenes button')];
    const list = document.getElementById('lampList');
    const homeTv = document.getElementById('homeTv');
    const syncBtn = document.getElementById('homeSync');
    const live = document.getElementById('homeLive');
    const hint = document.getElementById('roomHint');
    const fill = colors.querySelector('.g-fill');
    const mode = {};
    let scene = 0;
    let touched = false;
    let inView = false;

    const render = () => {
      const pal = SCENES[scene].pal;
      let lit = 0;
      LAMPS.forEach(({ id }) => {
        const glow = colors.querySelector(`.glow[data-lamp="${id}"]`);
        const m = mode[id];
        glow.classList.toggle('lit', m !== 'off');
        glow.style.setProperty('--c', m === 'tv' ? pal[id] : WARM);
        if (id === 'tv') glow.style.setProperty('--c2', m === 'tv' ? pal.tv2 : WARM);
        if (m !== 'off') lit += 1;
        const row = list.querySelector(`[data-lamp="${id}"]`);
        row.classList.toggle('on', m === 'on');
        row.classList.toggle('tv', m === 'tv');
        row.style.setProperty('--lamp', pal[id]);
        row.querySelector('small').textContent = LABELS[m];
        row.querySelectorAll('.mode button').forEach((b) => b.classList.toggle('sel', b.dataset.mode === m));
      });
      const anyTv = LAMPS.some(({ id }) => mode[id] === 'tv');
      const allTv = LAMPS.every(({ id }) => mode[id] === 'tv');
      fill.style.setProperty('--fill-o', String(Math.min(0.5, lit * 0.09)));
      fill.style.setProperty('--c', anyTv ? pal.tv : WARM);
      colors.style.setProperty('--tv-a', pal.tv);
      colors.style.setProperty('--tv-b', pal.tv2);
      syncBtn.classList.toggle('on', allTv);
      syncBtn.querySelector('span').textContent = allTv ? 'Tout est synchronisé' : 'Tout synchroniser avec la TV';
      live.textContent = anyTv ? 'Synchro TV' : (lit ? 'Allumé' : 'Éteint');
      live.classList.toggle('off', !anyTv);
    };
    const setMode = (id, m) => { mode[id] = m; render(); };
    const touch = () => { touched = true; hint.classList.add('hide'); };

    LAMPS.forEach(({ id, name }) => {
      mode[id] = 'off';
      const li = document.createElement('li');
      li.className = 'lamp-row';
      li.dataset.lamp = id;
      li.innerHTML = `<span class="lamp-dot"></span><span><b>${name}</b><small></small></span><span class="mode" role="radiogroup" aria-label="${name}">${
        ['off', 'on', 'tv'].map((m) => `<button type="button" data-mode="${m}" aria-label="${LABELS[m]}" title="${LABELS[m]}">${ICONS[m]}</button>`).join('')}</span>`;
      li.querySelectorAll('.mode button').forEach((b) => b.addEventListener('click', () => { touch(); setMode(id, b.dataset.mode); }));
      list.appendChild(li);
    });

    syncBtn.addEventListener('click', () => {
      touch();
      const allTv = LAMPS.every(({ id }) => mode[id] === 'tv');
      LAMPS.forEach(({ id }, i) => setTimeout(() => setMode(id, allTv ? 'off' : 'tv'), i * 150));
    });

    const showScene = (i) => {
      scene = i;
      tvImgs.forEach((img, k) => img.classList.toggle('active', k === i));
      buttons.forEach((b, k) => b.classList.toggle('active', k === i));
      homeTv.style.backgroundImage = `url("${SCENES[i].tv}")`;
      render();
    };
    let auto = null;
    const cycle = () => {
      clearInterval(auto);
      if (!reduced) auto = setInterval(() => { if (inView) showScene((scene + 1) % SCENES.length); }, 4200);
    };
    buttons.forEach((b, i) => b.addEventListener('click', () => { showScene(i); cycle(); }));

    // À la première apparition : la bande LED puis les lampes passent en synchro, pour montrer l'effet
    new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      if (inView && !touched) {
        LAMPS.forEach(({ id }, i) => setTimeout(() => { if (!touched) setMode(id, i === 3 ? 'on' : 'tv'); }, 900 + i * 450));
      }
    }, { threshold: 0.35 }).observe(colors.querySelector('.room'));
    showScene(0);
    cycle();
  }

  // épaisseur des téléphones fixes
  document.querySelectorAll('.phone-static .p3-slices').forEach((slices) => {
    for (let i = 1; i <= 14; i++) {
      const s = document.createElement('i');
      s.style.transform = `translateZ(${-i * 0.75}px)`;
      slices.appendChild(s);
    }
  });

  /* ---------- 4 ter. Vue 3D dans la fenêtre PC : ampoules cliquables ---------- */
  const w3d = document.getElementById('w3d');
  if (w3d) {
    // position des ampoules dans l'image de la maison (repère 1280×720, vue 500→1290 × 200→700)
    const SPOTS = [
      { id: 'salon',   name: 'Salon',          x: 652,  y: 405, color: '#c76bff' },
      { id: 'bureau',  name: 'Bureau',         x: 880,  y: 300, color: '#b05cff' },
      { id: 'chambre', name: 'Chambre',        x: 1180, y: 345, color: '#4f8dff' },
      { id: 'cuisine', name: 'Cuisine',        x: 985,  y: 410, color: '#ff9a3c' },
      { id: 'repas',   name: 'Salle à manger', x: 845,  y: 470, color: '#ff7a3c' },
      { id: 'cinema',  name: 'Home cinéma',    x: 1110, y: 540, color: '#3f7bff' },
    ];
    const VB = { x: 500, y: 200, w: 790, h: 500 };
    const spotsBox = document.getElementById('w3dSpots');
    const list = document.getElementById('w3dRooms');
    const hint = document.getElementById('w3dHint');
    const allBtn = document.getElementById('w3dAll');
    const on = {};
    const bulb = '<svg viewBox="0 0 24 24"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3z"/></svg>';

    const setSpot = (id, value) => {
      on[id] = value;
      w3d.querySelectorAll(`svg [data-room="${id}"]`).forEach((el) => el.classList.toggle('on', value));
      const btn = spotsBox.querySelector(`[data-room="${id}"]`);
      btn.classList.toggle('on', value);
      btn.setAttribute('aria-pressed', String(value));
      list.querySelector(`[data-room="${id}"]`).classList.toggle('on', value);
      allBtn.textContent = SPOTS.every((s) => on[s.id]) ? 'Tout éteindre' : 'Tout allumer';
    };
    const touch = () => {
      w3d.classList.add('touched');
      hint.classList.add('hide');
    };

    SPOTS.forEach((s) => {
      on[s.id] = false;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'spot';
      b.dataset.room = s.id;
      b.dataset.name = s.name;
      b.style.setProperty('--c', s.color);
      b.style.left = `${((s.x - VB.x) / VB.w) * 100}%`;
      b.style.top = `${((s.y - VB.y) / VB.h) * 100}%`;
      b.setAttribute('aria-label', `Allumer ou éteindre : ${s.name}`);
      b.setAttribute('aria-pressed', 'false');
      b.innerHTML = bulb;
      b.addEventListener('click', () => { touch(); setSpot(s.id, !on[s.id]); });
      spotsBox.appendChild(b);

      const row = document.createElement('div');
      row.dataset.room = s.id;
      row.style.setProperty('--c', s.color);
      row.innerHTML = `<span>${s.name}</span><i></i>`;
      list.appendChild(row);
    });
    allBtn.addEventListener('click', () => {
      touch();
      const turnOn = !SPOTS.every((s) => on[s.id]);
      SPOTS.forEach((s, i) => setTimeout(() => setSpot(s.id, turnOn), i * 140));
    });
  }

  /* ---------- 5. Application PC ---------- */
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
    tabs.forEach((t, i) => t.addEventListener('click', () => { appTabs.classList.add('paused'); clearInterval(timer); show(i); }));
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; if (inView) { show(current); schedule(); } }, { threshold: 0.35 }).observe(appWindow);

    const stageEl = document.getElementById('appStage');
    if (!reduced && window.matchMedia('(hover: hover)').matches) {
      stageEl.addEventListener('pointermove', (e) => {
        const r = stageEl.getBoundingClientRect();
        appWindow.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - 0.5) * 8}deg`);
        appWindow.style.setProperty('--rx', `${2 - ((e.clientY - r.top) / r.height - 0.5) * 6}deg`);
      });
      stageEl.addEventListener('pointerleave', () => { appWindow.style.removeProperty('--ry'); appWindow.style.removeProperty('--rx'); });
    }
  }

  /* ---------- 6. Modale démo, apparitions ---------- */
  const modal = document.getElementById('demoModal');
  const demoVideo = document.getElementById('demoVideo');
  const openModal = () => { modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); lenis && lenis.stop(); demoVideo.currentTime = 0; demoVideo.play().catch(() => {}); };
  const closeModal = () => { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); lenis && lenis.start(); demoVideo.pause(); };
  document.getElementById('openDemo').addEventListener('click', openModal);
  modal.querySelectorAll('[data-close]').forEach((el) => el.addEventListener('click', closeModal));
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  if (hasGsap && !reduced) {
    ScrollTrigger.batch('.reveal', { start: 'top 86%', onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.1 }) });
    gsap.fromTo('.emotions-media img', { scale: 1.1 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.emotions', start: 'top bottom', end: 'bottom top', scrub: true } });
  } else {
    document.querySelectorAll('.reveal').forEach((el) => { el.style.opacity = 1; el.style.transform = 'none'; });
  }
})();
