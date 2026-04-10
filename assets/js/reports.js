/**
 * Edop E-Takip Reports Module v1.2
 * 7 rapor tipi + dinamik filtreler + PDF export + gorev entegrasyonu
 */
(function () {
    'use strict';

    var $view, $btn;
    var activeReport = 'genel';
    var rptFilters = {}; // { field: [val1, val2] }

    var reportTypes = [
        { key: 'genel',    label: 'Genel \u00d6zet',             icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>' },
        { key: 'asama',    label: 'A\u015fama Raporu',            icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>' },
        { key: 'ders',     label: 'Ders Bazl\u0131 Rapor',       icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>' },
        { key: 'eicerik',  label: 'E-\u0130\u00e7erik Durum',     icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>' },
        { key: 'sorumlu',  label: 'Sorumlu Bazl\u0131 Rapor',    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' },
        { key: 'notlar',   label: 'Notlar Raporu',               icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' },
        { key: 'yayinevi', label: 'Yay\u0131nevi Raporu',        icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' },
        { key: 'gelmedi',  label: '\u0130\u00e7erik Gelmedi',        icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>' },
        { key: 'gorevKisi', label: 'Ki\u015fi Bazl\u0131 G\u00f6rev', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' },
        { key: 'gorevBazli', label: 'G\u00f6rev Bazl\u0131 Rapor',  icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' }
    ];

    // Which filters each report type supports
    var reportFilterDefs = {
        genel:    ['ders', 'sinif', 'okul', 'yayinevi', 'durumu'],
        asama:    ['ders', 'sinif', 'okul', 'yayinevi', 'durumu'],
        ders:     ['sinif', 'okul', 'yayinevi', 'durumu'],
        eicerik:  ['ders', 'sinif', 'okul', 'atanan', 'icDurum'],
        sorumlu:  ['ders', 'sinif', 'okul', 'yayinevi', 'atanan', 'icDurum'],
        notlar:   ['ders', 'sinif', 'okul', 'yayinevi', 'etiket'],
        yayinevi: ['ders', 'sinif', 'okul', 'durumu', 'icDurum'],
        gelmedi:  ['ders', 'sinif', 'okul', 'yayinevi'],
        gorevKisi: ['ders', 'sinif', 'okul', 'atanan'],
        gorevBazli: ['ders', 'sinif', 'okul', 'atanan']
    };

    var filterLabels = {
        ders: 'Ders', sinif: 'S\u0131n\u0131f', okul: 'Okul T\u00fcr\u00fc', yayinevi: 'Yay\u0131nevi',
        durumu: 'Durum', atanan: 'Sorumlu', icDurum: '\u0130\u00e7erik Durumu', etiket: 'Etiket'
    };

    /* ─── Helpers ─── */
    function esc(s) { if (s == null) return ''; var d = document.createElement('div'); d.textContent = String(s); return d.innerHTML; }
    function escAttr(s) { return (s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;'); }
    function allBooks() { return window.eitAllBooks || []; }
    var pColors = ['#f59e0b','#3b82f6','#ec4899','#22c55e','#8b5cf6','#06b6d4','#ef4444','#f97316','#14b8a6','#a855f7','#0ea5e9','#84cc16'];
    var durumColors = { 'Havuzda': '#0ea5e9', '\u0130\u015flemde': '#f59e0b', 'TTKB Onay\u0131': '#22c55e', 'Ask\u0131da': '#ef4444', 'Pasif': '#64748b' };
    var icDurumColors = {
        '\u0130\u00e7erik Gelmedi': '#ef4444', '\u0130\u00e7erik Geldi': '#f97316', '\u00d6n \u0130nceleme': '#f59e0b', 'T\u00fcrk\u00e7e Okuma': '#eab308',
        '\u00dcretime Ba\u015fland\u0131': '#3b82f6', '\u00dcretim Devam Ediyor': '#6366f1', 'E-\u0130\u00e7erik \u00dcretim Tamamland\u0131': '#8b5cf6',
        '\u00d6n Kontrol': '#06b6d4', 'Scorm V2': '#0ea5e9', 'Tashih': '#ec4899', 'Son Kontrol': '#14b8a6', 'Tamamland\u0131': '#22c55e'
    };
    var icerikAsamalari = window.eitIcerikDurumlari || Object.keys(icDurumColors);

    /* ─── Filter logic ─── */
    function getFilterOptions(field) {
        var bk = allBooks(), vals = {};
        if (field === 'atanan') {
            bk.forEach(function (b) { if (b.uniteler) b.uniteler.forEach(function (u) { if (u.icerikler) u.icerikler.forEach(function (ic) {
                var g = ic.gorev;
                if (g && g.atananAd) vals[g.atananAd] = 1;
                else if (ic.atanan) vals[ic.atanan] = 1;
                (ic.gorevGecmisi || []).forEach(function (gg) { if (gg.atananAd) vals[gg.atananAd] = 1; });
            }); }); });
            (window.eitAllAtananlar || []).forEach(function (a) { if (a) vals[a] = 1; });
        } else if (field === 'icDurum') {
            bk.forEach(function (b) { if (b.uniteler) b.uniteler.forEach(function (u) { if (u.icerikler) u.icerikler.forEach(function (ic) { vals[ic.durum || '\u0130\u00e7erik Gelmedi'] = 1; }); }); });
        } else if (field === 'etiket') {
            vals = { bilgi: 1, uyari: 1, sorun: 1, cozum: 1 };
        } else {
            bk.forEach(function (b) { var v = b[field]; if (v) vals[v] = 1; });
        }
        return Object.keys(vals).sort(function (a, b) { return a.localeCompare(b, 'tr'); });
    }

    function getFilteredBooks() {
        var bk = allBooks();
        var keys = Object.keys(rptFilters);
        if (!keys.length) return bk;
        return bk.filter(function (b) {
            for (var i = 0; i < keys.length; i++) {
                var f = keys[i], vals = rptFilters[f];
                if (!vals || !vals.length) continue;
                // skip non-book fields
                if (f === 'atanan' || f === 'icDurum' || f === 'etiket') continue;
                var bVal = f === 'durumu' ? (b[f] || '\u0130\u015flemde') : (b[f] || '');
                if (vals.indexOf(bVal) === -1) return false;
            }
            return true;
        });
    }

    function activeFilterSummary() {
        var parts = [];
        Object.keys(rptFilters).forEach(function (f) {
            if (rptFilters[f] && rptFilters[f].length) {
                parts.push(filterLabels[f] + ': ' + rptFilters[f].join(', '));
            }
        });
        return parts.join(' | ');
    }

    /* ─── Init ─── */
    document.addEventListener('DOMContentLoaded', function () {
        $view = document.getElementById('reportsView');
        $btn = document.getElementById('reportsBtn');
        if (!$btn || !$view) return;
        $btn.addEventListener('click', openReports);
    });

    function openReports() {
        ['dashOverview', 'bookGrid', 'detailPage', 'emptyState', 'filterPills', 'resultsInfo', 'adminView', 'criteriaView', 'eicerikTablosuView', 'gorevlerView'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
        ['adminPanelBtn', 'criteriaBtn', 'eicerikTablosuBtn', 'gorevlerBtn'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.classList.remove('active');
        });
        $view.style.display = '';
        $btn.classList.add('active');
        document.getElementById('pageTitle').textContent = 'Raporlar';
        var bc = document.getElementById('breadcrumb');
        if (bc) bc.textContent = '';
        renderReports();
        if (window.eitPushState) window.eitPushState('reports');
    }

    /* ─── Main Render ─── */
    function renderReports() {
        var h = '<div class="reports-layout">';
        // Left nav
        h += '<div class="reports-nav">';
        reportTypes.forEach(function (r) {
            h += '<div class="reports-nav-item' + (activeReport === r.key ? ' active' : '') + '" data-rpt="' + r.key + '">';
            h += r.icon + '<span>' + r.label + '</span></div>';
        });
        h += '</div>';
        // Right content
        var rt = reportTypes.find(function (r) { return r.key === activeReport; });
        h += '<div class="reports-content">';
        h += '<div class="reports-header"><h2>' + (rt ? rt.label : '') + '</h2>';
        h += '<button class="reports-pdf-btn" id="rptPdfBtn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>PDF \u0130ndir</button>';
        h += '</div>';
        // Filters bar
        h += renderFilterBar();
        // Report body
        h += '<div class="reports-body" id="reportsBody">' + renderActiveReport() + '</div>';
        h += '</div></div>';
        $view.innerHTML = h;
        bindEvents();
    }

    function renderFilterBar() {
        var defs = reportFilterDefs[activeReport] || [];
        if (!defs.length) return '';
        var h = '<div class="rpt-filters" id="rptFilters">';
        defs.forEach(function (f) {
            var opts = getFilterOptions(f);
            if (!opts.length) return;
            var selected = rptFilters[f] || [];
            var isActive = selected.length > 0;
            h += '<div class="rpt-filter-group">';
            h += '<button class="rpt-filter-btn' + (isActive ? ' active' : '') + '" data-filter="' + f + '">' + filterLabels[f];
            if (isActive) h += ' <span class="rpt-filter-count">' + selected.length + '</span>';
            h += '</button>';
            h += '<div class="rpt-filter-dropdown" data-filter="' + f + '">';
            opts.forEach(function (o) {
                var checked = selected.indexOf(o) > -1;
                var label = f === 'etiket' ? ({ bilgi: 'Bilgi', uyari: 'Uyar\u0131', sorun: 'Sorun', cozum: '\u00c7\u00f6z\u00fcm' }[o] || o) : o;
                h += '<label class="rpt-filter-option"><input type="checkbox" data-field="' + f + '" value="' + escAttr(o) + '"' + (checked ? ' checked' : '') + '><span>' + esc(label) + '</span></label>';
            });
            h += '</div></div>';
        });
        // Clear all button
        var hasAny = Object.keys(rptFilters).some(function (f) { return rptFilters[f] && rptFilters[f].length; });
        if (hasAny) h += '<button class="rpt-filter-clear" id="rptFilterClear">Temizle</button>';
        h += '</div>';
        // Active filter pills
        if (hasAny) {
            h += '<div class="rpt-filter-pills">';
            Object.keys(rptFilters).forEach(function (f) {
                if (!rptFilters[f]) return;
                rptFilters[f].forEach(function (v) {
                    var label = f === 'etiket' ? ({ bilgi: 'Bilgi', uyari: 'Uyar\u0131', sorun: 'Sorun', cozum: '\u00c7\u00f6z\u00fcm' }[v] || v) : v;
                    h += '<span class="rpt-pill" data-field="' + f + '" data-val="' + escAttr(v) + '">' + esc(label) + ' \u00d7</span>';
                });
            });
            h += '</div>';
        }
        return h;
    }

    function bindEvents() {
        // Nav clicks
        $view.querySelectorAll('.reports-nav-item').forEach(function (el) {
            el.addEventListener('click', function () {
                activeReport = this.dataset.rpt;
                rptFilters = {};
                renderReports();
            });
        });
        // PDF
        var pdfBtn = document.getElementById('rptPdfBtn');
        if (pdfBtn) pdfBtn.addEventListener('click', downloadPdf);
        // Filter buttons toggle dropdown
        $view.querySelectorAll('.rpt-filter-btn').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                var f = this.dataset.filter;
                var dd = $view.querySelector('.rpt-filter-dropdown[data-filter="' + f + '"]');
                // Close others
                $view.querySelectorAll('.rpt-filter-dropdown.open').forEach(function (d) { if (d !== dd) d.classList.remove('open'); });
                dd.classList.toggle('open');
            });
        });
        // Checkbox changes
        $view.querySelectorAll('.rpt-filter-option input').forEach(function (cb) {
            cb.addEventListener('change', function () {
                var f = this.dataset.field, v = this.value;
                if (!rptFilters[f]) rptFilters[f] = [];
                if (this.checked) {
                    if (rptFilters[f].indexOf(v) === -1) rptFilters[f].push(v);
                } else {
                    rptFilters[f] = rptFilters[f].filter(function (x) { return x !== v; });
                }
                if (!rptFilters[f].length) delete rptFilters[f];
                refreshBody();
            });
        });
        // Close dropdowns on outside click (once, avoid listener leak)
        if (!$view._rptDocClick) {
            $view._rptDocClick = function () {
                $view.querySelectorAll('.rpt-filter-dropdown.open').forEach(function (d) { d.classList.remove('open'); });
            };
            document.addEventListener('click', $view._rptDocClick);
        }
        $view.querySelectorAll('.rpt-filter-dropdown').forEach(function (d) {
            d.addEventListener('click', function (e) { e.stopPropagation(); });
        });
        // Clear all
        var clearBtn = document.getElementById('rptFilterClear');
        if (clearBtn) clearBtn.addEventListener('click', function () { rptFilters = {}; renderReports(); });
        // Pill remove
        $view.querySelectorAll('.rpt-pill').forEach(function (pill) {
            pill.addEventListener('click', function () {
                var f = this.dataset.field, v = this.dataset.val;
                if (rptFilters[f]) {
                    rptFilters[f] = rptFilters[f].filter(function (x) { return x !== v; });
                    if (!rptFilters[f].length) delete rptFilters[f];
                }
                renderReports();
            });
        });
    }

    function refreshBody() {
        // Re-render just filter bar + body without full re-render (keeps nav state)
        renderReports();
    }

    function renderActiveReport() {
        var bk = getFilteredBooks();
        if (!bk.length) return '<div style="padding:40px;text-align:center;color:var(--text-light)">Filtre sonu\u00e7lar\u0131 bo\u015f</div>';
        switch (activeReport) {
            case 'genel': return renderGenel(bk);
            case 'asama': return renderAsama(bk);
            case 'ders': return renderDers(bk);
            case 'eicerik': return renderEIcerik(bk);
            case 'sorumlu': return renderSorumlu(bk);
            case 'notlar': return renderNotlar(bk);
            case 'yayinevi': return renderYayinevi(bk);
            case 'gelmedi': return renderGelmedi(bk);
            case 'gorevKisi': return renderGorevKisi(bk);
            case 'gorevBazli': return renderGorevBazli(bk);
            default: return '';
        }
    }

    /* ═══════════════════════════════════════════
       1. GENEL OZET
    ═══════════════════════════════════════════ */
    function computeStats(bk) {
        var s = { total: bk.length, durumC: {}, okulC: {}, dersC: {}, totalUnite: 0, totalIcerik: 0, totalNot: 0, icerikDone: 0, icerikByDurum: {} };
        bk.forEach(function (b) {
            var d = b.durumu || '\u0130\u015flemde';
            s.durumC[d] = (s.durumC[d] || 0) + 1;
            if (b.okul) s.okulC[b.okul] = (s.okulC[b.okul] || 0) + 1;
            if (b.ders) s.dersC[b.ders] = (s.dersC[b.ders] || 0) + 1;
            if (b.uniteler) b.uniteler.forEach(function (u) {
                s.totalUnite++;
                if (u.icerikler) u.icerikler.forEach(function (ic) {
                    s.totalIcerik++;
                    var icd = ic.durum || '\u0130\u00e7erik Gelmedi';
                    s.icerikByDurum[icd] = (s.icerikByDurum[icd] || 0) + 1;
                    if (icd.indexOf('Tamamland') > -1) s.icerikDone++;
                    if (ic.notlar) s.totalNot += ic.notlar.length;
                });
            });
            if (b.notlar) s.totalNot += b.notlar.length;
        });
        return s;
    }

    function renderGenel(bk) {
        var s = computeStats(bk);
        var pct = s.totalIcerik > 0 ? Math.round((s.icerikDone / s.totalIcerik) * 100) : 0;

        // Görev gecikme sayısı
        var gecikme = 0;
        bk.forEach(function (b) { if (b.uniteler) b.uniteler.forEach(function (u) { if (u.icerikler) u.icerikler.forEach(function (ic) {
            var g = ic.gorev || {};
            if (g.atananId && g.durum !== 'Tamamland\u0131' && g.sonTarih && new Date() > new Date(g.sonTarih)) gecikme++;
        }); }); });

        var h = '<div class="rpt-stats">';
        h += statCard(s.total, 'Kitap', '#3b82f6');
        h += statCard(s.totalUnite, '\u00dcnite', '#8b5cf6');
        h += statCard(s.totalIcerik, 'E-\u0130\u00e7erik', '#06b6d4');
        h += statCard(s.totalNot, 'Not', '#ec4899');
        h += '</div>';

        // Genel tamamlanma bari
        h += '<div class="rpt-card"><div class="rpt-card-header"><span>Genel \u0130lerleme</span><span class="rpt-badge rpt-badge-pct">%' + pct + '</span></div>';
        h += '<div class="rpt-card-body" style="padding:14px 16px">';
        h += '<div class="rpt-big-progress"><div class="rpt-big-progress-fill" style="width:' + pct + '%;background:' + (pct === 100 ? '#22c55e' : '#4f46e5') + '"></div></div>';
        h += '<div class="rpt-progress-detail">';
        h += '<span class="rpt-pd-item"><strong>' + s.icerikDone + '</strong> tamamland\u0131</span>';
        h += '<span class="rpt-pd-item"><strong>' + (s.totalIcerik - s.icerikDone) + '</strong> devam ediyor</span>';
        if (gecikme > 0) h += '<span class="rpt-pd-item rpt-pd-warn"><strong>' + gecikme + '</strong> geciken g\u00f6rev</span>';
        h += '</div></div></div>';

        // Kitap + E-İçerik durumları yan yana
        h += '<div class="rpt-two-col">';
        // Kitap durumları
        h += '<div class="rpt-card"><div class="rpt-card-header">Kitap Durumlar\u0131</div><div class="rpt-card-body">';
        h += '<table class="rpt-table"><thead><tr><th>Durum</th><th>Kitap</th><th>Oran</th><th></th></tr></thead><tbody>';
        Object.keys(s.durumC).forEach(function (d) {
            var pp = s.total > 0 ? Math.round((s.durumC[d] / s.total) * 100) : 0;
            h += '<tr><td><span class="rpt-dot" style="background:' + (durumColors[d] || '#94a3b8') + '"></span>' + esc(d) + '</td>';
            h += '<td><strong>' + s.durumC[d] + '</strong></td><td>' + pp + '%</td>';
            h += '<td style="width:80px"><div class="rpt-mini-bar"><div class="rpt-mini-bar-fill" style="width:' + pp + '%;background:' + (durumColors[d] || '#94a3b8') + '"></div></div></td></tr>';
        });
        h += '</tbody></table></div></div>';

        // E-İçerik durumları
        if (s.totalIcerik > 0) {
            h += '<div class="rpt-card"><div class="rpt-card-header">E-\u0130\u00e7erik A\u015famalar\u0131</div><div class="rpt-card-body">';
            h += '<table class="rpt-table"><thead><tr><th>A\u015fama</th><th>Adet</th><th>Oran</th><th></th></tr></thead><tbody>';
            icerikAsamalari.forEach(function (d) {
                var c = s.icerikByDurum[d] || 0;
                if (c === 0) return;
                var pp = Math.round((c / s.totalIcerik) * 100);
                h += '<tr><td><span class="rpt-dot" style="background:' + (icDurumColors[d] || '#94a3b8') + '"></span>' + esc(d) + '</td>';
                h += '<td><strong>' + c + '</strong></td><td>' + pp + '%</td>';
                h += '<td style="width:80px"><div class="rpt-mini-bar"><div class="rpt-mini-bar-fill" style="width:' + pp + '%;background:' + (icDurumColors[d] || '#94a3b8') + '"></div></div></td></tr>';
            });
            h += '</tbody></table></div></div>';
        }
        h += '</div>'; // rpt-two-col

        // Ders dağılımı (top 8)
        var dersKeys = Object.keys(s.dersC).sort(function (a, b) { return s.dersC[b] - s.dersC[a]; });
        if (dersKeys.length > 1) {
            h += '<div class="rpt-card"><div class="rpt-card-header"><span>Ders Da\u011f\u0131l\u0131m\u0131</span><span class="rpt-badge">' + dersKeys.length + ' ders</span></div>';
            h += '<div class="rpt-card-body" style="padding:12px 16px">';
            h += '<div class="rpt-bar-chart">';
            var maxDers = s.dersC[dersKeys[0]] || 1;
            dersKeys.slice(0, 10).forEach(function (d, i) {
                var w = Math.round((s.dersC[d] / maxDers) * 100);
                h += '<div class="rpt-bar-row"><span class="rpt-bar-label">' + esc(d) + '</span>';
                h += '<div class="rpt-bar-track"><div class="rpt-bar-fill" style="width:' + w + '%;background:' + pColors[i % pColors.length] + '"></div></div>';
                h += '<span class="rpt-bar-val">' + s.dersC[d] + '</span></div>';
            });
            h += '</div></div></div>';
        }
        return h;
    }

    function statCard(num, label, color) {
        return '<div class="rpt-stat"><div class="rpt-stat-num" style="color:' + color + '">' + num + '</div><div class="rpt-stat-label">' + label + '</div></div>';
    }

    /* ═══════════════════════════════════════════
       2. ASAMA RAPORU
    ═══════════════════════════════════════════ */
    function renderAsama(bk) {
        // E-icerik asama dagilimi
        var asamaCount = {};
        var asamaRows = {};
        bk.forEach(function (b) {
            if (!b.uniteler) return;
            b.uniteler.forEach(function (u) {
                if (!u.icerikler) return;
                u.icerikler.forEach(function (ic) {
                    var d = ic.durum || '\u0130\u00e7erik Gelmedi';
                    asamaCount[d] = (asamaCount[d] || 0) + 1;
                    if (!asamaRows[d]) asamaRows[d] = [];
                    asamaRows[d].push({ kitapId: b.id, kitapDers: b.ders, unite: u.ad, ad: ic.ad, atanan: ic.atanan });
                });
            });
        });
        var total = 0;
        Object.keys(asamaCount).forEach(function (k) { total += asamaCount[k]; });
        // Summary table
        var h = '<div class="rpt-card"><div class="rpt-card-header">E-\u0130\u00e7erik A\u015fama Da\u011f\u0131l\u0131m\u0131</div><div class="rpt-card-body">';
        h += '<table class="rpt-table"><thead><tr><th>A\u015fama</th><th>Adet</th><th>Oran</th><th></th></tr></thead><tbody>';
        icerikAsamalari.forEach(function (a, i) {
            var c = asamaCount[a] || 0;
            var pp = total > 0 ? Math.round((c / total) * 100) : 0;
            var clr = icDurumColors[a] || pColors[i % pColors.length];
            h += '<tr><td><span class="rpt-dot" style="background:' + clr + '"></span>' + esc(a) + '</td>';
            h += '<td><strong>' + c + '</strong></td><td>' + pp + '%</td>';
            h += '<td style="width:120px"><div style="height:6px;background:var(--body-bg);border-radius:3px;overflow:hidden"><div style="width:' + pp + '%;height:100%;background:' + clr + ';border-radius:3px"></div></div></td></tr>';
        });
        h += '</tbody></table></div></div>';
        // Detail cards per asama
        icerikAsamalari.forEach(function (a, i) {
            var rows = asamaRows[a];
            if (!rows || !rows.length) return;
            var clr = icDurumColors[a] || pColors[i % pColors.length];
            h += '<div class="rpt-card" style="margin-top:8px"><div class="rpt-card-header"><span><span class="rpt-dot" style="background:' + clr + '"></span>' + esc(a) + '</span><span class="rpt-badge">' + rows.length + ' e-i\u00e7erik</span></div>';
            h += '<div class="rpt-card-body"><table class="rpt-table"><thead><tr><th>Kitap</th><th>Ders</th><th>\u00dcnite</th><th>\u0130\u00e7erik</th><th>Sorumlu</th></tr></thead><tbody>';
            rows.forEach(function (r) {
                h += '<tr><td>#' + esc(r.kitapId) + '</td><td>' + esc(r.kitapDers) + '</td><td>' + esc(r.unite) + '</td><td>' + esc(r.ad) + '</td><td>' + esc(r.atanan || '-') + '</td></tr>';
            });
            h += '</tbody></table></div></div>';
        });
        return h;
    }

    /* ═══════════════════════════════════════════
       3. DERS BAZLI RAPOR
    ═══════════════════════════════════════════ */
    function renderDers(bk) {
        var grouped = {};
        bk.forEach(function (b) { var d = b.ders || 'Belirtilmemi\u015f'; if (!grouped[d]) grouped[d] = []; grouped[d].push(b); });
        var keys = Object.keys(grouped).sort(function (a, b) { return a.localeCompare(b, 'tr'); });
        var h = '';
        keys.forEach(function (d) {
            var list = grouped[d];
            h += '<div class="rpt-card"><div class="rpt-card-header"><span>' + esc(d) + '</span><span class="rpt-badge">' + list.length + ' kitap</span></div>';
            h += '<div class="rpt-card-body">' + bookTable(list, true) + '</div></div>';
        });
        return h;
    }

    /* ═══════════════════════════════════════════
       4. E-ICERIK DURUM RAPORU
    ═══════════════════════════════════════════ */
    function flattenIcerik(bk) {
        var rows = [];
        var fAtanan = rptFilters.atanan || [];
        var fIcDurum = rptFilters.icDurum || [];
        bk.forEach(function (b) {
            if (!b.uniteler) return;
            b.uniteler.forEach(function (u) {
                if (!u.icerikler) return;
                u.icerikler.forEach(function (ic) {
                    var durum = ic.durum || '\u0130\u00e7erik Gelmedi';
                    var atananAd = (ic.gorev || {}).atananAd || ic.atanan || '';
                    if (fAtanan.length && fAtanan.indexOf(atananAd) === -1) return;
                    if (fIcDurum.length && fIcDurum.indexOf(durum) === -1) return;
                    var g = ic.gorev || {};
                    var isOverdue = g.atananId && g.durum !== 'Tamamland\u0131' && g.sonTarih && new Date() > new Date(g.sonTarih);
                    rows.push({ kitapId: b.id, kitapDers: b.ders, unite: u.ad, ad: ic.ad, tip: ic.tip, tur: ic.tur, atanan: g.atananAd || ic.atanan || '', durum: durum, asamaTarihleri: ic.asamaTarihleri || {}, icerikGelmeTarihi: ic.icerikGelmeTarihi, kontrolTamamlanmaTarihi: ic.kontrolTamamlanmaTarihi, gorevDurum: g.durum || '', overdue: isOverdue });
                });
            });
        });
        return rows;
    }

    // Asama tarihini bul (asamaTarihleri > eski alanlar > bos)
    function getAsamaTarih(r, asama) {
        if (r.asamaTarihleri && r.asamaTarihleri[asama]) return r.asamaTarihleri[asama];
        if (asama === '\u0130\u00e7erik Geldi') return r.icerikGelmeTarihi || '';
        if (asama === '\u00dcretime Ba\u015fland\u0131') return r.kontrolTamamlanmaTarihi || '';
        return '';
    }

    function renderEIcerik(bk) {
        var rows = flattenIcerik(bk);
        var durumC = {};
        rows.forEach(function (r) { durumC[r.durum] = (durumC[r.durum] || 0) + 1; });
        var gecikme = rows.filter(function (r) { return r.overdue; }).length;
        var done = rows.filter(function (r) { return r.durum.indexOf('Tamamland') > -1; }).length;
        var h = '<div class="rpt-stats">';
        h += statCard(rows.length, 'Toplam E-\u0130\u00e7erik', '#06b6d4');
        h += statCard(done, 'Tamamlanan', '#22c55e');
        h += statCard(rows.length - done, 'Devam Eden', '#f59e0b');
        if (gecikme > 0) h += statCard(gecikme, 'Geciken', '#ef4444');
        h += '</div>';
        h += '<div class="rpt-card"><div class="rpt-card-header">T\u00fcm E-\u0130\u00e7erikler</div><div class="rpt-card-body">';
        h += '<table class="rpt-table rpt-table-dates"><thead><tr>';
        h += '<th>Kitap</th><th>\u0130\u00e7erik</th><th>T\u00fcr</th><th>A\u015fama</th><th>Sorumlu</th>';
        h += '<th>\u0130\u00e7erik Geldi</th><th>\u00dcretime Ba\u015f.</th><th>\u00d6n Kontrol</th><th>Tamamland\u0131</th>';
        h += '</tr></thead><tbody>';
        var tipLabel = { 'ozet': '\u00d6zet', 'eicerik': 'E-\u0130\u00e7erik', 'olcme': '\u00d6l\u00e7me' };
        rows.forEach(function (r) {
            var tGeldi = getAsamaTarih(r, '\u0130\u00e7erik Geldi');
            var tUretim = getAsamaTarih(r, '\u00dcretime Ba\u015fland\u0131');
            var tOnKontrol = getAsamaTarih(r, '\u00d6n Kontrol');
            var tBitti = getAsamaTarih(r, 'Tamamland\u0131');
            var rowCls = r.overdue ? ' class="rpt-row-overdue"' : '';
            h += '<tr' + rowCls + '>';
            h += '<td>#' + esc(r.kitapId) + ' ' + esc(r.kitapDers) + '</td>';
            h += '<td>' + esc(r.ad) + '</td>';
            h += '<td>' + esc(r.tur || '-') + '</td>';
            h += '<td><span class="rpt-dot" style="background:' + (icDurumColors[r.durum] || '#94a3b8') + '"></span>' + esc(r.durum) + '</td>';
            h += '<td>' + esc(r.atanan || '-') + '</td>';
            h += '<td class="rpt-date-cell">' + esc(tGeldi || '-') + '</td>';
            h += '<td class="rpt-date-cell">' + esc(tUretim || '-') + '</td>';
            h += '<td class="rpt-date-cell">' + esc(tOnKontrol || '-') + '</td>';
            h += '<td class="rpt-date-cell">' + esc(tBitti || '-') + '</td>';
            h += '</tr>';
        });
        h += '</tbody></table></div></div>';
        return h;
    }

    /* ═══════════════════════════════════════════
       5. SORUMLU BAZLI RAPOR
    ═══════════════════════════════════════════ */
    function renderSorumlu(bk) {
        var fAtanan = rptFilters.atanan || [];
        var fIcDurum = rptFilters.icDurum || [];
        var people = {};
        var toplamGecikme = 0;
        bk.forEach(function (b) {
            if (!b.uniteler) return;
            b.uniteler.forEach(function (u) {
                if (!u.icerikler) return;
                u.icerikler.forEach(function (ic) {
                    var g = ic.gorev || {};
                    var a = g.atananAd || ic.atanan || 'Atanmam\u0131\u015f';
                    var durum = ic.durum || '\u0130\u00e7erik Gelmedi';
                    if (fIcDurum.length && fIcDurum.indexOf(durum) === -1) return;
                    if (fAtanan.length && fAtanan.indexOf(a) === -1) return;
                    if (!people[a]) people[a] = { rows: [], done: 0, prog: 0, wait: 0, gecikme: 0 };
                    var durum = ic.durum || '\u0130\u00e7erik Gelmedi';
                    var gDurum = g.durum || '';
                    var isOverdue = g.atananId && gDurum !== 'Tamamland\u0131' && g.sonTarih && new Date() > new Date(g.sonTarih);
                    if (isOverdue) { people[a].gecikme++; toplamGecikme++; }
                    if (durum.indexOf('Tamamland') > -1) people[a].done++;
                    else if (durum.indexOf('Ba\u015fland') > -1 || durum.indexOf('Devam') > -1 || durum.indexOf('\u00dcretim') > -1) people[a].prog++;
                    else people[a].wait++;
                    people[a].rows.push({
                        kitapId: b.id, kitapDers: b.ders, unite: u.ad, ad: ic.ad, durum: durum,
                        gorevDurum: gDurum, sonTarih: g.sonTarih || '', overdue: isOverdue
                    });
                });
            });
        });
        var entries = Object.keys(people).map(function (k) { return [k, people[k]]; }).sort(function (a, b) { return b[1].rows.length - a[1].rows.length; });

        // \u00dcst istatistik
        var toplamKisi = entries.length;
        var toplamIcerik = 0, toplamDone = 0;
        entries.forEach(function (e) { toplamIcerik += e[1].rows.length; toplamDone += e[1].done; });
        var h = '<div class="rpt-stats">';
        h += statCard(toplamKisi, 'Sorumlu Ki\u015fi', '#8b5cf6');
        h += statCard(toplamIcerik, 'Toplam \u0130\u00e7erik', '#3b82f6');
        h += statCard(toplamDone, 'Tamamlanan', '#22c55e');
        h += statCard(toplamGecikme, 'Geciken', '#ef4444');
        h += '</div>';

        entries.forEach(function (e) {
            var name = e[0], p = e[1], total = p.rows.length;
            var dPct = total > 0 ? Math.round((p.done / total) * 100) : 0;
            var bPct = total > 0 ? Math.round((p.prog / total) * 100) : 0;
            var wPct = Math.max(0, 100 - dPct - bPct);
            h += '<div class="rpt-card"><div class="rpt-card-header"><span>' + esc(name);
            if (p.gecikme > 0) h += ' <span class="rpt-overdue-badge">' + p.gecikme + ' gecikme</span>';
            h += '</span><span class="rpt-badge">' + total + ' i\u00e7erik \u00b7 %' + dPct + '</span></div>';
            h += '<div class="rpt-card-body" style="padding:12px 16px 0">';
            // Progress bar + legend
            h += '<div class="rpt-sorumlu-progress">';
            h += '<div class="rpt-progress-bar">';
            if (dPct > 0) h += '<div class="rpt-pb-seg rpt-pb-done" style="width:' + dPct + '%">' + p.done + '</div>';
            if (bPct > 0) h += '<div class="rpt-pb-seg rpt-pb-prog" style="width:' + bPct + '%">' + p.prog + '</div>';
            if (wPct > 0) h += '<div class="rpt-pb-seg rpt-pb-wait" style="width:' + wPct + '%">' + p.wait + '</div>';
            h += '</div>';
            h += '<div class="rpt-pb-legend">';
            h += '<span><span class="rpt-dot" style="background:#22c55e"></span>Tamam ' + p.done + '</span>';
            h += '<span><span class="rpt-dot" style="background:#3b82f6"></span>Devam ' + p.prog + '</span>';
            h += '<span><span class="rpt-dot" style="background:#e2e8f0"></span>Bekleyen ' + p.wait + '</span>';
            if (p.gecikme) h += '<span><span class="rpt-dot" style="background:#ef4444"></span>Geciken ' + p.gecikme + '</span>';
            h += '</div></div>';
            // Tablo
            h += '<table class="rpt-table"><thead><tr><th>Kitap</th><th>Ders</th><th>\u00dcnite</th><th>\u0130\u00e7erik</th><th>A\u015fama</th><th>G\u00f6rev</th><th>S\u00fcre</th></tr></thead><tbody>';
            p.rows.forEach(function (r) {
                var rowCls = r.overdue ? ' class="rpt-row-overdue"' : '';
                h += '<tr' + rowCls + '><td>#' + esc(r.kitapId) + '</td><td>' + esc(r.kitapDers) + '</td><td>' + esc(r.unite) + '</td>';
                h += '<td>' + esc(r.ad) + '</td>';
                h += '<td><span class="rpt-dot" style="background:' + (icDurumColors[r.durum] || '#94a3b8') + '"></span>' + esc(r.durum) + '</td>';
                h += '<td>' + esc(r.gorevDurum || '-') + '</td>';
                if (r.sonTarih) {
                    var kalan = Math.ceil((new Date(r.sonTarih) - new Date()) / 86400000);
                    var kalanCls = kalan < 0 ? 'rpt-gun-overdue' : (kalan <= 2 ? 'rpt-gun-warn' : '');
                    h += '<td class="' + kalanCls + '">' + kalan + 'g</td>';
                } else {
                    h += '<td>-</td>';
                }
                h += '</tr>';
            });
            h += '</tbody></table></div></div>';
        });
        return h || '<div style="padding:24px;text-align:center;color:var(--text-light)">Se\u00e7ilen filtrelere uygun sonu\u00e7 yok</div>';
    }

    /* ═══════════════════════════════════════════
       6. NOTLAR RAPORU
    ═══════════════════════════════════════════ */
    function collectNotes(bk) {
        var fEtiket = rptFilters.etiket || [];
        var notes = [];
        bk.forEach(function (b) {
            if (b.notlar) b.notlar.forEach(function (n) {
                if (fEtiket.length && fEtiket.indexOf(n.etiket || '') === -1) return;
                notes.push({ tarih: n.tarih, yazar: n.yazar, metin: n.metin, etiket: n.etiket, kaynak: '#' + b.id + ' - ' + (b.ders || b.baslik), tip: 'Kitap' });
            });
            if (b.uniteler) b.uniteler.forEach(function (u) {
                if (u.icerikler) u.icerikler.forEach(function (ic) {
                    if (ic.notlar) ic.notlar.forEach(function (n) {
                        if (fEtiket.length && fEtiket.indexOf(n.etiket || '') === -1) return;
                        notes.push({ tarih: n.tarih, yazar: n.yazar, metin: n.metin, etiket: n.etiket || '', kaynak: '#' + b.id + ' \u203a ' + (u.ad || '') + ' \u203a ' + (ic.ad || ''), tip: 'E-\u0130\u00e7erik' });
                    });
                });
            });
        });
        notes.sort(function (a, b) { return (b.tarih || '').localeCompare(a.tarih || ''); });
        return notes;
    }

    function renderNotlar(bk) {
        var notes = collectNotes(bk);
        var tagLabels = { bilgi: 'Bilgi', uyari: 'Uyar\u0131', sorun: 'Sorun', cozum: '\u00c7\u00f6z\u00fcm' };
        var h = '<div class="rpt-stats">';
        h += statCard(notes.length, 'Toplam Not', '#ec4899');
        var kitapNot = notes.filter(function (n) { return n.tip === 'Kitap'; }).length;
        h += statCard(kitapNot, 'Kitap Notu', '#8b5cf6');
        h += statCard(notes.length - kitapNot, 'E-\u0130\u00e7erik Notu', '#06b6d4');
        h += '</div>';
        if (!notes.length) return h + '<div style="padding:24px;text-align:center;color:var(--text-light)">Hen\u00fcz not yok</div>';
        h += '<div class="rpt-card"><div class="rpt-card-header">T\u00fcm Notlar</div><div class="rpt-card-body">';
        h += '<table class="rpt-table"><thead><tr><th>Tarih</th><th>Yazar</th><th>Kaynak</th><th>Etiket</th><th>Not</th></tr></thead><tbody>';
        notes.forEach(function (n) {
            h += '<tr><td style="white-space:nowrap">' + esc(n.tarih) + '</td>';
            h += '<td>' + esc(n.yazar) + '</td>';
            h += '<td class="rpt-note-source">' + esc(n.kaynak) + '</td>';
            h += '<td>';
            if (n.etiket && tagLabels[n.etiket]) h += '<span class="rpt-tag rpt-tag-' + n.etiket + '">' + tagLabels[n.etiket] + '</span>';
            else h += '-';
            h += '</td>';
            h += '<td class="rpt-note-text">' + esc(n.metin) + '</td></tr>';
        });
        h += '</tbody></table></div></div>';
        return h;
    }

    /* ═══════════════════════════════════════════
       7. YAYINEVI RAPORU
    ═══════════════════════════════════════════ */
    function renderYayinevi(bk) {
        var fIcDurum = rptFilters.icDurum || [];
        var grouped = {};
        bk.forEach(function (b) { var y = b.yayinevi || 'Belirtilmemi\u015f'; if (!grouped[y]) grouped[y] = []; grouped[y].push(b); });
        var keys = Object.keys(grouped).sort(function (a, b) { return grouped[b].length - grouped[a].length; });

        // \u00dcst istatistik
        var h = '<div class="rpt-stats">';
        h += statCard(bk.length, 'Toplam Kitap', '#3b82f6');
        h += statCard(keys.length, 'Yay\u0131nevi', '#8b5cf6');
        var totalIc = 0, doneIc = 0;
        bk.forEach(function (b) { if (b.uniteler) b.uniteler.forEach(function (u) { if (u.icerikler) u.icerikler.forEach(function (ic) {
            var d = ic.durum || '\u0130\u00e7erik Gelmedi';
            if (fIcDurum.length && fIcDurum.indexOf(d) === -1) return;
            totalIc++; if (d.indexOf('Tamamland') > -1) doneIc++;
        }); }); });
        var oPct = totalIc > 0 ? Math.round((doneIc / totalIc) * 100) : 0;
        h += statCard(totalIc, 'E-\u0130\u00e7erik', '#06b6d4');
        h += statCard('%' + oPct, 'Tamamlanma', '#22c55e');
        h += '</div>';

        keys.forEach(function (y) {
            var list = grouped[y];
            // Yayınevi ilerleme
            var yTotal = 0, yDone = 0;
            list.forEach(function (b) { if (b.uniteler) b.uniteler.forEach(function (u) { if (u.icerikler) u.icerikler.forEach(function (ic) {
                var d = ic.durum || '\u0130\u00e7erik Gelmedi';
                if (fIcDurum.length && fIcDurum.indexOf(d) === -1) return;
                yTotal++; if (d.indexOf('Tamamland') > -1) yDone++;
            }); }); });
            var yPct = yTotal > 0 ? Math.round((yDone / yTotal) * 100) : 0;
            h += '<div class="rpt-card"><div class="rpt-card-header"><span>' + esc(y) + '</span>';
            h += '<span class="rpt-badge">' + list.length + ' kitap \u00b7 ' + yDone + '/' + yTotal + ' e-i\u00e7erik \u00b7 %' + yPct + '</span></div>';
            h += '<div class="rpt-card-body">';
            // Mini progress bar
            if (yTotal > 0) {
                h += '<div style="padding:8px 12px 0"><div class="rpt-mini-bar" style="height:6px"><div class="rpt-mini-bar-fill" style="width:' + yPct + '%;background:' + (yPct === 100 ? '#22c55e' : '#4f46e5') + '"></div></div></div>';
            }
            h += bookTable(list) + '</div></div>';
        });
        return h;
    }

    /* ═══════════════════════════════════════════
       8. ICERIK GELMEDI RAPORU
    ═══════════════════════════════════════════ */
    function renderGelmedi(bk) {
        // Tüm "İçerik Gelmedi" durumundaki e-içerikleri topla
        var rows = [];
        var byDers = {}, byYayinevi = {}, byKitap = {};
        bk.forEach(function (b) {
            if (!b.uniteler) return;
            var kitapKey = '#' + b.id + ' ' + (b.ders || '');
            b.uniteler.forEach(function (u) {
                if (!u.icerikler) return;
                u.icerikler.forEach(function (ic) {
                    var durum = ic.durum || '\u0130\u00e7erik Gelmedi';
                    if (durum !== '\u0130\u00e7erik Gelmedi') return;
                    rows.push({
                        kitapId: b.id, ders: b.ders || '', sinif: b.sinif || '',
                        okul: b.okul || '', yayinevi: b.yayinevi || '', yazar: (b.yazarlar || []).join(', '),
                        unite: u.ad, ad: ic.ad, tip: ic.tip, mebTur: ic.mebTur || '', tur: ic.tur || ''
                    });
                    var d = b.ders || 'Belirtilmemi\u015f';
                    byDers[d] = (byDers[d] || 0) + 1;
                    var y = b.yayinevi || 'Belirtilmemi\u015f';
                    byYayinevi[y] = (byYayinevi[y] || 0) + 1;
                    byKitap[kitapKey] = (byKitap[kitapKey] || 0) + 1;
                });
            });
        });

        // Toplam e-içerik sayısı (karşılaştırma için)
        var totalIc = 0;
        bk.forEach(function (b) { if (b.uniteler) b.uniteler.forEach(function (u) { if (u.icerikler) totalIc += u.icerikler.length; }); });
        var gelmedPct = totalIc > 0 ? Math.round((rows.length / totalIc) * 100) : 0;

        // Stat kartları
        var h = '<div class="rpt-stats">';
        h += statCard(rows.length, '\u0130\u00e7erik Gelmedi', '#ef4444');
        h += statCard(totalIc, 'Toplam E-\u0130\u00e7erik', '#06b6d4');
        h += statCard('%' + gelmedPct, 'Gelmedi Oran\u0131', '#f59e0b');
        h += statCard(Object.keys(byKitap).length, 'Etkilenen Kitap', '#8b5cf6');
        h += '</div>';

        if (!rows.length) return h + '<div style="padding:24px;text-align:center;color:#22c55e;font-weight:600">T\u00fcm i\u00e7erikler gelmi\u015f \u2713</div>';

        // Ders dağılımı + Yayınevi dağılımı yan yana
        h += '<div class="rpt-two-col">';
        // Ders dağılımı
        var dersKeys = Object.keys(byDers).sort(function (a, b) { return byDers[b] - byDers[a]; });
        h += '<div class="rpt-card"><div class="rpt-card-header"><span>Derse G\u00f6re</span><span class="rpt-badge">' + dersKeys.length + ' ders</span></div>';
        h += '<div class="rpt-card-body"><table class="rpt-table"><thead><tr><th>Ders</th><th>Gelmedi</th><th></th></tr></thead><tbody>';
        var maxDers = byDers[dersKeys[0]] || 1;
        dersKeys.forEach(function (d, i) {
            var c = byDers[d];
            var w = Math.round((c / maxDers) * 100);
            h += '<tr><td>' + esc(d) + '</td><td><strong>' + c + '</strong></td>';
            h += '<td style="width:100px"><div class="rpt-mini-bar"><div class="rpt-mini-bar-fill" style="width:' + w + '%;background:' + pColors[i % pColors.length] + '"></div></div></td></tr>';
        });
        h += '</tbody></table></div></div>';

        // Yayınevi dağılımı
        var yKeys = Object.keys(byYayinevi).sort(function (a, b) { return byYayinevi[b] - byYayinevi[a]; });
        h += '<div class="rpt-card"><div class="rpt-card-header"><span>Yay\u0131nevine G\u00f6re</span><span class="rpt-badge">' + yKeys.length + ' yay\u0131nevi</span></div>';
        h += '<div class="rpt-card-body"><table class="rpt-table"><thead><tr><th>Yay\u0131nevi</th><th>Gelmedi</th><th></th></tr></thead><tbody>';
        var maxY = byYayinevi[yKeys[0]] || 1;
        yKeys.forEach(function (y, i) {
            var c = byYayinevi[y];
            var w = Math.round((c / maxY) * 100);
            h += '<tr><td>' + esc(y) + '</td><td><strong>' + c + '</strong></td>';
            h += '<td style="width:100px"><div class="rpt-mini-bar"><div class="rpt-mini-bar-fill" style="width:' + w + '%;background:' + pColors[(i + 4) % pColors.length] + '"></div></div></td></tr>';
        });
        h += '</tbody></table></div></div>';
        h += '</div>'; // rpt-two-col

        // Kitap bazlı detay tablo
        var kitapKeys = Object.keys(byKitap).sort(function (a, b) { return byKitap[b] - byKitap[a]; });
        h += '<div class="rpt-card"><div class="rpt-card-header"><span>Detayl\u0131 Liste</span><span class="rpt-badge">' + rows.length + ' e-i\u00e7erik</span></div>';
        h += '<div class="rpt-card-body">';
        h += '<table class="rpt-table"><thead><tr><th>#</th><th>Ders</th><th>S\u0131n\u0131f</th><th>Yay\u0131nevi</th><th>\u00dcnite</th><th>\u0130\u00e7erik</th><th>MEB T\u00fcr</th></tr></thead><tbody>';
        rows.forEach(function (r) {
            h += '<tr>';
            h += '<td>' + esc(r.kitapId) + '</td>';
            h += '<td>' + esc(r.ders) + '</td>';
            h += '<td>' + esc(r.sinif) + '</td>';
            h += '<td>' + esc(r.yayinevi) + '</td>';
            h += '<td>' + esc(r.unite) + '</td>';
            h += '<td>' + esc(r.ad) + '</td>';
            h += '<td>' + esc(r.mebTur || r.tur || '-') + '</td>';
            h += '</tr>';
        });
        h += '</tbody></table></div></div>';
        return h;
    }

    /* ═══════════════════════════════════════════
       9. KISI BAZLI GOREV RAPORU
    ═══════════════════════════════════════════ */
    function collectGorevData(bk) {
        var fAtanan = rptFilters.atanan || [];
        var rows = [];
        bk.forEach(function (b) {
            if (!b.uniteler) return;
            b.uniteler.forEach(function (u) {
                if (!u.icerikler) return;
                u.icerikler.forEach(function (ic) {
                    // Aktif gorev
                    var g = ic.gorev;
                    if (g && g.atananId) {
                        if (fAtanan.length && fAtanan.indexOf(g.atananAd || '') === -1) return;
                        var isOverdue = g.durum !== 'Tamamland\u0131' && g.sonTarih && new Date() > new Date(g.sonTarih);
                        var wasLate = g.durum === 'Tamamland\u0131' && g.sonTarih && g.tamamlanmaTarihi && new Date(g.tamamlanmaTarihi) > new Date(g.sonTarih);
                        rows.push({
                            kitapId: b.id, ders: b.ders, unite: u.ad, ad: ic.ad,
                            asama: g.asama || ic.durum || '', kisi: g.atananAd || '',
                            kisiId: g.atananId, atanma: g.atanmaTarihi || '', sonTarih: g.sonTarih || '',
                            tamamlanma: g.tamamlanmaTarihi || '', durum: g.durum || '',
                            gun: g.tahminiGun || 0, isHistory: false, isOverdue: isOverdue, wasLate: wasLate
                        });
                    }
                    // Gecmis gorevler
                    (ic.gorevGecmisi || []).forEach(function (gg) {
                        if (!gg.atananId) return;
                        if (fAtanan.length && fAtanan.indexOf(gg.atananAd || '') === -1) return;
                        var wasLate = gg.sonTarih && gg.tamamlanmaTarihi && new Date(gg.tamamlanmaTarihi) > new Date(gg.sonTarih);
                        rows.push({
                            kitapId: b.id, ders: b.ders, unite: u.ad, ad: ic.ad,
                            asama: gg.asama || '', kisi: gg.atananAd || '',
                            kisiId: gg.atananId, atanma: gg.atanmaTarihi || '', sonTarih: gg.sonTarih || '',
                            tamamlanma: gg.tamamlanmaTarihi || '', durum: 'Onayland\u0131',
                            gun: gg.tahminiGun || 0, isHistory: true, isOverdue: false, wasLate: wasLate
                        });
                    });
                });
            });
        });
        return rows;
    }

    function renderGorevKisi(bk) {
        var rows = collectGorevData(bk);
        // Kisi bazli gruplama
        var byKisi = {};
        rows.forEach(function (r) {
            var key = r.kisi || 'Bilinmiyor';
            if (!byKisi[key]) byKisi[key] = { aktif: 0, devam: 0, gecikli: 0, tamamlandi: 0, onaylandi: 0, zamaninda: 0, gecikmeli: 0, toplam: 0, rows: [] };
            var p = byKisi[key];
            p.toplam++;
            p.rows.push(r);
            if (r.isHistory) {
                p.onaylandi++;
                if (r.wasLate) p.gecikmeli++; else p.zamaninda++;
            } else if (r.durum === 'Tamamland\u0131') {
                p.tamamlandi++;
                if (r.wasLate) p.gecikmeli++; else p.zamaninda++;
            } else if (r.isOverdue) {
                p.gecikli++;
            } else {
                p.devam++;
            }
        });

        var entries = Object.keys(byKisi).sort(function (a, b) { return byKisi[b].toplam - byKisi[a].toplam; });
        var toplamKisi = entries.length;
        var toplamGorev = rows.length;
        var toplamZamaninda = 0, toplamGecikmeli = 0, toplamAktifGecikli = 0;
        entries.forEach(function (k) { var p = byKisi[k]; toplamZamaninda += p.zamaninda; toplamGecikmeli += p.gecikmeli; toplamAktifGecikli += p.gecikli; });

        var h = '<div class="rpt-stats">';
        h += statCard(toplamKisi, 'Ki\u015fi', '#8b5cf6');
        h += statCard(toplamGorev, 'Toplam G\u00f6rev', '#3b82f6');
        h += statCard(toplamZamaninda, 'Zaman\u0131nda', '#22c55e');
        h += statCard(toplamGecikmeli, 'Gecikmeli', '#f59e0b');
        h += statCard(toplamAktifGecikli, 'Aktif Geciken', '#ef4444');
        h += '</div>';

        entries.forEach(function (name) {
            var p = byKisi[name];
            var tamamlanan = p.zamaninda + p.gecikmeli;
            var basariPct = tamamlanan > 0 ? Math.round((p.zamaninda / tamamlanan) * 100) : 0;
            h += '<div class="rpt-card"><div class="rpt-card-header"><span>' + esc(name);
            if (p.gecikli) h += ' <span class="rpt-overdue-badge">' + p.gecikli + ' geciken</span>';
            h += '</span><span class="rpt-badge">' + p.toplam + ' g\u00f6rev';
            if (tamamlanan > 0) h += ' \u00b7 %' + basariPct + ' zaman\u0131nda';
            h += '</span></div>';
            h += '<div class="rpt-card-body" style="padding:12px 16px 0">';
            // Ozet chips
            h += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">';
            if (p.devam) h += '<span class="gorev-chip gorev-chip-devam">' + p.devam + ' devam</span>';
            if (p.gecikli) h += '<span class="gorev-chip gorev-chip-gecikli">' + p.gecikli + ' geciken</span>';
            if (p.tamamlandi) h += '<span class="gorev-chip gorev-chip-tamamlandi">' + p.tamamlandi + ' tamamland\u0131</span>';
            if (p.onaylandi) h += '<span class="gorev-chip gorev-chip-onaylandi">' + p.onaylandi + ' onayland\u0131</span>';
            if (p.zamaninda) h += '<span class="gorev-chip" style="background:rgba(34,197,94,.12);color:#16a34a">' + p.zamaninda + ' zaman\u0131nda</span>';
            if (p.gecikmeli) h += '<span class="gorev-chip" style="background:rgba(245,158,11,.12);color:#d97706">' + p.gecikmeli + ' gecikmeli</span>';
            h += '</div>';
            // Tablo
            h += '<table class="rpt-table"><thead><tr><th>Kitap</th><th>\u0130\u00e7erik</th><th>A\u015fama</th><th>Atanma</th><th>Son Tarih</th><th>Tamamlanma</th><th>Sonu\u00e7</th></tr></thead><tbody>';
            p.rows.forEach(function (r) {
                var cls = r.isOverdue ? ' class="rpt-row-overdue"' : (r.wasLate ? ' class="rpt-row-late"' : '');
                h += '<tr' + cls + '>';
                h += '<td>#' + esc(r.kitapId) + ' ' + esc(r.ders) + '</td>';
                h += '<td>' + esc(r.ad) + '</td>';
                h += '<td>' + esc(r.asama) + '</td>';
                h += '<td>' + esc(r.atanma) + '</td>';
                h += '<td>' + esc(r.sonTarih) + '</td>';
                h += '<td>' + esc(r.tamamlanma || '-') + '</td>';
                var stLbl, stCls;
                if (r.isHistory) { stLbl = r.wasLate ? 'Gecikmeli \u2713' : 'Zaman\u0131nda \u2713'; stCls = r.wasLate ? 'rpt-gun-overdue' : 'rpt-gun-ok'; }
                else if (r.durum === 'Tamamland\u0131') { stLbl = r.wasLate ? 'Gecikmeli' : 'Zaman\u0131nda'; stCls = r.wasLate ? 'rpt-gun-warn' : 'rpt-gun-ok'; }
                else if (r.isOverdue) { stLbl = 'Gecikiyor!'; stCls = 'rpt-gun-overdue'; }
                else { stLbl = 'Devam'; stCls = ''; }
                h += '<td class="' + stCls + '">' + stLbl + '</td>';
                h += '</tr>';
            });
            h += '</tbody></table></div></div>';
        });
        return h || '<div style="padding:24px;text-align:center;color:var(--text-light)">Hi\u00e7 g\u00f6rev atanmam\u0131\u015f</div>';
    }

    /* ═══════════════════════════════════════════
       10. GOREV BAZLI RAPOR
    ═══════════════════════════════════════════ */
    function renderGorevBazli(bk) {
        var rows = collectGorevData(bk);
        // Istatistikler
        var toplamAktif = 0, toplamDevam = 0, toplamGecikli = 0, toplamTamamlandi = 0, toplamOnaylandi = 0, toplamZamaninda = 0, toplamGecikmeli = 0;
        rows.forEach(function (r) {
            if (r.isHistory) { toplamOnaylandi++; if (r.wasLate) toplamGecikmeli++; else toplamZamaninda++; }
            else if (r.durum === 'Tamamland\u0131') { toplamTamamlandi++; if (r.wasLate) toplamGecikmeli++; else toplamZamaninda++; }
            else if (r.isOverdue) toplamGecikli++;
            else toplamDevam++;
        });
        toplamAktif = toplamDevam + toplamGecikli + toplamTamamlandi;

        var h = '<div class="rpt-stats">';
        h += statCard(rows.length, 'Toplam G\u00f6rev', '#3b82f6');
        h += statCard(toplamAktif, 'Aktif', '#f59e0b');
        h += statCard(toplamGecikli, 'Geciken', '#ef4444');
        h += statCard(toplamZamaninda, 'Zaman\u0131nda', '#22c55e');
        h += statCard(toplamGecikmeli, 'Gecikmeli Biten', '#f97316');
        h += statCard(toplamOnaylandi, 'Onayland\u0131', '#8b5cf6');
        h += '</div>';

        // Sıralama: geciken > aktif > tamamlanan > onaylanan
        rows.sort(function (a, b) {
            var pa = a.isOverdue ? 0 : (!a.isHistory && a.durum !== 'Tamamland\u0131' ? 1 : (a.durum === 'Tamamland\u0131' ? 2 : 3));
            var pb = b.isOverdue ? 0 : (!b.isHistory && b.durum !== 'Tamamland\u0131' ? 1 : (b.durum === 'Tamamland\u0131' ? 2 : 3));
            return pa - pb;
        });

        h += '<div class="rpt-card"><div class="rpt-card-header"><span>T\u00fcm G\u00f6revler</span><span class="rpt-badge">' + rows.length + ' g\u00f6rev</span></div>';
        h += '<div class="rpt-card-body">';
        h += '<table class="rpt-table"><thead><tr><th>Kitap</th><th>\u0130\u00e7erik</th><th>A\u015fama</th><th>Ki\u015fi</th><th>Atanma</th><th>Son Tarih</th><th>Tamamlanma</th><th>Durum</th></tr></thead><tbody>';
        rows.forEach(function (r) {
            var cls = r.isOverdue ? ' class="rpt-row-overdue"' : (r.wasLate ? ' class="rpt-row-late"' : '');
            h += '<tr' + cls + '>';
            h += '<td>#' + esc(r.kitapId) + ' ' + esc(r.ders) + '</td>';
            h += '<td>' + esc(r.ad) + '</td>';
            h += '<td>' + esc(r.asama) + '</td>';
            h += '<td>' + esc(r.kisi) + '</td>';
            h += '<td>' + esc(r.atanma) + '</td>';
            h += '<td>' + esc(r.sonTarih) + '</td>';
            h += '<td>' + esc(r.tamamlanma || '-') + '</td>';
            var stLbl, stCls;
            if (r.isHistory) { stLbl = r.wasLate ? 'Gecikmeli \u2713' : 'Onayland\u0131 \u2713'; stCls = r.wasLate ? 'rpt-gun-overdue' : 'rpt-gun-ok'; }
            else if (r.durum === 'Tamamland\u0131') { stLbl = r.wasLate ? 'Gecikmeli' : 'Tamamland\u0131'; stCls = r.wasLate ? 'rpt-gun-warn' : 'rpt-gun-ok'; }
            else if (r.isOverdue) {
                var g = Math.abs(Math.ceil((new Date(r.sonTarih) - new Date()) / 86400000));
                stLbl = g + ' g\u00fcn ge\u00e7ti!'; stCls = 'rpt-gun-overdue';
            }
            else {
                if (r.sonTarih) {
                    var kalan = Math.ceil((new Date(r.sonTarih) - new Date()) / 86400000);
                    stLbl = kalan + ' g\u00fcn kald\u0131'; stCls = kalan <= 2 ? 'rpt-gun-warn' : '';
                } else { stLbl = 'Devam'; stCls = ''; }
            }
            h += '<td class="' + stCls + '">' + stLbl + '</td>';
            h += '</tr>';
        });
        h += '</tbody></table></div></div>';
        return h || '<div style="padding:24px;text-align:center;color:var(--text-light)">Hi\u00e7 g\u00f6rev atanmam\u0131\u015f</div>';
    }

    /* ─── Shared table builder ─── */
    function bookTable(list, hideders) {
        var h = '<table class="rpt-table"><thead><tr><th>Kod</th>';
        if (!hideders) h += '<th>Ders</th>';
        h += '<th>Ba\u015fl\u0131k</th><th>S\u0131n\u0131f</th><th>Okul</th>';
        if (!hideders) h += '<th>Yay\u0131nevi</th>';
        h += '<th>Durum</th></tr></thead><tbody>';
        list.forEach(function (b) {
            h += '<tr><td>#' + esc(b.id) + '</td>';
            if (!hideders) h += '<td>' + esc(b.ders) + '</td>';
            h += '<td>' + esc(b.baslik) + '</td><td>' + esc(b.sinif) + '</td><td>' + esc(b.okul) + '</td>';
            if (!hideders) h += '<td>' + esc(b.yayinevi) + '</td>';
            h += '<td><span class="rpt-dot" style="background:' + (durumColors[b.durumu] || '#94a3b8') + '"></span>' + esc(b.durumu || '\u0130\u015flemde') + '</td></tr>';
        });
        h += '</tbody></table>';
        return h;
    }

    /* ═══════════════════════════════════════════
       PDF GENERATION
    ═══════════════════════════════════════════ */
    var fontLoaded = false;
    function loadFontThen(callback) {
        if (fontLoaded || window.eitPdfFont) { fontLoaded = true; callback(); return; }
        var url = (window.eitPdfConfig || {}).fontUrl;
        if (!url) { callback(); return; }
        var s = document.createElement('script');
        s.src = url;
        s.onload = function () { fontLoaded = true; callback(); };
        s.onerror = function () { callback(); };
        document.head.appendChild(s);
    }

    function downloadPdf() {
        if (typeof window.jspdf === 'undefined') { alert('PDF kütüphanesi yüklenemedi. Sayfayı yenileyip tekrar deneyin.'); return; }
        var bk = getFilteredBooks();
        if (!bk.length) { alert('Gösterilecek veri yok.'); return; }
        loadFontThen(function () {
            var rt = reportTypes.find(function (r) { return r.key === activeReport; });
            var title = rt ? rt.label : 'Rapor';
            var p = initPdf(title);
            switch (activeReport) {
                case 'genel': pdfGenel(p, bk); break;
                case 'asama': pdfAsama(p, bk); break;
                case 'ders': pdfDers(p, bk); break;
                case 'eicerik': pdfEIcerik(p, bk); break;
                case 'sorumlu': pdfSorumlu(p, bk); break;
                case 'notlar': pdfNotlar(p, bk); break;
                case 'yayinevi': pdfYayinevi(p, bk); break;
                case 'gelmedi': pdfGelmedi(p, bk); break;
                case 'gorevKisi': case 'gorevBazli': pdfGenericTable(p); break;
            }
            p.doc.save('Edop_' + activeReport + '_' + new Date().toISOString().slice(0, 10) + '.pdf');
        });
    }

    var pdfFontName = 'helvetica'; // fallback

    function registerFont(doc) {
        try {
            if (window.eitPdfFont) {
                doc.addFileToVFS('Roboto-Regular.ttf', window.eitPdfFont);
                doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
            }
            if (window.eitPdfFontBold) {
                doc.addFileToVFS('Roboto-Bold.ttf', window.eitPdfFontBold);
                doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
            }
            if (window.eitPdfFont) {
                pdfFontName = 'Roboto';
                doc.setFont('Roboto', 'normal');
            }
        } catch (_) {
            pdfFontName = 'helvetica';
        }
    }

    function initPdf(title) {
        var jsPDF = window.jspdf.jsPDF;
        var doc = new jsPDF('p', 'mm', 'a4');
        registerFont(doc);
        doc.setFontSize(16);
        doc.setFont(pdfFontName, 'bold');
        doc.text('Edop E-Takip - ' + title, 14, 18);
        doc.setFontSize(9);
        doc.setFont(pdfFontName, 'normal');
        var dateLine = 'Rapor Tarihi: ' + new Date().toLocaleDateString('tr-TR');
        var filterSummary = activeFilterSummary();
        if (filterSummary) dateLine += '  |  Filtre: ' + filterSummary;
        doc.text(dateLine, 14, 24);
        doc.setDrawColor(200);
        doc.line(14, 27, 196, 27);
        return { doc: doc, y: 32 };
    }

    function pdfSubtitle(p, text) {
        if (p.y > 270) { p.doc.addPage(); p.y = 15; }
        p.doc.setFontSize(12);
        p.doc.setFont(pdfFontName, 'bold');
        p.doc.text(text, 14, p.y);
        p.y += 7;
        p.doc.setFont(pdfFontName, 'normal');
        p.doc.setFontSize(9);
    }

    function pdfAutoTable(p, head, body, opts) {
        p.doc.autoTable(Object.assign({
            startY: p.y,
            head: [head],
            body: body,
            styles: { font: pdfFontName, fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [59, 130, 246], fontStyle: 'bold', fontSize: 8 },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            margin: { left: 14, right: 14 }
        }, opts || {}));
        p.y = p.doc.lastAutoTable.finalY + 8;
    }

    function pdfGenel(p, bk) {
        var s = computeStats(bk);
        var pct = s.totalIcerik > 0 ? Math.round((s.icerikDone / s.totalIcerik) * 100) : 0;
        p.doc.setFontSize(10);
        p.doc.text('Toplam: ' + s.total + ' kitap, ' + s.totalUnite + ' unite, ' + s.totalIcerik + ' e-icerik, ' + s.totalNot + ' not | Tamamlanma: ' + pct + '%', 14, p.y);
        p.y += 8;
        pdfSubtitle(p, 'Kitap Durumlari');
        pdfAutoTable(p, ['Durum', 'Kitap', 'Oran'], Object.keys(s.durumC).map(function (k) {
            return [k, String(s.durumC[k]), (s.total > 0 ? Math.round((s.durumC[k] / s.total) * 100) : 0) + '%'];
        }));
        if (s.totalIcerik > 0) {
            pdfSubtitle(p, 'E-Icerik Durumlari');
            pdfAutoTable(p, ['Durum', 'Adet', 'Oran'], Object.keys(s.icerikByDurum).map(function (k) {
                return [k, String(s.icerikByDurum[k]), Math.round((s.icerikByDurum[k] / s.totalIcerik) * 100) + '%'];
            }));
        }
    }

    function pdfAsama(p, bk) {
        var asamaCount = {};
        var asamaRows = {};
        bk.forEach(function (b) {
            if (!b.uniteler) return;
            b.uniteler.forEach(function (u) {
                if (!u.icerikler) return;
                u.icerikler.forEach(function (ic) {
                    var d = ic.durum || '\u0130\u00e7erik Gelmedi';
                    asamaCount[d] = (asamaCount[d] || 0) + 1;
                    if (!asamaRows[d]) asamaRows[d] = [];
                    asamaRows[d].push(['#' + b.id, b.ders, u.ad, ic.ad, ic.atanan || '-']);
                });
            });
        });
        var total = 0;
        Object.keys(asamaCount).forEach(function (k) { total += asamaCount[k]; });
        pdfSubtitle(p, 'E-Icerik Asama Dagilimi');
        pdfAutoTable(p, ['Asama', 'Adet', 'Oran'], icerikAsamalari.map(function (a) {
            var c = asamaCount[a] || 0;
            return [a, String(c), (total > 0 ? Math.round((c / total) * 100) : 0) + '%'];
        }));
        icerikAsamalari.forEach(function (a) {
            var rows = asamaRows[a];
            if (!rows || !rows.length) return;
            pdfSubtitle(p, a + ' (' + rows.length + ' e-icerik)');
            pdfAutoTable(p, ['Kitap', 'Ders', 'Unite', 'Icerik', 'Sorumlu'], rows, { styles: { fontSize: 7, cellPadding: 1.5 } });
        });
    }

    function pdfDers(p, bk) {
        var grouped = {};
        bk.forEach(function (b) { var d = b.ders || 'Belirtilmemis'; if (!grouped[d]) grouped[d] = []; grouped[d].push(b); });
        Object.keys(grouped).sort(function (a, b) { return a.localeCompare(b, 'tr'); }).forEach(function (d) {
            pdfSubtitle(p, d + ' (' + grouped[d].length + ' kitap)');
            pdfAutoTable(p, ['Kod', 'Baslik', 'Sinif', 'Okul', 'Yayinevi', 'Durum'], grouped[d].map(function (b) {
                return ['#' + b.id, b.baslik, b.sinif, b.okul, b.yayinevi, b.durumu || 'Islemde'];
            }));
        });
    }

    function pdfEIcerik(p, bk) {
        var rows = flattenIcerik(bk);
        pdfSubtitle(p, 'Tum E-Icerikler (' + rows.length + ')');
        pdfAutoTable(p, ['Kitap', 'Icerik', 'Tur', 'Durum', 'Sorumlu', 'Icerik Geldi', 'Uretim Bas.', 'On Kontrol', 'Tamamlandi'], rows.map(function (r) {
            return [
                '#' + r.kitapId + ' ' + r.kitapDers, r.ad, r.tur || '-', r.durum, r.atanan || '-',
                getAsamaTarih(r, '\u0130\u00e7erik Geldi') || '-',
                getAsamaTarih(r, '\u00dcretime Ba\u015fland\u0131') || '-',
                getAsamaTarih(r, '\u00d6n Kontrol') || '-',
                getAsamaTarih(r, 'Tamamland\u0131') || '-'
            ];
        }), { styles: { fontSize: 6.5, cellPadding: 1.5 } });
    }

    function pdfSorumlu(p, bk) {
        var fAtanan = rptFilters.atanan || [];
        var people = {};
        bk.forEach(function (b) {
            if (!b.uniteler) return;
            b.uniteler.forEach(function (u) {
                if (!u.icerikler) return;
                u.icerikler.forEach(function (ic) {
                    var g = ic.gorev || {};
                    var a = g.atananAd || ic.atanan || 'Atanmamis';
                    if (fAtanan.length && fAtanan.indexOf(a) === -1) return;
                    if (!people[a]) people[a] = [];
                    var durum = ic.durum || '\u0130\u00e7erik Gelmedi';
                    var gun = '';
                    if (g.sonTarih) {
                        var kalan = Math.ceil((new Date(g.sonTarih) - new Date()) / 86400000);
                        gun = kalan + 'g';
                    }
                    people[a].push(['#' + b.id, b.ders, u.ad, ic.ad, durum, g.durum || '-', gun || '-']);
                });
            });
        });
        Object.keys(people).map(function (k) { return [k, people[k]]; }).sort(function (a, b) { return b[1].length - a[1].length; }).forEach(function (e) {
            pdfSubtitle(p, e[0] + ' (' + e[1].length + ' icerik)');
            pdfAutoTable(p, ['Kitap', 'Ders', 'Unite', 'Icerik', 'Asama', 'Gorev', 'Sure'], e[1]);
        });
    }

    function pdfNotlar(p, bk) {
        var notes = collectNotes(bk);
        pdfSubtitle(p, 'Tum Notlar (' + notes.length + ')');
        if (notes.length) {
            pdfAutoTable(p, ['Tarih', 'Yazar', 'Kaynak', 'Etiket', 'Not'], notes.map(function (n) {
                return [n.tarih || '', n.yazar || '', n.kaynak, n.etiket || '-', n.metin || ''];
            }), { styles: { fontSize: 7, cellPadding: 1.5 }, columnStyles: { 4: { cellWidth: 60 } } });
        } else {
            p.doc.text('Henuz not yok.', 14, p.y); p.y += 6;
        }
    }

    function pdfYayinevi(p, bk) {
        var grouped = {};
        bk.forEach(function (b) { var y = b.yayinevi || 'Belirtilmemis'; if (!grouped[y]) grouped[y] = []; grouped[y].push(b); });
        Object.keys(grouped).sort(function (a, b) { return grouped[b].length - grouped[a].length; }).forEach(function (y) {
            pdfSubtitle(p, y + ' (' + grouped[y].length + ' kitap)');
            pdfAutoTable(p, ['Kod', 'Ders', 'Baslik', 'Sinif', 'Okul', 'Durum'], grouped[y].map(function (b) {
                return ['#' + b.id, b.ders, b.baslik, b.sinif, b.okul, b.durumu || 'Islemde'];
            }));
        });
    }

    function pdfGelmedi(p, bk) {
        var rows = [];
        bk.forEach(function (b) {
            if (!b.uniteler) return;
            b.uniteler.forEach(function (u) {
                if (!u.icerikler) return;
                u.icerikler.forEach(function (ic) {
                    if ((ic.durum || '\u0130\u00e7erik Gelmedi') !== '\u0130\u00e7erik Gelmedi') return;
                    rows.push(['#' + b.id, b.ders || '', b.sinif || '', b.yayinevi || '', u.ad, ic.ad, ic.mebTur || ic.tur || '-']);
                });
            });
        });
        pdfSubtitle(p, '\u0130\u00e7erik Gelmedi (' + rows.length + ' e-i\u00e7erik)');
        if (rows.length) {
            pdfAutoTable(p, ['Kitap', 'Ders', 'S\u0131n\u0131f', 'Yay\u0131nevi', '\u00dcnite', '\u0130\u00e7erik', 'MEB T\u00fcr'], rows, { styles: { fontSize: 7, cellPadding: 1.5 } });
        } else {
            p.doc.text('T\u00fcm i\u00e7erikler gelmi\u015f.', 14, p.y); p.y += 6;
        }
    }

    /* Generic PDF: rapor body'sindeki tabloyu direkt PDF'e al */
    function pdfGenericTable(p) {
        var body = document.getElementById('reportsBody');
        if (!body) return;
        var tables = body.querySelectorAll('.rpt-table');
        tables.forEach(function (tbl) {
            var heads = []; var rows = [];
            tbl.querySelectorAll('thead th').forEach(function (th) { heads.push(th.textContent.trim()); });
            tbl.querySelectorAll('tbody tr').forEach(function (tr) {
                var r = [];
                tr.querySelectorAll('td').forEach(function (td) { r.push(td.textContent.trim()); });
                rows.push(r);
            });
            if (heads.length && rows.length) {
                pdfAutoTable(p, heads, rows, { styles: { fontSize: 7, cellPadding: 1.5 } });
                p.y += 4;
            }
        });
    }

})();
