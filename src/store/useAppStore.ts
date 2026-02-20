import { create } from 'zustand'
import { temporal } from 'zundo'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { Frame, Wall, Unit, ViewMode } from '@/types'
import { DEFAULT_FRAME, DEFAULT_WALL, UNDO_LIMIT, MAX_FRAMES } from '@/utils/constants'
import { throttle } from '@/utils/throttle'

export interface AppState {
  wall: Wall
  frames: Frame[]
  selectedFrameIds: string[]
  unit: Unit
  snapEnabled: boolean
  viewMode: ViewMode
  gridEnabled: boolean
  gridSpacing: number
  drillHolesVisible: boolean
  zoomLevel: number
}

export interface AppActions {
  addFrame: (shape: 'rect' | 'ellipse') => void
  removeFrame: (id: string) => void
  updateFrame: (id: string, updates: Partial<Frame>) => void
  duplicateFrame: (id: string) => void
  selectFrame: (id: string, multi?: boolean) => void
  deselectAll: () => void
  setWall: (updates: Partial<Wall>) => void
  setUnit: (unit: Unit) => void
  toggleSnap: () => void
  setViewMode: (mode: ViewMode) => void
  toggleGrid: () => void
  setGridSpacing: (spacing: number) => void
  toggleDrillHoles: () => void
  setZoomLevel: (level: number) => void
}

export type AppStore = AppState & AppActions

export const useAppStore = create<AppStore>()(
  temporal(
    persist(
      immer((set) => ({
        wall: { ...DEFAULT_WALL },
        frames: [] as Frame[],
        selectedFrameIds: [] as string[],
        unit: 'cm' as Unit,
        snapEnabled: true,
        viewMode: '2d' as ViewMode,
        gridEnabled: false,
        gridSpacing: 10,
        drillHolesVisible: false,
        zoomLevel: 1,

        addFrame: (shape: 'rect' | 'ellipse') => {
          set((state) => {
            if (state.frames.length >= MAX_FRAMES) return
            const wall = state.wall
            const newFrame: Frame = {
              ...DEFAULT_FRAME,
              id: self.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
              shape,
              x: (wall.width - DEFAULT_FRAME.width) / 2,
              y: (wall.height - DEFAULT_FRAME.height) / 2,
            }
            state.frames.push(newFrame)
          })
        },

        removeFrame: (id: string) => {
          set((state) => {
            state.frames = state.frames.filter((f) => f.id !== id)
            state.selectedFrameIds = state.selectedFrameIds.filter(
              (fid) => fid !== id,
            )
          })
        },

        updateFrame: (id: string, updates: Partial<Frame>) => {
          set((state) => {
            const frame = state.frames.find((f) => f.id === id)
            if (frame) {
              Object.assign(frame, updates)
            }
          })
        },

        duplicateFrame: (id: string) => {
          set((state) => {
            if (state.frames.length >= MAX_FRAMES) return
            const source = state.frames.find((f) => f.id === id)
            if (!source) return
            const duplicate: Frame = {
              ...source,
              id: self.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
              x: source.x + 2,
              y: source.y + 2,
            }
            state.frames.push(duplicate)
          })
        },

        selectFrame: (id: string, multi?: boolean) => {
          set((state) => {
            if (multi) {
              if (!state.selectedFrameIds.includes(id)) {
                state.selectedFrameIds.push(id)
              }
            } else {
              state.selectedFrameIds = [id]
            }
          })
        },

        deselectAll: () => {
          set((state) => {
            state.selectedFrameIds = []
          })
        },

        setWall: (updates: Partial<Wall>) => {
          set((state) => {
            Object.assign(state.wall, updates)
          })
        },

        setUnit: (unit: Unit) => {
          set((state) => {
            state.unit = unit
          })
        },

        toggleSnap: () => {
          set((state) => {
            state.snapEnabled = !state.snapEnabled
          })
        },

        setViewMode: (mode: ViewMode) => {
          set((state) => {
            state.viewMode = mode
          })
        },

        toggleGrid: () => {
          set((state) => {
            state.gridEnabled = !state.gridEnabled
          })
        },

        setGridSpacing: (spacing: number) => {
          set((state) => {
            state.gridSpacing = spacing
          })
        },

        toggleDrillHoles: () => {
          set((state) => {
            state.drillHolesVisible = !state.drillHolesVisible
          })
        },

        setZoomLevel: (level: number) => {
          set((state) => {
            state.zoomLevel = level
          })
        },
      })),
      {
        name: 'frame-planner-storage',
        partialize: (state) => ({
          wall: state.wall,
          frames: state.frames,
          unit: state.unit,
          snapEnabled: state.snapEnabled,
          gridEnabled: state.gridEnabled,
          gridSpacing: state.gridSpacing,
          drillHolesVisible: state.drillHolesVisible,
        }),
      },
    ),
    {
      limit: UNDO_LIMIT,
      handleSet: (handleSet) => {
        const throttled = throttle(
          (...args: Parameters<typeof handleSet>) => {
            ;(handleSet as (...a: Parameters<typeof handleSet>) => void)(
              ...args,
            )
          },
          1000,
        )
        return throttled as typeof handleSet
      },
      partialize: (state) => {
        const { selectedFrameIds: _sel, viewMode: _vm, zoomLevel: _zl, ...rest } = state
        return rest
      },
    },
  ),
)
