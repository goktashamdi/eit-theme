<?php
/**
 * EIT Dashboard Theme Functions
 */

defined('ABSPATH') || exit;

/* ========== THEME SETUP ========== */
function eit_theme_setup() {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('html5', ['search-form', 'gallery', 'caption']);
}
add_action('after_setup_theme', 'eit_theme_setup');

/* ========== CUSTOM ROLES ========== */
function eit_register_roles() {
    // Only run once per version
    if (get_option('eit_roles_version') === '7') return;

    remove_role('eit_editor');
    remove_role('eit_specialist');
    remove_role('eit_reviewer');
    remove_role('eit_viewer');

    // Editör: kitap düzenler, görev atar, aşama değiştirir
    add_role('eit_editor', 'E-İçerik Editörü', [
        'read'         => true,
        'eit_edit'     => true,
        'eit_assign'   => true,
        'eit_view'     => true,
    ]);

    // E-İçerik Geliştirme Uzmanı: görev alır, üretim yapar, tamamlar
    add_role('eit_specialist', 'E-İçerik Uzmanı', [
        'read'         => true,
        'eit_view'     => true,
        'eit_gorev'    => true,
    ]);

    // İnceleyici: kontrol eder, not ekler, görüntüler
    add_role('eit_reviewer', 'İnceleyici', [
        'read'         => true,
        'eit_view'     => true,
    ]);

    // Görüntüleyici: sadece okuma
    add_role('eit_viewer', 'Görüntüleyici', [
        'read'         => true,
        'eit_view'     => true,
    ]);

    // Yönetici: her şey
    $admin = get_role('administrator');
    if ($admin) {
        $admin->add_cap('eit_manage');
        $admin->add_cap('eit_edit');
        $admin->add_cap('eit_assign');
        $admin->add_cap('eit_view');
        $admin->add_cap('eit_gorev');
    }

    update_option('eit_roles_version', '7');
}
add_action('init', 'eit_register_roles');

/* ========== CUSTOM LOGIN PAGE ========== */
function eit_require_login() {
    if (!is_user_logged_in() && !is_admin()) {
        // LiteSpeed Cache: bu istek icin tum ozellikleri (page cache, JS/CSS combine,
        // defer, image opt) devre disi birak — login formunu bozmasinlar
        if (!defined('LITESPEED_DISABLE_ALL')) define('LITESPEED_DISABLE_ALL', true);
        // WP Rocket / W3TC / generic cache plugin'leri
        if (!defined('DONOTCACHEPAGE'))   define('DONOTCACHEPAGE', true);
        if (!defined('DONOTCACHEOBJECT')) define('DONOTCACHEOBJECT', true);
        if (!defined('DONOTCACHEDB'))     define('DONOTCACHEDB', true);
        // LSCWP filter hook'lari (constant'a ek savunma katmani)
        do_action('litespeed_control_set_nocache', 'EIT login page');
        do_action('litespeed_optimize_no_combine');
        nocache_headers();
        include get_template_directory() . '/template-parts/login.php';
        exit;
    }
}
add_action('template_redirect', 'eit_require_login');

// Redirect wp-login.php to our custom login
add_action('login_init', function () {
    $action = isset($_REQUEST['action']) ? $_REQUEST['action'] : 'login';
    // Allow logout, rp (reset password with key), postpass
    if (in_array($action, ['logout', 'resetpass', 'rp', 'postpass', 'register'])) return;
    // Lostpassword -> our page with mode param
    if (in_array($action, ['lostpassword', 'retrievepassword'])) {
        wp_redirect(home_url('/?mode=lostpassword')); exit;
    }
    // If already logged in, go home
    if (is_user_logged_in()) { wp_redirect(home_url('/')); exit; }
    // Redirect to home (which shows our custom login)
    wp_redirect(home_url('/'));
    exit;
});

