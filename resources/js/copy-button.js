// Alpine data provider for the <x-copy-button> component (x-data="copyButton").

// Copy path for insecure contexts (plain http), where navigator.clipboard is unavailable.
// The textarea is appended next to the button instead of to <body>: modals trap focus with
// x-trap, and a focus trap pulls focus back out of any node outside its container, which
// drops the selection before execCommand runs and copies nothing.
function copyWithSelection(value, host) {
    const previouslyFocused = document.activeElement;
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', '');
    textarea.setAttribute('aria-hidden', 'true');
    textarea.setAttribute('tabindex', '-1');
    // Must stay rendered to be selectable, so hide it instead of taking it out of the layout.
    textarea.style.cssText =
        'position:fixed;top:0;left:0;width:1px;height:1px;padding:0;border:none;opacity:0;font-size:16px';
    host.appendChild(textarea);

    try {
        textarea.focus({ preventScroll: true });
        textarea.select();
        // select() alone does not set a selection on a readonly textarea in iOS Safari.
        textarea.setSelectionRange(0, value.length);

        return document.execCommand('copy');
    } finally {
        textarea.remove();
        if (previouslyFocused instanceof HTMLElement) {
            previouslyFocused.focus({ preventScroll: true });
        }
    }
}

export function initializeCopyButtonComponent() {
    window.Alpine.data('copyButton', () => ({
        copied: false,
        async copy(value) {
            if (value === null || value === undefined) {
                window.toast('Value is not available.', { type: 'warning' });
                return;
            }
            try {
                if (navigator.clipboard?.writeText && window.isSecureContext) {
                    await navigator.clipboard.writeText(value);
                } else if (!copyWithSelection(String(value), this.$el.parentElement ?? document.body)) {
                    throw new Error('Copy command was rejected.');
                }
                this.copied = true;
                setTimeout(() => (this.copied = false), 1200);
            } catch (e) {
                window.toast('Could not copy to clipboard.', { type: 'warning' });
            }
        },
    }));
}
