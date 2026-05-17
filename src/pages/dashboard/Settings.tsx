import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

type SnippetKey = 'html' | 'nextjs'

export default function SettingsPage() {
  const [siteId, setSiteId] = useState('')
  const [siteName, setSiteName] = useState('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<SnippetKey | null>(null)
  const [tab, setTab] = useState<SnippetKey>('html')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: sites } = await supabase
        .from('sites')
        .select('id, name')
        .eq('user_id', user.id)
        .limit(1)
      if (sites?.length) {
        setSiteId(sites[0].id)
        setSiteName(sites[0].name)
      }
      setLoading(false)
    }
    load()
  }, [])

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yirekaxgzxuucketespk.supabase.co'
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  const origin = window.location.origin

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

  if (loading) return <LoadingSpinner />

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
        </div>
      </div>
    </div>
  )
}
