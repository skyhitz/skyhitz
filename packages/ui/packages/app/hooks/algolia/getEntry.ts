import { entriesIndex } from 'app/api/algolia'
import { Entry } from 'app/api/graphql'
import { isEmpty } from 'ramda'

export const getEntry = async (id: string) => {
  const res = await entriesIndex.search('', {
    filters: `id:${id}`,
    cacheable: false,
  })

  if (isEmpty(res.hits)) {
    return null
  }

  return res.hits[0] as unknown as Entry
}
