'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Camera, Upload, X } from 'lucide-react'
import Image from 'next/image'
import { loadTesseractJS, preprocessImage } from '@/utils/ocrProcessor'

interface ReceiptCaptureProps {
  onImageCapture: (file: File) => void
  processing: boolean
  onCancel?: () => void
}

export function ReceiptCapture({ onImageCapture, processing, onCancel }: ReceiptCaptureProps) {
  const [dragActive, setDragActive] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [capturedFile, setCapturedFile] = useState<File | null>(null)
  const [tesseractLoaded, setTesseractLoaded] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Load Tesseract.js on component mount
  React.useEffect(() => {
    const loadOCRLibrary = async () => {
      try {
        await loadTesseractJS()
        setTesseractLoaded(true)
      } catch (error) {
        console.error('Failed to load OCR library:', error)
        // Continue without Tesseract - will use fallback
      }
    }
    
    loadOCRLibrary()
  }, [])

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    if (!isValidImageFile(file)) {
      alert('נא לבחור קובץ תמונה תקין (JPG, PNG, WebP)')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('גודל הקובץ גדול מדי. מקסימום 10MB')
      return
    }

    try {
      // Create preview
      const previewUrl = URL.createObjectURL(file)
      setPreviewImage(previewUrl)
      setCapturedFile(file)
    } catch (error) {
      console.error('Error handling file:', error)
      alert('שגיאה בטעינת הקובץ')
    }
  }, [])

  // Validate image file
  const isValidImageFile = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    return validTypes.includes(file.type.toLowerCase())
  }

  // Handle drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }, [handleFileUpload])

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }, [handleFileUpload])

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })

      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setCameraActive(true)
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('לא ניתן לגשת למצלמה. נסה להעלות תמונה במקום')
    }
  }, [])

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }, [])

  // Capture photo from camera
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    if (!ctx) return

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0)

    // Convert to blob and create file
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `receipt-${Date.now()}.jpg`, { type: 'image/jpeg' })
        const previewUrl = URL.createObjectURL(file)
        
        setPreviewImage(previewUrl)
        setCapturedFile(file)
        stopCamera()
      }
    }, 'image/jpeg', 0.8)
  }, [stopCamera])

  // Process captured image
  const processImage = useCallback(async () => {
    if (!capturedFile) return

    try {
      // Preprocess image for better OCR results
      const processedFile = await preprocessImage(capturedFile)
      onImageCapture(processedFile)
    } catch (error) {
      console.error('Error preprocessing image:', error)
      // Fall back to original file
      onImageCapture(capturedFile)
    }
  }, [capturedFile, onImageCapture])

  // Clear preview and start over
  const clearPreview = useCallback(() => {
    if (previewImage) {
      URL.revokeObjectURL(previewImage)
    }
    setPreviewImage(null)
    setCapturedFile(null)
    stopCamera()
  }, [previewImage, stopCamera])

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      stopCamera()
      if (previewImage) {
        URL.revokeObjectURL(previewImage)
      }
    }
  }, [stopCamera, previewImage])

  return (
    <div className="w-full max-w-2xl mx-auto" dir="rtl">
      {/* Camera View */}
      {cameraActive && (
        <div className="relative bg-black rounded-lg overflow-hidden mb-4">
          <video
            ref={videoRef}
            className="w-full h-64 sm:h-80 object-cover"
            playsInline
            muted
          />
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4 rtl:space-x-reverse">
            <button
              onClick={capturePhoto}
              className="bg-white hover:bg-gray-100 text-gray-900 p-3 rounded-full shadow-lg transition-colors"
              disabled={processing}
            >
              <Camera className="w-6 h-6" />
            </button>
            <button
              onClick={stopCamera}
              className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full shadow-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Image Preview */}
      {previewImage && (
        <div className="relative bg-gray-100 rounded-lg overflow-hidden mb-4">
          <Image
            src={previewImage}
            alt="תצוגה מקדימה של הקבלה"
            width={800}
            height={600}
            className="w-full h-64 sm:h-80 object-contain"
          />
          <div className="absolute top-2 right-2 flex space-x-2 rtl:space-x-reverse">
            <button
              onClick={clearPreview}
              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-colors"
              disabled={processing}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <button
              onClick={processImage}
              disabled={processing}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium shadow-lg transition-colors"
            >
              {processing ? 'מעבד קבלה...' : 'עבד קבלה'}
            </button>
          </div>
        </div>
      )}

      {/* Upload Area */}
      {!cameraActive && !previewImage && (
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Upload className="w-8 h-8 text-gray-600" />
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                העלה תמונה של הקבלה
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                גרור קובץ לכאן או לחץ לבחירת קובץ
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={processing}
                className="flex items-center justify-center space-x-2 rtl:space-x-reverse bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>בחר קובץ</span>
              </button>

              {'mediaDevices' in navigator && (
                <button
                  onClick={startCamera}
                  disabled={processing}
                  className="flex items-center justify-center space-x-2 rtl:space-x-reverse bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  <span>צלם קבלה</span>
                </button>
              )}
            </div>

            <div className="text-xs text-gray-500">
              נתמכים: JPG, PNG, WebP (עד 10MB)
              {tesseractLoaded && (
                <span className="block mt-1 text-green-600">✓ זיהוי טקסט עברי מוכן</span>
              )}
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={processing}
          />
        </div>
      )}

      {/* Cancel Button */}
      {onCancel && (
        <div className="mt-4 text-center">
          <button
            onClick={onCancel}
            disabled={processing}
            className="text-gray-600 hover:text-gray-800 text-sm transition-colors"
          >
            ביטול
          </button>
        </div>
      )}

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}

export default ReceiptCapture