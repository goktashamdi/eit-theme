/**
 * EIT E-İçerik Tablosu v2.0
 * Modern UI + Kitaplara Aktarma + JSON Yönetimi
 */
(function () {
    'use strict';

    var $view, $btn;
    var activeTab = 'tablo';
    var activeDers = '';
    var searchQuery = '';
    var aktarSel = {};

    /* ─── Helpers ─── */
    function esc(s) {
        if (!s) return '';
        var d = document.createElement('div');
        d.textContent = String(s);
        return d.innerHTML.replace(/"/g, '&quot;');
    }
    function tablo() { return window.eitEicerikTablosu || []; }
    function books() { return window.eitAllBooks || []; }
    function canManage() { return typeof eitUserCaps !== 'undefined' && eitUserCaps.eit_manage; }

    function getSubjects() {
        var map = {};
        tablo().forEach(function (r) { if (r.ders) { if (!map[r.ders]) map[r.ders] = 0; map[r.ders]++; } });
        return Object.keys(map).sort(function (a, b) {
            var ma = a.match(/^(.+?)\s+(\d+)$/);
            var mb = b.match(/^(.+?)\s+(\d+)$/);
            var nameA = ma ? ma[1] : a;
            var nameB = mb ? mb[1] : b;
            var cmp = nameA.localeCompare(nameB, 'tr');
            if (cmp !== 0) return cmp;
            var numA = ma ? parseInt(ma[2]) : 0;
            var numB = mb ? parseInt(mb[2]) : 0;
            return numA - numB;
        }).map(function (k) {
            return { name: k, count: map[k] };
        });
    }

    /* ─── MEB Eşleştirme (global, cached) ─── */
    var _mebMapCache = null;
    var _mebMapSrc = null;

    function getMebMap() {
        var t = tablo();
        if (_mebMapSrc === t && _mebMapCache) return _mebMapCache;
        var map = {};
        t.forEach(function (r) { if (r.ders) map[r.ders] = 1; });
        _mebMapCache = { map: map, keys: Object.keys(map) };
        _mebMapSrc = t;
        return _mebMapCache;
    }

    function invalidateMebCache() { _mebMapCache = null; _mebMapSrc = null; _bookMatchCache = null; }

    function extractSinifNo(sinif) {
        if (!sinif) return '';
        var m = sinif.match(/(\d+)/);
        return m ? m[1] : '';
    }

    function findMebDers(bookDers, bookSinif) {
        if (!tablo().length || !bookDers) return null;
        var sinifNo = extractSinifNo(bookSinif);
        var c = getMebMap();

        var exact = bookDers + (sinifNo ? ' ' + sinifNo : '');
        if (c.map[exact]) return exact;

        var clean = bookDers.replace(/\s*\(.*?\)\s*/g, '').trim();
        exact = clean + (sinifNo ? ' ' + sinifNo : '');
        if (c.map[exact]) return exact;

        var matches = c.keys.filter(function (d) {
            if (!sinifNo) return d.indexOf(clean) === 0;
            return d.indexOf(clean) === 0 && d.match(new RegExp('\\b' + sinifNo + '$'));
        });
        return matches.length === 1 ? matches[0] : null;
    }

    function importFromMeb(mebDers) {
        var rows = tablo().filter(function (r) { return r.ders === mebDers; });
        if (!rows.length) return [];

        var uniteMap = {}, uniteOrder = [];
        rows.forEach(function (r) {
            var u = r.unite || 'Genel';
            if (!uniteMap[u]) { uniteMap[u] = []; uniteOrder.push(u); }
            uniteMap[u].push(r);
        });

        return uniteOrder.map(function (uAd) {
            var icerikler = [];
            // Zorunlu: Ünite Özet E-İçeriği
            icerikler.push({ tip: 'ozet', ad: '\u00dcnite \u00d6zet E-\u0130\u00e7eri\u011fi', mebTur: '', tur: '', aciklama: '', atanan: '', durum: '\u0130\u00e7erik Gelmedi', notlar: [] });
            // MEB kazanımları
            uniteMap[uAd].forEach(function (r) {
                icerikler.push({
                    tip: 'eicerik', ad: r.kazanim || '', mebTur: r.tur || '', tur: '', aciklama: r.aciklama || '',
                    atanan: '', durum: '\u0130\u00e7erik Gelmedi', notlar: []
                });
            });
            // Zorunlu: Ölçme ve Değerlendirme
            icerikler.push({ tip: 'olcme', ad: '\u00d6l\u00e7me ve De\u011ferlendirme Etkinli\u011fi', mebTur: '', tur: '', aciklama: '', atanan: '', durum: '\u0130\u00e7erik Gelmedi', notlar: [] });
            return { ad: uAd, icerikler: icerikler };
        });
    }

    // Book match cache: mebDers -> [book indices]
    var _bookMatchCache = null;
    function getBookMatchMap() {
        if (_bookMatchCache) return _bookMatchCache;
        var map = {};
        books().forEach(function (b, i) {
            var match = findMebDers(b.ders, b.sinif);
            if (match) {
                if (!map[match]) map[match] = [];
                map[match].push(i);
            }
        });
        _bookMatchCache = map;
        return map;
    }

    function findMatchingBooks(mebDers) {
        var map = getBookMatchMap();
        var idxs = map[mebDers] || [];
        var allB = books();
        return idxs.map(function (i) { return allB[i]; });
    }

    window.eitFindMebDers = findMebDers;
    window.eitImportFromMeb = importFromMeb;

    /* ─── Init ─── */
    document.addEventListener('DOMContentLoaded', function () {
        $view = document.getElementById('eicerikTablosuView');
        $btn = document.getElementById('eicerikTablosuBtn');
        // Eski bagimsiz buton varsa bagla (geriye uyum)
        if ($btn && $btn.tagName === 'BUTTON') $btn.addEventListener('click', openView);
    });

    // Embed modu: Ayarlar paneli icinden cagirilir
    window.eitRenderEicerikTablosu = function (container) {
        $view = container;
        if (!activeDers) { var s = getSubjects(); if (s.length) activeDers = s[0].name; }
        renderView();
    };

    function openView() {
        ['dashOverview', 'bookGrid', 'detailPage', 'emptyState', 'filterPills', 'resultsInfo', 'reportsView', 'adminView', 'criteriaView', 'gorevlerView'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
        ['reportsBtn', 'adminPanelBtn', 'criteriaBtn', 'gorevlerBtn'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.classList.remove('active');
        });
        $view.style.display = '';
        if ($btn) $btn.classList.add('active');
        document.getElementById('pageTitle').textContent = 'E-\u0130\u00e7erik Tablosu';
        var bc = document.getElementById('breadcrumb');
        if (bc) bc.textContent = '';
        if (!activeDers) { var s = getSubjects(); if (s.length) activeDers = s[0].name; }
        renderView();
        if (window.eitPushState) window.eitPushState('eicerik');
    }

    /* ─── Ana Render ─── */
    function renderView() {
        var subjects = getSubjects();
        var totalRows = tablo().length;
        var turMap = {};
        tablo().forEach(function (r) { if (r.tur) r.tur.split('/').forEach(function (t) { turMap[t.trim()] = 1; }); });

        var h = '';

        // ── Header ──
        h += '<div class="et2-header">';
        h += '<div class="et2-header-top">';
        h += '<div class="et2-stats">';
        h += '<span class="et2-stat"><strong>' + subjects.length + '</strong> Ders</span>';
        h += '<span class="et2-stat-sep">\u00b7</span>';
        h += '<span class="et2-stat"><strong>' + totalRows + '</strong> E-\u0130\u00e7erik</span>';
        h += '<span class="et2-stat-sep">\u00b7</span>';
        h += '<span class="et2-stat"><strong>' + Object.keys(turMap).length + '</strong> T\u00fcr</span>';
        h += '</div>';
        if (canManage()) {
            h += '<div class="et2-actions">';
            h += '<button class="et2-btn et2-btn-sec" id="etDownload" title="JSON indir">\u2193 \u0130ndir</button>';
            h += '<button class="et2-btn et2-btn-pri" id="etUpload" title="Yeni JSON y\u00fckle">\u2191 Y\u00fckle</button>';
            h += '<input type="file" id="etFileInput" accept=".json" style="display:none">';
            h += '</div>';
        }
        h += '</div>';

        // Search
        h += '<div class="et2-search-wrap">';
        h += '<input type="text" class="et2-search" id="etSearch" placeholder="Ders, kazan\u0131m, a\u00e7\u0131klama ara..." value="' + esc(searchQuery) + '">';
        h += '</div>';

        // Tabs
        h += '<div class="et2-tabs">';
        h += '<button class="et2-tab' + (activeTab === 'tablo' ? ' active' : '') + '" data-tab="tablo">Tablo</button>';
        h += '<button class="et2-tab' + (activeTab === 'aktar' ? ' active' : '') + '" data-tab="aktar">Kitaplara Aktar</button>';
        h += '</div>';
        h += '</div>';

        // ── Body ──
        h += '<div class="et2-body">';
        if (searchQuery) h += renderSearch();
        else if (activeTab === 'tablo') h += renderTabloLayout(subjects);
        else h += renderAktarLayout(subjects);
        h += '</div>';

        $view.innerHTML = h;
        bindEvents();
    }

    /* ─── Tablo Tab ─── */
    function renderTabloLayout(subjects) {
        var h = '<div class="et2-layout">';

        h += '<div class="et2-nav">';
        subjects.forEach(function (s) {
            h += '<div class="et2-nav-item' + (activeDers === s.name ? ' active' : '') + '" data-ders="' + esc(s.name) + '" title="' + esc(s.name) + ' (' + s.count + ' e-i\u00e7erik)">';
            h += '<span class="et2-nav-label">' + esc(s.name) + '</span>';
            h += '<span class="et2-nav-badge">' + s.count + '</span>';
            h += '</div>';
        });
        h += '</div>';

        h += '<div class="et2-content">' + renderDersContent(activeDers) + '</div>';
        h += '</div>';
        return h;
    }

    function renderDersContent(dersName) {
        var rows = tablo().filter(function (r) { return r.ders === dersName; });
        if (!rows.length) return '<div class="et2-empty">Se\u00e7ilen ders bulunamad\u0131.</div>';

        var uniteMap = {}, uniteOrder = [];
        rows.forEach(function (r) {
            var u = r.unite || 'Di\u011fer';
            if (!uniteMap[u]) { uniteMap[u] = []; uniteOrder.push(u); }
            uniteMap[u].push(r);
        });

        var h = '<div class="et2-ders-head">';
        h += '<h3>' + esc(dersName) + '</h3>';
        h += '<span class="et2-ders-meta">' + rows.length + ' e-i\u00e7erik \u00b7 ' + uniteOrder.length + ' \u00fcnite</span>';
        if (canManage()) h += '<button class="et2-ders-del" data-ders="' + esc(dersName) + '">Dersi Sil</button>';
        h += '</div>';

        uniteOrder.forEach(function (unite) {
            var items = uniteMap[unite];
            h += '<div class="et2-unite">';
            h += '<div class="et2-unite-head">' + esc(unite) + '<span>' + items.length + '</span></div>';
            h += '<div class="et2-unite-body">';
            items.forEach(function (r) {
                h += '<div class="et2-krow">';
                h += '<span class="et2-krow-no">' + esc(r.sira) + '</span>';
                h += '<div class="et2-krow-main">';
                h += '<div class="et2-krow-kaz">' + esc(r.kazanim) + '</div>';
                if (r.aciklama) h += '<div class="et2-krow-desc">' + esc(r.aciklama) + '</div>';
                h += '</div>';
                h += '<div class="et2-krow-tur">' + renderTurBadges(r.tur) + '</div>';
                h += '</div>';
            });
            h += '</div></div>';
        });
        return h;
    }

    /* ─── Arama ─── */
    function renderSearch() {
        var q = searchQuery.toLowerCase();
        var results = tablo().filter(function (r) {
            return (r.ders + ' ' + r.unite + ' ' + r.kazanim + ' ' + r.aciklama + ' ' + r.tur).toLowerCase().indexOf(q) > -1;
        });

        var h = '<div class="et2-search-results">';
        h += '<div class="et2-ders-head"><h3>Arama: \u201c' + esc(searchQuery) + '\u201d</h3>';
        h += '<span class="et2-ders-meta">' + results.length + ' sonu\u00e7</span></div>';

        if (!results.length) { h += '<div class="et2-empty">Sonu\u00e7 bulunamad\u0131.</div>'; }
        else {
            var grouped = {}, gOrder = [];
            results.forEach(function (r) {
                var k = r.ders + ' \u2013 ' + (r.unite || '');
                if (!grouped[k]) { grouped[k] = []; gOrder.push(k); }
                grouped[k].push(r);
            });
            gOrder.forEach(function (k) {
                h += '<div class="et2-unite">';
                h += '<div class="et2-unite-head">' + highlight(esc(k), searchQuery) + '<span>' + grouped[k].length + '</span></div>';
                h += '<div class="et2-unite-body">';
                grouped[k].forEach(function (r) {
                    h += '<div class="et2-krow">';
                    h += '<span class="et2-krow-no">' + esc(r.sira) + '</span>';
                    h += '<div class="et2-krow-main">';
                    h += '<div class="et2-krow-kaz">' + highlight(esc(r.kazanim), searchQuery) + '</div>';
                    if (r.aciklama) h += '<div class="et2-krow-desc">' + highlight(esc(r.aciklama), searchQuery) + '</div>';
                    h += '</div>';
                    h += '<div class="et2-krow-tur">' + renderTurBadges(r.tur) + '</div>';
                    h += '</div>';
                });
                h += '</div></div>';
            });
        }
        h += '</div>';
        return h;
    }

    /* ─── Kitaplara Aktar Tab ─── */
    function renderAktarLayout(subjects) {
        var h = '<div class="et2-layout">';

        // Nav - ders with book match counts
        h += '<div class="et2-nav">';
        subjects.forEach(function (s) {
            var mc = findMatchingBooks(s.name).length;
            h += '<div class="et2-nav-item' + (activeDers === s.name ? ' active' : '') + (mc ? '' : ' et2-nav-dim') + '" data-ders="' + esc(s.name) + '" title="' + esc(s.name) + (mc ? ' \u2013 ' + mc + ' kitap' : '') + '">';
            h += '<span class="et2-nav-label">' + esc(s.name) + '</span>';
            if (mc) h += '<span class="et2-nav-badge et2-nav-badge-book">' + mc + '</span>';
            h += '</div>';
        });
        h += '</div>';

        h += '<div class="et2-content">' + renderAktarContent(activeDers) + '</div>';
        h += '</div>';
        return h;
    }

    function renderAktarContent(dersName) {
        var rows = tablo().filter(function (r) { return r.ders === dersName; });
        var matchBooks = findMatchingBooks(dersName);

        var uniteCount = {};
        rows.forEach(function (r) { uniteCount[r.unite || 'Di\u011fer'] = 1; });

        var h = '<div class="et2-ders-head">';
        h += '<h3>' + esc(dersName) + '</h3>';
        h += '<span class="et2-ders-meta">' + rows.length + ' e-i\u00e7erik \u00b7 ' + Object.keys(uniteCount).length + ' \u00fcnite</span>';
        h += '</div>';

        // Özet/Ölçme bilgisi
        h += '<div class="et2-aktar-note">Her \u00fcniteye otomatik olarak <strong>\u00d6zet E-\u0130\u00e7eri\u011fi</strong> ve <strong>\u00d6l\u00e7me Etkinli\u011fi</strong> eklenecektir.</div>';

        if (!matchBooks.length) {
            h += '<div class="et2-aktar-empty">';
            h += '<p>Bu ders i\u00e7in sistemde e\u015fle\u015fen kitap bulunamad\u0131.</p>';
            h += '<p>Kitaplar\u0131n <em>ders</em> ve <em>s\u0131n\u0131f</em> bilgilerinin do\u011fru oldu\u011fundan emin olun.</p>';
            h += '</div>';
            return h;
        }

        h += '<div class="et2-aktar-list">';
        matchBooks.forEach(function (b) {
            var idx = books().indexOf(b);
            var imported = b.mebDers === dersName && b.uniteler && b.uniteler.length;
            var checked = aktarSel[idx] ? ' checked' : '';

            h += '<label class="et2-aktar-item' + (imported ? ' et2-imported' : '') + '">';
            if (!imported) h += '<input type="checkbox" class="et2-aktar-cb" data-idx="' + idx + '"' + checked + '>';
            else h += '<span class="et2-aktar-check-done">\u2713</span>';
            h += '<span class="et2-aktar-code">#' + esc(b.id) + '</span>';
            h += '<span class="et2-aktar-name">' + esc(b.baslik) + '</span>';
            h += '<span class="et2-aktar-info">' + esc(b.sinif) + '</span>';
            h += '<span class="et2-aktar-info">' + esc(b.yayinevi) + '</span>';
            if (imported) h += '<span class="et2-aktar-badge-done">Aktar\u0131lm\u0131\u015f</span>';
            h += '</label>';
        });
        h += '</div>';

        // Action bar
        var selCount = Object.keys(aktarSel).length;
        var canImport = matchBooks.some(function (b) { return !(b.mebDers === dersName && b.uniteler && b.uniteler.length); });
        if (canImport) {
            h += '<div class="et2-aktar-bar">';
            h += '<button class="et2-btn et2-btn-sec" id="etSelAll">T\u00fcm\u00fcn\u00fc Se\u00e7</button>';
            h += '<div class="et2-aktar-bar-right">';
            if (selCount) h += '<span class="et2-aktar-sel-info">' + selCount + ' kitap se\u00e7ili</span>';
            h += '<button class="et2-btn et2-btn-pri" id="etDoAktar"' + (selCount ? '' : ' disabled') + '>Aktar</button>';
            h += '</div></div>';
        }

        return h;
    }

    /* ─── Tür Badges ─── */
    function renderTurBadges(tur) {
        if (!tur) return '';
        return tur.split('/').map(function (p) {
            p = p.trim();
            return '<span class="et2-tur ' + getTurClass(p) + '">' + esc(p) + '</span>';
        }).join('');
    }

    function getTurClass(t) {
        var s = t.toLowerCase();
        if (s.indexOf('video') > -1) return 'et2-tur-video';
        if (s.indexOf('etkile') > -1) return 'et2-tur-etkilesimli';
        if (s.indexOf('animasyon') > -1) return 'et2-tur-animasyon';
        if (s.indexOf('ses') > -1) return 'et2-tur-ses';
        if (s.indexOf('infografik') > -1 || s.indexOf('\u0130nfografik') > -1) return 'et2-tur-infografik';
        if (s.indexOf('sunu') > -1) return 'et2-tur-sunu';
        if (s.indexOf('g\u00f6rsel') > -1) return 'et2-tur-gorsel';
        if (s.indexOf('kavram') > -1) return 'et2-tur-kavram';
        if (s.indexOf('modelleme') > -1 || s.indexOf('3b') > -1) return 'et2-tur-modelleme';
        if (s.indexOf('sim\u00fclasyon') > -1) return 'et2-tur-simulasyon';
        return 'et2-tur-default';
    }

    function highlight(text, q) {
        if (!q) return text;
        var re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
        return text.replace(re, '<mark>$1</mark>');
    }

    /* ─── Events ─── */
    function bindEvents() {
        // Tabs
        $view.querySelectorAll('.et2-tab').forEach(function (t) {
            t.addEventListener('click', function () { activeTab = this.dataset.tab; searchQuery = ''; aktarSel = {}; renderView(); });
        });
        // Nav
        $view.querySelectorAll('.et2-nav-item').forEach(function (el) {
            el.addEventListener('click', function () { activeDers = this.dataset.ders; searchQuery = ''; aktarSel = {}; renderView(); });
        });
        // Search
        var si = document.getElementById('etSearch');
        if (si) si.addEventListener('input', function () {
            var pos = this.selectionStart;
            searchQuery = this.value;
            renderView();
            var ni = document.getElementById('etSearch');
            if (ni) { ni.focus(); ni.selectionStart = ni.selectionEnd = pos; }
        });
        // Upload
        var ub = document.getElementById('etUpload'), fi = document.getElementById('etFileInput');
        if (ub && fi) { ub.addEventListener('click', function () { fi.click(); }); fi.addEventListener('change', handleUpload); }
        // Download
        var db = document.getElementById('etDownload');
        if (db) db.addEventListener('click', handleDownload);
        // Delete ders
        $view.querySelectorAll('.et2-ders-del').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var d = this.dataset.ders;
                if (!confirm('\u201c' + d + '\u201d dersine ait t\u00fcm sat\u0131rlar silinecek. Devam?')) return;
                deleteDers(d);
            });
        });
        // Aktar checkboxes
        $view.querySelectorAll('.et2-aktar-cb').forEach(function (cb) {
            cb.addEventListener('change', function () {
                if (this.checked) aktarSel[this.dataset.idx] = true; else delete aktarSel[this.dataset.idx];
                renderView();
            });
        });
        // Select all
        var sa = document.getElementById('etSelAll');
        if (sa) sa.addEventListener('click', function () {
            aktarSel = {};
            findMatchingBooks(activeDers).forEach(function (b) {
                var i = books().indexOf(b);
                if (!(b.mebDers === activeDers && b.uniteler && b.uniteler.length)) aktarSel[i] = true;
            });
            renderView();
        });
        // Do import
        var da = document.getElementById('etDoAktar');
        if (da) da.addEventListener('click', doAktar);
    }

    function doAktar() {
        var idxs = Object.keys(aktarSel);
        if (!idxs.length) return;
        var uniteler = importFromMeb(activeDers);
        if (!uniteler.length) { alert('Veri bulunamad\u0131.'); return; }
        var allB = books();
        idxs.forEach(function (i) {
            var b = allB[parseInt(i)];
            if (b) { b.uniteler = JSON.parse(JSON.stringify(uniteler)); b.mebDers = activeDers; }
        });
        aktarSel = {};
        _bookMatchCache = null; // kitap verileri değişti
        if (window.eitSave) window.eitSave();
        renderView();
    }

    /* ─── JSON Yönetim ─── */
    function handleUpload() {
        var fi = document.getElementById('etFileInput');
        var file = fi.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function (e) {
            try {
                var d = JSON.parse(e.target.result);
                if (!Array.isArray(d) || !d.length) { alert('JSON ge\u00e7erli bir dizi olmal\u0131d\u0131r.'); return; }
                if (!d[0].ders || !d[0].kazanim) { alert('JSON format\u0131 hatal\u0131. Her sat\u0131rda "ders" ve "kazanim" olmal\u0131.'); return; }
                if (!confirm(d.length + ' sat\u0131r y\u00fcklenecek. Mevcut tablo de\u011fi\u015ftirilecek. Devam?')) return;
                saveToServer(d, function () { window.eitEicerikTablosu = d; invalidateMebCache(); activeDers = ''; searchQuery = ''; renderView(); });
            } catch (err) { alert('JSON parse hatas\u0131: ' + err.message); }
        };
        reader.readAsText(file);
        fi.value = '';
    }

    function handleDownload() {
        var blob = new Blob([JSON.stringify(tablo(), null, 2)], { type: 'application/json' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'eicerik-tablosu.json';
        a.click();
        URL.revokeObjectURL(a.href);
    }

    function deleteDers(dersName) {
        var d = tablo().filter(function (r) { return r.ders !== dersName; });
        saveToServer(d, function () {
            window.eitEicerikTablosu = d;
            invalidateMebCache();
            if (activeDers === dersName) activeDers = '';
            renderView();
        });
    }

    function saveToServer(newData, onOk) {
        var fd = new FormData();
        fd.append('action', 'eit_save_eicerik');
        fd.append('nonce', (window.eitAjax || {}).nonce || '');
        fd.append('json', JSON.stringify(newData));
        var xhr = new XMLHttpRequest();
        xhr.open('POST', (window.eitAjax || {}).url || '/wp-admin/admin-ajax.php');
        xhr.timeout = 30000;
        xhr.onload = function () {
            if (xhr.status === 200) {
                try {
                    var r = JSON.parse(xhr.responseText);
                    if (r.success) { if (onOk) onOk(); } else alert('Hata: ' + (r.data || ''));
                } catch (e) { alert('Sunucu yanıt hatası'); }
            } else alert('Sunucu hatası: ' + xhr.status);
        };
        xhr.onerror = function () { alert('Sunucuya bağlanılamadı.'); };
        xhr.ontimeout = function () { alert('Kayıt zaman aşımına uğradı.'); };
        xhr.send(fd);
    }

})();
