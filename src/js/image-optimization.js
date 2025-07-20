/**
 * Advanced Image Optimization System
 * Comprehensive image optimization with next-gen formats, dynamic compression,
 * intelligent lazy loading, CDN distribution, and performance monitoring
 */

class ImageOptimizationSystem {
    constructor(options = {}) {
        this.config = {
            // Next-gen format support
            formats: {
                avif: { quality: 65, fallback: 'webp' },
                webp: { quality: 75, fallback: 'jpg' },
                jpg: { quality: 85, fallback: null }
            },

            // Device capability detection
            deviceTypes: {
                mobile: { maxWidth: 768, dpr: window.devicePixelRatio || 1 },
                tablet: { maxWidth: 1024, dpr: window.devicePixelRatio || 1 },
                desktop: { maxWidth: 1920, dpr: window.devicePixelRatio || 1 },
                highDPI: { dpr: 2 }
            },

            // CDN configuration
            cdnConfig: {
                primary: 'https://cdn.example.com',
                fallbacks: [
                    'https://cdn2.example.com',
                    'https://cdn3.example.com'
                ],
                imageProxy: 'https://images.example.com',
                optimizationAPI: 'https://api.example.com/v1/optimize'
            },

            // Lazy loading settings
            lazyLoading: {
                rootMargin: '50px 0px',
                threshold: 0.1,
                placeholderQuality: 10,
                fadeInDuration: 300
            },

            // Preloading priorities
            preloadPriorities: {
                critical: ['hero', 'above-fold', 'trending-slider'],
                high: ['visible-thumbnails', 'grid-images'],
                medium: ['below-fold', 'pagination'],
                low: ['background', 'decorative']
            },

            // Performance monitoring
            monitoring: {
                enabled: true,
                sampleRate: 0.1, // 10% of users
                metricsEndpoint: '/api/performance-metrics',
                realUserMetrics: true
            },

            // A/B Testing
            abTesting: {
                enabled: true,
                experiments: {
                    'format-preference': {
                        variants: ['avif-first', 'webp-first', 'smart-detection'],
                        allocation: [0.4, 0.4, 0.2]
                    },
                    'compression-strategy': {
                        variants: ['aggressive', 'balanced', 'quality-focused'],
                        allocation: [0.3, 0.4, 0.3]
                    }
                }
            },

            ...options
        };

        this.cache = new Map();
        this.performanceData = new Map();
        this.intersectionObserver = null;
        this.loadQueue = new Set();
        this.abTestVariant = this.getABTestVariant();
        this.deviceCapabilities = this.detectDeviceCapabilities();

        this.init();
    }

    /**
     * Initialize the optimization system
     */
    async init() {
        try {
            // Initialize format support detection
            await this.detectFormatSupport();

            // Setup intersection observer for lazy loading
            this.setupIntersectionObserver();

            // Initialize connection monitoring
            this.setupConnectionMonitoring();

            // Setup performance monitoring
            this.setupPerformanceMonitoring();

            // Initialize preloading for critical images
            this.preloadCriticalImages();

            // Setup adaptive loading based on connection
            this.setupAdaptiveLoading();

            console.log('Image Optimization System initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Image Optimization System:', error);
            this.fallbackToBasicOptimization();
        }
    }

    /**
     * Detect browser support for next-gen image formats
     */
    async detectFormatSupport() {
        const formatSupport = {
            avif: false,
            webp: false,
            jpg: true // Always supported
        };

        // Test AVIF support
        try {
            const avifTest = await this.createTestImage('data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=');
            formatSupport.avif = avifTest;
        } catch (e) {
            formatSupport.avif = false;
        }

        // Test WebP support
        try {
            const webpTest = await this.createTestImage('data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA');
            formatSupport.webp = webpTest;
        } catch (e) {
            formatSupport.webp = false;
        }

        this.formatSupport = formatSupport;
        console.log('Format support detected:', formatSupport);
    }

