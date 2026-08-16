import { signal } from '@angular/core';

export function createShellNav() {
  const navOpen = signal(false);

  return {
    navOpen,
    toggleNav: () => navOpen.update((open) => !open),
    closeNav: () => navOpen.set(false)
  };
}
