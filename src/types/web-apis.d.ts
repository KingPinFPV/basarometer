// Web API TypeScript declarations for Phase 3 UX enhancements
// Voice recognition, haptic feedback, and native mobile features

declare global {
  interface Window {
    webkitSpeechRecognition: typeof SpeechRecognition
    SpeechRecognition: typeof SpeechRecognition
  }

  interface Navigator {
    vibrate(pattern: number | number[]): boolean
  }

  interface SpeechRecognitionEvent extends Event {
    resultIndex: number
    results: SpeechRecognitionResultList
  }

  interface SpeechRecognitionResultList {
    length: number
    item(index: number): SpeechRecognitionResult
    [index: number]: SpeechRecognitionResult
  }

  interface SpeechRecognitionResult {
    length: number
    item(index: number): SpeechRecognitionAlternative
    [index: number]: SpeechRecognitionAlternative
    isFinal: boolean
  }

  interface SpeechRecognitionAlternative {
    transcript: string
    confidence: number
  }

  interface SpeechRecognitionErrorEvent extends Event {
    error: string
    message?: string
  }

  class SpeechRecognition extends EventTarget {
    lang: string
    continuous: boolean
    interimResults: boolean
    maxAlternatives: number
    serviceURI: string
    grammars: SpeechGrammarList
    
    start(): void
    stop(): void
    abort(): void
    
    onstart: ((this: SpeechRecognition, ev: Event) => void) | null
    onend: ((this: SpeechRecognition, ev: Event) => void) | null
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null
    onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null
    onsoundstart: ((this: SpeechRecognition, ev: Event) => void) | null
    onsoundend: ((this: SpeechRecognition, ev: Event) => void) | null
    onspeechstart: ((this: SpeechRecognition, ev: Event) => void) | null
    onspeechend: ((this: SpeechRecognition, ev: Event) => void) | null
    onaudiostart: ((this: SpeechRecognition, ev: Event) => void) | null
    onaudioend: ((this: SpeechRecognition, ev: Event) => void) | null
  }

  interface SpeechGrammarList {
    length: number
    item(index: number): SpeechGrammar
    [index: number]: SpeechGrammar
    addFromURI(src: string, weight?: number): void
    addFromString(string: string, weight?: number): void
  }

  interface SpeechGrammar {
    src: string
    weight: number
  }

  // Extend Navigator interface for mobile features
  interface Navigator {
    share?: (data: {
      title?: string
      text?: string
      url?: string
      files?: File[]
    }) => Promise<void>
    
    clipboard?: {
      writeText(text: string): Promise<void>
      readText(): Promise<string>
    }
    
    // Geolocation is already defined, but adding for completeness
    geolocation: Geolocation
  }

  // Touch events for gesture recognition
  interface TouchEvent {
    touches: TouchList
    targetTouches: TouchList
    changedTouches: TouchList
  }

  interface Touch {
    identifier: number
    target: EventTarget
    screenX: number
    screenY: number
    clientX: number
    clientY: number
    pageX: number
    pageY: number
    radiusX?: number
    radiusY?: number
    rotationAngle?: number
    force?: number
  }

  interface TouchList {
    length: number
    item(index: number): Touch | null
    [index: number]: Touch
  }
}

export {}