import React, { useState } from 'react'
import { Search as SearchIcon } from 'lucide-react'
import api from '../services/api'

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
      setResults(response.data.results)
    } catch (error) {
      console.error('Search failed:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Search</h1>

      <div className="bg-dark-800 rounded-lg border border-dark-600 p-6 mb-6">
        <form onSubmit={handleSearch} className="flex space-x-4">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-dark-700 border border-dark-600 rounded-lg py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-accent-500"
              placeholder="Search..."
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-accent-600 hover:bg-accent-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {results.length > 0 && (
        <div className="bg-dark-800 rounded-lg border border-dark-600 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Results</h2>
          <div className="space-y-3">
            {results.map((result) => (
              <div
                key={result.id}
                className="bg-dark-700 rounded-lg p-4 border border-dark-600"
              >
                <div className="text-white font-semibold">{result.title}</div>
                <div className="text-sm text-gray-400">{result.type}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Search
