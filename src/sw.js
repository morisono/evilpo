/**
 * Advanced Image Optimization Service Worker
 * Handles caching, offline support, and intelligent image delivery
 */

const CACHE_VERSION = 'v1.2.0';
const CACHE_NAMES = {
    images: `images-${CACHE_VERSION}`,
    static: `static-${CACHE_VERSION}`,
    dynamic: `dynamic-${CACHE_VERSION}`,
    optimized: `optimized-images-${CACHE_VERSION}`
};

const MAX_CACHE_SIZE = {
    images: 50 * 1024 * 1024, // 50MB for images
    optimized: 100 * 1024 * 1024, // 100MB for optimized images
    static: 10 * 1024 * 1024, // 10MB for static assets
    dynamic: 25 * 1024 * 1024 // 25MB for dynamic content
};

const CACHE_EXPIRY = {
    images: 7 * 24 * 60 * 60 * 1000, // 7 days
    optimized: 30 * 24 * 60 * 60 * 1000, // 30 days
    static: 24 * 60 * 60 * 1000, // 1 day
    dynamic: 2 * 60 * 60 * 1000 // 2 hours
};

const IMAGE_FORMATS = ['avif', 'webp', 'jpg', 'jpeg', 'png', 'gif', 'svg'];
const CDN_DOMAINS = ['cdn.example.com', 'images.example.com', 'cdn2.example.com'];

class ImageOptimizationSW {
    constructor() {
        this.deviceCapabilities = null;
        this.connectionType = null;
        this.installPromise = null;
    }

    /**
     * Initialize service worker
     */
    async init() {
        // Detect device capabilities
        await this.detectCapabilities();

        // Setup event listeners
        this.setupEventListeners();

        console.log('Image Optimization Service Worker initialized');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        self.addEventListener('install', (event) => {
            console.log('Service Worker installing...');
            event.waitUntil(this.handleInstall());
        });

        self.addEventListener('activate', (event) => {
            console.log('Service Worker activating...');
            event.waitUntil(this.handleActivate());
        });

        self.addEventListener('fetch', (event) => {
            if (this.shouldHandleRequest(event.request)) {
                event.respondWith(this.handleFetch(event.request));
            }
        });

        self.addEventListener('message', (event) => {
            this.handleMessage(event);
        });

        // Handle background sync for image optimization
        self.addEventListener('sync', (event) => {
            if (event.tag === 'image-optimization') {
                event.waitUntil(this.optimizeQueuedImages());
            }
        });
    }

    /**
     * Handle service worker installation
     */
    async handleInstall() {
        // Cache critical static assets
        const staticCache = await caches.open(CACHE_NAMES.static);

        const criticalAssets = [
            '/src/js/image-optimization.js',
            '/src/css/image-optimization.css',
            // Add other critical assets
        ];

        await staticCache.addAll(criticalAssets);

        // Skip waiting to activate immediately
        self.skipWaiting();
    }

    /**
     * Handle service worker activation
     */
    async handleActivate() {
        // Clean up old caches
        await this.cleanupOldCaches();

        // Claim all clients
        await self.clients.claim();

        console.log('Service Worker activated and ready');
    }

    /**
     * Clean up old cache versions
     */
    async cleanupOldCaches() {
        const cacheNames = await caches.keys();
        const currentCaches = Object.values(CACHE_NAMES);

        const deletionPromises = cacheNames
            .filter(cacheName => !currentCaches.includes(cacheName))
            .map(cacheName => caches.delete(cacheName));

        await Promise.all(deletionPromises);
        console.log('Old caches cleaned up');
    }

    /**
     * Determine if request should be handled by service worker
     */
    shouldHandleRequest(request) {
        const url = new URL(request.url);

        // Handle image requests
        if (this.isImageRequest(request)) {
            return true;
        }

        // Handle CDN requests
        if (CDN_DOMAINS.some(domain => url.hostname.includes(domain))) {
            return true;
        }

        // Handle same-origin requests
        if (url.origin === self.location.origin) {
            return true;
        }

        return false;
    }

    /**
     * Check if request is for an image
     */
    isImageRequest(request) {
        const url = new URL(request.url);
        const pathname = url.pathname.toLowerCase();

        // Check file extension
        const hasImageExtension = IMAGE_FORMATS.some(format =>
            pathname.endsWith(`.${format}`)
        );

        // Check content type
        const acceptsImages = request.headers.get('accept')?.includes('image/');

        return hasImageExtension || acceptsImages;
    }

