// 🧪 Global testsetup
// Mockar localStorage för node-miljö (finns inte inbyggt i Node)

const store: Record<string, string> = {}

const localStorageMock = {
  getItem:    (key: string) => store[key] ?? null,
  setItem:    (key: string, value: string) => { store[key] = value },
  removeItem: (key: string) => { delete store[key] },
  clear:      () => { Object.keys(store).forEach(k => delete store[k]) },
  length: 0,
  key: (_i: number) => null,
}

// Gör localStorage tillgänglig globalt i node-miljön
if (typeof globalThis.localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    writable: true,
  })
}
