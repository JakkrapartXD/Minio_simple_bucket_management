/**
 * Composable for handling file downloads (single file and zip)
 */

import JSZip from 'jszip'

interface DownloadItem {
  name: string
  path: string
  type: 'file' | 'folder'
}

export function useDownload(bucket: Ref<string | undefined>) {
  const { token } = useAuth()

  /**
   * Download single file
   */
  const downloadSingleFile = async (objectName: string) => {
    if (!bucket.value) return

    try {
      const response = await fetch(`/api/storage/download?bucket=${encodeURIComponent(bucket.value)}&objectName=${encodeURIComponent(objectName)}`, {
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      // Extract filename from object name
      const filename = objectName.split('/').pop() || 'download'
      link.download = filename
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error: any) {
      console.error('Download error:', error)
      window.alert(`Failed to download file: ${error?.message || 'Unknown error'}`)
    }
  }

  /**
   * Get all files in a folder recursively
   */
  const getFolderFiles = async (folderPath: string): Promise<Array<{ name: string; path: string }>> => {
    if (!bucket.value) return []

    try {
      // Get all objects with this prefix
      const response = await $fetch('/api/storage/objects', {
        params: {
          bucket: bucket.value,
          prefix: folderPath,
        },
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      })

      return (response.objects || []).map((obj: any) => ({
        name: obj.name,
        path: obj.name,
      }))
    } catch (error) {
      console.error('Error getting folder files:', error)
      return []
    }
  }

  /**
   * Download multiple files or folders as zip
   */
  const downloadAsZip = async (items: DownloadItem[]) => {
    if (!bucket.value || !items.length) return

    try {
      const zip = new JSZip()
      const folder = zip.folder('downloads') || zip

      // Process each item
      for (const item of items) {
        if (item.type === 'file') {
          // Download single file
          try {
            const response = await fetch(`/api/storage/download?bucket=${encodeURIComponent(bucket.value)}&objectName=${encodeURIComponent(item.path)}`, {
              headers: {
                Authorization: `Bearer ${token.value}`,
              },
            })
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`)
            }
            
            const blob = await response.blob()
            const arrayBuffer = await blob.arrayBuffer()
            
            // Use item.name for the filename in zip (without prefix)
            const zipPath = item.name
            folder.file(zipPath, arrayBuffer)
          } catch (error) {
            console.error(`Error downloading file ${item.name}:`, error)
          }
        } else if (item.type === 'folder') {
          // Get all files in folder
          const files = await getFolderFiles(item.path)
          
          for (const file of files) {
            try {
              const response = await fetch(`/api/storage/download?bucket=${encodeURIComponent(bucket.value)}&objectName=${encodeURIComponent(file.path)}`, {
                headers: {
                  Authorization: `Bearer ${token.value}`,
                },
              })
              
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
              }
              
              const blob = await response.blob()
              const arrayBuffer = await blob.arrayBuffer()
              
              // Create path relative to folder in zip
              // Remove the folder prefix and keep the relative structure
              let relativePath = file.path
              if (file.path.startsWith(item.path)) {
                relativePath = file.path.substring(item.path.length)
              }
              // Ensure the path starts with the folder name
              const zipPath = `${item.name}/${relativePath}`
              folder.file(zipPath, arrayBuffer)
            } catch (error) {
              console.error(`Error downloading file ${file.name}:`, error)
            }
          }
        }
      }

      // Generate zip file
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const url = window.URL.createObjectURL(zipBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `download_${new Date().getTime()}.zip`
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error: any) {
      console.error('Zip download error:', error)
      window.alert(`Failed to create zip file: ${error?.message || 'Unknown error'}`)
    }
  }

  /**
   * Download items (single file or zip)
   */
  const downloadItems = async (items: DownloadItem[]) => {
    if (!items.length) return

    const firstItem = items[0]
    if (items.length === 1 && firstItem && firstItem.type === 'file') {
      // Single file download
      await downloadSingleFile(firstItem.path)
    } else {
      // Multiple files or folders - zip download
      await downloadAsZip(items)
    }
  }

  return {
    downloadSingleFile,
    downloadAsZip,
    downloadItems,
  }
}

