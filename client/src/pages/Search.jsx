import React, { useState } from 'react'
import { Search as SearchIcon } from 'lucide-react'
import api from '../services/api'
import { PageHeader } from '../components/ui/PageHeader'
import { Section } from '../components/ui/Section'
import { Button } from '../components/ui/Button'
import { LoadingState } from '../components/ui/LoadingState'
import { EmptyState } from '../components/ui/EmptyState'

const Search = () => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    try {
      const response = await api.get('/demo/search', { params: { query } })
      setResults(response.data.results || [])
    } catch (error) {
      console.error('Search failed:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader title="Search" subtitle="Search the demo application" />

      <Section>
        <div className="bg-base-800 border border-base-600 rounded-lg p-5">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-base-700 border border-base-600 rounded-lg py-2.5 pl-9 pr-4 text-base-200 placeholder-base-500 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500"
                placeholder="Search…"
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Searching…' : 'Search'}
            </Button>
          </form>
        </div>
      </Section>

      {loading && <LoadingState message="Searching…" className="mb-6" />}

      {results.length > 0 && (
        <Section title="Results">
          <div className="bg-base-800 border border-base-600 rounded-lg p-5">
            <div className="space-y-2">
              {results.map((result) => (
                <div
                  key={result.id}
                  className="flex items-center justify-between px-4 py-3 rounded-lg bg-base-700 border border-base-600"
                >
                  <div>
                    <div className="text-sm font-medium text-base-50">{result.title}</div>
                    <div className="text-[0.7rem] text-base-500">{result.type}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}

      {!loading && results.length === 0 && query.trim() && (
        <EmptyState
          title="No results found"
          description="Try a different search query."
          className="mb-6"
        />
      )}
    </div>
  )
}

export default Search
