/**
 * Performance Monitoring and Real User Metrics (RUM)
 * Comprehensive performance tracking for image optimization
 */

class PerformanceMonitor {
    constructor(options = {}) {
        this.config = {
            // Monitoring configuration
            enabled: true,
            sampleRate: 0.1, // 10% of users
            endpoint: '/api/performance-metrics',
            realUserMetrics: true,
            webVitals: true,

            // Thresholds for performance classification
            thresholds: {
                LCP: { good: 2500, poor: 4000 },
                FID: { good: 100, poor: 300 },
                CLS: { good: 0.1, poor: 0.25 },
                imageLoad: { good: 1000, poor: 3000 },
                totalImageSize: { good: 1024 * 1024, poor: 5 * 1024 * 1024 }
            },

            // Feature flags
            features: {
                webVitalsAPI: true,
                performanceObserver: true,
                navigationTiming: true,
                resourceTiming: true,
                longTaskMonitoring: true,
                memoryUsage: true
            },

            ...options
        };

        this.metrics = new Map();
        this.observers = new Map();
        this.isMonitoring = false;
        this.sessionId = this.generateSessionId();
        this.pageLoadTime = Date.now();
        this.imageMetrics = new Map();

        // Initialize monitoring if enabled
        if (this.config.enabled && this.shouldSample()) {
            this.init();
        }
    }

    /**
     * Initialize performance monitoring
     */
    async init() {
        try {
            this.isMonitoring = true;

            // Initialize core web vitals monitoring
            if (this.config.webVitals) {
                await this.initWebVitals();
            }

            // Initialize resource timing monitoring
            if (this.config.features.resourceTiming) {
                this.initResourceTiming();
            }

            // Initialize navigation timing
            if (this.config.features.navigationTiming) {
                this.initNavigationTiming();
            }

            // Initialize long task monitoring
            if (this.config.features.longTaskMonitoring) {
                this.initLongTaskMonitoring();
            }

            // Initialize memory monitoring
            if (this.config.features.memoryUsage) {
                this.initMemoryMonitoring();
            }

            // Initialize image-specific monitoring
            this.initImageMonitoring();

            // Setup periodic reporting
            this.setupReporting();

            // Setup page visibility handling
            this.setupPageVisibility();

            console.log('Performance monitoring initialized');
        } catch (error) {
            console.error('Failed to initialize performance monitoring:', error);
        }
    }

    /**
     * Check if this user should be sampled
     */
    shouldSample() {
        return Math.random() < this.config.sampleRate;
    }

    /**
     * Generate unique session ID
     */
    generateSessionId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Initialize Core Web Vitals monitoring
     */
    async initWebVitals() {
        // Try to use web-vitals library if available
        if (typeof webVitals !== 'undefined') {
            await this.initWithWebVitalsLibrary();
        } else {
            await this.initWebVitalsManual();
        }
    }

    /**
     * Initialize with web-vitals library
     */
    async initWithWebVitalsLibrary() {
        const { getCLS, getFID, getFCP, getLCP, getTTFB } = webVitals;

        getCLS((metric) => this.recordWebVital('CLS', metric));
        getFID((metric) => this.recordWebVital('FID', metric));
        getFCP((metric) => this.recordWebVital('FCP', metric));
        getLCP((metric) => this.recordWebVital('LCP', metric));
        getTTFB((metric) => this.recordWebVital('TTFB', metric));
    }

    /**
     * Initialize Web Vitals manually using Performance Observer
     */
    async initWebVitalsManual() {
        // Largest Contentful Paint (LCP)
        if ('PerformanceObserver' in window) {
            try {
                const lcpObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];

                    this.recordMetric('LCP', {
                        value: lastEntry.startTime,
                        rating: this.getRating('LCP', lastEntry.startTime),
                        element: lastEntry.element?.tagName || 'unknown',
                        url: lastEntry.url || window.location.href,
                        timestamp: Date.now()
                    });
                });

                lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
                this.observers.set('LCP', lcpObserver);
            } catch (e) {
                console.warn('LCP monitoring not supported');
            }

            // First Input Delay (FID)
            try {
                const fidObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach((entry) => {
                        const fidValue = entry.processingStart - entry.startTime;

                        this.recordMetric('FID', {
                            value: fidValue,
                            rating: this.getRating('FID', fidValue),
                            inputType: entry.name,
                            timestamp: Date.now()
                        });
                    });
                });

                fidObserver.observe({ entryTypes: ['first-input'] });
                this.observers.set('FID', fidObserver);
            } catch (e) {
                console.warn('FID monitoring not supported');
            }

            // Cumulative Layout Shift (CLS)
            try {
                let clsValue = 0;
                const clsObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach((entry) => {
                        if (!entry.hadRecentInput) {
                            clsValue += entry.value;

                            this.recordMetric('CLS', {
                                value: clsValue,
                                rating: this.getRating('CLS', clsValue),
                                sources: entry.sources?.map(source => ({
                                    element: source.node?.tagName || 'unknown',
                                    currentRect: source.currentRect,
                                    previousRect: source.previousRect
                                })) || [],
                                timestamp: Date.now()
                            });
                        }
                    });
                });

                clsObserver.observe({ entryTypes: ['layout-shift'] });
                this.observers.set('CLS', clsObserver);
            } catch (e) {
                console.warn('CLS monitoring not supported');
            }

            // First Contentful Paint (FCP)
            try {
                const fcpObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach((entry) => {
                        if (entry.name === 'first-contentful-paint') {
                            this.recordMetric('FCP', {
                                value: entry.startTime,
                                rating: this.getRating('FCP', entry.startTime),
                                timestamp: Date.now()
                            });
                        }
                    });
                });

                fcpObserver.observe({ entryTypes: ['paint'] });
                this.observers.set('FCP', fcpObserver);
            } catch (e) {
                console.warn('FCP monitoring not supported');
            }
        }
    }

    /**
     * Record Web Vital metric
     */
    recordWebVital(name, metric) {
        this.recordMetric(name, {
            value: metric.value,
            rating: metric.rating,
            delta: metric.delta,
            id: metric.id,
            timestamp: Date.now()
        });
    }

    /**
     * Get performance rating based on thresholds
     */
    getRating(metric, value) {
        const thresholds = this.config.thresholds[metric];
        if (!thresholds) return 'unknown';

        if (value <= thresholds.good) return 'good';
        if (value <= thresholds.poor) return 'needs-improvement';
        return 'poor';
    }

    /**
     * Initialize resource timing monitoring
     */
    initResourceTiming() {
        if (!('PerformanceObserver' in window)) return;

        try {
            const resourceObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach((entry) => {
                    this.processResourceEntry(entry);
                });
            });

            resourceObserver.observe({ entryTypes: ['resource'] });
            this.observers.set('resource', resourceObserver);
        } catch (e) {
            console.warn('Resource timing monitoring not supported');
        }
    }

    /**
     * Process resource timing entry
     */
    processResourceEntry(entry) {
        const isImage = this.isImageResource(entry);
        const duration = entry.responseEnd - entry.startTime;
        const transferSize = entry.transferSize || 0;
        const encodedBodySize = entry.encodedBodySize || 0;
        const compressionRatio = encodedBodySize > 0 ? transferSize / encodedBodySize : 1;

        const resourceData = {
            name: entry.name,
            type: entry.initiatorType,
            duration,
            transferSize,
            encodedBodySize,
            compressionRatio,
            protocol: this.getProtocol(entry),
            timing: {
                dns: entry.domainLookupEnd - entry.domainLookupStart,
                tcp: entry.connectEnd - entry.connectStart,
                ssl: entry.secureConnectionStart > 0 ? entry.connectEnd - entry.secureConnectionStart : 0,
                ttfb: entry.responseStart - entry.requestStart,
                download: entry.responseEnd - entry.responseStart
            },
            timestamp: Date.now()
        };

        if (isImage) {
            this.recordImageMetric(entry.name, resourceData);
        }

        this.recordMetric('resource', resourceData);
    }

    /**
     * Check if resource is an image
     */
    isImageResource(entry) {
        if (entry.initiatorType === 'img') return true;

        const url = new URL(entry.name, window.location.href);
        const pathname = url.pathname.toLowerCase();
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg'];

        return imageExtensions.some(ext => pathname.endsWith(ext));
    }

    /**
     * Get protocol from resource entry
     */
    getProtocol(entry) {
        if (entry.nextHopProtocol) return entry.nextHopProtocol;

        const url = new URL(entry.name, window.location.href);
        return url.protocol.slice(0, -1); // Remove trailing colon
    }

    /**
     * Initialize navigation timing monitoring
     */
    initNavigationTiming() {
        if (!('performance' in window) || !performance.getEntriesByType) return;

        // Get navigation timing data
        const navigationEntries = performance.getEntriesByType('navigation');
        if (navigationEntries.length > 0) {
            const entry = navigationEntries[0];

            this.recordMetric('navigation', {
                type: entry.type,
                redirectCount: entry.redirectCount,
                timing: {
                    redirectTime: entry.redirectEnd - entry.redirectStart,
                    dnsTime: entry.domainLookupEnd - entry.domainLookupStart,
                    tcpTime: entry.connectEnd - entry.connectStart,
                    tlsTime: entry.secureConnectionStart > 0 ? entry.connectEnd - entry.secureConnectionStart : 0,
                    requestTime: entry.responseStart - entry.requestStart,
                    responseTime: entry.responseEnd - entry.responseStart,
                    domParseTime: entry.domContentLoadedEventStart - entry.responseEnd,
                    loadTime: entry.loadEventStart - entry.domContentLoadedEventStart
                },
                transferSize: entry.transferSize,
                encodedBodySize: entry.encodedBodySize,
                timestamp: Date.now()
            });
        }
    }

    /**
     * Initialize long task monitoring
     */
    initLongTaskMonitoring() {
        if (!('PerformanceObserver' in window)) return;

        try {
            const longTaskObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach((entry) => {
                    this.recordMetric('longTask', {
                        duration: entry.duration,
                        startTime: entry.startTime,
                        attribution: entry.attribution?.map(attr => ({
                            name: attr.name,
                            entryType: attr.entryType,
                            startTime: attr.startTime,
                            duration: attr.duration
                        })) || [],
                        timestamp: Date.now()
                    });
                });
            });

            longTaskObserver.observe({ entryTypes: ['longtask'] });
            this.observers.set('longTask', longTaskObserver);
        } catch (e) {
            console.warn('Long task monitoring not supported');
        }
    }

    /**
     * Initialize memory monitoring
     */
    initMemoryMonitoring() {
        if (!('performance' in window) || !performance.memory) return;

        // Record initial memory usage
        this.recordMemoryUsage();

        // Monitor memory periodically
        setInterval(() => {
            this.recordMemoryUsage();
        }, 30000); // Every 30 seconds
    }

    /**
     * Record current memory usage
     */
    recordMemoryUsage() {
        if (!performance.memory) return;

        this.recordMetric('memory', {
            usedJSHeapSize: performance.memory.usedJSHeapSize,
            totalJSHeapSize: performance.memory.totalJSHeapSize,
            jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
            usagePercentage: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100,
            timestamp: Date.now()
        });
    }

    /**
     * Initialize image-specific monitoring
     */
    initImageMonitoring() {
        // Monitor image load events
        this.monitorImageLoads();

        // Monitor image errors
        this.monitorImageErrors();

        // Monitor lazy loading
        this.monitorLazyLoading();

        // Monitor format usage
        this.monitorImageFormats();
    }

    /**
     * Monitor image load events
     */
    monitorImageLoads() {
        // Use capture phase to catch all image loads
        document.addEventListener('load', (event) => {
            if (event.target.tagName === 'IMG') {
                this.recordImageLoad(event.target);
            }
        }, true);

        // Monitor image errors
        document.addEventListener('error', (event) => {
            if (event.target.tagName === 'IMG') {
                this.recordImageError(event.target);
            }
        }, true);
    }

    /**
     * Record image load metrics
     */
    recordImageLoad(img) {
        const loadEndTime = performance.now();
        const loadStartTime = parseFloat(img.dataset.loadStart) || loadEndTime;
        const loadDuration = loadEndTime - loadStartTime;

        const imageData = {
            src: img.src,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            displayWidth: img.width,
            displayHeight: img.height,
            loadDuration,
            loading: img.loading,
            priority: img.dataset.priority || 'medium',
            format: this.getImageFormat(img.src),
            isLazy: img.hasAttribute('data-src') || img.loading === 'lazy',
            timestamp: Date.now()
        };

        this.recordImageMetric(img.src, imageData);
        this.recordMetric('imageLoad', imageData);
    }

    /**
     * Record image error
     */
    recordImageError(img) {
        this.recordMetric('imageError', {
            src: img.src,
            alt: img.alt,
            loading: img.loading,
            priority: img.dataset.priority || 'medium',
            errorType: 'load-failure',
            timestamp: Date.now()
        });
    }

    /**
     * Monitor lazy loading effectiveness
     */
    monitorLazyLoading() {
        // Monitor intersection observer usage
        if ('IntersectionObserver' in window) {
            const lazyImages = document.querySelectorAll('img[data-src], img[loading="lazy"]');

            this.recordMetric('lazyLoading', {
                totalLazyImages: lazyImages.length,
                intersectionObserverSupported: true,
                timestamp: Date.now()
            });
        }
    }

    /**
     * Monitor image formats being used
     */
    monitorImageFormats() {
        const formatCounter = new Map();

        document.querySelectorAll('img').forEach(img => {
            const format = this.getImageFormat(img.src);
            formatCounter.set(format, (formatCounter.get(format) || 0) + 1);
        });

        this.recordMetric('imageFormats', {
            formats: Object.fromEntries(formatCounter),
            supportedFormats: this.getSupportedFormats(),
            timestamp: Date.now()
        });
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
            if (pathname.includes('.gif')) return 'gif';
            if (pathname.includes('.svg')) return 'svg';

            // Check URL parameters
            const format = url.searchParams.get('f') || url.searchParams.get('format');
            if (format) return format;

            return 'unknown';
        } catch (e) {
            return 'unknown';
        }
    }

    /**
     * Get supported image formats
     */
    getSupportedFormats() {
        // This would be populated by the image optimization system
        return window.ImageOptimizer?.formatSupport || {
            avif: false,
            webp: false,
            jpg: true
        };
    }

    /**
     * Setup periodic reporting
     */
    setupReporting() {
        // Send metrics every 30 seconds
        setInterval(() => {
            this.sendMetrics();
        }, 30000);

        // Send metrics on page unload
        window.addEventListener('beforeunload', () => {
            this.sendMetrics(true);
        });

        // Send metrics on visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.sendMetrics(true);
            }
        });
    }

    /**
     * Setup page visibility handling
     */
    setupPageVisibility() {
        let pageVisibleTime = Date.now();
        let totalVisibleTime = 0;

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                pageVisibleTime = Date.now();
            } else {
                totalVisibleTime += Date.now() - pageVisibleTime;

                this.recordMetric('pageVisibility', {
                    totalVisibleTime,
                    sessionDuration: Date.now() - this.pageLoadTime,
                    visibilityRatio: totalVisibleTime / (Date.now() - this.pageLoadTime),
                    timestamp: Date.now()
                });
            }
        });
    }

    /**
     * Record a metric
     */
    recordMetric(name, data) {
        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }

        this.metrics.get(name).push(data);

        // Emit custom event for real-time monitoring
        window.dispatchEvent(new CustomEvent('performanceMetric', {
            detail: { name, data }
        }));
    }

    /**
     * Record image-specific metric
     */
    recordImageMetric(src, data) {
        this.imageMetrics.set(src, data);
    }

    /**
     * Send metrics to analytics endpoint
     */
    async sendMetrics(isBeacon = false) {
        if (!this.isMonitoring || this.metrics.size === 0) return;

        const payload = {
            sessionId: this.sessionId,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            connection: this.getConnectionInfo(),
            deviceInfo: this.getDeviceInfo(),
            metrics: this.serializeMetrics(),
            imageMetrics: this.serializeImageMetrics()
        };

        try {
            if (isBeacon && 'sendBeacon' in navigator) {
                // Use sendBeacon for unload events
                navigator.sendBeacon(
                    this.config.endpoint,
                    JSON.stringify(payload)
                );
            } else {
                // Use fetch for regular reporting
                await fetch(this.config.endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload),
                    keepalive: isBeacon
                });
            }

            // Clear sent metrics
            this.clearMetrics();

        } catch (error) {
            console.warn('Failed to send performance metrics:', error);
        }
    }

    /**
     * Get connection information
     */
    getConnectionInfo() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

        return {
            effectiveType: connection?.effectiveType || 'unknown',
            downlink: connection?.downlink || 0,
            rtt: connection?.rtt || 0,
            saveData: connection?.saveData || false,
            online: navigator.onLine
        };
    }

    /**
     * Get device information
     */
    getDeviceInfo() {
        return {
            devicePixelRatio: window.devicePixelRatio || 1,
            screenWidth: screen.width,
            screenHeight: screen.height,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            deviceMemory: navigator.deviceMemory || null,
            hardwareConcurrency: navigator.hardwareConcurrency || null,
            platform: navigator.platform,
            language: navigator.language
        };
    }

    /**
     * Serialize metrics for transmission
     */
    serializeMetrics() {
        const serialized = {};

        this.metrics.forEach((values, name) => {
            serialized[name] = {
                count: values.length,
                values: values.slice(-100), // Limit to last 100 entries
                summary: this.calculateSummary(values)
            };
        });

        return serialized;
    }

    /**
     * Serialize image metrics
     */
    serializeImageMetrics() {
        const serialized = {};

        this.imageMetrics.forEach((data, src) => {
            serialized[src] = data;
        });

        return serialized;
    }

    /**
     * Calculate summary statistics
     */
    calculateSummary(values) {
        if (values.length === 0) return null;

        const numericValues = values
            .map(v => typeof v === 'object' ? v.value : v)
            .filter(v => typeof v === 'number')
            .sort((a, b) => a - b);

        if (numericValues.length === 0) return null;

        return {
            count: numericValues.length,
            min: Math.min(...numericValues),
            max: Math.max(...numericValues),
            avg: numericValues.reduce((a, b) => a + b, 0) / numericValues.length,
            p50: this.percentile(numericValues, 50),
            p75: this.percentile(numericValues, 75),
            p95: this.percentile(numericValues, 95),
            p99: this.percentile(numericValues, 99)
        };
    }

    /**
     * Calculate percentile
     */
    percentile(values, p) {
        const sorted = values.sort((a, b) => a - b);
        const index = (p / 100) * (sorted.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        const weight = index % 1;

        return sorted[lower] * (1 - weight) + sorted[upper] * weight;
    }

    /**
     * Clear collected metrics
     */
    clearMetrics() {
        this.metrics.clear();
        this.imageMetrics.clear();
    }

    /**
     * Get current performance summary
     */
    getPerformanceSummary() {
        const summary = {
            webVitals: {},
            images: {},
            resources: {},
            connection: this.getConnectionInfo(),
            device: this.getDeviceInfo()
        };

        // Web Vitals summary
        ['LCP', 'FID', 'CLS', 'FCP', 'TTFB'].forEach(vital => {
            const metrics = this.metrics.get(vital);
            if (metrics && metrics.length > 0) {
                const latest = metrics[metrics.length - 1];
                summary.webVitals[vital] = {
                    value: latest.value,
                    rating: latest.rating,
                    timestamp: latest.timestamp
                };
            }
        });

        // Image summary
        const imageLoads = this.metrics.get('imageLoad') || [];
        if (imageLoads.length > 0) {
            const durations = imageLoads.map(load => load.loadDuration);
            summary.images = {
                totalLoaded: imageLoads.length,
                avgLoadTime: durations.reduce((a, b) => a + b, 0) / durations.length,
                p95LoadTime: this.percentile(durations, 95),
                formats: this.getFormatDistribution(imageLoads),
                errors: this.metrics.get('imageError')?.length || 0
            };
        }

        return summary;
    }

    /**
     * Get format distribution from image loads
     */
    getFormatDistribution(imageLoads) {
        const distribution = {};

        imageLoads.forEach(load => {
            const format = load.format || 'unknown';
            distribution[format] = (distribution[format] || 0) + 1;
        });

        return distribution;
    }

    /**
     * Start real-time performance monitoring display
     */
    startRealTimeMonitoring() {
        if (this.realTimeMonitor) return;

        this.realTimeMonitor = document.createElement('div');
        this.realTimeMonitor.className = 'performance-overlay';
        this.realTimeMonitor.innerHTML = `
            <div class="performance-metric">
                <span class="metric-label">LCP:</span>
                <span class="metric-value" id="lcp-value">-</span>
            </div>
            <div class="performance-metric">
                <span class="metric-label">FID:</span>
                <span class="metric-value" id="fid-value">-</span>
            </div>
            <div class="performance-metric">
                <span class="metric-label">CLS:</span>
                <span class="metric-value" id="cls-value">-</span>
            </div>
            <div class="performance-metric">
                <span class="metric-label">Images:</span>
                <span class="metric-value" id="images-value">-</span>
            </div>
        `;

        document.body.appendChild(this.realTimeMonitor);

        // Update display every second
        this.realTimeInterval = setInterval(() => {
            this.updateRealTimeDisplay();
        }, 1000);

        // Show overlay
        setTimeout(() => {
            this.realTimeMonitor.classList.add('visible');
        }, 100);
    }

    /**
     * Update real-time display
     */
    updateRealTimeDisplay() {
        if (!this.realTimeMonitor) return;

        const summary = this.getPerformanceSummary();

        // Update LCP
        const lcpElement = this.realTimeMonitor.querySelector('#lcp-value');
        if (summary.webVitals.LCP) {
            lcpElement.textContent = `${Math.round(summary.webVitals.LCP.value)}ms`;
            lcpElement.className = `metric-value metric-${summary.webVitals.LCP.rating}`;
        }

        // Update FID
        const fidElement = this.realTimeMonitor.querySelector('#fid-value');
        if (summary.webVitals.FID) {
            fidElement.textContent = `${Math.round(summary.webVitals.FID.value)}ms`;
            fidElement.className = `metric-value metric-${summary.webVitals.FID.rating}`;
        }

        // Update CLS
        const clsElement = this.realTimeMonitor.querySelector('#cls-value');
        if (summary.webVitals.CLS) {
            clsElement.textContent = summary.webVitals.CLS.value.toFixed(3);
            clsElement.className = `metric-value metric-${summary.webVitals.CLS.rating}`;
        }

        // Update Images
        const imagesElement = this.realTimeMonitor.querySelector('#images-value');
        if (summary.images.totalLoaded) {
            imagesElement.textContent = `${summary.images.totalLoaded} (${Math.round(summary.images.avgLoadTime)}ms avg)`;
        }
    }

    /**
     * Stop real-time monitoring display
     */
    stopRealTimeMonitoring() {
        if (this.realTimeMonitor) {
            this.realTimeMonitor.remove();
            this.realTimeMonitor = null;
        }

        if (this.realTimeInterval) {
            clearInterval(this.realTimeInterval);
            this.realTimeInterval = null;
        }
    }

    /**
     * Destroy performance monitor
     */
    destroy() {
        // Disconnect all observers
        this.observers.forEach(observer => {
            observer.disconnect();
        });
        this.observers.clear();

        // Stop real-time monitoring
        this.stopRealTimeMonitoring();

        // Clear intervals
        if (this.realTimeInterval) {
            clearInterval(this.realTimeInterval);
        }

        // Send final metrics
        this.sendMetrics(true);

        this.isMonitoring = false;
        console.log('Performance monitoring stopped');
    }
}

// Initialize global performance monitor
window.PerformanceMonitor = new PerformanceMonitor({
    endpoint: '/api/performance-metrics',
    sampleRate: 0.1,
    realUserMetrics: true,
    webVitals: true
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceMonitor;
}