    /**
     * Create test image to check format support
     */
    createTestImage(dataUrl) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = dataUrl;
        });
    }

    /**
     * Detect device capabilities
     */
    detectDeviceCapabilities() {
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };

        const devicePixelRatio = window.devicePixelRatio || 1;
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

        const capabilities = {
            viewport,
            devicePixelRatio,
            deviceType: this.getDeviceType(viewport.width),
            connection: {
                effectiveType: connection?.effectiveType || '4g',
                downlink: connection?.downlink || 10,
                rtt: connection?.rtt || 100,
                saveData: connection?.saveData || false
            },
            memory: navigator.deviceMemory || 4,
            cores: navigator.hardwareConcurrency || 4,
            reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
            darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches
        };

        console.log('Device capabilities:', capabilities);
        return capabilities;
    }

    /**
     * Get device type based on viewport width
     */
    getDeviceType(width) {
        if (width <= this.config.deviceTypes.mobile.maxWidth) return 'mobile';
        if (width <= this.config.deviceTypes.tablet.maxWidth) return 'tablet';
        return 'desktop';
    }

    /**
     * Setup intersection observer for intelligent lazy loading
     */
    setupIntersectionObserver() {
        const observerOptions = {
            root: null,
            rootMargin: this.config.lazyLoading.rootMargin,
            threshold: this.config.lazyLoading.threshold
        };

        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                    this.intersectionObserver.unobserve(entry.target);
                }
            });
        }, observerOptions);
    }

    /**
     * Setup connection monitoring for adaptive loading
     */
    setupConnectionMonitoring() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

        if (connection) {
            connection.addEventListener('change', () => {
                this.deviceCapabilities.connection = {
                    effectiveType: connection.effectiveType,
                    downlink: connection.downlink,
                    rtt: connection.rtt,
                    saveData: connection.saveData
                };

                this.adjustQualityBasedOnConnection();
            });
        }
    }

    /**
     * Setup performance monitoring with real user metrics
     */
    setupPerformanceMonitoring() {
        if (!this.config.monitoring.enabled) return;

        // Core Web Vitals monitoring
        this.monitorCoreWebVitals();

        // Image-specific metrics
        this.monitorImageMetrics();

        // Send metrics periodically
        setInterval(() => {
            this.sendPerformanceMetrics();
        }, 30000); // Every 30 seconds
    }

    /**
     * Monitor Core Web Vitals
     */
    monitorCoreWebVitals() {
        // Largest Contentful Paint (LCP)
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            this.recordMetric('LCP', lastEntry.startTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay (FID)
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            entries.forEach(entry => {
                this.recordMetric('FID', entry.processingStart - entry.startTime);
            });
        }).observe({ entryTypes: ['first-input'] });

        // Cumulative Layout Shift (CLS)
        let clsValue = 0;
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            entries.forEach(entry => {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                    this.recordMetric('CLS', clsValue);
                }
            });
        }).observe({ entryTypes: ['layout-shift'] });
    }

    /**
     * Monitor image-specific metrics
     */
    monitorImageMetrics() {
        // Image load times
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            entries.forEach(entry => {
                if (entry.initiatorType === 'img') {
                    this.recordMetric('ImageLoadTime', entry.responseEnd - entry.startTime);
                    this.recordMetric('ImageTransferSize', entry.transferSize);
                }
            });
        }).observe({ entryTypes: ['resource'] });
    }

    /**
     * Record performance metric
     */
    recordMetric(metric, value) {
        if (!this.performanceData.has(metric)) {
            this.performanceData.set(metric, []);
        }

        this.performanceData.get(metric).push({
            value,
            timestamp: Date.now(),
            deviceType: this.deviceCapabilities.deviceType,
            connection: this.deviceCapabilities.connection.effectiveType
        });
    }

    /**
     * Send performance metrics to analytics endpoint
     */
    async sendPerformanceMetrics() {
        if (Math.random() > this.config.monitoring.sampleRate) return;

        const metrics = {};

        this.performanceData.forEach((values, metric) => {
            if (values.length > 0) {
                metrics[metric] = {
                    avg: values.reduce((sum, v) => sum + v.value, 0) / values.length,
                    p50: this.percentile(values.map(v => v.value), 50),
                    p95: this.percentile(values.map(v => v.value), 95),
                    count: values.length
                };
            }
        });

        try {
            await fetch(this.config.monitoring.metricsEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    metrics,
                    deviceCapabilities: this.deviceCapabilities,
                    abTestVariant: this.abTestVariant,
                    timestamp: Date.now()
                })
            });

            // Clear collected metrics
            this.performanceData.clear();
        } catch (error) {
            console.warn('Failed to send performance metrics:', error);
        }
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
     * Get A/B test variant
     */
    getABTestVariant() {
        if (!this.config.abTesting.enabled) return null;

        const variants = {};

        Object.entries(this.config.abTesting.experiments).forEach(([experiment, config]) => {
            const random = Math.random();
            let cumulative = 0;

            for (let i = 0; i < config.variants.length; i++) {
                cumulative += config.allocation[i];
                if (random <= cumulative) {
                    variants[experiment] = config.variants[i];
                    break;
                }
            }
        });

        return variants;
    }

    /**
     * Optimize image based on device capabilities and A/B test variant
     */
    optimizeImage(src, options = {}) {
        const {
            width,
            height,
            quality,
            priority = 'medium',
            placeholder = true,
            alt = '',
            className = '',
            loading = 'lazy'
        } = options;

        // Determine optimal format based on support and A/B test
        const format = this.selectOptimalFormat();

        // Calculate optimal dimensions
        const dimensions = this.calculateOptimalDimensions(width, height);

        // Determine quality based on connection and device
        const optimalQuality = this.calculateOptimalQuality(quality);

        // Generate optimized URL
        const optimizedUrl = this.generateOptimizedUrl(src, {
            format,
            ...dimensions,
            quality: optimalQuality
        });

        return {
            src: optimizedUrl,
            srcset: this.generateSrcSet(src, dimensions, format, optimalQuality),
            sizes: this.generateSizes(dimensions),
            placeholder: placeholder ? this.generatePlaceholder(src, dimensions) : null,
            loading,
            alt,
            className: `${className} image-optimized`,
            'data-priority': priority
        };
    }

    /**
     * Select optimal image format
     */
    selectOptimalFormat() {
        const variant = this.abTestVariant?.['format-preference'] || 'smart-detection';

        switch (variant) {
            case 'avif-first':
                return this.formatSupport.avif ? 'avif' :
                       this.formatSupport.webp ? 'webp' : 'jpg';

            case 'webp-first':
                return this.formatSupport.webp ? 'webp' : 'jpg';

            case 'smart-detection':
            default:
                // Smart detection based on image type and device capabilities
                if (this.deviceCapabilities.connection.saveData) {
                    return 'jpg'; // Use most compatible format on data saver
                }

                if (this.formatSupport.avif &&
                    this.deviceCapabilities.connection.effectiveType !== 'slow-2g') {
                    return 'avif';
                }

                return this.formatSupport.webp ? 'webp' : 'jpg';
        }
    }

    /**
     * Calculate optimal dimensions based on device and viewport
     */
    calculateOptimalDimensions(requestedWidth, requestedHeight) {
        const { viewport, devicePixelRatio, deviceType } = this.deviceCapabilities;

        let optimalWidth = requestedWidth;
        let optimalHeight = requestedHeight;

        // Adjust for device pixel ratio
        if (devicePixelRatio > 1 && !this.deviceCapabilities.connection.saveData) {
            optimalWidth = Math.round(optimalWidth * Math.min(devicePixelRatio, 2));
            optimalHeight = Math.round(optimalHeight * Math.min(devicePixelRatio, 2));
        }

        // Constrain to viewport on mobile
        if (deviceType === 'mobile') {
            const maxWidth = viewport.width * 0.9;
            if (optimalWidth > maxWidth) {
                const ratio = maxWidth / optimalWidth;
                optimalWidth = Math.round(maxWidth);
                optimalHeight = Math.round(optimalHeight * ratio);
            }
        }

        return {
            width: optimalWidth,
            height: optimalHeight,
            originalWidth: requestedWidth,
            originalHeight: requestedHeight
        };
    }

    /**
     * Calculate optimal quality based on connection and A/B test
     */
    calculateOptimalQuality(requestedQuality) {
        const variant = this.abTestVariant?.['compression-strategy'] || 'balanced';
        const connection = this.deviceCapabilities.connection;

        let baseQuality = requestedQuality || 80;

        // Adjust based on A/B test variant
        switch (variant) {
            case 'aggressive':
                baseQuality *= 0.8;
                break;
            case 'quality-focused':
                baseQuality *= 1.1;
                break;
            case 'balanced':
            default:
                // Keep base quality
                break;
        }

        // Adjust based on connection
        if (connection.saveData) {
            baseQuality *= 0.6;
        } else if (connection.effectiveType === 'slow-2g') {
            baseQuality *= 0.7;
        } else if (connection.effectiveType === '2g') {
            baseQuality *= 0.8;
        } else if (connection.effectiveType === '3g') {
            baseQuality *= 0.9;
        }

        return Math.max(30, Math.min(95, Math.round(baseQuality)));
    }

    /**
     * Generate optimized URL with CDN and fallbacks
     */
    generateOptimizedUrl(src, options) {
        const { format, width, height, quality } = options;

        // Use image optimization service
        const params = new URLSearchParams({
            url: encodeURIComponent(src),
            w: width,
            h: height,
            q: quality,
            f: format,
            auto: 'compress,format',
            fit: 'crop',
            dpr: Math.min(this.deviceCapabilities.devicePixelRatio, 2)
        });

        return `${this.config.cdnConfig.imageProxy}/optimize?${params}`;
    }

    /**
     * Generate responsive srcset
     */
    generateSrcSet(src, dimensions, format, quality) {
        const { width } = dimensions;
        const breakpoints = [0.5, 1, 1.5, 2];

        return breakpoints.map(multiplier => {
            const scaledWidth = Math.round(width * multiplier);
            const scaledHeight = Math.round(dimensions.height * multiplier);

            const url = this.generateOptimizedUrl(src, {
                format,
                width: scaledWidth,
                height: scaledHeight,
                quality
            });

            return `${url} ${scaledWidth}w`;
        }).join(', ');
    }

    /**
     * Generate sizes attribute
     */
    generateSizes(dimensions) {
        const { deviceType } = this.deviceCapabilities;
        const { originalWidth } = dimensions;

        switch (deviceType) {
            case 'mobile':
                return `(max-width: 768px) 100vw, ${originalWidth}px`;
            case 'tablet':
                return `(max-width: 1024px) 50vw, ${originalWidth}px`;
            default:
                return `${originalWidth}px`;
        }
    }

    /**
     * Generate low-quality placeholder
     */
    generatePlaceholder(src, dimensions) {
        const placeholderParams = new URLSearchParams({
            url: encodeURIComponent(src),
            w: Math.round(dimensions.width * 0.1),
            h: Math.round(dimensions.height * 0.1),
            q: this.config.lazyLoading.placeholderQuality,
            blur: 5,
            f: 'jpg'
        });

        return `${this.config.cdnConfig.imageProxy}/optimize?${placeholderParams}`;
    }

    /**
     * Preload critical images
     */
    async preloadCriticalImages() {
        const criticalSelectors = [
            '[data-priority="critical"]',
            '.trending-slider img',
            '.hero-image',
            '[data-preload="true"]'
        ];

        const criticalImages = document.querySelectorAll(criticalSelectors.join(', '));

        const preloadPromises = Array.from(criticalImages).map(img => {
            return this.preloadImage(img.src || img.dataset.src);
        });

        try {
            await Promise.all(preloadPromises);
            console.log(`Preloaded ${preloadPromises.length} critical images`);
        } catch (error) {
            console.warn('Some critical images failed to preload:', error);
        }
    }

    /**
     * Preload individual image
     */
    preloadImage(src) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = src;
            link.onload = resolve;
            link.onerror = reject;

            document.head.appendChild(link);
        });
    }

    /**
     * Setup adaptive loading based on connection changes
     */
    setupAdaptiveLoading() {
        // Monitor connection changes
        window.addEventListener('online', () => {
            this.resumeImageLoading();
        });

        window.addEventListener('offline', () => {
            this.pauseImageLoading();
        });

        // Monitor viewport changes
        window.addEventListener('resize', this.debounce(() => {
            this.deviceCapabilities = this.detectDeviceCapabilities();
            this.adjustQualityBasedOnConnection();
        }, 250));
    }

    /**
     * Adjust image quality based on current connection
     */
    adjustQualityBasedOnConnection() {
        const images = document.querySelectorAll('img[data-adaptive="true"]');

        images.forEach(img => {
            if (img.dataset.originalSrc) {
                const newSrc = this.optimizeImage(img.dataset.originalSrc, {
                    width: img.width,
                    height: img.height
                }).src;

                img.src = newSrc;
            }
        });
    }

    /**
     * Load image with intersection observer
     */
    async loadImage(img) {
        if (img.dataset.loaded === 'true') return;

        const startTime = performance.now();

        try {
            // Show placeholder if available
            if (img.dataset.placeholder) {
                img.src = img.dataset.placeholder;
                img.style.filter = 'blur(5px)';
            }

            // Load actual image
            const actualSrc = img.dataset.src || img.src;
            await this.loadImageAsync(actualSrc, img);

            // Fade in effect
            img.style.transition = `filter ${this.config.lazyLoading.fadeInDuration}ms ease`;
            img.style.filter = 'none';

            img.dataset.loaded = 'true';

            // Record load time
            const loadTime = performance.now() - startTime;
            this.recordMetric('LazyImageLoadTime', loadTime);

        } catch (error) {
            console.warn('Failed to load image:', img.src, error);
            this.handleImageError(img);
        }
    }

    /**
     * Load image asynchronously
     */
    loadImageAsync(src, targetImg) {
        return new Promise((resolve, reject) => {
            const img = new Image();

            img.onload = () => {
                targetImg.src = src;
                if (targetImg.srcset) {
                    targetImg.srcset = targetImg.dataset.srcset;
                }
                resolve();
            };

            img.onerror = reject;
            img.src = src;
        });
    }

    /**
     * Handle image load errors with graceful fallback
     */
    handleImageError(img) {
        // Try fallback CDN
        if (img.dataset.fallbackSrc) {
            img.src = img.dataset.fallbackSrc;
            return;
        }

        // Use default placeholder
        img.src = this.generateDefaultPlaceholder();
        img.classList.add('image-error');
    }

    /**
     * Generate default placeholder for failed images
     */
    generateDefaultPlaceholder() {
        // SVG placeholder
        const svg = `
            <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="#f3f4f6"/>
                <text x="50%" y="50%" text-anchor="middle" dy=".3em"
                      font-family="Arial" font-size="14" fill="#9ca3af">
                    画像が読み込めませんでした
                </text>
            </svg>
        `;

        return `data:image/svg+xml;base64,${btoa(svg)}`;
    }

    /**
     * Resume image loading (e.g., when back online)
     */
    resumeImageLoading() {
        const pendingImages = document.querySelectorAll('img[data-src]:not([data-loaded="true"])');

        pendingImages.forEach(img => {
            this.intersectionObserver.observe(img);
        });
    }

    /**
     * Pause image loading (e.g., when offline)
     */
    pauseImageLoading() {
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
            this.setupIntersectionObserver();
        }
    }

    /**
     * Debounce utility function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Fallback to basic optimization when advanced features fail
     */
    fallbackToBasicOptimization() {
        console.warn('Falling back to basic image optimization');

        // Basic lazy loading without intersection observer
        window.addEventListener('scroll', this.debounce(() => {
            const images = document.querySelectorAll('img[data-src]');

            images.forEach(img => {
                const rect = img.getBoundingClientRect();
                if (rect.top < window.innerHeight + 100) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                }
            });
        }, 100));
    }

    /**
     * Public API for manual image optimization
     */
    createOptimizedImage(src, options = {}) {
        const optimized = this.optimizeImage(src, options);

        const img = document.createElement('img');
        Object.entries(optimized).forEach(([key, value]) => {
            if (value !== null) {
                if (key.startsWith('data-')) {
                    img.setAttribute(key, value);
                } else {
                    img[key] = value;
                }
            }
        });

        // Setup lazy loading if not critical
        if (options.priority !== 'critical') {
            img.setAttribute('data-src', optimized.src);
            img.src = optimized.placeholder || this.generateDefaultPlaceholder();
            this.intersectionObserver.observe(img);
        }

        return img;
    }

    /**
     * Get performance summary
     */
    getPerformanceSummary() {
        const summary = {};

        this.performanceData.forEach((values, metric) => {
            if (values.length > 0) {
                const nums = values.map(v => v.value);
                summary[metric] = {
                    count: values.length,
                    avg: nums.reduce((a, b) => a + b, 0) / nums.length,
                    min: Math.min(...nums),
                    max: Math.max(...nums),
                    p95: this.percentile(nums, 95)
                };
            }
        });

        return summary;
    }
}

// Initialize global image optimization system
window.ImageOptimizer = new ImageOptimizationSystem({
    // Configuration can be overridden here
    monitoring: {
        enabled: true,
        sampleRate: 0.1,
        metricsEndpoint: '/api/image-metrics'
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImageOptimizationSystem;
}
