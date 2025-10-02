'use client'
import { useCallback, useState } from 'react'
import { Config } from 'app/config'
import { SecureStorage } from 'app/utils/secure-storage'

type ReturnType = {
  uploadFile: (_file: Blob) => Promise<string>
  progress: number
}

export default function useUploadFile(): ReturnType {
  const [progress, setProgress] = useState<number>(0)

  const uploadFile = useCallback((_file: Blob) => {
    return new Promise<string>(async (resolve, reject) => {
      const token = await SecureStorage.get('auth-token')
      if (!token) {
        reject({ message: 'Not authenticated', code: 'UNAUTHORIZED' })
        return
      }

      const uploadUrl = Config.GRAPHQL_URL.replace('/graphql', '/upload')
      const formData = new FormData()
      formData.append('file', _file)

      const request = new XMLHttpRequest()
      request.open('POST', uploadUrl, true)
      request.setRequestHeader('Authorization', `Bearer ${token}`)

      request.upload.addEventListener('progress', (event) => {
        setProgress(Math.round((event.loaded * 100.0) / event.total))
      })

      request.onreadystatechange = () => {
        if (request.readyState === 4) {
          setProgress(0)
          
          if (request.status >= 400) {
            reject({
              message: `Upload failed with status ${request.status}`,
              code: 'HTTP_ERROR',
            })
            return
          }
          
          try {
            const response = JSON.parse(request.responseText)
            const { IpfsHash, error } = response
            
            if (!IpfsHash) {
              reject(
                error ?? {
                  message: 'Upload to storage failed',
                  code: 'UNKNOWN',
                }
              )
              return
            }

            resolve(IpfsHash)
          } catch (e) {
            reject({
              message: 'Failed to parse response',
              code: 'PARSE_ERROR',
            })
          }
        }
      }
      
      request.send(formData)
    })
  }, [])

  return { uploadFile, progress }
}
