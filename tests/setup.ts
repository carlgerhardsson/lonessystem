// 🧪 Global testsetup
// Körs före varje testfil

import '@testing-library/jest-dom'

// Mocka localStorage globalt
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem:    (key: string) => store[key] ?? null,
    setItem:    (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear:      () => { store = {} },
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mocka window.confirm så tester inte hänger sig
window.confirm = () => true
