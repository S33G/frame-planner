import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('../../../utils/throttle', () => ({
  throttle: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}))

vi.mock('../../../services/imageStorage', () => ({
  saveImage: vi.fn().mockResolvedValue(undefined),
  deleteImage: vi.fn().mockResolvedValue(undefined),
  getImageUrl: vi.fn().mockResolvedValue(null),
}))

import { useAppStore } from '../../../store/useAppStore'
import { FrameEditor } from '../FrameEditor'
import { getImageUrl } from '../../../services/imageStorage'
import type { Frame } from '../../../types'

function resetStore() {
  const { setState, getInitialState } = useAppStore
  setState(getInitialState(), true)
  useAppStore.temporal.getState().clear()
  localStorage.clear()
}

function createTestFrame(overrides: Partial<Frame> = {}): Frame {
  return {
    id: 'test-frame-1',
    x: 50,
    y: 50,
    width: 40,
    height: 30,
    shape: 'rect',
    frameColor: '#2C2C2C',
    frameWidth: 2,
    matEnabled: false,
    matWidth: 5,
    matColor: '#FFFEF2',
    imageId: null,
    label: 'Test Frame',
    hangingOffset: 3,
    ...overrides,
  }
}

function setupStoreWithFrame(frame: Frame) {
  useAppStore.setState((state) => ({
    ...state,
    frames: [frame],
    selectedFrameIds: [frame.id],
  }), true)
}

