import { Text, View } from 'react-native'
import { CollapsableView } from 'app/ui/CollapsableView'
import { compose, isEmpty, map, prop, sum } from 'ramda'
import { EntryHolder } from 'app/api/graphql'
import { StellarExpertLink } from 'app/ui/links/StellarExpertLink'
import { PeopleIcon } from 'app/ui/icons/people'
import { useUserAtomState } from 'app/state/user'
import { P } from 'app/design/typography'

function Holder({
  account,
  percentage,
  isCurrentUser,
}: {
  account: string
  percentage: number
  isCurrentUser: boolean
}) {
  return (
    <View className="my-2 flex w-full flex-row items-center justify-between">
      <StellarExpertLink id={account} path="account" className="shrink pr-2" />
      {isCurrentUser && <P className="text-grey text-left text-sm">(me)</P>}
      <P className="flex-1 grow text-right text-sm">{percentage.toFixed(2)}%</P>
    </View>
  )
}

type Props = {
  holders: EntryHolder[]
}

export function Owners({ holders }: Props) {
  const totalBalance = sum(map(compose(parseInt, prop('balance')), holders))
  const { user } = useUserAtomState()

  const Content = () => {
    if (isEmpty(holders)) {
      return <Text>No one owns this asset</Text>
    } else {
      return (
        <>
          {holders.map((item) => (
            <Holder
              account={item.account}
              percentage={(parseInt(item.balance, 10) * 100) / totalBalance}
              key={item.account}
              isCurrentUser={user?.publicKey === item.account}
            />
          ))}
        </>
      )
    }
  }

  return (
    <CollapsableView headerText="Collectors" icon={PeopleIcon}>
      <View className="m-5">
        <Content />
      </View>
    </CollapsableView>
  )
}
