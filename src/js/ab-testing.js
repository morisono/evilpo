/**
 * A/B Testing Framework for Image Optimization
 * Tests different optimization strategies and measures their effectiveness
 */

class ImageOptimizationABTesting {
    constructor(options = {}) {
        this.config = {
            // A/B Testing configuration
            enabled: true,

            // Experiment definitions
            experiments: {
                'format-preference': {
                    name: 'Image Format Preference',
                    description: 'Test different format selection strategies',
                    variants: {
                        'avif-first': {
                            name: 'AVIF First',
                            weight: 0.3,
                            config: {
                                formatPriority: ['avif', 'webp', 'jpg'],
                                fallbackEnabled: true,
                                qualityAdjustment: 0
                            }
                        },
                        'webp-first': {
                            name: 'WebP First',
                            weight: 0.4,
                            config: {
                                formatPriority: ['webp', 'jpg'],
                                fallbackEnabled: true,
                                qualityAdjustment: 0
                            }
                        },
                        'smart-detection': {
                            name: 'Smart Detection',
                            weight: 0.3,
                            config: {
                                formatPriority: 'auto',
                                connectionAware: true,
                                deviceAware: true,
                                qualityAdjustment: 0
                            }
                        }
                    },
                    metrics: [
                        'imageLoadTime',
                        'imageFileSize',
                        'compressionRatio',
                        'errorRate',
                        'userSatisfaction'
                    ]
                },

                'compression-strategy': {
                    name: 'Compression Strategy',
                    description: 'Test different compression approaches',
                    variants: {
                        'aggressive': {
                            name: 'Aggressive Compression',
                            weight: 0.3,
                            config: {
                                qualityMultiplier: 0.8,
                                compressionLevel: 'high',
                                adaptiveQuality: true
                            }
                        },
                        'balanced': {
                            name: 'Balanced Compression',
                            weight: 0.4,
                            config: {
                                qualityMultiplier: 1.0,
                                compressionLevel: 'medium',
                                adaptiveQuality: true
                            }
                        },
                        'quality-focused': {
                            name: 'Quality Focused',
                            weight: 0.3,
                            config: {
                                qualityMultiplier: 1.2,
                                compressionLevel: 'low',
                                adaptiveQuality: false
                            }
                        }
                    },
                    metrics: [
                        'visualQualityScore',
                        'imageLoadTime',
                        'imageFileSize',
                        'userEngagement',
                        'bounceRate'
                    ]
                },

                'lazy-loading-strategy': {
                    name: 'Lazy Loading Strategy',
                    description: 'Test different lazy loading approaches',
                    variants: {
                        'intersection-observer': {
                            name: 'Intersection Observer',
                            weight: 0.4,
                            config: {
                                method: 'intersection-observer',
                                rootMargin: '50px 0px',
                                threshold: 0.1,
                                preloadDistance: 2
                            }
                        },
                        'scroll-based': {
                            name: 'Scroll Based',
                            weight: 0.2,
                            config: {
                                method: 'scroll',
                                preloadDistance: 200,
                                throttleDelay: 100
                            }
                        },
                        'predictive': {
                            name: 'Predictive Loading',
                            weight: 0.4,
                            config: {
                                method: 'predictive',
                                mouseHoverPreload: true,
                                scrollVelocityPreload: true,
                                userBehaviorAnalysis: true
                            }
                        }
                    },
                    metrics: [
                        'imageLoadTime',
                        'bandwidthUsage',
                        'cacheHitRate',
                        'userScrollBehavior',
                        'pageViewDuration'
                    ]
                },

                'cache-strategy': {
                    name: 'Caching Strategy',
                    description: 'Test different caching approaches',
                    variants: {
                        'aggressive-cache': {
                            name: 'Aggressive Caching',
                            weight: 0.3,
                            config: {
                                cacheMaxAge: 30 * 24 * 60 * 60, // 30 days
                                preloadCritical: true,
                                backgroundUpdate: true
                            }
                        },
                        'balanced-cache': {
                            name: 'Balanced Caching',
                            weight: 0.4,
                            config: {
                                cacheMaxAge: 7 * 24 * 60 * 60, // 7 days
                                preloadCritical: true,
                                backgroundUpdate: false
                            }
                        },
                        'minimal-cache': {
                            name: 'Minimal Caching',
                            weight: 0.3,
                            config: {
                                cacheMaxAge: 24 * 60 * 60, // 1 day
                                preloadCritical: false,
                                backgroundUpdate: false
                            }
                        }
                    },
                    metrics: [
                        'cacheHitRate',
                        'bandwidthUsage',
                        'imageLoadTime',
                        'offlineAvailability',
                        'storageUsage'
                    ]
                }
            },

            // Statistical configuration
            statistics: {
                confidenceLevel: 0.95,
                minimumSampleSize: 100,
                minimumTestDuration: 7 * 24 * 60 * 60 * 1000, // 7 days
                statisticalPower: 0.8,
                effectSize: 0.05 // 5% improvement threshold
            },

            // Data collection
            dataCollection: {
                endpoint: '/api/ab-test-data',
                batchSize: 50,
                batchInterval: 30000, // 30 seconds
                persistLocally: true
            },

            ...options
        };

        this.userAssignments = new Map();
        this.experimentData = new Map();
        this.userId = this.getUserId();
        this.sessionId = this.generateSessionId();
        this.dataQueue = [];

        // Initialize if enabled
        if (this.config.enabled) {
            this.init();
        }
    }