    /**
     * Handle fetch requests with intelligent caching
     */
    async handleFetch(request) {
        try {
            if (this.isImageRequest(request)) {
                return await this.handleImageRequest(request);
            } else {
                return await this.handleStaticRequest(request);
            }
        } catch (error) {
            console.error('Fetch error:', error);
            return await this.handleFallback(request);
        }
    }

    /**
     * Handle image requests with optimization
     */
    async handleImageRequest(request) {
        const url = new URL(request.url);
        const cacheKey = this.generateCacheKey(request);

        // Try optimized cache first
        const optimizedCache = await caches.open(CACHE_NAMES.optimized);
        let cachedResponse = await optimizedCache.match(cacheKey);

        if (cachedResponse && !this.isExpired(cachedResponse)) {
            console.log('Serving optimized image from cache:', url.href);
            return cachedResponse;
        }

        // Try regular image cache
        const imageCache = await caches.open(CACHE_NAMES.images);
        cachedResponse = await imageCache.match(request);

        if (cachedResponse && !this.isExpired(cachedResponse)) {
            // Optimize and cache in background
            this.optimizeImageInBackground(request, cachedResponse);
            return cachedResponse;
        }

        // Fetch with network strategy based on connection
        return await this.fetchImageWithStrategy(request);
    }

    /**
     * Fetch image with connection-aware strategy
     */
    async fetchImageWithStrategy(request) {
        const url = new URL(request.url);

        // Detect current connection
        await this.detectCapabilities();

        try {
            // Apply connection-based timeout
            const timeout = this.getTimeoutForConnection();
            const controller = new AbortController();

            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const optimizedRequest = await this.optimizeRequest(request);
            const response = await fetch(optimizedRequest, {
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                // Cache successful response
                await this.cacheResponse(request, response.clone());
                return response;
            } else {
                throw new Error(`HTTP ${response.status}`);
            }

        } catch (error) {
            console.warn('Network fetch failed:', error.message);

            // Try fallback CDN
            const fallbackResponse = await this.tryFallbackCDN(request);
            if (fallbackResponse) {
                return fallbackResponse;
            }

            // Return placeholder or cached version
            return await this.handleImageFallback(request);
        }
    }

    /**
     * Optimize request based on device capabilities
     */
    async optimizeRequest(request) {
        const url = new URL(request.url);

        // Don't modify already optimized URLs
        if (url.searchParams.has('optimized')) {
            return request;
        }

        // Add optimization parameters
        const params = new URLSearchParams();

        // Format selection
        const supportedFormat = await this.getBestFormat();
        if (supportedFormat) {
            params.set('f', supportedFormat);
        }

        // Quality adjustment
        const quality = this.getOptimalQuality();
        params.set('q', quality);

        // Compression
        params.set('auto', 'compress,format');

        // Device pixel ratio
        if (this.deviceCapabilities?.dpr > 1) {
            params.set('dpr', Math.min(this.deviceCapabilities.dpr, 2));
        }

        // Connection-based optimizations
        if (this.connectionType === 'slow-2g' || this.connectionType === '2g') {
            params.set('q', Math.max(30, quality * 0.7));
        }

        // Append optimization parameters
        url.search = params.toString();

        return new Request(url.href, {
            method: request.method,
            headers: request.headers,
            mode: request.mode,
            credentials: request.credentials,
            cache: request.cache,
            redirect: request.redirect,
            referrer: request.referrer
        });
    }

    /**
     * Get best supported image format
     */
    async getBestFormat() {
        // This would be populated by the main thread
        const formatSupport = await this.getFormatSupport();

        if (formatSupport.avif) return 'avif';
        if (formatSupport.webp) return 'webp';
        return 'jpg';
    }

    /**
     * Get format support from main thread
     */
    async getFormatSupport() {
        return new Promise((resolve) => {
            // Send message to main thread to check format support
            self.clients.matchAll().then(clients => {
                if (clients.length > 0) {
                    clients[0].postMessage({
                        type: 'GET_FORMAT_SUPPORT'
                    });

                    // Listen for response
                    const handler = (event) => {
                        if (event.data.type === 'FORMAT_SUPPORT_RESPONSE') {
                            resolve(event.data.formatSupport);
                            self.removeEventListener('message', handler);
                        }
                    };

                    self.addEventListener('message', handler);
                } else {
                    // Fallback to conservative format support
                    resolve({ avif: false, webp: true, jpg: true });
                }
            });
        });
    }

    /**
     * Get optimal quality based on connection and device
     */
    getOptimalQuality() {
        let baseQuality = 75;

        if (this.connectionType === 'slow-2g') {
            baseQuality = 50;
        } else if (this.connectionType === '2g') {
            baseQuality = 60;
        } else if (this.connectionType === '3g') {
            baseQuality = 70;
        } else if (this.connectionType === '4g') {
            baseQuality = 80;
        }

        return baseQuality;
    }

    /**
     * Get timeout based on connection type
     */
    getTimeoutForConnection() {
        switch (this.connectionType) {
            case 'slow-2g': return 8000;
            case '2g': return 6000;
            case '3g': return 4000;
            case '4g': return 2000;
            default: return 3000;
        }
    }

    /**
     * Try fallback CDN domains
     */
    async tryFallbackCDN(request) {
        const url = new URL(request.url);
        const fallbackDomains = CDN_DOMAINS.filter(domain =>
            !url.hostname.includes(domain)
        );

        for (const domain of fallbackDomains) {
            try {
                const fallbackUrl = new URL(url.href);
                fallbackUrl.hostname = domain;

                const fallbackRequest = new Request(fallbackUrl.href, {
                    method: request.method,
                    headers: request.headers,
                    mode: 'cors'
                });

                const response = await fetch(fallbackRequest);

                if (response.ok) {
                    console.log('Fallback CDN successful:', domain);
                    await this.cacheResponse(request, response.clone());
                    return response;
                }
            } catch (error) {
                console.warn(`Fallback CDN ${domain} failed:`, error.message);
            }
        }

        return null;
    }

    /**
     * Handle image fallback when all else fails
     */
    async handleImageFallback(request) {
        // Try to find any cached version
        const allCaches = await caches.keys();

        for (const cacheName of allCaches) {
            const cache = await caches.open(cacheName);
            const cachedResponse = await cache.match(request);

            if (cachedResponse) {
                console.log('Serving expired cached image:', request.url);
                return cachedResponse;
            }
        }

        // Return placeholder SVG
        return new Response(this.generatePlaceholderSVG(), {
            headers: {
                'Content-Type': 'image/svg+xml',
                'Cache-Control': 'no-cache'
            }
        });
    }

    /**
     * Generate placeholder SVG
     */
    generatePlaceholderSVG() {
        return `
            <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="#f3f4f6"/>
                <text x="50%" y="50%" text-anchor="middle" dy=".3em"
                      font-family="Arial" font-size="14" fill="#9ca3af">
                    画像を読み込めません
                </text>
            </svg>
        `;
    }

    /**
     * Handle static resource requests
     */
    async handleStaticRequest(request) {
        const cache = await caches.open(CACHE_NAMES.static);
        const cachedResponse = await cache.match(request);

        if (cachedResponse && !this.isExpired(cachedResponse)) {
            return cachedResponse;
        }

        try {
            const response = await fetch(request);

            if (response.ok) {
                await this.cacheResponse(request, response.clone(), CACHE_NAMES.static);
                return response;
            }

            return cachedResponse || response;
        } catch (error) {
            return cachedResponse || new Response('Network Error', { status: 503 });
        }
    }

    /**
     * Cache response with size management
     */
    async cacheResponse(request, response, cacheName = null) {
        if (!response || !response.ok) return;

        const cacheToUse = cacheName || (this.isImageRequest(request) ?
            CACHE_NAMES.images : CACHE_NAMES.dynamic);

        const cache = await caches.open(cacheToUse);

        // Add timestamp for expiry checking
        const responseWithTimestamp = new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: {
                ...Object.fromEntries(response.headers.entries()),
                'sw-cached-at': Date.now().toString()
            }
        });

