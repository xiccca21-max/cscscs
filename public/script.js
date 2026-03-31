/* ═══════════════════════════════════════════════
   SKINWAWE — Main Script
   ═══════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ═══════════════════════════════════════════
     AUTH SYSTEM
     ═══════════════════════════════════════════ */
  var STORAGE_KEY = 'skinsell_auth';
  var isLoggedIn = localStorage.getItem(STORAGE_KEY) === '1';

  var protectedPages = ['orders.html', 'order.html', 'balance.html', 'referral.html'];
  var currentPage = window.location.pathname.split('/').pop() || 'index.html';

  if (!isLoggedIn && protectedPages.indexOf(currentPage) !== -1) {
    window.location.href = 'index.html';
  }

  var signInBtn = document.getElementById('signInBtn');
  var headerUser = document.getElementById('headerUser');

  function updateAuthUI() {
    isLoggedIn = localStorage.getItem(STORAGE_KEY) === '1';
    if (signInBtn) signInBtn.style.display = isLoggedIn ? 'none' : '';
    if (headerUser) headerUser.style.display = isLoggedIn ? 'flex' : 'none';
  }

  function doLogin() {
    localStorage.setItem(STORAGE_KEY, '1');
    updateAuthUI();
    var sellOverlay = document.getElementById('sellLoginOverlay');
    if (sellOverlay) {
      sellOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }
    toast('Signed in via Steam successfully!', 'success');
  }

  function doLogout() {
    localStorage.removeItem(STORAGE_KEY);
    window.location.href = 'index.html';
  }

  updateAuthUI();

  if (signInBtn) {
    signInBtn.addEventListener('click', function(e) {
      e.preventDefault();
      doLogin();
    });
  }

  var signInStep = document.getElementById('signInStep');
  if (signInStep) signInStep.addEventListener('click', function(e) { e.preventDefault(); doLogin(); });

  document.addEventListener('click', function(e) {
    if (e.target.closest('#logoutBtn')) {
      e.preventDefault();
      doLogout();
    }
  });

  /* Sell page: show login overlay for guests */
  var sellLoginOverlay = document.getElementById('sellLoginOverlay');
  var sellSignInBtn = document.getElementById('sellSignInBtn');
  if (sellLoginOverlay && !isLoggedIn) {
    sellLoginOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  if (sellSignInBtn) {
    sellSignInBtn.addEventListener('click', function(e) {
      e.preventDefault();
      doLogin();
    });
  }

  /* ── Toast System ── */
  const toastContainer = document.getElementById('toastContainer');

  function toast(msg, type = 'info') {
    if (!toastContainer) return;
    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    el.textContent = msg;
    toastContainer.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateX(40px)';
      el.style.transition = 'all 0.3s';
      setTimeout(() => el.remove(), 300);
    }, 3000);
  }

  /* ── FAQ Accordion ── */
  document.querySelectorAll('.fq-item__q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.fq-item');
      if (!item) return;
      const wasOpen = item.classList.contains('open');

      item.closest('.fq-section__items')?.querySelectorAll('.fq-item.open').forEach(i => {
        i.classList.remove('open');
        i.querySelector('.fq-item__q')?.setAttribute('aria-expanded', 'false');
      });

      if (!wasOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ── FAQ Search ── */
  const faqSearch = document.getElementById('faqSearch');

  if (faqSearch) {
    faqSearch.addEventListener('input', () => {
      const q = faqSearch.value.toLowerCase().trim();
      const activeCat = document.querySelector('[data-faq-cat].active');
      const cat = activeCat ? activeCat.getAttribute('data-faq-cat') : 'all';

      document.querySelectorAll('.fq-item').forEach(item => {
        const matchCat = cat === 'all' || item.getAttribute('data-cat') === cat;
        const matchSearch = !q || item.textContent.toLowerCase().includes(q);
        item.classList.toggle('hidden', !(matchCat && matchSearch));
      });

      document.querySelectorAll('.fq-section').forEach(sec => {
        const sectionCat = sec.getAttribute('data-section');
        const catMatch = cat === 'all' || sectionCat === cat;
        const hasVisible = sec.querySelector('.fq-item:not(.hidden)');
        sec.classList.toggle('hidden', !catMatch || !hasVisible);
      });
    });
  }

  /* ── FAQ Category Filter ── */
  document.querySelectorAll('[data-faq-cat]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-faq-cat]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.faqCat;
      let q = '';
      if (faqSearch) q = faqSearch.value.toLowerCase().trim();
      document.querySelectorAll('.fq-item').forEach(item => {
        const matchCat = cat === 'all' || item.getAttribute('data-cat') === cat;
        const matchSearch = !q || item.textContent.toLowerCase().includes(q);
        item.classList.toggle('hidden', !(matchCat && matchSearch));
      });
      document.querySelectorAll('.fq-section').forEach(sec => {
        const sectionCat = sec.getAttribute('data-section');
        const catMatch = cat === 'all' || sectionCat === cat;
        const hasVisible = sec.querySelector('.fq-item:not(.hidden)');
        sec.classList.toggle('hidden', !catMatch || !hasVisible);
      });
    });
  });

  /* ── Orders page ── */
  (function initOrdersPage() {
    const rows = document.querySelectorAll('.ord-row');
    const noResults = document.getElementById('ordersNoResults');
    const tableWrap = document.querySelector('.ord-table-wrap');
    if (!rows.length) return;

    let activeFilter = 'all';

    function applyVisibility() {
      const q = (document.getElementById('orderSearch')?.value || '').toLowerCase().trim();
      let visibleCount = 0;
      rows.forEach(row => {
        const matchesFilter = activeFilter === 'all' || row.dataset.status === activeFilter;
        const id = row.querySelector('.ord-row__id')?.textContent.toLowerCase() || '';
        const matchesSearch = q.length === 0 || id.includes(q);
        const show = matchesFilter && matchesSearch;
        row.classList.toggle('hidden', !show);
        if (show) visibleCount++;
      });
      if (noResults) {
        noResults.style.display = visibleCount === 0 ? '' : 'none';
      }
      if (tableWrap) {
        tableWrap.style.display = visibleCount === 0 ? 'none' : '';
      }
    }

    document.querySelectorAll('.ord-fil').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.ord-fil').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilter = btn.dataset.status;
        applyVisibility();
      });
    });

    const orderSearch = document.getElementById('orderSearch');
    if (orderSearch) {
      orderSearch.addEventListener('input', applyVisibility);
    }

    /* Sorting */
    document.querySelectorAll('.ord-th--sortable').forEach(th => {
      th.addEventListener('click', () => {
        const sortKey = th.dataset.sort;
        const currentDir = th.dataset.dir || 'desc';
        const newDir = currentDir === 'desc' ? 'asc' : 'desc';

        document.querySelectorAll('.ord-th--sortable').forEach(h => {
          h.classList.remove('ord-th--active', 'ord-th--asc');
          h.removeAttribute('data-dir');
        });
        th.dataset.dir = newDir;
        th.classList.add('ord-th--active');
        if (newDir === 'asc') th.classList.add('ord-th--asc');

        const tbody = document.getElementById('ordersBody');
        if (!tbody) return;
        const arr = Array.from(rows);
        arr.sort((a, b) => {
          let va, vb;
          if (sortKey === 'date') {
            va = a.dataset.date || '';
            vb = b.dataset.date || '';
        } else {
            va = parseFloat(a.dataset.amount) || 0;
            vb = parseFloat(b.dataset.amount) || 0;
          }
          if (va < vb) return newDir === 'asc' ? -1 : 1;
          if (va > vb) return newDir === 'asc' ? 1 : -1;
          return 0;
        });
        arr.forEach(r => tbody.appendChild(r));
      });
    });
  })();

  (function initOrdersPagination() {
    var ROWS_PER_PAGE = 5;
    var currentPage = 1;
    var pagBtns = document.querySelectorAll('.ord-pag__btn');
    var pagInfo = document.querySelector('.ord-pag__info');
    if (!pagBtns.length) return;

    function getVisibleRows() {
      return Array.from(document.querySelectorAll('.ord-row:not(.hidden)'));
    }

    function renderPage() {
      var rows = getVisibleRows();
      var totalPages = Math.max(1, Math.ceil(rows.length / ROWS_PER_PAGE));
      if (currentPage > totalPages) currentPage = totalPages;
      var start = (currentPage - 1) * ROWS_PER_PAGE;
      var end = start + ROWS_PER_PAGE;
      rows.forEach(function(r, i) {
        r.style.display = (i >= start && i < end) ? '' : 'none';
      });
      if (pagInfo) pagInfo.textContent = 'Showing ' + (rows.length ? start + 1 : 0) + '–' + Math.min(end, rows.length) + ' of ' + rows.length + ' orders';
      pagBtns.forEach(function(btn) {
        var page = btn.getAttribute('data-page');
        if (page === 'prev') btn.disabled = (currentPage <= 1);
        else if (page === 'next') btn.disabled = (currentPage >= totalPages);
        else {
          var p = parseInt(page, 10);
          if (!isNaN(p)) btn.classList.toggle('ord-pag__btn--active', p === currentPage);
        }
      });
    }

    pagBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var page = this.getAttribute('data-page');
        if (page === 'prev') currentPage--;
        else if (page === 'next') currentPage++;
        else { var p = parseInt(page, 10); if (!isNaN(p)) currentPage = p; }
        renderPage();
      });
    });

    var observer = new MutationObserver(function() { currentPage = 1; setTimeout(renderPage, 50); });
    var tbody = document.getElementById('ordersBody');
    if (tbody) observer.observe(tbody, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });

    renderPage();
  })();

  /* ── Header: blur + shadow on scroll & active nav spy ── */
  (function initHeaderScroll() {
    const header = document.querySelector('.header');
    if (!header) return;

    const navLinks = header.querySelectorAll('.header__nav a[href^="#"]');
    const sections = [];

    navLinks.forEach(link => {
      const id = link.getAttribute('href');
      if (id && id.startsWith('#')) {
        const el = document.querySelector(id);
        if (el) sections.push({ el, link });
      }
    });

    const faqLink = header.querySelector('.header__nav a[href="faq.html"]');
    const faqSection = document.querySelector('#faqPreview');

    if (faqSection && faqLink) sections.push({ el: faqSection, link: faqLink });

    function onScroll() {
      const scrolled = window.scrollY > 20;
      header.classList.toggle('is-scrolled', scrolled);

      if (!sections.length) return;
      const scrollPos = window.scrollY + 120;
      let activeLink = null;

      sections.forEach(({ el, link }) => {
        if (el.offsetTop <= scrollPos && el.offsetTop + el.offsetHeight > scrollPos) {
          activeLink = link;
        }
      });

      navLinks.forEach(l => l.classList.remove('active'));
      if (faqLink) faqLink.classList.remove('active');
      if (activeLink) activeLink.classList.add('active');
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  })();

  /* ── Active page highlight in nav ── */
  (function initActivePageNav() {
    var pg = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    var nav = document.querySelector('.header__nav');
    if (!nav) return;
    var links = nav.querySelectorAll('a');
    links.forEach(function(a) {
      var href = (a.getAttribute('href') || '').split('#')[0].split('?')[0].toLowerCase();
      if (href === pg || (pg === 'index.html' && href === '')) {
        a.classList.add('active');
      }
    });
  })();

  /* ── Sliding pill hover for nav ── */
  (function initNavSlider() {
    var nav = document.querySelector('.header__nav');
    if (!nav) return;
    var slider = document.createElement('div');
    slider.className = 'header__nav-slider';
    nav.appendChild(slider);

    var links = nav.querySelectorAll('a');
    var activeLink = nav.querySelector('a.active');

    function positionSlider(el, animate) {
      if (!el) { slider.style.opacity = '0'; return; }
      var navRect = nav.getBoundingClientRect();
      var elRect = el.getBoundingClientRect();
      slider.style.width = elRect.width + 'px';
      slider.style.height = elRect.height + 'px';
      slider.style.left = (elRect.left - navRect.left) + 'px';
      slider.style.top = (elRect.top - navRect.top) + 'px';
      slider.style.opacity = '1';
      slider.style.transition = animate ? 'all 0.25s cubic-bezier(0.4,0,0.2,1)' : 'none';
    }

    if (activeLink) positionSlider(activeLink, false);

    links.forEach(function(a) {
      a.addEventListener('mouseenter', function() { positionSlider(a, true); });
    });
    nav.addEventListener('mouseleave', function() {
      if (activeLink) positionSlider(activeLink, true);
      else slider.style.opacity = '0';
    });
    window.addEventListener('resize', function() {
      if (activeLink) positionSlider(activeLink, false);
    });
  })();

  /* ── Scroll Reveal ── */
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

  /* ── Card-stack fan on scroll ── */
  (function initCardStackScroll() {
    const stack = document.querySelector('.card-stack');
    if (!stack) return;
    const section = stack.closest('.games-section') || stack.parentElement;
    const csObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        stack.classList.toggle('card-stack--fanned', entry.isIntersecting);
      });
    }, { threshold: 0.15 });
    csObserver.observe(section);
  })();

  /* ── Steps Timeline Animation ── */
  (function initStepsTimeline() {
    const timeline = document.querySelector('.steps-timeline');
    if (!timeline) return;

    const steps = timeline.querySelectorAll('.step');
    steps.forEach((s, i) => s.style.setProperty('--d', i));

    const tObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          timeline.classList.add('is-visible');
          tObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    tObserver.observe(timeline);
  })();

  /* ── Features grid stagger ── */
  (function initFeaturesStagger() {
    const grid = document.querySelector('.features__grid');
    if (!grid) return;
    const fObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
          grid.classList.add('is-visible');
          fObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    fObserver.observe(grid);
  })();

  /* ── Live Payouts Rotation ── */
  (function initLivePayouts() {
    const container = document.querySelector('.hero__payouts');
    if (!container) return;

    const rows = container.querySelectorAll('.hero__payout-row');
    if (!rows.length) return;

    const names = [
      'Alex C.', 'Maria S.', 'Denis P.', 'Oleg K.', 'Ivan R.',
      'Anna M.', 'Sergey L.', 'Kate V.', 'Dmitry N.', 'Elena B.',
      'Max T.', 'Viktor S.', 'Julia F.', 'Artem G.', 'Nikita Z.',
      'Dasha P.', 'Roman H.', 'Alina D.', 'Pavel Y.', 'Lena W.'
    ];

    function randAmount() {
      const r = Math.random();
      if (r < 0.72) return (15 + Math.random() * 485).toFixed(2);
      if (r < 0.92) return (500 + Math.random() * 500).toFixed(2);
      return (1000 + Math.random() * 280).toFixed(2);
    }

    function randName() {
      return names[Math.floor(Math.random() * names.length)];
    }

    function updateRow(row) {
      const name = randName();
      const amount = randAmount();
      const letter = name.charAt(0);

      const userEl = row.querySelector('.hero__payout-user');
      const amountEl = row.querySelector('.hero__payout-amount');
      if (!userEl || !amountEl) return;

      row.style.transition = 'opacity 0.3s, transform 0.3s';
      row.style.opacity = '0';
      row.style.transform = 'translateY(-8px)';

      setTimeout(() => {
        userEl.innerHTML = '<span>' + letter + '</span> ' + name;
        amountEl.textContent = Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2 }) + '$';

        row.style.transform = 'translateY(8px)';
        requestAnimationFrame(() => {
          row.style.opacity = '1';
          row.style.transform = 'translateY(0)';
        });
      }, 300);
    }

    let idx = 0;
    setInterval(() => {
      updateRow(rows[idx % rows.length]);
      idx++;
    }, 3500);
  })();

  /* ── Reviews Carousel ── */
  (function initCarousel() {
    const carousel = document.querySelector('.carousel');
    if (!carousel) return;

    const slides = carousel.querySelectorAll('.carousel__slide');
    const dots = carousel.querySelectorAll('.carousel__dot');
    const total = slides.length;
    if (!total) return;

    let current = 0;
    let autoTimer = null;
    const AUTO_MS = 5000;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const stateClasses = ['is-active', 'is-prev', 'is-next', 'is-far-prev', 'is-far-next'];

    function goTo(idx) {
      current = ((idx % total) + total) % total;

      slides.forEach((slide, i) => {
        slide.classList.remove(...stateClasses);

        let offset = i - current;
        if (offset > total / 2) offset -= total;
        if (offset < -total / 2) offset += total;

        if (offset === 0)       slide.classList.add('is-active');
        else if (offset === -1) slide.classList.add('is-prev');
        else if (offset === 1)  slide.classList.add('is-next');
        else if (offset === -2) slide.classList.add('is-far-prev');
        else if (offset === 2)  slide.classList.add('is-far-next');
      });

      dots.forEach((dot, i) => {
        const isActive = i === current;
        dot.classList.toggle('active', isActive);
        dot.setAttribute('aria-selected', isActive);
      });
    }

    function next() { goTo(current + 1); }
    function prev() { goTo(current - 1); }

    function startAuto() {
      stopAuto();
      if (!prefersReduced) autoTimer = setInterval(next, AUTO_MS);
    }
    function stopAuto() {
      if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
    }

    carousel.querySelector('.carousel__arrow--prev')?.addEventListener('click', () => { prev(); startAuto(); });
    carousel.querySelector('.carousel__arrow--next')?.addEventListener('click', () => { next(); startAuto(); });

    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => { goTo(i); startAuto(); });
    });

    slides.forEach((slide, i) => {
      slide.addEventListener('click', () => {
        if (i !== current) { goTo(i); startAuto(); }
    });
  });

    carousel.addEventListener('mouseenter', stopAuto);
    carousel.addEventListener('mouseleave', startAuto);

    carousel.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft')  { e.preventDefault(); prev(); startAuto(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); next(); startAuto(); }
    });

    let touchX0 = 0;
    let isDragging = false;

    carousel.addEventListener('touchstart', e => {
      touchX0 = e.changedTouches[0].clientX;
      isDragging = true;
      stopAuto();
    }, { passive: true });

    carousel.addEventListener('touchend', e => {
      if (!isDragging) return;
      isDragging = false;
      const dx = touchX0 - e.changedTouches[0].clientX;
      if (Math.abs(dx) > 40) {
        dx > 0 ? next() : prev();
      }
      startAuto();
    }, { passive: true });

    let mouseX0 = 0;
    let mouseDown = false;

    carousel.addEventListener('mousedown', e => {
      mouseX0 = e.clientX;
      mouseDown = true;
      carousel.style.cursor = 'grabbing';
    });
    document.addEventListener('mousemove', e => {
      if (!mouseDown) return;
      e.preventDefault();
    });
    document.addEventListener('mouseup', e => {
      if (!mouseDown) return;
      mouseDown = false;
      carousel.style.cursor = '';
      const dx = mouseX0 - e.clientX;
      if (Math.abs(dx) > 40) {
        dx > 0 ? next() : prev();
        startAuto();
      }
    });

    goTo(0);
    startAuto();
  })();

  /* ── Mobile: Burger Toggle ── */
  const burger = document.getElementById('burgerBtn');
  const headerNav = document.querySelector('.header__nav');
  const adminSidebar = document.getElementById('adminSidebar');

  if (burger) {
    burger.addEventListener('click', () => {
      if (headerNav) headerNav.classList.toggle('open');
      if (adminSidebar) adminSidebar.classList.toggle('open');
    });
    document.addEventListener('click', e => {
      if (!burger.contains(e.target)) {
        if (headerNav?.classList.contains('open') && !headerNav.contains(e.target)) {
          headerNav.classList.remove('open');
        }
        if (adminSidebar?.classList.contains('open') && !adminSidebar.contains(e.target)) {
          adminSidebar.classList.remove('open');
        }
      }
    });
  }

  const adminBurger = document.getElementById('adminBurger');
  if (adminBurger && adminSidebar) {
    adminBurger.addEventListener('click', function () {
      adminSidebar.classList.toggle('open');
    });
  }

  /* ── Guest overlay Sign In (demo) ── */
  var guestSignIn = document.getElementById('guestSignIn');
  if (guestSignIn) {
    guestSignIn.addEventListener('click', function(e) {
      e.preventDefault();
      doLogin();
    });
  }

  /* ── Dropdown Selectors (currency / language) ── */
  document.querySelectorAll('.header__dropdown-wrap').forEach(wrap => {
    const chip = wrap.querySelector('.header__select');
    const dropdown = wrap.querySelector('.header__dropdown');
    if (!chip || !dropdown) return;

    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      const wasOpen = wrap.classList.contains('is-open');
      document.querySelectorAll('.header__dropdown-wrap.is-open').forEach(w => w.classList.remove('is-open'));
      if (!wasOpen) wrap.classList.add('is-open');
    });

    dropdown.querySelectorAll('.header__dropdown-item').forEach(item => {
      item.addEventListener('click', () => {
        const val = item.dataset.val;

        dropdown.querySelectorAll('.header__dropdown-item').forEach(i => i.classList.remove('is-active'));
        item.classList.add('is-active');
        wrap.classList.remove('is-open');

        if (chip.id === 'langChip' && typeof applyLang === 'function') {
          applyLang(val);
        } else if (chip.id === 'currencyChip' && typeof applyCurrency === 'function') {
          applyCurrency(val);
        } else {
          const label = chip.querySelector('span');
          if (label) label.textContent = val;
        }
        toast(`${val}`, 'info');
      });
    });
  });

  document.addEventListener('click', () => {
    document.querySelectorAll('.header__dropdown-wrap.is-open').forEach(w => w.classList.remove('is-open'));
  });

  /* ═══════════════════════════════════════════
     SELL PAGE LOGIC
     ═══════════════════════════════════════════ */

  const gameTabs = document.getElementById('gameTabs');
  const inventoryGrid = document.getElementById('inventoryGrid');
  const selectedList = document.getElementById('selectedList');
  const selectedCount = document.getElementById('selectedCount');
  const selectedTotal = document.getElementById('selectedTotal');
  const offerItems = document.getElementById('offerItems');
  const offerCount = document.getElementById('offerCount');
  const offerTotal = document.getElementById('offerTotal');
  const tradeUrlInput = document.getElementById('tradeUrl');
  const tradeUrlStatus = document.getElementById('tradeUrlStatus');
  const submitBtn = document.getElementById('submitOrder');
  const paymentFields = document.getElementById('paymentFields');
  const searchClear = document.getElementById('searchClear');
  const inventorySearch = document.getElementById('inventorySearch');
  const inventoryCountEl = document.getElementById('inventoryCount');
  let currentSort = 'price-desc';
  const wearFilters = document.getElementById('wearFilters');
  const priceMinInput = document.getElementById('priceMin');
  const priceMaxInput = document.getElementById('priceMax');
  const selectAllBtn = document.getElementById('selectAllBtn');
  const clearAllBtn = document.getElementById('clearAllBtn');

  let selectedItems = [];
  let activePaymentMethod = null;
  let activeWear = 'all';

  const statsCountEl = document.getElementById('statsCount');
  const statsTotalEl = document.getElementById('statsTotal');
  const emptyStateEl = document.getElementById('emptyState');
  const bonusFill = document.getElementById('bonusFill');
  const bonusProgress = document.getElementById('bonusProgress');

  function getActiveGame() {
    return gameTabs?.querySelector('.game-tab.active')?.dataset.game || 'cs2';
  }

  const wearMap = {
    'Factory New': 'FN', 'Minimal Wear': 'MW', 'Field-Tested': 'FT',
    'Well-Worn': 'WW', 'Battle-Scarred': 'BS'
  };

  function filterAndSort() {
    if (!inventoryGrid) return;
    const game = getActiveGame();
    const q = (inventorySearch?.value || '').toLowerCase().trim();
    const minP = parseFloat(priceMinInput?.value) || 0;
    const maxP = parseFloat(priceMaxInput?.value) || Infinity;
    const cards = Array.from(inventoryGrid.querySelectorAll('.inv-card:not(.inv-card--skeleton)'));

    let visibleCount = 0;
    let totalValue = 0;

    cards.forEach(card => {
      const matchGame = card.dataset.game === game;
      const matchName = !q || card.dataset.name.toLowerCase().includes(q);
      const price = parseFloat(card.dataset.price) || 0;
      const matchPrice = price >= minP && price <= maxP;
      const wearAttr = card.getAttribute('data-wear') || '';
      const cardWear = wearMap[wearAttr] || '';
      const matchWear = (activeWear === 'all') || !wearAttr || (cardWear === activeWear);
      const visible = matchGame && matchName && matchPrice && matchWear;

      const isSelected = card.classList.contains('selected');
      card.style.display = (visible && !isSelected) ? '' : 'none';
      card.classList.toggle('hidden', !visible || isSelected);
      if (visible) { visibleCount++; totalValue += price; }
    });

    if (inventoryCountEl) {
      inventoryCountEl.textContent = `${visibleCount} item${visibleCount !== 1 ? 's' : ''}`;
    }

    if (searchClear) {
      searchClear.style.display = q ? '' : 'none';
    }

    if (statsCountEl) statsCountEl.textContent = visibleCount;
    if (statsTotalEl) statsTotalEl.textContent = `${totalValue.toFixed(2)}$`;

    if (emptyStateEl) {
      emptyStateEl.style.display = visibleCount === 0 ? '' : 'none';
    }
    if (inventoryGrid) {
      inventoryGrid.style.display = visibleCount === 0 ? 'none' : '';
    }

    const sortVal = currentSort || 'price-desc';
    if (sortVal) {
      const visibleCards = cards.filter(c => c.style.display !== 'none');
      visibleCards.sort((a, b) => {
        switch (sortVal) {
          case 'price-asc': return (parseFloat(a.dataset.price)||0) - (parseFloat(b.dataset.price)||0);
          case 'price-desc': return (parseFloat(b.dataset.price)||0) - (parseFloat(a.dataset.price)||0);
          case 'name-asc': return a.dataset.name.localeCompare(b.dataset.name);
          case 'name-desc': return b.dataset.name.localeCompare(a.dataset.name);
          case 'float-asc': return (parseFloat(a.dataset.float)||0) - (parseFloat(b.dataset.float)||0);
          case 'float-desc': return (parseFloat(b.dataset.float)||1) - (parseFloat(a.dataset.float)||1);
          default: return 0;
        }
      });
      visibleCards.forEach(c => inventoryGrid.appendChild(c));
    }
  }

  function updateBonus() {
    const count = selectedItems.length;
    const target = 5;
    const pct = Math.min(count / target * 100, 100);
    if (bonusFill) bonusFill.style.width = pct + '%';
    if (bonusProgress) bonusProgress.textContent = `${count} / ${target} items`;
  }

  function showSkeletons() {
    if (!inventoryGrid) return;
    inventoryGrid.querySelectorAll('.inv-card:not(.inv-card--skeleton)').forEach(c => {
      c.style.display = 'none';
      c.classList.add('hidden');
    });
    if (emptyStateEl) emptyStateEl.style.display = 'none';
    const existing = inventoryGrid.querySelectorAll('.inv-card--skeleton');
    existing.forEach(s => s.remove());
    for (let i = 0; i < 6; i++) {
      const skel = document.createElement('div');
      skel.className = 'inv-card inv-card--skeleton';
      skel.innerHTML = '<div class="inv-card__rarity-line"></div><div class="inv-card__img"></div><div class="inv-card__info"><div class="skel-line skel-line--short"></div><div class="skel-line skel-line--price"></div></div>';
      inventoryGrid.appendChild(skel);
    }
  }

  function hideSkeletons() {
    if (!inventoryGrid) return;
    inventoryGrid.querySelectorAll('.inv-card--skeleton').forEach(s => s.remove());
  }

  /* Game tab switching */
  if (gameTabs) {
    gameTabs.addEventListener('click', e => {
      const tab = e.target.closest('.game-tab');
      if (!tab) return;
      gameTabs.querySelectorAll('.game-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      showSkeletons();
      setTimeout(() => {
        hideSkeletons();
        filterAndSort();
        animateCards();
      }, 400);
    });
  }

  /* Search */
  if (inventorySearch) {
    inventorySearch.addEventListener('input', filterAndSort);
  }
  if (searchClear) {
    searchClear.addEventListener('click', () => {
      if (inventorySearch) { inventorySearch.value = ''; }
      filterAndSort();
      inventorySearch?.focus();
    });
  }

  /* Wear filter */
  if (wearFilters) {
    wearFilters.addEventListener('click', e => {
      const pill = e.target.closest('.wear-pill');
      if (!pill) return;
      wearFilters.querySelectorAll('.wear-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeWear = pill.dataset.wear;
      filterAndSort();
    });
  }

  /* Price range */
  if (priceMinInput) priceMinInput.addEventListener('input', filterAndSort);
  if (priceMaxInput) priceMaxInput.addEventListener('input', filterAndSort);

  /* Sort */
  /* Custom sort dropdown */
  const sortWrap = document.getElementById('sortWrap');
  const sortTrigger = document.getElementById('sortTrigger');
  const sortDropdown = document.getElementById('sortDropdown');
  const sortLabel = document.getElementById('sortLabel');

  if (sortTrigger && sortWrap) {
    sortTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      sortWrap.classList.toggle('open');
    });
  }
  if (sortDropdown && sortWrap) {
    sortDropdown.addEventListener('click', (e) => {
      const btn = e.target.closest('.sort-dropdown__item');
      if (!btn) return;
      sortDropdown.querySelectorAll('.sort-dropdown__item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSort = btn.dataset.sort;
      if (sortLabel) sortLabel.textContent = btn.textContent;
      sortWrap.classList.remove('open');
      filterAndSort();
    });
  }
  document.addEventListener('click', () => {
    if (sortWrap) sortWrap.classList.remove('open');
  });

  /* Select all / Clear */
  if (selectAllBtn) {
    selectAllBtn.addEventListener('click', () => {
      document.querySelectorAll('.inv-card:not(.hidden)').forEach(card => {
        if (card.classList.contains('unavailable')) return;
        if (card.classList.contains('selected')) return;
        card.classList.add('selected');
        card.style.display = 'none';
        const name = card.dataset.name;
        const price = parseFloat(card.dataset.price);
        const imgEl = card.querySelector('.inv-card__skin');
        const weaponEl = card.querySelector('.inv-card__weapon');
        const skinNameEl = card.querySelector('.inv-card__skin-name');
        if (!selectedItems.find(i => i.name === name)) {
          selectedItems.push({
            name, price,
            img: imgEl?.src || '',
            wear: card.dataset.wear || '',
            floatVal: card.dataset.float || '',
            rarity: card.style.getPropertyValue('--rarity') || 'var(--accent)',
            weapon: weaponEl?.textContent || '',
            skinName: skinNameEl?.textContent || name
          });
        }
      });
      updateSelectedUI();
      validateForm();
    });
  }
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
      document.querySelectorAll('.inv-card.selected').forEach(c => {
        c.classList.remove('selected');
      });
      selectedItems = [];
      updateSelectedUI();
      validateForm();
      filterAndSort();
    });
  }

  /* Item selection */
  if (inventoryGrid) {
    inventoryGrid.addEventListener('click', e => {
      const card = e.target.closest('.inv-card');
      if (!card || card.classList.contains('unavailable')) return;
      if (e.target.closest('.inv-card__sticker')) return;

      const name = card.dataset.name;
      const price = parseFloat(card.dataset.price);
      const imgEl = card.querySelector('.inv-card__skin');

      if (card.classList.contains('selected')) {
        card.classList.remove('selected');
        card.style.display = '';
        card.classList.remove('card-hide');
        card.classList.add('card-return');
        setTimeout(() => card.classList.remove('card-return'), 350);
        selectedItems = selectedItems.filter(i => i.name !== name);
        updateSelectedUI();
        validateForm();
      } else {
        const wear = card.dataset.wear || '';
        const floatVal = card.dataset.float || '';
        const rarity = card.style.getPropertyValue('--rarity') || 'var(--accent)';
        const weaponEl = card.querySelector('.inv-card__weapon');
        const skinNameEl = card.querySelector('.inv-card__skin-name');
        selectedItems.push({
          name, price,
          img: imgEl?.src || '',
          wear,
          floatVal,
          rarity,
          weapon: weaponEl?.textContent || '',
          skinName: skinNameEl?.textContent || name
        });
        card.classList.add('selected', 'card-hide');
        setTimeout(() => {
          card.classList.remove('card-hide');
          card.style.display = 'none';
        }, 300);
        updateSelectedUI();
        validateForm();
      }
    });
  }

  function updateSelectedUI() {
    const total = selectedItems.reduce((sum, i) => sum + i.price, 0);
    const curCount = selectedItems.length;

    if (offerItems) {
      if (curCount === 0) {
        offerItems.innerHTML = `<div class="sell-offer__empty">Select items from inventory below</div>`;
      } else {
        offerItems.innerHTML = selectedItems.map(item => {
          const wearShort = item.wear ? item.wear.split(' ').map(w => w[0]).join('') : '';
          const floatPct = item.floatVal ? (parseFloat(item.floatVal) * 100).toFixed(0) : '0';
          const dollars = Math.floor(item.price);
          const cents = (item.price % 1).toFixed(2).slice(1);
          return `
          <div class="offer-card card-in" data-name="${item.name}" style="--rarity:${item.rarity}">
            <div class="offer-card__rarity"></div>
            <div class="offer-card__img">
              ${wearShort ? `<span class="offer-card__wear">${wearShort}</span>` : ''}
              <img src="${item.img}" alt="${item.name}" loading="lazy">
            </div>
            <div class="offer-card__info">
              <span class="offer-card__name"><span class="offer-card__weapon">${item.weapon}</span> ${item.skinName}</span>
              ${item.floatVal ? `<div class="offer-card__float">
                <div class="offer-card__float-track"><div class="offer-card__float-fill" style="width:${floatPct}%"></div></div>
                <span>${item.floatVal}</span>
              </div>` : ''}
              <span class="offer-card__price">${dollars}<span class="offer-card__cents">${cents}</span></span>
            </div>
          </div>`;
        }).join('');

        offerItems.querySelectorAll('.offer-card').forEach(card => {
          setTimeout(() => card.classList.remove('card-in'), 350);
          card.addEventListener('click', () => {
            const name = card.dataset.name;
            card.classList.add('card-out');
            setTimeout(() => {
              selectedItems = selectedItems.filter(i => i.name !== name);
              document.querySelectorAll('.inv-card').forEach(c => {
                if (c.dataset.name === name) {
                  c.classList.remove('selected');
                  c.style.display = '';
                  c.classList.add('card-return');
                  setTimeout(() => c.classList.remove('card-return'), 350);
                }
              });
              updateSelectedUI();
              validateForm();
            }, 250);
          });
        });
      }
    }

    if (offerCount) offerCount.textContent = curCount;
    if (offerTotal) {
      offerTotal.textContent = total.toFixed(2) + '$';
    }
    requestAnimationFrame(updateOfferArrows);

    if (selectedList) {
      if (curCount === 0) {
        selectedList.innerHTML = `
          <div class="sell-selected__empty">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            <p>Click items in your inventory to select them</p>
          </div>`;
      } else {
        selectedList.innerHTML = selectedItems.map(item => {
          const dollars = Math.floor(item.price);
          const cents = (item.price % 1).toFixed(2).substring(1);
          return `
          <div class="selected-item">
            <div class="selected-item__thumb">
              <img src="${item.img}" alt="${item.name}" loading="lazy">
            </div>
            <span class="selected-item__name">${item.name}</span>
            <span class="selected-item__price">${dollars}<span class="selected-item__cents">${cents}</span>$</span>
            <button class="selected-item__remove" data-name="${item.name}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>`;
        }).join('');

        selectedList.querySelectorAll('.selected-item__remove').forEach(btn => {
    btn.addEventListener('click', e => {
            e.stopPropagation();
            const name = btn.dataset.name;
            selectedItems = selectedItems.filter(i => i.name !== name);
            document.querySelectorAll('.inv-card').forEach(c => {
              if (c.dataset.name === name) c.classList.remove('selected');
            });
            updateSelectedUI();
            validateForm();
          });
        });
      }
    }

    if (selectedCount) selectedCount.textContent = `${curCount} item${curCount !== 1 ? 's' : ''}`;

    if (selectedTotal) {
      animateCountUp(selectedTotal, total, '', '$');
      selectedTotal.classList.remove('bump');
      void selectedTotal.offsetWidth;
      selectedTotal.classList.add('bump');
    }

    updateSummary(total);
    updateProgress();
    updateBonus();
  }

  function updateSummary(total) {
    const commPct = activePaymentMethod === 'balance' ? 0 :
                    activePaymentMethod === 'crypto' ? 0.01 :
                    activePaymentMethod === 'card' ? 0.025 : 0.03;

    const comm = total * commPct;
    const net = total - comm;

    const summaryItems = document.getElementById('summaryItems');
    const summaryCommPct = document.getElementById('summaryCommPct');
    const summaryComm = document.getElementById('summaryComm');
    const summaryTotal = document.getElementById('summaryTotal');

    if (summaryItems) summaryItems.textContent = `${total.toFixed(2)}$`;
    if (summaryCommPct) summaryCommPct.textContent = `${(commPct * 100).toFixed(1)}%`;
    if (summaryComm) summaryComm.textContent = `${comm.toFixed(2)}$`;
    if (summaryTotal) summaryTotal.textContent = `${net.toFixed(2)}$`;
  }

  /* Progress steps */
  function updateProgress() {
    const steps = document.querySelectorAll('.sell-step');
    if (!steps.length) return;

    const hasItems = selectedItems.length > 0;
    const tradeUrl = tradeUrlInput?.value.trim() || '';
    const validUrl = /^https:\/\/steamcommunity\.com\/tradeoffer\/new\/\?partner=\d+&token=.+$/.test(tradeUrl);
    const hasMethod = activePaymentMethod !== null;

    const lines = document.querySelectorAll('.sell-step__line');
    steps.forEach(s => { s.classList.remove('active', 'done'); });
    lines.forEach(l => { l.classList.remove('done'); });

    if (hasItems && validUrl && hasMethod) {
      steps[0].classList.add('done');
      steps[1].classList.add('done');
      steps[2].classList.add('done');
      lines.forEach(l => l.classList.add('done'));
    } else if (hasItems && validUrl) {
      steps[0].classList.add('done');
      steps[1].classList.add('done');
      steps[2].classList.add('active');
      if (lines[0]) lines[0].classList.add('done');
      if (lines[1]) lines[1].classList.add('done');
    } else if (hasItems) {
      steps[0].classList.add('done');
      steps[1].classList.add('active');
      if (lines[0]) lines[0].classList.add('done');
    } else {
      steps[0].classList.add('active');
    }
  }

  /* Trade URL validation */
  if (tradeUrlInput) {
    tradeUrlInput.addEventListener('input', () => {
      const url = tradeUrlInput.value.trim();
      const valid = /^https:\/\/steamcommunity\.com\/tradeoffer\/new\/\?partner=\d+&token=.+$/.test(url);

      if (tradeUrlStatus) {
        if (url.length === 0) {
          tradeUrlStatus.textContent = '';
          tradeUrlStatus.className = 'sell-tradeurl__status';
        } else if (valid) {
          tradeUrlStatus.textContent = 'Valid Trade URL';
          tradeUrlStatus.className = 'sell-tradeurl__status valid';
        } else {
          tradeUrlStatus.textContent = 'Invalid Trade URL format';
          tradeUrlStatus.className = 'sell-tradeurl__status invalid';
        }
      }
      validateForm();
      updateProgress();
    });
  }

  /* Payment method selection */
  document.querySelectorAll('.pay-btn[data-method]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pay-btn[data-method]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      btn.classList.remove('pay-btn--bounce');
      void btn.offsetWidth;
      btn.classList.add('pay-btn--bounce');
      activePaymentMethod = btn.dataset.method;

      const paymentFields = document.getElementById('paymentFields');
      if (paymentFields) {
        paymentFields.style.display = '';
        paymentFields.querySelectorAll('.payment-field-group').forEach(g => {
          g.style.display = g.dataset.for === activePaymentMethod ? '' : 'none';
        });
      }

      const total = selectedItems.reduce((sum, i) => sum + i.price, 0);
      updateSummary(total);
      validateForm();
      updateProgress();
    });
  });
  if (document.querySelector('.pay-btn.active')) {
    activePaymentMethod = document.querySelector('.pay-btn.active').dataset.method;
  }

  /* Form validation */
  function validateForm() {
    if (!submitBtn) return;

    const hasItems = selectedItems.length > 0;
    const tradeUrl = tradeUrlInput?.value.trim() || '';
    const validUrl = /^https:\/\/steamcommunity\.com\/tradeoffer\/new\/\?partner=\d+&token=.+$/.test(tradeUrl);
    const hasMethod = activePaymentMethod !== null;

    let fieldsValid = true;
    if (activePaymentMethod && activePaymentMethod !== 'balance') {
      const activeGroup = paymentFields?.querySelector(`[data-for="${activePaymentMethod}"]`);
      if (activeGroup) {
        activeGroup.querySelectorAll('[data-required]').forEach(input => {
          if (!input.value.trim()) fieldsValid = false;
        });
      }
    }

    submitBtn.disabled = !(hasItems && validUrl && hasMethod && fieldsValid);
  }

  /* Submit order */
  if (submitBtn) {
    /* redirect handled by checkout modal submit */
  }

  /* Listen for field changes */
  if (paymentFields) {
    paymentFields.addEventListener('input', validateForm);
  }

  /* Staggered card fade-in animation */
  function animateCards() {
    if (!inventoryGrid) return;
    const cards = inventoryGrid.querySelectorAll('.inv-card:not(.inv-card--skeleton)');
    cards.forEach(c => c.classList.remove('card-appear'));

    let delay = 0;
    cards.forEach(card => {
      if (card.style.display === 'none') return;
      card.style.animationDelay = delay + 'ms';
      card.classList.add('card-appear');
      delay += 40;
    });
  }

  /* 3D Tilt effect on card hover */
  if (inventoryGrid) {
    inventoryGrid.addEventListener('mousemove', e => {
      const card = e.target.closest('.inv-card');
      if (!card || card.classList.contains('inv-card--skeleton')) return;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const midX = rect.width / 2;
      const midY = rect.height / 2;
      const rotY = ((x - midX) / midX) * 6;
      const rotX = ((midY - y) / midY) * 6;
      card.style.setProperty('--rx', rotX + 'deg');
      card.style.setProperty('--ry', rotY + 'deg');
    });
    inventoryGrid.addEventListener('mouseleave', e => {
      const card = e.target.closest('.inv-card');
      if (card) {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      }
    }, true);
    inventoryGrid.addEventListener('mouseout', e => {
      const card = e.target.closest('.inv-card');
      if (card && !card.contains(e.relatedTarget)) {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      }
    });
  }

  /* Lazy-load blur for skin images */
  document.querySelectorAll('.inv-card__skin').forEach(img => {
    if (img.complete && img.naturalWidth > 0) return;
    img.classList.add('img-loading');
    img.addEventListener('load', () => {
      img.classList.remove('img-loading');
      img.classList.add('img-loaded');
      img.addEventListener('animationend', () => img.classList.remove('img-loaded'), { once: true });
    }, { once: true });
    img.addEventListener('error', () => {
      img.classList.remove('img-loading');
    }, { once: true });
  });

  /* View toggle (grid / list) */
  const viewToggle = document.getElementById('viewToggle');
  if (viewToggle && inventoryGrid) {
    viewToggle.addEventListener('click', e => {
      const btn = e.target.closest('.view-toggle__btn');
      if (!btn) return;
      viewToggle.querySelectorAll('.view-toggle__btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const view = btn.dataset.view;
      inventoryGrid.classList.toggle('list-view', view === 'list');
    });
  }

  /* Game tab item counts */
  function updateTabCounts() {
    if (!inventoryGrid) return;
    const allCards = inventoryGrid.querySelectorAll('.inv-card:not(.inv-card--skeleton)');
    const counts = {};
    allCards.forEach(card => {
      const g = card.dataset.game;
      counts[g] = (counts[g] || 0) + 1;
    });
    document.querySelectorAll('.game-tab__count').forEach(badge => {
      const g = badge.dataset.gameCount;
      badge.textContent = counts[g] || 0;
    });
  }

  /* Count-up animation for Total */
  function animateCountUp(el, targetVal, prefix, suffix) {
    if (!el) return;
    prefix = prefix || '';
    suffix = suffix || '';
    const startVal = parseFloat(el.textContent.replace(/[^0-9.]/g, '')) || 0;
    if (Math.abs(startVal - targetVal) < 0.01) {
      el.textContent = prefix + targetVal.toFixed(2) + suffix;
      return;
    }
    const duration = 400;
    const startTime = performance.now();
    function step(now) {
      const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (targetVal - startVal) * eased;
      el.textContent = prefix + current.toFixed(2) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* Sidebar panel scroll hint */
  const sellPanel = document.getElementById('sellPanel');
  const panelScrollHint = document.getElementById('panelScrollHint');
  if (sellPanel && panelScrollHint) {
    function checkPanelScroll() {
      const atBottom = sellPanel.scrollTop + sellPanel.clientHeight >= sellPanel.scrollHeight - 20;
      const canScroll = sellPanel.scrollHeight > sellPanel.clientHeight + 10;
      panelScrollHint.classList.toggle('hidden', atBottom || !canScroll);
    }
    sellPanel.addEventListener('scroll', checkPanelScroll, { passive: true });
    panelScrollHint.addEventListener('click', () => {
      sellPanel.scrollBy({ top: 150, behavior: 'smooth' });
    });
    setTimeout(checkPanelScroll, 600);
  }

  /* Scroll shadow for inventory section */
  const scrollShadow = document.getElementById('scrollShadow');
  const inventoryScroll = document.getElementById('inventoryScroll');
  if (inventoryScroll && scrollShadow) {
    inventoryScroll.addEventListener('scroll', () => {
      scrollShadow.classList.toggle('has-scroll', inventoryScroll.scrollTop > 20);
    }, { passive: true });
  }

  /* Initial filter & progress */
  if (inventoryGrid) {
    updateTabCounts();
    filterAndSort();
    updateProgress();
    animateCards();
  }

  /* Offer bar arrow scroll */
  const offerArrowL = document.getElementById('offerArrowL');
  const offerArrowR = document.getElementById('offerArrowR');

  function updateOfferArrows() {
    if (!offerArrowL || !offerArrowR || !offerItems) return;
    const overflows = offerItems.scrollWidth > offerItems.clientWidth + 2;
    offerArrowL.classList.toggle('visible', overflows);
    offerArrowR.classList.toggle('visible', overflows);
  }

  if (offerArrowL && offerArrowR && offerItems) {
    const scrollAmt = 240;
    offerArrowL.addEventListener('click', () => {
      offerItems.scrollBy({ left: -scrollAmt, behavior: 'smooth' });
    });
    offerArrowR.addEventListener('click', () => {
      offerItems.scrollBy({ left: scrollAmt, behavior: 'smooth' });
    });
    window.addEventListener('resize', updateOfferArrows);
  }

  /* ═══════════════════════════════════════════
     BALANCE PAGE LOGIC
     ═══════════════════════════════════════════ */

  const cashoutBtn = document.getElementById('cashoutBtn');
  const cashoutForm = document.getElementById('cashoutForm');
  const closeCashout = document.getElementById('closeCashout');
  const cashoutMax = document.getElementById('cashoutMax');
  const cashoutAmount = document.getElementById('cashoutAmount');

  if (cashoutBtn) {
    cashoutBtn.addEventListener('click', () => {
      if (cashoutForm) cashoutForm.style.display = '';
      cashoutBtn.closest('.balance-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
  if (closeCashout) {
    closeCashout.addEventListener('click', () => {
      if (cashoutForm) cashoutForm.style.display = 'none';
    });
  }
  if (cashoutMax && cashoutAmount) {
    cashoutMax.addEventListener('click', () => {
      cashoutAmount.value = cashoutAmount.max;
      cashoutAmount.dispatchEvent(new Event('input'));
    });
  }

  /* Balance page: legacy selectors removed — logic is in balance.html inline script */

  /* ═══════════════════════════════════════════
     ADMIN PANEL LOGIC
     ═══════════════════════════════════════════ */

  document.querySelectorAll('.admin-nav__item').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      document.querySelectorAll('.admin-nav__item').forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      const section = link.dataset.section;
      document.querySelectorAll('.admin-section').forEach(sec => {
        sec.style.display = sec.id === `sec-${section}` ? '' : 'none';
      });

      if (adminSidebar?.classList.contains('open')) {
        adminSidebar.classList.remove('open');
      }
    });
  });

  /* ═══════════════════════════════════════════
     REFERRAL PAGE LOGIC
     ═══════════════════════════════════════════ */

  const saveRefCode = document.getElementById('saveRefCode');
  const refCodeInput = document.getElementById('refCode');
  const refLink = document.getElementById('refLink');
  if (saveRefCode && refCodeInput && refLink) {
    saveRefCode.addEventListener('click', () => {
      const code = refCodeInput.value.trim();
      if (!code) { toast('Please enter a referral code', 'error'); return; }
      refLink.value = 'https://skinsell.com/ref/' + code;
      saveRefCode.classList.add('ref-code__btn--done');
      setTimeout(() => saveRefCode.classList.remove('ref-code__btn--done'), 2000);
    });
    refCodeInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') saveRefCode.click();
    });
  }

  var claimBtn = document.getElementById('claimBtn');
  if (claimBtn) claimBtn.addEventListener('click', function() {
    toast('Earnings claimed to balance!', 'success');
  });

  var refSearch = document.getElementById('refUserSearch');
  if (refSearch) refSearch.addEventListener('input', function() {
    var q = this.value.toLowerCase().trim();
    document.querySelectorAll('.ref-table tbody tr').forEach(function(row) {
      var match = !q || row.textContent.toLowerCase().includes(q);
      row.style.display = match ? '' : 'none';
    });
  });

  var refPerPage = document.getElementById('refPerPage');
  if (refPerPage) refPerPage.addEventListener('change', function() {
    toast('Showing ' + this.value + ' items per page', 'info');
  });

  const copyRefLink = document.getElementById('copyRefLink');
  if (copyRefLink && refLink) {
    copyRefLink.addEventListener('click', () => {
      navigator.clipboard.writeText(refLink.value).then(() => {
        copyRefLink.classList.add('ref-code__btn--done');
        setTimeout(() => copyRefLink.classList.remove('ref-code__btn--done'), 2000);
      }).catch(() => {
        refLink.select();
        document.execCommand('copy');
        copyRefLink.classList.add('ref-code__btn--done');
        setTimeout(() => copyRefLink.classList.remove('ref-code__btn--done'), 2000);
      });
    });
  }

  /* ── Avatar dropdown menu ── */
  const avatarToggle = document.getElementById('avatarToggle');
  const avatarMenu = document.getElementById('avatarMenu');
  const avatarBackdrop = document.getElementById('avatarBackdrop');
  if (avatarToggle && avatarMenu && avatarBackdrop) {
    function toggleAvatarMenu(open) {
      avatarMenu.classList.toggle('active', open);
      avatarBackdrop.classList.toggle('active', open);
      avatarToggle.classList.toggle('menu-open', open);
    }
    avatarToggle.addEventListener('click', e => {
      e.stopPropagation();
      toggleAvatarMenu(!avatarMenu.classList.contains('active'));
    });
    avatarBackdrop.addEventListener('click', () => toggleAvatarMenu(false));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && avatarMenu.classList.contains('active')) toggleAvatarMenu(false);
    });
  }

  /* ── Order page: retry order ── */
  var retryOrderBtn = document.getElementById('retryOrder');
  if (retryOrderBtn) {
    retryOrderBtn.addEventListener('click', function(e) {
      e.preventDefault();
      window.location.href = 'sell.html';
    });
  }

  /* ── Order page: copy ID with checkmark feedback ── */
  const copyBtn = document.getElementById('copyOrderId');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      var orderIdEl = document.querySelector('.odr-head__id') || document.querySelector('.odr-field__val');
      var orderId = orderIdEl ? orderIdEl.textContent.trim().replace('#', '') : 'SW-0000';
      navigator.clipboard.writeText(orderId).then(() => {
        copyBtn.classList.add('odr-copy--done');
        setTimeout(() => copyBtn.classList.remove('odr-copy--done'), 2000);
      }).catch(() => { toast('Failed to copy', 'error'); });
    });
  }

  /* ── Order page: modal copy buttons with checkmark ── */
  document.querySelectorAll('.odr-modal__copy[data-copy]').forEach(btn => {
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(btn.dataset.copy).then(() => {
        btn.classList.add('odr-modal__copy--done');
        setTimeout(() => btn.classList.remove('odr-modal__copy--done'), 2000);
      }).catch(() => {
        toast('Failed to copy', 'error');
      });
    });
  });

  /* ── Order page: payer details modal ── */
  const payerModal = document.getElementById('payerModal');
  const openPayerBtn = document.getElementById('openPayerModal');
  const closePayerBtn = document.getElementById('closePayerModal');
  if (payerModal && openPayerBtn) {
    function lockPayerModalScroll() { document.body.style.overflow = 'hidden'; }
    function unlockPayerModalScroll() { document.body.style.overflow = ''; }
    function closePayerModal() {
      payerModal.classList.remove('active');
      unlockPayerModalScroll();
    }
    openPayerBtn.addEventListener('click', () => {
      payerModal.classList.add('active');
      lockPayerModalScroll();
    });
    closePayerBtn?.addEventListener('click', closePayerModal);
    payerModal.addEventListener('click', e => {
      if (e.target === payerModal) closePayerModal();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && payerModal.classList.contains('active')) {
        closePayerModal();
      }
    });
  }

  /* ── Keyboard: "/" to focus search ── */
  document.addEventListener('keydown', e => {
    if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
      e.preventDefault();
      const si = document.getElementById('inventorySearch') || document.getElementById('faqSearch');
      si?.focus();
    }
  });

  /* ═══════════════════════════════════════════
     CHECKOUT MODAL
     ═══════════════════════════════════════════ */
  const ckoutOverlay = document.getElementById('checkoutModal');
  const ckoutClose = document.getElementById('closeCheckout');
  const submitOrder = document.getElementById('submitOrder');
  const ckoutSubmit = document.getElementById('ckoutSubmit');

  var promoApplyBtn = document.getElementById('promoApplyBtn');
  if (promoApplyBtn) promoApplyBtn.addEventListener('click', function() {
    var wrap = this.closest('.promo-input-wrap');
    var input = wrap && wrap.querySelector('input');
    if (!input) return;
    var code = input.value.trim();
    if (!code) { toast('Please enter a promo code', 'error'); return; }
    toast('Promo code "' + code + '" applied!', 'success');
  });

  if (ckoutOverlay && submitOrder) {
    const COUNTRIES = [
      ["AF","Afghanistan","\u{1F1E6}\u{1F1EB}"],["AL","Albania","\u{1F1E6}\u{1F1F1}"],["DZ","Algeria","\u{1F1E9}\u{1F1FF}"],["AD","Andorra","\u{1F1E6}\u{1F1E9}"],
      ["AO","Angola","\u{1F1E6}\u{1F1F4}"],["AR","Argentina","\u{1F1E6}\u{1F1F7}"],["AM","Armenia","\u{1F1E6}\u{1F1F2}"],["AU","Australia","\u{1F1E6}\u{1F1FA}"],
      ["AT","Austria","\u{1F1E6}\u{1F1F9}"],["AZ","Azerbaijan","\u{1F1E6}\u{1F1FF}"],["BS","Bahamas","\u{1F1E7}\u{1F1F8}"],["BH","Bahrain","\u{1F1E7}\u{1F1ED}"],
      ["BD","Bangladesh","\u{1F1E7}\u{1F1E9}"],["BY","Belarus","\u{1F1E7}\u{1F1FE}"],["BE","Belgium","\u{1F1E7}\u{1F1EA}"],["BZ","Belize","\u{1F1E7}\u{1F1FF}"],
      ["BJ","Benin","\u{1F1E7}\u{1F1EF}"],["BO","Bolivia","\u{1F1E7}\u{1F1F4}"],["BA","Bosnia","\u{1F1E7}\u{1F1E6}"],["BR","Brazil","\u{1F1E7}\u{1F1F7}"],
      ["BN","Brunei","\u{1F1E7}\u{1F1F3}"],["BG","Bulgaria","\u{1F1E7}\u{1F1EC}"],["KH","Cambodia","\u{1F1F0}\u{1F1ED}"],["CM","Cameroon","\u{1F1E8}\u{1F1F2}"],
      ["CA","Canada","\u{1F1E8}\u{1F1E6}"],["CL","Chile","\u{1F1E8}\u{1F1F1}"],["CN","China","\u{1F1E8}\u{1F1F3}"],["CO","Colombia","\u{1F1E8}\u{1F1F4}"],
      ["CR","Costa Rica","\u{1F1E8}\u{1F1F7}"],["HR","Croatia","\u{1F1ED}\u{1F1F7}"],["CU","Cuba","\u{1F1E8}\u{1F1FA}"],["CY","Cyprus","\u{1F1E8}\u{1F1FE}"],
      ["CZ","Czech Republic","\u{1F1E8}\u{1F1FF}"],["DK","Denmark","\u{1F1E9}\u{1F1F0}"],["DO","Dominican Republic","\u{1F1E9}\u{1F1F4}"],
      ["EC","Ecuador","\u{1F1EA}\u{1F1E8}"],["EG","Egypt","\u{1F1EA}\u{1F1EC}"],["SV","El Salvador","\u{1F1F8}\u{1F1FB}"],["EE","Estonia","\u{1F1EA}\u{1F1EA}"],
      ["ET","Ethiopia","\u{1F1EA}\u{1F1F9}"],["FI","Finland","\u{1F1EB}\u{1F1EE}"],["FR","France","\u{1F1EB}\u{1F1F7}"],["GE","Georgia","\u{1F1EC}\u{1F1EA}"],
      ["DE","Germany","\u{1F1E9}\u{1F1EA}"],["GH","Ghana","\u{1F1EC}\u{1F1ED}"],["GR","Greece","\u{1F1EC}\u{1F1F7}"],["GT","Guatemala","\u{1F1EC}\u{1F1F9}"],
      ["HN","Honduras","\u{1F1ED}\u{1F1F3}"],["HK","Hong Kong","\u{1F1ED}\u{1F1F0}"],["HU","Hungary","\u{1F1ED}\u{1F1FA}"],["IS","Iceland","\u{1F1EE}\u{1F1F8}"],
      ["IN","India","\u{1F1EE}\u{1F1F3}"],["ID","Indonesia","\u{1F1EE}\u{1F1E9}"],["IR","Iran","\u{1F1EE}\u{1F1F7}"],["IQ","Iraq","\u{1F1EE}\u{1F1F6}"],
      ["IE","Ireland","\u{1F1EE}\u{1F1EA}"],["IL","Israel","\u{1F1EE}\u{1F1F1}"],["IT","Italy","\u{1F1EE}\u{1F1F9}"],["JM","Jamaica","\u{1F1EF}\u{1F1F2}"],
      ["JP","Japan","\u{1F1EF}\u{1F1F5}"],["JO","Jordan","\u{1F1EF}\u{1F1F4}"],["KZ","Kazakhstan","\u{1F1F0}\u{1F1FF}"],["KE","Kenya","\u{1F1F0}\u{1F1EA}"],
      ["KW","Kuwait","\u{1F1F0}\u{1F1FC}"],["KG","Kyrgyzstan","\u{1F1F0}\u{1F1EC}"],["LV","Latvia","\u{1F1F1}\u{1F1FB}"],["LB","Lebanon","\u{1F1F1}\u{1F1E7}"],
      ["LT","Lithuania","\u{1F1F1}\u{1F1F9}"],["LU","Luxembourg","\u{1F1F1}\u{1F1FA}"],["MY","Malaysia","\u{1F1F2}\u{1F1FE}"],["MX","Mexico","\u{1F1F2}\u{1F1FD}"],
      ["MD","Moldova","\u{1F1F2}\u{1F1E9}"],["MC","Monaco","\u{1F1F2}\u{1F1E8}"],["MN","Mongolia","\u{1F1F2}\u{1F1F3}"],["ME","Montenegro","\u{1F1F2}\u{1F1EA}"],
      ["MA","Morocco","\u{1F1F2}\u{1F1E6}"],["MZ","Mozambique","\u{1F1F2}\u{1F1FF}"],["MM","Myanmar","\u{1F1F2}\u{1F1F2}"],["NP","Nepal","\u{1F1F3}\u{1F1F5}"],
      ["NL","Netherlands","\u{1F1F3}\u{1F1F1}"],["NZ","New Zealand","\u{1F1F3}\u{1F1FF}"],["NI","Nicaragua","\u{1F1F3}\u{1F1EE}"],
      ["NG","Nigeria","\u{1F1F3}\u{1F1EC}"],["MK","North Macedonia","\u{1F1F2}\u{1F1F0}"],["NO","Norway","\u{1F1F3}\u{1F1F4}"],["OM","Oman","\u{1F1F4}\u{1F1F2}"],
      ["PK","Pakistan","\u{1F1F5}\u{1F1F0}"],["PA","Panama","\u{1F1F5}\u{1F1E6}"],["PY","Paraguay","\u{1F1F5}\u{1F1FE}"],["PE","Peru","\u{1F1F5}\u{1F1EA}"],
      ["PH","Philippines","\u{1F1F5}\u{1F1ED}"],["PL","Poland","\u{1F1F5}\u{1F1F1}"],["PT","Portugal","\u{1F1F5}\u{1F1F9}"],["QA","Qatar","\u{1F1F6}\u{1F1E6}"],
      ["RO","Romania","\u{1F1F7}\u{1F1F4}"],["RU","Russia","\u{1F1F7}\u{1F1FA}"],["SA","Saudi Arabia","\u{1F1F8}\u{1F1E6}"],["RS","Serbia","\u{1F1F7}\u{1F1F8}"],
      ["SG","Singapore","\u{1F1F8}\u{1F1EC}"],["SK","Slovakia","\u{1F1F8}\u{1F1F0}"],["SI","Slovenia","\u{1F1F8}\u{1F1EE}"],["ZA","South Africa","\u{1F1FF}\u{1F1E6}"],
      ["KR","South Korea","\u{1F1F0}\u{1F1F7}"],["ES","Spain","\u{1F1EA}\u{1F1F8}"],["LK","Sri Lanka","\u{1F1F1}\u{1F1F0}"],["SE","Sweden","\u{1F1F8}\u{1F1EA}"],
      ["CH","Switzerland","\u{1F1E8}\u{1F1ED}"],["TW","Taiwan","\u{1F1F9}\u{1F1FC}"],["TJ","Tajikistan","\u{1F1F9}\u{1F1EF}"],["TH","Thailand","\u{1F1F9}\u{1F1ED}"],
      ["TN","Tunisia","\u{1F1F9}\u{1F1F3}"],["TR","Turkey","\u{1F1F9}\u{1F1F7}"],["TM","Turkmenistan","\u{1F1F9}\u{1F1F2}"],["UA","Ukraine","\u{1F1FA}\u{1F1E6}"],
      ["AE","United Arab Emirates","\u{1F1E6}\u{1F1EA}"],["GB","United Kingdom","\u{1F1EC}\u{1F1E7}"],["US","United States","\u{1F1FA}\u{1F1F8}"],
      ["UY","Uruguay","\u{1F1FA}\u{1F1FE}"],["UZ","Uzbekistan","\u{1F1FA}\u{1F1FF}"],["VE","Venezuela","\u{1F1FB}\u{1F1EA}"],["VN","Vietnam","\u{1F1FB}\u{1F1F3}"]
    ];

    const methodLabels = { balance: 'via Balance', card: 'via Debit Card', crypto: 'via Crypto', bank: 'via Bank Transfer' };
    const panelIds = { balance: 'ckoutBalance', card: 'ckoutCard', crypto: 'ckoutCrypto', bank: 'ckoutBank' };
    const cryptoNames = { btc: 'Bitcoin', usdt: 'Tether (USDT)', eth: 'Ethereum', ltc: 'Litecoin', sol: 'Solana', trx: 'TRON' };
    const cryptoPlaceholders = { btc: 'bc1q...', usdt: 'T... (TRC-20)', eth: '0x...', ltc: 'ltc1q...', sol: '...', trx: 'T...' };

    function initCountryPickers() {
      ckoutOverlay.querySelectorAll('.cpick').forEach(function(picker) {
        if (picker.dataset.init) return;
        picker.dataset.init = '1';
        var list = picker.querySelector('.cpick__list');
        var trigger = picker.querySelector('.cpick__trigger');
        var searchInput = picker.querySelector('.cpick__search');
        var hiddenInput = picker.querySelector('.cpick__value');
        var flagEl = picker.querySelector('.cpick__flag');
        var textEl = picker.querySelector('.cpick__text');

        COUNTRIES.forEach(function(c) {
          var opt = document.createElement('div');
          opt.className = 'cpick__opt';
          opt.dataset.code = c[0];
          opt.dataset.name = c[1];
          opt.innerHTML = '<img src="https://flagcdn.com/w40/' + c[0].toLowerCase() + '.png" alt="' + c[0] + '"> ' + c[1];
          opt.addEventListener('click', function() {
            hiddenInput.value = c[0];
            flagEl.innerHTML = '<img src="https://flagcdn.com/w40/' + c[0].toLowerCase() + '.png" alt="' + c[0] + '">';
            textEl.textContent = c[1];
            textEl.classList.add('cpick__text--selected');
            list.querySelectorAll('.cpick__opt').forEach(function(o) { o.classList.remove('active'); });
            opt.classList.add('active');
            picker.classList.remove('open');
            var field = picker.closest('.ckout__field');
            if (field && field.classList.contains('has-error')) {
              field.classList.remove('has-error');
              var err = field.querySelector('.ckout__error');
              if (err) err.textContent = '';
            }
            validateForm();
          });
          list.appendChild(opt);
        });

        trigger.addEventListener('click', function(e) {
          e.stopPropagation();
          var wasOpen = picker.classList.contains('open');
          ckoutOverlay.querySelectorAll('.cpick.open').forEach(function(p) { p.classList.remove('open'); });
          if (!wasOpen) {
            picker.classList.add('open');
            searchInput.value = '';
            filterCountryList(list, '');
            setTimeout(function() { searchInput.focus(); }, 50);
          }
        });

        searchInput.addEventListener('input', function() {
          filterCountryList(list, searchInput.value);
        });
        searchInput.addEventListener('click', function(e) { e.stopPropagation(); });
      });
    }

    var countryPickerDocListenerAdded = false;
    if (!countryPickerDocListenerAdded) {
      countryPickerDocListenerAdded = true;
      document.addEventListener('click', function() {
        if (ckoutOverlay) ckoutOverlay.querySelectorAll('.cpick.open').forEach(function(p) { p.classList.remove('open'); });
      });
    }

    function filterCountryList(list, query) {
      var q = query.toLowerCase();
      var found = 0;
      list.querySelectorAll('.cpick__opt:not(.cpick__opt--empty)').forEach(function(opt) {
        var match = opt.dataset.name.toLowerCase().indexOf(q) !== -1;
        opt.style.display = match ? '' : 'none';
        if (match) found++;
      });
      var emptyEl = list.querySelector('.cpick__opt--empty');
      if (!found) {
        if (!emptyEl) {
          emptyEl = document.createElement('div');
          emptyEl.className = 'cpick__opt cpick__opt--empty';
          emptyEl.textContent = 'No countries found';
          list.appendChild(emptyEl);
        }
        emptyEl.style.display = '';
      } else if (emptyEl) {
        emptyEl.style.display = 'none';
      }
    }

    function getActiveMethod() {
      var active = document.querySelector('.pay-btn.active');
      return active ? active.dataset.method : 'balance';
    }

    function showMethodFields(method) {
      Object.values(panelIds).forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.style.display = 'none';
      });
      var target = document.getElementById(panelIds[method]);
      if (target) target.style.display = 'flex';
      var label = document.getElementById('ckoutMethodLabel');
      if (label) label.textContent = methodLabels[method] || '';
      clearAllErrors();
      validateForm();
    }

    function openCheckout() {
      var totalEl = document.getElementById('summaryTotal');
      var amountEl = document.getElementById('ckoutAmount');
      if (totalEl && amountEl) {
        var val = totalEl.textContent.replace('$', '').trim();
        amountEl.innerHTML = val + '<small>$</small>';
      }
      initCountryPickers();
      showMethodFields(getActiveMethod());
      ckoutOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeCheckoutModal() {
      ckoutOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }

    submitOrder.addEventListener('click', function(e) {
      e.preventDefault();
      openCheckout();
    });
    if (ckoutClose) ckoutClose.addEventListener('click', closeCheckoutModal);
    ckoutOverlay.addEventListener('click', function(e) {
      if (e.target === ckoutOverlay) closeCheckoutModal();
    });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && ckoutOverlay.classList.contains('active')) closeCheckoutModal();
    });

    document.querySelectorAll('.pay-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        if (ckoutOverlay.classList.contains('active')) {
          showMethodFields(btn.dataset.method);
        }
      });
    });

    var cryptoGridEl = document.getElementById('cryptoGrid');
    if (cryptoGridEl) {
      cryptoGridEl.addEventListener('click', function(e) {
        var btn = e.target.closest('.ckout__crypto-btn');
        if (!btn) return;
        cryptoGridEl.querySelectorAll('.ckout__crypto-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var c = btn.dataset.crypto;
        var walletLabel = document.getElementById('cryptoWalletLabel');
        var walletInput = document.getElementById('cryptoWalletInput');
        if (walletLabel) walletLabel.textContent = cryptoNames[c] || c;
        if (walletInput) { walletInput.placeholder = cryptoPlaceholders[c] || 'Enter wallet address'; walletInput.value = ''; }
        clearAllErrors();
        validateForm();
      });
    }

    function validateField(field) {
      var input = field.querySelector('.ckout__input');
      if (!input || !field.hasAttribute('data-required')) return true;
      var val = input.value.trim();
      var type = input.dataset.validate;
      var errEl = field.querySelector('.ckout__error');
      var err = '';
      if (!val) { err = 'This field is required'; }
      else if (type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) { err = 'Enter a valid email address'; }
      else if (type === 'name' && val.length < 2) { err = 'Enter at least 2 characters'; }
      else if (type === 'card' && val.replace(/\s/g,'').length < 13) { err = 'Enter a valid card number'; }
      else if (type === 'wallet' && val.length < 10) { err = 'Enter a valid wallet address'; }
      else if (type === 'iban' && val.length < 10) { err = 'Enter a valid IBAN'; }
      else if (type === 'swift' && val.length < 4) { err = 'Enter a valid SWIFT/BIC code'; }

      if (err && errEl) { field.classList.add('has-error'); errEl.textContent = err; return false; }
      field.classList.remove('has-error');
      if (errEl) errEl.textContent = '';
      return true;
    }

    function clearAllErrors() {
      ckoutOverlay.querySelectorAll('.ckout__field').forEach(function(f) {
        f.classList.remove('has-error');
        var e = f.querySelector('.ckout__error');
        if (e) e.textContent = '';
      });
    }

    function validateForm() {
      var method = getActiveMethod();
      var panel = document.getElementById(panelIds[method]);
      if (!panel) return;
      var fields = panel.querySelectorAll('.ckout__field[data-required]');
      var allValid = true;
      fields.forEach(function(f) {
        var input = f.querySelector('.ckout__input');
        if (!input || !input.value.trim()) allValid = false;
      });
      if (ckoutSubmit) ckoutSubmit.disabled = !allValid;
    }

    ckoutOverlay.addEventListener('input', function(e) {
      var field = e.target.closest('.ckout__field');
      if (field && field.classList.contains('has-error')) validateField(field);
      validateForm();
    });
    ckoutOverlay.addEventListener('change', function(e) {
      var field = e.target.closest('.ckout__field');
      if (field && field.classList.contains('has-error')) validateField(field);
      validateForm();
    });
    ckoutOverlay.addEventListener('focusout', function(e) {
      var field = e.target.closest('.ckout__field');
      if (field && field.hasAttribute('data-required') && e.target.value !== undefined) {
        if (e.target.value.trim()) validateField(field);
      }
    });

    if (ckoutSubmit) {
      ckoutSubmit.addEventListener('click', function(e) {
        e.preventDefault();
        var method = getActiveMethod();
        var panel = document.getElementById(panelIds[method]);
        if (!panel) return;
        var fields = panel.querySelectorAll('.ckout__field[data-required]');
        var allValid = true;
        fields.forEach(function(f) { if (!validateField(f)) allValid = false; });
        if (!allValid) { ckoutSubmit.disabled = true; return; }
        closeCheckoutModal();
        toast('Order created! Redirecting to order page...', 'success');
        setTimeout(function() { window.location.href = 'order.html'; }, 1500);
      });
    }
  }

  /* ── Scroll to top button ── */
  (function initScrollTop() {
    var btn = document.createElement('button');
    btn.className = 'scroll-top';
    btn.setAttribute('aria-label', 'Scroll to top');
    btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg>';
    document.body.appendChild(btn);
    window.addEventListener('scroll', function() {
      btn.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });
    btn.addEventListener('click', function() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  })();

  if (typeof initI18n === 'function') initI18n();

})();
