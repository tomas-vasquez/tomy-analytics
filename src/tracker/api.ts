import type { Payload } from './types'

export function send(apiUrl: string, anonKey: string, payload: Payload): void {
  const body = JSON.stringify(payload)

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: 'application/json' })
    navigator.sendBeacon(`${apiUrl}?apikey=${encodeURIComponent(anonKey)}`, blob)
  } else {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', apiUrl, true)
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.setRequestHeader('apikey', anonKey)
    xhr.send(body)
  }
}