// AJAX login handler
add_action('wp_ajax_nopriv_eit_ajax_login', 'eit_handle_ajax_login');
function eit_handle_ajax_login() {
    // Nonce graceful fail — cache plugin'i sayfayi cache'lediyse nonce stale olabilir
    if (!check_ajax_referer('eit_login_nonce', 'eit_login_nonce', false)) {
        wp_send_json_error('Oturum süresi doldu. Lütfen sayfayı yenileyip tekrar deneyin.');
    }

    $creds = [
        'user_login'    => sanitize_text_field($_POST['log'] ?? ''),
        'user_password' => $_POST['pwd'] ?? '',
        'remember'      => !empty($_POST['rememberme']),
    ];

    if (empty($creds['user_login']) || empty($creds['user_password'])) {
        wp_send_json_error('Kullanıcı adı ve şifre gerekli.');
    }

    $user = wp_signon($creds, is_ssl());

    if (is_wp_error($user)) {
        $code = $user->get_error_code();
        $msg  = wp_strip_all_tags($user->get_error_message());
        if ($code === 'invalid_username' || $code === 'invalid_email') {
            wp_send_json_error('Kullanıcı bulunamadı.');
        } elseif ($code === 'incorrect_password') {
            wp_send_json_error('Şifre hatalı.');
        } elseif ($code === 'empty_username' || $code === 'empty_password') {
            wp_send_json_error('Kullanıcı adı ve şifre gerekli.');
        } elseif ($code === 'too_many_retries' || $code === 'too_many_attempts') {
            wp_send_json_error('Çok fazla deneme. Lütfen birkaç dakika sonra tekrar deneyin.');
        } else {
            // Tum diger hatalar icin WP'nin gercek mesajini goster (debug icin)
            error_log('[EIT login] code=' . $code . ' msg=' . $msg);
            wp_send_json_error($msg ?: 'Giriş başarısız (' . $code . ')');
        }
    }

    wp_send_json_success(['redirect' => home_url('/')]);
}

// AJAX lost password handler
add_action('wp_ajax_nopriv_eit_ajax_lostpassword', 'eit_handle_ajax_lostpassword');
function eit_handle_ajax_lostpassword() {
    if (!check_ajax_referer('eit_login_nonce', 'eit_login_nonce', false)) {
        wp_send_json_error('Oturum süresi doldu. Lütfen sayfayı yenileyip tekrar deneyin.');
    }

    $user_login = sanitize_text_field($_POST['user_login'] ?? '');
    if (empty($user_login)) wp_send_json_error('Kullanıcı adı veya e-posta gerekli.');

    // Find user
    if (is_email($user_login)) {
        $user = get_user_by('email', $user_login);
    } else {
        $user = get_user_by('login', $user_login);
    }
    if (!$user) wp_send_json_error('Bu bilgilere ait bir hesap bulunamadı.');

    // Generate reset key and send mail
    $result = retrieve_password($user->user_login);
    if (is_wp_error($result)) {
        wp_send_json_error('E-posta gönderilemedi. Lütfen tekrar deneyin.');
    }

    wp_send_json_success('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.');
}

/* ========== GET CURRENT USER ROLE INFO ========== */
function eit_get_user_role() {
    $user = wp_get_current_user();
    if (!$user->ID) return 'viewer';

    if (in_array('administrator', $user->roles)) return 'admin';
    if (in_array('eit_editor', $user->roles))     return 'editor';
    if (in_array('eit_specialist', $user->roles)) return 'specialist';
    if (in_array('eit_reviewer', $user->roles))   return 'reviewer';
    if (in_array('eit_viewer', $user->roles))      return 'viewer';

    // Fallback: WP editor/author -> eit editor
    if (in_array('editor', $user->roles) || in_array('author', $user->roles)) return 'editor';

    return 'viewer';
}

