'use client'

import React, { useState } from 'react'
import { 
  Camera, 
  FileText, 
  CheckCircle, 
 
  RotateCcw,
  Zap,
  Brain,
  Languages
} from 'lucide-react'
import { useOCR } from '@/hooks/useOCR'
import { useAuth } from '@/hooks/useAuth'
import ReceiptCapture from './ReceiptCapture'
import ResultValidation from './ResultValidation'
import BulkSubmitModal from './BulkSubmitModal'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useToast } from '@/components/ui/Toast'

export function OCRPage() {
  const { user } = useAuth()
  const { error: showError } = useToast()
  const {
    processing,
    currentResult,
    validationResult,
    error,
    processReceiptImage,
    validateExtractedItems,
    bulkSubmitPrices,
    clearSession,
    hasResult
    // hasValidation,
    // canSubmit,
    // itemCount,
    // validItemCount
  } = useOCR()

  const [step, setStep] = useState<'capture' | 'process' | 'validate' | 'submit'>('capture')
  const [showSubmitModal, setShowSubmitModal] = useState(false)

  const handleImageCapture = async (file: File) => {
    setStep('process')
    const result = await processReceiptImage(file)
    
    if (result) {
      setStep('validate')
      // Auto-validate after processing
      setTimeout(() => {
        if (result.extractedItems.length > 0) {
          validateExtractedItems(result.extractedItems)
        }
      }, 500)
    }
  }

  const handleValidation = () => {
    if (currentResult) {
      const validation = validateExtractedItems(currentResult.extractedItems)
      if (validation.validItems.length > 0) {
        setShowSubmitModal(true)
      } else {
        showError('אין פריטים תקינים לשליחה', 'בדוק את הפריטים ותקן שגיאות')
      }
    }
  }

  const handleItemUpdate = (index: number, updatedItem: { text: string; price: number; confidence: number; isValidated: boolean; meatCutId?: string; retailerId?: string; suggestedCategory?: string; quantity?: number; unit?: string }) => {
    if (currentResult) {
      const updatedItems = [...currentResult.extractedItems]
      updatedItems[index] = updatedItem
      
      // Re-validate with updated items
      validateExtractedItems(updatedItems)
    }
  }

  const handleItemRemove = (index: number) => {
    if (currentResult) {
      const updatedItems = currentResult.extractedItems.filter((_, i) => i !== index)
      
      // Update current result
      // const updatedResult = {
      //   ...currentResult,
      //   extractedItems: updatedItems,
      //   totalItems: updatedItems.length
      // }
      
      // Re-validate
      validateExtractedItems(updatedItems)
    }
  }

  const handleBulkSubmit = async (retailerId: string, location?: string) => {
    if (!validationResult) return false

    const success = await bulkSubmitPrices(validationResult.validItems, retailerId, location)
    
    if (success) {
      showError('דיווחים נשלחו בהצלחה!', `${validationResult.validItems.length} דיווחי מחיר נוספו למאגר`)
      clearSession()
      setStep('capture')
      setShowSubmitModal(false)
    }
    
    return success
  }

  const handleStartOver = () => {
    clearSession()
    setStep('capture')
    setShowSubmitModal(false)
  }

  const getStepIcon = (stepName: string) => {
    const isActive = step === stepName
    const isCompleted = 
      (stepName === 'capture' && step !== 'capture') ||
      (stepName === 'process' && ['validate', 'submit'].includes(step)) ||
      (stepName === 'validate' && step === 'submit')

    const iconClass = isActive 
      ? 'text-blue-600' 
      : isCompleted 
        ? 'text-green-600' 
        : 'text-gray-400'

    // const bgClass = isActive 
    //   ? 'bg-blue-100' 
    //   : isCompleted 
    //     ? 'bg-green-100' 
    //     : 'bg-gray-100'

    switch (stepName) {
      case 'capture':
        return <Camera className={`w-5 h-5 ${iconClass}`} />
      case 'process':
        return <Brain className={`w-5 h-5 ${iconClass}`} />
      case 'validate':
        return <FileText className={`w-5 h-5 ${iconClass}`} />
      case 'submit':
        return <CheckCircle className={`w-5 h-5 ${iconClass}`} />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Camera className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">סריקת קבלות חכמה</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            צלם או העלה תמונה של קבלה ואנחנו נזהה אוטומטית את מוצרי הבשר והמחירים באמצעות בינה מלאכותית
          </p>
        </div>

        {/* Features Banner */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Languages className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">זיהוי עברית מתקדם</h3>
              <p className="text-gray-600 text-sm">טכנולוגיית OCR מתקדמת לזיהוי טקסט עברי</p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Brain className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">זיהוי מוצרים חכם</h3>
              <p className="text-gray-600 text-sm">התאמה אוטומטית למוצרי בשר במאגר</p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">שליחה מהירה</h3>
              <p className="text-gray-600 text-sm">דיווח מרובה מחירים בלחיצה אחת</p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            {[
              { key: 'capture', label: 'צילום/העלאה', description: 'תמונת קבלה' },
              { key: 'process', label: 'עיבוד', description: 'זיהוי טקסט' },
              { key: 'validate', label: 'אימות', description: 'בדיקת פריטים' },
              { key: 'submit', label: 'שליחה', description: 'דיווח מחירים' }
            ].map((stepItem, index) => (
              <div key={stepItem.key} className="flex-1">
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step === stepItem.key 
                      ? 'bg-blue-100' 
                      : ['process', 'validate', 'submit'].includes(step) && index < ['capture', 'process', 'validate', 'submit'].indexOf(step)
                        ? 'bg-green-100' 
                        : 'bg-gray-100'
                  }`}>
                    {getStepIcon(stepItem.key)}
                  </div>
                  {index < 3 && (
                    <div className={`flex-1 h-0.5 mx-4 ${
                      ['process', 'validate', 'submit'].includes(step) && index < ['capture', 'process', 'validate', 'submit'].indexOf(step)
                        ? 'bg-green-300' 
                        : 'bg-gray-200'
                    }`} />
                  )}
                </div>
                <div className="mt-2 text-center">
                  <div className="text-sm font-medium text-gray-900">{stepItem.label}</div>
                  <div className="text-xs text-gray-500">{stepItem.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Authentication Check */}
        {!user && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-yellow-800 text-sm">
                התחבר כדי לשלוח דיווחי מחיר למאגר
              </span>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 rtl:space-x-reverse text-red-800">
              <span className="font-medium">שגיאה:</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          {step === 'capture' && (
            <div className="p-6">
              <ReceiptCapture
                onImageCapture={handleImageCapture}
                processing={processing}
              />
            </div>
          )}

          {step === 'process' && (
            <div className="p-6 text-center">
              <LoadingSpinner size="lg" />
              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">מעבד את הקבלה...</h3>
              <p className="text-gray-600">מזהה טקסט ומוצרי בשר באמצעות בינה מלאכותית</p>
              
              {currentResult && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">תוצאות ביניים:</h4>
                  <div className="text-blue-800 text-sm">
                    <p>זוהו {currentResult?.extractedItems.length || 0} פריטים</p>
                    {currentResult.storeInfo && (
                      <p>חנות: {currentResult.storeInfo.name}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'validate' && currentResult && validationResult && (
            <div className="p-6">
              <ResultValidation
                validationResult={validationResult}
                onItemUpdate={handleItemUpdate}
                onItemRemove={handleItemRemove}
                onValidate={handleValidation}
                processing={processing}
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {hasResult && step !== 'capture' && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleStartOver}
              disabled={processing}
              className="flex items-center space-x-2 rtl:space-x-reverse text-gray-600 hover:text-gray-800 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>התחל מחדש</span>
            </button>
          </div>
        )}

        {/* Bulk Submit Modal */}
        {showSubmitModal && validationResult && (
          <BulkSubmitModal
            isOpen={showSubmitModal}
            onClose={() => setShowSubmitModal(false)}
            validationResult={validationResult}
            onSubmit={handleBulkSubmit}
            processing={processing}
            detectedStore={currentResult?.storeInfo}
          />
        )}
      </div>
    </div>
  )
}

export default OCRPage