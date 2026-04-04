/**
 * EIT Dashboard - Frontend Controller v1.3
 * - Multi-select sidebar filters
 * - 4-column compact cards
 * - Phase select dropdown on cards
 */
(function () {
    'use strict';

    /* ─── State ─── */
    var allBooks = [];
    var categories = {};
    var activeFilters = {};
    var searchQuery = '';
    var allAtananlar = [];
    var dataVersion = -1;

    /* ─── Kitap durumları (phase kaldırıldı) ─── */
    var kitapDurumlari = ['Havuzda', '\u0130\u015flemde', 'TTKB Onay\u0131', 'Ask\u0131da', 'Pasif'];

    /* ─── DOM refs ─── */
    var $grid, $empty, $pills, $info, $nav, $search;
    var $title, $breadcrumb, $sort;
    var $loading, $sidebar, $mobileToggle;

    /* ─── Init ─── */
    document.addEventListener('DOMContentLoaded', function () {
        $grid        = document.getElementById('bookGrid');
        $empty       = document.getElementById('emptyState');
        $pills       = document.getElementById('filterPills');
        $info        = document.getElementById('resultsInfo');
        $nav         = document.getElementById('sidebarNav');
        $search      = document.getElementById('sidebarSearch');
        $title       = document.getElementById('pageTitle');
        $breadcrumb  = document.getElementById('breadcrumb');
        $sort        = document.getElementById('sortSelect');
        $loading     = document.getElementById('loadingOverlay');
        $sidebar     = document.getElementById('sidebar');
        $mobileToggle= document.getElementById('mobileToggle');

        // Theme toggle
        var $themeToggle = document.getElementById('themeToggle');
        var isDark = localStorage.getItem('eit-dark') === '1';
        if (isDark) document.body.classList.add('dark-mode');
        updateThemeIcon();

        if ($themeToggle) $themeToggle.addEventListener('click', function () {
            document.body.classList.toggle('dark-mode');
            isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('eit-dark', isDark ? '1' : '0');
            updateThemeIcon();
        });

        function updateThemeIcon() {
            var icon = document.getElementById('themeIcon');
            if (!icon) return;
            if (document.body.classList.contains('dark-mode')) {
                // Gunes ikonu
                icon.innerHTML = '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
            } else {
                // Ay ikonu
                icon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
            }
        }

        // Header bilgi butonu permissions
        var critHdrBtn = document.getElementById('criteriaHeaderBtn');
        if (critHdrBtn && (window.eitMyPerms || {}).kriterler) {
            critHdrBtn.style.display = '';
        }

        // User profile in sidebar + header
        if (window.eitUser) {
            var u = window.eitUser;
            var roleLabels = { admin: 'Y\u00f6netici', editor: 'E-\u0130\u00e7erik Edit\u00f6r\u00fc', specialist: 'E-\u0130\u00e7erik Uzman\u0131', reviewer: '\u0130nceleyici', viewer: 'G\u00f6r\u00fcnt\u00fcleyici' };
            document.getElementById('userAvatar').src = u.avatar || '';
            document.getElementById('userName').textContent = u.name || '';
            document.getElementById('userRole').textContent = roleLabels[u.role] || u.role;
            document.getElementById('userLogout').href = u.logoutUrl || '#';
            var sidebarUser = document.querySelector('.sidebar-user');
            if (sidebarUser) sidebarUser.setAttribute('data-tooltip', (u.name || '') + ' \u00b7 ' + (roleLabels[u.role] || u.role));
        }

        // Show menu buttons based on permissions
        var myPerms = window.eitMyPerms || {};
        document.querySelectorAll('#sidebarMenuLinks [data-perm]').forEach(function (btn) {
            if (myPerms[btn.dataset.perm]) btn.style.display = '';
        });

        // Sidebar collapse
        var $sidebarToggle = document.getElementById('sidebarToggle');
        if (localStorage.getItem('eit-sidebar-collapsed') === '1') {
            document.body.classList.add('sidebar-collapsed');
        }
        if ($sidebarToggle) $sidebarToggle.addEventListener('click', function () {
            document.body.classList.toggle('sidebar-collapsed');
            localStorage.setItem('eit-sidebar-collapsed', document.body.classList.contains('sidebar-collapsed') ? '1' : '0');
        });

        // Sidebar collapsed tooltips (JS positioned — overflow safe)
        (function () {
            var tip = document.createElement('div');
            tip.className = 'sb-tooltip';
            document.body.appendChild(tip);
            var hideTimer;
            function showTip(el) {
                if (!document.body.classList.contains('sidebar-collapsed')) return;
                var text = el.getAttribute('data-tooltip');
                if (!text) return;
                tip.textContent = text;
                tip.classList.add('sb-tooltip-show');
                var r = el.getBoundingClientRect();
                tip.style.left = (r.right + 10) + 'px';
                tip.style.top = (r.top + r.height / 2 - tip.offsetHeight / 2) + 'px';
            }
            function hideTip() { tip.classList.remove('sb-tooltip-show'); }
            var sidebar = document.getElementById('sidebar');
            if (sidebar) {
                sidebar.addEventListener('mouseover', function (e) {
                    clearTimeout(hideTimer);
                    var target = e.target.closest('[data-tooltip]');
                    if (target) showTip(target); else hideTip();
                });
                sidebar.addEventListener('mouseout', function () {
                    hideTimer = setTimeout(hideTip, 80);
                });
            }
        })();

        bindEvents();
        loadData();
    });

    function bindEvents() {
        // Logo/title click -> home
        document.querySelector('.sidebar-header').addEventListener('click', function () {
            window.location.reload();
        });
        document.querySelector('.sidebar-header').style.cursor = 'pointer';

        $search.addEventListener('input', function () {
            searchQuery = this.value.trim();
            closeInlineViews();
            render();
        });
        if ($sort) $sort.addEventListener('change', function () { render(); });

        document.querySelectorAll('.view-toggle button').forEach(function (btn) {
            btn.addEventListener('click', function () {
                document.querySelectorAll('.view-toggle button').forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
                if (btn.dataset.view === 'list') {
                    $grid.style.gridTemplateColumns = '1fr';
                } else {
                    $grid.style.gridTemplateColumns = '';
                }
            });
        });

        // Mobile sidebar toggle + overlay
        var $overlay = document.createElement('div');
        $overlay.className = 'sidebar-overlay';
        document.body.appendChild($overlay);

        function closeMobileSidebar() {
            $sidebar.classList.remove('open');
            $overlay.classList.remove('active');
        }
        function openMobileSidebar() {
            $sidebar.classList.add('open');
            $overlay.classList.add('active');
        }

        $mobileToggle.addEventListener('click', function () {
            if ($sidebar.classList.contains('open')) closeMobileSidebar();
            else openMobileSidebar();
        });
        $overlay.addEventListener('click', closeMobileSidebar);

        // Close sidebar on any nav click (event delegation for dynamic items)
        $sidebar.addEventListener('click', function (e) {
            if (window.innerWidth > 1024) return;
            if (e.target.closest('.sidebar-menu-item') || e.target.closest('.book-card') || e.target.closest('.nav-group-icon')) {
                closeMobileSidebar();
            }
        });
    }

    function loadData() {
        $loading.classList.add('active');
        var xhr = new XMLHttpRequest();
        xhr.open('POST', (window.eitAjax || {}).url || '/wp-admin/admin-ajax.php');
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.timeout = 30000;
        xhr.onerror = function () { $loading.classList.remove('active'); alert('Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.'); };
        xhr.ontimeout = function () { $loading.classList.remove('active'); alert('Sunucu yanıt vermedi. Lütfen tekrar deneyin.'); };
        xhr.onload = function () {
            $loading.classList.remove('active');
            if (xhr.status === 200) {
                try { var resp = JSON.parse(xhr.responseText); } catch (e) { alert('Sunucu yanıtı okunamadı.'); return; }
                if (resp.success) {
                    allBooks = resp.data.books;
                    // Migrate: eski durum/asama adlari
                    var needsMigrate = false;
                    var asamaMigrate = {
                        'Kontrol Tamamland\u0131': '\u00dcretime Ba\u015fland\u0131',
                        'Onayland\u0131': 'E-\u0130\u00e7erik \u00dcretim Tamamland\u0131',
                        '\u0130\u00e7erik Yap\u0131lmaya Ba\u015fland\u0131': '\u00dcretime Ba\u015fland\u0131'
                    };
                    allBooks.forEach(function (b) {
                        // Kitap durumu migration
                        if (b.durumu === 'Teslim Edildi' || b.durumu === 'Onaylanm\u0131\u015f') {
                            b.durumu = 'TTKB Onay\u0131';
                            needsMigrate = true;
                        }
                        // TTKB Onayli kitaplarin e-iceriklerini tamamla
                        if (b.durumu === 'TTKB Onay\u0131' && b.uniteler) {
                            b.uniteler.forEach(function (u) {
                                if (u.icerikler) u.icerikler.forEach(function (ic) {
                                    if (ic.durum !== 'Tamamland\u0131') { ic.durum = 'Tamamland\u0131'; needsMigrate = true; }
                                });
                            });
                        }
                        // E-icerik asama migration
                        if (b.uniteler) b.uniteler.forEach(function (u) {
                            if (u.icerikler) u.icerikler.forEach(function (ic) {
                                if (ic.durum && asamaMigrate[ic.durum]) {
                                    ic.durum = asamaMigrate[ic.durum];
                                    needsMigrate = true;
                                }
                            });
                        });
                    });
                    categories = resp.data.categories;
                    if (typeof resp.data.version !== 'undefined') dataVersion = resp.data.version;
                    // Build unique atananlar list from e-icerikler + saved list
                    var aSet = {};
                    allBooks.forEach(function (b) {
                        if (b.uniteler) b.uniteler.forEach(function (u) {
                            if (u.icerikler) u.icerikler.forEach(function (ic) { if (ic.atanan) aSet[ic.atanan] = 1; });
                        });
                        if (b.atanan) aSet[b.atanan] = 1; // backward compat
                    });
                    // Include saved atananlar from DB
                    if (resp.data.atananlar) resp.data.atananlar.forEach(function (a) { if (a) aSet[a] = 1; });
                    allAtananlar = Object.keys(aSet).sort(function (a, b) { return a.localeCompare(b, 'tr'); });
                    // Expose for admin panel
                    window.eitAllBooks = allBooks;
                    window.eitKitapDurumlari = kitapDurumlari;
                    window.eitAllAtananlar = allAtananlar;
                    window.eitRefresh = function () {
                        // Rebuild atananlar from e-icerikler + global list
                        var aSet = {};
                        allBooks.forEach(function (b) {
                            if (b.uniteler) b.uniteler.forEach(function (u) {
                                if (u.icerikler) u.icerikler.forEach(function (ic) { if (ic.atanan) aSet[ic.atanan] = 1; });
                            });
                        });
                        // Also include from admin-panel's atananlar list
                        if (window.eitAllAtananlar) window.eitAllAtananlar.forEach(function (a) { aSet[a] = 1; });
                        allAtananlar = Object.keys(aSet).sort(function (a, b) { return a.localeCompare(b, 'tr'); });
                        window.eitAllAtananlar = allAtananlar;
                        buildSidebar(); render(); saveToServer();
                    };
                    buildSidebar();
                    render();
                    // Migration yapildiysa kaydet
                    if (needsMigrate) setTimeout(function () { saveToServer(); }, 500);

                    // Gorev notification + badge
                    setTimeout(function () {
                        var myUid = (window.eitUser || {}).id || 0;
                        var devam = 0, overdue = 0;
                        allBooks.forEach(function (b) {
                            (b.uniteler || []).forEach(function (u) {
                                (u.icerikler || []).forEach(function (ic) {
                                    if (ic.gorev && ic.gorev.atananId === myUid && ic.gorev.durum === 'Devam Ediyor') {
                                        if (ic.gorev.sonTarih && new Date() > new Date(ic.gorev.sonTarih)) overdue++;
                                        else devam++;
                                    }
                                });
                            });
                        });
                        // Badge on sidebar button
                        var gBtn = document.getElementById('gorevlerBtn');
                        if (gBtn && gBtn.style.display !== 'none') {
                            var oldBadge = gBtn.querySelector('.gorev-btn-badge');
                            if (oldBadge) oldBadge.remove();
                            if (overdue > 0) {
                                var badge = document.createElement('span');
                                badge.className = 'gorev-btn-badge';
                                badge.textContent = overdue;
                                gBtn.style.position = 'relative';
                                gBtn.appendChild(badge);
                            }
                        }
                        // Notification banner (sadece gecikme varsa)
                        if (overdue > 0) {
                            showGorevNotification(overdue);
                        }
                    }, 600);
                }
            }
        };
        xhr.send('action=eit_get_data&nonce=' + ((window.eitAjax || {}).nonce || ''));
    }

    function showGorevNotification(overdue) {
        var el = document.createElement('div');
        el.id = 'eitGorevNotif';
        el.className = 'gorev-notification';
        var msg = overdue + ' gecikmi\u015f g\u00f6reviniz var!';
        el.innerHTML = '<span class="gorev-notif-icon">\ud83d\udccb</span>' +
            '<span>' + msg + '</span>' +
            '<button class="gorev-notif-btn" id="gorevNotifGo">G\u00f6revlerime Git</button>' +
            '<button class="gorev-notif-close" id="gorevNotifClose">\u00d7</button>';
        document.body.appendChild(el);
        requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add('show'); }); });

        document.getElementById('gorevNotifClose').addEventListener('click', function () {
            el.classList.remove('show');
            setTimeout(function () { el.remove(); }, 300);
        });
        document.getElementById('gorevNotifGo').addEventListener('click', function () {
            el.classList.remove('show');
            setTimeout(function () { el.remove(); }, 300);
            var gb = document.getElementById('gorevlerBtn');
            if (gb) gb.click();
        });
        setTimeout(function () {
            if (el.parentNode) {
                el.classList.remove('show');
                setTimeout(function () { if (el.parentNode) el.remove(); }, 300);
            }
        }, 10000);
    }

    function closeInlineViews() {
        var av = document.getElementById('adminView');
        if (av) { av.style.display = 'none'; av.innerHTML = ''; }
        var abtn = document.getElementById('adminPanelBtn');
        if (abtn) abtn.classList.remove('active');
        var rv = document.getElementById('reportsView');
        if (rv) rv.style.display = 'none';
        var rbtn = document.getElementById('reportsBtn');
        if (rbtn) rbtn.classList.remove('active');
        var cv = document.getElementById('criteriaView');
        if (cv) { cv.style.display = 'none'; cv.innerHTML = ''; }
        var cbtn = document.getElementById('criteriaBtn');
        if (cbtn) cbtn.classList.remove('active');
        var ev = document.getElementById('eicerikTablosuView');
        if (ev) { ev.style.display = 'none'; ev.innerHTML = ''; }
        var ebtn = document.getElementById('eicerikTablosuBtn');
        if (ebtn) ebtn.classList.remove('active');
        var gv = document.getElementById('gorevlerView');
        if (gv) { gv.style.display = 'none'; gv.innerHTML = ''; }
        var gbtn = document.getElementById('gorevlerBtn');
        if (gbtn) gbtn.classList.remove('active');
    }

    /* ─── Multi-select helpers ─── */
    function isFilterActive(type, val) {
        return activeFilters[type] && activeFilters[type].indexOf(val) > -1;
    }

    function toggleFilter(type, val) {
        if (!activeFilters[type]) activeFilters[type] = [];
        var idx = activeFilters[type].indexOf(val);
        if (idx > -1) {
            activeFilters[type].splice(idx, 1);
            if (!activeFilters[type].length) delete activeFilters[type];
        } else {
            activeFilters[type].push(val);
        }
    }

    function removeFilter(type, val) {
        if (!activeFilters[type]) return;
        if (val === undefined) { delete activeFilters[type]; return; }
        var idx = activeFilters[type].indexOf(val);
        if (idx > -1) activeFilters[type].splice(idx, 1);
        if (!activeFilters[type].length) delete activeFilters[type];
    }

    function addFilter(type, val) {
        if (!activeFilters[type]) activeFilters[type] = [];
        if (activeFilters[type].indexOf(val) === -1) activeFilters[type].push(val);
    }

    /* ─── Get field value from book by filter type ─── */
    function getBookIcerikCategory(book) {
        var s = getBookIcerikStats(book);
        if (s.total === 0) return '\u0130\u00e7erik Yok';
        if (s.tamamlandi === s.total) return 'Tamam\u0131 Tamamland\u0131';
        if (s.gecikli > 0) return 'Gecikmi\u015f G\u00f6rev';
        if (s.postProd > 0) return 'Post-production';
        if (s.onaylandi > 0) return '\u00dc. Tamamland\u0131';
        if (s.uretimde > 0) return '\u00dcretimde';
        if (s.inceleme > 0) return '\u0130ncelemede';
        return '\u0130\u00e7erik Bekliyor';
    }

    function getBookField(book, type) {
        if (type === 'sinif') return book.sinif;
        if (type === 'okul') return book.okul;
        if (type === 'ders') return book.ders;
        if (type === 'yayinevi') return book.yayinevi;
        if (type === 'tarih') return book.tarih || 'Belirtilmemi\u015F';
        if (type === 'atanan') return book.atanan || 'Atanmam\u0131\u015F';
        if (type === 'durumu') return book.durumu || '\u0130\u015Flemde';
        if (type === 'eicerik_ilerleme') return getBookIcerikCategory(book);
        return '';
    }

    /* ─── Filter books excluding one filter type ─── */
    function getBooksExcludingFilter(excludeType) {
        return allBooks.filter(function (book) {
            if (searchQuery) {
                var q = searchQuery.toLowerCase();
                var haystack = (book.baslik + ' ' + book.ders + ' ' + (book.yazarlar || []).join(' ') + ' ' + book.yayinevi + ' ' + book.sinif + ' ' + book.okul).toLowerCase();
                if (haystack.indexOf(q) === -1) return false;
            }
            for (var type in activeFilters) {
                if (type === excludeType) continue;
                var vals = activeFilters[type];
                if (!vals || !vals.length) continue;
                if (type === 'yazar') {
                    var hasAny = false;
                    for (var i = 0; i < vals.length; i++) {
                        if (book.yazarlar.indexOf(vals[i]) > -1) { hasAny = true; break; }
                    }
                    if (!hasAny) return false;
                } else if (type === 'eicerik_ilerleme') {
                    var hasMatch = false;
                    (book.uniteler || []).forEach(function (u) {
                        (u.icerikler || []).forEach(function (ic) {
                            if (vals.indexOf(ic.durum || '\u0130\u00e7erik Gelmedi') > -1) hasMatch = true;
                        });
                    });
                    if (!hasMatch) return false;
                } else {
                    if (vals.indexOf(getBookField(book, type)) === -1) return false;
                }
            }
            return true;
        });
    }

    /* ─── Count values for a field from a set of books ─── */
    function countField(books, filterType) {
        var counts = {};
        if (filterType === 'eicerik_ilerleme') {
            // Count individual icerik rows by their asama, not by book category
            books.forEach(function (book) {
                (book.uniteler || []).forEach(function (u) {
                    (u.icerikler || []).forEach(function (ic) {
                        var d = ic.durum || '\u0130\u00e7erik Gelmedi';
                        counts[d] = (counts[d] || 0) + 1;
                    });
                });
            });
            return counts;
        }
        books.forEach(function (book) {
            if (filterType === 'yazar') {
                book.yazarlar.forEach(function (y) { counts[y] = (counts[y] || 0) + 1; });
            } else {
                var val = getBookField(book, filterType);
                if (val) counts[val] = (counts[val] || 0) + 1;
            }
        });
        return counts;
    }

    /* ─── Sidebar ─── */
    function buildSidebar() {
        $nav.innerHTML = '';

        var groups = [
            {
                label: 'Takip',
                icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
                sections: [
                    { key: 'durumlar', label: 'Kitaplar', filterType: 'durumu' },
                    { key: 'eicerik_ilerleme', label: 'E-\u0130\u00e7erik A\u015famalar', filterType: 'eicerik_ilerleme' },
                ]
            },
            {
                label: 'Kitap Bilgileri',
                icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
                sections: [
                    { key: 'dersler', label: 'Dersler', filterType: 'ders' },
                    { key: 'siniflar', label: 'S\u0131n\u0131f D\u00FCzeyleri', filterType: 'sinif' },
                    { key: 'okullar', label: 'Okul T\u00FCr\u00FC', filterType: 'okul' },
                    { key: 'yayinevleri', label: 'Yay\u0131nevleri', filterType: 'yayinevi' },
                    { key: 'donemler', label: 'D\u00F6nemler', filterType: 'tarih' },
                    { key: 'yazarlar', label: 'Yazarlar', filterType: 'yazar' },
                ]
            }
        ];

        var hasAnyFilter = Object.keys(activeFilters).length > 0 || searchQuery;

        groups.forEach(function (group) {
            // Collapsed icon (visible only when sidebar is collapsed)
            var groupIcon = document.createElement('button');
            groupIcon.className = 'nav-group-icon';
            groupIcon.title = group.label;
            groupIcon.setAttribute('data-tooltip', group.label);
            groupIcon.innerHTML = group.icon;
            groupIcon.addEventListener('click', function () {
                document.body.classList.remove('sidebar-collapsed');
                localStorage.setItem('eit-sidebar-collapsed', '0');
            });
            $nav.appendChild(groupIcon);

            var label = document.createElement('div');
            label.className = 'nav-group-label';
            label.textContent = group.label;
            $nav.appendChild(label);

            group.sections.forEach(function (sec) {
            // Dynamic counts: filter books excluding this section's filter
            var relevantBooks = hasAnyFilter ? getBooksExcludingFilter(sec.filterType) : allBooks;
            var dynamicCounts = countField(relevantBooks, sec.filterType);

            // Build entries: only items with count > 0
            var entries = [];
            Object.keys(dynamicCounts).forEach(function (name) {
                if (dynamicCounts[name] > 0) {
                    entries.push([name, dynamicCounts[name]]);
                }
            });

            // Also include currently active items even if count is 0
            if (activeFilters[sec.filterType]) {
                activeFilters[sec.filterType].forEach(function (val) {
                    var found = false;
                    for (var i = 0; i < entries.length; i++) {
                        if (entries[i][0] === val) { found = true; break; }
                    }
                    if (!found) entries.push([val, 0]);
                });
            }

            if (!entries.length) return;

            // Sort
            if (sec.filterType === 'sinif') {
                entries.sort(function (a, b) { return (parseInt(a[0]) || 99) - (parseInt(b[0]) || 99); });
            } else if (sec.filterType === 'eicerik_ilerleme') {
                var icerikOrder = ['\u0130\u00e7erik Gelmedi', '\u0130\u00e7erik Geldi', '\u00d6n \u0130nceleme', 'T\u00fcrk\u00e7e Okuma', '\u00dcretime Ba\u015fland\u0131', '\u00dcretim Devam Ediyor', 'E-\u0130\u00e7erik \u00dcretim Tamamland\u0131', '\u00d6n Kontrol', 'Scorm V2', 'Tashih', 'Son Kontrol', 'Tamamland\u0131'];
                // Ensure all 12 stages appear even with 0 count
                icerikOrder.forEach(function (name) {
                    var found = false;
                    for (var i = 0; i < entries.length; i++) {
                        if (entries[i][0] === name) { found = true; break; }
                    }
                    if (!found) entries.push([name, 0]);
                });
                entries.sort(function (a, b) {
                    var ai = icerikOrder.indexOf(a[0]), bi = icerikOrder.indexOf(b[0]);
                    if (ai === -1) ai = 99;
                    if (bi === -1) bi = 99;
                    return ai - bi;
                });
            } else {
                entries.sort(function (a, b) { return b[1] - a[1]; });
            }

            var hasActive = !!activeFilters[sec.filterType];
            var selectedCount = hasActive ? activeFilters[sec.filterType].length : 0;

            var section = document.createElement('div');
            section.className = 'nav-section';

            var titleEl = document.createElement('div');
            titleEl.className = 'nav-section-title';
            var titleText = sec.label + ' (' + entries.length + ')';
            if (selectedCount > 0) titleText += ' \u2022 ' + selectedCount + ' se\u00E7ili';
            titleEl.innerHTML = '<span>' + titleText + '</span><span class="chevron">&#9654;</span>';
            titleEl.addEventListener('click', function () { section.classList.toggle('open'); });

            var itemsWrap = document.createElement('div');
            itemsWrap.className = 'nav-items';

            if (hasActive) {
                var clearItem = document.createElement('div');
                clearItem.className = 'nav-item';
                clearItem.style.color = '#f87171';
                clearItem.style.fontSize = '11px';
                clearItem.innerHTML = '<span class="nav-check" style="border-color:rgba(248,113,113,.4)"></span><span class="nav-item-label">Se\u00E7imi Temizle</span>';
                clearItem.addEventListener('click', function () {
                    delete activeFilters[sec.filterType];
                    buildSidebar();
                    render();
                });
                itemsWrap.appendChild(clearItem);
            }

            entries.forEach(function (entry) {
                var name = entry[0], count = entry[1];
                var active = isFilterActive(sec.filterType, name);
                var item = document.createElement('div');
                item.className = 'nav-item' + (active ? ' active' : '');
                item.innerHTML =
                    '<span class="nav-check"><span class="nav-check-icon">&#10003;</span></span>' +
                    '<span class="nav-item-label">' + escHtml(name) + '</span>' +
                    '<span class="badge">' + count + '</span>';
                item.addEventListener('click', function () {
                    toggleFilter(sec.filterType, name);
                    closeInlineViews();
                    buildSidebar();
                    render();
                });
                itemsWrap.appendChild(item);
            });

            section.appendChild(titleEl);
            section.appendChild(itemsWrap);
            $nav.appendChild(section);
            if (hasActive) section.classList.add('open');
            }); // end sections
        }); // end groups

    }

    /* ─── Filter ─── */
    function getFilteredBooks() {
        return allBooks.filter(function (book) {
            if (searchQuery) {
                var q = searchQuery.toLowerCase();
                var haystack = (book.baslik + ' ' + book.ders + ' ' + (book.yazarlar || []).join(' ') + ' ' + book.yayinevi + ' ' + book.sinif + ' ' + book.okul).toLowerCase();
                if (haystack.indexOf(q) === -1) return false;
            }
            for (var type in activeFilters) {
                var vals = activeFilters[type];
                if (!vals || !vals.length) continue;
                if (type === 'yazar') {
                    var hasAny = false;
                    for (var i = 0; i < vals.length; i++) {
                        if (book.yazarlar.indexOf(vals[i]) > -1) { hasAny = true; break; }
                    }
                    if (!hasAny) return false;
                } else {
                    var field = '';
                    if (type === 'sinif') field = book.sinif;
                    else if (type === 'okul') field = book.okul;
                    else if (type === 'ders') field = book.ders;
                    else if (type === 'yayinevi') field = book.yayinevi;
                    else if (type === 'tarih') field = book.tarih || 'Belirtilmemi\u015F';
                    else if (type === 'atanan') field = book.atanan || 'Atanmam\u0131\u015F';
                    else if (type === 'durumu') field = book.durumu || '\u0130\u015Flemde';
                    else if (type === 'eicerik_ilerleme') {
                        // Match if any icerik row in this book has one of the selected asamalar
                        var hasMatch = false;
                        (book.uniteler || []).forEach(function (u) {
                            (u.icerikler || []).forEach(function (ic) {
                                var d = ic.durum || '\u0130\u00e7erik Gelmedi';
                                if (vals.indexOf(d) > -1) hasMatch = true;
                            });
                        });
                        if (!hasMatch) return false;
                        continue;
                    }
                    if (vals.indexOf(field) === -1) return false;
                }
            }
            return true;
        });
    }

    function sortBooks(books) {
        var sortVal = $sort ? $sort.value : 'code-asc';
        return books.slice().sort(function (a, b) {
            if (sortVal === 'code-asc') return parseInt(a.id) - parseInt(b.id);
            if (sortVal === 'code-desc') return parseInt(b.id) - parseInt(a.id);
            if (sortVal === 'ders') return a.ders.localeCompare(b.ders, 'tr');
            if (sortVal === 'sinif') return (parseInt(a.sinif) || 99) - (parseInt(b.sinif) || 99);
            return 0;
        });
    }

    /* ─── Render ─── */
    function render() {
        // Always update header stats (onaylanmis haric)
        var _aktif = activeBooks();
        var _dc = { 'Havuzda': 0, '\u0130\u015flemde': 0, 'Ask\u0131da': 0, 'Pasif': 0 };
        _aktif.forEach(function (b) { var d = b.durumu || '\u0130\u015flemde'; _dc[d] = (_dc[d] || 0) + 1; });
        var _onaylanan = allBooks.length - _aktif.length;
        renderHeaderStats(_aktif.length, _dc['Havuzda'], _dc['\u0130\u015flemde'], _dc['Ask\u0131da'], _dc['Pasif'], _onaylanan);

        var filtered = sortBooks(getFilteredBooks());
        var $overview = document.getElementById('dashOverview');
        var $detail = document.getElementById('detailPage');
        if ($detail) { $detail.style.display = 'none'; $detail.innerHTML = ''; }

        // If admin or reports view is open, only update header stats, don't touch views
        var $admin = document.getElementById('adminView');
        var $reports = document.getElementById('reportsView');
        var $criteria = document.getElementById('criteriaView');
        var $eicerik = document.getElementById('eicerikTablosuView');
        var $gorevler = document.getElementById('gorevlerView');
        if (($admin && $admin.style.display !== 'none') || ($reports && $reports.style.display !== 'none') || ($criteria && $criteria.style.display !== 'none') || ($eicerik && $eicerik.style.display !== 'none') || ($gorevler && $gorevler.style.display !== 'none')) return;

        var rBtn = document.getElementById('reportsBtn');
        if (rBtn) rBtn.classList.remove('active');
        var aBtn = document.getElementById('adminPanelBtn');
        if (aBtn) aBtn.classList.remove('active');
        var hasFilter = Object.keys(activeFilters).length > 0 || searchQuery;

        // Update title
        if (hasFilter) {
            var titleParts = [];
            for (var t in activeFilters) {
                activeFilters[t].forEach(function (v) { titleParts.push(v); });
            }
            $title.textContent = titleParts.join(' \u2022 ') + ' (' + filtered.length + ')';
        } else {
            $title.textContent = 'Genel Bak\u0131\u015f';
        }

        if (!hasFilter) {
            $grid.style.display = 'none';
            $empty.style.display = 'none';
            $overview.style.display = '';
            $pills.style.display = 'none';
            $info.style.display = 'none';
            renderOverview($overview);
        } else {
            $overview.style.display = 'none';
            $pills.style.display = 'none';
            $info.style.display = 'none';
            if (filtered.length === 0) {
                $grid.style.display = 'none';
                $empty.style.display = 'block';
            } else {
                $grid.style.display = '';
                $empty.style.display = 'none';
                renderGrid(filtered);
            }
        }
    }

    /* ─── Dashboard Overview (dynamic, draggable) ─── */
    var defaultDashOrder = ['stats', 'phase', 'ders', 'yayinevi', 'atanan', 'geciken', 'recent'];
    var dashCardOrder = JSON.parse(localStorage.getItem('eit-dash-order') || 'null');
    if (dashCardOrder) {
        dashCardOrder = dashCardOrder.filter(function (k) { return k !== 'durum' && k !== 'eicerik'; });
        // Add missing keys from default
        defaultDashOrder.forEach(function (k) { if (dashCardOrder.indexOf(k) === -1) dashCardOrder.push(k); });
    } else {
        dashCardOrder = defaultDashOrder;
    }

    // Teslim edilmemis (aktif) kitaplari dondur
    function activeBooks() {
        return allBooks.filter(function (b) { return (b.durumu || '\u0130\u015flemde') !== 'TTKB Onay\u0131'; });
    }

    function renderOverview($el) {
        var aktif = activeBooks();
        var total = aktif.length;

        // Compute all data from ACTIVE books only
        var durumC = { 'Havuzda': 0, '\u0130\u015flemde': 0, 'Ask\u0131da': 0, 'Pasif': 0 };
        var phaseC = {}, dersC = {}, yvC = {};
        aktif.forEach(function (b) {
            var d = b.durumu || '\u0130\u015flemde';
            durumC[d] = (durumC[d] || 0) + 1;
            var eicKat = getBookIcerikCategory(b);
            phaseC[eicKat] = (phaseC[eicKat] || 0) + 1;
            if (b.ders) dersC[b.ders] = (dersC[b.ders] || 0) + 1;
            var yv = b.yayinevi || 'Belirtilmemi\u015f';
            yvC[yv] = (yvC[yv] || 0) + 1;
        });

        var onaylanan = allBooks.filter(function (b) { return b.durumu === 'TTKB Onay\u0131'; }).length;
        var bekleniyor = durumC['Havuzda'] || 0;
        var islemde = durumC['\u0130\u015flemde'] || 0;
        var askida = durumC['Ask\u0131da'] || 0;
        var pasif = durumC['Pasif'] || 0;

        // Global e-icerik hesaplamalari
        var icTotalG = 0, icDoneG = 0, icGelmediG = 0, uniteTotal = 0, gecikmeList = [];
        aktif.forEach(function (b) { if (b.uniteler) b.uniteler.forEach(function (u) {
            uniteTotal++;
            if (u.icerikler) u.icerikler.forEach(function (ic) {
                icTotalG++;
                var d = ic.durum || '\u0130\u00e7erik Gelmedi';
                if (d.indexOf('Tamamland') > -1) icDoneG++;
                if (d === '\u0130\u00e7erik Gelmedi') icGelmediG++;
                var g = ic.gorev || {};
                if (g.atananId && g.durum !== 'Tamamland\u0131' && g.sonTarih && new Date() > new Date(g.sonTarih)) {
                    gecikmeList.push({ kitapId: b.id, ders: b.ders, unite: u.ad, ad: ic.ad, atanan: g.atananAd, kalan: Math.ceil((new Date(g.sonTarih) - new Date()) / 86400000) });
                }
            });
        }); });
        var icPctG = icTotalG > 0 ? Math.round((icDoneG / icTotalG) * 100) : 0;

        var cardRenderers = {
            stats: function () {
                var h = '<div class="dash-card"><div class="dash-card-header"><h3>Genel \u0130lerleme</h3>';
                h += '<span class="dash-pct-badge" style="color:' + (icPctG === 100 ? '#22c55e' : '#4f46e5') + '">%' + icPctG + '</span></div>';
                h += '<div class="dash-card-body">';
                h += '<div class="dash-overview-progress"><div class="dash-overview-fill" style="width:' + icPctG + '%;background:' + (icPctG === 100 ? '#22c55e' : '#4f46e5') + '"></div></div>';
                h += '<div class="dash-overview-nums">';
                h += '<div class="dash-ov-item"><span class="dash-ov-num" style="color:#4f46e5">' + icDoneG + '</span><span class="dash-ov-label">Tamamlanan</span></div>';
                h += '<div class="dash-ov-item"><span class="dash-ov-num" style="color:#f59e0b">' + (icTotalG - icDoneG - icGelmediG) + '</span><span class="dash-ov-label">Devam Eden</span></div>';
                h += '<div class="dash-ov-item"><span class="dash-ov-num" style="color:#ef4444">' + icGelmediG + '</span><span class="dash-ov-label">Gelmedi</span></div>';
                h += '<div class="dash-ov-item"><span class="dash-ov-num" style="color:#8b5cf6">' + uniteTotal + '</span><span class="dash-ov-label">\u00dcnite</span></div>';
                if (gecikmeList.length) h += '<div class="dash-ov-item"><span class="dash-ov-num" style="color:#dc2626">' + gecikmeList.length + '</span><span class="dash-ov-label">Geciken</span></div>';
                h += '</div></div></div>';
                return h;
            },
            phase: function () {
                // 12 asama bazli e-icerik sayimi
                var asamaColors = {
                    '\u0130\u00e7erik Gelmedi': '#ef4444', '\u0130\u00e7erik Geldi': '#f97316',
                    '\u00d6n \u0130nceleme': '#f59e0b', 'T\u00fcrk\u00e7e Okuma': '#eab308',
                    '\u00dcretime Ba\u015fland\u0131': '#3b82f6', '\u00dcretim Devam Ediyor': '#6366f1',
                    'E-\u0130\u00e7erik \u00dcretim Tamamland\u0131': '#8b5cf6',
                    '\u00d6n Kontrol': '#06b6d4', 'Scorm V2': '#0ea5e9',
                    'Tashih': '#ec4899', 'Son Kontrol': '#14b8a6', 'Tamamland\u0131': '#22c55e'
                };
                var asamaOrder = window.eitIcerikDurumlari || Object.keys(asamaColors);
                var icD = {}, icTotal = 0;
                aktif.forEach(function (b) {
                    if (b.uniteler) b.uniteler.forEach(function (u) {
                        if (u.icerikler) u.icerikler.forEach(function (ic) {
                            icTotal++;
                            var d = ic.durum || '\u0130\u00e7erik Gelmedi';
                            icD[d] = (icD[d] || 0) + 1;
                        });
                    });
                });
                var h = '<div class="dash-card"><div class="dash-card-header"><h3>E-\u0130\u00e7erik \u0130lerlemesi</h3>';
                h += '<span style="font-size:12px;color:var(--text-light);font-weight:600">' + icTotal + ' e-i\u00e7erik</span></div>';
                h += '<div class="dash-card-body">';
                asamaOrder.forEach(function (asama) {
                    var count = icD[asama] || 0;
                    var pct = icTotal > 0 ? Math.round((count / icTotal) * 100) : 0;
                    var c = asamaColors[asama] || '#94a3b8';
                    var isEmpty = count === 0;
                    h += '<div class="phase-row' + (isEmpty ? ' phase-row-empty' : '') + '">';
                    h += '<span class="phase-dot" style="background:' + c + (isEmpty ? ';opacity:.3' : '') + '"></span>';
                    h += '<div class="phase-info"><span class="phase-name">' + escHtml(asama) + '</span></div>';
                    h += '<div class="phase-right">';
                    if (!isEmpty) {
                        h += '<div class="phase-mini-bar"><div class="phase-mini-fill" style="width:' + pct + '%;background:' + c + '"></div></div>';
                        h += '<span class="phase-pct">' + pct + '%</span>';
                    }
                    h += '<span class="phase-count">' + count + '</span>';
                    h += '</div></div>';
                });
                return h + '</div></div>';
            },
            ders: function () { return barCard('Ders Da\u011f\u0131l\u0131m\u0131', dersC, total, ['bar-blue','bar-purple','bar-amber','bar-green','bar-pink','bar-cyan'], 8, 'ders'); },
            durum: function () {
                var durumOrder = (window.eitDefLists || {}).kitapDurumlari || [];
                return barCard('Kitap Durumu', durumC, total, ['bar-amber','bar-green','bar-red','bar-blue'], 0, 'durumu', durumOrder);
            },
            yayinevi: function () { return barCard('Yay\u0131nevi Da\u011f\u0131l\u0131m\u0131', yvC, total, ['bar-purple','bar-blue','bar-amber','bar-green','bar-pink'], 0, 'yayinevi'); },
            eicerik: function () {
                var icD = {}, icTotal = 0;
                aktif.forEach(function (b) {
                    if (b.uniteler) b.uniteler.forEach(function (u) {
                        if (u.icerikler) u.icerikler.forEach(function (ic) {
                            icTotal++;
                            var d = ic.durum || '\u0130\u00e7erik Gelmedi';
                            icD[d] = (icD[d] || 0) + 1;
                        });
                    });
                });
                var icOrder = window.eitIcerikDurumlari || [];
                return barCard('E-\u0130\u00e7erik Durumu', icD, icTotal || 1, ['bar-red','bar-amber','bar-blue','bar-green'], 0, '', icOrder);
            },
            atanan: function () {
                var people = {};
                // Include all defined atananlar (even if 0 assignments)
                (window.eitAllAtananlar || []).forEach(function (a) {
                    if (a) people[a] = { toplam: 0, tamamlanan: 0, baslanan: 0, bekleyen: 0 };
                });
                aktif.forEach(function (b) {
                    if (b.uniteler) b.uniteler.forEach(function (u) {
                        if (u.icerikler) u.icerikler.forEach(function (ic) {
                            var a = ic.atanan || '';
                            if (!a) return;
                            if (!people[a]) people[a] = { toplam: 0, tamamlanan: 0, baslanan: 0, bekleyen: 0 };
                            people[a].toplam++;
                            if (ic.durum && ic.durum.indexOf('Tamamland') > -1) people[a].tamamlanan++;
                            else if (ic.durum && (ic.durum.indexOf('Ba\u015fland') > -1 || ic.durum.indexOf('Kontrolde') > -1)) people[a].baslanan++;
                            else people[a].bekleyen++;
                        });
                    });
                });
                var entries = Object.keys(people).map(function (k) { return [k, people[k]]; }).sort(function (a, b) { return b[1].toplam - a[1].toplam; });
                var h = '<div class="dash-card"><div class="dash-card-header"><h3>E-\u0130\u00e7erik Sorumlular\u0131</h3></div>';
                h += '<div class="dash-card-body">';
                if (!entries.length) {
                    h += '<div style="padding:16px 0;text-align:center;color:var(--text-light);font-size:12px">Hen\u00fcz atama yap\u0131lmad\u0131</div>';
                } else {
                    entries.forEach(function (e) {
                        var p = e[1];
                        var dPct = p.toplam > 0 ? Math.round((p.tamamlanan / p.toplam) * 100) : 0;
                        var bPct = p.toplam > 0 ? Math.round((p.baslanan / p.toplam) * 100) : 0;
                        var wPct = 100 - dPct - bPct;
                        h += '<div class="people-row">';
                        h += '<span class="people-name">' + escHtml(e[0]) + '</span>';
                        h += '<div class="people-bar-wrap">';
                        if (dPct > 0) h += '<div class="people-bar-seg people-bar-done" style="width:' + dPct + '%">' + (dPct >= 12 ? p.tamamlanan : '') + '</div>';
                        if (bPct > 0) h += '<div class="people-bar-seg people-bar-prog" style="width:' + bPct + '%">' + (bPct >= 12 ? p.baslanan : '') + '</div>';
                        if (wPct > 0) h += '<div class="people-bar-seg people-bar-wait" style="width:' + wPct + '%">' + (wPct >= 12 ? p.bekleyen : '') + '</div>';
                        h += '</div>';
                        h += '<span class="people-total">' + p.toplam + '</span>';
                        h += '</div>';
                    });
                    h += '<div class="people-legend">';
                    h += '<span class="people-legend-item"><span class="people-legend-dot" style="background:#22c55e"></span>Tamamlanan</span>';
                    h += '<span class="people-legend-item"><span class="people-legend-dot" style="background:#3b82f6"></span>Devam Eden</span>';
                    h += '<span class="people-legend-item"><span class="people-legend-dot" style="background:#e2e8f0"></span>Bekleyen</span>';
                    h += '</div>';
                }
                h += '</div></div>';
                return h;
            },
            geciken: function () {
                if (!gecikmeList.length) {
                    return '<div class="dash-card"><div class="dash-card-header"><h3>\u2705 Geciken G\u00f6revler</h3></div>' +
                        '<div class="dash-card-body" style="text-align:center;padding:24px;color:var(--text-light);font-size:13px">Hi\u00e7 geciken g\u00f6rev yok</div></div>';
                }
                gecikmeList.sort(function (a, b) { return a.kalan - b.kalan; });
                var h = '<div class="dash-card dash-card-alert"><div class="dash-card-header"><h3><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" style="vertical-align:-2px;margin-right:4px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>Geciken G\u00f6revler</h3>';
                h += '<span class="rpt-overdue-badge">' + gecikmeList.length + '</span></div>';
                h += '<div class="dash-card-body" style="padding:0">';
                h += '<table class="dash-table"><thead><tr><th>Kitap</th><th>Ders</th><th>\u0130\u00e7erik</th><th>Sorumlu</th><th>Gecikme</th></tr></thead><tbody>';
                gecikmeList.slice(0, 8).forEach(function (g) {
                    h += '<tr class="rpt-row-overdue">';
                    h += '<td style="font-weight:700;color:var(--blue-500)">#' + escHtml(g.kitapId) + '</td>';
                    h += '<td>' + escHtml(g.ders) + '</td>';
                    h += '<td>' + escHtml(g.ad) + '</td>';
                    h += '<td>' + escHtml(g.atanan || '-') + '</td>';
                    h += '<td style="font-weight:700;color:#dc2626">' + g.kalan + 'g</td>';
                    h += '</tr>';
                });
                if (gecikmeList.length > 8) h += '<tr><td colspan="5" style="text-align:center;color:var(--text-light);font-size:11px">+ ' + (gecikmeList.length - 8) + ' daha...</td></tr>';
                h += '</tbody></table></div></div>';
                return h;
            },
            recent: function () {
                var h = '<div class="dash-card"><div class="dash-card-header"><h3>Son Kitaplar</h3>';
                h += '<span class="dash-card-link" id="dashShowAll">T\u00fcm Kitaplar \u2192</span></div>';
                h += '<div class="dash-card-body" style="padding:0">';
                h += '<table class="dash-table" style="table-layout:auto"><thead><tr>';
                h += '<th>Kod</th><th>Ders</th><th>S\u0131n\u0131f</th><th>Yay\u0131nevi</th><th>Durum</th><th>\u0130lerleme</th>';
                h += '</tr></thead><tbody>';
                allBooks.slice(-10).reverse().forEach(function (b) {
                    var durumColor = '#f59e0b';
                    if ((b.durumu || '').indexOf('Havuzda') > -1) durumColor = '#0ea5e9';
                    if ((b.durumu || '').indexOf('TTKB') > -1) durumColor = '#22c55e';
                    if ((b.durumu || '').indexOf('Ask') > -1) durumColor = '#ef4444';
                    if ((b.durumu || '').indexOf('Pasif') > -1) durumColor = '#94a3b8';
                    // İlerleme hesapla
                    var bIcTotal = 0, bIcDone = 0;
                    if (b.uniteler) b.uniteler.forEach(function (u) { if (u.icerikler) u.icerikler.forEach(function (ic) { bIcTotal++; if ((ic.durum || '').indexOf('Tamamland') > -1) bIcDone++; }); });
                    var bPct = bIcTotal > 0 ? Math.round((bIcDone / bIcTotal) * 100) : 0;
                    h += '<tr style="cursor:pointer" data-recent-id="' + escAttr(b.id) + '">';
                    h += '<td style="font-weight:700;color:var(--blue-500);white-space:nowrap">#' + escHtml(b.id) + '</td>';
                    h += '<td style="font-weight:600">' + escHtml(b.ders) + '</td>';
                    h += '<td style="white-space:nowrap">' + escHtml(b.sinif) + '</td>';
                    h += '<td>' + escHtml(b.yayinevi) + '</td>';
                    h += '<td style="white-space:nowrap"><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:' + durumColor + ';margin-right:4px;vertical-align:middle"></span>' + escHtml(b.durumu || '\u0130\u015flemde') + '</td>';
                    var pctColor = bPct === 100 ? '#22c55e' : (bPct >= 50 ? '#4f46e5' : '#f59e0b');
                    h += '<td><div style="display:flex;align-items:center;gap:6px"><div style="flex:1;height:4px;background:var(--body-bg);border-radius:2px;overflow:hidden;min-width:40px"><div style="width:' + bPct + '%;height:100%;background:' + pctColor + ';border-radius:2px"></div></div><span style="font-size:11px;font-weight:700;color:' + pctColor + '">%' + bPct + '</span></div></td>';
                    h += '</tr>';
                });
                h += '</tbody></table></div></div>';
                return h;
            }
        };

        // Render cards in order
        var h = '<div class="dash-grid" id="dashGrid">';
        dashCardOrder.forEach(function (key, i) {
            if (!cardRenderers[key]) return;
            var isWide = key === 'stats' || key === 'geciken' || key === 'recent';
            h += '<div class="dash-drag-item' + (isWide ? ' dash-wide' : '') + '" draggable="true" data-dash-key="' + key + '">';
            h += '<div class="dash-drag-handle" title="S\u00fcr\u00fckle">\u2630</div>';
            h += cardRenderers[key]();
            h += '</div>';
        });
        h += '</div>';

        $el.innerHTML = h;

        // Bar click -> filter
        $el.querySelectorAll('[data-bar-filter]').forEach(function (bar) {
            bar.addEventListener('click', function () {
                var type = this.dataset.barFilter;
                var val = this.dataset.barVal;
                if (type && val) {
                    activeFilters = {};
                    activeFilters[type] = [val];
                    buildSidebar();
                    render();
                }
            });
        });

        // Show all link
        var sa = document.getElementById('dashShowAll');
        if (sa) sa.addEventListener('click', showAllBooks);

        // Recent book click -> open detail
        $el.querySelectorAll('[data-recent-id]').forEach(function (row) {
            row.addEventListener('click', function () {
                var id = this.dataset.recentId;
                var book = allBooks.find(function (b) { return b.id === id; });
                if (book && window.eitOpenDetail) window.eitOpenDetail(book);
            });
        });

        // Drag reorder
        var grid = document.getElementById('dashGrid');
        var dragKey = null;
        grid.querySelectorAll('.dash-drag-item').forEach(function (item) {
            item.addEventListener('dragstart', function () { dragKey = this.dataset.dashKey; this.style.opacity = '.4'; });
            item.addEventListener('dragend', function () { this.style.opacity = ''; });
            item.addEventListener('dragover', function (e) { e.preventDefault(); this.classList.add('dash-drag-over'); });
            item.addEventListener('dragleave', function () { this.classList.remove('dash-drag-over'); });
            item.addEventListener('drop', function (e) {
                e.preventDefault(); this.classList.remove('dash-drag-over');
                var dropKey = this.dataset.dashKey;
                if (dragKey && dragKey !== dropKey) {
                    var di = dashCardOrder.indexOf(dragKey);
                    var dri = dashCardOrder.indexOf(dropKey);
                    if (di > -1 && dri > -1) {
                        dashCardOrder.splice(di, 1);
                        dashCardOrder.splice(dri, 0, dragKey);
                        localStorage.setItem('eit-dash-order', JSON.stringify(dashCardOrder));
                        renderOverview($el);
                    }
                }
                dragKey = null;
            });
        });
    }

    function showAllBooks() {
        document.getElementById('dashOverview').style.display = 'none';
        var dp = document.getElementById('detailPage');
        if (dp) { dp.style.display = 'none'; dp.innerHTML = ''; }
        closeInlineViews();
        document.getElementById('bookGrid').style.display = '';
        $title.textContent = 'T\u00fcm Kitaplar (' + allBooks.length + ')';
        renderGrid(sortBooks(allBooks));
    }

    function renderHeaderStats(total, bekleniyor, islemde, askida, pasif, onaylanan) {
        var container = document.getElementById('headerStats');
        if (!container) return;

        // E-icerik ilerleme + gecikme hesapla
        var icTotal = 0, icDone = 0, gecikme = 0;
        allBooks.forEach(function (b) { if (b.uniteler) b.uniteler.forEach(function (u) { if (u.icerikler) u.icerikler.forEach(function (ic) {
            icTotal++;
            if ((ic.durum || '').indexOf('Tamamland') > -1) icDone++;
            var g = ic.gorev || {};
            if (g.atananId && g.durum !== 'Tamamland\u0131' && g.sonTarih && new Date() > new Date(g.sonTarih)) gecikme++;
        }); }); });
        var icPct = icTotal > 0 ? Math.round((icDone / icTotal) * 100) : 0;

        container.innerHTML =
            hsc('hs-total', total, 'Toplam', '') +
            hsc('hs-bekleniyor', bekleniyor, 'Havuzda', 'Havuzda') +
            hsc('hs-islemde', islemde, '\u0130\u015flemde', '\u0130\u015flemde') +
            hsc('hs-askida', askida, 'Ask\u0131da', 'Ask\u0131da') +
            hsc('hs-pasif', pasif, 'Pasif', 'Pasif') +
            hsc('hs-onaylanan', onaylanan, 'TTKB', 'TTKB Onay\u0131') +
            '<div class="hs-divider"></div>' +
            '<div class="hs-card hs-progress" title="E-\u0130\u00e7erik Tamamlanma"><span class="hs-num">%' + icPct + '</span><span class="hs-label">\u0130lerleme</span></div>' +
            (gecikme > 0 ? '<div class="hs-card hs-gecikme" title="Geciken G\u00f6revler"><span class="hs-num">' + gecikme + '</span><span class="hs-label">Geciken</span></div>' : '');

        container.querySelectorAll('.hs-card[data-filter]').forEach(function (card) {
            card.addEventListener('click', function () {
                closeInlineViews();
                var val = this.dataset.filter;
                if (val) {
                    activeFilters = { durumu: [val] };
                    buildSidebar();
                    render();
                } else {
                    showAllBooks();
                }
            });
        });
    }

    function hsc(cls, num, label, filterVal) {
        var isActive = activeFilters.durumu && activeFilters.durumu.indexOf(filterVal) > -1;
        var activeCls = isActive ? ' hs-active' : '';
        return '<div class="hs-card ' + cls + activeCls + '" data-filter="' + filterVal + '"><span class="hs-num">' + num + '</span><span class="hs-label">' + label + '</span></div>';
    }

    function barCard(title, data, total, colors, limit, filterType, order) {
        var entries;
        if (order && order.length) {
            // Follow given order, then add any extras
            entries = [];
            order.forEach(function (key) {
                if (data[key] !== undefined) entries.push([key, data[key]]);
            });
            Object.keys(data).forEach(function (key) {
                if (!order.length || order.indexOf(key) === -1) entries.push([key, data[key]]);
            });
        } else {
            entries = Object.keys(data).map(function (k) { return [k, data[k]]; }).sort(function (a, b) { return b[1] - a[1]; });
        }
        if (limit) entries = entries.slice(0, limit);
        var hasData = entries.some(function (e) { return e[1] > 0; });
        var h = '<div class="dash-card"><div class="dash-card-header"><h3>' + title + '</h3></div><div class="dash-card-body">';
        if (!hasData) {
            h += '<div style="padding:16px 0;text-align:center;color:var(--text-light);font-size:12px">Hen\u00fcz veri yok</div>';
        } else {
            entries.forEach(function (e, i) {
                var pct = total > 0 ? Math.round((e[1] / total) * 100) : 0;
                var clickAttr = filterType ? ' data-bar-filter="' + filterType + '" data-bar-val="' + escAttr(e[0]) + '" style="cursor:pointer"' : '';
                h += '<div class="dash-bar-row"' + clickAttr + '><span class="dash-bar-label">' + escHtml(e[0]) + '</span>';
                h += '<div class="dash-bar-track"><div class="dash-bar-fill ' + colors[i % colors.length] + '" style="width:' + pct + '%"></div></div>';
                h += '<span class="dash-bar-num">' + e[1] + '</span></div>';
            });
        }
        return h + '</div></div>';
    }

    /* ─── Grid ─── */
    var tableSort = { col: 'id', dir: 'asc' };
    var editingId = null; // book id being inline-edited

    function btCollect(field) {
        var vals = {};
        allBooks.forEach(function (b) {
            if (field === 'yazarlar') { (b.yazarlar || []).forEach(function (y) { if (y) vals[y] = 1; }); }
            else if (b[field]) vals[b[field]] = 1;
        });
        return Object.keys(vals).sort(function (a, b) { return a.localeCompare(b, 'tr'); });
    }

    function btSelect(id, options, current, ph) {
        var h = '<select class="bt-sel" id="' + id + '"><option value="">' + ph + '</option>';
        var found = false;
        options.forEach(function (o) { if (o === current) found = true; h += '<option' + (o === current ? ' selected' : '') + '>' + escHtml(o) + '</option>'; });
        if (current && !found) h += '<option selected>' + escHtml(current) + '</option>';
        return h + '</select>';
    }

    function renderGrid(filtered) {
        // Sort
        var col = tableSort.col, dir = tableSort.dir;
        filtered = filtered.slice().sort(function (a, b) {
            var av, bv;
            if (col === 'id') { av = parseInt(a.id) || 0; bv = parseInt(b.id) || 0; }
            else if (col === 'ders') { av = a.ders || ''; bv = b.ders || ''; }
            else if (col === 'yazar') { av = (a.yazarlar || [])[0] || ''; bv = (b.yazarlar || [])[0] || ''; }
            else if (col === 'sinif') { av = parseInt(a.sinif) || 99; bv = parseInt(b.sinif) || 99; }
            else if (col === 'okul') { av = a.okul || ''; bv = b.okul || ''; }
            else if (col === 'yayinevi') { av = a.yayinevi || ''; bv = b.yayinevi || ''; }
            else if (col === 'durum') { av = a.durumu || ''; bv = b.durumu || ''; }
            else if (col === 'ilerleme') { av = getBookPct(a); bv = getBookPct(b); }
            else if (col === 'icerik') { av = getBookIcerikTotal(a); bv = getBookIcerikTotal(b); }
            else if (col === 'gorev') { av = getBookGorevCount(a); bv = getBookGorevCount(b); }
            else { av = 0; bv = 0; }
            var cmp = typeof av === 'string' ? av.localeCompare(bv, 'tr') : av - bv;
            return dir === 'desc' ? -cmp : cmp;
        });

        var canEdit = (window.eitMyPerms || {}).yonetim || (window.eitMyPerms || {}).kitap_duzenle;

        var cols = [
            { key: 'id', label: '#', w: '50px' },
            { key: 'ders', label: 'Ders', w: '' },
            { key: 'sinif', label: 'S\u0131n\u0131f', w: '70px' },
            { key: 'yazar', label: 'Yazar', w: '' },
            { key: 'okul', label: 'Okul', w: '90px' },
            { key: 'yayinevi', label: 'Yay\u0131nevi', w: '110px' },
            { key: 'durum', label: 'Durum', w: '100px' },
            { key: 'icerik', label: '\u0130\u00e7erik', w: '70px' },
            { key: 'ilerleme', label: '\u0130lerleme', w: '70px' },
            { key: 'gorev', label: 'G\u00f6rev', w: '65px' }
        ];
        if (canEdit) cols.push({ key: '_edit', label: '', w: '44px' });

        // Toolbar with add button
        var h = '';
        if (canEdit) {
            h += '<div class="bt-toolbar"><span class="bt-count">' + filtered.length + ' kitap</span>';
            h += '<button class="bt-add-btn" id="btAddBook"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Kitap Ekle</button></div>';
        }

        h += '<table class="bt"><thead><tr>';
        cols.forEach(function (c) {
            var arrow = tableSort.col === c.key ? (tableSort.dir === 'asc' ? ' \u25b2' : ' \u25bc') : '';
            var wAttr = c.w ? ' style="width:' + c.w + '"' : '';
            h += '<th class="bt-sortable" data-col="' + c.key + '"' + wAttr + '>' + c.label + '<span class="bt-arrow">' + arrow + '</span></th>';
        });
        h += '</tr></thead><tbody>';

        // New book row at top
        if (editingId === '__new__') {
            var nb = { id: String(btNextId()), ders: '', sinif: '', okul: '', yayinevi: '', yazarlar: [], durumu: '\u0130\u015flemde', baslik: '' };
            h += renderEditRow(nb, true);
        }

        filtered.forEach(function (book) {
            var isEditing = editingId === book.id;

            if (isEditing) {
                h += renderEditRow(book, canEdit);
                return;
            }

            var isTeslim = book.durumu === 'TTKB Onay\u0131';
            var durumClass = isTeslim ? 'bt-st-onay' : (book.durumu === 'Havuzda' ? 'bt-st-bekleniyor' : (book.durumu === 'Ask\u0131da' ? 'bt-st-askida' : (book.durumu === 'Pasif' ? 'bt-st-pasif' : 'bt-st-islemde')));
            var icStats = getBookIcerikStats(book);
            var pctVal = icStats.total > 0 ? Math.round((icStats.tamamlandi / icStats.total) * 100) : 0;
            var yazarStr = (book.yazarlar || []).slice(0, 2).join(', ');
            if ((book.yazarlar || []).length > 2) yazarStr += ' +' + (book.yazarlar.length - 2);

            h += '<tr class="bt-row" data-book-id="' + book.id + '">';
            h += '<td class="bt-id">' + book.id + '</td>';
            h += '<td class="bt-ders">' + escHtml(book.ders) + '</td>';
            h += '<td><span class="bt-tag bt-tag-sinif">' + escHtml(book.sinif) + '</span></td>';
            h += '<td class="bt-yazar">' + escHtml(yazarStr) + '</td>';
            h += '<td><span class="bt-tag bt-tag-okul">' + escHtml(book.okul) + '</span></td>';
            h += '<td class="bt-yayinevi">' + escHtml(book.yayinevi) + '</td>';
            h += '<td><span class="bt-durum ' + durumClass + '">' + escHtml(book.durumu || '\u0130\u015flemde') + '</span></td>';

            // Icerik (tamamlanan/toplam)
            h += '<td class="bt-icerik-count">';
            if (icStats.total > 0) {
                h += '<span class="bt-icerik-frac"><b>' + icStats.tamamlandi + '</b>/' + icStats.total + '</span>';
            } else { h += '<span class="bt-no-ic">\u2014</span>'; }
            h += '</td>';

            // Ilerleme (%)
            h += '<td class="bt-ilerleme">';
            if (icStats.total > 0) {
                var pctCls = pctVal === 100 ? 'bt-pct-done' : (pctVal >= 50 ? 'bt-pct-mid' : 'bt-pct-low');
                h += '<span class="bt-pct ' + pctCls + '">' + pctVal + '%</span>';
            } else { h += '<span class="bt-no-ic">\u2014</span>'; }
            h += '</td>';

            // Gorev
            var gc = getBookGorevCount(book);
            h += '<td class="bt-gorev-cell">';
            if (gc.total > 0) {
                h += '<span class="bt-gorev' + (gc.gecikli > 0 ? ' bt-gorev-gecikli' : '') + '">' + gc.devam;
                if (gc.gecikli > 0) h += '<span class="bt-gorev-warn">!' + gc.gecikli + '</span>';
                h += '</span>';
            } else { h += '<span class="bt-no-ic">\u2014</span>'; }
            h += '</td>';
            if (canEdit) {
                var nc = (book.notlar || []).length;
                h += '<td class="bt-edit-cell">';
                h += '<button class="bt-note-btn' + (nc > 0 ? ' bt-note-has' : '') + '" data-book-id="' + book.id + '" title="Kitap Notlar\u0131">';
                h += '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>';
                if (nc > 0) h += '<span class="bt-note-count">' + nc + '</span>';
                h += '</button>';
                h += '<button class="bt-edit-btn" data-book-id="' + book.id + '" title="D\u00fczenle"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>';
                h += '</td>';
            }
            h += '</tr>';
        });

        h += '</tbody></table>';

        $grid.innerHTML = h;
        bindTableEvents(filtered, canEdit);
    }

    function renderEditRow(book, canEdit) {
        var dersler = btCollect('ders'), siniflar = btCollect('sinif'), okullar = btCollect('okul'), yayinevleri = btCollect('yayinevi');
        var h = '<tr class="bt-row bt-editing" data-book-id="' + book.id + '">';
        h += '<td><input class="bt-inp" id="btEId" value="' + escHtml(book.id) + '" style="width:44px"></td>';
        h += '<td>' + btSelect('btEDers', dersler, book.ders, 'Ders...') + '</td>';
        h += '<td>' + btSelect('btESinif', siniflar, book.sinif, 'S\u0131n\u0131f...') + '</td>';
        h += '<td><input class="bt-inp" id="btEYazar" value="' + escHtml((book.yazarlar || []).join(', ')) + '" placeholder="Virg\u00fclle ay\u0131r" style="width:100%"></td>';
        h += '<td>' + btSelect('btEOkul', okullar, book.okul, 'Okul...') + '</td>';
        h += '<td>' + btSelect('btEYayinevi', yayinevleri, book.yayinevi, 'Yay\u0131nevi...') + '</td>';
        h += '<td><select class="bt-sel" id="btEDurum">';
        kitapDurumlari.forEach(function (d) { h += '<option' + ((book.durumu || '\u0130\u015flemde') === d ? ' selected' : '') + '>' + d + '</option>'; });
        h += '</select></td>';
        h += '<td></td><td></td><td></td>';
        if (canEdit) {
            h += '<td class="bt-edit-cell" style="white-space:nowrap">';
            h += '<button class="bt-save-btn" title="Kaydet"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg></button>';
            h += '<button class="bt-cancel-btn" title="Vazge\u00e7"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>';
            h += '</td>';
        }
        h += '</tr>';
        return h;
    }

    function btNextId() {
        var max = 0;
        allBooks.forEach(function (b) { var n = parseInt(b.id) || 0; if (n > max) max = n; });
        return max + 1;
    }

    function btSaveEdit() {
        var isNew = editingId === '__new__';
        var book;
        if (isNew) {
            book = { uniteler: [], notlar: [], olusturmaTarihi: new Date().toISOString().split('T')[0] };
        } else {
            book = allBooks.filter(function (b) { return b.id === editingId; })[0];
            if (!book) return;
        }
        book.id = (document.getElementById('btEId').value || '').trim();
        book.ders = document.getElementById('btEDers').value || '';
        book.sinif = document.getElementById('btESinif').value || '';
        book.okul = document.getElementById('btEOkul').value || '';
        book.yayinevi = document.getElementById('btEYayinevi').value || '';
        book.durumu = document.getElementById('btEDurum').value || '\u0130\u015flemde';
        book.yazarlar = (document.getElementById('btEYazar').value || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
        book.baslik = book.id + '-' + book.ders + '-' + (parseInt(book.sinif) || '');

        if (!book.ders) { alert('Ders se\u00e7imi zorunlu'); return; }
        if (isNew) allBooks.push(book);

        editingId = null;
        buildSidebar();
        render();
        saveToServer();
    }

    function bindTableEvents(filtered, canEdit) {
        // Sort
        $grid.querySelectorAll('.bt-sortable').forEach(function (th) {
            th.addEventListener('click', function () {
                var c = this.dataset.col;
                if (tableSort.col === c) tableSort.dir = tableSort.dir === 'asc' ? 'desc' : 'asc';
                else { tableSort.col = c; tableSort.dir = 'asc'; }
                renderGrid(filtered);
            });
        });

        // Row click -> detail
        $grid.querySelectorAll('.bt-row:not(.bt-editing)').forEach(function (row) {
            row.addEventListener('click', function (e) {
                if (e.target.closest('.bt-tag, .bt-edit-btn, .bt-note-btn')) return;
                var bid = this.dataset.bookId;
                var book = allBooks.filter(function (b) { return b.id === bid; })[0];
                if (book && window.eitOpenDetail) window.eitOpenDetail(book);
            });
        });

        // Edit button -> inline edit
        if (canEdit) {
            // Note button -> popup
            $grid.querySelectorAll('.bt-note-btn').forEach(function (btn) {
                btn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    var bid = this.dataset.bookId;
                    var book = allBooks.filter(function (b) { return b.id === bid; })[0];
                    if (book) showBookNotePopup(book, filtered);
                });
            });

            $grid.querySelectorAll('.bt-edit-btn').forEach(function (btn) {
                btn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    editingId = this.dataset.bookId;
                    renderGrid(filtered);
                });
            });

            // Add book
            var addBtn = document.getElementById('btAddBook');
            if (addBtn) addBtn.addEventListener('click', function () {
                editingId = '__new__';
                renderGrid(filtered);
            });

            // Save / Cancel
            var saveBtn = $grid.querySelector('.bt-save-btn');
            if (saveBtn) saveBtn.addEventListener('click', function (e) { e.stopPropagation(); btSaveEdit(); });
            var cancelBtn = $grid.querySelector('.bt-cancel-btn');
            if (cancelBtn) cancelBtn.addEventListener('click', function (e) { e.stopPropagation(); editingId = null; renderGrid(filtered); });

            // Enter/Escape in edit row
            $grid.querySelectorAll('.bt-editing .bt-inp, .bt-editing .bt-sel').forEach(function (inp) {
                inp.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter') btSaveEdit();
                    if (e.key === 'Escape') { editingId = null; renderGrid(filtered); }
                });
            });
        }

        // Tag clicks -> filter
        $grid.querySelectorAll('.bt-tag-sinif').forEach(function (tag) {
            tag.addEventListener('click', function (e) { e.stopPropagation(); addFilter('sinif', tag.textContent); buildSidebar(); render(); });
        });
        $grid.querySelectorAll('.bt-tag-okul').forEach(function (tag) {
            tag.addEventListener('click', function (e) { e.stopPropagation(); addFilter('okul', tag.textContent); buildSidebar(); render(); });
        });
    }

    function getBookPct(book) {
        var s = getBookIcerikStats(book);
        return s.total > 0 ? Math.round((s.tamamlandi / s.total) * 100) : -1;
    }

    function getBookIcerikTotal(book) {
        var n = 0;
        (book.uniteler || []).forEach(function (u) { n += (u.icerikler || []).length; });
        return n;
    }

    function getBookGorevCount(book) {
        var devam = 0, gecikli = 0, total = 0;
        (book.uniteler || []).forEach(function (u) {
            (u.icerikler || []).forEach(function (ic) {
                if (ic.gorev && ic.gorev.durum && ic.gorev.durum !== 'Tamamland\u0131') {
                    total++; devam++;
                    if (ic.gorev.sonTarih && new Date() > new Date(ic.gorev.sonTarih)) gecikli++;
                }
            });
        });
        return { total: total, devam: devam, gecikli: gecikli };
    }

    function getBookIcerikStats(book) {
        var s = { total: 0, gelmedi: 0, inceleme: 0, uretimde: 0, onaylandi: 0, postProd: 0, tamamlandi: 0, gecikli: 0 };
        var incelemeAsamalar = ['\u0130\u00e7erik Geldi', '\u00d6n \u0130nceleme', 'T\u00fcrk\u00e7e Okuma'];
        var uretimAsamalar = ['\u00dcretime Ba\u015fland\u0131', '\u00dcretim Devam Ediyor'];
        var postProdAsamalar = ['\u00d6n Kontrol', 'Scorm V2', 'Tashih', 'Son Kontrol'];
        (book.uniteler || []).forEach(function (u) {
            (u.icerikler || []).forEach(function (ic) {
                s.total++;
                var d = ic.durum || '\u0130\u00e7erik Gelmedi';
                if (d === 'Tamamland\u0131') s.tamamlandi++;
                else if (postProdAsamalar.indexOf(d) > -1) {
                    s.postProd++;
                    if (ic.gorev && ic.gorev.sonTarih && new Date() > new Date(ic.gorev.sonTarih) && ic.gorev.durum !== 'Tamamland\u0131') s.gecikli++;
                }
                else if (d === 'E-\u0130\u00e7erik \u00dcretim Tamamland\u0131') s.onaylandi++;
                else if (uretimAsamalar.indexOf(d) > -1) {
                    s.uretimde++;
                    if (ic.gorev && ic.gorev.sonTarih && new Date() > new Date(ic.gorev.sonTarih) && ic.gorev.durum !== 'Tamamland\u0131') s.gecikli++;
                }
                else if (d === '\u0130\u00e7erik Gelmedi') s.gelmedi++;
                else if (incelemeAsamalar.indexOf(d) > -1) s.inceleme++;
                else s.inceleme++;
            });
        });
        return s;
    }

    function getOkulClass(okul) {
        if (okul === 'İlkokul') return 'meta-okul-ilkokul';
        if (okul === 'Ortaokul') return 'meta-okul-ortaokul';
        return 'meta-okul-lise';
    }

    function createCard(book) {
        var card = document.createElement('div');
        var isTeslim = book.durumu === 'TTKB Onay\u0131';
        card.className = 'book-card' + (isTeslim ? ' book-card-teslim' : '');
        var okulClass = getOkulClass(book.okul);

        var h = '';
        if (isTeslim) h += '<div class="book-card-stamp">TTKB ONAYI</div>';
        h += '<div class="book-card-inner">';

        // Left column
        h += '<div class="book-card-left">';
        h += '<div class="book-card-header"><span class="book-code">#' + book.id + '</span></div>';
        h += '<div class="book-title">' + escHtml(book.ders || book.baslik) + '</div>';
        h += '<div class="book-ders">' + escHtml(book.baslik) + '</div>';
        if ((book.yazarlar || []).length) {
            h += '<div class="book-authors">';
            book.yazarlar.forEach(function (a) { h += '<span class="author-tag">' + escHtml(a) + '</span>'; });
            h += '</div>';
        }
        h += '</div>';

        // Right column - meta tags
        h += '<div class="book-card-right">';
        if (book.sinif) h += '<span class="meta-tag meta-sinif">' + escHtml(book.sinif) + '</span>';
        if (book.okul) h += '<span class="meta-tag ' + okulClass + '">' + escHtml(book.okul) + '</span>';
        if (book.yayinevi) h += '<span class="meta-tag meta-yayinevi">' + escHtml(book.yayinevi) + '</span>';
        if (book.tarih) h += '<span class="meta-tag meta-tarih">' + escHtml(book.tarih) + '</span>';
        h += '</div>';

        h += '</div>'; // end inner

        // E-icerik progress bar + asama detaylari
        var icStats = getBookIcerikStats(book);
        if (icStats.total > 0) {
            var pct = function (n) { return Math.round((n / icStats.total) * 100); };
            var tamamPct = pct(icStats.tamamlandi);
            var postPct = pct(icStats.postProd);
            var onayPct = pct(icStats.onaylandi);
            var uretimPct = pct(icStats.uretimde);
            var incelemePct = pct(icStats.inceleme);
            var bekleyenPct = Math.max(0, 100 - tamamPct - postPct - onayPct - uretimPct - incelemePct);
            h += '<div class="book-ic-progress">';
            h += '<div class="book-ic-bar">';
            if (tamamPct > 0) h += '<div class="book-ic-seg book-ic-complete" style="width:' + tamamPct + '%"></div>';
            if (postPct > 0) h += '<div class="book-ic-seg book-ic-post" style="width:' + postPct + '%"></div>';
            if (onayPct > 0) h += '<div class="book-ic-seg book-ic-done" style="width:' + onayPct + '%"></div>';
            if (uretimPct > 0) h += '<div class="book-ic-seg book-ic-prod" style="width:' + uretimPct + '%"></div>';
            if (incelemePct > 0) h += '<div class="book-ic-seg book-ic-review" style="width:' + incelemePct + '%"></div>';
            if (bekleyenPct > 0) h += '<div class="book-ic-seg book-ic-wait" style="width:' + bekleyenPct + '%"></div>';
            h += '</div>';
            h += '<span class="book-ic-text">' + icStats.tamamlandi + '/' + icStats.total + '</span>';
            h += '</div>';
            // Asama detay etiketleri (12 asama, hepsi gorunur)
            var asamaLabels = [
                { key: '\u0130\u00e7erik Gelmedi',                       c: '#ef4444' },
                { key: '\u0130\u00e7erik Geldi',                         c: '#f97316' },
                { key: '\u00d6n \u0130nceleme',                          c: '#f59e0b' },
                { key: 'T\u00fcrk\u00e7e Okuma',                        c: '#eab308' },
                { key: '\u00dcretime Ba\u015fland\u0131',                c: '#3b82f6' },
                { key: '\u00dcretim Devam Ediyor',                       c: '#6366f1' },
                { key: 'E-\u0130\u00e7erik \u00dcretim Tamamland\u0131', c: '#8b5cf6' },
                { key: '\u00d6n Kontrol',                                c: '#06b6d4' },
                { key: 'Scorm V2',                                       c: '#0ea5e9' },
                { key: 'Tashih',                                         c: '#ec4899' },
                { key: 'Son Kontrol',                                    c: '#14b8a6' },
                { key: 'Tamamland\u0131',                                c: '#22c55e' }
            ];
            var asamaCounts = {};
            (book.uniteler || []).forEach(function (u) {
                (u.icerikler || []).forEach(function (ic) {
                    var d = ic.durum || '\u0130\u00e7erik Gelmedi';
                    asamaCounts[d] = (asamaCounts[d] || 0) + 1;
                });
            });
            h += '<div class="book-ic-legend">';
            asamaLabels.forEach(function (a) {
                var n = asamaCounts[a.key] || 0;
                if (n > 0) {
                    h += '<span class="book-ic-leg book-ic-leg-active" style="background:' + a.c + '18;color:' + a.c + '">' + escHtml(a.key) + ' <b>' + n + '</b></span>';
                } else {
                    h += '<span class="book-ic-leg book-ic-leg-empty">' + escHtml(a.key) + '</span>';
                }
            });
            h += '</div>';
        }

        // Footer - teslim toggle
        h += '<div class="book-card-footer">';
        h += '<div class="footer-left"></div>';

        if (isTeslim) {
            h += '<span class="teslim-badge">TTKB Onay\u0131</span>';
        } else if (icStats.total > 0 && icStats.tamamlandi === icStats.total) {
            h += '<label class="teslim-toggle" title="TTKB Onay\u0131 olarak i\u015faretle"><input type="checkbox" class="teslim-check" data-book-id="' + book.id + '"><span class="teslim-label">TTKB Onayla</span></label>';
        }

        h += '</div>';

        card.innerHTML = h;

        // Teslim toggle change
        var tCheck = card.querySelector('.teslim-check');
        if (tCheck) tCheck.addEventListener('change', function (e) {
            e.stopPropagation();
            var bookId = this.dataset.bookId;
            for (var i = 0; i < allBooks.length; i++) {
                if (allBooks[i].id === bookId) {
                    allBooks[i].durumu = this.checked ? 'TTKB Onay\u0131' : '\u0130\u015flemde';
                    break;
                }
            }
            buildSidebar();
            render();
            saveToServer();
        });

        bindCardClicks(card, book);
        return card;
    }

    function bindCardClicks(card, book) {
        // Card click -> open detail panel
        card.addEventListener('click', function (e) {
            // Don't open if clicking on interactive elements
            if (e.target.closest('select, .meta-tag, .author-tag, .ap-icon-btn, button')) return;
            if (window.eitOpenDetail) window.eitOpenDetail(book);
        });
        card.style.cursor = 'pointer';
        card.querySelectorAll('.meta-tag').forEach(function (tag) {
            tag.addEventListener('click', function (e) {
                e.stopPropagation();
                var text = tag.textContent;
                if (tag.classList.contains('meta-sinif')) addFilter('sinif', text);
                else if (tag.classList.contains('meta-okul-ilkokul') || tag.classList.contains('meta-okul-ortaokul') || tag.classList.contains('meta-okul-lise')) addFilter('okul', text);
                else if (tag.classList.contains('meta-yayinevi')) addFilter('yayinevi', text);
                buildSidebar();
                render();
            });
        });
        card.querySelectorAll('.author-tag').forEach(function (tag) {
            tag.addEventListener('click', function (e) {
                e.stopPropagation();
                addFilter('yazar', tag.textContent);
                buildSidebar();
                render();
            });
        });
    }

    /* ─── Helpers ─── */
    function escHtml(str) {
        if (str == null) str = '';
        var d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    }

    function escAttr(str) {
        return String(str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;');
    }

    /* ─── Auto-save to server ─── */
    var saveTimer = null;
    window.eitShowToast = showSaveToast;
    function showSaveToast(msg, isError) {
        var old = document.getElementById('eitSaveToast');
        if (old) old.remove();
        var t = document.createElement('div');
        t.id = 'eitSaveToast';
        t.textContent = msg;
        if (isError) t.classList.add('toast-error');
        document.body.appendChild(t);
        requestAnimationFrame(function () { t.style.opacity = '1'; });
        setTimeout(function () { t.style.opacity = '0'; setTimeout(function () { t.remove(); }, 300); }, 3000);
    }
    function saveToServer() {
        if (saveTimer) clearTimeout(saveTimer);
        saveTimer = setTimeout(function () {
            var xhr = new XMLHttpRequest();
            xhr.open('POST', (window.eitAjax || {}).url || '/wp-admin/admin-ajax.php');
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            xhr.timeout = 15000;
            xhr.onload = function () {
                if (xhr.status === 200) {
                    try {
                        var res = JSON.parse(xhr.responseText);
                        if (res.success) {
                            if (typeof res.data.version !== 'undefined') dataVersion = res.data.version;
                            showSaveToast('Kaydedildi', false);
                        } else {
                            showSaveToast('Kayıt hatası: ' + (res.data || 'Bilinmeyen'), true);
                        }
                    } catch (e) { showSaveToast('Kayıt hatası: Geçersiz yanıt', true); }
                } else {
                    showSaveToast('Kayıt hatası: HTTP ' + xhr.status, true);
                }
            };
            xhr.onerror = function () { showSaveToast('Kayıt başarısız: ağ hatası', true); };
            xhr.ontimeout = function () { showSaveToast('Kayıt zaman aşımı', true); };
            xhr.send('action=eit_save_books&nonce=' + ((window.eitAjax || {}).nonce || '') + '&version=' + dataVersion + '&books=' + encodeURIComponent(JSON.stringify(allBooks)) + '&atananlar=' + encodeURIComponent(JSON.stringify(allAtananlar)));
        }, 500);
    }
    window.eitSave = saveToServer;
    window.eitGetDataVersion = function () { return dataVersion; };
    window.eitSetDataVersion = function (v) { dataVersion = v; };

    /* ─── Kitap Not Popup ─── */
    function showBookNotePopup(book, filtered) {
        if (!book.notlar) book.notlar = [];
        var notEtiketleri = [
            { id: 'bilgi', label: 'Bilgi' },
            { id: 'uyari', label: 'Uyar\u0131' },
            { id: 'sorun', label: 'Sorun' },
            { id: 'cozum', label: '\u00c7\u00f6z\u00fcm' }
        ];

        var overlay = document.createElement('div');
        overlay.className = 'bn-overlay';

        function renderPopup() {
            var h = '<div class="bn-popup">';
            h += '<div class="bn-header">';
            h += '<div class="bn-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> #' + escHtml(book.id) + ' ' + escHtml(book.ders) + ' \u2014 Notlar</div>';
            h += '<button class="bn-close">\u00d7</button>';
            h += '</div>';

            // Not ekleme
            h += '<div class="bn-add">';
            h += '<textarea class="bn-input" id="bnText" placeholder="Not yaz\u0131n..."></textarea>';
            h += '<div class="bn-add-row">';
            h += '<select class="bn-tag-sel" id="bnTag">';
            notEtiketleri.forEach(function (e) { h += '<option value="' + e.id + '">' + e.label + '</option>'; });
            h += '</select>';
            h += '<label class="bn-img-label" title="Resim ekle"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg><input type="file" accept="image/*" id="bnFile" style="display:none"></label>';
            h += '<span class="bn-file-name" id="bnFileName"></span>';
            h += '<button class="bn-add-btn" id="bnAddBtn">Ekle</button>';
            h += '</div></div>';

            // Not listesi
            h += '<div class="bn-list">';
            if (book.notlar.length) {
                book.notlar.slice().reverse().forEach(function (n, ri) {
                    var idx = book.notlar.length - 1 - ri;
                    var tagCls = 'bn-tag-' + (n.etiket || 'bilgi');
                    var tagLbl = (notEtiketleri.find(function (e) { return e.id === n.etiket; }) || {}).label || 'Bilgi';
                    h += '<div class="bn-note">';
                    h += '<div class="bn-note-top"><span class="bn-note-date">' + escHtml(n.tarih) + '</span>';
                    h += '<span class="bn-note-tag ' + tagCls + '">' + tagLbl + '</span>';
                    if (n.yazar) h += '<span class="bn-note-author">' + escHtml(n.yazar) + '</span>';
                    h += '<button class="bn-note-del" data-idx="' + idx + '">\u00d7</button></div>';
                    h += '<div class="bn-note-text">' + escHtml(n.metin) + '</div>';
                    if (n.resim) h += '<a class="bn-note-img" href="' + escHtml(n.resim) + '" target="_blank"><img src="' + escHtml(n.resim) + '"></a>';
                    h += '</div>';
                });
            } else {
                h += '<div class="bn-empty">Hen\u00fcz not yok</div>';
            }
            h += '</div></div>';
            overlay.innerHTML = h;
        }

        function bindPopup() {
            overlay.querySelector('.bn-close').addEventListener('click', close);
            overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });

            var fileInp = document.getElementById('bnFile');
            var fileName = document.getElementById('bnFileName');
            if (fileInp) fileInp.addEventListener('change', function () {
                fileName.textContent = this.files.length ? this.files[0].name : '';
            });

            document.getElementById('bnAddBtn').addEventListener('click', function () {
                var text = document.getElementById('bnText').value.trim();
                var file = fileInp && fileInp.files.length ? fileInp.files[0] : null;
                if (!text && !file) return;
                var now = new Date();
                var notObj = {
                    tarih: now.toLocaleDateString('tr-TR') + ' ' + now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
                    etiket: document.getElementById('bnTag').value,
                    metin: text,
                    yazar: (window.eitUser || {}).name || ''
                };
                if (file) {
                    var reader = new FileReader();
                    reader.onload = function (ev) {
                        notObj.resim = ev.target.result;
                        book.notlar.push(notObj);
                        refresh();
                        uploadImage(file, function (url) {
                            if (url) {
                                notObj.resim = url;
                                if (window.eitSave) window.eitSave();
                            }
                        });
                    };
                    reader.readAsDataURL(file);
                } else {
                    book.notlar.push(notObj);
                    refresh();
                }
            });

            document.getElementById('bnText').addEventListener('keydown', function (e) {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); document.getElementById('bnAddBtn').click(); }
            });

            overlay.querySelectorAll('.bn-note-del').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    book.notlar.splice(parseInt(this.dataset.idx), 1);
                    refresh();
                });
            });
        }

        function refresh() {
            renderPopup();
            bindPopup();
            renderGrid(filtered);
            if (window.eitSave) window.eitSave();
        }

        function close() {
            overlay.remove();
        }

        function uploadImage(file, cb) {
            if (!window.eitAjax) { cb(''); return; }
            var fd = new FormData();
            fd.append('action', 'eit_upload_note_image');
            fd.append('nonce', window.eitAjax.nonce || '');
            fd.append('file', file);
            var xhr = new XMLHttpRequest();
            xhr.open('POST', window.eitAjax.url);
            xhr.onload = function () {
                try { var r = JSON.parse(xhr.responseText); cb(r.data && r.data.url ? r.data.url : ''); }
                catch (_) { cb(''); }
            };
            xhr.onerror = function () { cb(''); };
            xhr.send(fd);
        }

        renderPopup();
        document.body.appendChild(overlay);
        bindPopup();
        document.getElementById('bnText').focus();
    }

    /* ─── Browser History (SPA back/forward) ─── */
    var historyReady = false;
    var navigatingFromPopstate = false;
    function eitPushState(view, data) {
        if (!historyReady || navigatingFromPopstate) return;
        history.pushState({ view: view, data: data || null }, '', location.pathname + location.search);
    }
    window.eitPushState = eitPushState;

    function eitGoHome() {
        closeInlineViews();
        var dp = document.getElementById('detailPage');
        if (dp) { dp.style.display = 'none'; dp.innerHTML = ''; }
        if (window.eitRefresh) window.eitRefresh();
    }

    window.addEventListener('popstate', function (e) {
        navigatingFromPopstate = true;
        var state = e.state;
        // Guard state: dashboard'dan geri basildi, tekrar dashboard'a don
        if (state && state.view === 'guard') {
            history.pushState({ view: 'dashboard' }, '', location.pathname + location.search);
            navigatingFromPopstate = false;
            return;
        }
        if (!state || state.view === 'dashboard') {
            eitGoHome();
        } else if (state.view === 'detail' && state.data) {
            var book = allBooks.find(function (b) { return b.id === state.data; });
            if (book && window.eitOpenDetail) window.eitOpenDetail(book, true);
            else eitGoHome();
        } else if (state.view === 'admin') {
            eitGoHome();
            var abtn = document.getElementById('adminPanelBtn');
            if (abtn) abtn.click();
        } else if (state.view === 'reports') {
            eitGoHome();
            var rbtn = document.getElementById('reportsBtn');
            if (rbtn) rbtn.click();
        } else if (state.view === 'gorevler') {
            eitGoHome();
            var gbtn = document.getElementById('gorevlerBtn');
            if (gbtn) gbtn.click();
        } else if (state.view === 'criteria') {
            eitGoHome();
            var cbtn = document.getElementById('criteriaHeaderBtn');
            if (cbtn) cbtn.click();
        } else if (state.view === 'eicerik') {
            eitGoHome();
            var ebtn = document.getElementById('eicerikTablosuBtn');
            if (ebtn) ebtn.click();
        } else {
            eitGoHome();
        }
        navigatingFromPopstate = false;
    });

    // Ilk sayfa yuklemesinde guard state + dashboard state kaydet
    // Boylece geri basildiginda wp-admin'e gitmez, dashboard'da kalir
    setTimeout(function () {
        history.replaceState({ view: 'guard' }, '', location.pathname + location.search);
        history.pushState({ view: 'dashboard' }, '', location.pathname + location.search);
        historyReady = true;
    }, 300);

})();
