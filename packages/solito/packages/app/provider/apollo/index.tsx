'use client'

import React from 'react'
import { ApolloProvider } from '@apollo/client'
import { client } from 'app/api/graphql/client'

interface ApolloProviderProps {
  children: React.ReactNode
}

export function GraphQLProvider({ children }: ApolloProviderProps) {
  return <ApolloProvider client={client}>{children}</ApolloProvider>
}
