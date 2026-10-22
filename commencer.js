/* =========================================================
   Ambinight — page « Commencer »
   Scroll fluide, navigation, apparitions, commande, téléchargements
   ========================================================= */
(() => {
  /* ---------- Liens à renseigner ----------
     CHECKOUT : liens de paiement Lemon Squeezy (Store → Products → Share).
     STORES   : liens des fiches Microsoft Store, App Store et Google Play.
     Tant qu'un lien est vide, le bouton correspondant reste inactif. */
  const CHECKOUT = {
    'Licence à vie': '',
    'Famille': '',
  };
  const STORES = {
    windows: '',
    ios: '',
    android: '',
  };

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  let lenis = null;
  if (hasGsap) {
    gsap.registerPlugin(ScrollTrigger);
    if (typeof window.Lenis !== 'undefined' && !reduced) {
      lenis = new Lenis({ lerp: 0.09 });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }
  }

  // Ancres de la page courante (y compris « commencer.html#tarifs »)
  document.querySelectorAll('a[href*="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const url = new URL(a.href, location.href);
      if (url.pathname !== location.pathname || url.hash.length < 2) return;
      const target = document.querySelector(url.hash);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -70, duration: 1.3 });
      else target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Barre de navigation : même comportement que sur l'accueil, lien « Tarifs » actif
  const nav = document.getElementById('nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  nav.querySelectorAll('.nav-links a').forEach((a) => { if (a.getAttribute('href') === 'commencer.html#tarifs') a.classList.add('current'); });

  // Apparitions
  if (hasGsap && !reduced) {
    gsap.from('.s-hero-inner > *', { y: 26, opacity: 0, duration: 1.1, ease: 'power3.out', stagger: 0.1 });
    ScrollTrigger.batch('.reveal', {
      start: 'top 88%',
      onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.1 }),
    });
  } else {
    document.querySelectorAll('.reveal').forEach((el) => { el.style.opacity = 1; el.style.transform = 'none'; });
  }

  // Fenêtre de commande
  const modal = document.getElementById('buyModal');
  const coPlan = document.getElementById('coPlan');
  const coPrice = document.getElementById('coPrice');
  const coEmail = document.getElementById('coEmail');
  const coNote = document.getElementById('coNote');
  const NOTE = coNote.textContent;

  const open = (plan, price) => {
    coPlan.textContent = plan;
    coPrice.textContent = price;
    coNote.textContent = NOTE;
    coEmail.classList.remove('err');
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    lenis && lenis.stop();
    setTimeout(() => coEmail.focus(), 300);
  };
  const close = () => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    lenis && lenis.start();
  };
  document.querySelectorAll('.buy').forEach((b) => b.addEventListener('click', () => open(b.dataset.plan, b.dataset.price)));
  modal.querySelectorAll('[data-close]').forEach((el) => el.addEventListener('click', close));
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  document.getElementById('coPay').addEventListener('click', () => {
    if (!coEmail.checkValidity() || !coEmail.value) {
      coEmail.classList.add('err');
      coEmail.focus();
      return;
    }
    coEmail.classList.remove('err');
    const link = CHECKOUT[coPlan.textContent];
    if (!link) {
      coNote.textContent = 'Le paiement en ligne n\'est pas encore ouvert. Réessayez dans quelques jours.';
      return;
    }
    // Lemon Squeezy pré-remplit l'adresse e-mail avec checkout[email]
    const url = new URL(link);
    url.searchParams.set('checkout[email]', coEmail.value);
    window.location.href = url.toString();
  });

  // Prérequis : relief des photos qui suit la souris
  if (!reduced && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.kit-photo').forEach((card) => {
      const view = card.querySelector('.kit-view');
      card.addEventListener('pointermove', (e) => {
        const r = view.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        card.classList.add('tilting');
        view.style.setProperty('--ry', `${nx * 22}deg`);
        view.style.setProperty('--rx', `${-ny * 16}deg`);
        view.style.setProperty('--s', '1.05');
        view.style.setProperty('--gx', `${nx * -40}px`);
        view.style.setProperty('--gy', `${ny * -30}px`);
        view.style.setProperty('--mx', `${(nx + 0.5) * 100}%`);
        view.style.setProperty('--my', `${(ny + 0.5) * 100}%`);
      });
      card.addEventListener('pointerleave', () => {
        card.classList.remove('tilting');
        ['--ry', '--rx', '--s', '--gx', '--gy'].forEach((p) => view.style.removeProperty(p));
      });
    });
  }

  // Badges des stores : pointent vers la fiche quand le lien est renseigné
  document.querySelectorAll('.store-badge').forEach((badge) => {
    const link = STORES[badge.dataset.store];
    if (link) {
      badge.href = link;
      badge.target = '_blank';
      badge.rel = 'noopener';
    } else {
      badge.addEventListener('click', (e) => e.preventDefault());
    }
  });
})();