/* ========== ENQUEUE ASSETS ========== */
function eit_enqueue_assets() {
    wp_enqueue_style('google-fonts-inter',
        'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
        [], null
    );

    $v = '20260407g';
    wp_enqueue_style('eit-style', get_stylesheet_uri(), ['google-fonts-inter'], $v);
    wp_enqueue_script('eit-dashboard', get_template_directory_uri() . '/assets/js/dashboard.js', [], $v, true);
    wp_enqueue_script('eit-admin-panel', get_template_directory_uri() . '/assets/js/admin-panel.js', ['eit-dashboard'], $v, true);
    wp_enqueue_script('eit-book-detail', get_template_directory_uri() . '/assets/js/book-detail.js', ['eit-dashboard', 'eit-eicerik-tablosu'], $v, true);

    // Görevlerim
    wp_enqueue_script('eit-gorevler', get_template_directory_uri() . '/assets/js/gorevler.js', ['eit-dashboard'], $v, true);

    // PDF libraries (loaded but deferred) with SRI integrity
    wp_enqueue_script('jspdf', 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', [], '2.5.1', true);
    wp_enqueue_script('jspdf-autotable', 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js', ['jspdf'], '3.8.2', true);

    // Add crossorigin attribute for CDN scripts
    add_filter('script_loader_tag', function ($tag, $handle) {
        $cdn_scripts = ['jspdf', 'jspdf-autotable'];
        if (in_array($handle, $cdn_scripts) && strpos($tag, 'crossorigin') === false) {
            $tag = str_replace(' src=', ' crossorigin="anonymous" src=', $tag);
        }
        return $tag;
    }, 10, 2);

    // Reports (font lazy-loaded on first PDF export)
    wp_enqueue_script('eit-reports', get_template_directory_uri() . '/assets/js/reports.js', ['eit-dashboard', 'jspdf', 'jspdf-autotable'], '1.2', true);
    wp_localize_script('eit-reports', 'eitPdfConfig', [
        'fontUrl' => get_template_directory_uri() . '/assets/js/roboto-font.js',
    ]);

    // Criteria
    wp_enqueue_script('eit-criteria', get_template_directory_uri() . '/assets/js/criteria.js', ['eit-dashboard'], $v, true);

    // E-İçerik Tablosu — sadece yetkili kullanıcılara yükle
    if (current_user_can('eit_edit') || current_user_can('eit_manage')) {
        wp_enqueue_script('eit-eicerik-tablosu', get_template_directory_uri() . '/assets/js/eicerik-tablosu.js', ['eit-dashboard'], $v, true);
        $eicerik_saved = get_option('eit_eicerik_data');
        if ($eicerik_saved) {
            $eicerik_data = json_decode($eicerik_saved, true);
        } else {
            $eicerik_file = get_template_directory() . '/assets/data/eicerik-tablosu.json';
            $eicerik_data = file_exists($eicerik_file) ? json_decode(file_get_contents($eicerik_file), true) : [];
            if (is_array($eicerik_data) && count($eicerik_data) > 0) {
                update_option('eit_eicerik_data', wp_json_encode($eicerik_data), false);
            } else {
                // Bos deger kaydet — retry loop'u onle
                update_option('eit_eicerik_data', '[]', false);
            }
        }
        $eicerik_json = wp_json_encode(is_array($eicerik_data) ? $eicerik_data : []);
        wp_add_inline_script('eit-eicerik-tablosu', 'window.eitEicerikTablosu=' . $eicerik_json . ';', 'before');
    }

    $user = wp_get_current_user();

    wp_localize_script('eit-dashboard', 'eitAjax', [
        'url'   => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('eit_nonce'),
    ]);

    wp_localize_script('eit-dashboard', 'eitUser', [
        'id'       => $user->ID,
        'name'     => $user->display_name,
        'email'    => $user->user_email,
        'role'     => eit_get_user_role(),
        'avatar'   => get_avatar_url($user->ID, ['size' => 64]),
        'logoutUrl'=> wp_logout_url(home_url()),
    ]);

    wp_localize_script('eit-dashboard', 'eitUserCaps', [
        'eit_manage' => current_user_can('eit_manage'),
        'eit_edit'   => current_user_can('eit_edit'),
        'eit_gorev'  => current_user_can('eit_gorev'),
    ]);

    // WP capability bazli yetki esleme
    // Rol bazli varsayilan + kullanici bazli override (eit_perm_* cap'leri)
    $perm_keys = [
        // Sayfa Erisimi
        'gorevlerim', 'raporlar', 'kriterler',
        // Kitap Islemleri
        'kitap_ekle_sil', 'kitap_duzenle', 'kitap_durum',
        // E-Icerik Islemleri
        'asama_degistir', 'gorev_ata', 'not_ekle', 'toplu_islem',
        // Yonetim
        'yonetim', 'kullanici_yonet', 'eicerik_tablosu',
    ];
    // Rol bazli varsayilanlar
    $role_defaults = [
        'gorevlerim'      => current_user_can('eit_view'),
        'raporlar'        => current_user_can('eit_edit'),
        'kriterler'       => current_user_can('eit_edit'),
        'kitap_ekle_sil'  => current_user_can('eit_manage'),
        'kitap_duzenle'   => current_user_can('eit_edit'),
        'kitap_durum'     => current_user_can('eit_edit'),
        'asama_degistir'  => current_user_can('eit_edit'),
        'gorev_ata'       => current_user_can('eit_assign'),
        'not_ekle'        => current_user_can('eit_view'),
        'toplu_islem'     => current_user_can('eit_edit'),
        'yonetim'         => current_user_can('eit_manage'),
        'kullanici_yonet' => current_user_can('eit_manage'),
        'eicerik_tablosu' => current_user_can('eit_edit'),
    ];
    // Kullanici bazli override: eit_perm_X cap varsa true yap
    $my_perms = [];
    foreach ($perm_keys as $pk) {
        $my_perms[$pk] = $role_defaults[$pk] || current_user_can('eit_perm_' . $pk);
    }
    wp_localize_script('eit-dashboard', 'eitMyPerms', $my_perms);

    // Role permissions matrix (admin paneldeki matris UI icin)
    $all_true = array_fill_keys($perm_keys, true);
    $all_false = array_fill_keys($perm_keys, false);
    $default_perms = [
        'admin'      => $all_true,
        'editor'     => array_merge($all_false, [
            'gorevlerim' => true, 'raporlar' => true, 'kriterler' => true,
            'kitap_duzenle' => true, 'kitap_durum' => true,
            'asama_degistir' => true, 'gorev_ata' => true, 'not_ekle' => true, 'toplu_islem' => true,
            'eicerik_tablosu' => true,
        ]),
        'specialist' => array_merge($all_false, [
            'gorevlerim' => true, 'not_ekle' => true,
        ]),
        'reviewer'   => array_merge($all_false, [
            'gorevlerim' => true, 'raporlar' => true, 'kriterler' => true, 'not_ekle' => true,
        ]),
        'viewer'     => $all_false,
    ];
    $saved_perms = get_option('eit_role_permissions');
    $role_perms = $saved_perms ? json_decode($saved_perms, true) : $default_perms;
    if (!is_array($role_perms)) $role_perms = $default_perms;
    foreach ($default_perms as $role => $perms) {
        if (!isset($role_perms[$role])) $role_perms[$role] = $perms;
        foreach ($perms as $k => $v) {
            if (!isset($role_perms[$role][$k])) $role_perms[$role][$k] = $v;
        }
    }
    wp_localize_script('eit-dashboard', 'eitRolePerms', $role_perms);

    // WP Users list for gorev assignment
    $eit_users = get_users([
        'role__in' => ['administrator', 'eit_editor', 'eit_specialist', 'eit_reviewer', 'eit_viewer', 'editor', 'author'],
        'orderby'  => 'display_name',
    ]);
    $eit_users_list = [];
    foreach ($eit_users as $eu) {
        $erole = 'viewer';
        if (in_array('administrator', $eu->roles)) $erole = 'admin';
        elseif (in_array('eit_editor', $eu->roles)) $erole = 'editor';
        elseif (in_array('eit_specialist', $eu->roles)) $erole = 'specialist';
        elseif (in_array('eit_reviewer', $eu->roles)) $erole = 'reviewer';
        elseif (in_array('eit_viewer', $eu->roles)) $erole = 'viewer';

        // Kullanici bazli ekstra yetkiler
        $extras = [];
        foreach ([
            'gorevlerim', 'raporlar', 'kriterler',
            'kitap_ekle_sil', 'kitap_duzenle', 'kitap_durum',
            'asama_degistir', 'gorev_ata', 'not_ekle', 'toplu_islem',
            'yonetim', 'kullanici_yonet', 'eicerik_tablosu',
        ] as $pk) {
            if ($eu->has_cap('eit_perm_' . $pk)) $extras[] = $pk;
        }
        $eit_users_list[] = [
            'id'     => $eu->ID,
            'name'   => $eu->display_name,
            'role'   => $erole,
            'avatar' => get_avatar_url($eu->ID, ['size' => 32]),
            'extras' => $extras,
        ];
    }
    wp_localize_script('eit-dashboard', 'eitWpUsers', $eit_users_list);
}
add_action('wp_enqueue_scripts', 'eit_enqueue_assets');

/* ========== AJAX: NOTE IMAGE UPLOAD ========== */
add_action('wp_ajax_eit_upload_note_image', 'eit_ajax_upload_note_image');
function eit_ajax_upload_note_image() {
    check_ajax_referer('eit_nonce', 'nonce');
    if (!is_user_logged_in()) wp_send_json_error('Oturum gerekli');
    // 'file' veya 'image' field adi ile gelebilir
    $file = null;
    if (!empty($_FILES['file'])) $file = $_FILES['file'];
    elseif (!empty($_FILES['image'])) $file = $_FILES['image'];
    if (!$file) wp_send_json_error('Dosya yok');

    require_once ABSPATH . 'wp-admin/includes/file.php';
    require_once ABSPATH . 'wp-admin/includes/image.php';
    require_once ABSPATH . 'wp-admin/includes/media.php';
    $max_mb = intval($_POST['maxMB'] ?? 5);
    if ($max_mb < 1 || $max_mb > 20) $max_mb = 5;
    if ($file['size'] > $max_mb * 1024 * 1024) wp_send_json_error('Dosya ' . $max_mb . 'MB\'dan büyük olamaz');

    $allowed_mimes = [
        'jpg|jpeg|jpe' => 'image/jpeg',
        'png'          => 'image/png',
        'webp'         => 'image/webp',
        'gif'          => 'image/gif',
    ];
    $filetype = wp_check_filetype_and_ext($file['tmp_name'], $file['name'], $allowed_mimes);
    if (empty($filetype['type'])) wp_send_json_error('Sadece JPG, PNG, WebP, GIF yüklenebilir');

    $upload = wp_handle_upload($file, ['test_form' => false]);
    if (isset($upload['error'])) wp_send_json_error($upload['error']);

    wp_send_json_success(['url' => $upload['url']]);
}

/* ========== AJAX: SAVE ROLE PERMISSIONS ========== */
add_action('wp_ajax_eit_save_perms', 'eit_ajax_save_perms');
function eit_ajax_save_perms() {
    check_ajax_referer('eit_nonce', 'nonce');
    if (!current_user_can('eit_manage')) wp_send_json_error('Yetkiniz yok');

    $json = wp_unslash($_POST['perms'] ?? '');
    $perms = json_decode($json, true);
    if (!is_array($perms)) wp_send_json_error('Geçersiz veri');

    // Sanitize: only allow known roles and permission keys
    $valid_roles = ['admin', 'editor', 'specialist', 'reviewer', 'viewer'];
    $valid_perms = [
        'gorevlerim', 'raporlar', 'kriterler',
        'kitap_ekle_sil', 'kitap_duzenle', 'kitap_durum',
        'asama_degistir', 'gorev_ata', 'not_ekle', 'toplu_islem',
        'yonetim', 'kullanici_yonet', 'eicerik_tablosu',
    ];
    $clean = [];
    foreach ($valid_roles as $role) {
        $clean[$role] = [];
        foreach ($valid_perms as $perm) {
            $clean[$role][$perm] = !empty($perms[$role][$perm]);
        }
    }
    // Admin always all true
    foreach ($valid_perms as $perm) { $clean['admin'][$perm] = true; }

    update_option('eit_role_permissions', wp_json_encode($clean), false);

    // WP rollerinin capability'lerini senkronize et
    $role_cap_map = [
        'editor'     => 'eit_editor',
        'specialist' => 'eit_specialist',
        'reviewer'   => 'eit_reviewer',
        'viewer'     => 'eit_viewer',
    ];
    // Hangi perm hangi WP cap'e karsilik geliyor
    $perm_to_cap = [
        'kitap_duzenle'  => 'eit_edit',
        'asama_degistir' => 'eit_edit',
        'gorev_ata'      => 'eit_assign',
        'gorevlerim'     => 'eit_gorev',
    ];
    foreach ($role_cap_map as $eit_role => $wp_role_slug) {
        $wp_role = get_role($wp_role_slug);
        if (!$wp_role) continue;
        foreach ($perm_to_cap as $perm_key => $cap) {
            $has = !empty($clean[$eit_role][$perm_key]);
            if ($has) $wp_role->add_cap($cap);
            else $wp_role->remove_cap($cap);
        }
    }

    wp_send_json_success();
}

/* ========== AJAX: E-ICERIK TABLOSU SAVE ========== */
add_action('wp_ajax_eit_save_eicerik', 'eit_ajax_save_eicerik');
function eit_ajax_save_eicerik() {
    check_ajax_referer('eit_nonce', 'nonce');
    if (!current_user_can('eit_manage')) wp_send_json_error('Yetkiniz yok');

    $json = isset($_POST['json']) ? wp_unslash($_POST['json']) : '';
    $data = json_decode($json, true);
    if (!is_array($data)) wp_send_json_error('Geçersiz JSON formatı');

    $clean = [];
    foreach ($data as $row) {
        if (!is_array($row)) continue;
        $clean[] = [
            'sira'     => sanitize_text_field($row['sira'] ?? ''),
            'ders'     => sanitize_text_field($row['ders'] ?? ''),
            'unite'    => sanitize_text_field($row['unite'] ?? ''),
            'kazanim'  => sanitize_textarea_field($row['kazanim'] ?? ''),
            'tur'      => sanitize_text_field($row['tur'] ?? ''),
            'aciklama' => sanitize_textarea_field($row['aciklama'] ?? ''),
        ];
    }

    update_option('eit_eicerik_data', wp_json_encode($clean), false);
    wp_send_json_success(['count' => count($clean)]);
}

/* ========== AJAX: LIST USERS ========== */
add_action('wp_ajax_eit_list_users', 'eit_ajax_list_users');
function eit_ajax_list_users() {
    check_ajax_referer('eit_nonce', 'nonce');

    if (!current_user_can('eit_manage')) {
        wp_send_json_error('Yetkiniz yok');
    }

    $users = get_users([
        'role__in' => ['administrator', 'eit_editor', 'eit_specialist', 'eit_reviewer', 'eit_viewer', 'editor', 'author'],
        'orderby'  => 'display_name',
    ]);

    $list = [];
    foreach ($users as $u) {
        $role = 'viewer';
        if (in_array('administrator', $u->roles)) $role = 'admin';
        elseif (in_array('eit_editor', $u->roles)) $role = 'editor';
        elseif (in_array('eit_specialist', $u->roles)) $role = 'specialist';
        elseif (in_array('eit_reviewer', $u->roles)) $role = 'reviewer';
        elseif (in_array('eit_viewer', $u->roles)) $role = 'viewer';
        elseif (in_array('editor', $u->roles)) $role = 'editor';

        $extras = [];
        foreach ([
            'gorevlerim', 'raporlar', 'kriterler',
            'kitap_ekle_sil', 'kitap_duzenle', 'kitap_durum',
            'asama_degistir', 'gorev_ata', 'not_ekle', 'toplu_islem',
            'yonetim', 'kullanici_yonet', 'eicerik_tablosu',
        ] as $pk) {
            if ($u->has_cap('eit_perm_' . $pk)) $extras[] = $pk;
        }
        $list[] = [
            'id'     => $u->ID,
            'name'   => $u->display_name,
            'email'  => $u->user_email,
            'role'   => $role,
            'avatar' => get_avatar_url($u->ID, ['size' => 64]),
            'extras' => $extras,
        ];
    }

    wp_send_json_success($list);
}

/* ========== AJAX: ADD USER ========== */
add_action('wp_ajax_eit_add_user', 'eit_ajax_add_user');
function eit_ajax_add_user() {
    check_ajax_referer('eit_nonce', 'nonce');

    if (!current_user_can('eit_manage')) {
        wp_send_json_error('Yetkiniz yok');
    }

    $name  = sanitize_text_field($_POST['name'] ?? '');
    $email = sanitize_email($_POST['email'] ?? '');
    $role  = sanitize_text_field($_POST['role'] ?? 'eit_viewer');
    $pass  = $_POST['password'] ?? '';

    if (!$name || !$email) {
        wp_send_json_error('Ad ve e-posta zorunlu');
    }

    $valid_roles = ['eit_editor', 'eit_specialist', 'eit_reviewer', 'eit_viewer'];
    if (!in_array($role, $valid_roles)) $role = 'eit_viewer';

    // Generate username from email
    $username = strstr($email, '@', true);
    $username = sanitize_user($username, true);
    if (username_exists($username)) {
        $username .= '_' . wp_rand(100, 999);
    }

    if (!$pass) {
        $pass = wp_generate_password(12);
    }

    $user_id = wp_insert_user([
        'user_login'   => $username,
        'user_email'   => $email,
        'user_pass'    => $pass,
        'display_name' => $name,
        'role'         => $role,
    ]);

    if (is_wp_error($user_id)) {
        wp_send_json_error($user_id->get_error_message());
    }

    // Send password reset link instead of exposing password
    $reset_key = get_password_reset_key(get_userdata($user_id));
    $reset_url = '';
    if (!is_wp_error($reset_key)) {
        $reset_url = network_site_url("wp-login.php?action=rp&key=$reset_key&login=" . rawurlencode($username), 'login');
    }

    wp_send_json_success([
        'id'       => $user_id,
        'username' => $username,
        'resetUrl' => $reset_url,
    ]);
}

/* ========== AJAX: DELETE USER ========== */
add_action('wp_ajax_eit_delete_user', 'eit_ajax_delete_user');
function eit_ajax_delete_user() {
    check_ajax_referer('eit_nonce', 'nonce');

    if (!current_user_can('eit_manage')) {
        wp_send_json_error('Yetkiniz yok');
    }

    $user_id = intval($_POST['user_id'] ?? 0);
    if (!$user_id || $user_id === get_current_user_id()) {
        wp_send_json_error('Kendinizi silemezsiniz');
    }

    $target = get_userdata($user_id);
    if (!$target || in_array('administrator', $target->roles)) {
        wp_send_json_error('Bu kullanıcı silinemez');
    }

    require_once ABSPATH . 'wp-admin/includes/user.php';
    wp_delete_user($user_id);

    wp_send_json_success();
}

/* ========== AJAX: CHANGE USER ROLE ========== */
add_action('wp_ajax_eit_change_role', 'eit_ajax_change_role');
function eit_ajax_change_role() {
    check_ajax_referer('eit_nonce', 'nonce');

    if (!current_user_can('eit_manage')) {
        wp_send_json_error('Yetkiniz yok');
    }

    $user_id = intval($_POST['user_id'] ?? 0);
    $role    = sanitize_text_field($_POST['role'] ?? '');

    $valid_roles = ['eit_editor', 'eit_specialist', 'eit_reviewer', 'eit_viewer'];
    if (!$user_id || !in_array($role, $valid_roles)) {
        wp_send_json_error('Geçersiz parametreler');
    }

    $user = get_userdata($user_id);
    if (!$user || in_array('administrator', $user->roles)) {
        wp_send_json_error('Bu kullanıcının rolü değiştirilemez');
    }

    $user->set_role($role);
    wp_send_json_success();
}

/* ========== AJAX: TOGGLE USER PERMISSION ========== */
add_action('wp_ajax_eit_toggle_user_perm', 'eit_ajax_toggle_user_perm');
function eit_ajax_toggle_user_perm() {
    check_ajax_referer('eit_nonce', 'nonce');
    if (!current_user_can('eit_manage')) wp_send_json_error('Yetkiniz yok');

    $user_id = intval($_POST['user_id'] ?? 0);
    $perm    = sanitize_text_field($_POST['perm'] ?? '');
    $enable  = isset($_POST['enable']) && $_POST['enable'] === '1';

    $valid_perms = [
        'gorevlerim', 'raporlar', 'kriterler',
        'kitap_ekle_sil', 'kitap_duzenle', 'kitap_durum',
        'asama_degistir', 'gorev_ata', 'not_ekle', 'toplu_islem',
        'yonetim', 'kullanici_yonet', 'eicerik_tablosu',
    ];
    if (!$user_id || !in_array($perm, $valid_perms)) {
        wp_send_json_error('Geçersiz parametreler');
    }

    $user = get_userdata($user_id);
    if (!$user) wp_send_json_error('Kullanıcı bulunamadı');

    $cap = 'eit_perm_' . $perm;
    if ($enable) {
        $user->add_cap($cap, true);
    } else {
        $user->remove_cap($cap);
    }
    wp_send_json_success();
}

/* ========== AJAX: GET USER EXTRA PERMS ========== */
add_action('wp_ajax_eit_get_user_perms', 'eit_ajax_get_user_perms');
function eit_ajax_get_user_perms() {
    check_ajax_referer('eit_nonce', 'nonce');
    if (!current_user_can('eit_manage')) wp_send_json_error('Yetkiniz yok');

    $user_id = intval($_POST['user_id'] ?? 0);
    $user = get_userdata($user_id);
    if (!$user) wp_send_json_error('Kullanıcı bulunamadı');

    $valid_perms = [
        'gorevlerim', 'raporlar', 'kriterler',
        'kitap_ekle_sil', 'kitap_duzenle', 'kitap_durum',
        'asama_degistir', 'gorev_ata', 'not_ekle', 'toplu_islem',
        'yonetim', 'kullanici_yonet', 'eicerik_tablosu',
    ];
    $extras = [];
    foreach ($valid_perms as $pk) {
        if ($user->has_cap('eit_perm_' . $pk)) $extras[$pk] = true;
    }
    wp_send_json_success($extras);
}

// Remove admin bar on frontend
add_filter('show_admin_bar', '__return_false');

// Keep WP login branding for lostpassword/reset forms
add_filter('login_headerurl', function () { return home_url(); });
add_filter('login_headertext', function () { return 'E-Takip'; });
add_action('login_enqueue_scripts', function () {
    echo '<style>
        body.login { background: #0c1222; font-family: "DM Sans", sans-serif; }
        .login h1 a { background-image: none !important; text-indent: 0 !important; font-size: 22px; font-weight: 700; color: #6366f1; width: auto !important; height: auto !important; }
        .login #loginform, .login #lostpasswordform, .login #resetpassform { background: #1a2332; border-radius: 12px; border: 1px solid #2a3548; box-shadow: 0 8px 32px rgba(0,0,0,.3); color: #f1f5f9; }
        .login label { color: #94a3b8 !important; }
        .login input[type="text"], .login input[type="password"], .login input[type="email"] { background: #0f172a !important; border-color: #2a3548 !important; color: #f1f5f9 !important; border-radius: 8px !important; }
        .login .button-primary { background: linear-gradient(135deg,#4f46e5,#6366f1) !important; border: none !important; border-radius: 8px !important; font-weight: 600 !important; }
        .login #nav, .login #backtoblog { text-align: center; }
        .login #nav a, .login #backtoblog a { color: #6366f1 !important; }
        .login .message { background: rgba(79,70,229,.1); border-left-color: #6366f1; color: #cbd5e1; }
    </style>';
});
