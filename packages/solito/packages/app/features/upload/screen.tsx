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

type QualityScore = {
  musicDetection: number
  mixQuality: number
  mastering: number
  humanFactor: number
  finalScore: number
}

type AnalysisResult = {
  scores: QualityScore
  mintCost: number
  rejected: boolean
  reason?: string
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
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isMinting, setIsMinting] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [audioDragActive, setAudioDragActive] = useState(false)
  const [imageDragActive, setImageDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [analysisProgress, setAnalysisProgress] = useState(0)

  const audioInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()

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
        setAnalysisResult(null)
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
        setAnalysisResult(null)
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

  const handleAnalyze = async () => {
    if (!audioFile || !imageFile || !title || !artist) {
      toast?.show('Please fill all required fields', { type: 'danger' })
      return
    }

    setIsAnalyzing(true)
    setUploadProgress(0)
    setAnalysisProgress(0)
    
    try {
      // Get auth token
      const token = await SecureStorage.get('auth-token')
      if (!token) {
        toast?.show('Please sign in to continue', { type: 'danger' })
        setIsAnalyzing(false)
        return
      }

      const formData = new FormData()
      formData.append('audio', audioFile)
      formData.append('image', imageFile)
      formData.append('title', title)
      formData.append('artist', artist)
      formData.append('description', description)

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
              setAnalysisResult(result)
              setAnalysisProgress(100)

              if (result.rejected) {
                toast?.show(result.reason || 'Track rejected', { type: 'danger' })
              } else {
                toast?.show('Analysis complete!', { type: 'success' })
              }
              resolve()
            } catch (error) {
              reject(new Error('Failed to parse response'))
            }
          } else {
            reject(new Error('Upload failed'))
          }
          setIsAnalyzing(false)
        })
        
        xhr.addEventListener('error', () => {
          reject(new Error('Network error'))
          setIsAnalyzing(false)
        })
        
        const apiUrl = Config.GRAPHQL_URL.replace('/graphql', '/upload/complete')
        xhr.open('POST', apiUrl)
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        xhr.send(formData)
        
        // Simulate analysis progress after upload
        setInterval(() => {
          setAnalysisProgress((prev) => Math.min(prev + 10, 90))
        }, 200)
      })
    } catch (error) {
      console.error('Analysis error:', error)
      toast?.show('Failed to analyze track. Please try again.', { type: 'danger' })
      setIsAnalyzing(false)
    }
  }

  const handleMint = async () => {
    if (!analysisResult || analysisResult.rejected) return
    if (!analysisResult.audioHash || !analysisResult.imageHash) {
      toast?.show('Missing upload data. Please re-analyze.', { type: 'danger' })
      return
    }

    setIsMinting(true)
    try {
      // Call GraphQL mutation
      const apiUrl = Config.GRAPHQL_URL
      const token = await SecureStorage.get('auth-token')
      
      if (!token) {
        toast?.show('Please sign in to continue', { type: 'danger' })
        return
      }

      const mutation = `
        mutation UploadMint($input: UploadMintInput!) {
          uploadMint(input: $input) {
            success
            message
            entryId
            txHash
          }
        }
      `

      const variables = {
        input: {
          audioHash: analysisResult.audioHash,
          imageHash: analysisResult.imageHash,
          title,
          artist,
          description,
          qualityScore: analysisResult.scores.finalScore,
          mintCost: analysisResult.mintCost,
        },
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: mutation,
          variables,
        }),
      })

      const result = await response.json()

      if (result.errors) {
        const errorMessage = result.errors[0]?.message || 'Minting failed'
        
        // Handle specific error codes
        if (errorMessage.includes('INSUFFICIENT_FUNDS')) {
          toast?.show('Insufficient balance. Please top up your account.', { type: 'danger' })
        } else {
          toast?.show(errorMessage, { type: 'danger' })
        }
        return
      }

      if (result.data?.uploadMint?.success) {
        toast?.show('Track minted successfully! 🎉', { type: 'success' })
        
        // Reset form after successful mint
        setTimeout(() => {
          setAudioFile(null)
          setImageFile(null)
          setTitle('')
          setArtist('')
          setDescription('')
          setAnalysisResult(null)
          setUploadProgress(0)
          setAnalysisProgress(0)
        }, 2000)
      } else {
        toast?.show(result.data?.uploadMint?.message || 'Minting failed', { type: 'danger' })
      }
    } catch (error) {
      console.error('Minting error:', error)
      toast?.show('Failed to mint track. Please try again.', { type: 'danger' })
    } finally {
      setIsMinting(false)
    }
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

          {/* Analysis Results */}
          {analysisResult && !analysisResult.rejected && (
            <View className="w-full mb-6 p-4 border border-[--border-color] rounded-lg bg-[--bg-secondary-color]">
              <H1 className="text-base mb-4">Quality Analysis</H1>
              
              <View className="mb-2">
                <P className="text-sm">
                  Music Detection: <span className="font-bold">{analysisResult.scores.musicDetection.toFixed(1)}/10</span>
                </P>
              </View>
              
              <View className="mb-2">
                <P className="text-sm">
                  Mix Quality: <span className="font-bold">{analysisResult.scores.mixQuality.toFixed(1)}/10</span>
                </P>
              </View>
              
              <View className="mb-2">
                <P className="text-sm">
                  Mastering: <span className="font-bold">{analysisResult.scores.mastering.toFixed(1)}/10</span>
                </P>
              </View>
              
              <View className="mb-2">
                <P className="text-sm">
                  Human Factor: <span className="font-bold">{analysisResult.scores.humanFactor.toFixed(1)}/10</span>
                </P>
              </View>
              
              <View className="mt-4 pt-4 border-t border-[--border-color]">
                <P className="text-base font-bold">
                  Final Score: {analysisResult.scores.finalScore.toFixed(1)}/10
                </P>
                <P className="text-lg font-bold text-blue mt-2">
                  Mint Cost: {analysisResult.mintCost.toFixed(2)} XLM
                </P>
              </View>
            </View>
          )}

          {analysisResult && analysisResult.rejected && (
            <View className="w-full mb-6 p-4 border border-red-500 rounded-lg bg-red-500/10">
              <P className="text-red-500 font-bold">Track Rejected</P>
              <P className="text-sm mt-2">{analysisResult.reason}</P>
            </View>
          )}

          {/* Action Buttons */}
          <View className="w-full flex-row gap-4">
            {!analysisResult && (
              <Button
                text={isAnalyzing ? 'Analyzing...' : 'Analyze Track'}
                onPress={handleAnalyze}
                disabled={isAnalyzing || !audioFile || !imageFile || !title || !artist}
                className="flex-1"
              />
            )}

            {analysisResult && !analysisResult.rejected && (
              <>
                <Button
                  text="Re-analyze"
                  onPress={handleAnalyze}
                  variant="secondary"
                  disabled={isAnalyzing}
                  className="flex-1"
                />
                <Button
                  text={isMinting ? 'Minting...' : `Mint for ${analysisResult.mintCost.toFixed(2)} XLM`}
                  onPress={handleMint}
                  disabled={isMinting}
                  className="flex-1"
                />
              </>
            )}
          </View>

          {/* Progress Indicators */}
          {isAnalyzing && (
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
              
              {uploadProgress === 100 && (
                <View>
                  <View className="flex-row justify-between mb-2">
                    <P className="text-sm font-bold">Analyzing Quality</P>
                    <P className="text-sm">{analysisProgress}%</P>
                  </View>
                  <View className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-green-500 transition-all"
                      style={{ width: `${analysisProgress}%` }}
                    />
                  </View>
                </View>
              )}
              
              <View className="mt-4 flex-row items-center justify-center">
                <ActivityIndicator />
                <P className="ml-2 text-sm text-[--text-secondary-color]">
                  {uploadProgress < 100 ? 'Uploading files...' : 'Analyzing audio quality...'}
                </P>
              </View>
            </View>
          )}

          {isMinting && (
            <View className="w-full mt-6 p-4 border border-[--border-color] rounded-lg bg-[--bg-secondary-color]">
              <View className="flex-row items-center justify-center">
                <ActivityIndicator />
                <P className="ml-2 text-sm text-[--text-secondary-color]">
                  Minting your track on the blockchain...
                </P>
              </View>
              <P className="text-xs text-center text-[--text-secondary-color] mt-2">
                This may take a few seconds. Please don't close this page.
              </P>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

