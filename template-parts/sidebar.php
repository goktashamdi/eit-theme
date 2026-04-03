<aside class="eit-sidebar" id="sidebar">
    <div class="sidebar-header">
        <h1>E-Takip</h1>
        <div class="subtitle">Dijital &#304;&#231;erik Y&#246;netimi</div>
    </div>

    <nav class="sidebar-nav" id="sidebarNav"></nav>

    <div class="sidebar-menu-links" id="sidebarMenuLinks">
        <button class="sidebar-menu-item" id="gorevlerBtn" data-perm="gorevlerim" data-tooltip="G&ouml;revlerim" style="display:none">
            <span class="sidebar-menu-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></span>
            <span class="sidebar-menu-label">G&ouml;revlerim</span>
        </button>
        <button class="sidebar-menu-item" id="reportsBtn" data-perm="raporlar" data-tooltip="Raporlar" style="display:none">
            <span class="sidebar-menu-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></span>
            <span class="sidebar-menu-label">Raporlar</span>
        </button>
        <!-- Bilgi butonu art&#305;k header sa&#287; &#252;stte -->
        <span id="criteriaBtn" data-perm="kriterler" style="display:none"></span>
        <!-- E-&#304;&#231;erik Tablosu art&#305;k Ayarlar i&#231;inde tab olarak -->
        <span id="eicerikTablosuBtn" data-perm="eicerik_tablosu" style="display:none"></span>
        <button class="sidebar-menu-item" id="adminPanelBtn" data-perm="yonetim" data-tooltip="Ayarlar" style="display:none">
            <span class="sidebar-menu-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg></span>
            <span class="sidebar-menu-label">Ayarlar</span>
        </button>
    </div>

    <div class="sidebar-user">
        <img class="sidebar-avatar" id="userAvatar" src="" alt="">
        <div class="sidebar-user-info">
            <div class="sidebar-user-name" id="userName"></div>
            <div class="sidebar-user-role" id="userRole"></div>
        </div>
        <a class="sidebar-logout" id="userLogout" title="&Ccedil;&#305;k&#305;&#351;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </a>
    </div>

    <button class="sidebar-collapse-btn" id="sidebarToggle" title="Daralt / Genişlet" data-tooltip="Geni&#351;let">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        <span class="collapse-label">Daralt</span>
    </button>
</aside>
