/**
 * EIT Gorevlerim View v1.0
 * Kullanicinin kendi gorevlerini + tum gorevleri listeler
 */
(function () {
    'use strict';

    var $view, $btn;
    var activeFilter = 'tumu';
    var viewAsUserId = 0; // 0 = kendim, >0 = baska kullanici olarak gor

    function esc(s) {
        if (s === null || s === undefined) return '';
        var d = document.createElement('div');
        d.textContent = String(s);
        return d.innerHTML.replace(/"/g, '&quot;');
    }
    function books() { return window.eitAllBooks || []; }
    function uid() { return viewAsUserId || parseInt((window.eitUser || {}).id) || 0; }
    function realUid() { return parseInt((window.eitUser || {}).id) || 0; }
    function userRole() { return (window.eitUser || {}).role || 'viewer'; }
    function isAdmin() { return userRole() === 'admin'; }
    function isAdminOrEditor() { var r = userRole(); return r === 'admin' || r === 'editor'; }
    function viewAsName() {
        if (!viewAsUserId) return '';
        var u = (window.eitWpUsers || []).find(function (x) { return x.id === viewAsUserId; });
        return u ? u.name : '';
    }

    document.addEventListener('DOMContentLoaded', function () {
        $view = document.getElementById('gorevlerView');
        $btn = document.getElementById('gorevlerBtn');
        if (!$btn || !$view) return;
        $btn.addEventListener('click', openView);
    });

    function openView() {
        ['dashOverview', 'bookGrid', 'detailPage', 'emptyState', 'filterPills',
         'resultsInfo', 'reportsView', 'adminView', 'criteriaView', 'eicerikTablosuView'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) { el.style.display = 'none'; if (id !== 'bookGrid' && id !== 'emptyState' && id !== 'filterPills' && id !== 'resultsInfo') el.innerHTML = ''; }
        });
        ['reportsBtn', 'adminPanelBtn', 'criteriaBtn', 'eicerikTablosuBtn'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.classList.remove('active');
        });
        $view.style.display = '';
        $btn.classList.add('active');
        document.getElementById('pageTitle').textContent = viewAsUserId ? ('G\u00f6revler - ' + viewAsName()) : 'G\u00f6revlerim';
        var bc = document.getElementById('breadcrumb');
        if (bc) bc.textContent = '';
        renderView();
        if (window.eitPushState) window.eitPushState('gorevler');
    }

    /* ─── Task Collectors ─── */
    function collectMyTasks() {
        var myId = uid();
        var tasks = [];
        books().forEach(function (b) {
            (b.uniteler || []).forEach(function (u, ui) {
                (u.icerikler || []).forEach(function (ic, ii) {
                    if (ic.gorev && ic.gorev.atananId === myId) {
                        tasks.push(makeTask(b, u, ui, ic, ii));
                    }
                });
            });
        });
        return tasks;
    }

    function collectAllTasks() {
        var tasks = [];
        books().forEach(function (b) {
            (b.uniteler || []).forEach(function (u, ui) {
                (u.icerikler || []).forEach(function (ic, ii) {
                    if (ic.gorev && ic.gorev.atananId) {
                        tasks.push(makeTask(b, u, ui, ic, ii));
                    }
                });
            });
        });
        return tasks;
    }

    function makeTask(b, u, ui, ic, ii) {
        var g = ic.gorev;
        return {
            book: b, unite: u, icerik: ic, ui: ui, ii: ii, gorev: g,
            isOverdue: g.durum === 'Devam Ediyor' && g.sonTarih && new Date() > new Date(g.sonTarih)
        };
    }

    function makeHistoryTask(b, u, ui, ic, ii, g) {
        var wasLate = g.sonTarih && g.tamamlanmaTarihi && new Date(g.tamamlanmaTarihi) > new Date(g.sonTarih);
        return {
            book: b, unite: u, icerik: ic, ui: ui, ii: ii, gorev: g,
            isOverdue: false, isHistory: true, wasLate: wasLate
        };
    }

    /* Onaylanmis gecmis gorevler */
    function collectMyHistory() {
        var myId = uid();
        var tasks = [];
        books().forEach(function (b) {
            (b.uniteler || []).forEach(function (u, ui) {
                (u.icerikler || []).forEach(function (ic, ii) {
                    (ic.gorevGecmisi || []).forEach(function (g) {
                        if (parseInt(g.atananId) === myId) {
                            tasks.push(makeHistoryTask(b, u, ui, ic, ii, g));
                        }
                    });
                });
            });
        });
        return tasks;
    }

    function collectAllHistory() {
        var tasks = [];
        books().forEach(function (b) {
            (b.uniteler || []).forEach(function (u, ui) {
                (u.icerikler || []).forEach(function (ic, ii) {
                    (ic.gorevGecmisi || []).forEach(function (g) {
                        if (g.atananId) {
                            tasks.push(makeHistoryTask(b, u, ui, ic, ii, g));
                        }
                    });
                });
            });
        });
        return tasks;
    }

    function filterTasks(tasks, f) {
        if (f === 'tumu') return tasks.filter(function (t) { return !t.isHistory; });
        if (f === 'onaylandi') return []; // gecmis ayri render edilir
        return tasks.filter(function (t) {
            if (t.isHistory) return false;
            if (f === 'devam') return t.gorev.durum === 'Devam Ediyor' && !t.isOverdue;
            if (f === 'gecikli') return t.isOverdue;
            if (f === 'tamamlandi') return t.gorev.durum === 'Tamamland\u0131';
            return true;
        });
    }

    /* ─── Render ─── */
    function renderView() {
        var myTasks = collectMyTasks();
        var allTasks = collectAllTasks();
        var myHistory = collectMyHistory();
        var allHistory = collectAllHistory();

        var myCounts = countByStatus(myTasks);
        myCounts.onaylandi = myHistory.length;
        var allCounts = countByStatus(allTasks);
        var admin = isAdmin();
        var adminOrEditor = isAdminOrEditor();

        var h = '';

        // "Kullanici Olarak Gor" dropdown (admin only)
        if (admin) {
            var wpUsers = window.eitWpUsers || [];
            // Sadece gorevi olan kullanicilari goster + tumu
            var usersWithTasks = {};
            allTasks.forEach(function (t) { usersWithTasks[t.gorev.atananId] = t.gorev.atananAd; });
            allHistory.forEach(function (t) { usersWithTasks[t.gorev.atananId] = t.gorev.atananAd; });
            h += '<div class="gorev-view-as">';
            h += '<label class="gorev-view-as-label">Kullan\u0131c\u0131 Olarak G\u00f6r:</label>';
            h += '<select class="gorev-view-as-select" id="gorevViewAs">';
            h += '<option value="0"' + (!viewAsUserId ? ' selected' : '') + '>Ben (' + esc((window.eitUser || {}).name) + ')</option>';
            wpUsers.forEach(function (u) {
                if (u.id === realUid()) return; // kendimi zaten gosterdim
                var hasTask = usersWithTasks[u.id];
                var label = esc(u.name);
                if (hasTask) label += ' \u2022';
                h += '<option value="' + u.id + '"' + (viewAsUserId === u.id ? ' selected' : '') + '>' + label + '</option>';
            });
            h += '</select>';
            if (viewAsUserId) h += '<span class="gorev-view-as-badge">\ud83d\udc41 ' + esc(viewAsName()) + ' olarak g\u00f6r\u00fcl\u00fcyor</span>';
            h += '</div>';
        }

        // Summary cards
        h += '<div class="gorev-summary">';
        h += sumCard('devam', 'Devam Ediyor', myCounts.devam, '#3b82f6');
        h += sumCard('gecikli', 'Gecikmi\u015f', myCounts.gecikli, '#ef4444');
        h += sumCard('tamamlandi', 'Tamamland\u0131', myCounts.tamamlandi, '#22c55e');
        h += sumCard('onaylandi', 'Onayland\u0131', myCounts.onaylandi, '#8b5cf6');
        h += '</div>';

        // Filter tabs
        h += '<div class="gorev-filters">';
        var labels = { tumu: 'T\u00fcm\u00fc', devam: 'Devam Ediyor', gecikli: 'Gecikmi\u015f', tamamlandi: 'Tamamlanan', onaylandi: 'Onayland\u0131' };
        ['tumu', 'devam', 'gecikli', 'tamamlandi', 'onaylandi'].forEach(function (f) {
            h += '<button class="gorev-filter-btn' + (activeFilter === f ? ' active' : '') + '" data-filter="' + f + '">' + labels[f] + '</button>';
        });
        h += '</div>';

        // My tasks (or viewed user's tasks)
        if (activeFilter !== 'onaylandi') {
            var sectionLabel = viewAsUserId ? (viewAsName() + ' - G\u00f6revleri') : 'G\u00f6revlerim';
            h += '<h3 class="gorev-section-title">' + esc(sectionLabel) + ' (' + myTasks.length + ')</h3>';
            var myFiltered = filterTasks(myTasks, activeFilter);
            if (!myFiltered.length) {
                h += '<div class="gorev-empty">Bu kategoride g\u00f6rev yok</div>';
            } else {
                h += renderTable(myFiltered, false);
            }
        }

        // Gecmis (onaylanmis) gorevler
        if (myHistory.length && (activeFilter === 'tumu' || activeFilter === 'onaylandi' || activeFilter === 'tamamlandi')) {
            var histLabel = viewAsUserId ? 'Onayland\u0131' : 'Tamamlanan G\u00f6revlerim';
            h += '<h3 class="gorev-section-title" style="margin-top:20px">' + esc(histLabel) + ' (' + myHistory.length + ')</h3>';
            h += renderHistoryTable(myHistory, false);
        }

        // All tasks (admin/editor)
        if (adminOrEditor) {
            h += '<h3 class="gorev-section-title" style="margin-top:24px">T\u00fcm G\u00f6revler (' + allTasks.length + ')</h3>';
            if (allTasks.length) {
                // Per-user summary (aktif + gecmis birlikte)
                h += '<div class="gorev-user-summary">';
                var byUser = {};
                allTasks.forEach(function (t) {
                    var key = t.gorev.atananId || 0;
                    if (!byUser[key]) byUser[key] = { name: t.gorev.atananAd || 'Bilinmiyor', id: key, bekleyen: 0, devam: 0, gecikli: 0, tamamlandi: 0, onaylandi: 0, gecikmeliTamamlanan: 0, toplam: 0 };
                    byUser[key].toplam++;
                    if (t.gorev.durum === 'G\u00f6rev Verildi') byUser[key].bekleyen++;
                    else if (t.isOverdue) byUser[key].gecikli++;
                    else if (t.gorev.durum === 'Devam Ediyor') byUser[key].devam++;
                    else if (t.gorev.durum === 'Tamamland\u0131') byUser[key].tamamlandi++;
                });
                allHistory.forEach(function (t) {
                    var key = t.gorev.atananId || 0;
                    if (!byUser[key]) byUser[key] = { name: t.gorev.atananAd || 'Bilinmiyor', id: key, bekleyen: 0, devam: 0, gecikli: 0, tamamlandi: 0, onaylandi: 0, gecikmeliTamamlanan: 0, toplam: 0 };
                    byUser[key].onaylandi++;
                    byUser[key].toplam++;
                    if (t.wasLate) byUser[key].gecikmeliTamamlanan++;
                });
                Object.keys(byUser).sort(function (a, b) { return byUser[b].toplam - byUser[a].toplam; }).forEach(function (key) {
                    var u = byUser[key];
                    h += '<div class="gorev-user-row gorev-user-clickable" data-user-id="' + u.id + '">';
                    h += '<span class="gorev-user-name">' + esc(u.name) + '</span>';
                    h += '<div class="gorev-user-chips">';
                    if (u.bekleyen) h += '<span class="gorev-chip gorev-chip-bekleyen">' + u.bekleyen + ' bekleyen</span>';
                    if (u.devam) h += '<span class="gorev-chip gorev-chip-devam">' + u.devam + ' devam</span>';
                    if (u.gecikli) h += '<span class="gorev-chip gorev-chip-gecikli">' + u.gecikli + ' gecikmi\u015f</span>';
                    if (u.tamamlandi) h += '<span class="gorev-chip gorev-chip-tamamlandi">' + u.tamamlandi + ' tamamland\u0131</span>';
                    if (u.onaylandi) h += '<span class="gorev-chip gorev-chip-onaylandi">' + u.onaylandi + ' onayland\u0131</span>';
                    if (u.gecikmeliTamamlanan) h += '<span class="gorev-chip gorev-chip-gecikli">' + u.gecikmeliTamamlanan + ' gecikmeli</span>';
                    h += '</div>';
                    h += '<span class="gorev-user-total">' + u.toplam + '</span>';
                    h += '</div>';
                });
                h += '</div>';

                var allFiltered = filterTasks(allTasks, activeFilter);
                if (activeFilter !== 'onaylandi') {
                    if (!allFiltered.length) {
                        h += '<div class="gorev-empty">Bu kategoride g\u00f6rev yok</div>';
                    } else {
                        h += renderTable(allFiltered, true);
                    }
                }

                // Tum gecmis (admin/editor)
                if (allHistory.length && (activeFilter === 'tumu' || activeFilter === 'onaylandi' || activeFilter === 'tamamlandi')) {
                    h += '<h3 class="gorev-section-title" style="margin-top:20px">T\u00fcm Onayl\u0131 G\u00f6revler (' + allHistory.length + ')</h3>';
                    h += renderHistoryTable(allHistory, true);
                }
            } else if (!allHistory.length) {
                h += '<div class="gorev-empty">Hen\u00fcz hi\u00e7 g\u00f6rev atanmad\u0131</div>';
            }
        }

        $view.innerHTML = h;
        bindViewEvents();
    }

    function countByStatus(tasks) {
        var c = { bekleyen: 0, devam: 0, gecikli: 0, tamamlandi: 0, onaylandi: 0 };
        tasks.forEach(function (t) {
            if (t.isHistory) { c.onaylandi++; return; }
            if (t.gorev.durum === 'G\u00f6rev Verildi') c.bekleyen++;
            else if (t.isOverdue) c.gecikli++;
            else if (t.gorev.durum === 'Devam Ediyor') c.devam++;
            else if (t.gorev.durum === 'Tamamland\u0131') c.tamamlandi++;
        });
        return c;
    }

    function sumCard(key, label, count, color) {
        return '<div class="gorev-sum-card' + (activeFilter === key ? ' active' : '') + '" data-filter="' + key + '" style="--card-color:' + color + '">' +
            '<div class="gorev-sum-num">' + count + '</div>' +
            '<div class="gorev-sum-label">' + label + '</div></div>';
    }

    function renderTable(tasks, showAtanan) {
        var h = '<div class="gorev-table-wrap"><table class="gorev-table"><thead><tr>';
        h += '<th>Kitap</th><th>\u00dcnite</th><th>\u0130\u00e7erik</th>';
        if (showAtanan) h += '<th>Atanan</th>';
        h += '<th>Durum</th><th>Son Tarih</th><th>Eylem</th>';
        h += '</tr></thead><tbody>';

        tasks.forEach(function (t) {
            var rowClass = t.isOverdue ? ' class="gorev-row-overdue"' : '';
            h += '<tr' + rowClass + ' data-book-id="' + esc(t.book.id) + '" data-ui="' + t.ui + '" data-ii="' + t.ii + '">';
            h += '<td class="gorev-book-link"><strong>#' + esc(t.book.id) + '</strong> ' + esc(t.book.ders) + '</td>';
            h += '<td>' + esc(t.unite.ad) + '</td>';
            h += '<td>' + esc(t.icerik.ad) + '</td>';
            if (showAtanan) h += '<td>' + esc(t.gorev.atananAd) + '</td>';

            var stClass = 'gorev-st-verildi', stLabel = 'G\u00f6rev Verildi';
            if (t.gorev.durum === 'Devam Ediyor' && !t.isOverdue) { stClass = 'gorev-st-devam'; stLabel = 'Devam Ediyor'; }
            if (t.isOverdue) { stClass = 'gorev-st-gecikli'; stLabel = 'Gecikmi\u015f!'; }
            if (t.gorev.durum === 'Tamamland\u0131') {
                var wasLate = t.gorev.sonTarih && t.gorev.tamamlanmaTarihi && new Date(t.gorev.tamamlanmaTarihi) > new Date(t.gorev.sonTarih);
                if (wasLate) { stClass = 'gorev-st-gecikli'; stLabel = 'Gecikmeli Bitti'; }
                else { stClass = 'gorev-st-tamamlandi'; stLabel = 'Zaman\u0131nda \u2713'; }
            }
            h += '<td><span class="gorev-status ' + stClass + '">' + stLabel + '</span></td>';

            // Son tarih + kalan gun
            var sonTarihStr = t.gorev.sonTarih || '-';
            if (t.gorev.sonTarih && t.gorev.durum === 'Devam Ediyor') {
                var kalan = Math.ceil((new Date(t.gorev.sonTarih) - new Date()) / 86400000);
                if (kalan > 0) sonTarihStr += ' (' + kalan + ' g\u00fcn)';
                else if (kalan === 0) sonTarihStr += ' (Bug\u00fcn!)';
                else sonTarihStr += ' (' + Math.abs(kalan) + ' g\u00fcn ge\u00e7ti)';
            }
            if (t.gorev.durum === 'Tamamland\u0131') sonTarihStr = t.gorev.tamamlanmaTarihi || '-';
            h += '<td>' + esc(sonTarihStr) + '</td>';

            h += '<td>';
            var canAct = !viewAsUserId && t.gorev.atananId === realUid();
            if (canAct && t.gorev.durum === 'Devam Ediyor') {
                h += '<button class="gorev-act-btn gorev-act-complete" data-bid="' + esc(t.book.id) + '" data-ui="' + t.ui + '" data-ii="' + t.ii + '">Tamamla</button>';
            }
            h += '</td></tr>';
        });

        h += '</tbody></table></div>';
        return h;
    }

    function renderHistoryTable(tasks, showAtanan) {
        var h = '<div class="gorev-table-wrap"><table class="gorev-table gorev-table-history"><thead><tr>';
        h += '<th>Kitap</th><th>\u00dcnite</th><th>\u0130\u00e7erik</th><th>A\u015fama</th>';
        if (showAtanan) h += '<th>Ki\u015fi</th>';
        h += '<th>Son Tarih</th><th>Tamamlanma</th><th>Sonu\u00e7</th>';
        h += '</tr></thead><tbody>';

        tasks.forEach(function (t) {
            var g = t.gorev;
            var rowCls = t.wasLate ? ' class="gorev-row-late"' : '';
            h += '<tr' + rowCls + ' data-book-id="' + esc(t.book.id) + '" data-ui="' + t.ui + '" data-ii="' + t.ii + '">';
            h += '<td class="gorev-book-link"><strong>#' + esc(t.book.id) + '</strong> ' + esc(t.book.ders) + '</td>';
            h += '<td>' + esc(t.unite.ad) + '</td>';
            h += '<td>' + esc(t.icerik.ad) + '</td>';
            h += '<td>' + esc(g.asama || '') + '</td>';
            if (showAtanan) h += '<td>' + esc(g.atananAd) + '</td>';
            // Son tarih
            h += '<td>' + esc(g.sonTarih || '-') + '</td>';
            // Tamamlanma tarihi
            h += '<td>' + esc(g.tamamlanmaTarihi || '-') + '</td>';
            // Sonuc: zamaninda / gecikmeli + fark
            var stCls, stLbl;
            if (t.wasLate) {
                var gecikGun = Math.ceil((new Date(g.tamamlanmaTarihi) - new Date(g.sonTarih)) / 86400000);
                stCls = 'gorev-st-gecikli';
                stLbl = gecikGun + ' g\u00fcn ge\u00e7';
            } else if (g.sonTarih && g.tamamlanmaTarihi) {
                var erkenGun = Math.ceil((new Date(g.sonTarih) - new Date(g.tamamlanmaTarihi)) / 86400000);
                stCls = 'gorev-st-onaylandi';
                stLbl = erkenGun > 0 ? (erkenGun + ' g\u00fcn erken \u2713') : 'Zaman\u0131nda \u2713';
            } else {
                stCls = 'gorev-st-onaylandi';
                stLbl = 'Onayland\u0131 \u2713';
            }
            h += '<td><span class="gorev-status ' + stCls + '">' + stLbl + '</span></td>';
            h += '</tr>';
        });

        h += '</tbody></table></div>';
        return h;
    }

    /* ─── Gorev Action (server-side for non-editors) ─── */
    function canFullSave() {
        var caps = window.eitUserCaps || {};
        return caps.eit_edit || caps.eit_manage;
    }
    function gorevAction(bookId, ui, ii, action, days, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', (window.eitAjax || {}).url || '/wp-admin/admin-ajax.php');
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.onload = function () {
            if (xhr.status === 200) {
                try {
                    var res = JSON.parse(xhr.responseText);
                    if (res.success) {
                        if (res.data && typeof res.data.version !== 'undefined' && window.eitSetDataVersion) window.eitSetDataVersion(res.data.version);
                        if (callback) callback(true); return;
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

    /* ─── Events ─── */
    function bindViewEvents() {
        // View As dropdown
        var viewAsSel = document.getElementById('gorevViewAs');
        if (viewAsSel) {
            viewAsSel.addEventListener('change', function () {
                viewAsUserId = parseInt(this.value) || 0;
                activeFilter = 'tumu';
                renderView();
            });
        }

        // Filter buttons + summary cards
        $view.querySelectorAll('.gorev-filter-btn, .gorev-sum-card').forEach(function (el) {
            el.addEventListener('click', function () {
                activeFilter = this.dataset.filter;
                renderView();
            });
        });

        // Accept
        // Complete
        $view.querySelectorAll('.gorev-act-complete').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                var bookId = this.dataset.bid, ui = parseInt(this.dataset.ui), ii = parseInt(this.dataset.ii);
                var book = books().find(function (b) { return b.id === bookId; });
                if (!book) return;
                var ic = book.uniteler[ui].icerikler[ii];
                if (canFullSave()) {
                    ic.gorev.durum = 'Tamamland\u0131';
                    ic.gorev.tamamlanmaTarihi = new Date().toISOString().split('T')[0];
                    renderView();
                    if (window.eitMarkDirty) window.eitMarkDirty(bookId);
                    if (window.eitSave) window.eitSave();
                } else {
                    gorevAction(bookId, ui, ii, 'tamamla', 0, function (ok) {
                        if (ok) location.reload();
                    });
                }
            });
        });

        // User row click -> view as that user
        $view.querySelectorAll('.gorev-user-clickable').forEach(function (row) {
            row.style.cursor = 'pointer';
            row.addEventListener('click', function () {
                var userId = parseInt(this.dataset.userId) || 0;
                if (userId === realUid()) userId = 0; // kendi satirina tiklanirsa sifirla
                viewAsUserId = userId;
                activeFilter = 'tumu';
                renderView();
            });
        });

        // Row click -> open book detail
        $view.querySelectorAll('.gorev-book-link').forEach(function (cell) {
            cell.style.cursor = 'pointer';
            cell.addEventListener('click', function () {
                var tr = this.closest('tr');
                var bookId = tr.dataset.bookId;
                var book = books().find(function (b) { return b.id === bookId; });
                if (book && window.eitOpenDetail) window.eitOpenDetail(book);
            });
        });
    }

    // Expose for notification badge update
    window.eitGorevCounts = function () {
        return countByStatus(collectMyTasks());
    };

})();