        await cache.put(request, responseWithTimestamp);

        // Manage cache size
        await this.manageCacheSize(cacheToUse);
    }

    /**
     * Manage cache size by removing old entries
     */
    async manageCacheSize(cacheName) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();

        const maxSize = MAX_CACHE_SIZE[cacheName.split('-')[0]] || 50 * 1024 * 1024;
        let currentSize = 0;

        // Calculate current cache size (estimation)
        const responses = await Promise.all(
            requests.map(request => cache.match(request))
        );

        const responseData = responses
            .filter(response => response)
            .map((response, index) => ({
                request: requests[index],
                response,
                size: parseInt(response.headers.get('content-length')) || 1024,
                cachedAt: parseInt(response.headers.get('sw-cached-at')) || 0
            }))
            .sort((a, b) => a.cachedAt - b.cachedAt); // Oldest first

        currentSize = responseData.reduce((sum, item) => sum + item.size, 0);

        // Remove oldest entries if over size limit
        while (currentSize > maxSize && responseData.length > 0) {
            const oldest = responseData.shift();
            await cache.delete(oldest.request);
            currentSize -= oldest.size;
        }
    }

    /**
     * Check if cached response is expired
     */
    isExpired(response) {
        const cachedAt = parseInt(response.headers.get('sw-cached-at'));
        if (!cachedAt) return false;

        const now = Date.now();
        const age = now - cachedAt;

        // Determine expiry based on content type
        let maxAge = CACHE_EXPIRY.dynamic;

        if (this.isImageRequest({ url: response.url })) {
            maxAge = CACHE_EXPIRY.images;
        }

        return age > maxAge;
    }

    /**
     * Generate cache key for request
     */
    generateCacheKey(request) {
        const url = new URL(request.url);

        // Include relevant parameters in cache key
        const relevantParams = ['w', 'h', 'q', 'f', 'dpr', 'auto'];
        const params = new URLSearchParams();

        relevantParams.forEach(param => {
            if (url.searchParams.has(param)) {
                params.set(param, url.searchParams.get(param));
            }
        });

        // Add device capabilities to cache key
        if (this.deviceCapabilities) {
            params.set('device', this.deviceCapabilities.deviceType);
            params.set('dpr', this.deviceCapabilities.dpr.toString());
        }

        url.search = params.toString();
        return url.href;
    }

    /**
     * Detect device capabilities
     */
    async detectCapabilities() {
        // This would typically be sent from the main thread
        // For now, we'll make reasonable assumptions
        this.deviceCapabilities = {
            deviceType: 'desktop',
            dpr: 1,
            connection: {
                effectiveType: '4g',
                downlink: 10,
                rtt: 100
            }
        };

        this.connectionType = this.deviceCapabilities.connection.effectiveType;
    }

    /**
     * Optimize image in background
     */
    async optimizeImageInBackground(request, response) {
        // Register background sync
        try {
            await self.registration.sync.register('image-optimization');
        } catch (error) {
            // Fallback: optimize immediately
            await this.processImageOptimization(request, response);
        }
    }

    /**
     * Process queued image optimizations
     */
    async optimizeQueuedImages() {
        // This would process a queue of images for optimization
        console.log('Processing queued image optimizations');
    }

    /**
     * Handle messages from main thread
     */
    handleMessage(event) {
        const { data } = event;

        switch (data.type) {
            case 'UPDATE_DEVICE_CAPABILITIES':
                this.deviceCapabilities = data.capabilities;
                this.connectionType = data.capabilities.connection.effectiveType;
                break;

            case 'CLEAR_IMAGE_CACHE':
                this.clearImageCache();
                break;

            case 'GET_CACHE_STATS':
                this.sendCacheStats(event.ports[0]);
                break;

            case 'PRELOAD_IMAGES':
                this.preloadImages(data.urls);
                break;
        }
    }

    /**
     * Clear image cache
     */
    async clearImageCache() {
        const imageCache = await caches.open(CACHE_NAMES.images);
        const optimizedCache = await caches.open(CACHE_NAMES.optimized);

        await Promise.all([
            imageCache.keys().then(keys => Promise.all(keys.map(key => imageCache.delete(key)))),
            optimizedCache.keys().then(keys => Promise.all(keys.map(key => optimizedCache.delete(key))))
        ]);

        console.log('Image cache cleared');
    }

    /**
     * Send cache statistics
     */
    async sendCacheStats(port) {
        const stats = {};

        for (const [name, cacheName] of Object.entries(CACHE_NAMES)) {
            const cache = await caches.open(cacheName);
            const keys = await cache.keys();

            stats[name] = {
                count: keys.length,
                size: 0 // Size calculation would be more complex
            };
        }

        port.postMessage({ type: 'CACHE_STATS', stats });
    }

    /**
     * Preload images
     */
    async preloadImages(urls) {
        const preloadPromises = urls.map(async (url) => {
            try {
                const request = new Request(url);
                const optimizedRequest = await this.optimizeRequest(request);
                const response = await fetch(optimizedRequest);

                if (response.ok) {
                    await this.cacheResponse(request, response);
                }
            } catch (error) {
                console.warn('Failed to preload image:', url, error);
            }
        });

        await Promise.all(preloadPromises);
        console.log(`Preloaded ${urls.length} images`);
    }

    /**
     * Handle fallback when optimization fails
     */
    async handleFallback(request) {
        // Try to serve from cache
        const allCaches = await caches.keys();

        for (const cacheName of allCaches) {
            const cache = await caches.open(cacheName);
            const cachedResponse = await cache.match(request);

            if (cachedResponse) {
                return cachedResponse;
            }
        }

        // Return error response
        return new Response('Resource not available', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

// Initialize the service worker
const imageOptimizationSW = new ImageOptimizationSW();
imageOptimizationSW.init();
