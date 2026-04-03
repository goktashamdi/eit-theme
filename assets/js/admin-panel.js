/**
 * EIT Admin Panel v2 - Kitap Y\u00f6netimi, Tan\u0131mlamalar, Kullan\u0131c\u0131lar
 */
(function () {
    'use strict';

    var $view, $body, $btn, activeTab = 'tanimlamalar';

    /* ─── State ─── */
    var deletedBooks = [];
    var undoTimer = null;
    var undoBook = null;
    var undoIdx = null;

    /* ─── Global tanimlama listeleri ─── */
    var defLists = {
        kitapDurumlari: ['Havuzda', '\u0130\u015flemde', 'TTKB Onay\u0131', 'Ask\u0131da', 'Pasif'],
        icerikDurumlari: ['\u0130\u00e7erik Gelmedi', '\u0130\u00e7erik Geldi', '\u00d6n \u0130nceleme', 'T\u00fcrk\u00e7e Okuma', '\u00dcretime Ba\u015fland\u0131', '\u00dcretim Devam Ediyor', 'E-\u0130\u00e7erik \u00dcretim Tamamland\u0131', '\u00d6n Kontrol', 'Scorm V2', 'Tashih', 'Son Kontrol', 'Tamamland\u0131'],
        eIcerikTurleri: ['Video', 'Etkile\u015fimli \u0130\u00e7erik', 'Animasyon', 'Ses', '\u0130nfografik', 'Sunu', 'G\u00f6rsel', 'Kavram Haritas\u0131', 'Sim\u00fclasyon', '3B Modelleme', 'Ses Dosyas\u0131'],
        maxImageSizeMB: 5
    };
    window.eitDefLists = defLists;
    window.eitIcerikDurumlari = defLists.icerikDurumlari;

    /* ─── Roller ─── */
    var roles = [
        { id: 'admin', label: 'Y\u00f6netici', desc: 'T\u00fcm yetkilere sahip' },
        { id: 'editor', label: 'E-\u0130\u00e7erik Edit\u00f6r\u00fc', desc: 'Kitap d\u00fczenleme, g\u00f6rev atama, a\u015fama de\u011fi\u015ftirme' },
        { id: 'specialist', label: 'E-\u0130\u00e7erik Uzman\u0131', desc: 'G\u00f6rev al\u0131r, e-i\u00e7erik \u00fcretir, tamamlar' },
        { id: 'reviewer', label: '\u0130nceleyici', desc: 'Kontrol eder, not ekler, g\u00f6r\u00fcnt\u00fcler' },
        { id: 'viewer', label: 'G\u00f6r\u00fcnt\u00fcleyici', desc: 'Sadece okuma yetkisi' }
    ];

    /* ─── Helpers ─── */
    function books() { return window.eitAllBooks || []; }
    function atananlar() { return window.eitAllAtananlar || []; }
    function refresh() { if (window.eitRefresh) window.eitRefresh(); }
    function esc(s) { if (s === null || s === undefined) return ''; var d = document.createElement('div'); d.textContent = String(s); return d.innerHTML.replace(/"/g, '&quot;'); }
    function escAttr(s) { return (s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;'); }

    /* ─── Init ──�� */
    document.addEventListener('DOMContentLoaded', function () {
        $view = document.getElementById('adminView');
        $btn = document.getElementById('adminPanelBtn');
        if (!$btn || !$view) return;
        $btn.addEventListener('click', openAdmin);
    });

    function openAdmin() {
        ['dashOverview', 'bookGrid', 'detailPage', 'emptyState', 'filterPills', 'resultsInfo', 'reportsView', 'criteriaView', 'eicerikTablosuView', 'gorevlerView'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
        ['reportsBtn', 'criteriaBtn', 'eicerikTablosuBtn', 'gorevlerBtn'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.classList.remove('active');
        });
        $view.style.display = '';
        $btn.classList.add('active');
        document.getElementById('pageTitle').textContent = 'Y\u00f6netim Paneli';
        var bc = document.getElementById('breadcrumb');
        if (bc) bc.textContent = '';
        renderAdminView();
        if (window.eitPushState) window.eitPushState('admin');
    }

    function renderAdminView() {
        var canManage = typeof eitUserCaps !== 'undefined' && eitUserCaps.eit_manage;
        var hasPerm = function (p) { return !!(window.eitMyPerms || {})[p]; };
        var tabs = [
            { key: 'tanimlamalar', label: 'Tan\u0131mlamalar' },
            { key: 'cop', label: '\u00c7\u00f6p Kutusu' }
        ];
        if (hasPerm('eicerik_tablosu')) tabs.push({ key: 'eicerik', label: 'E-\u0130\u00e7erik Tablosu' });
        if (canManage) tabs.push({ key: 'kullanicilar', label: 'Kullan\u0131c\u0131lar' });

        var h = '<div class="admin-inline">';
        h += '<div class="admin-tabs">';
        tabs.forEach(function (t) {
            h += '<button class="admin-tab' + (activeTab === t.key ? ' active' : '') + '" data-tab="' + t.key + '">' + t.label + '</button>';
        });
        h += '</div>';
        h += '<div class="admin-body" id="adminBody"></div>';
        h += '</div>';
        $view.innerHTML = h;
        $body = document.getElementById('adminBody');

        $view.querySelectorAll('.admin-tab').forEach(function (t) {
            t.addEventListener('click', function () {
                $view.querySelectorAll('.admin-tab').forEach(function (x) { x.classList.remove('active'); });
                t.classList.add('active');
                activeTab = t.dataset.tab;
                renderTab();
            });
        });

        renderTab();
    }

    function renderTab() {
        if (activeTab === 'cop') renderTrash();
        else if (activeTab === 'tanimlamalar') renderTanimlamalar();
        else if (activeTab === 'kullanicilar') renderKullanicilar();
        else if (activeTab === 'eicerik') {
            $body.innerHTML = '<div id="eicerikTablosuEmbed"></div>';
            if (window.eitRenderEicerikTablosu) window.eitRenderEicerikTablosu(document.getElementById('eicerikTablosuEmbed'));
        }
    }

    /* ─── Trash & Undo ─── */
    function trashBook(idx) {
        var all = books();
        if (idx < 0 || idx >= all.length) return;
        var b = all.splice(idx, 1)[0];
        deletedBooks.push(b);

        undoBook = b;
        undoIdx = idx;
        if (undoTimer) clearTimeout(undoTimer);
        undoTimer = setTimeout(function () { undoBook = null; undoIdx = null; hideUndo(); }, 6000);

        refresh();
        showUndo('#' + (b.id || '?') + ' ' + (b.ders || 'kitap') + ' silindi');
    }

    function undoDelete() {
        if (!undoBook) return;
        var all = books();
        var idx = Math.min(undoIdx, all.length);
        all.splice(idx, 0, undoBook);
        var ti = deletedBooks.indexOf(undoBook);
        if (ti > -1) deletedBooks.splice(ti, 1);
        undoBook = null;
        undoIdx = null;
        if (undoTimer) { clearTimeout(undoTimer); undoTimer = null; }
        hideUndo();
        refresh();
    }

    function showUndo(msg) {
        var existing = document.getElementById('eitUndoToast');
        if (existing) existing.remove();
        var toast = document.createElement('div');
        toast.id = 'eitUndoToast';
        toast.className = 'eit-undo-toast';
        toast.innerHTML = '<span>' + esc(msg) + '</span><button id="eitUndoBtn">Geri Al</button><button class="eit-undo-close">\u00d7</button>';
        document.body.appendChild(toast);
        setTimeout(function () { toast.classList.add('show'); }, 10);
        toast.querySelector('#eitUndoBtn').addEventListener('click', undoDelete);
        toast.querySelector('.eit-undo-close').addEventListener('click', hideUndo);
    }

    function hideUndo() {
        var t = document.getElementById('eitUndoToast');
        if (t) { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 300); }
    }

    /* ─── Cop Kutusu (admin panelde) ─── */
    function renderTrash() {
        if (!deletedBooks.length) {
            $body.innerHTML = '<div class="ap-empty">\u00c7\u00f6p kutusu bo\u015f</div>';
            return;
        }
        var h = '<div class="ap-toolbar"><div class="ap-toolbar-left"><span style="font-size:13px;color:#64748b">' + deletedBooks.length + ' silinen kitap</span></div>';
        h += '<button class="ap-bulk-btn ap-bulk-danger" id="apTrashClear">T\u00fcm\u00fcn\u00fc Kal\u0131c\u0131 Sil</button></div>';
        h += '<div class="ap-def-list">';
        deletedBooks.forEach(function (b, i) {
            h += '<div class="ap-def-item">';
            h += '<span class="ap-cell-code" style="margin-right:8px">#' + esc(b.id) + '</span>';
            h += '<span class="ap-def-item-name">' + esc(b.ders || b.baslik) + '</span>';
            h += '<span style="font-size:11px;color:#94a3b8">' + esc(b.sinif) + '</span>';
            h += '<button class="ap-icon-btn ap-save" data-trash-idx="' + i + '" title="Geri Y\u00fckle">&#8634;</button>';
            h += '<button class="ap-icon-btn ap-del" data-trash-perm="' + i + '" title="Kal\u0131c\u0131 Sil">&#10005;</button>';
            h += '</div>';
        });
        h += '</div>';
        $body.innerHTML = h;

        // Restore
        $body.querySelectorAll('[data-trash-idx]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var i = parseInt(this.dataset.trashIdx);
                books().push(deletedBooks.splice(i, 1)[0]);
                refresh();
                renderTrash();
            });
        });
        // Permanent delete
        $body.querySelectorAll('[data-trash-perm]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var i = parseInt(this.dataset.trashPerm);
                if (confirm('Kal\u0131c\u0131 olarak silinsin mi? Geri al\u0131namaz.')) {
                    deletedBooks.splice(i, 1);
                    renderTrash();
                }
            });
        });
        // Clear all
        var cl = document.getElementById('apTrashClear');
        if (cl) cl.addEventListener('click', function () {
            if (confirm(deletedBooks.length + ' kitap kal\u0131c\u0131 olarak silinsin mi?')) {
                deletedBooks = [];
                renderTrash();
            }
        });
    }

    /* ===================================================================
       TANIMLAMALAR TAB
    =================================================================== */
    var defSection = 'durumlar';

    function renderTanimlamalar() {
        var sections = [
            { key: 'durumlar', label: 'Kitap Durumlar\u0131', field: 'durumu', list: 'kitapDurumlari' },
            { key: 'icerik_durumlari', label: '\u0130\u00e7erik Durumlar\u0131', field: '_icerik_durum', list: 'icerikDurumlari' },
            { key: 'eicerik_turleri', label: 'E-\u0130\u00e7erik T\u00fcrleri', field: '_eicerik_tur', list: 'eIcerikTurleri' },
            { key: 'dersler', label: 'Dersler', field: 'ders', list: 'books' },
            { key: 'yayinevleri', label: 'Yay\u0131nevleri', field: 'yayinevi', list: 'books' },
            { key: 'atananlar', label: 'E-\u0130\u00e7erik Atananlar\u0131', field: 'atanan', list: 'atananlar' },
            { key: 'siniflar', label: 'S\u0131n\u0131f D\u00fczeyleri', field: 'sinif', list: 'books' },
            { key: 'okullar', label: 'Okul T\u00fcrleri', field: 'okul', list: 'books' },
            { key: 'ayarlar', label: 'Ayarlar', field: '_ayarlar', list: '_ayarlar' },
            { key: 'veri', label: 'Veri Y\u00f6netimi', field: '_veri', list: '_veri' },
        ];

        var h = '<div class="ap-def-layout">';

        // Left: section list
        h += '<div class="ap-def-sidebar">';
        sections.forEach(function (s) {
            h += '<div class="ap-def-nav' + (defSection === s.key ? ' active' : '') + '" data-sec="' + s.key + '">';
            h += '<span>' + s.label + '</span>';
            if (s.key !== 'veri') h += '<span class="ap-def-nav-count">' + getDefArray(s).length + '</span>';
            h += '</div>';
        });
        h += '</div>';

        // Right: items
        var sec = sections.find(function (s) { return s.key === defSection; });
        h += '<div class="ap-def-content">';
        if (sec.key === 'ayarlar') {
            h += renderAyarlarSection();
        } else if (sec.key === 'veri') {
            h += renderVeriSection();
        } else {
            h += renderDefSection(sec);
        }
        h += '</div>';

        h += '</div>';
        $body.innerHTML = h;

        // Nav clicks
        $body.querySelectorAll('.ap-def-nav').forEach(function (nav) {
            nav.addEventListener('click', function () {
                defSection = this.dataset.sec;
                renderTanimlamalar();
            });
        });

        if (sec.key === 'ayarlar') {
            bindAyarlarEvents();
        } else if (sec.key === 'veri') {
            bindVeriEvents();
        } else {
            bindDefEvents(sec);
        }
    }

    /* ─── Her section icin array'i don ─── */
    // Cached book-field lists (so drag reorder works by reference)
    var fieldLists = {};

    function getDefArray(sec) {
        if (sec.list === '_logo' || sec.list === '_veri' || sec.list === '_ayarlar') return [];
        if (sec.list === 'atananlar') return atananlar();
        if (sec.list === 'kitapDurumlari') return defLists.kitapDurumlari;
        if (sec.list === 'icerikDurumlari') return defLists.icerikDurumlari;
        if (sec.list === 'eIcerikTurleri') return defLists.eIcerikTurleri;
        // books field: use cached list, rebuild if needed
        var key = sec.field;
        var vals = {};
        books().forEach(function (b) {
            var v = (key === 'atanan') ? (b.atanan || '') : (b[key] || '');
            if (v) vals[v] = 1;
        });
        var current = Object.keys(vals);
        if (!fieldLists[key]) {
            fieldLists[key] = current.sort(function (a, b) { return a.localeCompare(b, 'tr'); });
        } else {
            // Add new values not in cached list
            current.forEach(function (v) { if (fieldLists[key].indexOf(v) === -1) fieldLists[key].push(v); });
            // Remove values no longer in books
            fieldLists[key] = fieldLists[key].filter(function (v) { return vals[v]; });
        }
        return fieldLists[key];
    }

    function renderDefSection(sec) {
        var arr = getDefArray(sec);
        return renderSimpleListSection(sec, arr);
    }

    function bindDefEvents(sec) {
        var arr = getDefArray(sec);
        bindSimpleListEvents(sec, arr, sec.field);
    }

    function renameInBooks(field, oldName, newName) {
        books().forEach(function (b) {
            if (b[field] === oldName) b[field] = newName;
        });
        if (field === 'atanan') { var al = atananlar(); var ai = al.indexOf(oldName); if (ai > -1) al[ai] = newName; }
    }

    function clearInBooks(field, name) {
        books().forEach(function (b) {
            if (b[field] === name) b[field] = '';
        });
        if (field === 'atanan') { var al = atananlar(); var ai = al.indexOf(name); if (ai > -1) al.splice(ai, 1); }
    }

    /* ─── Simple list events (drag-sortable) ─── */
    function bindSimpleListEvents(sec, arr, bookField) {
        var addBtn = document.getElementById('defAddBtn');
        var addInp = document.getElementById('defNewInput');
        if (addBtn) addBtn.addEventListener('click', function () {
            var val = addInp.value.trim();
            if (!val || arr.indexOf(val) > -1) return;
            arr.push(val);
            refresh(); renderTanimlamalar();
        });
        if (addInp) addInp.addEventListener('keydown', function (e) { if (e.key === 'Enter') addBtn.click(); });

        // Rename
        $body.querySelectorAll('.ap-def-rename').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var item = this.closest('.ap-def-item');
                var idx = parseInt(item.dataset.idx);
                var oldName = arr[idx];
                var nameEl = item.querySelector('.ap-def-item-name');
                nameEl.innerHTML = '<input class="ap-inp ap-def-edit-inp" value="' + esc(oldName) + '">';
                var inp = nameEl.querySelector('input');
                inp.focus(); inp.select();
                this.innerHTML = '&#10003;'; this.className = 'ap-icon-btn ap-save';
                var doSave = function () {
                    var nv = inp.value.trim();
                    if (nv && nv !== oldName) {
                        arr[idx] = nv;
                        // Also rename in books if it's a book field
                        if (bookField && bookField.charAt(0) !== '_') renameInBooks(bookField, oldName, nv);
                    }
                    refresh(); renderTanimlamalar();
                };
                this.onclick = doSave;
                inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') doSave(); if (e.key === 'Escape') renderTanimlamalar(); });
            });
        });

        // Delete
        $body.querySelectorAll('.ap-def-delete').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var idx = parseInt(this.closest('.ap-def-item').dataset.idx);
                if (confirm('"' + arr[idx] + '" silinsin mi?')) {
                    var name = arr[idx];
                    arr.splice(idx, 1);
                    if (bookField && bookField.charAt(0) !== '_') clearInBooks(bookField, name);
                    refresh(); renderTanimlamalar();
                }
            });
        });

        // Drag & drop reorder
        var list = document.getElementById('defSortList');
        if (list) {
            var dragIdx = null;
            list.querySelectorAll('.ap-def-item').forEach(function (item) {
                item.addEventListener('dragstart', function () { dragIdx = parseInt(this.dataset.idx); this.style.opacity = '.4'; });
                item.addEventListener('dragend', function () { this.style.opacity = ''; });
                item.addEventListener('dragover', function (e) { e.preventDefault(); this.style.borderTop = '2px solid var(--blue-500)'; });
                item.addEventListener('dragleave', function () { this.style.borderTop = ''; });
                item.addEventListener('drop', function (e) {
                    e.preventDefault(); this.style.borderTop = '';
                    var dropIdx = parseInt(this.dataset.idx);
                    if (dragIdx !== null && dragIdx !== dropIdx) {
                        var moved = arr.splice(dragIdx, 1)[0];
                        arr.splice(dropIdx, 0, moved);
                        refresh(); renderTanimlamalar();
                    }
                    dragIdx = null;
                });
            });
        }
    }

    /* ─── Simple list section (for icerik durumlari etc.) ─── */
    function renderSimpleListSection(sec, arr) {
        var h = '<h3 class="ap-def-title">' + sec.label + '</h3>';
        h += '<div class="ap-def-add"><input class="ap-inp" id="defNewInput" placeholder="Yeni durum ekle..."><button class="ap-add-btn" id="defAddBtn">Ekle</button></div>';
        h += '<div class="ap-def-list" id="defSortList">';
        arr.forEach(function (item, i) {
            h += '<div class="ap-def-item" data-idx="' + i + '" draggable="true">';
            h += '<span style="cursor:grab;color:var(--text-light);margin-right:4px">\u2630</span>';
            h += '<span class="ap-def-item-name">' + esc(item) + '</span>';
            h += '<span class="ap-def-item-count" style="opacity:.4">' + (i + 1) + '</span>';
            h += '<button class="ap-icon-btn ap-edit ap-def-rename" title="D\u00fczenle">&#9998;</button>';
            h += '<button class="ap-icon-btn ap-del ap-def-delete" title="Sil">&#10005;</button>';
            h += '</div>';
        });
        if (!arr.length) h += '<div class="ap-empty">Hen\u00fcz tan\u0131m yok</div>';
        h += '</div>';
        return h;
    }

    /* ===================================================================
       KULLANICILAR TAB (WP AJAX)
    =================================================================== */
    var wpUsers = [];

    function renderKullanicilar() {
        $body.innerHTML = '<div class="ap-empty">Y\u00fckleniyor...</div>';
        ajaxPost('eit_list_users', {}, function (data) {
            wpUsers = data;
            renderUsersUI();
        });
    }

    function renderUsersUI() {
        var userRole = (window.eitUser || {}).role || 'viewer';
        var h = '<div class="ap-users-layout">';

        // Roles info
        h += '<div class="ap-roles-info">';
        h += '<h3 class="ap-def-title">Kullan\u0131c\u0131 Rolleri</h3>';
        h += '<div class="ap-roles-grid">';
        roles.forEach(function (r) {
            h += '<div class="ap-role-card">';
            h += '<div class="ap-role-name">' + r.label + '</div>';
            h += '<div class="ap-role-desc">' + r.desc + '</div>';
            h += '</div>';
        });
        h += '</div></div>';

        // Add user form
        h += '<h3 class="ap-def-title" style="margin-top:8px">Kullan\u0131c\u0131 Ekle</h3>';
        h += '<div class="ap-def-add" style="margin-bottom:16px">';
        h += '<input class="ap-inp" id="uName" placeholder="Ad Soyad">';
        h += '<input class="ap-inp" id="uEmail" placeholder="E-posta" type="email">';
        h += '<input class="ap-inp" id="uPass" placeholder="\u015eifre (bo\u015f = otomatik)" type="password" style="width:140px">';
        h += '<select class="ap-sel" id="uRole">';
        roles.forEach(function (r) {
            if (r.id !== 'admin') h += '<option value="eit_' + r.id + '">' + r.label + '</option>';
        });
        h += '</select>';
        h += '<button class="ap-add-btn" id="uAddBtn">Ekle</button>';
        h += '</div>';

        // Yetki etiketleri (kisa)
        var extraPermLabels = {
            'gorevlerim': 'G\u00f6revler', 'raporlar': 'Raporlar', 'kriterler': 'Bilgi',
            'kitap_ekle_sil': 'Kitap +/-', 'kitap_duzenle': 'D\u00fczenle', 'kitap_durum': 'Durum',
            'asama_degistir': 'A\u015fama', 'gorev_ata': 'G\u00f6rev Ata', 'not_ekle': 'Not',
            'toplu_islem': 'Toplu', 'yonetim': 'Ayarlar', 'kullanici_yonet': 'Kullan\u0131c\u0131',
            'eicerik_tablosu': 'E-\u0130\u00e7erik Tab.'
        };
        var extraPermKeys = Object.keys(extraPermLabels);

        // Users table
        if (wpUsers.length) {
            h += '<div class="ap-table-wrap" style="max-height:450px">';
            h += '<table class="ap-table"><thead><tr><th style="width:36px"></th><th>Ad</th><th>E-posta</th><th>Rol</th><th>Ekstra Yetkiler</th><th></th></tr></thead><tbody>';
            wpUsers.forEach(function (u) {
                var rl = (roles.find(function (r) { return r.id === u.role; }) || {}).label || u.role;
                var isMe = String(u.id) === String((window.eitUser || {}).id || 0);
                var extras = u.extras || [];
                h += '<tr' + (isMe ? ' style="background:rgba(59,130,246,.04)"' : '') + '>';
                h += '<td><img src="' + esc(u.avatar) + '" style="width:28px;height:28px;border-radius:6px"></td>';
                h += '<td style="font-weight:600">' + esc(u.name) + (isMe ? ' <span style="font-size:10px;color:#3b82f6">(sen)</span>' : '') + '</td>';
                h += '<td style="color:#64748b;font-size:12px">' + esc(u.email) + '</td>';

                // Role select
                if (u.role === 'admin' || isMe) {
                    h += '<td><span class="ap-tag ap-tag-role">' + esc(rl) + '</span></td>';
                    h += '<td></td>';
                    h += '<td></td>';
                } else {
                    h += '<td><select class="ap-sel ap-role-change" data-uid="' + u.id + '">';
                    roles.forEach(function (r) {
                        if (r.id !== 'admin') {
                            h += '<option value="eit_' + r.id + '"' + (u.role === r.id ? ' selected' : '') + '>' + r.label + '</option>';
                        }
                    });
                    h += '</select></td>';

                    // Ekstra yetkiler
                    h += '<td class="ap-extras">';
                    extraPermKeys.forEach(function (pk) {
                        var hasExtra = extras.indexOf(pk) > -1;
                        h += '<label class="ap-extra-tag' + (hasExtra ? ' ap-extra-on' : '') + '">';
                        h += '<input type="checkbox" class="ap-extra-cb" data-uid="' + u.id + '" data-perm="' + pk + '"' + (hasExtra ? ' checked' : '') + '>';
                        h += '<span>' + extraPermLabels[pk] + '</span></label>';
                    });
                    h += '</td>';

                    h += '<td class="ap-actions"><button class="ap-icon-btn ap-del" data-uid="' + u.id + '" data-uname="' + escAttr(u.name) + '" title="Sil">&#10005;</button></td>';
                }
                h += '</tr>';
            });
            h += '</tbody></table></div>';
        } else {
            h += '<div class="ap-empty">Kullan\u0131c\u0131 bulunamad\u0131</div>';
        }

        h += '</div>';
        $body.innerHTML = h;

        // Add user
        document.getElementById('uAddBtn').addEventListener('click', function () {
            var name = document.getElementById('uName').value.trim();
            var email = document.getElementById('uEmail').value.trim();
            var pass = document.getElementById('uPass').value;
            var role = document.getElementById('uRole').value;
            if (!name || !email) { alert('Ad ve e-posta zorunlu'); return; }

            this.disabled = true;
            this.textContent = 'Ekleniyor...';

            ajaxPost('eit_add_user', { name: name, email: email, password: pass, role: role }, function (data) {
                var msg = 'Kullan\u0131c\u0131 eklendi.\nKullan\u0131c\u0131 ad\u0131: ' + data.username;
                if (data.resetUrl) msg += '\n\u015eifre s\u0131f\u0131rlama linki: ' + data.resetUrl;
                alert(msg);
                renderKullanicilar();
            }, function (err) {
                alert('Hata: ' + err);
                renderUsersUI();
            });
        });

        // Role change
        $body.querySelectorAll('.ap-role-change').forEach(function (sel) {
            sel.addEventListener('change', function () {
                var uid = this.dataset.uid;
                var role = this.value;
                ajaxPost('eit_change_role', { user_id: uid, role: role }, function () {
                    renderKullanicilar();
                });
            });
        });

        // Extra perm toggle
        $body.querySelectorAll('.ap-extra-cb').forEach(function (cb) {
            cb.addEventListener('change', function () {
                var uid = this.dataset.uid;
                var perm = this.dataset.perm;
                var enable = this.checked;
                var label = this.closest('.ap-extra-tag');
                if (label) label.classList.toggle('ap-extra-on', enable);
                ajaxPost('eit_toggle_user_perm', { user_id: uid, perm: perm, enable: enable ? '1' : '0' }, function () {
                    if (window.eitShowToast) window.eitShowToast('Yetki g\u00fcncellendi');
                    // Kullanici listesini guncelle (arka planda)
                    ajaxPost('eit_list_users', {}, function (data) { wpUsers = data; });
                }, function (err) {
                    alert('Yetki hatas\u0131: ' + (err || 'Bilinmeyen'));
                    cb.checked = !enable;
                    if (label) label.classList.toggle('ap-extra-on', !enable);
                });
            });
        });

        // Delete
        $body.querySelectorAll('.ap-del[data-uid]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var uid = this.dataset.uid;
                var name = this.dataset.uname;
                if (!confirm(name + ' silinsin mi?')) return;
                ajaxPost('eit_delete_user', { user_id: uid }, function () {
                    renderKullanicilar();
                });
            });
        });
    }

    /* ===================================================================
       VERI YONETIMI SECTION
    =================================================================== */
    function renderVeriSection() {
        var total = books().length;
        var h = '<div class="ap-veri-section">';
        h += '<h3 style="margin:0 0 16px;font-size:16px;font-weight:600">Veri Y\u00f6netimi</h3>';

        // Export
        h += '<div class="ap-veri-card">';
        h += '<div class="ap-veri-card-title">Kitap Verisi D\u0131\u015fa Aktar</div>';
        h += '<p style="font-size:12px;color:var(--text-light);margin:4px 0 12px">T\u00fcm kitap verilerini (' + total + ' kitap) JSON dosyas\u0131 olarak indirin. Yedekleme veya ba\u015fka bir siteye aktarma i\u00e7in kullan\u0131labilir.</p>';
        h += '<button class="ap-veri-btn ap-veri-btn-export" id="veriExportBtn">';
        h += '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';
        h += ' JSON \u0130ndir (' + total + ' kitap)</button>';
        h += '</div>';

        // Import
        h += '<div class="ap-veri-card">';
        h += '<div class="ap-veri-card-title">Kitap Verisi \u0130\u00e7e Aktar</div>';
        h += '<p style="font-size:12px;color:var(--text-light);margin:4px 0 12px">Daha \u00f6nce d\u0131\u015fa aktar\u0131lan JSON dosyas\u0131n\u0131 y\u00fckleyin. <strong style="color:#ef4444">Mevcut t\u00fcm verinin \u00fczerine yaz\u0131l\u0131r!</strong></p>';
        h += '<label class="ap-veri-btn ap-veri-btn-import" id="veriImportLabel">';
        h += '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>';
        h += ' JSON Y\u00fckle';
        h += '<input type="file" id="veriImportFile" accept=".json" style="display:none">';
        h += '</label>';
        h += '<div id="veriImportStatus" style="margin-top:8px;font-size:12px"></div>';
        h += '</div>';

        h += '</div>';
        return h;
    }

    function bindVeriEvents() {
        // Export
        var exportBtn = document.getElementById('veriExportBtn');
        if (exportBtn) exportBtn.addEventListener('click', function () {
            var data = JSON.stringify(books(), null, 2);
            var blob = new Blob([data], { type: 'application/json' });
            var a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            var d = new Date();
            a.download = 'eit-kitaplar-' + d.getFullYear() + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2) + '.json';
            a.click();
            setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
        });

        // Import
        var fileInput = document.getElementById('veriImportFile');
        var status = document.getElementById('veriImportStatus');
        if (fileInput) fileInput.addEventListener('change', function () {
            var file = this.files[0];
            if (!file) return;
            var reader = new FileReader();
            reader.onload = function (e) {
                var imported;
                try { imported = JSON.parse(e.target.result); } catch (err) {
                    status.innerHTML = '<span style="color:#ef4444">Ge\u00e7ersiz JSON dosyas\u0131!</span>';
                    return;
                }
                if (!Array.isArray(imported) || !imported.length) {
                    status.innerHTML = '<span style="color:#ef4444">Dosyada kitap verisi bulunamad\u0131.</span>';
                    return;
                }
                if (!confirm(imported.length + ' kitap i\u00e7e aktar\u0131lacak. Mevcut t\u00fcm veri \u00fczerine yaz\u0131lacak!\n\nDevam edilsin mi?')) return;

                status.innerHTML = '<span style="color:var(--blue-500)">Y\u00fckleniyor...</span>';
                var xhr = new XMLHttpRequest();
                xhr.open('POST', (window.eitAjax || {}).url || '/wp-admin/admin-ajax.php');
                xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                xhr.timeout = 60000;
                xhr.onload = function () {
                    try {
                        var resp = JSON.parse(xhr.responseText);
                        if (resp.success) {
                            status.innerHTML = '<span style="color:#22c55e">' + resp.data.imported + ' kitap ba\u015far\u0131yla aktar\u0131ld\u0131! Sayfa yenileniyor...</span>';
                            setTimeout(function () { location.reload(); }, 1500);
                        } else {
                            status.innerHTML = '<span style="color:#ef4444">Hata: ' + (resp.data || 'Bilinmeyen') + '</span>';
                        }
                    } catch (err) {
                        status.innerHTML = '<span style="color:#ef4444">Sunucu yan\u0131t\u0131 okunamad\u0131.</span>';
                    }
                };
                xhr.onerror = function () { status.innerHTML = '<span style="color:#ef4444">Ba\u011flant\u0131 hatas\u0131.</span>'; };
                xhr.ontimeout = function () { status.innerHTML = '<span style="color:#ef4444">Zaman a\u015f\u0131m\u0131.</span>'; };
                xhr.send('action=eit_import_books&nonce=' + ((window.eitAjax || {}).nonce || '') + '&books=' + encodeURIComponent(JSON.stringify(imported)));
            };
            reader.readAsText(file);
        });
    }

    /* ===================================================================
       AYARLAR SECTION
    =================================================================== */
    var permGroups = [
        { group: 'Sayfa Eri\u015fimi', perms: [
            { key: 'gorevlerim',    label: 'G\u00f6revlerim' },
            { key: 'raporlar',      label: 'Raporlar' },
            { key: 'kriterler',     label: 'Bilgi Paneli' }
        ]},
        { group: 'Kitap \u0130\u015flemleri', perms: [
            { key: 'kitap_ekle_sil',  label: 'Kitap Ekleme / Silme' },
            { key: 'kitap_duzenle',   label: 'Kitap Bilgi D\u00fczenleme' },
            { key: 'kitap_durum',     label: 'Durum De\u011fi\u015ftirme' }
        ]},
        { group: 'E-\u0130\u00e7erik \u0130\u015flemleri', perms: [
            { key: 'asama_degistir',  label: 'A\u015fama De\u011fi\u015ftirme' },
            { key: 'gorev_ata',       label: 'G\u00f6rev Atama' },
            { key: 'not_ekle',        label: 'Not Ekleme / D\u00fczenleme' },
            { key: 'toplu_islem',     label: 'Toplu \u0130\u015flem' }
        ]},
        { group: 'Y\u00f6netim', perms: [
            { key: 'yonetim',         label: 'Ayarlar Paneli' },
            { key: 'kullanici_yonet', label: 'Kullan\u0131c\u0131 Y\u00f6netimi' },
            { key: 'eicerik_tablosu', label: 'E-\u0130\u00e7erik Tablosu' }
        ]}
    ];
    var permLabels = {};
    var permKeys = [];
    permGroups.forEach(function (g) {
        g.perms.forEach(function (p) { permLabels[p.key] = p.label; permKeys.push(p.key); });
    });
    var roleNames = { admin: 'Admin', editor: 'Edit\u00f6r', specialist: 'Uzman', reviewer: '\u0130nceleyici', viewer: 'G\u00f6r\u00fcnt\u00fcleyici' };
    var roleKeys = ['admin', 'editor', 'specialist', 'reviewer', 'viewer'];

    function getRolePerms() { return window.eitRolePerms || {}; }

    function renderAyarlarSection() {
        var rp = getRolePerms();
        var h = '<div class="ap-ayarlar">';

        // Resim boyutu
        h += '<h3 style="margin:0 0 12px;font-size:15px;font-weight:600">Genel</h3>';
        h += '<div class="ap-ayar-row">';
        h += '<label class="ap-ayar-label">Not Resim Boyutu Limiti (MB)</label>';
        h += '<input type="number" class="ap-ayar-input" id="ayarMaxImgSize" min="1" max="20" value="' + (defLists.maxImageSizeMB || 5) + '">';
        h += '</div>';

        // Yetki matrisi
        h += '<h3 style="margin:24px 0 12px;font-size:15px;font-weight:600">Rol Yetkileri</h3>';
        h += '<div class="ap-perm-table-wrap"><table class="ap-perm-table"><thead><tr><th></th>';
        roleKeys.forEach(function (r) { h += '<th>' + roleNames[r] + '</th>'; });
        h += '</tr></thead><tbody>';
        permGroups.forEach(function (g) {
            h += '<tr class="ap-perm-group-row"><td colspan="' + (roleKeys.length + 1) + '">' + g.group + '</td></tr>';
            g.perms.forEach(function (p) {
                h += '<tr><td class="ap-perm-label">' + p.label + '</td>';
                roleKeys.forEach(function (r) {
                    var checked = rp[r] && rp[r][p.key] ? ' checked' : '';
                    var disabled = r === 'admin' ? ' disabled' : '';
                    h += '<td class="ap-perm-cell"><input type="checkbox" class="ap-perm-cb" data-role="' + r + '" data-perm="' + p.key + '"' + checked + disabled + '></td>';
                });
                h += '</tr>';
            });
        });
        h += '</tbody></table></div>';
        h += '<button class="ap-perm-save" id="apPermSave">Yetkileri Kaydet</button>';

        h += '</div>';
        return h;
    }

    function bindAyarlarEvents() {
        var inp = document.getElementById('ayarMaxImgSize');
        if (inp) {
            inp.addEventListener('change', function () {
                var val = parseInt(this.value) || 5;
                if (val < 1) val = 1;
                if (val > 20) val = 20;
                this.value = val;
                defLists.maxImageSizeMB = val;
            });
        }
        // Save permissions
        var saveBtn = document.getElementById('apPermSave');
        if (saveBtn) {
            saveBtn.addEventListener('click', function () {
                var rp = {};
                roleKeys.forEach(function (r) { rp[r] = {}; });
                $body.querySelectorAll('.ap-perm-cb').forEach(function (cb) {
                    rp[cb.dataset.role][cb.dataset.perm] = cb.checked;
                });
                // Admin always all true
                permKeys.forEach(function (pk) { rp.admin[pk] = true; });
                // Save via AJAX
                var xhr = new XMLHttpRequest();
                xhr.open('POST', (window.eitAjax || {}).url || '/wp-admin/admin-ajax.php');
                xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                xhr.onload = function () {
                    if (xhr.status === 200) {
                        try {
                            var res = JSON.parse(xhr.responseText);
                            if (res.success) {
                                window.eitRolePerms = rp;
                                // Update current user perms
                                var myRole = (window.eitUser || {}).role || 'viewer';
                                window.eitMyPerms = rp[myRole] || {};
                                document.querySelectorAll('#sidebarMenuLinks [data-perm]').forEach(function (btn) {
                                    btn.style.display = (window.eitMyPerms[btn.dataset.perm]) ? '' : 'none';
                                });
                                alert('Yetkiler kaydedildi');
                                return;
                            }
                        } catch (e) {}
                    }
                    alert('Kaydetme hatas\u0131');
                };
                xhr.send('action=eit_save_perms&nonce=' + ((window.eitAjax || {}).nonce || '') + '&perms=' + encodeURIComponent(JSON.stringify(rp)));
            });
        }
    }

    /* ─── AJAX helper ─── */
    function ajaxPost(action, data, onSuccess, onError) {
        if (!window.eitAjax) { if (onError) onError('AJAX ayarlari bulunamadi'); return; }
        var params = 'action=' + action + '&nonce=' + eitAjax.nonce;
        for (var k in data) {
            if (data.hasOwnProperty(k)) params += '&' + encodeURIComponent(k) + '=' + encodeURIComponent(data[k]);
        }
        var xhr = new XMLHttpRequest();
        xhr.open('POST', eitAjax.url);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.onload = function () {
            try {
                var resp = JSON.parse(xhr.responseText);
                if (resp.success) { if (onSuccess) onSuccess(resp.data); }
                else { if (onError) onError(resp.data); else alert('Hata: ' + (resp.data || 'Bilinmeyen hata')); }
            } catch (e) {
                if (onError) onError('Sunucu yan\u0131t\u0131 okunamad\u0131');
                else alert('Sunucu hatas\u0131');
            }
        };
        xhr.onerror = function () {
            if (onError) onError('Ba\u011flant\u0131 hatas\u0131');
            else alert('Ba\u011flant\u0131 hatas\u0131');
        };
        xhr.send(params);
    }

})();
