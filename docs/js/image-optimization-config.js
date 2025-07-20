/**
 * Image Optimization Configuration
 * Central configuration for all image optimization features
 */

window.ImageOptimizationConfig = {
    // Global settings
    enabled: true,
    debug: false,

    // CDN Configuration
    cdn: {
        primary: 'https://cdn.example.com',
        fallbacks: [
            'https://cdn2.example.com',
            'https://cdn3.example.com'
        ],
        imageProxy: 'https://images.example.com',
        optimizationEndpoint: '/api/v1/image-optimize'
    },

    // Format Support Detection
    formats: {
        avif: {
            quality: 65,
            supportTest: 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A='
        },
        webp: {
            quality: 75,
            supportTest: 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'
        },
        jpg: {
            quality: 85,
            supportTest: null // Always supported
        }
    },

    // Device Detection
    deviceBreakpoints: {
        mobile: 768,
        tablet: 1024,
        desktop: 1920
    },

    // Connection Awareness
    connectionTypes: {
        'slow-2g': { qualityMultiplier: 0.6, timeout: 8000 },
        '2g': { qualityMultiplier: 0.7, timeout: 6000 },
        '3g': { qualityMultiplier: 0.8, timeout: 4000 },
        '4g': { qualityMultiplier: 1.0, timeout: 2000 }
    },

    // Lazy Loading Settings
    lazyLoading: {
        enabled: true,
        rootMargin: '50px 0px',
        threshold: 0.1,
        placeholderQuality: 10,
        fadeInDuration: 300,
        retryAttempts: 3,
        retryDelay: 1000
    },

    // Preloading Configuration
    preloading: {
        critical: {
            enabled: true,
            selectors: [
                '[data-priority="critical"]',
                '.trending-slider img',
                '.hero-image',
                '[data-preload="true"]'
            ]
        },
        prefetch: {
            enabled: true,
            mouseHoverDelay: 200,
            scrollVelocityThreshold: 50
        }
    },

    // Caching Strategy
    caching: {
        serviceworker: {
            enabled: true,
            maxAge: {
                images: 7 * 24 * 60 * 60 * 1000, // 7 days
                optimized: 30 * 24 * 60 * 60 * 1000, // 30 days
                static: 24 * 60 * 60 * 1000, // 1 day
                dynamic: 2 * 60 * 60 * 1000 // 2 hours
            },
            maxSize: {
                images: 50 * 1024 * 1024, // 50MB
                optimized: 100 * 1024 * 1024, // 100MB
                static: 10 * 1024 * 1024, // 10MB
                dynamic: 25 * 1024 * 1024 // 25MB
            }
        },
        browser: {
            enabled: true,
            memoryLimit: 50 * 1024 * 1024 // 50MB
        }
    },

    // Performance Monitoring
    monitoring: {
        enabled: true,
        sampleRate: 0.1, // 10% of users
        endpoint: '/api/performance-metrics',
        realTimeDisplay: false,
        thresholds: {
            LCP: { good: 2500, poor: 4000 },
            FID: { good: 100, poor: 300 },
            CLS: { good: 0.1, poor: 0.25 },
            imageLoad: { good: 1000, poor: 3000 },
            totalImageSize: { good: 1024 * 1024, poor: 5 * 1024 * 1024 }
        }
    },

    // A/B Testing
    abTesting: {
        enabled: true,
        endpoint: '/api/ab-test-data',
        experiments: {
            'format-preference': {
                enabled: true,
                variants: {
                    'avif-first': 0.3,
                    'webp-first': 0.4,
                    'smart-detection': 0.3
                }
            },
            'compression-strategy': {
                enabled: true,
                variants: {
                    'aggressive': 0.3,
                    'balanced': 0.4,
                    'quality-focused': 0.3
                }
            },
            'lazy-loading-strategy': {
                enabled: true,
                variants: {
                    'intersection-observer': 0.4,
                    'scroll-based': 0.2,
                    'predictive': 0.4
                }
            }
        }
    },

    // Error Handling
    errorHandling: {
        fallbackImage: '/images/placeholder.svg',
        retryAttempts: 3,
        retryDelay: 1000,
        timeoutDuration: 10000,
        gracefulDegradation: true
    },

    // Responsive Images
    responsive: {
        breakpoints: [480, 768, 1024, 1200, 1600],
        densities: [1, 1.5, 2],
        formats: ['avif', 'webp', 'jpg'],
        sizes: {
            mobile: '100vw',
            tablet: '50vw',
            desktop: '33vw'
        }
    },

    // Accessibility
    accessibility: {
        altTextRequired: true,
        focusIndicators: true,
        reducedMotionSupport: true,
        highContrastSupport: true
    },

    // Development Tools
    development: {
        showFormatIndicators: false,
        showPerformanceOverlay: false,
        showOptimizationBadges: false,
        logOptimizations: true,
        bypassOptimizations: false
    }
};

// Initialize optimization system with configuration
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Image Optimization System...');

    // Initialize in order of dependency
    if (window.ImageOptimizer) {
        window.ImageOptimizer.updateConfig(window.ImageOptimizationConfig);
    }

    if (window.PerformanceMonitor) {
        window.PerformanceMonitor.updateConfig(window.ImageOptimizationConfig.monitoring);
    }

    if (window.ImageOptimizationABTesting) {
        window.ImageOptimizationABTesting.updateConfig(window.ImageOptimizationConfig.abTesting);
    }

    // Setup development tools
    if (window.ImageOptimizationConfig.development.showPerformanceOverlay && window.PerformanceMonitor) {
        window.PerformanceMonitor.startRealTimeMonitoring();
    }

    // Setup keyboard shortcuts for development
    if (window.ImageOptimizationConfig.debug) {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey) {
                switch (e.key) {
                    case 'P': // Toggle performance overlay
                        e.preventDefault();
                        if (window.PerformanceMonitor) {
                            window.PerformanceMonitor.startRealTimeMonitoring();
                        }
                        break;
                    case 'C': // Clear image cache
                        e.preventDefault();
                        if ('caches' in window) {
                            caches.keys().then(names => {
                                names.forEach(name => {
                                    if (name.includes('images') || name.includes('optimized')) {
                                        caches.delete(name);
                                    }
                                });
                            });
                        }
                        console.log('Image cache cleared');
                        break;
                    case 'A': // Show A/B test info
                        e.preventDefault();
                        if (window.ImageOptimizationABTesting) {
                            console.log('A/B Test Assignments:', window.ImageOptimizationABTesting.getUserAssignments());
                        }
                        break;
                }
            }
        });
    }

    console.log('Image Optimization System initialized');
});

// Export configuration for other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.ImageOptimizationConfig;
}
