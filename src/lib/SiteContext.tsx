import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from './supabase'

interface Site {
  id: string
  name: string
  domain: string
}

interface SiteContextValue {
  sites: Site[]
  selected: Site | null
  loading: boolean
  setSelected: (site: Site) => void
  refresh: () => Promise<void>
}

const SiteContext = createContext<SiteContextValue>({
  sites: [],
  selected: null,
  loading: true,
  setSelected: () => {},
  refresh: async () => {},
})

export function SiteProvider({ children }: { children: ReactNode }) {
  const [sites, setSites] = useState<Site[]>([])
  const [selected, setSelected] = useState<Site | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchSites() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data } = await supabase
      .from('sites')
      .select('id, name, domain')
      .eq('user_id', user.id)
      .order('created_at')

    const list = (data ?? []) as Site[]
    setSites(list)

    if (list.length > 0) {
      const saved = localStorage.getItem('selected_site_id')
      const match = saved ? list.find(s => s.id === saved) : null
      setSelected(match ?? list[0])
    } else {
      setSelected(null)
    }

    setLoading(false)
  }

  useEffect(() => { fetchSites() }, [])

  useEffect(() => {
    if (selected) localStorage.setItem('selected_site_id', selected.id)
  }, [selected])

  return (
    <SiteContext.Provider value={{ sites, selected, loading, setSelected, refresh: fetchSites }}>
      {children}
    </SiteContext.Provider>
  )
}

export const useSite = () => useContext(SiteContext)