    /**
     * Initialize A/B testing framework
     */
    async init() {
        try {
            // Load existing user assignments
            this.loadUserAssignments();

            // Assign user to experiments
            this.assignUserToExperiments();

            // Setup data collection
            this.setupDataCollection();

            // Setup event listeners
            this.setupEventListeners();

            // Initialize experiment tracking
            this.initializeExperimentTracking();

            console.log('A/B Testing framework initialized', {
                userId: this.userId,
                assignments: Object.fromEntries(this.userAssignments)
            });

        } catch (error) {
            console.error('Failed to initialize A/B testing:', error);
        }
    }

    /**
     * Get or generate user ID
     */
    getUserId() {
        let userId = localStorage.getItem('ab_test_user_id');

        if (!userId) {
            userId = this.generateUserId();
            localStorage.setItem('ab_test_user_id', userId);
        }

        return userId;
    }

    /**
     * Generate unique user ID
     */
    generateUserId() {
        return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Generate session ID
     */
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Load existing user assignments from localStorage
     */
    loadUserAssignments() {
        try {
            const stored = localStorage.getItem('ab_test_assignments');
            if (stored) {
                const assignments = JSON.parse(stored);
                Object.entries(assignments).forEach(([experiment, variant]) => {
                    this.userAssignments.set(experiment, variant);
                });
            }
        } catch (error) {
            console.warn('Failed to load user assignments:', error);
        }
    }

    /**
     * Save user assignments to localStorage
     */
    saveUserAssignments() {
        try {
            const assignments = Object.fromEntries(this.userAssignments);
            localStorage.setItem('ab_test_assignments', JSON.stringify(assignments));
        } catch (error) {
            console.warn('Failed to save user assignments:', error);
        }
    }

    /**
     * Assign user to experiments
     */
    assignUserToExperiments() {
        Object.keys(this.config.experiments).forEach(experimentId => {
            if (!this.userAssignments.has(experimentId)) {
                const variant = this.assignToVariant(experimentId);
                this.userAssignments.set(experimentId, variant);
            }
        });

        this.saveUserAssignments();
    }

    /**
     * Assign user to a variant within an experiment
     */
    assignToVariant(experimentId) {
        const experiment = this.config.experiments[experimentId];
        if (!experiment) return null;

        // Use deterministic assignment based on user ID
        const hash = this.hashString(this.userId + experimentId);
        const random = (hash % 10000) / 10000; // Convert to 0-1 range

        let cumulative = 0;
        for (const [variantId, variant] of Object.entries(experiment.variants)) {
            cumulative += variant.weight;
            if (random <= cumulative) {
                return variantId;
            }
        }

        // Fallback to first variant
        return Object.keys(experiment.variants)[0];
    }

    /**
     * Simple string hashing function
     */
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }

    /**
     * Get user's variant for an experiment
     */
    getVariant(experimentId) {
        return this.userAssignments.get(experimentId) || null;
    }

    /**
     * Get experiment configuration for user's variant
     */
    getExperimentConfig(experimentId) {
        const variant = this.getVariant(experimentId);
        if (!variant) return null;

        const experiment = this.config.experiments[experimentId];
        return experiment?.variants[variant]?.config || null;
    }

    /**
     * Check if user is in a specific variant
     */
    isInVariant(experimentId, variantId) {
        return this.getVariant(experimentId) === variantId;
    }

