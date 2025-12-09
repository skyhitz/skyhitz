'use client'
import { View, ScrollView, Pressable, Platform, TextInput } from 'react-native'
import { H1, P } from 'app/design/typography'
import { SafeAreaView } from 'app/design/safe-area-view'
import { useState, useCallback, useRef } from 'react'
import { Button } from 'app/design/button'
import Upload from 'app/ui/icons/upload'
import { useToast } from 'app/provider/toast'
import { ActivityIndicator } from 'app/design/typography'
import Check from 'app/ui/icons/check'
import { Config } from 'app/config'
import { SecureStorage } from 'app/utils/secure-storage'
import { useUserStore } from 'app/state/user'
import { Slider } from 'app/design/slider'

type UploadResult = {
  success: boolean
  message: string
  pendingUploadId?: string
  audioHash?: string
  imageHash?: string
  title?: string
  artist?: string
  description?: string
}

export function UploadScreen() {
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [description, setDescription] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [audioDragActive, setAudioDragActive] = useState(false)
  const [imageDragActive, setImageDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [artistEquityPercent, setArtistEquityPercent] = useState(10) // Default 10%

  const audioInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()
  
  // Get current user to check verified artist status
  const { user } = useUserStore()
  const isVerifiedArtist = user?.verifiedArtist === true

  const isWeb = Platform.OS === 'web'

  const handleAudioDragOver = useCallback((e: React.DragEvent) => {
    if (!isWeb) return
    e.preventDefault()
    e.stopPropagation()
    setAudioDragActive(true)
  }, [isWeb])

  const handleAudioDragLeave = useCallback((e: React.DragEvent) => {
    if (!isWeb) return
    e.preventDefault()
    e.stopPropagation()
    setAudioDragActive(false)
  }, [isWeb])

  const handleAudioDrop = useCallback((e: React.DragEvent) => {
    if (!isWeb) return
    e.preventDefault()
    e.stopPropagation()
    setAudioDragActive(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      if (!file) return
      
      const validTypes = ['audio/mpeg', 'audio/mp4', 'audio/aiff', 'audio/x-aiff', 'audio/wav', 'audio/x-wav']
      const validExtensions = ['.mp3', '.mp4', '.aiff', '.wav', '.m4a']
      const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
      
      if (validTypes.includes(file.type) || validExtensions.includes(fileExtension)) {
        setAudioFile(file)
        setUploadResult(null)
      } else {
        toast?.show('Please upload an audio file (MP3, MP4, AIFF, or WAV)', { type: 'danger' })
      }
    }
  }, [isWeb, toast])

  const handleImageDragOver = useCallback((e: React.DragEvent) => {
    if (!isWeb) return
    e.preventDefault()
    e.stopPropagation()
    setImageDragActive(true)
  }, [isWeb])

  const handleImageDragLeave = useCallback((e: React.DragEvent) => {
    if (!isWeb) return
    e.preventDefault()
    e.stopPropagation()
    setImageDragActive(false)
  }, [isWeb])

  const handleImageDrop = useCallback((e: React.DragEvent) => {
    if (!isWeb) return
    e.preventDefault()
    e.stopPropagation()
    setImageDragActive(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      if (!file) return
      
      if (file.type.startsWith('image/')) {
        // Check image dimensions
        const img = new Image()
        img.onload = () => {
          if (img.width >= 1000 && img.height >= 1000) {
            setImageFile(file)
          } else {
            toast?.show('Image must be at least 1000x1000 pixels', { type: 'danger' })
          }
        }
        img.src = URL.createObjectURL(file)
      } else {
        toast?.show('Please upload an image file', { type: 'danger' })
      }
    }
  }, [isWeb, toast])

  const handleAudioFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      if (file) {
        setAudioFile(file)
        setUploadResult(null)
      }
    }
  }, [])

  const handleImageFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      if (!file) return
      
      // Check image dimensions
      const img = new Image()
      img.onload = () => {
        if (img.width >= 1000 && img.height >= 1000) {
          setImageFile(file)
        } else {
          toast?.show('Image must be at least 1000x1000 pixels', { type: 'danger' })
        }
      }
      img.src = URL.createObjectURL(file)
    }
  }, [toast])

  const handleUpload = async () => {
    if (!audioFile || !imageFile || !title || !artist) {
      toast?.show('Please fill all required fields', { type: 'danger' })
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    
    try {
      // Get auth token
      const token = await SecureStorage.get('auth-token')
      if (!token) {
        toast?.show('Please sign in to continue', { type: 'danger' })
        setIsUploading(false)
        return
      }

      const formData = new FormData()
      formData.append('audio', audioFile)
      formData.append('image', imageFile)
      formData.append('title', title)
      formData.append('artist', artist)
      formData.append('description', description)
      
      // Include artist equity if verified artist
      if (isVerifiedArtist && artistEquityPercent > 0) {
        // Convert percentage to basis points (e.g., 10% = 1000 bps)
        const artistEquityBps = Math.round(artistEquityPercent * 100)
        formData.append('artistEquityBps', artistEquityBps.toString())
      }

      // Use XMLHttpRequest for upload progress
      return new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        
        // Upload progress
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded * 100) / event.total)
            setUploadProgress(progress)
          }
        })
        
        // Response handling
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const result = JSON.parse(xhr.responseText)
              setUploadResult(result)

              if (result.success) {
                toast?.show('Upload submitted for review! 🎉', { type: 'success' })
              } else {
                toast?.show(result.error || 'Upload failed', { type: 'danger' })
              }
              resolve()
            } catch (error) {
              reject(new Error('Failed to parse response'))
            }
          } else {
            try {
              const errorResult = JSON.parse(xhr.responseText)
              toast?.show(errorResult.error || 'Upload failed', { type: 'danger' })
            } catch {
              toast?.show('Upload failed', { type: 'danger' })
            }
            reject(new Error('Upload failed'))
          }
          setIsUploading(false)
        })
        
        xhr.addEventListener('error', () => {
          reject(new Error('Network error'))
          setIsUploading(false)
        })
        
        const apiUrl = Config.GRAPHQL_URL.replace('/graphql', '/upload/complete')
        xhr.open('POST', apiUrl)
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        xhr.send(formData)
      })
    } catch (error) {
      console.error('Upload error:', error)
      toast?.show('Failed to upload track. Please try again.', { type: 'danger' })
      setIsUploading(false)
    }
  }

  const resetForm = () => {
    setAudioFile(null)
    setImageFile(null)
    setTitle('')
    setArtist('')
    setDescription('')
    setUploadResult(null)
    setUploadProgress(0)
    setArtistEquityPercent(10) // Reset to default
  }

  return (
    <SafeAreaView className="bg-[--bg-color] w-full">
      <ScrollView>
        <View className="mx-auto flex min-h-screen w-full max-w-2xl items-start justify-start px-4 py-8">
          <H1 className="text-center text-lg mb-8 w-full">Upload Music</H1>

          {/* Audio File Upload */}
          <View className="w-full mb-6">
            <P className="mb-2 font-bold">Audio File *</P>
            <Pressable
              onPress={() => isWeb && audioInputRef.current?.click()}
              // @ts-ignore - web only props
              onDragOver={isWeb ? handleAudioDragOver : undefined}
              onDragLeave={isWeb ? handleAudioDragLeave : undefined}
              onDrop={isWeb ? handleAudioDrop : undefined}
            >
              <View
                className={`w-full min-h-[150px] border-2 border-dashed rounded-lg flex items-center justify-center p-4 ${
                  audioDragActive
                    ? 'border-blue bg-blue/10'
                    : 'border-[--border-color] bg-[--bg-secondary-color]'
                }`}
              >
                {audioFile ? (
                  <View className="flex items-center">
                    <Check className="h-8 w-8 text-green-500 mb-2" />
                    <P className="text-center">{audioFile.name}</P>
                    <P className="text-xs text-[--text-secondary-color] mt-1">
                      {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                    </P>
                  </View>
                ) : (
                  <View className="flex items-center">
                    <Upload className="h-8 w-8 text-[--text-secondary-color] mb-2" />
                    <P className="text-center text-[--text-secondary-color]">
                      Drag and drop or click to select audio file
                    </P>
                    <P className="text-xs text-[--text-secondary-color] mt-1">
                      Supported: MP3, MP4, AIFF, WAV
                    </P>
                  </View>
                )}
              </View>
            </Pressable>
            {isWeb && (
              <input
                ref={audioInputRef}
                type="file"
                accept=".mp3,.mp4,.aiff,.wav,.m4a,audio/mpeg,audio/mp4,audio/aiff,audio/x-aiff,audio/wav,audio/x-wav"
                onChange={handleAudioFileSelect}
                style={{ display: 'none' }}
              />
            )}
          </View>

          {/* Image File Upload */}
          <View className="w-full mb-6">
            <P className="mb-2 font-bold">Artwork *</P>
            <Pressable
              onPress={() => isWeb && imageInputRef.current?.click()}
              // @ts-ignore - web only props
              onDragOver={isWeb ? handleImageDragOver : undefined}
              onDragLeave={isWeb ? handleImageDragLeave : undefined}
              onDrop={isWeb ? handleImageDrop : undefined}
            >
              <View
                className={`w-full min-h-[150px] border-2 border-dashed rounded-lg flex items-center justify-center p-4 ${
                  imageDragActive
                    ? 'border-blue bg-blue/10'
                    : 'border-[--border-color] bg-[--bg-secondary-color]'
                }`}
              >
                {imageFile ? (
                  <View className="flex items-center">
                    <Check className="h-8 w-8 text-green-500 mb-2" />
                    <P className="text-center">{imageFile.name}</P>
                    <P className="text-xs text-[--text-secondary-color] mt-1">
                      {(imageFile.size / 1024 / 1024).toFixed(2)} MB
                    </P>
                  </View>
                ) : (
                  <View className="flex items-center">
                    <Upload className="h-8 w-8 text-[--text-secondary-color] mb-2" />
                    <P className="text-center text-[--text-secondary-color]">
                      Drag and drop or click to select image
                    </P>
                    <P className="text-xs text-[--text-secondary-color] mt-1">
                      Minimum 1000x1000 pixels
                    </P>
                  </View>
                )}
              </View>
            </Pressable>
            {isWeb && (
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageFileSelect}
                style={{ display: 'none' }}
              />
            )}
          </View>

          {/* Title Field */}
          <View className="w-full mb-6">
            <P className="mb-2 font-bold">Title *</P>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Enter track title"
              placeholderTextColor="#999"
              className="w-full px-4 py-3 rounded-lg border border-[--border-color] bg-[--bg-secondary-color] text-[--text-color]"
            />
          </View>

          {/* Artist Field */}
          <View className="w-full mb-6">
            <P className="mb-2 font-bold">Artist *</P>
            <TextInput
              value={artist}
              onChangeText={setArtist}
              placeholder="Enter artist name"
              placeholderTextColor="#999"
              className="w-full px-4 py-3 rounded-lg border border-[--border-color] bg-[--bg-secondary-color] text-[--text-color]"
            />
          </View>

          {/* Description Field */}
          <View className="w-full mb-6">
            <P className="mb-2 font-bold">Description</P>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Enter track description (optional)"
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              className="w-full px-4 py-3 rounded-lg border border-[--border-color] bg-[--bg-secondary-color] text-[--text-color]"
              // @ts-ignore - web only prop
              style={isWeb ? { minHeight: 100 } : undefined}
            />
          </View>

          {/* Artist Equity Slider - Only visible for verified artists */}
          {isVerifiedArtist && (
            <View className="w-full mb-6 p-4 rounded-lg border border-blue bg-blue/10">
              <View className="flex-row items-center justify-between mb-2">
                <P className="font-bold text-blue">🎨 Artist Equity</P>
                <View className="px-3 py-1 rounded-full bg-blue">
                  <P className="text-white font-bold text-sm">Verified Artist</P>
                </View>
              </View>
              <P className="text-sm text-[--text-secondary-color] mb-4">
                As a verified artist, you can reserve a percentage of rewards as non-dilutable equity. 
                This portion cannot be diluted by fan investments.
              </P>
              
              <View className="flex-row items-center justify-between mb-2">
                <P className="text-sm">Your equity:</P>
                <P className="font-bold text-lg">{artistEquityPercent.toFixed(1)}%</P>
              </View>
              
              <Slider
                style={{ width: '100%', height: 40 }}
                minimumValue={0}
                maximumValue={99.9}
                value={artistEquityPercent}
                onValueChange={(val) => setArtistEquityPercent(Math.round(val * 10) / 10)}
                minimumTrackTintColor="#3B82F6"
                maximumTrackTintColor="#4B5563"
                thumbTintColor="#3B82F6"
              />
              
              <View className="flex-row items-center justify-between mt-2">
                <P className="text-xs text-[--text-secondary-color]">0%</P>
                <P className="text-xs text-[--text-secondary-color]">99.9%</P>
              </View>
              
              <View className="mt-4 p-3 rounded-lg bg-[--bg-color]">
                <View className="flex-row items-center justify-between">
                  <P className="text-sm">Fan investment pool:</P>
                  <P className="font-bold">{(100 - artistEquityPercent).toFixed(1)}%</P>
                </View>
                <P className="text-xs text-[--text-secondary-color] mt-1">
                  Fans can invest in this portion and earn proportional rewards
                </P>
              </View>
            </View>
          )}

          {/* Success Message */}
          {uploadResult?.success && (
            <View className="w-full mb-6 p-4 border border-green-500 rounded-lg bg-green-500/10">
              <View className="flex-row items-center mb-2">
                <Check className="h-6 w-6 text-green-500 mr-2" />
                <P className="text-green-500 font-bold">Upload Submitted!</P>
              </View>
              <P className="text-sm text-[--text-secondary-color]">
                {uploadResult.message}
              </P>
              <P className="text-xs text-[--text-secondary-color] mt-2">
                A curator will review your track and notify you once it's approved.
              </P>
            </View>
          )}

          {/* Action Buttons */}
          <View className="w-full flex-row gap-4">
            {!uploadResult?.success && (
              <Button
                text={isUploading ? 'Uploading...' : 'Submit for Review'}
                onPress={handleUpload}
                disabled={isUploading || !audioFile || !imageFile || !title || !artist}
                className="flex-1"
              />
            )}

            {uploadResult?.success && (
              <Button
                text="Upload Another Track"
                onPress={resetForm}
                className="flex-1"
              />
            )}
          </View>

          {/* Progress Indicator */}
          {isUploading && (
            <View className="w-full mt-6 p-4 border border-[--border-color] rounded-lg bg-[--bg-secondary-color]">
              <View className="mb-4">
                <View className="flex-row justify-between mb-2">
                  <P className="text-sm font-bold">Uploading Files</P>
                  <P className="text-sm">{uploadProgress}%</P>
                </View>
                <View className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-blue-500 transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </View>
              </View>
              
              <View className="flex-row items-center justify-center">
                <ActivityIndicator />
                <P className="ml-2 text-sm text-[--text-secondary-color]">
                  Uploading your track...
                </P>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

