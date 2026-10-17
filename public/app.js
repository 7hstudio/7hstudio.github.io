/* ===================================================================
   7H STUDIOS • APPLICATION JAVASCRIPT
   Store Engine, Dynamic Filter, Modal & Mandatory Discord Gatekeeper
   =================================================================== */

function initApp() {
  // Global State
  let currentCategory = 'all';
  let searchQuery = '';
  let currentSort = 'featured';
  let activeProduct = null;
  let verifiedMember = null;
  let currentPartnerCategory = 'all';

  // Strictly Authorized Executive Discord IDs
  const ADMIN_IDS = ['1335753623367319635', '1197968394222325760'];

  function isCurrentUserAdmin() {
    if (!verifiedMember) return false;
    return ADMIN_IDS.includes(String(verifiedMember.id)) || verifiedMember.isAdmin === true;
  }

  // DOM Elements
  const productsGrid = document.getElementById('products-grid');
  const emptyState = document.getElementById('empty-state');
  const filterTabs = document.querySelectorAll('.filter-tab');
  const storeSearchInput = document.getElementById('store-search-input');
  const headerSearchInput = document.getElementById('header-search-input');
  const storeSortSelect = document.getElementById('store-sort-select');
  const mobileToggleBtn = document.getElementById('mobile-toggle-btn');
  const navMenu = document.getElementById('nav-menu');
  const toastContainer = document.getElementById('toast-container');
  const navAuthContainer = document.getElementById('nav-auth-container');
  const partnersGrid = document.getElementById('partners-grid');

  // Mandatory Gatekeeper Elements
  const mandatoryGate = document.getElementById('mandatory-gate');
  const gateUserInput = document.getElementById('gate-user-input');
  const btnGateVerify = document.getElementById('btn-gate-verify');
  const gateResultBox = document.getElementById('gate-result-box');

  // Product Modal Elements
  const modalBackdrop = document.getElementById('product-modal-backdrop');
  const modalMainImg = document.getElementById('modal-main-img');
  const modalPriceBadge = document.getElementById('modal-price-badge');
  const modalCategory = document.getElementById('modal-category');
  const modalTitle = document.getElementById('modal-title');
  const modalTags = document.getElementById('modal-tags');
  const modalDesc = document.getElementById('modal-desc');
  const modalOrderBtn = document.getElementById('modal-order-btn');
  const modalDiscountInfo = document.getElementById('modal-discount-info');

  // Initialize
  checkInitialGateStatus();
  fetchLiveServerStats();
  initCategoryCounts();
  initPartnerCounts();
  renderProducts();
  renderPartners();
  setupEventListeners();

  // Check if User is already verified or returning from OAuth2
  function checkInitialGateStatus() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const authStatus = urlParams.get('auth');
      const hash = window.location.hash || '';

      // Direct Token from Hash (if user landed directly with hash)
      if (hash.includes('access_token')) {
        const hashParams = new URLSearchParams(hash.substring(1));
        const token = hashParams.get('access_token');
        if (token) {
          localStorage.setItem('7h_auth_token', token);
        }
      }

      // 1. Returned from Discord OAuth Authorization (Instant Access Guaranteed)
      if (authStatus === 'success' || authStatus === 'authorized' || authStatus === 'not_in_server' || hash.includes('access_token')) {
        const userJson = urlParams.get('user');
        if (userJson) {
          try { verifiedMember = JSON.parse(decodeURIComponent(userJson)); } catch (e) {}
        }
        if (!verifiedMember) {
          const stored = localStorage.getItem('7h_verified_member');
          if (stored) {
            try { verifiedMember = JSON.parse(stored); } catch (e) {}
          }
        }
        if (!verifiedMember) {
          const username = urlParams.get('username') || 'Discord Member';
          verifiedMember = {
            username: username,
            displayName: username,
            avatar: 'assets/images/logo.png',
            inServer: true
          };
        }

        localStorage.setItem('7h_verified_member', JSON.stringify(verifiedMember));
        unlockGateImmediate();
        updateNavbarUserProfile();
        renderProducts();
        showToast(`🎉 Welcome ${verifiedMember.displayName || verifiedMember.username}! Discord Connected.`);
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      // 2. Check localStorage for existing session
      const stored = localStorage.getItem('7h_verified_member');
      if (stored) {
        try {
          verifiedMember = JSON.parse(stored);
          unlockGateImmediate();
          updateNavbarUserProfile();
        } catch(e) {
          lockGateImmediate();
        }
      } else {
        lockGateImmediate();
      }
    } catch (e) {
      console.warn('Gate status check error:', e);
      lockGateImmediate();
    }
  }

  function lockGateImmediate() {
    document.body.classList.add('gate-locked');
    if (mandatoryGate) {
      mandatoryGate.classList.remove('unlocked');
      mandatoryGate.style.display = 'flex';
      mandatoryGate.style.pointerEvents = 'auto';
    }
  }

  function unlockGateImmediate() {
    document.body.classList.remove('gate-locked');
    if (mandatoryGate) {
      mandatoryGate.classList.add('unlocked');
      mandatoryGate.style.display = 'none';
      mandatoryGate.style.pointerEvents = 'none';
    }
    const gateCard = document.getElementById('gate-card');
    if (gateCard) gateCard.style.display = 'none';
  }

  // Allow direct 1-click entering as guest / visitor
  window.enterDirectly = function() {
    verifiedMember = {
      username: '7H Guest',
      displayName: '7H Member',
      avatar: 'assets/images/logo.png',
      inServer: true
    };
    localStorage.setItem('7h_verified_member', JSON.stringify(verifiedMember));
    unlockGateImmediate();
    updateNavbarUserProfile();
    renderProducts();
    showToast('🎉 Welcome to 7H STUDIOS Platform!');
  };

  // Fetch real-time Discord stats from our backend API
  async function fetchLiveServerStats() {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      if (data && data.success) {
        const total = data.totalMembers || 708;
        const online = data.onlineMembers || 77;

        const statTotal = document.getElementById('stat-total-members');
        const statOnline = document.getElementById('stat-online-members');
        const discordCounter = document.getElementById('discord-member-counter');
        const footerCount = document.getElementById('footer-member-count');

        if (statTotal) statTotal.textContent = total;
        if (statOnline) statOnline.textContent = `${online}+`;
        if (discordCounter) discordCounter.textContent = total;
        if (footerCount) footerCount.textContent = total;
      }
    } catch (err) {
      console.warn('Stats fetch fallback to defaults:', err);
    }
  }

  // Calculate & Display Category Counts
  function initCategoryCounts() {
    if (typeof PRODUCTS === 'undefined') return;

    const counts = {
      all: PRODUCTS.length,
      Scripts: 0,
      Maps: 0,
      Guns: 0,
      Free: 0
    };

    PRODUCTS.forEach(p => {
      if (counts[p.category] !== undefined) {
        counts[p.category]++;
      }
    });

    document.getElementById('count-all').textContent = counts.all;
    document.getElementById('count-scripts').textContent = counts.Scripts;
    document.getElementById('count-maps').textContent = counts.Maps;
    document.getElementById('count-guns').textContent = counts.Guns;
    document.getElementById('count-free').textContent = counts.Free;
  }

  // Filter & Sort Logic
  function getFilteredProducts() {
    if (typeof PRODUCTS === 'undefined') return [];

    let list = [...PRODUCTS];

    if (currentCategory !== 'all') {
      list = list.filter(p => p.category === currentCategory);
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    if (currentSort === 'price-asc') {
      list.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
    } else if (currentSort === 'price-desc') {
      list.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
    } else if (currentSort === 'name-asc') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }

    return list;
  }

  function parsePrice(priceStr) {
    if (priceStr === 'FREE') return 0;
    const match = priceStr.match(/([0-9.,]+)/);
    return match ? parseFloat(match[1]) : 999;
  }

  function calculateMemberPrice(priceStr) {
    if (priceStr === 'FREE') return 'FREE';
    const match = priceStr.match(/([0-9.,]+)/);
    if (!match) return priceStr;
    const val = parseFloat(match[1]);
    const discounted = (val * 0.9).toFixed(2);
    return `$${discounted}`;
  }

  // Render Product Cards
  function renderProducts() {
    const items = getFilteredProducts();

    if (items.length === 0) {
      productsGrid.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';

    productsGrid.innerHTML = items.map(product => {
      const isFree = product.isFree;
      const isVerified = !!verifiedMember;
      
      let priceDisplay = product.price;
      let priceClass = isFree ? 'product-price-badge is-free' : 'product-price-badge';

      if (isVerified && !isFree && product.price.includes('$')) {
        const discounted = calculateMemberPrice(product.price);
        priceClass += ' has-discount';
        priceDisplay = `<span class="price-strikethrough">${product.price}</span> ${discounted}`;
      }

      const imgSrc = product.thumbnail || product.fallbackImage;
      const fallbackSrc = product.fallbackImage || 'assets/images/scripts.jpg';

      return `
        <article class="product-card" id="card-${product.id}">
          <div class="product-thumb-wrapper">
            <img src="${imgSrc}" 
                 alt="${escapeHtml(product.name)}" 
                 class="product-thumb" 
                 loading="lazy"
                 onerror="this.onerror=null; this.src='${fallbackSrc}';">
            <span class="product-cat-badge">${product.category}</span>
            <span class="${priceClass}">${priceDisplay}</span>
          </div>
          
          <div class="product-body">
            <h3 class="product-title">${escapeHtml(product.name)}</h3>
            <p class="product-desc">${escapeHtml(product.description)}</p>
            
            <div class="product-tags">
              ${isVerified ? '<span class="tag-item" style="color:#6ee7b7; border-color:rgba(16,185,129,0.3)">10% Member Perk</span>' : ''}
              ${product.tags.map(t => `<span class="tag-item">${escapeHtml(t)}</span>`).join('')}
            </div>

            <div class="product-footer">
              <button class="btn btn-glass btn-card-action" onclick="openProductModal('${product.id}')">
                Quick View
              </button>
              <button class="btn ${isFree ? 'btn-emerald' : 'btn-primary'} btn-card-action" onclick="orderProduct('${product.id}')">
                ${isFree ? (isVerified ? 'Download Asset' : 'Unlock Free') : (isVerified ? 'Order (10% Off)' : 'Order Asset')}
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  // Update Navbar with Verified Profile
  function updateNavbarUserProfile() {
    const btnAdminNav = document.getElementById('btn-admin-nav');
    const isAdmin = isCurrentUserAdmin();

    // STRICT PERMISSION: Admin panel button is ONLY displayed if verified user is an authorized admin
    if (btnAdminNav) {
      btnAdminNav.style.display = isAdmin ? 'inline-flex' : 'none';
    }

    if (!navAuthContainer) return;

    if (verifiedMember) {
      const badgeHtml = isAdmin 
        ? `<span class="user-nav-badge admin-badge">👑 OWNER / ADMIN</span>`
        : `<span class="user-nav-badge">VERIFIED 7H MEMBER</span>`;

      navAuthContainer.innerHTML = `
        <div class="nav-user-profile" onclick="openGateManual()" title="Manage 7H Member Status">
          <img src="${verifiedMember.avatar}" alt="${escapeHtml(verifiedMember.username)}" class="user-avatar-small" onerror="this.src='assets/images/logo.png'">
          <div class="user-nav-details">
            <span class="user-nav-name">${escapeHtml(verifiedMember.displayName || verifiedMember.username)}</span>
            ${badgeHtml}
          </div>
        </div>
      `;
    } else {
      if (btnAdminNav) btnAdminNav.style.display = 'none';
      navAuthContainer.innerHTML = `
        <button class="btn btn-discord" id="btn-login-discord" onclick="openGateManual()">
          <svg class="discord-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
          <span class="discord-btn-text">Verify Discord</span>
          <span class="online-indicator" title="Server Active"></span>
        </button>
      `;
    }
  }


  // Event Listeners Setup
  function setupEventListeners() {
    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentCategory = tab.dataset.category;
        renderProducts();
      });
    });

    if (storeSearchInput) {
      storeSearchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        if (headerSearchInput) headerSearchInput.value = searchQuery;
        renderProducts();
      });
    }

    if (headerSearchInput) {
      headerSearchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        if (storeSearchInput) storeSearchInput.value = searchQuery;
        if (window.location.hash !== '#store') {
          window.location.hash = '#store';
        }
        renderProducts();
      });
    }

    if (storeSortSelect) {
      storeSortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        renderProducts();
      });
    }

    if (mobileToggleBtn && navMenu) {
      mobileToggleBtn.addEventListener('click', () => {
        navMenu.classList.toggle('active');
      });

      navMenu.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
          navMenu.classList.remove('active');
        });
      });
    }

    window.addEventListener('scroll', () => {
      const sections = document.querySelectorAll('section[id]');
      const scrollY = window.pageYOffset;

      sections.forEach(current => {
        const sectionHeight = current.offsetHeight;
        const sectionTop = current.offsetTop - 120;
        const sectionId = current.getAttribute('id');
        const link = document.querySelector(`.nav-link[href*="${sectionId}"]`);

        if (link && scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
          document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
          link.classList.add('active');
        }
      });
    });

    if (modalOrderBtn) {
      modalOrderBtn.addEventListener('click', () => {
        if (activeProduct) {
          orderProduct(activeProduct.id);
        }
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (modalBackdrop && modalBackdrop.classList.contains('active')) closeModalDirect();
        const checkoutBackdrop = document.getElementById('checkout-modal-backdrop');
        if (checkoutBackdrop && checkoutBackdrop.classList.contains('active')) closeCheckoutModalDirect();
      }
      if (e.key === 'Enter') {
        if (document.body.classList.contains('gate-locked') && gateUserInput && gateUserInput === document.activeElement) {
          verifyGateInput();
        }
      }
    });
  }

  // Mandatory Gatekeeper Functions
  window.openGateManual = function() {
    lockGateImmediate();
    if (verifiedMember) {
      showGateSuccessState(verifiedMember);
    } else {
      if (gateResultBox) gateResultBox.style.display = 'none';
      if (gateUserInput) gateUserInput.focus();
    }
  };

  window.quickGateVerify = function(username) {
    if (gateUserInput) {
      gateUserInput.value = username;
      verifyGateInput();
    }
  };

  window.verifyGateInput = async function() {
    if (!gateUserInput) return;
    const query = gateUserInput.value.trim();
    if (!query) {
      showToast('Please enter your Discord username or ID');
      return;
    }

    if (btnGateVerify) {
      btnGateVerify.disabled = true;
      btnGateVerify.innerHTML = `<span>Checking Server...</span>`;
    }

    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });

      const data = await res.json();
      btnGateVerify.disabled = false;
      btnGateVerify.innerHTML = `<span>Verify & Enter</span>`;

      if (data.inServer && data.user) {
        verifiedMember = data.user;
        localStorage.setItem('7h_verified_member', JSON.stringify(verifiedMember));
        updateNavbarUserProfile();
        renderProducts();
        showGateSuccessState(verifiedMember);

        setTimeout(() => {
          unlockGateImmediate();
          showToast(`🎉 Access Granted! Welcome to 7H STUDIOS, ${data.user.username}!`);
        }, 1200);
      } else {
        showGateFailureState(query, data.message);
      }
    } catch (err) {
      btnGateVerify.disabled = false;
      btnGateVerify.innerHTML = `<span>Verify & Enter</span>`;
      showToast('Error connecting to verification server.');
      console.error(err);
    }
  };

  function showGateSuccessState(user) {
    gateResultBox.style.display = 'block';
    gateResultBox.className = 'gate-result-box auth-result-success';
    gateResultBox.innerHTML = `
      <div class="auth-user-card">
        <img src="${user.avatar}" alt="${escapeHtml(user.username)}" class="auth-user-avatar" onerror="this.src='assets/images/logo.png'">
        <div class="auth-user-info">
          <h3>${escapeHtml(user.displayName || user.username)}</h3>
          <span class="auth-verified-badge">✔ ACCESS GRANTED • 7H MEMBER</span>
        </div>
      </div>
      <p style="font-size:0.88rem; color:#d1fae5; margin-bottom:0.8rem;">
        Membership confirmed in <strong>7H STUDIOS</strong> server. Unlocking platform with 10% discount & free resources...
      </p>
      <div style="display:flex; gap:0.6rem;">
        <button class="btn btn-emerald btn-sm" onclick="unlockGateImmediate()">Enter Platform Now &rarr;</button>
        <button class="btn btn-glass btn-sm" onclick="logoutDiscord()">Disconnect</button>
      </div>
    `;
  }

  function showGateFailureState(query, message) {
    gateResultBox.style.display = 'block';
    gateResultBox.className = 'gate-result-box auth-result-failure';
    gateResultBox.innerHTML = `
      <h4 class="auth-failure-title">⛔ ACCESS RESTRICTED</h4>
      <p class="auth-failure-desc">
        ${escapeHtml(message || 'You must join 7H STUDIOS Discord server to access the platform and view assets.')}
      </p>
      <div style="display:flex; gap:0.6rem; flex-wrap:wrap;">
        <a href="https://discord.gg" target="_blank" rel="noopener noreferrer" class="btn btn-discord btn-sm">
          <span>🚀 Join 7H STUDIOS Discord (708 Members)</span>
        </a>
        <a href="/api/auth/discord" class="btn btn-emerald btn-sm">
          <span>⚡ Retry Authorize</span>
        </a>
      </div>
    `;
  }

  window.logoutDiscord = function() {
    verifiedMember = null;
    localStorage.removeItem('7h_verified_member');
    updateNavbarUserProfile();
    renderProducts();
    lockGateImmediate();
    if (gateResultBox) gateResultBox.style.display = 'none';
    if (gateUserInput) gateUserInput.value = '';
    showToast('Logged out. Platform locked.');
  };

  // Official Partners Panel Functions
  function initPartnerCounts() {
    if (typeof PARTNERS_DATA === 'undefined') return;
    const allCount = PARTNERS_DATA.length;
    const devCount = PARTNERS_DATA.filter(p => p.category === 'dev').length;
    const resCount = PARTNERS_DATA.filter(p => p.category === 'resources').length;
    const commCount = PARTNERS_DATA.filter(p => p.category === 'community').length;
    const srvCount = PARTNERS_DATA.filter(p => p.category === 'servers' || p.category === 'store').length;

    const elAll = document.getElementById('partner-count-all');
    const elDev = document.getElementById('partner-count-dev');
    const elRes = document.getElementById('partner-count-resources');
    const elComm = document.getElementById('partner-count-community');
    const elSrv = document.getElementById('partner-count-servers');

    if (elAll) elAll.textContent = allCount;
    if (elDev) elDev.textContent = devCount;
    if (elRes) elRes.textContent = resCount;
    if (elComm) elComm.textContent = commCount;
    if (elSrv) elSrv.textContent = srvCount;
  }

  function renderPartners() {
    if (!partnersGrid) return;
    if (typeof PARTNERS_DATA === 'undefined' || !PARTNERS_DATA.length) {
      partnersGrid.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color:#94a3b8; padding: 2rem;">No partners found.</p>`;
      return;
    }

    let filtered = PARTNERS_DATA;
    if (currentPartnerCategory !== 'all') {
      if (currentPartnerCategory === 'servers') {
        filtered = PARTNERS_DATA.filter(p => p.category === 'servers' || p.category === 'store');
      } else {
        filtered = PARTNERS_DATA.filter(p => p.category === currentPartnerCategory);
      }
    }

    partnersGrid.innerHTML = filtered.map(partner => {
      const tagsHtml = (partner.tags || []).map(t => `<span class="partner-tag">${escapeHtml(t)}</span>`).join('');
      const webBtnHtml = partner.websiteUrl ? `
        <a href="${partner.websiteUrl}" target="_blank" rel="noopener noreferrer" class="partner-btn-web">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
          </svg>
          <span>Website</span>
        </a>
      ` : '';

      return `
        <div class="partner-card">
          <div class="partner-banner-wrapper">
            <img src="${partner.banner || 'assets/images/hero_banner.jpg'}" alt="${escapeHtml(partner.name)}" class="partner-banner-img" onerror="this.src='assets/images/hero_banner.jpg'">
            <div class="partner-banner-overlay"></div>
            <div class="partner-badge-bar">
              <span class="partner-verified-badge"><span class="dot"></span>VERIFIED PARTNER</span>
              <span class="partner-cat-pill">${escapeHtml(partner.categoryLabel || partner.category.toUpperCase())}</span>
            </div>
          </div>

          <div class="partner-card-body">
            <div class="partner-title-row">
              <h3 class="partner-name">${escapeHtml(partner.name)}</h3>
              <span class="partner-vouch-tag">${escapeHtml(partner.vouches || 'Verified')}</span>
            </div>
            
            <p class="partner-tagline">${escapeHtml(partner.tagline || '')}</p>
            <p class="partner-desc">${escapeHtml(partner.description)}</p>

            <div class="partner-tags-row">
              ${tagsHtml}
            </div>

            <div class="partner-card-actions">
              <a href="${partner.discordUrl}" target="_blank" rel="noopener noreferrer" class="partner-btn-discord">
                <svg class="discord-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                <span>Join Discord</span>
              </a>
              ${webBtnHtml}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  window.filterPartnerCategory = function(cat) {
    currentPartnerCategory = cat;
    const tabs = document.querySelectorAll('.partner-filter-tab');
    tabs.forEach(tab => {
      if (tab.dataset.category === cat) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    renderPartners();
  };

  // Global Store Functions
  window.filterCategory = function(cat) {
    currentCategory = cat;
    filterTabs.forEach(tab => {
      if (tab.dataset.category === cat) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    const storeElem = document.getElementById('store');
    if (storeElem) {
      storeElem.scrollIntoView({ behavior: 'smooth' });
    }

    renderProducts();
  };

  window.resetFilters = function() {
    currentCategory = 'all';
    searchQuery = '';
    currentSort = 'featured';

    if (storeSearchInput) storeSearchInput.value = '';
    if (headerSearchInput) headerSearchInput.value = '';
    if (storeSortSelect) storeSortSelect.value = 'featured';

    filterTabs.forEach(tab => {
      if (tab.dataset.category === 'all') tab.classList.add('active');
      else tab.classList.remove('active');
    });

    renderProducts();
  };

  window.openProductModal = function(id) {
    if (typeof PRODUCTS === 'undefined') return;
    const prod = PRODUCTS.find(p => p.id === id);
    if (!prod) return;

    activeProduct = prod;

    modalTitle.textContent = prod.name;
    modalCategory.textContent = prod.category;
    modalDesc.textContent = prod.description;

    const isVerified = !!verifiedMember;
    if (isVerified && !prod.isFree && prod.price.includes('$')) {
      const discounted = calculateMemberPrice(prod.price);
      modalPriceBadge.innerHTML = `<span class="price-strikethrough">${prod.price}</span> ${discounted}`;
      modalPriceBadge.classList.add('has-discount');
      if (modalDiscountInfo) modalDiscountInfo.textContent = `10% Member discount applied for ${verifiedMember.username}!`;
    } else {
      modalPriceBadge.textContent = prod.price;
      modalPriceBadge.classList.remove('has-discount');
      if (modalDiscountInfo) modalDiscountInfo.textContent = `Join 7H STUDIOS Discord to save 10% on this item`;
    }

    const mainImg = prod.thumbnail || prod.fallbackImage;
    modalMainImg.src = mainImg;
    modalMainImg.onerror = () => {
      modalMainImg.src = prod.fallbackImage || 'assets/images/scripts.jpg';
    };

    modalTags.innerHTML = prod.tags.map(t => `<span class="tag-item">${escapeHtml(t)}</span>`).join('');

    if (prod.isFree) {
      modalPriceBadge.classList.add('is-free');
      modalOrderBtn.innerHTML = `<span>Download Free Asset</span> &rarr;`;
      modalOrderBtn.className = 'btn btn-emerald btn-large';
    } else {
      modalPriceBadge.classList.remove('is-free');
      modalOrderBtn.innerHTML = `<span>Order via Discord Ticket</span> &rarr;`;
      modalOrderBtn.className = 'btn btn-primary btn-large';
    }

    modalBackdrop.classList.add('active');
  };

  window.closeModal = function(e) {
    if (e.target === modalBackdrop) {
      closeModalDirect();
    }
  };

  window.closeModalDirect = function() {
    modalBackdrop.classList.remove('active');
  };

  window.openOrderModal = function(serviceName, desc) {
    window.openProductModal({
      id: 'custom_service',
      name: serviceName,
      category: 'Custom Service',
      price: 'Custom Quote',
      isFree: false,
      description: desc,
      tags: ['Custom Work', 'Dedicated Ticket', '7H Studio Team'],
      thumbnail: 'assets/images/hero_banner.jpg',
      fallbackImage: 'assets/images/hero_banner.jpg'
    });
  };

  // ===================================================================
  // 7H STUDIOS SECURE MULTI-PAYMENT CHECKOUT SYSTEM
  // ===================================================================
  let activeCheckoutProduct = null;
  let currentPaymentMethod = 'gpay';

  window.orderProduct = function(id) {
    // If product detail modal is open, close it first
    if (modalBackdrop && modalBackdrop.classList.contains('active')) {
      closeModalDirect();
    }
    openCheckoutModal(id);
  };

  window.openCheckoutModal = function(id) {
    const prod = PRODUCTS.find(p => p.id === id);
    if (!prod) return;
    activeCheckoutProduct = prod;

    const modalBackdrop = document.getElementById('checkout-modal-backdrop');
    if (!modalBackdrop) return;

    // Reset views
    const viewForm = document.getElementById('checkout-view-form');
    const viewSuccess = document.getElementById('checkout-view-success');
    if (viewForm) viewForm.style.display = 'block';
    if (viewSuccess) viewSuccess.style.display = 'none';

    // Populate Product Info
    const elThumb = document.getElementById('checkout-prod-thumb');
    const elCat = document.getElementById('checkout-prod-cat');
    const elName = document.getElementById('checkout-prod-name');
    const elBasePrice = document.getElementById('checkout-base-price');
    const elDiscountRow = document.getElementById('checkout-discount-row');
    const elDiscountVal = document.getElementById('checkout-discount-val');
    const elTotalPrice = document.getElementById('checkout-total-price');
    const elTotalMad = document.getElementById('checkout-total-mad');

    if (elThumb) elThumb.src = prod.thumbnail || 'assets/images/logo.png';
    if (elCat) elCat.textContent = prod.category || 'Script';
    if (elName) elName.textContent = prod.name;

    // Price calculation
    const rawPrice = prod.price || '$0.00';
    const isFree = prod.isFree || rawPrice.toLowerCase().includes('free') || rawPrice === '$0';
    
    let basePriceNum = 0;
    const match = rawPrice.match(/\$?(\d+(\.\d+)?)/);
    if (match) basePriceNum = parseFloat(match[1]);

    if (isFree) {
      if (elBasePrice) elBasePrice.textContent = 'FREE DOWNLOAD';
      if (elDiscountRow) elDiscountRow.style.display = 'none';
      if (elTotalPrice) elTotalPrice.textContent = '$0.00 (Free)';
      if (elTotalMad) elTotalMad.textContent = '(0 MAD)';
    } else {
      if (elBasePrice) elBasePrice.textContent = `$${basePriceNum.toFixed(2)}`;
      
      if (verifiedMember) {
        const discount = basePriceNum * 0.10;
        const finalPrice = basePriceNum - discount;
        const madPrice = Math.round(finalPrice * 10);
        if (elDiscountRow) elDiscountRow.style.display = 'flex';
        if (elDiscountVal) elDiscountVal.textContent = `-10% (-$${discount.toFixed(2)})`;
        if (elTotalPrice) elTotalPrice.textContent = `$${finalPrice.toFixed(2)}`;
        if (elTotalMad) elTotalMad.textContent = `(~${madPrice} MAD)`;
      } else {
        const madPrice = Math.round(basePriceNum * 10);
        if (elDiscountRow) elDiscountRow.style.display = 'none';
        if (elTotalPrice) elTotalPrice.textContent = `$${basePriceNum.toFixed(2)}`;
        if (elTotalMad) elTotalMad.textContent = `(~${madPrice} MAD)`;
      }
    }

    // Populate Customer Details
    const elCustAvatar = document.getElementById('checkout-cust-avatar');
    const elCustName = document.getElementById('checkout-cust-name');
    const elCustBadge = document.getElementById('checkout-cust-badge');
    const elInputRef = document.getElementById('checkout-input-ref');

    if (verifiedMember) {
      if (elCustAvatar) elCustAvatar.src = verifiedMember.avatar || 'assets/images/logo.png';
      if (elCustName) elCustName.textContent = verifiedMember.displayName || verifiedMember.username;
      if (elCustBadge) {
        elCustBadge.textContent = '✔ Verified 7H Member (-10% Applied)';
        elCustBadge.style.color = '#10b981';
      }
      if (elInputRef && !elInputRef.value) {
        elInputRef.value = `@${verifiedMember.username} (ID: ${verifiedMember.id})`;
      }
    } else {
      if (elCustAvatar) elCustAvatar.src = 'assets/images/logo.png';
      if (elCustName) elCustName.textContent = 'Guest Visitor';
      if (elCustBadge) {
        elCustBadge.textContent = '⚡ Guest Checkout (Authorize Discord for 10% OFF)';
        elCustBadge.style.color = '#94a3b8';
      }
    }

    // Default to gpay
    switchPaymentMethod('gpay');

    modalBackdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  window.closeCheckoutModalDirect = function() {
    const modalBackdrop = document.getElementById('checkout-modal-backdrop');
    if (modalBackdrop) modalBackdrop.classList.remove('active');
    document.body.style.overflow = '';
  };

  window.closeCheckoutModal = function(e) {
    if (e.target && e.target.id === 'checkout-modal-backdrop') {
      closeCheckoutModalDirect();
    }
  };

  window.switchPaymentMethod = function(method) {
    currentPaymentMethod = method;
    document.querySelectorAll('.pay-tab').forEach(tab => {
      tab.classList.toggle('active', tab.getAttribute('data-method') === method);
    });
    document.querySelectorAll('.pay-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `pay-panel-${method}`);
    });
  };

  window.copyPaymentData = function(text, successMsg) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(successMsg || 'Copié dans le presse-papiers !');
    }).catch(() => {
      showToast('Copié : ' + text);
    });
  };

  window.submitFinalOrder = async function() {
    if (!activeCheckoutProduct) return;
    const btnSubmit = document.getElementById('btn-submit-order');
    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = `<span>⏳ Enregistrement de la commande...</span>`;
    }

    const inputRef = document.getElementById('checkout-input-ref');
    const reference = inputRef ? inputRef.value.trim() : '';
    const elTotalPrice = document.getElementById('checkout-total-price');
    const finalPrice = elTotalPrice ? elTotalPrice.textContent : activeCheckoutProduct.price;

    const methodLabels = {
      gpay: 'Google Pay / Cards (Ko-fi)',
      cih: 'CIH Bank / CashPlus (Maroc)',
      paypal: 'PayPal',
      crypto: 'Binance Pay / USDT'
    };

    const orderPayload = {
      productId: activeCheckoutProduct.id,
      productName: activeCheckoutProduct.name,
      price: finalPrice,
      customer: verifiedMember ? {
        id: verifiedMember.id,
        username: verifiedMember.username,
        displayName: verifiedMember.displayName
      } : {
        username: reference || 'Guest'
      },
      paymentMethod: methodLabels[currentPaymentMethod] || currentPaymentMethod,
      reference: reference || 'Non précisé'
    };

    let orderId = '7H-ORD-' + Math.floor(1000 + Math.random() * 9000);

    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.orderId) orderId = data.orderId;
      }
    } catch (e) {
      console.warn('Backend order notification note:', e);
    }

    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = `<span>🚀 Confirmer la Commande & Notifier le Staff</span>`;
    }

    // Switch to success view
    const viewForm = document.getElementById('checkout-view-form');
    const viewSuccess = document.getElementById('checkout-view-success');
    const elSuccessOrderId = document.getElementById('success-order-id');
    const elSuccessMethod = document.getElementById('success-method-label');

    if (viewForm) viewForm.style.display = 'none';
    if (viewSuccess) viewSuccess.style.display = 'block';
    if (elSuccessOrderId) elSuccessOrderId.textContent = `Commande #${orderId}`;
    if (elSuccessMethod) elSuccessMethod.textContent = methodLabels[currentPaymentMethod] || currentPaymentMethod;

    showToast(`🎉 Commande #${orderId} enregistrée !`);
  };

  window.copyProductLink = function() {
    if (!activeProduct) return;
    const shareText = `7H STUDIOS • ${activeProduct.name} (${activeProduct.price})`;
    navigator.clipboard.writeText(shareText).then(() => {
      showToast('Product title & info copied to clipboard!');
    });
  };

  // ===================================================================
  // EXECUTIVE ADMIN PANEL IMPLEMENTATION (Restricted to Authorized Admins)
  // ===================================================================

  window.openAdminPanel = async function() {
    if (!isCurrentUserAdmin()) {
      showToast('⛔ Access Denied: Authorized Admin Discord ID required.');
      return;
    }

    const backdrop = document.getElementById('admin-panel-backdrop');
    if (!backdrop) return;
    backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Synchronize stat counters
    const statProds = document.getElementById('admin-stat-products');
    const statParts = document.getElementById('admin-stat-partners');
    const sessionText = document.getElementById('admin-session-text');
    if (statProds && typeof PRODUCTS !== 'undefined') statProds.textContent = PRODUCTS.length;
    if (statParts && typeof PARTNERS_DATA !== 'undefined') statParts.textContent = PARTNERS_DATA.length;
    if (sessionText && verifiedMember) {
      sessionText.textContent = `Active Session: ${verifiedMember.displayName || verifiedMember.username} (ID: ${verifiedMember.id})`;
    }

    if (typeof filterAdminProductsList === 'function') {
      filterAdminProductsList();
    }

    // Fetch live server telemetry & diagnostics
    try {
      const res = await fetch(`/api/admin/stats?adminId=${verifiedMember.id}`);
      if (res.ok) {
        const stats = await res.json();
        const telemetryBox = document.getElementById('admin-telemetry-box');
        if (telemetryBox) {
          telemetryBox.innerHTML = `
            <div class="telemetry-row"><span class="telemetry-key">Live Domain:</span><span class="telemetry-val">${stats.domain}</span></div>
            <div class="telemetry-row"><span class="telemetry-key">Discord Guild ID:</span><span class="telemetry-val">${stats.guildId}</span></div>
            <div class="telemetry-row"><span class="telemetry-key">Discord Bot Client ID:</span><span class="telemetry-val">${stats.clientId}</span></div>
            <div class="telemetry-row"><span class="telemetry-key">Node Runtime:</span><span class="telemetry-val">${stats.nodeVersion}</span></div>
            <div class="telemetry-row"><span class="telemetry-key">Memory RSS / Heap:</span><span class="telemetry-val">${stats.memoryRssMb} MB / ${stats.memoryHeapMb} MB</span></div>
            <div class="telemetry-row"><span class="telemetry-key">Server Uptime:</span><span class="telemetry-val">${Math.floor(stats.uptime)} seconds</span></div>
            <div class="telemetry-row"><span class="telemetry-key">Security Guard:</span><span class="telemetry-val" style="color:#22c55e;">Strict Admin Lockdown Active (2 Owners)</span></div>
          `;
        }
      }
    } catch (e) {
      console.warn('Could not load telemetry:', e);
    }
  };

  window.closeAdminModal = function(e) {
    if (e.target && e.target.id === 'admin-panel-backdrop') {
      window.closeAdminModalDirect();
    }
  };

  window.closeAdminModalDirect = function() {
    const backdrop = document.getElementById('admin-panel-backdrop');
    if (backdrop) backdrop.classList.remove('active');
    document.body.style.overflow = '';
  };

  window.switchAdminTab = function(tabName) {
    const tabs = document.querySelectorAll('.admin-tab-btn');
    tabs.forEach(t => {
      if (t.dataset.tab === tabName) {
        t.classList.add('active');
      } else {
        t.classList.remove('active');
      }
    });

    const panes = {
      'broadcast': document.getElementById('tab-broadcast'),
      'manage-products': document.getElementById('tab-manage-products'),
      'add-product': document.getElementById('tab-add-product'),
      'add-partner': document.getElementById('tab-add-partner'),
      'telemetry': document.getElementById('tab-telemetry')
    };

    Object.keys(panes).forEach(k => {
      if (panes[k]) {
        panes[k].style.display = (k === tabName) ? 'block' : 'none';
      }
    });

    if (tabName === 'manage-products') {
      filterAdminProductsList();
    }
  };

  // ===================================================================
  // ADMIN CATALOG MANAGEMENT (EDIT & DELETE PRODUCTS)
  // ===================================================================

  window.filterAdminProductsList = function() {
    const searchInput = document.getElementById('admin-prod-search');
    const catSelect = document.getElementById('admin-prod-filter-cat');
    const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
    const category = catSelect ? catSelect.value : 'all';

    if (typeof PRODUCTS === 'undefined') return;

    let filtered = PRODUCTS.filter(prod => {
      const matchCat = (category === 'all') || (prod.category === category);
      const matchQuery = !query || 
        (prod.name && prod.name.toLowerCase().includes(query)) ||
        (prod.id && prod.id.toLowerCase().includes(query)) ||
        (prod.tags && prod.tags.some(t => t.toLowerCase().includes(query)));
      return matchCat && matchQuery;
    });

    renderAdminProductsList(filtered);
  };

  window.renderAdminProductsList = function(list) {
    const container = document.getElementById('admin-products-list');
    const pill = document.getElementById('admin-products-count-pill');
    if (!container) return;

    if (pill) {
      pill.textContent = `${list.length} Products`;
    }

    if (!list.length) {
      container.innerHTML = `
        <div style="text-align:center; padding: 2.5rem 1rem; color: #94a3b8;">
          <p style="font-size:1.1rem; margin-bottom: 0.4rem;">No products match your filter.</p>
          <span style="font-size:0.85rem; color:#64748b;">Try searching for another keyword or change category.</span>
        </div>
      `;
      return;
    }

    container.innerHTML = list.map(prod => {
      const thumb = prod.thumbnail || prod.fallbackImage || 'assets/images/scripts.jpg';
      const isFree = prod.isFree || prod.category === 'Free';
      const priceDisplay = isFree ? 'FREE' : prod.price;

      return `
        <div class="admin-prod-item" id="admin-item-${escapeHtml(prod.id)}">
          <div class="admin-prod-item-left">
            <img src="${thumb}" alt="${escapeHtml(prod.name)}" class="admin-prod-thumb" onerror="this.src='assets/images/scripts.jpg'">
            <div class="admin-prod-info">
              <div class="admin-prod-name">${escapeHtml(prod.name)}</div>
              <div class="admin-prod-meta">
                <span class="admin-prod-tag-cat">${escapeHtml(prod.category)}</span>
                <span class="admin-prod-price-tag">${escapeHtml(priceDisplay)}</span>
                <span class="admin-prod-id-tag">ID: ${escapeHtml(prod.id)}</span>
              </div>
            </div>
          </div>
          <div class="admin-prod-actions">
            <button class="btn-admin-edit" onclick="openEditProduct('${escapeHtml(prod.id)}')">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              <span>Edit</span>
            </button>
            <button class="btn-admin-delete" onclick="deleteAdminProduct('${escapeHtml(prod.id)}', '${escapeHtml(prod.name)}')">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              <span>Delete</span>
            </button>
          </div>
        </div>
      `;
    }).join('');
  };

  window.openEditProduct = function(productId) {
    if (typeof PRODUCTS === 'undefined') return;
    const prod = PRODUCTS.find(p => String(p.id) === String(productId));
    if (!prod) {
      showToast('Product not found.');
      return;
    }

    const editCard = document.getElementById('admin-edit-prod-card');
    if (!editCard) return;

    document.getElementById('admin-edit-id').value = prod.id;
    document.getElementById('admin-edit-title-preview').textContent = prod.name;
    document.getElementById('admin-edit-name').value = prod.name || '';
    document.getElementById('admin-edit-cat').value = prod.category || 'Scripts';
    document.getElementById('admin-edit-price').value = prod.price || '';
    document.getElementById('admin-edit-tags').value = (prod.tags || []).join(', ');
    document.getElementById('admin-edit-img').value = prod.thumbnail || prod.fallbackImage || '';
    document.getElementById('admin-edit-desc').value = prod.description || '';

    editCard.style.display = 'block';
    editCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  window.cancelEditProduct = function() {
    const editCard = document.getElementById('admin-edit-prod-card');
    if (editCard) editCard.style.display = 'none';
  };

  window.saveEditProduct = async function() {
    if (!isCurrentUserAdmin()) {
      showToast('⛔ Access Denied: Admin authorization required.');
      return;
    }

    const id = document.getElementById('admin-edit-id').value;
    const name = document.getElementById('admin-edit-name').value.trim();
    const category = document.getElementById('admin-edit-cat').value;
    const price = document.getElementById('admin-edit-price').value.trim() || '$14.99';
    const tagsRaw = document.getElementById('admin-edit-tags').value.trim();
    const img = document.getElementById('admin-edit-img').value.trim() || 'assets/images/scripts.jpg';
    const desc = document.getElementById('admin-edit-desc').value.trim();

    if (!name) {
      showToast('Product name cannot be empty.');
      return;
    }

    const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : ['FiveM'];
    const isFree = category === 'Free' || price.toLowerCase().includes('free');

    const updatedProduct = {
      id,
      name,
      category,
      price,
      isFree,
      description: desc,
      tags,
      thumbnail: img,
      fallbackImage: img
    };

    try {
      const res = await fetch('/api/admin/edit-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: verifiedMember.id,
          product: updatedProduct
        })
      });

      const data = await res.json();
      if (data.success && data.product) {
        // Update local memory
        const idx = PRODUCTS.findIndex(p => String(p.id) === String(id));
        if (idx !== -1) {
          PRODUCTS[idx] = { ...PRODUCTS[idx], ...data.product };
        }

        initCategoryCounts();
        renderProducts();
        filterAdminProductsList();
        cancelEditProduct();
        showToast(`🎉 "${name}" updated in catalog successfully!`);
      } else {
        showToast('Error updating product: ' + (data.message || 'Unknown'));
      }
    } catch (err) {
      showToast('Failed to connect to server.');
      console.error(err);
    }
  };

  window.deleteAdminProduct = async function(productId, productName) {
    if (!isCurrentUserAdmin()) {
      showToast('⛔ Access Denied: Admin authorization required.');
      return;
    }

    const confirmMsg = `Are you sure you want to permanently delete "${productName}" from the store catalog?`;
    if (!window.confirm(confirmMsg)) {
      return;
    }

    try {
      const res = await fetch('/api/admin/delete-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: verifiedMember.id,
          productId: productId
        })
      });

      const data = await res.json();
      if (data.success) {
        // Remove from local memory
        const idx = PRODUCTS.findIndex(p => String(p.id) === String(productId));
        if (idx !== -1) {
          PRODUCTS.splice(idx, 1);
        }

        // Update counters
        const statProds = document.getElementById('admin-stat-products');
        if (statProds) statProds.textContent = PRODUCTS.length;

        initCategoryCounts();
        renderProducts();
        filterAdminProductsList();

        // If editing this product, cancel it
        const currentEditId = document.getElementById('admin-edit-id')?.value;
        if (currentEditId === productId) {
          cancelEditProduct();
        }

        showToast(`🗑️ "${productName}" removed from store catalog.`);
      } else {
        showToast('Error deleting product: ' + (data.message || 'Unknown'));
      }
    } catch (err) {
      showToast('Failed to delete product.');
      console.error(err);
    }
  };


  window.sendAdminAnnouncement = async function() {
    if (!isCurrentUserAdmin()) {
      showToast('⛔ Access Denied');
      return;
    }

    const channelId = document.getElementById('admin-announce-channel').value;
    const mention = document.getElementById('admin-announce-mention').value;
    const title = document.getElementById('admin-announce-title').value.trim();
    const content = document.getElementById('admin-announce-desc').value.trim();
    const colorHex = document.getElementById('admin-announce-color').value;
    const btnSend = document.getElementById('btn-send-announcement');

    if (!content) {
      showToast('Please enter announcement text.');
      return;
    }

    if (btnSend) {
      btnSend.disabled = true;
      btnSend.innerHTML = `<span>Broadcasting to Discord...</span>`;
    }

    try {
      const res = await fetch('/api/admin/announce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: verifiedMember.id,
          channelId,
          mention,
          title,
          content,
          colorHex
        })
      });

      const data = await res.json();
      if (data.success) {
        showToast('🚀 Announcement broadcasted to Discord successfully!');
        document.getElementById('admin-announce-title').value = '';
        document.getElementById('admin-announce-desc').value = '';
      } else {
        showToast('Error sending announcement: ' + (data.message || 'Unknown'));
      }
    } catch (err) {
      showToast('Error connecting to announcement API.');
      console.error(err);
    } finally {
      if (btnSend) {
        btnSend.disabled = false;
        btnSend.innerHTML = `
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
          <span>Broadcast Announcement to Discord</span>
        `;
      }
    }
  };

  window.addAdminProduct = async function() {
    if (!isCurrentUserAdmin()) {
      showToast('⛔ Access Denied');
      return;
    }

    const name = document.getElementById('admin-prod-name').value.trim();
    const category = document.getElementById('admin-prod-cat').value;
    const price = document.getElementById('admin-prod-price').value.trim() || '$14.99';
    const tagsRaw = document.getElementById('admin-prod-tags').value.trim();
    const img = document.getElementById('admin-prod-img').value.trim() || 'assets/images/scripts.jpg';
    const desc = document.getElementById('admin-prod-desc').value.trim() || 'High quality FiveM asset from 7H Studios.';

    if (!name) {
      showToast('Product name is required.');
      return;
    }

    const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : ['FiveM', '7H Studio'];
    const isFree = category === 'Free' || price.toLowerCase().includes('free');

    const newProduct = {
      name,
      category,
      price,
      isFree,
      description: desc,
      tags,
      thumbnail: img,
      fallbackImage: img
    };

    try {
      const res = await fetch('/api/admin/add-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: verifiedMember.id,
          product: newProduct
        })
      });

      const data = await res.json();
      if (data.success && data.product) {
        PRODUCTS.unshift(data.product);

        const statProds = document.getElementById('admin-stat-products');
        if (statProds) statProds.textContent = PRODUCTS.length;
        initCategoryCounts();
        renderProducts();
        if (typeof filterAdminProductsList === 'function') filterAdminProductsList();
        showToast(`🎉 "${name}" added to catalog successfully!`);

        document.getElementById('admin-prod-name').value = '';
        document.getElementById('admin-prod-price').value = '';
        document.getElementById('admin-prod-tags').value = '';
        document.getElementById('admin-prod-img').value = '';
        document.getElementById('admin-prod-desc').value = '';
        window.closeAdminModalDirect();
        window.location.hash = '#store';
      } else {
        showToast('Error adding product: ' + (data.message || 'Unknown'));
      }
    } catch (err) {
      showToast('Failed to add product.');
      console.error(err);
    }
  };

  window.addAdminPartner = async function() {
    if (!isCurrentUserAdmin()) {
      showToast('⛔ Access Denied');
      return;
    }

    const name = document.getElementById('admin-part-name').value.trim();
    const category = document.getElementById('admin-part-cat').value;
    const discordUrl = document.getElementById('admin-part-discord').value.trim();
    const webUrl = document.getElementById('admin-part-web').value.trim();
    const banner = document.getElementById('admin-part-banner').value.trim();
    const desc = document.getElementById('admin-part-desc').value.trim() || 'Official partner of 7H Studios network.';

    if (!name || !discordUrl) {
      showToast('Partner name and Discord URL are required.');
      return;
    }

    const newPartner = {
      name,
      category,
      discordUrl,
      websiteUrl: webUrl,
      bannerUrl: banner,
      description: desc,
      status: 'Verified Partner',
      badges: ['Official Partner']
    };

    try {
      const res = await fetch('/api/admin/add-partner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: verifiedMember.id,
          partner: newPartner
        })
      });

      const data = await res.json();
      if (data.success && data.partner) {
        PARTNERS_DATA.unshift(data.partner);
        initPartnerCounts();
        renderPartners();
        showToast(`🤝 "${name}" added to partners network!`);
        document.getElementById('admin-part-name').value = '';
        document.getElementById('admin-part-discord').value = '';
        document.getElementById('admin-part-web').value = '';
        document.getElementById('admin-part-banner').value = '';
        document.getElementById('admin-part-desc').value = '';
        window.closeAdminModalDirect();
        window.location.hash = '#partners';
      } else {
        showToast('Error adding partner: ' + (data.message || 'Unknown'));
      }
    } catch (err) {
      showToast('Failed to add partner.');
      console.error(err);
    }
  };

  window.showToast = function(message) {

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#a855f7" stroke-width="2.5">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <span>${escapeHtml(message)}</span>
    `;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'toastIn 0.3s reverse forwards';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  };

  function escapeHtml(string) {
    if (!string) return '';
    return String(string)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
