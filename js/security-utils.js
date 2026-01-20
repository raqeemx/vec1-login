(function (window) {
    'use strict';

    const htmlEscapeMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '`': '&#96;'
    };

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/[&<>"'`]/g, (char) => htmlEscapeMap[char]);
    }

    function safeUrl(value, options = {}) {
        const { allowData = false } = options;
        if (!value) return '';

        try {
            const url = new URL(value, window.location.origin);
            const protocol = url.protocol.toLowerCase();

            if (protocol === 'http:' || protocol === 'https:') {
                return url.toString();
            }

            if (allowData && protocol === 'data:') {
                return value;
            }
        } catch (error) {
            return '';
        }

        return '';
    }

    function safeText(value, fallback = '-') {
        const text = value ?? fallback;
        return escapeHtml(text);
    }

    window.SecurityUtils = {
        escapeHtml,
        safeText,
        safeUrl
    };
})(window);
