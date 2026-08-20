export const GA_MEASUREMENT_ID = 'G-MN734C17SF';

const SENSITIVE_KEY_PATTERN = /(email|phone|whatsapp|mobile|name|password|token|secret|key|pan|aadhaar|gstin|card|bank|upi|razorpay|signature|document|tax_return|client)/i;
const SAFE_PARAM_KEYS = new Set([
  'activation_type',
  'cta_name',
  'failure_stage',
  'feature_name',
  'method',
  'page_name',
  'payment_method',
  'plan_name',
  'source',
]);
const EMAIL_PATTERN = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const PHONE_PATTERN = /(?:\+?91[-\s]?)?[6-9]\d{9}/;
const PAN_PATTERN = /\b[A-Z]{5}[0-9]{4}[A-Z]\b/i;
const AADHAAR_PATTERN = /\b\d{4}\s?\d{4}\s?\d{4}\b/;
const GSTIN_PATTERN = /\b[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]\b/i;

let initialized = false;
let lastPageView = { key: '', at: 0 };

const isBrowser = () => typeof window !== 'undefined' && typeof document !== 'undefined';

const gtag = (...args) => {
  if (!isBrowser()) return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(args);
};

export const sanitizePath = (path = '/') => {
  const cleanPath = String(path).split(/[?#]/)[0] || '/';
  return cleanPath
    .replace(/^\/ca\/[^/]+/i, '/ca/:slug')
    .replace(/^\/admin\/users\/[^/]+/i, '/admin/users/:id');
};

const isSensitiveValue = (value) => {
  if (typeof value !== 'string') return false;
  return (
    EMAIL_PATTERN.test(value) ||
    PHONE_PATTERN.test(value) ||
    PAN_PATTERN.test(value) ||
    AADHAAR_PATTERN.test(value) ||
    GSTIN_PATTERN.test(value)
  );
};

export const sanitizeEventParams = (params = {}) => Object.entries(params).reduce((safe, [key, value]) => {
  if ((!SAFE_PARAM_KEYS.has(key) && SENSITIVE_KEY_PATTERN.test(key)) || value === undefined || value === null || isSensitiveValue(value)) {
    return safe;
  }

  if (typeof value === 'string') {
    safe[key] = value.slice(0, 100);
  } else if (typeof value === 'number' || typeof value === 'boolean') {
    safe[key] = value;
  }

  return safe;
}, {});

export const initializeAnalytics = () => {
  if (!isBrowser() || initialized) return;

  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = gtag;
  }

  // If GA is already loaded from the <head> snippet, just set config;
  // otherwise fall back to injecting the script dynamically.
  const existingScript = document.querySelector(`script[src*="googletagmanager.com/gtag/js"]`);
  if (!existingScript) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);
  }

  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, { send_page_view: true });
  initialized = true;
};

export const trackPageView = (pathname = window.location.pathname, title = document.title) => {
  if (!isBrowser()) return;
  initializeAnalytics();

  const pagePath = sanitizePath(pathname);
  const now = Date.now();
  const key = pagePath;
  if (lastPageView.key === key && now - lastPageView.at < 1000) return;
  lastPageView = { key, at: now };

  window.gtag('event', 'page_view', {
    page_title: title,
    page_location: `${window.location.origin}${pagePath}`,
    page_path: pagePath,
  });
};

export const trackEvent = (eventName, params = {}) => {
  if (!isBrowser()) return;
  initializeAnalytics();
  window.gtag('event', eventName, sanitizeEventParams(params));
};

export const trackCTA = (ctaName, pageName) => {
  trackEvent('cta_click', {
    cta_name: ctaName,
    page_name: pageName,
  });
};

export const trackFeatureUsed = (featureName) => {
  trackEvent('feature_used', {
    feature_name: featureName,
  });
};
