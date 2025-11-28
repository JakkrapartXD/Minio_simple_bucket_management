/**
 * Composable for handling file uploads and drag & drop
 */

interface FileWithPath {
  file: File
  path: string
}

export function useUpload(
  bucket: Ref<string | undefined>,
  prefix: Ref<string>,
  refreshObjects: () => Promise<void>,
  refreshFolders: () => Promise<void>,
) {
  const { token } = useAuth()
  const fileInput = ref<HTMLInputElement>()
  const folderInput = ref<HTMLInputElement>()
  const dropzoneRef = ref<HTMLElement>()
  const isDraggingOver = ref(false)

  /**
   * อ่านไฟล์ทั้งหมดจาก directory entry
   */
  const readDirectoryEntry = (
    entry: FileSystemEntry,
    basePath: string = '',
  ): Promise<FileWithPath[]> => {
    return new Promise((resolve, reject) => {
      if (entry.isFile) {
        const fileEntry = entry as FileSystemFileEntry
        fileEntry.file((file) => {
          const fileNameOnly = file.name.split('/').pop() || file.name.split('\\').pop() || file.name
          const relativePath = basePath ? `${basePath}/${fileNameOnly}` : fileNameOnly

          const newFile = new File([file], fileNameOnly, {
            type: file.type,
            lastModified: file.lastModified,
          })
          resolve([{ file: newFile, path: relativePath }])
        }, reject)
      } else if (entry.isDirectory) {
        const dirEntry = entry as FileSystemDirectoryEntry
        const reader = dirEntry.createReader()
        const files: FileWithPath[] = []

        const readEntries = () => {
          reader.readEntries((entries) => {
            if (entries.length === 0) {
              resolve(files)
              return
            }

            const promises = entries.map((entry) => {
              if (entry.isDirectory) {
                const entryNameOnly = entry.name.split('/').pop() || entry.name.split('\\').pop() || entry.name
                const newBasePath = basePath ? `${basePath}/${entryNameOnly}` : entryNameOnly
                return readDirectoryEntry(entry, newBasePath)
              } else {
                return readDirectoryEntry(entry, basePath)
              }
            })

            Promise.all(promises)
              .then((results) => {
                files.push(...results.flat())
                readEntries()
              })
              .catch(reject)
          }, reject)
        }

        readEntries()
      } else {
        resolve([])
      }
    })
  }

  /**
   * อัพโหลดไฟล์ผ่าน presigned URL
   */
  const uploadFiles = async (files: FileList | File[]) => {
    if (!files || !files.length || !bucket.value) return

    try {
      const fileArray = Array.from(files)
      let successCount = 0
      let failCount = 0

      for (const file of fileArray) {
        try {
          // Get relative path for folder uploads
          const fileName = (file as any).webkitRelativePath || file.name
          const objectKey = prefix.value ? `${prefix.value}${fileName}` : fileName

          // 1. Request presigned URL from backend
          const presignedData = await $fetch('/api/storage/presigned-upload', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token.value}`,
            },
            body: {
              bucket: bucket.value,
              objectKey,
              contentType: file.type || 'application/octet-stream',
            },
          })

          // 2. Upload file directly to MinIO using presigned URL
          const uploadResponse = await fetch(presignedData.presignedUrl, {
            method: 'PUT',
            body: file,
            headers: {
              'Content-Type': file.type || 'application/octet-stream',
            },
          })

          if (!uploadResponse.ok) {
            throw new Error(`Upload failed: ${uploadResponse.statusText}`)
          }

          successCount++
        } catch (error: any) {
          console.error(`Failed to upload ${file.name}:`, error)
          failCount++
        }
      }

      // Show result
      if (failCount === 0) {
        window.alert(`Upload complete: ${successCount} file(s) uploaded`)
      } else {
        window.alert(`Upload completed with errors: ${successCount} succeeded, ${failCount} failed`)
      }

      // Refresh file list
      await Promise.all([refreshObjects(), refreshFolders()])
    } catch (error: any) {
      console.error('Upload error:', error)
      const errorMessage = error?.data?.message || error?.message || 'Unknown error'
      window.alert('Upload failed: ' + errorMessage)
    }
  }


  /**
   * จัดการ drag over event
   */
  const handleDragOver = (event: DragEvent) => {
    event.preventDefault()
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy'
    }
    isDraggingOver.value = true
  }

  /**
   * จัดการ drag leave event
   */
  const handleDragLeave = (event: DragEvent) => {
    event.preventDefault()
    const relatedTarget = event.relatedTarget as HTMLElement
    if (!dropzoneRef.value?.contains(relatedTarget)) {
      isDraggingOver.value = false
    }
  }

  /**
   * จัดการ drop event
   */
  const handleDrop = async (event: DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    isDraggingOver.value = false

    if (!event.dataTransfer || !bucket.value) return

    const items = event.dataTransfer.items
    const files = event.dataTransfer.files

    // ตรวจสอบว่าเป็น directory หรือไม่
    if (items && items.length > 0) {
      try {
        const entries: FileSystemEntry[] = []

        for (let i = 0; i < items.length; i++) {
          const item = items[i]
          if (item && item.kind === 'file') {
            const entry = item.webkitGetAsEntry()
            if (entry) {
              entries.push(entry)
            }
          }
        }

        const hasDirectory = entries.some((e) => e.isDirectory)
        if (hasDirectory) {
          const allFiles: FileWithPath[] = []

          for (const entry of entries) {
            const folderNameOnly = entry.name.split('/').pop() || entry.name.split('\\').pop() || entry.name
            const files = await readDirectoryEntry(entry, folderNameOnly)
            allFiles.push(...files)
          }

          if (allFiles.length > 0) {
            const formData = new FormData()
            allFiles.forEach(({ file, path }) => {
              formData.append('files', file, path)
            })

            try {
              await $fetch('/api/storage/upload', {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${token.value}`,
                },
                body: formData,
                params: {
                  bucket: bucket.value,
                  prefix: prefix.value || '',
                },
              })
              window.alert(`Upload complete: ${allFiles.length} file(s) uploaded`)
              await Promise.all([refreshObjects(), refreshFolders()])
            } catch (error: any) {
              console.error('Upload error:', error)
              const errorMessage = error?.data?.message || error?.message || 'Unknown error'
              window.alert('Upload failed: ' + errorMessage)
            }
          }
          return
        }
      } catch (e) {
        console.warn('Could not read directory structure:', e)
      }
    }

    // ถ้าเป็นไฟล์ธรรมดา
    if (files && files.length > 0) {
      await uploadFiles(files)
    }
  }

  /**
   * จัดการ file input change event
   */
  const handleFileInputChange = async (event: Event) => {
    const target = event.target as HTMLInputElement
    const files = target.files
    if (!files || !files.length || !bucket.value) return
    await uploadFiles(files)
    target.value = ''
  }

  /**
   * Trigger file upload
   */
  const triggerFileUpload = () => {
    fileInput.value?.click()
  }

  /**
   * Trigger folder upload
   */
  const triggerFolderUpload = () => {
    folderInput.value?.click()
  }

  return {
    // Refs
    fileInput,
    folderInput,
    dropzoneRef,
    isDraggingOver,
    // Methods
    uploadFiles,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInputChange,
    triggerFileUpload,
    triggerFolderUpload,
  }
}

