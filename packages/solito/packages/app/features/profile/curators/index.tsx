'use client'
import { View, FlatList, Pressable, TextInput, Alert } from 'react-native'
import { useCuratorsQuery, useAddCuratorMutation, useRemoveCuratorMutation } from 'app/api/graphql/mutations'
import { P, ActivityIndicator } from 'app/design/typography'
import { SafeAreaView } from 'app/design/safe-area-view'
import { Button } from 'app/design/button'
import { useToast } from 'app/provider/toast'
import { useState } from 'react'
import { Curator } from 'app/api/graphql/types'
import X from 'app/ui/icons/x'

export default function CuratorsScreen() {
  const { data, loading, refetch } = useCuratorsQuery()
  const [addCurator] = useAddCuratorMutation()
  const [removeCurator] = useRemoveCuratorMutation()
  const curators = data?.curators ?? []
  const toast = useToast()
  
  const [email, setEmail] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const handleAddCurator = async () => {
    if (!email.trim()) {
      toast?.show('Please enter an email address', { type: 'warning' })
      return
    }

    setIsAdding(true)
    try {
      const result = await addCurator({
        variables: {
          email: email.trim().toLowerCase(),
        },
      })

      if (result.data?.addCurator?.success) {
        toast?.show(result.data.addCurator.message, { type: 'success' })
        setEmail('')
        refetch()
      } else {
        toast?.show(result.data?.addCurator?.message || 'Failed to add curator', { type: 'danger' })
      }
    } catch (error: any) {
      console.error('Add curator error:', error)
      const errorMessage = error?.graphQLErrors?.[0]?.extensions?.message || error?.message || 'Failed to add curator'
      toast?.show(errorMessage, { type: 'danger' })
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemoveCurator = async (curator: Curator) => {
    const confirmed = await new Promise<boolean>((resolve) => {
      if (typeof window !== 'undefined') {
        resolve(window.confirm(`Remove ${curator.userName} as curator?`))
      } else {
        Alert.alert(
          'Remove Curator',
          `Are you sure you want to remove ${curator.userName} as a curator?`,
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Remove', style: 'destructive', onPress: () => resolve(true) },
          ]
        )
      }
    })

    if (!confirmed) return

    try {
      const result = await removeCurator({
        variables: {
          email: curator.userEmail,
        },
      })

      if (result.data?.removeCurator?.success) {
        toast?.show(result.data.removeCurator.message, { type: 'success' })
        refetch()
      } else {
        toast?.show(result.data?.removeCurator?.message || 'Failed to remove curator', { type: 'danger' })
      }
    } catch (error: any) {
      console.error('Remove curator error:', error)
      const errorMessage = error?.graphQLErrors?.[0]?.extensions?.message || error?.message || 'Failed to remove curator'
      toast?.show(errorMessage, { type: 'danger' })
    }
  }

  return (
    <SafeAreaView className="bg-[--bg-color]">
      <View className="w-full flex-1 pb-32">
        <P className="web:flex font-unbounded my-4 ml-8 hidden text-lg font-bold">
          Manage Curators
        </P>

        {/* Add Curator Section */}
        <View className="mx-auto w-full max-w-6xl px-5 mb-6">
          <P className="font-bold mb-2">Add New Curator</P>
          <View className="flex-row items-center gap-2">
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Enter user's email address..."
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              className="flex-1 px-4 py-3 rounded-lg border border-[--border-color] bg-[--bg-secondary-color] text-[--text-color]"
              onSubmitEditing={handleAddCurator}
            />
            <Button
              text={isAdding ? 'Adding...' : 'Add'}
              onPress={handleAddCurator}
              disabled={isAdding || !email.trim()}
            />
          </View>
          <P className="mt-2 text-xs text-[--text-secondary-color]">
            The user must have an existing account on Skyhitz to be added as a curator.
          </P>
        </View>

        {/* Curators List */}
        <View className="mx-auto w-full max-w-6xl px-5">
          <P className="font-bold mb-2">Current Curators ({curators.length})</P>
          
          {loading ? (
            <View className="mt-4 flex items-center">
              <ActivityIndicator />
              <P className="mt-2 text-[--text-secondary-color]">Loading curators...</P>
            </View>
          ) : curators.length === 0 ? (
            <View className="mt-4 p-4 rounded-lg bg-[--bg-secondary-color]">
              <P className="text-center text-[--text-secondary-color]">
                No curators added yet. Admin is a curator by default.
              </P>
            </View>
          ) : (
            <FlatList
              keyExtractor={(item) => item.userId}
              data={curators}
              renderItem={({ item }) => (
                <CuratorItem curator={item} onRemove={() => handleRemoveCurator(item)} />
              )}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  )
}

function CuratorItem({ curator, onRemove }: { curator: Curator; onRemove: () => void }) {
  const addedDate = new Date(curator.addedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <View className="flex-row items-center justify-between py-3 px-4 mb-2 rounded-lg bg-[--bg-secondary-color]">
      <View className="flex-1">
        <P className="font-bold">{curator.userName}</P>
        <P className="text-xs text-[--text-secondary-color]">{curator.userEmail}</P>
        <P className="text-xs text-[--text-secondary-color] mt-1">
          Added by {curator.addedByName} on {addedDate}
        </P>
      </View>
      <Pressable
        onPress={onRemove}
        className="p-2 rounded-full bg-red-600"
      >
        <X size={16} className="text-white" />
      </Pressable>
    </View>
  )
}