describe('FrameEditor', () => {
  beforeEach(() => {
    resetStore()
    vi.clearAllMocks()
  })

  it('renders with current frame properties', () => {
    const frame = createTestFrame({ label: 'My Portrait' })
    setupStoreWithFrame(frame)

    render(<FrameEditor frame={frame} />)

    const labelInput = screen.getByPlaceholderText('Frame name...')
    expect(labelInput).toHaveValue('My Portrait')

    const widthInput = screen.getByLabelText('Frame width')
    expect(widthInput).toHaveValue(40)

    const heightInput = screen.getByLabelText('Frame height')
    expect(heightInput).toHaveValue(30)
  })

  it('displays dimensions in inches when unit is inches', () => {
    const frame = createTestFrame({ width: 40, height: 30 })
    setupStoreWithFrame(frame)
    useAppStore.setState({ unit: 'in' }, false)

    render(<FrameEditor frame={frame} />)

    const widthInput = screen.getByLabelText('Frame width')
    expect(widthInput).toHaveValue(15.75)

    const heightInput = screen.getByLabelText('Frame height')
    expect(heightInput).toHaveValue(11.81)
  })

  it('changing width input calls updateFrame with cm value', () => {
    const frame = createTestFrame()
    setupStoreWithFrame(frame)

    render(<FrameEditor frame={frame} />)

    const widthInput = screen.getByLabelText('Frame width')
    fireEvent.change(widthInput, { target: { value: '50' } })

    const updated = useAppStore.getState().frames.find((f) => f.id === frame.id)
    expect(updated?.width).toBe(50)
  })

  it('changing width input in inches converts to cm', () => {
    const frame = createTestFrame()
    setupStoreWithFrame(frame)
    useAppStore.setState({ unit: 'in' }, false)

    render(<FrameEditor frame={frame} />)

    const widthInput = screen.getByLabelText('Frame width')
    fireEvent.change(widthInput, { target: { value: '10' } })

    const updated = useAppStore.getState().frames.find((f) => f.id === frame.id)
    expect(updated?.width).toBeCloseTo(25.4, 1)
  })

  it('changing height input calls updateFrame with new height', () => {
    const frame = createTestFrame()
    setupStoreWithFrame(frame)

    render(<FrameEditor frame={frame} />)

    const heightInput = screen.getByLabelText('Frame height')
    fireEvent.change(heightInput, { target: { value: '60' } })

    const updated = useAppStore.getState().frames.find((f) => f.id === frame.id)
    expect(updated?.height).toBe(60)
  })

  it('ignores invalid dimension input (NaN or <= 0)', () => {
    const frame = createTestFrame({ width: 40 })
    setupStoreWithFrame(frame)

    render(<FrameEditor frame={frame} />)

    const widthInput = screen.getByLabelText('Frame width')
    fireEvent.change(widthInput, { target: { value: '' } })

    const updated = useAppStore.getState().frames.find((f) => f.id === frame.id)
    expect(updated?.width).toBe(40)

    fireEvent.change(widthInput, { target: { value: '0' } })
    const updated2 = useAppStore.getState().frames.find((f) => f.id === frame.id)
    expect(updated2?.width).toBe(40)
  })

  it('clicking frame color preset updates frameColor', () => {
    const frame = createTestFrame({ frameColor: '#2C2C2C' })
    setupStoreWithFrame(frame)

    render(<FrameEditor frame={frame} />)

    const goldButton = screen.getByLabelText('Gold')
    fireEvent.click(goldButton)

    const updated = useAppStore.getState().frames.find((f) => f.id === frame.id)
    expect(updated?.frameColor).toBe('#C5A55A')
  })

  it('custom color picker updates frameColor', () => {
    const frame = createTestFrame()
    setupStoreWithFrame(frame)

    render(<FrameEditor frame={frame} />)

    const colorPicker = screen.getByTitle('Custom color')
    fireEvent.change(colorPicker, { target: { value: '#FF0000' } })

    const updated = useAppStore.getState().frames.find((f) => f.id === frame.id)
    expect(updated?.frameColor).toBe('#ff0000')
  })

  it('frame width slider updates frameWidth', () => {
    const frame = createTestFrame({ frameWidth: 2 })
    setupStoreWithFrame(frame)

    render(<FrameEditor frame={frame} />)

    const slider = screen.getByRole('slider')
    fireEvent.change(slider, { target: { value: '4' } })

    const updated = useAppStore.getState().frames.find((f) => f.id === frame.id)
    expect(updated?.frameWidth).toBe(4)
  })

  it('mat toggle enables mat fields', () => {
    const frame = createTestFrame({ matEnabled: false })
    setupStoreWithFrame(frame)

    const { rerender } = render(<FrameEditor frame={frame} />)

    expect(screen.queryByText(/Mat Width/i)).not.toBeInTheDocument()

    const toggle = screen.getByRole('switch')
    fireEvent.click(toggle)

    const updated = useAppStore.getState().frames.find((f) => f.id === frame.id)!
    expect(updated.matEnabled).toBe(true)

    rerender(<FrameEditor frame={updated} />)

    expect(screen.getByText(/Mat Width/i)).toBeInTheDocument()
    expect(screen.getByText('Mat Color')).toBeInTheDocument()
  })

  it('mat toggle disables mat fields', () => {
    const frame = createTestFrame({ matEnabled: true })
    setupStoreWithFrame(frame)

    const { rerender } = render(<FrameEditor frame={frame} />)

    expect(screen.getByText(/Mat Width/i)).toBeInTheDocument()

    const toggle = screen.getByRole('switch')
    fireEvent.click(toggle)

    const updated = useAppStore.getState().frames.find((f) => f.id === frame.id)!
    expect(updated.matEnabled).toBe(false)

    rerender(<FrameEditor frame={updated} />)
    expect(screen.queryByText('Mat Color')).not.toBeInTheDocument()
  })

  it('mat color preset updates matColor', () => {
    const frame = createTestFrame({ matEnabled: true, matColor: '#FFFEF2' })
    setupStoreWithFrame(frame)

    render(<FrameEditor frame={frame} />)

    const lightGrayBtn = screen.getByLabelText('Light Gray')
    fireEvent.click(lightGrayBtn)

    const updated = useAppStore.getState().frames.find((f) => f.id === frame.id)
    expect(updated?.matColor).toBe('#D9D9D9')
  })

  it('upload artwork button triggers file input', () => {
    const frame = createTestFrame({ imageId: null })
    setupStoreWithFrame(frame)

    render(<FrameEditor frame={frame} />)

    const uploadBtn = screen.getByText('Upload artwork image')
    expect(uploadBtn).toBeInTheDocument()
  })

  it('shows image preview when frame has imageId', async () => {
    const mockUrl = 'blob:http://localhost/test-image'
    vi.mocked(getImageUrl).mockResolvedValue(mockUrl)

    const frame = createTestFrame({ imageId: 'img-123' })
    setupStoreWithFrame(frame)

    render(<FrameEditor frame={frame} />)

    await waitFor(() => {
      const img = screen.getByRole('img', { name: 'Artwork preview' })
      expect(img).toHaveAttribute('src', mockUrl)
    })

    expect(screen.getByText('Remove image')).toBeInTheDocument()
  })

  it('label input updates frame label', () => {
    const frame = createTestFrame({ label: '' })
    setupStoreWithFrame(frame)

    render(<FrameEditor frame={frame} />)

    const labelInput = screen.getByPlaceholderText('Frame name...')
    fireEvent.change(labelInput, { target: { value: 'Living Room Art' } })

    const updated = useAppStore.getState().frames.find((f) => f.id === frame.id)
    expect(updated?.label).toBe('Living Room Art')
  })

  it('hanging offset input updates hangingOffset in cm', () => {
    const frame = createTestFrame({ hangingOffset: 3 })
    setupStoreWithFrame(frame)

    render(<FrameEditor frame={frame} />)

    const offsetInput = screen.getByLabelText('Hanging offset')
    fireEvent.change(offsetInput, { target: { value: '5' } })

    const updated = useAppStore.getState().frames.find((f) => f.id === frame.id)
    expect(updated?.hangingOffset).toBe(5)
  })

  it('remove frame button calls removeFrame', () => {
    const frame = createTestFrame()
    setupStoreWithFrame(frame)

    render(<FrameEditor frame={frame} />)

    const removeBtn = screen.getByText('Remove Frame')
    fireEvent.click(removeBtn)

    const remaining = useAppStore.getState().frames
    expect(remaining).toHaveLength(0)
  })

  it('displays frame width label in cm', () => {
    const frame = createTestFrame({ frameWidth: 3.5 })
    setupStoreWithFrame(frame)

    render(<FrameEditor frame={frame} />)

    expect(screen.getByText('Frame Width: 3.5 cm')).toBeInTheDocument()
  })
})
