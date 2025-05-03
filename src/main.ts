// @ts-ignore isolatedModules

let currentMailId : string | null = null;
let nextMailId : string | null = null;

const NAV_ACTIONS = new Set([
  'toolbar:movetotrash',
  'toolbar:movetoarchive'
]);

const getContainer = (): HTMLElement | null => document.querySelector<HTMLElement>('main .items-column-list-container');

const waitForContainer = (): Promise<HTMLElement> =>
  new Promise(resolve => {
    const existing = getContainer();
    if (existing) {
      return resolve(existing);
    }

    const mainEl = document.querySelector<HTMLElement>('main');
    const observer = new MutationObserver((mutations, obs) => {
      for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (node instanceof HTMLElement) {
            // check if the container itself or a parent of it
            if (
              node.matches('.items-column-list-container') ||
              node.querySelector?.('.items-column-list-container')
            ) {
              obs.disconnect();
              const found = getContainer();
              if (found) resolve(found);
              return;
            }
          }
        }
      }
    });

    // observe only <main> subtree
    if (mainEl) {
      observer.observe(mainEl, { childList: true, subtree: true });
    } else {
      // fallback to body if <main> missing
      observer.observe(document.body, { childList: true, subtree: true });
    }
  });

  const peekNextId = (id: string): string | null => {
    const list = getContainer();
    if (!list) return null;
    const items = Array.from(
      list.querySelectorAll<HTMLElement>('[data-element-id]')
    );
    const idx = items.findIndex(el => el.dataset.elementId === id);
    // if found and not last → next; else wrap to first
    if (idx >= 0 && idx < items.length - 1) {
      return items[idx + 1].dataset.elementId!;
    }
    return items.length > 0 ? items[0].dataset.elementId! : null;
  };

  const gotoById = async (id: string | null) => {
    if (!id) return;
    await waitForContainer();
    const nextEl = getContainer()?.querySelector<HTMLElement>(
      `[data-element-id="${id}"]`
    );
    if (nextEl) {
      nextEl.click();
      currentMailId = id;
    }
  };

const handleClick = async (event: MouseEvent): Promise<void> => {
  const target = event.target as HTMLElement;

  // Update state if the user clicked a mail preview
  target.closest<HTMLElement>('[data-element-id]') &&
    (currentMailId = (target.closest<HTMLElement>('[data-element-id]') as HTMLElement).dataset.elementId!);

  // Check toolbar actions
  const action = target.getAttribute('data-testid');
  if (action && NAV_ACTIONS.has(action)) {
    await gotoById(nextMailId);
  }
};

window.addEventListener('load', () => {
  const match = location.href.match(/\/u\/\d+\/inbox\/([^\/]+)/);
  currentMailId = match ? match[1] : null;
    document.body.addEventListener('click', (event: MouseEvent) => {
  const target = event.target as HTMLElement;

   const action = target.getAttribute('data-testid');

  if (action && NAV_ACTIONS.has(action)) {
    nextMailId = currentMailId && peekNextId(currentMailId);
  }
    }, true);
  document.body.addEventListener('click', handleClick);
});

