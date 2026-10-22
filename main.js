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

  /* ---------- 4. Démo 3D en direct : le moteur de l'application, piloté par le téléphone ---------- */
  const demo = document.getElementById('demo');
  const stage = document.getElementById('phoneStage');
  const roomsList = document.getElementById('appRooms');
  const live3dHost = document.getElementById('live3d');

  if (demo && stage && roomsList && live3dHost && window.Ambinight3D) {
    const narrowMq = window.matchMedia('(max-width: 900px)');
    const a3d = window.Ambinight3D.mount(live3dHost, { night: true, quality: narrowMq.matches ? 'equilibree' : 'haute', interactive: !narrowMq.matches });
    // Images diffusées sur la TV et couleur dominante que la synchro envoie aux lampes
    const SCREENS = [
      { img: 'assets/screens/ocean.jpg',  rgb: [30, 140, 255] },
      { img: 'assets/screens/sunset.jpg', rgb: [255, 120, 40] },
      { img: 'assets/screens/city.jpg',   rgb: [225, 60, 255] },
      { img: 'assets/screens/race.jpg',   rgb: [255, 45, 70] },
    ];
    const hex = ([r, g, b]) => `rgb(${r}, ${g}, ${b})`;
    const state = {};
    let syncing = true;
    let touched = false;
    let screen = 0;
    const allBtn = document.getElementById('appAll');
    const live = document.getElementById('appLive');
    const playBtn = document.getElementById('appPlay');
    const tvPrev = document.getElementById('appTvScreen');
    const halo = document.getElementById('appHalo');

    const showScreen = (i) => {
      screen = i;
      const s = SCREENS[i];
      a3d.setTvImage(s.img, s.rgb);
      tvPrev.style.setProperty('--tv', `url(${s.img}) center / cover`);
      halo.style.setProperty('--halo', `radial-gradient(${hex(s.rgb)}, transparent 70%)`);
      roomsList.querySelectorAll('.app-room').forEach((li) => li.style.setProperty('--c', hex(s.rgb)));
      stage.style.setProperty('--c', hex(s.rgb));
    };

    const setLamp = (id, on) => {
      state[id] = on;
      a3d.setSyncLight(id, on);
      a3d.setLight(id, on && !syncing);
      const li = roomsList.querySelector(`[data-id="${id}"]`);
      li.classList.toggle('on', on);
      li.setAttribute('aria-checked', String(on));
      li.querySelector('small').textContent = on ? (syncing ? 'Suit l\'écran' : 'Allumée') : 'Éteinte';
      allBtn.textContent = a3d.lights.every((l) => state[l.id]) ? 'Tout éteindre' : 'Tout allumer';
    };

    const bulbSvg = '<svg viewBox="0 0 24 24"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3z"/></svg>';
    a3d.lights.forEach((l) => {
      state[l.id] = false;
      const li = document.createElement('li');
      li.className = 'app-room';
      li.dataset.id = l.id;
      li.setAttribute('role', 'switch');
      li.setAttribute('aria-checked', 'false');
      li.tabIndex = 0;
      li.innerHTML = `<span class="bulb">${bulbSvg}</span><span><b>${l.name}</b><small>Éteinte</small></span><span class="tgl"></span>`;
      const toggle = () => { touched = true; setLamp(l.id, !state[l.id]); };
      li.addEventListener('click', toggle);
      li.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); } });
      roomsList.appendChild(li);
    });
    // un clic sur une lampe dans la maquette l'allume aussi
    a3d.onPick((id) => { if (id) { touched = true; setLamp(id, !state[id]); } });

    allBtn.addEventListener('click', () => {
      touched = true;
      const turnOn = !a3d.lights.every((l) => state[l.id]);
      a3d.lights.forEach((l, i) => setTimeout(() => setLamp(l.id, turnOn), i * 160));
    });

    const setSyncing = (v) => {
      syncing = v;
      a3d.setSync(v);
      playBtn.classList.toggle('on', v);
      playBtn.querySelector('span').textContent = v ? 'En cours' : 'Démarrer';
      live.classList.toggle('off', !v);
      live.textContent = v ? 'Synchro active' : 'En pause';
      a3d.lights.forEach((l) => setLamp(l.id, state[l.id]));
    };
    playBtn.addEventListener('click', () => { touched = true; setSyncing(!syncing); });

    const SPEEDS = [6500, 4200, 2200];
    let speed = SPEEDS[1];
    document.querySelectorAll('#appSeg button').forEach((b, i, all) => b.addEventListener('click', () => {
      all.forEach((x) => x.classList.remove('on'));
      b.classList.add('on');
      speed = SPEEDS[i];
    }));

    let inView = false;
    new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      if (inView && !touched) setTimeout(() => {
        if (touched) return;
        a3d.lights.filter((l) => /TV|Lampadaire|séjour/i.test(l.name)).forEach((l, i) => setTimeout(() => setLamp(l.id, true), i * 350));
      }, 600);
    }, { threshold: 0.4 }).observe(demo);
    showScreen(0);
    a3d.setSync(true);
    if (!reduced) {
      let last = performance.now();
      const cycle = (t) => {
        if (inView && syncing && t - last > speed) { last = t; showScreen((screen + 1) % SCREENS.length); }
        requestAnimationFrame(cycle);
      };
      requestAnimationFrame(cycle);
    }

    // Flux lumineux : TV → téléphone, puis téléphone → chaque lampe allumée (suivent la caméra)
    const links = document.getElementById('liveLinks');
    const NS = 'http://www.w3.org/2000/svg';
    const paths = {};
    const mk = (id) => {
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('class', 'live-link');
      links.appendChild(p);
      paths[id] = p;
      return p;
    };
    mk('tv');
    a3d.lights.forEach((l) => mk(l.id));
    let box = null;
    let visit = 0;
    const drawLinks = () => {
      if (!box || narrowMq.matches) return;
      const fade = Math.max(0, 1 - visit * 2.5);
      links.style.opacity = fade.toFixed(2);
      if (!fade) return;
      const tv = a3d.tvScreen();
      const py = box.y + box.h * 0.24;
      if (tv) paths.tv.setAttribute('d', `M${tv.x} ${tv.y} C ${tv.x - 120} ${tv.y}, ${box.x1 + 140} ${py}, ${box.x1 - 4} ${py}`);
      paths.tv.classList.toggle('on', syncing && !!tv);
      a3d.lights.forEach((l, i) => {
        const p = a3d.screenOf(l.id);
        const sy = box.y + box.h * (0.6 + i * 0.055);
        if (p) paths[l.id].setAttribute('d', `M${box.x1 - 4} ${sy} C ${box.x1 + 110} ${sy}, ${p.x - 110} ${p.y + 40}, ${p.x} ${p.y}`);
        paths[l.id].classList.toggle('on', !!p && state[l.id] && syncing);
      });
    };

    // Téléphone posé à gauche, maquette décalée à droite pour lui laisser la place
    const fit = () => {
      if (narrowMq.matches) {
        const ps = Math.min(0.8, (window.innerWidth - 40) / 360);
        stage.style.setProperty('--ps', ps.toFixed(3));
        stage.style.left = '';
        stage.style.top = '';
        a3d.setShift(0);
        box = null;
        return;
      }
      const W = demo.clientWidth;
      const H = demo.clientHeight;
      let ps = Math.min(1, Math.max(0.82, W / 1600));
      if (680 * ps > H - 110) ps = (H - 110) / 680;
      const pw = 330 * ps;
      const ph = 680 * ps;
      const left = Math.max(24, W * 0.05);
      const top = H - ph - Math.max(18, H * 0.035);
      stage.style.setProperty('--ps', ps.toFixed(3));
      stage.style.left = `${left}px`;
      stage.style.top = `${top}px`;
      links.setAttribute('viewBox', `0 0 ${W} ${H}`);
      box = { x1: left + pw, y: top, h: ph };
      a3d.setShift((left + pw) * 0.55);
    };
    fit();
    window.addEventListener('resize', fit);

    // Entrer dans la maison : au défilement (écran large) ou avec le bouton (téléphone)
    const hint = document.getElementById('visitHint');
    const visitBtn = document.getElementById('visitBtn');
    const setVisit = (v) => {
      visit = v;
      a3d.setVisit(v);
      demo.classList.toggle('inside', v > 0.5);
      if (hint) hint.classList.toggle('hide', v > 0.08);
    };
    if (hasGsap && !reduced && !narrowMq.matches) {
      ScrollTrigger.create({
        trigger: demo,
        start: 'top top',
        end: () => `+=${window.innerHeight * 1.4}`,
        pin: true,
        onUpdate: (self) => setVisit(Math.min(1, self.progress / 0.75)),
      });
    }
    if (visitBtn) {
      let anim = null;
      visitBtn.addEventListener('click', () => {
        const from = visit;
        const to = visit > 0.5 ? 0 : 1;
        const t0 = performance.now();
        cancelAnimationFrame(anim);
        const step = (t) => {
          const k = Math.min(1, (t - t0) / 1600);
          setVisit(from + (to - from) * k);
          if (k < 1) anim = requestAnimationFrame(step);
        };
        anim = requestAnimationFrame(step);
        visitBtn.querySelector('span').textContent = to ? 'Vue d\'ensemble' : 'Entrer dans le salon';
      });
    }

    // Inclinaison du téléphone qui suit la souris (ressort amorti) + flux
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
    demo.addEventListener('pointermove', (e) => {
      const r = stage.getBoundingClientRect();
      const nx = (e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2);
      const ny = (e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2);
      tgt.ry = Math.max(-1, Math.min(1, nx)) * 14;
      tgt.rx = Math.max(-1, Math.min(1, ny)) * -9;
    });
    demo.addEventListener('pointerleave', () => { tgt.rx = 0; tgt.ry = 0; });
    const loop = (t) => {
      if (inView) {
        cur.vrx = (cur.vrx + (tgt.rx - cur.rx) * 0.06) * 0.82;
        cur.vry = (cur.vry + (tgt.ry - cur.ry) * 0.06) * 0.82;
        cur.rx += cur.vrx;
        cur.ry += cur.vry;
        const narrow = narrowMq.matches;
        const floatY = reduced ? 0 : Math.sin(t / 900) * 5;
        const rx = (narrow ? 6 : 4) + cur.rx;
        const ry = (narrow ? 0 : 6) + cur.ry;
        p3.style.transform = `translate3d(0, ${floatY}px, 0) rotateX(${rx}deg) rotateY(${ry}deg)`;
        glare.style.setProperty('--gy', `${10 - rx * 2.2}%`);
        glare.style.setProperty('--gx', `${ry * 6}px`);
        stage.style.setProperty('--sx', `${30 - ry * 1.4}px`);
        stage.style.setProperty('--sy', `${40 + rx * 1.4}px`);
        drawLinks();
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

  /* ---------- 4 ter. Fenêtre PC : « Ma maison » en 3D réelle (moteur de l'application) et vue Ambiance ---------- */
  const win = document.getElementById('win');
  const w3d = document.getElementById('w3d');
  if (win && w3d && window.Ambinight3D) {
    let w3dApi = null;
    const list = document.getElementById('w3dRooms');
    const hint = document.getElementById('w3dHint');
    const allBtn = document.getElementById('w3dAll');
    const ambLights = document.getElementById('ambLights');
    const ambLive = document.getElementById('ambLive');
    const on = {};
    let running = true;
    const hex = ([r, g, b]) => `rgb(${r}, ${g}, ${b})`;

    // un seul état partagé par la maquette 3D, la liste et la vue Ambiance
    const setSpot = (id, value) => {
      on[id] = value;
      w3dApi.setSyncLight(id, value);
      w3dApi.setLight(id, value && !running);
      list.querySelector(`[data-id="${id}"]`).classList.toggle('on', value);
      const card = ambLights.querySelector(`[data-id="${id}"]`);
      card.classList.toggle('on', value);
      card.querySelector('small').textContent = value ? (running ? 'Synchronisée' : 'Allumée') : 'Ne suit pas l\'écran';
      allBtn.textContent = w3dApi.lights.every((l) => on[l.id]) ? 'Tout éteindre' : 'Tout allumer';
    };
    const touch = () => { w3d.classList.add('touched'); hint.classList.add('hide'); };

    // le moteur 3D ne démarre qu'à l'approche de la fenêtre (une seule scène WebGL active à la fois au chargement)
    const start = () => {
      w3dApi = window.Ambinight3D.mount(w3d.querySelector('.w3d-live'), { quality: 'equilibree' });
      w3dApi.setSync(true);
      w3dApi.lights.forEach((l) => {
        on[l.id] = false;
        const row = document.createElement('div');
        row.dataset.id = l.id;
        row.innerHTML = `<span>${l.name}</span><i></i>`;
        list.appendChild(row);
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'amb-light';
        card.dataset.id = l.id;
        card.innerHTML = `<span class="amb-bulb"></span><span class="amb-txt"><b>${l.name}</b><small>Ne suit pas l'écran</small><em>${l.room}</em></span><span class="tgl"></span>`;
        card.addEventListener('click', () => { touch(); setSpot(l.id, !on[l.id]); });
        ambLights.appendChild(card);
      });
      w3dApi.onPick((id) => { if (id) { touch(); setSpot(id, !on[id]); } });
      paint();
    };
    new IntersectionObserver(([e], obs) => { if (e.isIntersecting) { obs.disconnect(); start(); } }, { rootMargin: '300px' }).observe(win);

    allBtn.addEventListener('click', () => {
      if (!w3dApi) return;
      touch();
      const turnOn = !w3dApi.lights.every((l) => on[l.id]);
      w3dApi.lights.forEach((l, i) => setTimeout(() => setSpot(l.id, turnOn), i * 140));
    });

    // navigation entre les vues de l'application
    const navBtns = [...win.querySelectorAll('#winNav button')];
    const views = [...win.querySelectorAll('.view')];
    navBtns.forEach((b) => b.addEventListener('click', () => {
      navBtns.forEach((x) => x.classList.toggle('active', x === b));
      views.forEach((v) => v.classList.toggle('active', v.dataset.view === b.dataset.view));
      win.classList.add('explored');
    }));

    // vue Ambiance : lecture / arrêt, intensité, réactivité, aperçu animé
    const play = document.getElementById('ambPlay');
    const setRunning = (value) => {
      running = value;
      play.classList.toggle('on', running);
      play.querySelector('span').textContent = running ? 'En cours' : 'Démarrer';
      ambLive.classList.toggle('off', !running);
      ambLive.lastChild.textContent = running ? 'Synchronisation active' : 'En pause';
      if (w3dApi) { w3dApi.setSync(running); w3dApi.lights.forEach((l) => setSpot(l.id, on[l.id])); }
    };
    play.addEventListener('click', () => setRunning(!running));
    document.getElementById('ambStop').addEventListener('click', () => setRunning(false));
    const range = document.getElementById('ambRange');
    const updRange = () => {
      document.getElementById('ambVal').textContent = `${range.value} %`;
      range.style.setProperty('--p', `${range.value}%`);
      if (w3dApi) w3dApi.setIntensity(0.2 + (range.value / 100) * 0.7);
    };
    range.addEventListener('input', updRange);
    updRange();
    document.querySelectorAll('#ambSeg button').forEach((b, i, all) => b.addEventListener('click', () => {
      all.forEach((x) => x.classList.remove('on'));
      b.classList.add('on');
    }));
    const ambTv = document.getElementById('ambTv');
    const ambHalo = document.getElementById('ambHalo');
    const SHOTS = [
      { img: 'assets/screens/sunset.jpg', rgb: [255, 120, 40] },
      { img: 'assets/screens/city.jpg',   rgb: [225, 60, 255] },
      { img: 'assets/screens/ocean.jpg',  rgb: [30, 140, 255] },
      { img: 'assets/screens/race.jpg',   rgb: [255, 45, 70] },
    ];
    let shot = 0;
    // l'image de la TV, son halo dans l'aperçu, et la même couleur envoyée aux lampes de la maquette
    function paint() {
      const s = SHOTS[shot];
      ambTv.style.background = `url(${s.img}) center / cover`;
      ambHalo.style.background = `radial-gradient(45% 75% at 50% 50%, ${hex(s.rgb)}, transparent 72%)`;
      win.style.setProperty('--c', hex(s.rgb));
      ambLights.style.setProperty('--c', hex(s.rgb));
      if (w3dApi) w3dApi.setTvImage(s.img, s.rgb);
    }
    paint();
    if (!reduced) setInterval(() => { if (running && w3dApi) { shot = (shot + 1) % SHOTS.length; paint(); } }, 3600);
  }

  /* ---------- 4 quater. Tutoriel animé : une étape par cran de défilement ---------- */
  const tScene = document.getElementById('tScene');
  if (tScene) {
    const tPin = document.getElementById('tutoPin');
    const tWorld = document.getElementById('tWorld');
    const tItems = [...document.querySelectorAll('#tCards li')];
    const TSTEPS = tItems.length;
    let tStep = 0;
    const setStep = (n, frac = 1) => {
      if (n !== tStep) {
        tStep = n;
        for (let i = 1; i <= TSTEPS; i++) {
          tScene.classList.toggle(`t-on-${i}`, i <= n);
          tScene.classList.toggle(`t-cur-${i}`, i === n);
        }
        tItems.forEach((li, i) => {
          li.classList.toggle('seen', i < n);
          li.classList.toggle('active', i === n - 1);
          li.classList.toggle('done', i < n - 1);
        });
      }
      const bar = tItems[n - 1]?.querySelector('.t-bar');
      if (bar) bar.style.setProperty('--p', frac.toFixed(3));
    };

    // couleurs de la TV reprises par le rétroéclairage et les lampes à l'étape 5
    const TPAL = [['#3f7bff', '#ff7a3c', '#c76bff'], ['#ff5a3c', '#ffb347', '#ff3d7f'], ['#2fe0c8', '#3f7bff', '#7c6bff'], ['#ff4fd8', '#5b6bff', '#ffa24a']];
    let tPal = 0;
    const tPaint = () => {
      const [a, b, c] = TPAL[tPal];
      tScene.style.setProperty('--tc1', a);
      tScene.style.setProperty('--tc2', b);
      tScene.style.setProperty('--tc3', c);
    };
    if (!reduced) setInterval(() => { if (tStep === TSTEPS) { tPal = (tPal + 1) % TPAL.length; tPaint(); } }, 1800);

    // léger relief qui suit la souris
    if (window.matchMedia('(hover: hover)').matches && !reduced) {
      tScene.parentElement.addEventListener('pointermove', (e) => {
        const r = tScene.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        tWorld.style.setProperty('--ry', `${(-6 + x * 8).toFixed(2)}deg`);
        tWorld.style.setProperty('--rx', `${(6 - y * 6).toFixed(2)}deg`);
      });
    }

    const pinned = hasGsap && !reduced && window.matchMedia('(min-width: 901px) and (min-height: 640px)').matches;
    if (pinned) {
      // section épinglée : chaque cran de défilement fait apparaître l'étape suivante
      const st = ScrollTrigger.create({
        trigger: tPin,
        start: 'top top',
        end: () => `+=${window.innerHeight * 3.2}`,
        pin: true,
        onUpdate: (self) => {
          const p = self.progress * TSTEPS;
          const n = Math.min(TSTEPS, Math.max(1, Math.floor(p) + 1));
          setStep(n, n === TSTEPS ? 1 : p - (n - 1));
        },
        onLeaveBack: () => setStep(0),
      });
      tItems.forEach((li, i) => li.querySelector('button').addEventListener('click', () => {
        const y = st.start + ((i + 0.5) / TSTEPS) * (st.end - st.start);
        if (lenis) lenis.scrollTo(y, { duration: 1 }); else window.scrollTo({ top: y, behavior: 'smooth' });
      }));
    } else {
      // téléphone ou mouvement réduit : les étapes défilent seules quand la section est visible
      let tView = false;
      let tTimer = null;
      const next = () => setStep(tStep >= TSTEPS ? 1 : tStep + 1);
      new IntersectionObserver(([e]) => {
        tView = e.isIntersecting;
        if (tView && !tStep) setStep(1);
      }, { threshold: 0.35 }).observe(tScene);
      if (!reduced) tTimer = setInterval(() => { if (tView) next(); }, 3200);
      if (reduced) setStep(TSTEPS);
      tItems.forEach((li, i) => li.querySelector('button').addEventListener('click', () => {
        clearInterval(tTimer);
        setStep(i + 1);
      }));
    }
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
