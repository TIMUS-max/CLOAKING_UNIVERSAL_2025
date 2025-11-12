// ═══════════════════════════════════════════════════════════════════
// MODULE GÉOBLOCAGE 2025
// ═══════════════════════════════════════════════════════════════════
//
// Ce module détecte le pays de l'utilisateur et bloque/autorise
// selon la configuration.
//
// Utilise 3 APIs gratuites en fallback pour garantir la détection.
//
// ═══════════════════════════════════════════════════════════════════

class GeoBlocker {
    constructor(config) {
        this.config = config;
        this.userCountry = null;
        this.userIP = null;
        this.detectionMethod = null;
    }

    // ═══════════════════════════════════════════════════════════════
    // 1. DÉTECTER LE PAYS VIA MULTIPLES APIs
    // ═══════════════════════════════════════════════════════════════

    async detectCountry() {
        // Essayer chaque API dans l'ordre
        for (let provider of this.config.GEO_API_PROVIDERS) {
            if (!provider.enabled) continue;

            try {
                const result = await this.tryProvider(provider);
                if (result && result.country) {
                    this.userCountry = result.country;
                    this.userIP = result.ip;
                    this.detectionMethod = provider.name;

                    if (this.config.DEBUG_MODE) {
                        console.log(`[GEO] Country detected: ${this.userCountry} via ${provider.name}`);
                        console.log(`[GEO] IP: ${this.userIP}`);
                    }

                    return result;
                }
            } catch (e) {
                if (this.config.DEBUG_MODE) {
                    console.warn(`[GEO] ${provider.name} failed:`, e.message);
                }
                continue;
            }
        }

        // Si toutes les APIs échouent, essayer détection timezone
        return this.detectCountryByTimezone();
    }

    // ═══════════════════════════════════════════════════════════════
    // 2. ESSAYER UN PROVIDER SPÉCIFIQUE
    // ═══════════════════════════════════════════════════════════════

    async tryProvider(provider) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000); // Timeout 5s

        try {
            const response = await fetch(provider.url, {
                signal: controller.signal,
                headers: { 'Accept': 'application/json' }
            });

            clearTimeout(timeout);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            // Normaliser la réponse selon le provider
            return this.normalizeResponse(provider.name, data);

        } catch (e) {
            clearTimeout(timeout);
            throw e;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // 3. NORMALISER LES RÉPONSES DES DIFFÉRENTES APIs
    // ═══════════════════════════════════════════════════════════════

    normalizeResponse(providerName, data) {
        switch (providerName) {
            case 'ipapi.co':
                return {
                    ip: data.ip,
                    country: data.country_code,
                    countryName: data.country_name,
                    city: data.city,
                    region: data.region
                };

            case 'ip-api.com':
                return {
                    ip: data.query,
                    country: data.countryCode,
                    countryName: data.country,
                    city: data.city,
                    region: data.regionName
                };

            case 'geojs.io':
                return {
                    ip: data.ip,
                    country: data.country_code,
                    countryName: data.country,
                    city: data.city,
                    region: data.region
                };

            default:
                return {
                    ip: data.ip || 'unknown',
                    country: data.country_code || data.countryCode || 'XX',
                    countryName: data.country_name || data.country || 'Unknown',
                    city: data.city || '',
                    region: data.region || ''
                };
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // 4. DÉTECTION FALLBACK PAR TIMEZONE
    // ═══════════════════════════════════════════════════════════════

    detectCountryByTimezone() {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        // Map timezone → pays (approximatif)
        const timezoneMap = {
            'America/New_York': 'US',
            'America/Chicago': 'US',
            'America/Los_Angeles': 'US',
            'America/Toronto': 'CA',
            'Europe/London': 'GB',
            'Europe/Paris': 'FR',
            'Europe/Berlin': 'DE',
            'Europe/Amsterdam': 'NL',
            'Europe/Brussels': 'BE',
            'Europe/Zurich': 'CH',
            'Europe/Rome': 'IT',
            'Europe/Madrid': 'ES',
            'Australia/Sydney': 'AU'
        };

        const country = timezoneMap[timezone] || 'XX';

        if (this.config.DEBUG_MODE) {
            console.log(`[GEO] Fallback timezone detection: ${timezone} → ${country}`);
        }

        this.userCountry = country;
        this.detectionMethod = 'timezone_fallback';

        return {
            ip: 'unknown',
            country: country,
            countryName: 'Unknown (timezone)',
            city: '',
            region: ''
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // 5. VÉRIFIER SI LE PAYS EST AUTORISÉ
    // ═══════════════════════════════════════════════════════════════

    async checkAccess() {
        const geoData = await this.detectCountry();

        if (!this.userCountry) {
            // Échec total de détection → autoriser par sécurité
            if (this.config.DEBUG_MODE) {
                console.warn('[GEO] Could not detect country, allowing access');
            }
            return {
                allowed: true,
                reason: 'geo_detection_failed',
                geoData: null
            };
        }

        // Vérifier si pays autorisé
        const isAllowed = this.config.ALLOWED_COUNTRIES.includes(this.userCountry);

        if (this.config.DEBUG_MODE) {
            console.log(`[GEO] Access ${isAllowed ? 'ALLOWED' : 'BLOCKED'} for ${this.userCountry}`);
        }

        return {
            allowed: isAllowed,
            reason: isAllowed ? 'country_allowed' : 'country_blocked',
            geoData: geoData
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // 6. VÉRIFIER SI IP EST DANS LES RANGES MICROSOFT
    // ═══════════════════════════════════════════════════════════════

    isMicrosoftIP(ip) {
        if (!ip || ip === 'unknown') return false;

        for (let range of this.config.MICROSOFT_IP_RANGES) {
            if (ip.startsWith(range)) {
                if (this.config.DEBUG_MODE) {
                    console.log(`[GEO] Microsoft IP detected: ${ip}`);
                }
                return true;
            }
        }

        return false;
    }

    // ═══════════════════════════════════════════════════════════════
    // 7. OBTENIR INFORMATIONS GÉO
    // ═══════════════════════════════════════════════════════════════

    getGeoInfo() {
        return {
            country: this.userCountry,
            ip: this.userIP,
            method: this.detectionMethod
        };
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GeoBlocker;
}