    /**
     * Setup data collection
     */
    setupDataCollection() {
        // Batch and send data periodically
        setInterval(() => {
            this.sendBatchedData();
        }, this.config.dataCollection.batchInterval);

        // Send data on page unload
        window.addEventListener('beforeunload', () => {
            this.sendBatchedData(true);
        });

        // Send data on visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.sendBatchedData(true);
            }
        });
    }

    /**
     * Setup event listeners for experiment tracking
     */
    setupEventListeners() {
        // Track image optimization events
        window.addEventListener('imageOptimized', (event) => {
            this.trackEvent('imageOptimized', event.detail);
        });

        // Track image load events
        window.addEventListener('imageLoaded', (event) => {
            this.trackEvent('imageLoaded', event.detail);
        });

        // Track image errors
        window.addEventListener('imageError', (event) => {
            this.trackEvent('imageError', event.detail);
        });

        // Track performance metrics
        window.addEventListener('performanceMetric', (event) => {
            this.trackEvent('performanceMetric', event.detail);
        });

        // Track user interactions
        this.setupUserInteractionTracking();
    }

    /**
     * Setup user interaction tracking
     */
    setupUserInteractionTracking() {
        let interactionStartTime = Date.now();
        let totalInteractionTime = 0;
        let clicks = 0;
        let scrollDistance = 0;
        let lastScrollY = window.scrollY;

        // Track clicks
        document.addEventListener('click', () => {
            clicks++;
            this.trackEvent('userInteraction', {
                type: 'click',
                timestamp: Date.now()
            });
        });

        // Track scroll behavior
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            scrollDistance += Math.abs(currentScrollY - lastScrollY);
            lastScrollY = currentScrollY;

            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.trackEvent('userInteraction', {
                    type: 'scroll',
                    distance: scrollDistance,
                    timestamp: Date.now()
                });
            }, 500);
        });

        // Track page engagement
        setInterval(() => {
            if (document.visibilityState === 'visible') {
                totalInteractionTime += 1000; // 1 second

                this.trackEvent('pageEngagement', {
                    totalTime: totalInteractionTime,
                    clicks,
                    scrollDistance,
                    timestamp: Date.now()
                });
            }
        }, 1000);
    }

    /**
     * Initialize experiment tracking
     */
    initializeExperimentTracking() {
        // Track experiment exposure
        this.userAssignments.forEach((variant, experiment) => {
            this.trackEvent('experimentExposure', {
                experiment,
                variant,
                timestamp: Date.now()
            });
        });

        // Initialize experiment-specific tracking
        this.initImageFormatTracking();
        this.initCompressionTracking();
        this.initLazyLoadingTracking();
        this.initCacheTracking();
    }

    /**
     * Track image format experiment
     */
    initImageFormatTracking() {
        const variant = this.getVariant('format-preference');
        if (!variant) return;

        // Monitor format usage
        const formatCounter = new Map();

        const trackImageFormat = (src, format) => {
            formatCounter.set(format, (formatCounter.get(format) || 0) + 1);

            this.trackEvent('formatUsage', {
                experiment: 'format-preference',
                variant,
                format,
                src,
                timestamp: Date.now()
            });
        };

        // Hook into image optimization system
        if (window.ImageOptimizer) {
            const originalOptimize = window.ImageOptimizer.optimizeImage.bind(window.ImageOptimizer);
            window.ImageOptimizer.optimizeImage = (src, options) => {
                const result = originalOptimize(src, options);
                const format = this.getImageFormat(result.src);
                trackImageFormat(src, format);
                return result;
            };
        }
    }

    /**
     * Track compression experiment
     */
    initCompressionTracking() {
        const variant = this.getVariant('compression-strategy');
        if (!variant) return;

        // Monitor compression effectiveness
        this.trackEvent('compressionConfig', {
            experiment: 'compression-strategy',
            variant,
            config: this.getExperimentConfig('compression-strategy'),
            timestamp: Date.now()
        });
    }

    /**
     * Track lazy loading experiment
     */
    initLazyLoadingTracking() {
        const variant = this.getVariant('lazy-loading-strategy');
        if (!variant) return;

        // Monitor lazy loading effectiveness
        let imagesInViewport = 0;
        let imagesLoaded = 0;
        let totalBandwidthSaved = 0;

        const trackLazyLoading = (action, data) => {
            this.trackEvent('lazyLoading', {
                experiment: 'lazy-loading-strategy',
                variant,
                action,
                data,
                timestamp: Date.now()
            });
        };

        // Track viewport images
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.target.tagName === 'IMG') {
                        if (entry.isIntersecting) {
                            imagesInViewport++;
                            trackLazyLoading('imageEntersViewport', {
                                src: entry.target.src,
                                imagesInViewport
                            });
                        } else {
                            imagesInViewport--;
                            trackLazyLoading('imageLeavesViewport', {
                                src: entry.target.src,
                                imagesInViewport
                            });
                        }
                    }
                });
            });

            // Observe all images
            document.querySelectorAll('img').forEach(img => {
                observer.observe(img);
            });
        }
    }

    /**
     * Track cache experiment
     */
    initCacheTracking() {
        const variant = this.getVariant('cache-strategy');
        if (!variant) return;

        // Monitor cache effectiveness
        let cacheHits = 0;
        let cacheMisses = 0;

        const trackCacheEvent = (event, data) => {
            this.trackEvent('cacheEvent', {
                experiment: 'cache-strategy',
                variant,
                event,
                data,
                cacheHitRate: cacheHits / (cacheHits + cacheMisses),
                timestamp: Date.now()
            });
        };

        // Monitor service worker cache events
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data.type === 'cacheHit') {
                    cacheHits++;
                    trackCacheEvent('hit', event.data);
                } else if (event.data.type === 'cacheMiss') {
                    cacheMisses++;
                    trackCacheEvent('miss', event.data);
                }
            });
        }
    }

    /**
     * Track an event for A/B testing
     */
    trackEvent(eventType, data) {
        const eventData = {
            userId: this.userId,
            sessionId: this.sessionId,
            eventType,
            data,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            experiments: Object.fromEntries(this.userAssignments)
        };

        this.dataQueue.push(eventData);

        // Send immediately if queue is full
        if (this.dataQueue.length >= this.config.dataCollection.batchSize) {
            this.sendBatchedData();
        }

        // Store locally if enabled
        if (this.config.dataCollection.persistLocally) {
            this.storeEventLocally(eventData);
        }
    }

    /**
     * Store event data locally
     */
    storeEventLocally(eventData) {
        try {
            const stored = JSON.parse(localStorage.getItem('ab_test_events') || '[]');
            stored.push(eventData);

            // Keep only recent events (last 1000)
            if (stored.length > 1000) {
                stored.splice(0, stored.length - 1000);
            }

            localStorage.setItem('ab_test_events', JSON.stringify(stored));
        } catch (error) {
            console.warn('Failed to store event locally:', error);
        }
    }

    /**
     * Send batched data to analytics endpoint
     */
    async sendBatchedData(isBeacon = false) {
        if (this.dataQueue.length === 0) return;

        const payload = {
            userId: this.userId,
            sessionId: this.sessionId,
            events: this.dataQueue.splice(0),
            timestamp: Date.now()
        };

        try {
            if (isBeacon && 'sendBeacon' in navigator) {
                navigator.sendBeacon(
                    this.config.dataCollection.endpoint,
                    JSON.stringify(payload)
                );
            } else {
                await fetch(this.config.dataCollection.endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload),
                    keepalive: isBeacon
                });
            }
        } catch (error) {
            console.warn('Failed to send A/B test data:', error);

            // Put data back in queue for retry
            this.dataQueue.unshift(...payload.events);
        }
    }

    /**
     * Get image format from URL
     */
    getImageFormat(src) {
        try {
            const url = new URL(src, window.location.href);
            const pathname = url.pathname.toLowerCase();

            if (pathname.includes('.avif')) return 'avif';
            if (pathname.includes('.webp')) return 'webp';
            if (pathname.includes('.jpg') || pathname.includes('.jpeg')) return 'jpeg';
            if (pathname.includes('.png')) return 'png';

            // Check URL parameters
            const format = url.searchParams.get('f') || url.searchParams.get('format');
            if (format) return format;

            return 'unknown';
        } catch (e) {
            return 'unknown';
        }
    }

    /**
     * Calculate statistical significance
     */
    calculateStatisticalSignificance(experimentId, metric) {
        const experiment = this.config.experiments[experimentId];
        if (!experiment) return null;

        const variants = Object.keys(experiment.variants);
        const results = {};

        // This would typically be calculated server-side with proper statistical analysis
        // Here's a simplified version for demonstration

        variants.forEach(variant => {
            const events = this.getEventsForVariant(experimentId, variant, metric);

            if (events.length >= this.config.statistics.minimumSampleSize) {
                const values = events.map(event => this.extractMetricValue(event, metric));

                results[variant] = {
                    sampleSize: values.length,
                    mean: this.calculateMean(values),
                    stdDev: this.calculateStdDev(values),
                    confidenceInterval: this.calculateConfidenceInterval(values)
                };
            }
        });

        return results;
    }

    /**
     * Get events for a specific variant
     */
    getEventsForVariant(experimentId, variant, metric) {
        // This would typically query the backend analytics system
        try {
            const stored = JSON.parse(localStorage.getItem('ab_test_events') || '[]');
            return stored.filter(event =>
                event.experiments[experimentId] === variant &&
                this.eventContainsMetric(event, metric)
            );
        } catch (error) {
            return [];
        }
    }

    /**
     * Check if event contains relevant metric data
     */
    eventContainsMetric(event, metric) {
        switch (metric) {
            case 'imageLoadTime':
                return event.eventType === 'imageLoaded' && event.data.loadTime;
            case 'imageFileSize':
                return event.eventType === 'imageLoaded' && event.data.size;
            case 'compressionRatio':
                return event.eventType === 'imageOptimized' && event.data.compressionRatio;
            case 'errorRate':
                return event.eventType === 'imageError';
            default:
                return false;
        }
    }

    /**
     * Extract metric value from event
     */
    extractMetricValue(event, metric) {
        switch (metric) {
            case 'imageLoadTime':
                return event.data.loadTime || 0;
            case 'imageFileSize':
                return event.data.size || 0;
            case 'compressionRatio':
                return event.data.compressionRatio || 1;
            case 'errorRate':
                return event.eventType === 'imageError' ? 1 : 0;
            default:
                return 0;
        }
    }

    /**
     * Calculate mean of values
     */
    calculateMean(values) {
        return values.reduce((sum, value) => sum + value, 0) / values.length;
    }

    /**
     * Calculate standard deviation
     */
    calculateStdDev(values) {
        const mean = this.calculateMean(values);
        const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
        const avgSquaredDiff = this.calculateMean(squaredDifferences);
        return Math.sqrt(avgSquaredDiff);
    }

    /**
     * Calculate confidence interval
     */
    calculateConfidenceInterval(values) {
        const mean = this.calculateMean(values);
        const stdDev = this.calculateStdDev(values);
        const n = values.length;

        // Using normal approximation for simplicity
        const marginOfError = 1.96 * (stdDev / Math.sqrt(n));

        return {
            lower: mean - marginOfError,
            upper: mean + marginOfError
        };
    }

    /**
     * Get experiment results summary
     */
    getExperimentResults(experimentId) {
        const experiment = this.config.experiments[experimentId];
        if (!experiment) return null;

        const results = {
            experimentId,
            name: experiment.name,
            description: experiment.description,
            variants: {},
            metrics: {}
        };

        // Calculate results for each metric
        experiment.metrics.forEach(metric => {
            results.metrics[metric] = this.calculateStatisticalSignificance(experimentId, metric);
        });

        return results;
    }

    /**
     * Get all experiment results
     */
    getAllResults() {
        const results = {};

        Object.keys(this.config.experiments).forEach(experimentId => {
            results[experimentId] = this.getExperimentResults(experimentId);
        });

        return results;
    }

    /**
     * Force user into specific variant (for testing)
     */
    forceVariant(experimentId, variantId) {
        const experiment = this.config.experiments[experimentId];
        if (!experiment || !experiment.variants[variantId]) {
            console.warn('Invalid experiment or variant:', experimentId, variantId);
            return false;
        }

        this.userAssignments.set(experimentId, variantId);
        this.saveUserAssignments();

        this.trackEvent('variantForced', {
            experiment: experimentId,
            variant: variantId,
            timestamp: Date.now()
        });

        return true;
    }

    /**
     * Remove user from experiment
     */
    removeFromExperiment(experimentId) {
        this.userAssignments.delete(experimentId);
        this.saveUserAssignments();

        this.trackEvent('experimentRemoved', {
            experiment: experimentId,
            timestamp: Date.now()
        });
    }

    /**
     * Get current user assignments
     */
    getUserAssignments() {
        return Object.fromEntries(this.userAssignments);
    }

    /**
     * Clean up and destroy A/B testing
     */
    destroy() {
        // Send any remaining data
        this.sendBatchedData(true);

        console.log('A/B Testing framework destroyed');
    }
}

// Initialize global A/B testing
window.ImageOptimizationABTesting = new ImageOptimizationABTesting({
    endpoint: '/api/ab-test-data',
    sampleRate: 0.1
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImageOptimizationABTesting;
}
