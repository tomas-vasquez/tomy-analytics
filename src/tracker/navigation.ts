export function monitorSPA(onNavigate: () => void): void {
  let lastUrl = window.location.href

  const original = history.pushState
  history.pushState = function (...args) {
    original.apply(this, args)
    check()
  }

  window.addEventListener('popstate', check)

  function check() {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href
      onNavigate()
    }
  }
}
