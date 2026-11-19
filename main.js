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
    gsap.from(['.hero-kicker', '.hero-title', '.hero-sub', '.hero-actions', '.hero-brands'], { y: 22, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.08, delay: 0.15 });
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
    // Flux lumineux : TV → téléphone, puis téléphone → chaque pièce (recalculés selon la place du téléphone)
    const streamsG = document.getElementById('streams');
    const NS = 'http://www.w3.org/2000/svg';
    const ROOM_POINTS = { salon: [697, 334], bureau: [896, 282], chambre: [1196, 344], cuisine: [1012, 418], repas: [882, 492], cinema: [1153, 538] };
    const ROOM_GRAD = { salon: 'g-stream', bureau: 'g-stream', chambre: 'g-blue', cuisine: 'g-warm', repas: 'g-warm', cinema: 'g-blue' };
    const buildStreams = (box) => {
      streamsG.innerHTML = '';
      pulses.innerHTML = '';
      const links = [];
      // TV (bord droit de l'écran) → bord gauche du téléphone
      const ty = box.y0 + box.h * 0.22;
      links.push({ room: 'tvlink', grad: 'g-stream', d: `M384 365 C ${384 + 50} 365, ${box.x0 - 50} ${ty}, ${box.x0 + 6} ${ty}` });
      // téléphone (bord droit, au niveau de la liste des pièces) → pièces
      Object.entries(ROOM_POINTS).forEach(([room, [ex, ey]], i) => {
        const sy = box.y0 + box.h * (0.6 + i * 0.055);
        const sx = box.x1 - 6;
        links.push({ room, grad: ROOM_GRAD[room], d: `M${sx} ${sy} C ${sx + 90} ${sy}, ${ex - 90} ${ey + 30}, ${ex} ${ey}` });
      });
      links.forEach((l, i) => {
        const path = document.createElementNS(NS, 'path');
        path.setAttribute('class', 'stream');
        path.setAttribute('data-room', l.room);
        path.setAttribute('stroke', `url(#${l.grad})`);
        path.setAttribute('d', l.d);
        path.setAttribute('pathLength', '1');
        streamsG.appendChild(path);
        const pulse = path.cloneNode();
        pulse.setAttribute('class', 'pulse');
        pulse.removeAttribute('stroke');
        pulse.style.animationDelay = `${-i * 0.37}s`;
        pulses.appendChild(pulse);
      });
    };

    const allBtn = document.getElementById('appAll');
    const live = document.getElementById('appLive');
    const playBtn = document.getElementById('appPlay');
    let syncing = true;
    let touched = false;

    const setRoom = (id, on) => {
      state[id] = on;
      document.querySelectorAll(`#scene [data-room="${id}"]`).forEach((el) => el.classList.toggle('on', on && syncing));
      document.querySelectorAll('#scene [data-room="tvlink"]').forEach((el) => el.classList.toggle('on', syncing));
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
      refreshLinks();
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
      document.getElementById('scene').style.setProperty('--tvc', b);
    };
    paintTv();
    if (!reduced) setInterval(() => { if (syncing) { hue = (hue + 23) % 360; paintTv(); } }, 1600);

    // À la première apparition, le salon s'allume tout seul pour montrer l'effet
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !touched) setTimeout(() => { if (!touched) setRoom('salon', true); }, 700);
    }, { threshold: 0.5 }).observe(demo);

    // le flux TV → téléphone est actif tant que la synchro tourne
    const refreshLinks = () => {
      document.querySelectorAll('#scene [data-room="tvlink"]').forEach((el) => el.classList.toggle('on', syncing));
      ROOMS.forEach((r) => document.querySelectorAll(`#scene [data-room="${r.id}"]`).forEach((el) => el.classList.toggle('on', state[r.id] && syncing)));
    };

    // Appartement en plein écran : le téléphone se place entre la TV et la maison
    const sceneSvg = document.getElementById('sceneSvg');
    const fit = () => {
      const narrow = window.innerWidth <= 900;
      if (narrow) {
        const ps = Math.min(0.8, (window.innerWidth - 40) / 360);
        demo.style.setProperty('--ps', ps.toFixed(3));
        stage.style.setProperty('--ps', ps.toFixed(3));
        stage.style.left = '';
        stage.style.top = '';
        sceneSvg.setAttribute('viewBox', '520 200 760 500');
        return;
      }
      sceneSvg.setAttribute('viewBox', '0 0 1280 720');
      const W = demo.clientWidth;
      const H = demo.clientHeight;
      const k = Math.max(W / 1280, H / 720);           // échelle de l'image (couverture)
      const offX = (1280 * k - W) / 2;
      const offY = (720 * k - H) / 2;
      let pw = Math.min(330, Math.max(270, 250 * k));   // largeur du téléphone à l'écran
      let ps = pw / 330;
      if (680 * ps > H - 110) { ps = (H - 110) / 680; pw = 330 * ps; }
      const ph = 680 * ps;
      const left = 470 * k - offX - pw / 2;            // entre la TV (x 380) et la maison (x 535)
      const top = H - ph - Math.max(18, H * 0.035);
      demo.style.setProperty('--ps', ps.toFixed(3));
      stage.style.setProperty('--ps', ps.toFixed(3));
      stage.style.left = `${left}px`;
      stage.style.top = `${top}px`;
      const u = (px, off) => (px + off) / k;
      buildStreams({ x0: u(left, offX), x1: u(left + pw, offX), y0: u(top, offY), h: ph / k });
      refreshLinks();
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
        const ry = (narrow ? 0 : 6) + cur.ry;
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

  /* ---------- 4 bis. Salon : la TV diffuse une vidéo, chaque lampe en mode TV prend ses couleurs en direct ---------- */
  const colors = document.getElementById('couleurs');
  const roomVideo = document.getElementById('roomVideo');
  if (colors && roomVideo) {
    const LAMPS = [
      { id: 'tv',      name: 'Bande LED TV', zone: 'left', zone2: 'right' },
      { id: 'ceiling', name: 'Plafonnier',   zone: 'top' },
      { id: 'floor',   name: 'Lampadaire',   zone: 'right' },
      { id: 'left',    name: 'Lampe gauche', zone: 'left' },
      { id: 'right',   name: 'Lampe droite', zone: 'right' },
    ];
    const WARM = 'rgb(255, 210, 161)';
    const CHAPTERS = [0, 6.5, 12, 17.5];
    const ICONS = {
      off: '<svg viewBox="0 0 24 24"><path d="M12 3v9"/><path d="M6.3 7.3a8 8 0 1 0 11.4 0"/></svg>',
      on: '<svg viewBox="0 0 24 24"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3z"/></svg>',
      tv: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="11" rx="1.5"/><path d="M9 20h6M12 16v4"/></svg>',
    };
    const LABELS = { off: 'Éteinte', on: 'Allumée', tv: 'Synchronisée avec la TV' };
    const buttons = [...colors.querySelectorAll('#tvScenes button')];
    const list = document.getElementById('lampList');
    const syncBtn = document.getElementById('homeSync');
    const live = document.getElementById('homeLive');
    const hint = document.getElementById('roomHint');
    const fill = colors.querySelector('.g-fill');
    const tvBox = document.getElementById('roomTv');
    const phoneCanvas = document.getElementById('homeTvCanvas');
    const phoneCtx = phoneCanvas.getContext('2d');
    const mode = {};
    let zones = { all: 'rgb(60, 140, 255)', left: 'rgb(60, 140, 255)', right: 'rgb(200, 80, 255)', top: 'rgb(120, 110, 255)' };
    let touched = false;
    let inView = false;

    // ----- la vidéo épouse l'écran de la TV de la photo (perspective) -----
    const QUAD = [[0.0099, 0.1933], [0.9901, 0.0149], [0.9901, 0.9851], [0.0099, 0.9442]];
    const homography = (w, h, dst) => {
      const src = [[0, 0], [w, 0], [w, h], [0, h]];
      const A = [], b = [];
      for (let i = 0; i < 4; i++) {
        const [x, y] = src[i], [u, v] = dst[i];
        A.push([x, y, 1, 0, 0, 0, -x * u, -y * u]); b.push(u);
        A.push([0, 0, 0, x, y, 1, -x * v, -y * v]); b.push(v);
      }
      for (let c = 0; c < 8; c++) {           // élimination de Gauss
        let p = c;
        for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
        [A[c], A[p]] = [A[p], A[c]]; [b[c], b[p]] = [b[p], b[c]];
        for (let r = 0; r < 8; r++) {
          if (r === c) continue;
          const f = A[r][c] / A[c][c];
          for (let k = c; k < 8; k++) A[r][k] -= f * A[c][k];
          b[r] -= f * b[c];
        }
      }
      const m = b.map((v, i) => v / A[i][i]);
      return `matrix3d(${m[0]},${m[3]},0,${m[6]},${m[1]},${m[4]},0,${m[7]},0,0,1,0,${m[2]},${m[5]},0,1)`;
    };
    const warp = () => {
      const w = tvBox.clientWidth, h = tvBox.clientHeight;
      roomVideo.style.width = `${w}px`;
      roomVideo.style.height = `${h}px`;
      roomVideo.style.transform = homography(w, h, QUAD.map(([x, y]) => [x * w, y * h]));
    };
    warp();
    window.addEventListener('resize', warp);

    // ----- couleurs lues dans l'image, par zone (comme la caméra du kit) -----
    const probe = document.createElement('canvas');
    probe.width = 16; probe.height = 9;
    const pctx = probe.getContext('2d', { willReadFrequently: true });
    const vivid = (r, g, b) => {
      const m = (r + g + b) / 3;
      const c = [r, g, b].map((v) => Math.max(0, m + (v - m) * 2.2));
      const mx = Math.max(...c, 1);
      return `rgb(${c.map((v) => Math.round(Math.min(255, (v / mx) * 255))).join(', ')})`;
    };
    const sample = () => {
      if (roomVideo.readyState < 2) return;
      pctx.drawImage(roomVideo, 0, 0, 16, 9);
      const d = pctx.getImageData(0, 0, 16, 9).data;
      const avg = (x0, x1, y0, y1) => {
        let r = 0, g = 0, b = 0, n = 0;
        for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const i = (y * 16 + x) * 4; r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
        return vivid(r / n, g / n, b / n);
      };
      zones = { all: avg(0, 16, 0, 9), left: avg(0, 5, 0, 9), right: avg(11, 16, 0, 9), top: avg(0, 16, 0, 3) };
      render();
    };

    const render = () => {
      let lit = 0;
      LAMPS.forEach(({ id, zone, zone2 }) => {
        const glow = colors.querySelector(`.glow[data-lamp="${id}"]`);
        const m = mode[id];
        glow.classList.toggle('lit', m !== 'off');
        glow.style.setProperty('--c', m === 'tv' ? zones[zone] : WARM);
        if (zone2) glow.style.setProperty('--c2', m === 'tv' ? zones[zone2] : WARM);
        if (m !== 'off') lit += 1;
        const row = list.querySelector(`[data-lamp="${id}"]`);
        row.classList.toggle('on', m === 'on');
        row.classList.toggle('tv', m === 'tv');
        row.style.setProperty('--lamp', zones[zone]);
        row.querySelector('small').textContent = LABELS[m];
        row.querySelectorAll('.mode button').forEach((b) => b.classList.toggle('sel', b.dataset.mode === m));
      });
      const anyTv = LAMPS.some(({ id }) => mode[id] === 'tv');
      const allTv = LAMPS.every(({ id }) => mode[id] === 'tv');
      fill.style.setProperty('--fill-o', String(Math.min(0.5, lit * 0.09)));
      fill.style.setProperty('--c', anyTv ? zones.all : WARM);
      colors.style.setProperty('--tv-a', zones.left);
      colors.style.setProperty('--tv-b', zones.right);
      syncBtn.classList.toggle('on', allTv);
      syncBtn.querySelector('span').textContent = allTv ? 'Tout est synchronisé' : 'Tout synchroniser avec la TV';
      live.textContent = anyTv ? 'Synchro TV' : (lit ? 'Allumé' : 'Éteint');
      live.classList.toggle('off', !anyTv);
      const t = roomVideo.currentTime;
      const ch = CHAPTERS.reduce((k, c, i) => (t >= c ? i : k), 0);
      buttons.forEach((b, i) => b.classList.toggle('active', i === ch));
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
    buttons.forEach((b, i) => b.addEventListener('click', () => { roomVideo.currentTime = CHAPTERS[i] + 0.05; roomVideo.play().catch(() => {}); }));

    // lecture seulement quand le salon est à l'écran ; la vidéo du téléphone suit la même image
    let lastSample = 0;
    let lastTry = 0;
    const loop = (t) => {
      if (inView) {
        if (roomVideo.readyState >= 2) phoneCtx.drawImage(roomVideo, 0, 0, phoneCanvas.width, phoneCanvas.height);
        if (t - lastSample > 120) { lastSample = t; sample(); }
        if (roomVideo.paused && t - lastTry > 1000) { lastTry = t; roomVideo.play().catch(() => {}); }
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      if (inView) {
        roomVideo.preload = 'auto';
        warp();
        roomVideo.play().catch(() => {});
        if (!touched) LAMPS.forEach(({ id }, i) => setTimeout(() => { if (!touched) setMode(id, i === 3 ? 'on' : 'tv'); }, 900 + i * 450));
      } else roomVideo.pause();
    }, { threshold: 0.3 }).observe(colors.querySelector('.room'));
    render();
  }

  // Comparatif : les barres de prix se remplissent à l'apparition
  const cmpBars = document.getElementById('cmpBars');
  if (cmpBars) new IntersectionObserver(([e], obs) => { if (e.isIntersecting) { cmpBars.classList.add('in'); obs.disconnect(); } }, { threshold: 0.4 }).observe(cmpBars);

  // Téléphone du salon : aussi grand que possible sans dépasser l'écran
  const salonPhone = document.querySelector('.salon-live .colors-phone');
  if (salonPhone) {
    const fitSalon = () => salonPhone.style.setProperty('--sps', Math.min(1, (window.innerHeight - 70) / 680).toFixed(3));
    fitSalon();
    window.addEventListener('resize', fitSalon);
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
    new IntersectionObserver(([e], obs) => { if (e.isIntersecting) { obs.disconnect(); start(); } }, { rootMargin: '900px 0px' }).observe(win);

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

  /* ---------- Vidéo de présentation : lecture au clic, avec le son ---------- */
  const presVideo = document.getElementById('presVideo');
  const presPlay = document.getElementById('presPlay');
  if (presVideo && presPlay) {
    const wrap = presVideo.parentElement;
    presPlay.addEventListener('click', () => { presVideo.play().catch(() => {}); });
    presVideo.addEventListener('play', () => { wrap.classList.add('playing'); presVideo.controls = true; });
    presVideo.addEventListener('ended', () => wrap.classList.remove('playing'));
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

  /* ---------- 6. « Voir la démo » : descend à la vidéo et la lance ---------- */
  const presSection = document.getElementById('video');
  document.getElementById('openDemo').addEventListener('click', () => {
    if (lenis) lenis.scrollTo(presSection, { offset: -40, duration: 1.2 }); else presSection.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => document.getElementById('presPlay')?.click(), 900);
  });

  /* ---------- 7. Tarifs : fenêtre de commande et liens des stores ----------
     CHECKOUT : liens de paiement Lemon Squeezy (Store → Products → Share).
     STORES   : liens des fiches Microsoft Store, App Store et Google Play.
     Tant qu'un lien est vide, le bouton correspondant reste inactif. */
  const CHECKOUT = { 'Licence à vie': '', 'Famille': '' };
  const STORES = { windows: '', ios: '', android: '' };
  const buyModal = document.getElementById('buyModal');
  if (buyModal) {
    const coPlan = document.getElementById('coPlan');
    const coPrice = document.getElementById('coPrice');
    const coEmail = document.getElementById('coEmail');
    const coNote = document.getElementById('coNote');
    const NOTE = coNote.textContent;
    const openBuy = (plan, price) => {
      coPlan.textContent = plan;
      coPrice.textContent = price;
      coNote.textContent = NOTE;
      coEmail.classList.remove('err');
      buyModal.classList.add('open');
      buyModal.setAttribute('aria-hidden', 'false');
      lenis && lenis.stop();
      setTimeout(() => coEmail.focus(), 300);
    };
    const closeBuy = () => {
      buyModal.classList.remove('open');
      buyModal.setAttribute('aria-hidden', 'true');
      lenis && lenis.start();
    };
    document.querySelectorAll('.buy').forEach((b) => b.addEventListener('click', () => openBuy(b.dataset.plan, b.dataset.price)));
    buyModal.querySelectorAll('[data-close]').forEach((el) => el.addEventListener('click', closeBuy));
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeBuy(); });
    document.getElementById('coPay').addEventListener('click', () => {
      if (!coEmail.checkValidity() || !coEmail.value) { coEmail.classList.add('err'); coEmail.focus(); return; }
      coEmail.classList.remove('err');
      const link = CHECKOUT[coPlan.textContent];
      if (!link) { coNote.textContent = "Le paiement en ligne n'est pas encore ouvert. Réessayez dans quelques jours."; return; }
      const url = new URL(link);
      url.searchParams.set('checkout[email]', coEmail.value);   // Lemon Squeezy pré-remplit l'adresse
      window.location.href = url.toString();
    });
  }
  document.querySelectorAll('.store-badge').forEach((badge) => {
    const link = STORES[badge.dataset.store];
    if (link) { badge.href = link; badge.target = '_blank'; badge.rel = 'noopener'; }
    else badge.addEventListener('click', (e) => e.preventDefault());
  });

  if (hasGsap && !reduced) {
    ScrollTrigger.batch('.reveal', { start: 'top 86%', onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.1 }) });
  } else {
    document.querySelectorAll('.reveal').forEach((el) => { el.style.opacity = 1; el.style.transform = 'none'; });
  }
})();
