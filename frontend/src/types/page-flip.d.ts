declare module 'page-flip' {
  export type SizeType = 'fixed' | 'stretch'

  export interface PageFlipOptions {
    width: number
    height: number
    size?: SizeType
    minWidth?: number
    maxWidth?: number
    minHeight?: number
    maxHeight?: number
    maxShadowOpacity?: number
    showCover?: boolean
    mobileScrollSupport?: boolean
    usePortrait?: boolean
    autoSize?: boolean
    drawShadow?: boolean
    flippingTime?: number
    startPage?: number
    swipeDistance?: number
    clickEventForward?: boolean
    useMouseEvents?: boolean
    renderOnlyPageLengthChange?: boolean
    showPageCorners?: boolean
    disableFlipByClick?: boolean
  }

  export interface FlipEvent {
    data: number
  }

  export class PageFlip {
    constructor(element: HTMLElement, options: PageFlipOptions)
    loadFromHTML(elements: HTMLElement[]): void
    flip(pageNum: number): void
    flipPrev(): void
    flipNext(): void
    getCurrentPageIndex(): number
    getPageCount(): number
    destroy(): void
    on(event: string, callback: (e: FlipEvent) => void): this
    off(event: string, callback: (e: FlipEvent) => void): this
  }
}
