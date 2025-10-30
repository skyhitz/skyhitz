'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ComponentAuthGuard } from 'app/utils/authGuard'
import { UploadScreen } from 'app/features/upload/screen'
import { useUserStore } from 'app/state/user'
import { View } from 'react-native'
import { P, H1 } from 'app/design/typography'
import { SafeAreaView } from 'app/design/safe-area-view'
import { ADMIN_ID } from 'app/constants/constants'

function UploadPageContent() {
  const { user, loading } = useUserStore()
  const router = useRouter()

  useEffect(() => {
    // Redirect non-admin users to profile
    if (!loading && user && user.id !== ADMIN_ID) {
      router.push('/profile')
    }
  }, [user, loading, router])

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView className="bg-[--bg-color] w-full flex-1">
        <View className="flex-1 items-center justify-center">
          <P>Loading...</P>
        </View>
      </SafeAreaView>
    )
  }

  // Show access denied for non-admin
  if (user && user.id !== ADMIN_ID) {
    return (
      <SafeAreaView className="bg-[--bg-color] w-full flex-1">
        <View className="flex-1 items-center justify-center px-4">
          <H1 className="text-lg mb-4">Access Denied</H1>
          <P className="text-center text-[--text-secondary-color]">
            This feature is currently in private beta.
          </P>
        </View>
      </SafeAreaView>
    )
  }

  // Show upload screen for admin
  return <UploadScreen />
}

export default function UploadPage() {
  return (
    <ComponentAuthGuard>
      <UploadPageContent />
    </ComponentAuthGuard>
  )
}

