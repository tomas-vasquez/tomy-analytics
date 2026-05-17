export function extractClickEvent(el: Element): { name: string; props: Record<string, unknown> } {
  const name = el.getAttribute('data-analytics-event') || 'click'

  let props: Record<string, unknown> = {}
  const raw = el.getAttribute('data-analytics-props')
  if (raw) {
    try { props = JSON.parse(raw) } catch { /* ignore */ }
  }

  return {
    name,
    props: {
      tag: el.tagName,
      text: (el.textContent ?? '').trim().slice(0, 100),
      href: el.getAttribute('href') ?? '',
      id: el.id || '',
      class: el.className || '',
      ...props,
    },
  }
}

export function handleClick(e: MouseEvent, onEvent: (name: string, props?: Record<string, unknown>) => void): void {
  const target = e.target as Element
  const el = target.closest<HTMLElement>('[data-analytics-event], a, button')
  if (!el) return

  const isTrackable = el.tagName === 'A' || el.tagName === 'BUTTON' || el.hasAttribute('data-analytics-event')
  if (!isTrackable) return

  const { name, props } = extractClickEvent(el)
  onEvent(name, props)
}

export function on(handler: (e: MouseEvent) => void): void {
  document.addEventListener('click', handler, true)
}
