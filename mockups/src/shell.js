/* The ProdLink app shell — one definition, injected into every screen.
   Screens never hand-write the sidebar or the page header; they provide a
   <main> element plus data attributes on <body>. */

(function () {
  var PERSONA = {
    name: 'Rania Fadel',
    email: 'rania.fadel@goldencrust.example',
    role: 'Admin',
    initial: 'R'
  };

  var NAV = [
    { label: 'Dashboard', href: '/', icon: 'i-dashboard', tone: 'indigo' },
    { label: 'Production', href: '/production', icon: 'i-factory', tone: 'emerald' },
    { label: 'Waste', href: '/waste', icon: 'i-trash', tone: 'rose' },
    { label: 'Damage', href: '/damage', icon: 'i-alert-triangle', tone: 'amber' },
    { label: 'Reprocessing', href: '/reprocessing', icon: 'i-refresh', tone: 'purple' },
    { label: 'Approvals', href: '/approvals', icon: 'i-clipboard-check', tone: 'cyan' }
  ];

  var ADMIN_NAV = [
    { label: 'Settings', href: '/admin/settings', icon: 'i-settings', tone: 'slate' }
  ];

  /* Settings sub-tabs — shared by every /admin screen, same as AdminLayoutClient. */
  var ADMIN_TABS = [
    { label: 'General', href: '/admin/settings', icon: 'i-settings' },
    { label: 'Users', href: '/admin/users', icon: 'i-users' },
    { label: 'Lines', href: '/admin/lines', icon: 'i-factory' },
    { label: 'Products', href: '/admin/products', icon: 'i-package' },
    { label: 'Reasons', href: '/admin/reasons', icon: 'i-list' },
    { label: 'Approval Levels', href: '/admin/approval-levels', icon: 'i-git-branch' }
  ];

  function icon(id, cls) {
    return '<svg class="icon' + (cls ? ' ' + cls : '') + '"><use href="#' + id + '"/></svg>';
  }

  function isActive(item, page) {
    if (item.href === '/') return page === '/';
    if (item.href === '/admin/settings') return page.indexOf('/admin') === 0;
    return page === item.href || page.indexOf(item.href + '/') === 0;
  }

  function navItem(item, page) {
    var on = isActive(item, page);
    var style = on
      ? ' style="--tone-tint:var(--' + item.tone + '-tint);--tone-ink:var(--' + item.tone +
        '-ink);--tone-line:var(--' + item.tone + ')"'
      : '';
    return (
      '<div class="nav-item' + (on ? ' active' : '') + '"' + style + '>' +
        '<span class="tile">' + icon(item.icon) + '</span>' +
        '<span>' + item.label + '</span>' +
      '</div>'
    );
  }

  function sidebar(page) {
    return (
      '<aside class="sidebar">' +
        '<div class="brand">' +
          '<span class="brand-mark">' + icon('i-logo', 'icon-lg') + '</span>' +
          '<span><span class="brand-name">ProdLink</span>' +
          '<span class="brand-sub" style="display:block">Production Manager</span></span>' +
        '</div>' +
        '<div class="collapse">' + icon('i-chevron-left', 'icon-sm') + '<span>Collapse Menu</span></div>' +
        '<nav class="nav">' +
          '<p class="nav-label">Navigation</p>' +
          '<div class="nav-group">' + NAV.map(function (i) { return navItem(i, page); }).join('') + '</div>' +
          '<div class="nav-sep"></div>' +
          '<p class="nav-label">Admin</p>' +
          '<div class="nav-group">' + ADMIN_NAV.map(function (i) { return navItem(i, page); }).join('') + '</div>' +
        '</nav>' +
        '<div class="user-card">' +
          '<div class="user-row">' +
            '<span class="avatar">' + PERSONA.initial + '</span>' +
            '<span style="flex:1;min-width:0">' +
              '<span class="user-name" style="display:block">' + PERSONA.name + '</span>' +
              '<span class="user-mail" style="display:block">' + PERSONA.email + '</span>' +
            '</span>' +
            icon('i-chevron-up', 'icon-sm') +
          '</div>' +
          '<span class="role-pill">' + PERSONA.role + '</span>' +
        '</div>' +
      '</aside>'
    );
  }

  function subnav(page) {
    return ADMIN_TABS.map(function (t) {
      var on = page === t.href;
      return (
        '<div class="subnav-item' + (on ? ' active' : '') + '">' +
          '<span class="tile">' + icon(t.icon, 'icon-sm') + '</span>' +
          '<span style="flex:1">' + t.label + '</span>' +
          (on ? icon('i-chevron-right', 'icon-sm') : '') +
        '</div>'
      );
    }).join('') +
      '<div class="status-box">' +
        '<div class="t"><span class="dot" style="background:var(--emerald)"></span>System Status</div>' +
        '<div class="b">All services operational</div>' +
      '</div>';
  }

  function header(body) {
    var actions = document.getElementById('page-actions');
    return (
      '<header class="pagehead">' +
        '<div class="pagehead-left">' +
          '<span class="page-tile">' + icon(body.dataset.icon || 'i-dashboard', 'icon-lg') + '</span>' +
          '<div>' +
            '<h1 class="page-title">' + (body.dataset.title || '') + '</h1>' +
            '<p class="page-sub">' + (body.dataset.subtitle || '') + '</p>' +
          '</div>' +
        '</div>' +
        '<div class="pagehead-right">' + (actions ? actions.innerHTML : '') + '</div>' +
      '</header>'
    );
  }

  function build() {
    var body = document.body;
    var canvas = document.querySelector('.canvas');
    var page = body.dataset.page || '/';
    var tone = body.dataset.tone || 'blue';

    canvas.style.setProperty('--tone', 'var(--' + tone + ')');
    canvas.style.setProperty('--tone-tint', 'var(--' + tone + '-tint)');
    canvas.style.setProperty('--tone-ink', 'var(--' + tone + '-ink)');
    canvas.style.setProperty('--tone-grad', 'var(--grad-' + (body.dataset.grad || 'primary') + ')');

    if (body.dataset.shell === 'none') return;

    var main = canvas.querySelector('main');
    canvas.insertAdjacentHTML('afterbegin', sidebar(page));
    var col = document.createElement('div');
    col.className = 'main';
    col.insertAdjacentHTML('afterbegin', header(body));
    main.parentNode.insertBefore(col, main);
    col.appendChild(main);
    main.classList.add('content');

    var slot = main.querySelector('[data-subnav]');
    if (slot) slot.innerHTML = subnav(page);
  }

  function theme() {
    var q = location.search;
    if (q.indexOf('theme=dark') > -1) document.querySelector('.canvas').classList.add('dark');
  }

  /* Scale the fixed canvas DOWN to fit small windows so the file is viewable in a
     normal browser; ?fit=off pins it to 1:1 for capture. */
  function fit() {
    var canvas = document.querySelector('.canvas');
    var off = location.search.indexOf('fit=off') > -1;
    /* ?zoom=N&zx=..&zy=.. magnifies a region — for checking a detail in a capture. */
    var z = /zoom=([\d.]+)/.exec(location.search);
    if (z) {
      var zx = (/zx=(-?\d+)/.exec(location.search) || [, 0])[1];
      var zy = (/zy=(-?\d+)/.exec(location.search) || [, 0])[1];
      canvas.style.transform = 'scale(' + z[1] + ') translate(' + -zx + 'px,' + -zy + 'px)';
      return;
    }
    function apply() {
      if (off) { canvas.style.transform = 'scale(1)'; document.body.style.height = ''; return; }
      var s = Math.min(window.innerWidth / canvas.offsetWidth, window.innerHeight / canvas.offsetHeight, 1);
      canvas.style.transform = 'scale(' + s + ')';
    }
    apply();
    window.addEventListener('resize', apply);
  }

  theme();
  build();
  fit();
})();
