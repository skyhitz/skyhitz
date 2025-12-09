'use client'
import { View, FlatList, Pressable } from 'react-native'
import { usePendingUploadsQuery } from 'app/api/graphql/mutations'
import { P, ActivityIndicator } from 'app/design/typography'
import { SafeAreaView } from 'app/design/safe-area-view'
import { PendingUploadEntry } from './PendingUploadEntry'
import { ApprovalModal } from './ApprovalModal'
import { useState } from 'react'
import { PendingUpload } from 'app/api/graphql/types'

export default function PendingUploadsScreen() {
  const { data, loading, refetch } = usePendingUploadsQuery()
  const pendingUploads = data?.pendingUploads ?? []
  const [selectedUpload, setSelectedUpload] = useState<PendingUpload | null>(null)
  const [approvalModalVisible, setApprovalModalVisible] = useState(false)

  const handleApprove = (upload: PendingUpload) => {
    setSelectedUpload(upload)
    setApprovalModalVisible(true)
  }

  const handleApprovalComplete = () => {
    setApprovalModalVisible(false)
    setSelectedUpload(null)
    refetch()
  }

  const handleRejectComplete = () => {
    refetch()
  }

  return (
    <SafeAreaView className="bg-[--bg-color]">
      <View className="w-full flex-1 pb-32">
        <P className="web:flex font-unbounded my-4 ml-8 hidden text-lg font-bold">
          Pending Uploads
        </P>

        {loading ? (
          <View className="mt-8 flex flex-1 items-center justify-center">
            <ActivityIndicator />
            <P className="mt-4 text-[--text-secondary-color]">Loading pending uploads...</P>
          </View>
        ) : pendingUploads.length === 0 ? (
          <View className="mt-8 flex flex-1 items-center justify-center">
            <P className="text-[--text-secondary-color]">No pending uploads to review</P>
          </View>
        ) : (
          <View className="mx-auto w-full max-w-6xl flex-1 px-5">
            <FlatList
              keyExtractor={(item) => item.id}
              data={pendingUploads}
              renderItem={({ item }) => (
                <PendingUploadEntry
                  upload={item}
                  onApprove={() => handleApprove(item)}
                  onRejectComplete={handleRejectComplete}
                />
              )}
            />
          </View>
        )}
      </View>

      <ApprovalModal
        visible={approvalModalVisible}
        upload={selectedUpload}
        onClose={() => {
          setApprovalModalVisible(false)
          setSelectedUpload(null)
        }}
        onComplete={handleApprovalComplete}
      />
    </SafeAreaView>
  )
}

