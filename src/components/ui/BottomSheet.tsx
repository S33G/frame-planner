import { useCallback, useRef, useState } from 'react'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}

const DISMISS_THRESHOLD = 80

export function BottomSheet({ open, onClose, children }: BottomSheetProps) {
  const [dragY, setDragY] = useState(0)
  const startY = useRef(0)
  const isDragging = useRef(false)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY
    isDragging.current = true
    setDragY(0)
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return
    const deltaY = e.touches[0].clientY - startY.current
    if (deltaY > 0) {
      setDragY(deltaY)
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false
    if (dragY > DISMISS_THRESHOLD) {
      onClose()
    }
    setDragY(0)
  }, [dragY, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />
      <div
        className="absolute bottom-0 left-0 right-0 bg-surface rounded-t-2xl max-h-[70vh] flex flex-col transition-transform duration-200 ease-out"
        style={{ transform: `translateY(${dragY}px)` }}
      >
        <div
          className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-6">
          {children}
        </div>
      </div>
    </div>
  )
}
