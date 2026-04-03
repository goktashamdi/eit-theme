<?php get_header(); ?>

<div class="eit-wrapper">
    <?php get_template_part('template-parts/sidebar'); ?>

    <main class="eit-main">
        <?php get_template_part('template-parts/header-bar'); ?>

        <div class="eit-content">
            <div class="filter-pills" id="filterPills"></div>
            <div class="results-info" id="resultsInfo"></div>

            <!-- Dashboard Overview -->
            <div class="dash-overview" id="dashOverview"></div>

            <!-- Card Grid (hidden initially) -->
            <div class="book-grid" id="bookGrid" style="display:none;"></div>

            <div class="empty-state" id="emptyState" style="display:none;">
                <div class="empty-icon">&#128218;</div>
                <h3>Kitap bulunamadi</h3>
                <p>Filtreleri degistirerek tekrar deneyin.</p>
            </div>

            <!-- Book Detail Page (replaces grid) -->
            <div class="detail-page" id="detailPage" style="display:none;"></div>

            <!-- Reports View -->
            <div class="reports-view" id="reportsView" style="display:none;"></div>

            <!-- Admin View -->
            <div class="admin-view" id="adminView" style="display:none;"></div>

            <!-- Criteria View -->
            <div class="criteria-view" id="criteriaView" style="display:none;"></div>

            <!-- E-İçerik Tablosu View -->
            <div class="eicerik-tablosu-view" id="eicerikTablosuView" style="display:none;"></div>

            <!-- Görevlerim View -->
            <div class="gorevler-view" id="gorevlerView" style="display:none;"></div>
        </div>
    </main>
</div>

<div class="loading-overlay" id="loadingOverlay">
    <div class="spinner"></div>
</div>

<?php get_footer(); ?>
