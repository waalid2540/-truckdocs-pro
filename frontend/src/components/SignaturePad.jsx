import { useRef, useState, useEffect } from 'react'
import { X, Trash2, Check } from 'lucide-react'

export default function SignaturePad({ isOpen, onClose, onSave, documentTitle = 'Document' }) {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isEmpty, setIsEmpty] = useState(true)

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')

      // Set canvas size
      canvas.width = 600
      canvas.height = 300

      // Set drawing style
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }
  }, [isOpen])

  const startDrawing = (e) => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()

    ctx.beginPath()
    const x = e.clientX ? e.clientX - rect.left : e.touches[0].clientX - rect.left
    const y = e.clientY ? e.clientY - rect.top : e.touches[0].clientY - rect.top
    ctx.moveTo(x, y)

    setIsDrawing(true)
    setIsEmpty(false)
  }

  const draw = (e) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()

    const x = e.clientX ? e.clientX - rect.left : e.touches[0].clientX - rect.left
    const y = e.clientY ? e.clientY - rect.top : e.touches[0].clientY - rect.top

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setIsEmpty(true)
  }

  const saveSignature = () => {
    if (isEmpty) {
      alert('Please sign before saving')
      return
    }

    const canvas = canvasRef.current
    const signatureData = canvas.toDataURL('image/png')
    onSave(signatureData)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full">
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Sign Document</h2>
            <p className="text-sm text-gray-600 mt-1">{documentTitle}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Please sign below using your mouse or touch screen
            </p>
          </div>

          <div className="border-2 border-gray-300 rounded-lg bg-white">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full cursor-crosshair"
              style={{ touchAction: 'none' }}
            />
          </div>

          <div className="flex justify-between items-center mt-6">
            <button
              onClick={clearSignature}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 text-gray-700"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveSignature}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Check className="w-4 h-4" />
                Save Signature
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
