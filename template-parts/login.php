<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Giriş — E-Takip</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'DM Sans', -apple-system, sans-serif;
            background: #0c1222;
            min-height: 100vh;
            display: flex; align-items: center; justify-content: center;
            position: relative; overflow: hidden;
        }
        /* Background pattern */
        body::before {
            content: '';
            position: absolute; inset: 0;
            background:
                radial-gradient(ellipse at 20% 50%, rgba(79,70,229,.12) 0%, transparent 50%),
                radial-gradient(ellipse at 80% 20%, rgba(59,130,246,.08) 0%, transparent 50%),
                radial-gradient(ellipse at 50% 80%, rgba(139,92,246,.06) 0%, transparent 50%);
            pointer-events: none;
        }
        /* Grid dots pattern */
        body::after {
            content: '';
            position: absolute; inset: 0;
            background-image: radial-gradient(rgba(255,255,255,.03) 1px, transparent 1px);
            background-size: 24px 24px;
            pointer-events: none;
        }
        .login-container {
            position: relative; z-index: 1;
            width: 100%; max-width: 420px;
            padding: 20px;
        }
        .login-card {
            background: #1a2332;
            border-radius: 16px;
            padding: 40px 36px;
            box-shadow: 0 20px 60px rgba(0,0,0,.3), 0 0 0 1px rgba(255,255,255,.04);
        }
        /* Logo + Branding */
        .login-brand {
            text-align: center;
            margin-bottom: 32px;
        }
        .login-logo-text {
            font-size: 32px; font-weight: 800;
            letter-spacing: -.03em;
            margin-bottom: 4px;
        }
        .login-logo-text .lt-edop { color: #f1f5f9; }
        .login-logo-text .lt-dijital { color: #6366f1; }
        .login-title {
            font-size: 18px; font-weight: 700;
            color: #94a3b8;
            letter-spacing: -.01em;
        }
        .login-subtitle {
            font-size: 13px;
            color: #475569;
            margin-top: 4px;
        }
        .login-version {
            display: inline-block;
            font-size: 10px; font-weight: 600;
            color: #6366f1;
            background: rgba(99,102,241,.12);
            padding: 1px 7px;
            border-radius: 5px;
            margin-top: 6px;
        }
        /* Form */
        .login-field {
            margin-bottom: 18px;
        }
        .login-label {
            display: block;
            font-size: 12px; font-weight: 600;
            color: #94a3b8;
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: .04em;
        }
        .login-input-wrap {
            position: relative;
        }
        .login-input-icon {
            position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
            color: #475569; pointer-events: none;
        }
        .login-input {
            width: 100%;
            padding: 12px 14px 12px 44px;
            background: #0f172a;
            border: 1px solid #2a3548;
            border-radius: 10px;
            color: #f1f5f9;
            font-family: inherit;
            font-size: 14px;
            outline: none;
            transition: border-color .2s, box-shadow .2s;
        }
        .login-input::placeholder { color: #475569; }
        .login-input:focus {
            border-color: #4f46e5;
            box-shadow: 0 0 0 3px rgba(79,70,229,.15);
        }
        /* Password toggle */
        .login-pw-toggle {
            position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
            background: none; border: none;
            color: #475569; cursor: pointer;
            padding: 4px;
            transition: color .15s;
        }
        .login-pw-toggle:hover { color: #94a3b8; }
        /* Remember + Forgot */
        .login-options {
            display: flex; align-items: center; justify-content: space-between;
            margin-bottom: 24px;
        }
        .login-remember {
            display: flex; align-items: center; gap: 6px;
            font-size: 13px; color: #94a3b8;
            cursor: pointer;
        }
        .login-remember input {
            accent-color: #4f46e5;
            width: 15px; height: 15px;
            cursor: pointer;
        }
        .login-forgot {
            font-size: 12px; color: #6366f1;
            text-decoration: none; font-weight: 500;
            transition: color .15s;
        }
        .login-forgot:hover { color: #818cf8; }
        /* Submit */
        .login-btn {
            width: 100%;
            padding: 13px;
            background: linear-gradient(135deg, #4f46e5, #6366f1);
            color: #fff;
            border: none; border-radius: 10px;
            font-family: inherit;
            font-size: 14px; font-weight: 700;
            cursor: pointer;
            transition: all .2s;
            letter-spacing: .01em;
        }
        .login-btn:hover {
            background: linear-gradient(135deg, #4338ca, #4f46e5);
            box-shadow: 0 4px 16px rgba(79,70,229,.3);
            transform: translateY(-1px);
        }
        .login-btn:active { transform: translateY(0); }
        .login-btn:disabled {
            opacity: .6; cursor: wait;
            transform: none !important;
        }
        /* Error */
        .login-error {
            background: rgba(239,68,68,.1);
            border: 1px solid rgba(239,68,68,.2);
            color: #fca5a5;
            font-size: 13px;
            padding: 10px 14px;
            border-radius: 8px;
            margin-bottom: 18px;
            display: none;
        }
        .login-error.show { display: block; }
        .login-success {
            background: rgba(34,197,94,.1);
            border: 1px solid rgba(34,197,94,.2);
            color: #86efac;
            font-size: 13px;
            padding: 10px 14px;
            border-radius: 8px;
            margin-bottom: 18px;
            display: none;
        }
        .login-success.show { display: block; }
        .login-hint {
            font-size: 12px; color: #64748b;
            margin-bottom: 18px; line-height: 1.5;
        }
        .login-btn-reset {
            background: linear-gradient(135deg, #0ea5e9, #06b6d4);
        }
        .login-btn-reset:hover {
            background: linear-gradient(135deg, #0284c7, #0891b2);
            box-shadow: 0 4px 16px rgba(14,165,233,.3);
        }
        .login-back-wrap { text-align: center; margin-top: 16px; }
        .login-back {
            font-size: 13px; color: #6366f1;
            text-decoration: none; font-weight: 500;
            transition: color .15s;
        }
        .login-back:hover { color: #818cf8; }
        /* Footer */
        .login-footer {
            text-align: center;
            margin-top: 24px;
            font-size: 11px;
            color: #475569;
        }
        /* Responsive */
        @media (max-width: 480px) {
            .login-card { padding: 32px 24px; }
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="login-card">
            <div class="login-brand">
                <div class="login-logo-text"><span class="lt-edop">EDOP</span> <span class="lt-dijital">Dijital</span></div>
                <div class="login-title">E-Takip</div>
                <div class="login-subtitle">Dijital İçerik Yönetim Sistemi</div>
                <span class="login-version">v2.6</span>
            </div>

            <div class="login-error" id="loginError"></div>
            <div class="login-success" id="loginSuccess"></div>

            <!-- Giriş Formu -->
            <form id="loginForm" method="post" autocomplete="on">
                <?php wp_nonce_field('eit_login_nonce', 'eit_login_nonce'); ?>
                <div class="login-field">
                    <label class="login-label" for="loginUser">Kullanıcı Adı veya E-posta</label>
                    <div class="login-input-wrap">
                        <svg class="login-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        <input class="login-input" id="loginUser" name="log" type="text" placeholder="kullanici@email.com" required autofocus autocomplete="username">
                    </div>
                </div>
                <div class="login-field">
                    <label class="login-label" for="loginPass">Şifre</label>
                    <div class="login-input-wrap">
                        <svg class="login-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        <input class="login-input" id="loginPass" name="pwd" type="password" placeholder="••••••••" required autocomplete="current-password">
                        <button type="button" class="login-pw-toggle" id="pwToggle" tabindex="-1">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                    </div>
                </div>
                <div class="login-options">
                    <label class="login-remember">
                        <input type="checkbox" name="rememberme" value="forever">
                        Beni hatırla
                    </label>
                    <a class="login-forgot" href="#" id="showLostPw">Şifremi unuttum</a>
                </div>
                <button type="submit" class="login-btn" id="loginBtn">Giriş Yap</button>
            </form>

            <!-- Şifremi Unuttum Formu -->
            <form id="lostPwForm" method="post" style="display:none">
                <?php wp_nonce_field('eit_login_nonce', 'eit_login_nonce'); ?>
                <div class="login-field">
                    <label class="login-label" for="lostPwUser">Kullanıcı Adı veya E-posta</label>
                    <div class="login-input-wrap">
                        <svg class="login-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                        <input class="login-input" id="lostPwUser" name="user_login" type="text" placeholder="kullanici@email.com" required>
                    </div>
                </div>
                <p class="login-hint">Hesabınıza bağlı e-posta adresinize şifre sıfırlama bağlantısı gönderilecektir.</p>
                <button type="submit" class="login-btn login-btn-reset" id="lostPwBtn">Sıfırlama Bağlantısı Gönder</button>
                <div class="login-back-wrap">
                    <a class="login-back" href="#" id="showLogin">&larr; Giriş ekranına dön</a>
                </div>
            </form>

            <div class="login-footer">
                EDOP &copy; <?php echo date('Y'); ?> &middot; Dijital İçerik Takip
            </div>
        </div>
    </div>

    <script>
    (function () {
        var ajaxUrl = '<?php echo esc_url(admin_url("admin-ajax.php")); ?>';
        var homeUrl = '<?php echo esc_url(home_url("/")); ?>';

        var loginForm = document.getElementById('loginForm');
        var lostPwForm = document.getElementById('lostPwForm');
        var loginBtn = document.getElementById('loginBtn');
        var lostPwBtn = document.getElementById('lostPwBtn');
        var errBox = document.getElementById('loginError');
        var successBox = document.getElementById('loginSuccess');
        var pwToggle = document.getElementById('pwToggle');
        var pwInput = document.getElementById('loginPass');

        function hideMessages() { errBox.classList.remove('show'); successBox.classList.remove('show'); }
        function showError(msg) { hideMessages(); errBox.textContent = msg; errBox.classList.add('show'); }
        function showSuccess(msg) { hideMessages(); successBox.textContent = msg; successBox.classList.add('show'); }

        // Mode switch
        document.getElementById('showLostPw').addEventListener('click', function (e) {
            e.preventDefault(); hideMessages();
            loginForm.style.display = 'none';
            lostPwForm.style.display = '';
            document.getElementById('lostPwUser').focus();
        });
        document.getElementById('showLogin').addEventListener('click', function (e) {
            e.preventDefault(); hideMessages();
            lostPwForm.style.display = 'none';
            loginForm.style.display = '';
            document.getElementById('loginUser').focus();
        });

        // URL param check
        if (window.location.search.indexOf('mode=lostpassword') > -1) {
            loginForm.style.display = 'none';
            lostPwForm.style.display = '';
        }

        // Password toggle
        pwToggle.addEventListener('click', function () {
            var isPass = pwInput.type === 'password';
            pwInput.type = isPass ? 'text' : 'password';
            this.innerHTML = isPass
                ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'
                : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
        });

        // Login submit
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault(); hideMessages();
            loginBtn.disabled = true;
            loginBtn.textContent = 'Giri\u015f yap\u0131l\u0131yor...';
            var fd = new FormData(loginForm);
            fd.append('action', 'eit_ajax_login');
            fetch(ajaxUrl, { method: 'POST', body: fd })
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (res.success) {
                    loginBtn.textContent = 'Y\u00f6nlendiriliyor...';
                    window.location.href = res.data.redirect || homeUrl;
                } else {
                    showError(res.data || 'Giri\u015f ba\u015far\u0131s\u0131z');
                    loginBtn.disabled = false;
                    loginBtn.textContent = 'Giri\u015f Yap';
                }
            })
            .catch(function () {
                showError('Ba\u011flant\u0131 hatas\u0131. Tekrar deneyin.');
                loginBtn.disabled = false;
                loginBtn.textContent = 'Giri\u015f Yap';
            });
        });

        // Lost password submit
        lostPwForm.addEventListener('submit', function (e) {
            e.preventDefault(); hideMessages();
            lostPwBtn.disabled = true;
            lostPwBtn.textContent = 'G\u00f6nderiliyor...';
            var fd = new FormData(lostPwForm);
            fd.append('action', 'eit_ajax_lostpassword');
            fetch(ajaxUrl, { method: 'POST', body: fd })
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (res.success) {
                    showSuccess(res.data);
                    lostPwBtn.textContent = 'G\u00f6nderildi \u2713';
                } else {
                    showError(res.data || 'Hata olu\u015ftu');
                    lostPwBtn.disabled = false;
                    lostPwBtn.textContent = 'S\u0131f\u0131rlama Ba\u011flant\u0131s\u0131 G\u00f6nder';
                }
            })
            .catch(function () {
                showError('Ba\u011flant\u0131 hatas\u0131. Tekrar deneyin.');
                lostPwBtn.disabled = false;
                lostPwBtn.textContent = 'S\u0131f\u0131rlama Ba\u011flant\u0131s\u0131 G\u00f6nder';
            });
        });
    })();
    </script>
</body>
</html>
