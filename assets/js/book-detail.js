/**
 * EIT Book Detail Page v6.0
 * Tek katmanli e-icerik bazli takip
 * Kompakt satir + acilir panel + timeline
 * Her asamada gorev atama + toplu secim
 */
(function () {
    'use strict';

    var $page, $grid, $pills, $info, $empty;
    var currentBook = null;
    var selectedIcerikler = {}; // { 'ui-ii': true }
    var openPanels = {}; // { 'ui-ii': true }
    var bulkAllKeys = [];
    var bulkSureValue = 7;

    var icerikDurumlari = [
        '\u0130\u00e7erik Gelmedi',
        '\u0130\u00e7erik Geldi',
        '\u00d6n \u0130nceleme',
        'T\u00fcrk\u00e7e Okuma',
        '\u00dcretime Ba\u015fland\u0131',
        '\u00dcretim Devam Ediyor',
        'E-\u0130\u00e7erik \u00dcretim Tamamland\u0131',
        '\u00d6n Kontrol',
        'Scorm V2',
        'Tashih',
        'Son Kontrol',
        'Tamamland\u0131'
    ];
    window.eitIcerikDurumlari = icerikDurumlari;

    // Gorev atanabilecek asamalar (Icerik Gelmedi haric tumu)
    var gorevAtanabilirAsamalar = ['\u0130\u00e7erik Geldi', '\u00d6n \u0130nceleme', 'T\u00fcrk\u00e7e Okuma', '\u00dcretime Ba\u015fland\u0131', '\u00dcretim Devam Ediyor', 'E-\u0130\u00e7erik \u00dcretim Tamamland\u0131', '\u00d6n Kontrol', 'Scorm V2', 'Tashih', 'Son Kontrol'];

    // Asama gruplari (progress dots icin)
    var asamaGruplari = [
        { label: '\u0130nceleme', cls: 'grp-inceleme', asamalar: ['\u0130\u00e7erik Gelmedi', '\u0130\u00e7erik Geldi', '\u00d6n \u0130nceleme', 'T\u00fcrk\u00e7e Okuma'] },
        { label: '\u00dcretim', cls: 'grp-uretim', asamalar: ['\u00dcretime Ba\u015fland\u0131', '\u00dcretim Devam Ediyor', 'E-\u0130\u00e7erik \u00dcretim Tamamland\u0131'] },
        { label: 'Post-prod', cls: 'grp-postprod', asamalar: ['\u00d6n Kontrol', 'Scorm V2', 'Tashih', 'Son Kontrol', 'Tamamland\u0131'] }
    ];

    var notEtiketleri = [
        { id: 'bilgi', label: 'Bilgi' },
        { id: 'uyari', label: 'Uyar\u0131' },
        { id: 'sorun', label: 'Sorun' },
        { id: 'cozum', label: '\u00c7\u00f6z\u00fcm' }
    ];

    document.addEventListener('DOMContentLoaded', function () {
        $page = document.getElementById('detailPage');
        $grid = document.getElementById('bookGrid');
        $pills = document.getElementById('filterPills');
        $info = document.getElementById('resultsInfo');
        $empty = document.getElementById('emptyState');
    });

    window.eitOpenDetail = function (book, fromPopstate) {
        currentBook = book;
        if (!book.uniteler) book.uniteler = [];
        if (!book.notlar) book.notlar = [];
        selectedIcerikler = {};
        openPanels = {};
        show();
        if (!fromPopstate && window.eitPushState) window.eitPushState('detail', book.id);
    };

    function show() {
        $grid.style.display = 'none';
        $pills.style.display = 'none';
        $info.style.display = 'none';
        $empty.style.display = 'none';
        var ov = document.getElementById('dashOverview');
        if (ov) ov.style.display = 'none';
        var rv = document.getElementById('reportsView');
        if (rv) rv.style.display = 'none';
        ['adminView', 'criteriaView', 'eicerikTablosuView', 'gorevlerView'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) { el.style.display = 'none'; el.innerHTML = ''; }
        });
        ['adminPanelBtn', 'criteriaBtn', 'eicerikTablosuBtn', 'gorevlerBtn'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.classList.remove('active');
        });
        $page.style.display = '';
        render();
    }

    function close() {
        $page.style.display = 'none';
        $grid.style.display = '';
        $pills.style.display = '';
        $info.style.display = '';
        currentBook = null;
        selectedIcerikler = {};
        openPanels = {};
        if (window.eitRefresh) window.eitRefresh();
    }

    function esc(s) {
        if (s === null || s === undefined) return '';
        var d = document.createElement('div');
        d.textContent = String(s);
        return d.innerHTML.replace(/"/g, '&quot;');
    }

    function durumIdx(durum) {
        return icerikDurumlari.indexOf(durum || '\u0130\u00e7erik Gelmedi');
    }

    function sonrakiAsama(durum) {
        var idx = durumIdx(durum);
        return idx < icerikDurumlari.length - 1 ? icerikDurumlari[idx + 1] : durum;
    }

    /* ========== RENDER ========== */
    function render() {
        var b = currentBook;
        if (!b) return;

        var totalIc = 0, doneIc = 0;
        b.uniteler.forEach(function (u) {
            if (!u.icerikler) u.icerikler = [];
            u.icerikler.forEach(function (ic) {
                totalIc++;
                if (ic.durum === 'Tamamland\u0131') doneIc++;
            });
        });

        var h = '';

        var isTeslim = b.durumu === 'TTKB Onay\u0131';

        // Durum renk ve class
        var durumClass = isTeslim ? 'dp-st-onay' : (b.durumu === 'Havuzda' ? 'dp-st-bekleniyor' : (b.durumu === 'Ask\u0131da' ? 'dp-st-askida' : (b.durumu === 'Pasif' ? 'dp-st-pasif' : 'dp-st-islemde')));

        // Yazar string
        var yazarStr = (b.yazarlar || []).join(', ');

        // Header — read-only bilgi bandi
        h += '<div class="dp-header-band">';
        h += '<button class="dp-back" id="dpBack"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></button>';
        h += '<span class="dp-band-id">#' + esc(b.id) + '</span>';
        h += '<span class="dp-band-ders">' + esc(b.ders || b.baslik) + '</span>';
        h += '<span class="dp-band-sep"></span>';
        if (b.sinif) h += '<span class="dp-band-tag dp-band-sinif">' + esc(b.sinif) + '</span>';
        if (b.okul) h += '<span class="dp-band-tag dp-band-okul">' + esc(b.okul) + '</span>';
        if (b.yayinevi) h += '<span class="dp-band-tag dp-band-yayinevi">' + esc(b.yayinevi) + '</span>';
        if (yazarStr) h += '<span class="dp-band-tag dp-band-yazar">' + esc(yazarStr) + '</span>';
        if (b.tarih) h += '<span class="dp-band-tag dp-band-donem">' + esc(b.tarih) + '</span>';
        h += '<span class="dp-band-durum ' + durumClass + '">' + esc(b.durumu || '\u0130\u015flemde') + '</span>';
        // Unite + icerik + ilerleme
        h += '<span class="dp-band-stats">';
        var uniteCount = b.uniteler ? b.uniteler.length : 0;
        h += '<span class="dp-band-unite">' + uniteCount + ' \u00fcnite</span>';
        h += '<span class="dp-band-icerik">' + doneIc + '/' + totalIc + ' e-i\u00e7erik</span>';
        var pctBand = totalIc > 0 ? Math.round((doneIc / totalIc) * 100) : 0;
        var pctBandCls = pctBand === 100 ? 'dp-band-pct-done' : (pctBand >= 50 ? 'dp-band-pct-mid' : 'dp-band-pct-low');
        h += '<span class="dp-band-pct ' + pctBandCls + '">%' + pctBand + '</span>';
        h += '</span>';
        h += '</div>';

        // Progress bar (ince)
        var pct = totalIc > 0 ? Math.round((doneIc / totalIc) * 100) : 0;
        h += '<div class="dp-progress-slim">';
        h += '<div class="dp-progress-slim-fill" style="width:' + pct + '%"></div>';
        h += '</div>';

        // Body: uniteler
        h += '<div class="dp-body">';
        h += renderUniteler(b);
        h += '</div>';

        $page.innerHTML = h;
        bindEvents();
    }

    /* ========== ASAMA RENKLERI ========== */
    var asamaRenkleri = {
        '\u0130nceleme': { bg: '#dbeafe', fill: '#3b82f6' },
        '\u00dcretim': { bg: '#ede9fe', fill: '#8b5cf6' },
        'Post-prod': { bg: '#d1fae5', fill: '#22c55e' }
    };

    var asamaRenkMap = {
        '\u0130\u00e7erik Gelmedi': '#ef4444', '\u0130\u00e7erik Geldi': '#f97316', '\u00d6n \u0130nceleme': '#f59e0b', 'T\u00fcrk\u00e7e Okuma': '#eab308',
        '\u00dcretime Ba\u015fland\u0131': '#3b82f6', '\u00dcretim Devam Ediyor': '#6366f1', 'E-\u0130\u00e7erik \u00dcretim Tamamland\u0131': '#8b5cf6',
        '\u00d6n Kontrol': '#06b6d4', 'Scorm V2': '#0ea5e9', 'Tashih': '#ec4899', 'Son Kontrol': '#14b8a6', 'Tamamland\u0131': '#22c55e'
    };

    function getAsamaColor(durum) { return asamaRenkMap[durum] || '#94a3b8'; }

    function getAsamaBg(durum) {
        var c = getAsamaColor(durum);
        // renk + %8 opacity
        return c + '14';
    }

    /* ========== TIMELINE ========== */
    function renderTimeline(ic) {
        var currentIdx = durumIdx(ic.durum);
        var gecmis = ic.gorevGecmisi || [];
        var h = '<div class="ic-timeline">';

        asamaGruplari.forEach(function (grp, gi) {
            var colors = asamaRenkleri[grp.label] || { fill: '#3b82f6' };
            h += '<div class="tl-group">';
            h += '<div class="tl-group-header" style="color:' + colors.fill + '"><span class="tl-group-dot" style="background:' + colors.fill + '"></span>' + esc(grp.label) + '</div>';
            h += '<div class="tl-group-items">';

            grp.asamalar.forEach(function (asama) {
                var i = icerikDurumlari.indexOf(asama);
                var isDone = i < currentIdx;
                var isCurrent = i === currentIdx;
                var cls = isDone ? 'tl-done' : (isCurrent ? 'tl-current' : 'tl-pending');
                var lineColor = isDone ? colors.fill : (isCurrent ? colors.fill : 'var(--border)');

                h += '<div class="ic-timeline-item ' + cls + '">';
                h += '<div class="tl-line-wrap"><div class="tl-line" style="background:' + lineColor + '"></div>';
                if (isDone) {
                    h += '<span class="tl-icon tl-icon-done" style="background:' + colors.fill + '"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></span>';
                } else if (isCurrent) {
                    h += '<span class="tl-icon tl-icon-current" style="border-color:' + colors.fill + ';box-shadow:0 0 0 3px ' + colors.fill + '22"></span>';
                } else {
                    h += '<span class="tl-icon tl-icon-pending"></span>';
                }
                h += '</div>';

                h += '<div class="tl-content">';
                h += '<span class="tl-label">' + esc(asama) + '</span>';

                // Tarih bilgisi (asamaTarihleri veya eski alanlar)
                var asamaTarih = (ic.asamaTarihleri && ic.asamaTarihleri[asama]) ? ic.asamaTarihleri[asama] : null;
                if (!asamaTarih && asama === '\u0130\u00e7erik Geldi') asamaTarih = ic.icerikGelmeTarihi;
                if (!asamaTarih && asama === '\u00dcretime Ba\u015fland\u0131') asamaTarih = ic.kontrolTamamlanmaTarihi;
                if (asamaTarih && (isDone || isCurrent)) h += '<span class="tl-date">' + esc(asamaTarih) + '</span>';

                // Gorev bilgisi
                var gorevBilgi = null;
                for (var gg = 0; gg < gecmis.length; gg++) {
                    if (gecmis[gg].asama === asama) { gorevBilgi = gecmis[gg]; break; }
                }
                if (!gorevBilgi && ic.gorev && ic.gorev.asama === asama) gorevBilgi = ic.gorev;
                if (gorevBilgi) {
                    h += '<div class="tl-gorev-info">';
                    h += '<span class="tl-gorev-name">' + esc(gorevBilgi.atananAd) + '</span>';
                    if (gorevBilgi.atanmaTarihi) h += '<span class="tl-date">' + esc(gorevBilgi.atanmaTarihi);
                    if (gorevBilgi.sonTarih) h += ' \u2192 ' + esc(gorevBilgi.sonTarih);
                    h += '</span>';
                    if (gorevBilgi.tahminiGun) h += '<span class="tl-gorev-gun">' + gorevBilgi.tahminiGun + 'g</span>';
                    h += '</div>';
                }

                h += '</div>'; // tl-content
                h += '</div>'; // ic-timeline-item
            });

            h += '</div>'; // tl-group-items
            h += '</div>'; // tl-group
        });

        h += '</div>';
        return h;
    }

    /* ========== UNITELER TAB ========== */
    function renderUniteler(b) {
        var h = '';
        var isTeslim = b.durumu === 'TTKB Onay\u0131';
        var mp = window.eitMyPerms || {};
        var canStage = !!mp.asama_degistir;
        var canAssign = !!mp.gorev_ata;
        var canNote = !!mp.not_ekle;
        var canBulk = !!mp.toplu_islem;
        // Toplu secim: secilebilir key'leri topla
        bulkAllKeys = [];
        if (canBulk && !isTeslim) {
            b.uniteler.forEach(function (unite, ui) {
                unite.icerikler.forEach(function (ic, ii) {
                    if (ic.durum === 'Tamamland\u0131') return;
                    bulkAllKeys.push(ui + '-' + ii);
                });
            });
            // Gecersiz secimi temizle (Tamamlandi olmus vs.)
            var validKeys = {};
            bulkAllKeys.forEach(function (k) { validKeys[k] = true; });
            Object.keys(selectedIcerikler).forEach(function (k) {
                if (!validKeys[k]) delete selectedIcerikler[k];
            });
        }
        var selCount = Object.keys(selectedIcerikler).length;

        // Toplu secim toolbar
        if (canBulk && !isTeslim && bulkAllKeys.length > 0) {
            var allChecked = selCount > 0 && selCount === bulkAllKeys.length;
            var someChecked = selCount > 0 && selCount < bulkAllKeys.length;
            var hasSel = selCount > 0;
            h += '<div class="ic-select-toolbar">';
            h += '<label class="bulk-select-all-label"><input type="checkbox" id="bulkSelectAll"' + (allChecked ? ' checked' : '') + (someChecked ? ' data-indeterminate="1"' : '') + '> T\u00fcm\u00fcn\u00fc Se\u00e7 <span class="bulk-all-count">(' + bulkAllKeys.length + ')</span></label>';
            if (hasSel) {
                h += '<span class="bulk-count">\u2713 ' + selCount + ' se\u00e7ili</span>';
                h += '<span class="bulk-sep">|</span>';
                // Tur
                var turler = (window.eitDefLists || {}).eIcerikTurleri || [];
                if (turler.length) {
                    h += '<select class="bulk-action-select" id="bulkSetTur"><option value="">T\u00fcr...</option>';
                    turler.forEach(function (t) { h += '<option value="' + esc(t) + '">' + esc(t) + '</option>'; });
                    h += '</select>';
                }
                // Asama
                h += '<select class="bulk-action-select" id="bulkSetAsama"><option value="">A\u015fama...</option>';
                icerikDurumlari.forEach(function (d) {
                    var dis = d === '\u00dcretim Devam Ediyor' ? ' disabled' : '';
                    h += '<option value="' + esc(d) + '"' + dis + '>' + esc(d) + '</option>';
                });
                h += '</select>';
                // Kisi
                var wpUsers = window.eitWpUsers || [];
                h += '<select class="bulk-action-select" id="bulkSetKisi"><option value="">Ki\u015fi...</option>';
                wpUsers.forEach(function (u) {
                    if (u.role === 'admin') return;
                    h += '<option value="' + u.id + '">' + esc(u.name) + '</option>';
                });
                h += '</select>';
                // Sure
                h += '<div class="bulk-sure-wrap"><div class="bulk-sure-inner"><input type="number" class="bulk-sure-input" id="bulkSure" min="1" value="' + bulkSureValue + '" placeholder="g\u00fcn"><button class="bulk-sure-apply" id="bulkSureApply" title="S\u00fcreyi se\u00e7ili g\u00f6revlere uygula">\u2713</button></div></div>';
                // Temizle
                h += '<button class="bulk-clear-btn" id="bulkClear">\u2715</button>';
            }
            h += '</div>';
        }

        b.uniteler.forEach(function (unite, ui) {
            var total = unite.icerikler.length;
            var done = 0;
            unite.icerikler.forEach(function (ic) { if (ic.durum === 'Tamamland\u0131') done++; });
            var pct = total > 0 ? Math.round((done / total) * 100) : 0;
            var pctClass = pct < 33 ? 'unite-progress-low' : (pct < 75 ? 'unite-progress-mid' : 'unite-progress-high');

            h += '<div class="unite-block open" data-ui="' + ui + '">';
            h += '<div class="unite-title"><div class="unite-title-left">';
            h += '<span class="unite-chevron">&#9654;</span>';
            h += '<span class="unite-num">' + (ui + 1) + '</span>';
            h += '<span>' + esc(unite.ad) + '</span>';
            h += '</div>';
            h += '<span class="unite-progress ' + pctClass + '">' + done + '/' + total + ' (%' + pct + ')</span>';
            h += '</div>';

            h += '<div class="unite-content">';

            unite.icerikler.forEach(function (ic, ii) {
                var key = ui + '-' + ii;
                var isOpen = openPanels[key];
                var isSel = selectedIcerikler[key];
                var currentDurum = ic.durum || '\u0130\u00e7erik Gelmedi';
                var gorev = ic.gorev || {};
                var hasGorev = !!gorev.atananId;
                var gorevTamamlandi = hasGorev && gorev.durum === 'Tamamland\u0131';
                var isOverdue = hasGorev && gorev.durum !== 'Tamamland\u0131' && gorev.sonTarih && new Date() > new Date(gorev.sonTarih);
                var isMyGorev = hasGorev && gorev.atananId === (parseInt((window.eitUser || {}).id) || 0);

                var tipClass = 'dp-type-eicerik';
                var tipLabel = 'E-\u0130\u00e7erik';
                if (ic.tip === 'ozet') { tipClass = 'dp-type-giris'; tipLabel = '\u00d6zet'; }
                if (ic.tip === 'olcme') { tipClass = 'dp-type-olcme'; tipLabel = '\u00d6l\u00e7me'; }

                var sectionClass = '';
                if (ic.tip === 'ozet') sectionClass = ' ic-section-top';
                if (ic.tip === 'olcme') sectionClass = ' ic-section-bottom';

                var rowExtra = isOverdue ? ' ic-row-overdue' : '';
                if (currentDurum === 'Tamamland\u0131') rowExtra += ' ic-row-done';

                // === GRID SATIR ===
                h += '<div class="ic-row' + sectionClass + rowExtra + (isOpen ? ' ic-row-open' : '') + '" data-ui="' + ui + '" data-ii="' + ii + '">';

                // 1) Checkbox
                if (canBulk && !isTeslim) {
                    h += '<input type="checkbox" class="ic-checkbox" data-key="' + key + '"' + (isSel ? ' checked' : '') + '>';
                }

                // 2) Tip badge
                h += '<span class="dp-icerik-type ' + tipClass + '">' + tipLabel + '</span>';

                // 3) Icerik adi
                h += '<div class="ic-row-info">';
                h += '<span class="ic-row-name">' + esc(ic.ad) + '</span>';
                if (ic.aciklama) h += '<span class="ic-row-desc">' + esc(ic.aciklama) + '</span>';
                h += '</div>';

                // Asama tarihi helper
                function asamaTarihStr(durum) {
                    if (durum === '\u0130\u00e7erik Gelmedi') return '';
                    var t = (ic.asamaTarihleri && ic.asamaTarihleri[durum]) ? ic.asamaTarihleri[durum] : null;
                    if (!t && durum === '\u0130\u00e7erik Geldi') t = ic.icerikGelmeTarihi;
                    if (!t && durum === '\u00dcretime Ba\u015fland\u0131') t = ic.kontrolTamamlanmaTarihi;
                    return t || '';
                }

                // Tarih formatlayici (yyyy-mm-dd → dd.mm.yyyy)
                function fmtTarih(t) {
                    if (!t) return '';
                    if (/^\d{2}\.\d{2}\.\d{4}$/.test(t)) return t;
                    var m = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
                    if (m) return m[3] + '.' + m[2] + '.' + m[1];
                    return t;
                }

                // 4) Tur
                if (canStage && !isTeslim) {
                    var turler = (window.eitDefLists || {}).eIcerikTurleri || [];
                    if (turler.length) {
                        h += '<select class="ic-tur-select" data-ui="' + ui + '" data-ii="' + ii + '">';
                        h += '<option value="">T\u00fcr...</option>';
                        if (ic.mebTur) {
                            var mebAlts = ic.mebTur.split('/').map(function (s) { return s.trim(); });
                            mebAlts.forEach(function (t) {
                                h += '<option value="' + esc(t) + '"' + (ic.tur === t ? ' selected' : '') + '>\u2605 ' + esc(t) + '</option>';
                            });
                            h += '<option disabled>\u2500\u2500\u2500</option>';
                            turler.forEach(function (t) {
                                if (mebAlts.indexOf(t) === -1) h += '<option value="' + esc(t) + '"' + (ic.tur === t ? ' selected' : '') + '>' + esc(t) + '</option>';
                            });
                        } else {
                            turler.forEach(function (t) { h += '<option value="' + esc(t) + '"' + (ic.tur === t ? ' selected' : '') + '>' + esc(t) + '</option>'; });
                        }
                        h += '</select>';
                    } else {
                        h += '<span></span>';
                    }
                } else {
                    h += ic.tur ? '<span class="ic-tur-badge">' + esc(ic.tur) + '</span>' : '<span></span>';
                }

                // 5) Asama
                if (canStage && !isTeslim) {
                    var curIdx = durumIdx(currentDurum);
                    h += '<select class="ic-asama-select dp-status-select" data-ui="' + ui + '" data-ii="' + ii + '">';
                    asamaGruplari.forEach(function (grp) {
                        h += '<optgroup label="' + esc(grp.label) + '">';
                        grp.asamalar.forEach(function (d) {
                            var dis = d === '\u00dcretim Devam Ediyor' ? ' disabled' : '';
                            var di = icerikDurumlari.indexOf(d);
                            var prefix = di < curIdx ? '\u2713 ' : (di === curIdx ? '\u25cf ' : '  ');
                            var dTarih = fmtTarih(asamaTarihStr(d));
                            var suffix = dTarih ? ' \u00b7 ' + dTarih : '';
                            h += '<option value="' + esc(d) + '"' + (currentDurum === d ? ' selected' : '') + dis + '>' + prefix + esc(d) + suffix + '</option>';
                        });
                        h += '</optgroup>';
                    });
                    h += '</select>';
                } else {
                    var asamaColor = getAsamaColor(currentDurum);
                    var badgeTarih = fmtTarih(asamaTarihStr(currentDurum));
                    h += '<span class="ic-asama-badge" style="color:' + asamaColor + ';background:' + asamaColor + '14">' + esc(currentDurum) + (badgeTarih ? ' \u00b7 ' + badgeTarih : '') + '</span>';
                }

                // 6) Gorev alani (tek div icinde)
                h += '<div class="ic-row-gorev">';
                var hasGecmis = ic.gorevGecmisi && ic.gorevGecmisi.length > 0;
                if (canAssign && !isTeslim && gorevAtanabilirAsamalar.indexOf(currentDurum) > -1 && !hasGorev) {
                    var wpUsers = window.eitWpUsers || [];
                    if (hasGecmis) {
                        // Onceki gorev tamamlanmis — kompakt buton goster, tiklaninca select acilsin
                        h += '<button class="gorev-ata-compact-btn" data-ui="' + ui + '" data-ii="' + ii + '">G\u00f6rev Ata</button>';
                        h += '<select class="ic-atanan-select" data-ui="' + ui + '" data-ii="' + ii + '" style="display:none">';
                    } else {
                        h += '<select class="ic-atanan-select" data-ui="' + ui + '" data-ii="' + ii + '">';
                    }
                    h += '<option value="">G\u00f6rev Ata...</option>';
                    wpUsers.forEach(function (u) {
                        if (u.role === 'admin') return;
                        h += '<option value="' + u.id + '">' + esc(u.name) + '</option>';
                    });
                    h += '</select>';
                } else if (hasGorev && gorev.durum !== 'Tamamland\u0131') {
                    h += '<span class="ic-row-atanan' + (isOverdue ? ' ic-atanan-overdue' : '') + '">' + esc(gorev.atananAd) + '</span>';
                    if (gorev.sonTarih) {
                        var kalan = Math.ceil((new Date(gorev.sonTarih) - new Date()) / 86400000);
                        h += '<span class="ic-row-gun' + (isOverdue ? ' ic-gun-overdue' : '') + '">' + kalan + 'g</span>';
                    }
                    if (canAssign && !isTeslim && gorevAtanabilirAsamalar.indexOf(currentDurum) > -1) {
                        h += '<button class="gorev-degistir-btn" data-ui="' + ui + '" data-ii="' + ii + '" title="Ki\u015fiyi De\u011fi\u015ftir">&#8635;</button>';
                    }
                } else if (gorevTamamlandi) {
                    h += '<span class="ic-row-atanan gorev-tamamlandi-tag">' + esc(gorev.atananAd) + ' \u2713</span>';
                }
                if (canStage && gorevTamamlandi) {
                    h += '<button class="gorev-approve-btn" data-ui="' + ui + '" data-ii="' + ii + '" title="Onayla">\u2713</button>';
                }
                if (!canStage && isMyGorev && hasGorev && gorev.durum !== 'Tamamland\u0131') {
                    h += '<button class="gorev-complete-btn" data-ui="' + ui + '" data-ii="' + ii + '">Tamam</button>';
                }
                h += '</div>';

                // 7) Not ikonu (SVG)
                var noteCount = (ic.notlar && ic.notlar.length) || 0;
                var hasImg = false;
                if (ic.notlar) ic.notlar.forEach(function (n) { if (n.resim) hasImg = true; });
                h += '<button class="ic-note-toggle' + (noteCount > 0 ? ' ic-note-has' : '') + (hasImg ? ' ic-note-has-img' : '') + '" data-ui="' + ui + '" data-ii="' + ii + '" title="Not">';
                h += '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>';
                if (noteCount > 0) h += '<span class="ic-note-count">' + noteCount + '</span>';
                if (hasImg) h += '<span class="ic-note-img-dot"></span>';
                h += '</button>';

                h += '</div>'; // ic-row

                // === NOTLAR (toggle ile acilir) ===
                h += '<div class="ic-notes" data-ui="' + ui + '" data-ii="' + ii + '"' + (isOpen ? '' : ' style="display:none"') + '>';
                h += '<div class="ic-notes-inner">';
                if (ic.notlar && ic.notlar.length) {
                    ic.notlar.forEach(function (n, ni) {
                        h += '<div class="ic-note-item">';
                        h += '<div class="ic-note-row">';
                        h += '<span class="ic-note-date">' + esc(n.tarih) + '</span>';
                        if (n.yazar) h += '<span class="ic-note-author">' + esc(n.yazar) + '</span>';
                        h += '<span class="ic-note-text">' + esc(n.metin) + '</span>';
                        if (canNote) h += '<button class="ic-note-del" data-ui="' + ui + '" data-ii="' + ii + '" data-ni="' + ni + '">\u00d7</button>';
                        h += '</div>';
                        if (n.resim) h += '<a class="ic-note-img" href="' + esc(n.resim) + '" target="_blank"><img src="' + esc(n.resim) + '"></a>';
                        h += '</div>';
                    });
                }
                if (canNote) {
                    h += '<div class="ic-note-add">';
                    h += '<input class="ic-note-input" placeholder="Not ekle..." data-ui="' + ui + '" data-ii="' + ii + '">';
                    h += '<label class="ic-note-img-btn" title="Resim ekle">\ud83d\uddbc<input type="file" accept="image/*" class="ic-note-file" data-ui="' + ui + '" data-ii="' + ii + '" style="display:none"></label>';
                    h += '<span class="ic-note-img-name" data-ui="' + ui + '" data-ii="' + ii + '"></span>';
                    h += '<button class="ic-note-btn" data-ui="' + ui + '" data-ii="' + ii + '">Ekle</button>';
                    h += '</div>';
                }
                h += '</div></div>'; // ic-notes-inner, ic-notes
            });

            h += '</div></div>'; // unite-content, unite-block
        });

        // Tum e-icerikler tamamlandi mi?
        var totalIc = 0, doneIc = 0;
        b.uniteler.forEach(function (u) {
            (u.icerikler || []).forEach(function (ic) {
                totalIc++;
                if (ic.durum === 'Tamamland\u0131') doneIc++;
            });
        });
        if (mp.kitap_durum && totalIc > 0 && doneIc === totalIc && b.durumu !== 'TTKB Onay\u0131') {
            h += '<div class="gorev-all-done">';
            h += '<span class="gorev-all-done-icon">\u2705</span>';
            h += '<span>T\u00fcm e-i\u00e7erikler tamamland\u0131! Kitab\u0131 "TTKB Onay\u0131" olarak i\u015faretleyebilirsiniz.</span>';
            h += '</div>';
        }

        if (!b.uniteler.length) {
            h += '<div class="dp-empty-units">';
            h += '<div class="dp-empty-icon">&#128218;</div>';
            h += '<p>Hen\u00fcz \u00fcnite/e-i\u00e7erik eklenmedi.</p>';
            h += '<p class="dp-empty-hint">E-\u0130\u00e7erik Tablosu sayfas\u0131ndan bu kitaba i\u00e7e aktarabilirsiniz.</p>';
            h += '</div>';
        }

        return h;
    }

    /* ========== EVENTS ========== */
    function bindEvents() {
        var b = currentBook;

        var $dpBack = document.getElementById('dpBack');
        if ($dpBack) $dpBack.addEventListener('click', function () { history.back(); });
        if ($page._onEsc) document.removeEventListener('keydown', $page._onEsc);
        $page._onEsc = function (e) {
            if (e.key === 'Escape' && $page.style.display !== 'none') { history.back(); document.removeEventListener('keydown', $page._onEsc); }
        };
        document.addEventListener('keydown', $page._onEsc);

        // (Header artik read-only — field event'leri kaldırıldı)

        // Unite toggle
        $page.querySelectorAll('.unite-title').forEach(function (t) {
            t.addEventListener('click', function () { this.closest('.unite-block').classList.toggle('open'); });
        });

        // Not toggle (not butonuna tiklayinca notlar acilir/kapanir)
        $page.querySelectorAll('.ic-note-toggle').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                var key = this.dataset.ui + '-' + this.dataset.ii;
                openPanels[key] = !openPanels[key];
                render();
            });
        });

        // Checkbox
        $page.querySelectorAll('.ic-checkbox').forEach(function (cb) {
            cb.addEventListener('change', function (e) {
                e.stopPropagation();
                if (this.checked) selectedIcerikler[this.dataset.key] = true;
                else delete selectedIcerikler[this.dataset.key];
                render();
            });
        });

        // Tumunu sec checkbox
        var bulkSelectAllEl = document.getElementById('bulkSelectAll');
        if (bulkSelectAllEl) {
            if (bulkSelectAllEl.dataset.indeterminate === '1') bulkSelectAllEl.indeterminate = true;
            bulkSelectAllEl.addEventListener('change', function () {
                if (this.checked) {
                    bulkAllKeys.forEach(function (key) { selectedIcerikler[key] = true; });
                } else {
                    selectedIcerikler = {};
                }
                render();
            });
        }

        // Toplu: Tur ata
        var bulkSetTur = document.getElementById('bulkSetTur');
        if (bulkSetTur) bulkSetTur.addEventListener('change', function () {
            var val = this.value;
            if (!val) return;
            Object.keys(selectedIcerikler).forEach(function (key) {
                var parts = key.split('-');
                b.uniteler[parseInt(parts[0])].icerikler[parseInt(parts[1])].tur = val;
            });
            render();
            if (window.eitMarkDirty && currentBook) window.eitMarkDirty(currentBook.id); if (window.eitSave) window.eitSave();
        });

        // Toplu: Asama ata
        var bulkSetAsama = document.getElementById('bulkSetAsama');
        if (bulkSetAsama) bulkSetAsama.addEventListener('change', function () {
            var val = this.value;
            if (!val) return;
            Object.keys(selectedIcerikler).forEach(function (key) {
                var parts = key.split('-');
                setDurum(b.uniteler[parseInt(parts[0])].icerikler[parseInt(parts[1])], val);
            });
            render();
            if (window.eitMarkDirty && currentBook) window.eitMarkDirty(currentBook.id); if (window.eitSave) window.eitSave();
        });

        // Toplu: Kisi ata (gorev olustur)
        var bulkSetKisi = document.getElementById('bulkSetKisi');
        if (bulkSetKisi) bulkSetKisi.addEventListener('change', function () {
            var userId = this.value;
            if (!userId) return;
            var wpUser = (window.eitWpUsers || []).find(function (u) { return String(u.id) === userId; });
            if (!wpUser) return;
            var days = bulkSureValue;
            var deadline = new Date();
            deadline.setDate(deadline.getDate() + days);
            var deadlineStr = deadline.toISOString().split('T')[0];
            var todayStr = new Date().toISOString().split('T')[0];
            Object.keys(selectedIcerikler).forEach(function (key) {
                var parts = key.split('-');
                var ic = b.uniteler[parseInt(parts[0])].icerikler[parseInt(parts[1])];
                if (ic.gorev && ic.gorev.atananId) {
                    if (!ic.gorevGecmisi) ic.gorevGecmisi = [];
                    ic.gorevGecmisi.push(ic.gorev);
                }
                var asamaAdi = ic.durum || '\u0130\u00e7erik Gelmedi';
                ic.atanan = wpUser.name;
                ic.gorev = {
                    atananId: wpUser.id,
                    atananAd: wpUser.name,
                    durum: 'Devam Ediyor',
                    asama: asamaAdi,
                    atanmaTarihi: todayStr,
                    tahminiGun: days,
                    sonTarih: deadlineStr,
                    tamamlanmaTarihi: null,
                    atayan: (window.eitUser || {}).name || '',
                    atayanId: parseInt((window.eitUser || {}).id) || 0
                };
                // Uretime Baslandi → Uretim Devam Ediyor
                if (asamaAdi === '\u00dcretime Ba\u015fland\u0131') {
                    setDurum(ic, '\u00dcretim Devam Ediyor');
                }
            });
            render();
            if (window.eitMarkDirty && currentBook) window.eitMarkDirty(currentBook.id); if (window.eitSave) window.eitSave();
        });

        // Toplu: Sure degerini hafizada tut
        var bulkSure = document.getElementById('bulkSure');
        if (bulkSure) bulkSure.addEventListener('input', function () {
            bulkSureValue = parseInt(this.value) || 7;
        });

        // Toplu: Sure uygula butonu (mevcut gorevlerin tarihini degistir)
        var bulkSureApply = document.getElementById('bulkSureApply');
        if (bulkSureApply) bulkSureApply.addEventListener('click', function () {
            var days = bulkSureValue;
            if (days < 1) return;
            var deadline = new Date();
            deadline.setDate(deadline.getDate() + days);
            var deadlineStr = deadline.toISOString().split('T')[0];
            var changed = false;
            Object.keys(selectedIcerikler).forEach(function (key) {
                var parts = key.split('-');
                var ic = b.uniteler[parseInt(parts[0])].icerikler[parseInt(parts[1])];
                if (ic.gorev && ic.gorev.atananId) {
                    ic.gorev.tahminiGun = days;
                    ic.gorev.sonTarih = deadlineStr;
                    changed = true;
                }
            });
            if (changed) {
                render();
                if (window.eitMarkDirty && currentBook) window.eitMarkDirty(currentBook.id); if (window.eitSave) window.eitSave();
            }
        });

        // Toplu secim: temizle
        var bulkClear = document.getElementById('bulkClear');
        if (bulkClear) bulkClear.addEventListener('click', function () {
            selectedIcerikler = {};
            render();
        });

        // Status change
        $page.querySelectorAll('.dp-status-select').forEach(function (sel) {
            sel.addEventListener('change', function (e) {
                e.stopPropagation();
                var ui = parseInt(this.dataset.ui), ii = parseInt(this.dataset.ii);
                var ic = b.uniteler[ui].icerikler[ii];
                setDurum(ic, this.value);
                render();
                if (window.eitMarkDirty && currentBook) window.eitMarkDirty(currentBook.id); if (window.eitSave) window.eitSave();
            });
        });

        // Tur change
        $page.querySelectorAll('.ic-tur-select').forEach(function (sel) {
            sel.addEventListener('change', function (e) {
                e.stopPropagation();
                var ui = parseInt(this.dataset.ui), ii = parseInt(this.dataset.ii);
                b.uniteler[ui].icerikler[ii].tur = this.value;
                render();
                if (window.eitMarkDirty && currentBook) window.eitMarkDirty(currentBook.id); if (window.eitSave) window.eitSave();
            });
        });

        // Gorev atama
        $page.querySelectorAll('.ic-atanan-select').forEach(function (sel) {
            sel.addEventListener('change', function (e) {
                e.stopPropagation();
                var ui = parseInt(this.dataset.ui), ii = parseInt(this.dataset.ii);
                var ic = b.uniteler[ui].icerikler[ii];
                var userId = this.value;
                if (!userId) return;
                var wpUser = (window.eitWpUsers || []).find(function (u) { return String(u.id) === userId; });
                if (!wpUser) return;
                showGorevModal(wpUser, function (days) {
                    var deadline = new Date();
                    deadline.setDate(deadline.getDate() + days);
                    // Eski gorevi gecmise tasi
                    if (ic.gorev && ic.gorev.atananId) {
                        if (!ic.gorevGecmisi) ic.gorevGecmisi = [];
                        ic.gorevGecmisi.push(ic.gorev);
                    }
                    var asamaAdi = ic.durum || '\u0130\u00e7erik Gelmedi';
                    ic.atanan = wpUser.name;
                    ic.gorev = {
                        atananId: wpUser.id,
                        atananAd: wpUser.name,
                        durum: 'Devam Ediyor',
                        asama: asamaAdi,
                        atanmaTarihi: new Date().toISOString().split('T')[0],
                        tahminiGun: days,
                        sonTarih: deadline.toISOString().split('T')[0],
                        tamamlanmaTarihi: null,
                        atayan: (window.eitUser || {}).name || '',
                        atayanId: parseInt((window.eitUser || {}).id) || 0
                    };
                    // Uretime Baslandi → Uretim Devam Ediyor (tarih de kaydedilsin)
                    if (asamaAdi === '\u00dcretime Ba\u015fland\u0131') {
                        setDurum(ic, '\u00dcretim Devam Ediyor');
                    }
                    render();
                    if (window.eitMarkDirty && currentBook) window.eitMarkDirty(currentBook.id); if (window.eitSave) window.eitSave();
                });
            });
        });

        // Gorev: Tamamla
        $page.querySelectorAll('.gorev-complete-btn').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                var ui = parseInt(this.dataset.ui), ii = parseInt(this.dataset.ii);
                var ic = b.uniteler[ui].icerikler[ii];
                if (canFullSave()) {
                    ic.gorev.durum = 'Tamamland\u0131';
                    ic.gorev.tamamlanmaTarihi = new Date().toISOString().split('T')[0];
                    render();
                    if (window.eitMarkDirty && currentBook) window.eitMarkDirty(currentBook.id); if (window.eitSave) window.eitSave();
                } else {
                    gorevAction(b.id, ui, ii, 'tamamla', function (ok) {
                        if (ok) { location.reload(); }
                    });
                }
            });
        });

        // Gorev: Editor Onayla → otomatik sonraki asamaya gec
        $page.querySelectorAll('.gorev-approve-btn').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                var ui = parseInt(this.dataset.ui), ii = parseInt(this.dataset.ii);
                var ic = b.uniteler[ui].icerikler[ii];
                // Gorevi gecmise tasi
                if (ic.gorev && ic.gorev.atananId) {
                    if (!ic.gorevGecmisi) ic.gorevGecmisi = [];
                    ic.gorevGecmisi.push(ic.gorev);
                    delete ic.gorev;
                    ic.atanan = '';
                }
                // Sonraki asamaya gec (setDurum ile tarih de kaydedilsin)
                setDurum(ic, sonrakiAsama(ic.durum));
                render();
                if (window.eitMarkDirty && currentBook) window.eitMarkDirty(currentBook.id); if (window.eitSave) window.eitSave();
            });
        });

        // Gorev: Kompakt "Görev Ata" butonu (onay sonrasi gecmisi olan icerikler)
        $page.querySelectorAll('.gorev-ata-compact-btn').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                this.style.display = 'none';
                var sel = this.nextElementSibling;
                if (sel && sel.classList.contains('ic-atanan-select')) {
                    sel.style.display = '';
                    sel.focus();
                }
            });
        });

        // Gorev: Kisi degistir
        $page.querySelectorAll('.gorev-degistir-btn').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                var ui = parseInt(this.dataset.ui), ii = parseInt(this.dataset.ii);
                var ic = b.uniteler[ui].icerikler[ii];
                var container = this.closest('.ic-row-gorev');
                var wpUsers = window.eitWpUsers || [];
                var sh = '<select class="ic-atanan-select ic-atanan-degistir" data-ui="' + ui + '" data-ii="' + ii + '">';
                sh += '<option value="">Ki\u015fi Se\u00e7...</option>';
                wpUsers.forEach(function (u) {
                    if (u.role === 'admin') return;
                    sh += '<option value="' + u.id + '"' + (ic.gorev && String(ic.gorev.atananId) === String(u.id) ? ' disabled' : '') + '>' + esc(u.name) + '</option>';
                });
                sh += '</select>';
                container.innerHTML = sh;
                var newSel = container.querySelector('.ic-atanan-degistir');
                newSel.focus();
                newSel.addEventListener('change', function () {
                    var userId = this.value;
                    if (!userId) { render(); return; }
                    var wpUser = wpUsers.find(function (u) { return String(u.id) === userId; });
                    if (!wpUser) { render(); return; }
                    showGorevModal(wpUser, function (days) {
                        var deadline = new Date();
                        deadline.setDate(deadline.getDate() + days);
                        if (ic.gorev && ic.gorev.atananId) {
                            if (!ic.gorevGecmisi) ic.gorevGecmisi = [];
                            ic.gorevGecmisi.push(ic.gorev);
                        }
                        var asamaAdi = ic.durum || '\u0130\u00e7erik Gelmedi';
                        ic.atanan = wpUser.name;
                        ic.gorev = {
                            atananId: wpUser.id,
                            atananAd: wpUser.name,
                            durum: 'Devam Ediyor',
                            asama: asamaAdi,
                            atanmaTarihi: new Date().toISOString().split('T')[0],
                            tahminiGun: days,
                            sonTarih: deadline.toISOString().split('T')[0],
                            tamamlanmaTarihi: null,
                            atayan: (window.eitUser || {}).name || '',
                            atayanId: parseInt((window.eitUser || {}).id) || 0
                        };
                        render();
                        if (window.eitMarkDirty && currentBook) window.eitMarkDirty(currentBook.id); if (window.eitSave) window.eitSave();
                    });
                });
                newSel.addEventListener('blur', function () {
                    var s = newSel;
                    setTimeout(function () { if (!s.value) render(); }, 150);
                });
            });
        });

        // Note file preview
        $page.querySelectorAll('.ic-note-file').forEach(function (inp) {
            inp.addEventListener('change', function () {
                var ui = this.dataset.ui, ii = this.dataset.ii;
                var nameEl = $page.querySelector('.ic-note-img-name[data-ui="' + ui + '"][data-ii="' + ii + '"]');
                if (nameEl) nameEl.textContent = this.files.length ? this.files[0].name : '';
            });
        });

        // Add note
        $page.querySelectorAll('.ic-note-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var ui = parseInt(this.dataset.ui), ii = parseInt(this.dataset.ii);
                var inp = $page.querySelector('.ic-note-input[data-ui="' + ui + '"][data-ii="' + ii + '"]');
                var fileInp = $page.querySelector('.ic-note-file[data-ui="' + ui + '"][data-ii="' + ii + '"]');
                var text = inp.value.trim();
                var file = fileInp && fileInp.files.length ? fileInp.files[0] : null;
                if (!text && !file) return;
                var ic = b.uniteler[ui].icerikler[ii];
                if (!ic.notlar) ic.notlar = [];
                var now = new Date();
                var notObj = {
                    tarih: now.toLocaleDateString('tr-TR') + ' ' + now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
                    yazar: (window.eitUser || {}).name || '',
                    metin: text
                };
                var key = ui + '-' + ii;
                if (file) {
                    // Resimli not: panel acik kalsin
                    var reader = new FileReader();
                    reader.onload = function (ev) {
                        notObj.resim = ev.target.result;
                        ic.notlar.push(notObj);
                        openPanels[key] = true;
                        render();
                        if (canFullSave()) {
                            if (window.eitMarkDirty && currentBook) window.eitMarkDirty(currentBook.id); if (window.eitSave) window.eitSave();
                        }
                        // Arka planda sunucuya yukle, basariliysa URL'yi guncelle
                        uploadNoteImage(file, function (url) {
                            if (url) {
                                notObj.resim = url;
                                if (canFullSave()) {
                                    if (window.eitMarkDirty && currentBook) window.eitMarkDirty(currentBook.id); if (window.eitSave) window.eitSave();
                                } else {
                                    saveNoteViaAjax(b.id, ui, ii, 'add', { note_text: text, note_image: url });
                                }
                            } else if (!canFullSave()) {
                                // Upload basarisiz, resim olmadan kaydet
                                saveNoteViaAjax(b.id, ui, ii, 'add', { note_text: text });
                            }
                        });
                    };
                    reader.readAsDataURL(file);
                } else {
                    ic.notlar.push(notObj);
                    delete openPanels[key];
                    render();
                    if (canFullSave()) {
                        if (window.eitMarkDirty && currentBook) window.eitMarkDirty(currentBook.id); if (window.eitSave) window.eitSave();
                    } else {
                        saveNoteViaAjax(b.id, ui, ii, 'add', { note_text: text });
                    }
                }
            });
        });

        // Enter on note input
        $page.querySelectorAll('.ic-note-input').forEach(function (inp) {
            inp.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') {
                    $page.querySelector('.ic-note-btn[data-ui="' + this.dataset.ui + '"][data-ii="' + this.dataset.ii + '"]').click();
                }
            });
        });

        // Delete note
        $page.querySelectorAll('.ic-note-del').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var delUi = parseInt(this.dataset.ui), delIi = parseInt(this.dataset.ii), delNi = parseInt(this.dataset.ni);
                b.uniteler[delUi].icerikler[delIi].notlar.splice(delNi, 1);
                render();
                if (canFullSave()) {
                    if (window.eitMarkDirty && currentBook) window.eitMarkDirty(currentBook.id); if (window.eitSave) window.eitSave();
                } else {
                    saveNoteViaAjax(b.id, delUi, delIi, 'delete', { note_index: delNi });
                }
            });
        });

    }

    /* ─── Durum degistirme helper ─── */
    function setDurum(ic, yeniDurum) {
        var now = new Date().toISOString().split('T')[0];
        // Backward compat
        if (yeniDurum === '\u0130\u00e7erik Geldi' && !ic.icerikGelmeTarihi) ic.icerikGelmeTarihi = now;
        if (yeniDurum === '\u00dcretime Ba\u015fland\u0131' && !ic.kontrolTamamlanmaTarihi) ic.kontrolTamamlanmaTarihi = now;
        // Her asama degisikliginde tarih kaydet (Icerik Gelmedi haric)
        if (!ic.asamaTarihleri) ic.asamaTarihleri = {};
        if (yeniDurum !== '\u0130\u00e7erik Gelmedi') ic.asamaTarihleri[yeniDurum] = now;
        // Geri asamaya gecildiyse, sonraki asamalarin tarihlerini sil
        var yeniIdx = icerikDurumlari.indexOf(yeniDurum);
        icerikDurumlari.forEach(function (d, i) {
            if (i > yeniIdx && ic.asamaTarihleri[d]) {
                delete ic.asamaTarihleri[d];
            }
        });
        // Icerik Gelmedi: tum tarihleri, atanan ve gorevi temizle
        if (yeniDurum === '\u0130\u00e7erik Gelmedi') {
            ic.asamaTarihleri = {};
            delete ic.icerikGelmeTarihi;
            delete ic.kontrolTamamlanmaTarihi;
            delete ic.icerikBaslamaTarihi;
            delete ic.icerikTamamlanmaTarihi;
            ic.atanan = '';
            if (ic.gorev && Object.keys(ic.gorev).length) {
                if (!ic.gorevGecmisi) ic.gorevGecmisi = [];
                ic.gorevGecmisi.push(ic.gorev);
            }
            delete ic.gorev;
        }
        ic.durum = yeniDurum;
    }

    /* ─── Gorev Atama Modal ─── */
    window.showGorevModal = showGorevModal;
    function showGorevModal(wpUser, onConfirm) {
        var overlay = document.createElement('div');
        overlay.className = 'gorev-modal-overlay';
        overlay.innerHTML =
            '<div class="gorev-modal">' +
            '<div class="gorev-modal-title">G\u00f6rev Ata</div>' +
            '<div class="gorev-modal-user">' + esc(wpUser.name) + '</div>' +
            '<label class="gorev-modal-label">Ka\u00e7 g\u00fcnde tamamlanacak?</label>' +
            '<input type="number" class="gorev-modal-input" id="gorevModalDays" min="1" value="7" autofocus>' +
            '<div class="gorev-modal-preview" id="gorevModalPreview"></div>' +
            '<div class="gorev-modal-actions">' +
            '<button class="gorev-modal-cancel" id="gorevModalCancel">\u0130ptal</button>' +
            '<button class="gorev-modal-ok" id="gorevModalOk">G\u00f6rev Ver</button>' +
            '</div></div>';
        document.body.appendChild(overlay);
        requestAnimationFrame(function () { overlay.classList.add('show'); });

        var inp = document.getElementById('gorevModalDays');
        var preview = document.getElementById('gorevModalPreview');

        function updatePreview() {
            var d = parseInt(inp.value) || 0;
            if (d > 0) {
                var dt = new Date();
                dt.setDate(dt.getDate() + d);
                preview.textContent = 'Son tarih: ' + dt.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
            } else {
                preview.textContent = '';
            }
        }
        updatePreview();
        inp.addEventListener('input', updatePreview);
        inp.focus();
        inp.select();

        function closeModal() {
            overlay.classList.remove('show');
            setTimeout(function () { overlay.remove(); }, 200);
        }

        document.getElementById('gorevModalCancel').addEventListener('click', closeModal);
        overlay.addEventListener('click', function (e) { if (e.target === overlay) closeModal(); });

        document.getElementById('gorevModalOk').addEventListener('click', function () {
            var days = parseInt(inp.value);
            if (!days || days < 1) { inp.focus(); return; }
            closeModal();
            onConfirm(days);
        });

        inp.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') document.getElementById('gorevModalOk').click();
            if (e.key === 'Escape') closeModal();
        });
    }

    /* ─── Gorev Action Helper ─── */
    function gorevAction(bookId, ui, ii, action, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', (window.eitAjax || {}).url || '/wp-admin/admin-ajax.php');
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.onload = function () {
            if (xhr.status === 200) {
                try {
                    var res = JSON.parse(xhr.responseText);
                    if (res.success) {
                        if (res.data && typeof res.data.version !== 'undefined' && window.eitSetDataVersion) window.eitSetDataVersion(res.data.version);
                        if (callback) callback(true, res.data); return;
                    }
                    alert('G\u00f6rev hatas\u0131: ' + (res.data || ''));
                } catch (e) { alert('G\u00f6rev hatas\u0131'); }
            }
            if (callback) callback(false);
        };
        xhr.onerror = function () { alert('A\u011f hatas\u0131'); if (callback) callback(false); };
        var ver = window.eitGetDataVersion ? window.eitGetDataVersion() : -1;
        var params = 'action=eit_gorev_action&nonce=' + ((window.eitAjax || {}).nonce || '') +
            '&book_id=' + encodeURIComponent(bookId) + '&ui=' + ui + '&ii=' + ii +
            '&gorev_action=' + action + '&version=' + ver;
        xhr.send(params);
    }

    function canFullSave() {
        var caps = window.eitUserCaps || {};
        return caps.eit_edit || caps.eit_manage;
    }

    /* ─── Not kaydet (eit_view yeterli) ─── */
    function saveNoteViaAjax(bookId, ui, ii, op, extra, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', (window.eitAjax || {}).url || '/wp-admin/admin-ajax.php');
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.onload = function () {
            if (xhr.status === 200) {
                try {
                    var res = JSON.parse(xhr.responseText);
                    if (res.success) {
                        if (res.data && typeof res.data.version !== 'undefined' && window.eitSetDataVersion) window.eitSetDataVersion(res.data.version);
                        if (callback) callback(true);
                        return;
                    }
                    alert('Not kaydetme hatas\u0131: ' + (res.data || ''));
                } catch (e) { alert('Not kaydetme hatas\u0131'); }
            }
            if (callback) callback(false);
        };
        xhr.onerror = function () { alert('A\u011f hatas\u0131'); if (callback) callback(false); };
        var params = 'action=eit_save_note&nonce=' + ((window.eitAjax || {}).nonce || '') +
            '&book_id=' + encodeURIComponent(bookId) + '&ui=' + ui + '&ii=' + ii + '&note_op=' + op;
        if (extra) {
            Object.keys(extra).forEach(function (k) {
                params += '&' + k + '=' + encodeURIComponent(extra[k]);
            });
        }
        xhr.send(params);
    }

    /* ─── Image Upload Helper ─── */
    function uploadNoteImage(file, callback) {
        var maxMB = ((window.eitDefLists || {}).maxImageSizeMB) || 5;
        if (file.size > maxMB * 1024 * 1024) {
            alert('Dosya boyutu ' + maxMB + 'MB\'dan b\u00fcy\u00fck olamaz. Se\u00e7ilen: ' + (file.size / 1024 / 1024).toFixed(1) + 'MB');
            return;
        }
        var fd = new FormData();
        fd.append('action', 'eit_upload_note_image');
        fd.append('nonce', (window.eitAjax || {}).nonce || '');
        fd.append('image', file);
        var xhr = new XMLHttpRequest();
        xhr.open('POST', (window.eitAjax || {}).url || '/wp-admin/admin-ajax.php');
        xhr.onload = function () {
            if (xhr.status === 200) {
                try {
                    var res = JSON.parse(xhr.responseText);
                    if (res.success && res.data.url) { callback(res.data.url); return; }
                    alert('Y\u00fckleme hatas\u0131: ' + (res.data || 'Bilinmeyen'));
                } catch (e) { alert('Y\u00fckleme hatas\u0131'); }
            } else { alert('Y\u00fckleme ba\u015far\u0131s\u0131z: HTTP ' + xhr.status); }
        };
        xhr.onerror = function () { alert('A\u011f hatas\u0131'); };
        xhr.send(fd);
    }

    /* ─── Helpers ─── */

})();
