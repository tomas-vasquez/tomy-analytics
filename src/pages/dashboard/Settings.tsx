import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSite } from '@/lib/SiteContext'

type SnippetKey = 'html' | 'nextjs'

export default function SettingsPage() {
  const { selected, refresh } = useSite()
  const [copied, setCopied] = useState<SnippetKey | null>(null)
  const [tab, setTab] = useState<SnippetKey>('html')
  const [newName, setNewName] = useState('')
  const [newDomain, setNewDomain] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yirekaxgzxuucketespk.supabase.co'
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  const origin = window.location.origin
  const siteId = selected?.id ?? ''
  const siteName = selected?.name ?? ''

  const snippets: Record<SnippetKey, string> = {
    html: `<script
  src="${origin}/analytics.js"
  data-site-id="${siteId}"
  data-supabase-url="${supabaseUrl}"
  data-anon-key="${anonKey}"
  defer></script>`,
    nextjs: `// app/layout.tsx — add in <head>
<script
  src="${origin}/analytics.js"
  data-site-id="${siteId}"
  data-supabase-url="${supabaseUrl}"
  data-anon-key="${anonKey}"
  defer
/>

// Or with next/script (app/layout.tsx):
import Script from 'next/script'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Script
          src="${origin}/analytics.js"
          data-site-id="${siteId}"
          data-supabase-url="${supabaseUrl}"
          data-anon-key="${anonKey}"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}

// For pages/ directory, add in _document.tsx:
<script
  src="${origin}/analytics.js"
  data-site-id="${siteId}"
  data-supabase-url="${supabaseUrl}"
  data-anon-key="${anonKey}"
  defer
/>`,
  }

  async function copySnippet(key: SnippetKey) {
    await navigator.clipboard.writeText(snippets[key])
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  async function handleAddSite(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    setError(null)

    const { error: rpcError } = await supabase.rpc('create_site', {
      p_name: newName.trim(),
      p_domain: newDomain.trim() || '',
    })

    if (rpcError) {
      setError(rpcError.message)
      setCreating(false)
      return
    }

    setNewName('')
    setNewDomain('')
    setCreating(false)
    await refresh()
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <h1 className="text-lg md:text-xl font-bold text-slate-900">Ajustes</h1>

      <div className="bg-white rounded-xl border p-4 md:p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">Insertar tracker</h2>

        <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
          <button
            onClick={() => setTab('html')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${tab === 'html' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >HTML</button>
          <button
            onClick={() => setTab('nextjs')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${tab === 'nextjs' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >Next.js</button>
        </div>

        <p className="text-sm text-slate-500">
          Copia este fragmento y pégalo en tu sitio web.
        </p>

        <div className="relative">
          <pre className="bg-slate-900 text-slate-200 text-xs md:text-sm rounded-lg p-4 overflow-x-auto whitespace-pre-wrap break-all">{snippets[tab]}</pre>
          <button
            onClick={() => copySnippet(tab)}
            className="absolute top-2 right-2 bg-slate-700 hover:bg-slate-600 text-white text-xs px-3 py-1.5 rounded-md transition-colors"
          >
            {copied === tab ? '¡Copiado!' : 'Copiar'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-4 md:p-5 space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">Información del sitio</h2>
        <div className="text-sm space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 w-20 shrink-0">Nombre:</span>
            <span className="text-slate-800 font-medium">{siteName}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 w-20 shrink-0">ID del sitio:</span>
            <code className="text-xs bg-slate-100 px-2 py-0.5 rounded break-all">{siteId}</code>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 w-20 shrink-0">Dominio:</span>
            <span className="text-slate-800">{selected?.domain || '-'}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-4 md:p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">Añadir otro sitio</h2>

        <form onSubmit={handleAddSite} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Mi otro sitio"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Dominio <span className="text-slate-400 text-xs">(opcional)</span>
            </label>
            <input
              type="text"
              value={newDomain}
              onChange={e => setNewDomain(e.target.value)}
              placeholder="ejemplo.com"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>
          )}

          <button
            type="submit"
            disabled={creating || !newName.trim()}
            className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {creating ? 'Creando...' : 'Añadir sitio'}
          </button>
        </form>
      </div>
    </div>
  )
}
