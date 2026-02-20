import { Component, useEffect } from 'react'
import type { ReactNode } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { WallCanvas } from '@/components/canvas/WallCanvas'
import { WallScene } from '@/components/three/WallScene'
import { Sidebar } from '@/components/ui/Sidebar'
import { Toolbar } from '@/components/ui/Toolbar'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { FrameEditor } from '@/components/ui/FrameEditor'

interface ErrorBoundaryProps {
  fallback: ReactNode
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

function useKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const ids = useAppStore.getState().selectedFrameIds
        const removeFrame = useAppStore.getState().removeFrame
        for (const id of ids) {
          removeFrame(id)
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault()
        const allFrames = useAppStore.getState().frames
        const selectFrame = useAppStore.getState().selectFrame
        for (const f of allFrames) {
          selectFrame(f.id, true)
        }
      }

      if (e.key === 'Escape') {
        useAppStore.getState().deselectAll()
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        useAppStore.temporal.getState().undo()
      }

      if (
        ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')
      ) {
        e.preventDefault()
        useAppStore.temporal.getState().redo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}

function App() {
  const viewMode = useAppStore((s) => s.viewMode)
  const frames = useAppStore((s) => s.frames)
  const selectedFrameIds = useAppStore((s) => s.selectedFrameIds)
  const deselectAll = useAppStore((s) => s.deselectAll)

  useKeyboardShortcuts()

  const selectedFrame = frames.find((f) => selectedFrameIds.includes(f.id))
  const showBottomSheet = selectedFrame != null

  return (
    <div className="flex h-full bg-bg">
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col relative">
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
          <Toolbar />
        </div>

        <div className="flex-1 bg-canvas-bg" style={{ touchAction: 'none' }}>
          {viewMode === '2d' ? (
            <WallCanvas />
          ) : (
            <ErrorBoundary
              fallback={
                <div className="flex items-center justify-center h-full text-text-muted">
                  3D view is not available
                </div>
              }
            >
              <WallScene />
            </ErrorBoundary>
          )}
        </div>
      </div>

      <div className="md:hidden">
        <BottomSheet open={showBottomSheet} onClose={deselectAll}>
          {selectedFrame && <FrameEditor frame={selectedFrame} />}
        </BottomSheet>
      </div>
    </div>
  )
}

export default App
