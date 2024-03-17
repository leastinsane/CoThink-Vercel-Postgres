'use client'

import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/command'
import { type User, type Word } from '@prisma/client'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { useDebounce } from 'use-debounce'

export interface SearchProps {
  searchWords: (
    content: string,
    userId: string
  ) => Promise<Array<Word & { similarity: number }>>
}

export function Search({ searchWords }: SearchProps) {
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<
    Array<Word & { similarity?: number }>
  >([])
  const [debouncedQuery] = useDebounce(query, 150)
  const [userId, setUserId] = useState('')

  useEffect(() => {
    let current = true
    if (debouncedQuery.trim().length > 0 && userId) {
      searchWords(debouncedQuery, userId).then((results) => {
        if (current) {
          setSearchResults(results)
        }
      })
    }
    return () => {
      current = false
    }
  }, [debouncedQuery, userId, searchWords])

  return (
    <div className="w-full">
      <Command label="Command Menu" shouldFilter={false} className="h-[200px]">
        <CommandInput
          id="search"
          placeholder="Search for words"
          className="focus:ring-0 sm:text-sm text-base focus:border-0 border-0 active:ring-0 active:border-0 ring-0 outline-0"
          value={query}
          onValueChange={(q) => setQuery(q)}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {searchResults.map((word) => (
            <CommandItem
              key={word.id}
              value={word.word}
              className="data-[selected='true']:bg-zinc-50  flex items-center justify-between py-3"
              onSelect={(p) => {
                console.log(p)
                toast.success(`You selected ${p}!`)
              }}
            >
              <div className="flex items-center space-x-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">
                    {word.word.substring(0, 90)}
                  </p>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {word.similarity ? (
                  <div className="text-xs font-mono p-0.5 rounded bg-zinc-100">
                    {word.similarity.toFixed(3)}
                  </div>
                ) : (
                  <div />
                )}
              </div>
            </CommandItem>
          ))}
        </CommandList>
      </Command>
    </div>
  )
}

Search.displayName = 'Search'