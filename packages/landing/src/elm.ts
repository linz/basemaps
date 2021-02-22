/**
 * VDom style document.createElement
 * @param name
 */
export function e(name: string): HTMLElement;
export function e(
    name: string,
    attrs: Record<string, unknown>,
    value?: string | HTMLElement | HTMLElement[],
): HTMLElement;
export function e(
    name: string,
    attrs?: Record<string, unknown>,
    value?: string | HTMLElement | HTMLElement[],
): HTMLElement {
    const el = document.createElement(name);
    if (value == null) {
        // noop
    } else if (Array.isArray(value)) {
        value.forEach((v) => el.appendChild(v));
    } else if (typeof value === 'object') {
        el.appendChild(value);
    } else {
        el.textContent = value;
    }

    if (attrs) {
        Object.entries(attrs).forEach(([key, value]) => {
            (el as any)[key] = value;
        });
    }
    return el;
}
