// @ts-ignore isolatedModules

const NAV_ACTIONS = new Set(["toolbar:movetotrash", "toolbar:movetoarchive"]);
let currentMailId: string | null = null;
let nextMailId: string | null = null;

const getMailContainer = (): HTMLElement | null =>
    document.querySelector<HTMLElement>("main .items-column-list-container");

const waitForElement = (selector: string): Promise<HTMLElement> => {
    return new Promise((resolve) => {
        const existing = document.querySelector<HTMLElement>(selector);
        if (existing) {
            return resolve(existing);
        }

        const root =
            document.querySelector<HTMLElement>("main") || document.body;
        const observer = new MutationObserver((mutations, obs) => {
            for (const m of mutations) {
                for (const node of Array.from(m.addedNodes)) {
                    if (
                        node instanceof HTMLElement &&
                        (node.matches(selector) || node.querySelector(selector))
                    ) {
                        obs.disconnect();
                        const found =
                            document.querySelector<HTMLElement>(selector);
                        if (found) {
                            resolve(found);
                        }
                        return;
                    }
                }
            }
        });
        observer.observe(root, { childList: true, subtree: true });
    });
};

const getNextMailId = (mailId: string): string | null => {
    const container = getMailContainer();
    if (!container) {
        return null;
    }
    const items = Array.from(
        container.querySelectorAll<HTMLElement>("[data-element-id]"),
    );
    const idx = items.findIndex((el) => el.dataset.elementId === mailId);
    const nextEl =
        idx >= 0 && idx < items.length - 1 ? items[idx + 1] : items[0];

    return nextEl?.dataset.elementId ?? null;
};

const navigatorToId = async (id: string | null) => {
    if (!id) {
        return;
    }

    await waitForElement(".items-column-list-container");

    const el = getMailContainer()?.querySelector<HTMLElement>(
        `[data-element-id="${id}"]`,
    );

    el?.click();
    currentMailId = id;
};

const handleMailItemClick = async (event: MouseEvent): Promise<void> => {
    const mailEl = (event.target as HTMLElement).closest<HTMLElement>(
        "[data-element-id]",
    );
    if (mailEl) {
        currentMailId = mailEl.dataset.elementId!;
    }

    const action = (event.target as HTMLElement).getAttribute("data-testid");
    if (action && NAV_ACTIONS.has(action)) {
        navigatorToId(nextMailId);
    }
};

const initMailAutoNavigator = (): void => {
    const match = location.href.match(/\/u\/\d+\/inbox\/([^\/]+)/);
    currentMailId = match ? match[1] : null;

    document.body.addEventListener(
        "click",
        (event: MouseEvent) => {
            const target = event.target as HTMLElement;

            const action = target.getAttribute("data-testid");

            if (action && NAV_ACTIONS.has(action) && currentMailId) {
                nextMailId = getNextMailId(currentMailId);
            }
        },
        true,
    );

    document.body.addEventListener("click", handleMailItemClick);
};

window.addEventListener("load", initMailAutoNavigator);
