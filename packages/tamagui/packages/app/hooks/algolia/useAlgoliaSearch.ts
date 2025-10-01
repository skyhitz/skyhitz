import { useEffect, useState } from 'react'
import { useDebounce } from 'app/hooks/useDebounce'
import { algoliaClient } from 'app/api/algolia'
import { ErrorType } from 'app/types'

type Props = {
  searchPhrase: string
  indexName: string
}

type SearchResult<T> = {
  loading: boolean
  data: T[]
  error?: ErrorType
}

const unknownError: ErrorType = {
  name: 'Unknown error',
  message: 'Unknown algolia search error',
}

export function useAlgoliaSearch<T>({
  searchPhrase,
  indexName,
}: Props): SearchResult<T> {
  const [searchResult, setSearchResult] = useState<T[]>([])
  const [error, setError] = useState<ErrorType | undefined>(undefined)
  const debouncedSearchPhrase = useDebounce(searchPhrase, 200)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
  }, [searchPhrase])

  useEffect(() => {
    if (!debouncedSearchPhrase) return

    const search = async () => {
      try {
        const algoliaSearchResult = await algoliaClient.searchSingleIndex({
          indexName: indexName,
          searchParams: {
            query: debouncedSearchPhrase,
          },
        })
        setSearchResult(algoliaSearchResult.hits as unknown as T[])
        setError(undefined)
      } catch (e) {
        setError((e as ErrorType) ?? unknownError)
        setSearchResult([])
      } finally {
        setLoading(false)
      }
    }

    search()
  }, [debouncedSearchPhrase, indexName])

  return {
    loading,
    data: searchResult,
    error,
  }
}
