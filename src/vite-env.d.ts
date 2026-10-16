/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_EVENT_DATE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module 'html5-qrcode' {
  export class Html5Qrcode {
    constructor(elementId: string, verbose?: boolean);
    static getCameras(): Promise<Array<{ id: string; label: string }>>;
    start(
      cameraIdOrConfig: string | { facingMode: string },
      configuration: any,
      qrCodeSuccessCallback: (decodedText: string, result: any) => void,
      qrCodeErrorCallback?: (errorMessage: string) => void
    ): Promise<null>;
    stop(): Promise<void>;
    clear(): void;
    scanFile(imageFile: File, showImage?: boolean): Promise<string>;
  }
}

declare module 'three/examples/jsm/postprocessing/EffectComposer.js' {
  export class EffectComposer {
    constructor(renderer: any, renderTarget?: any);
    addPass(pass: any): void;
    render(deltaTime?: number): void;
    setSize(width: number, height: number): void;
  }
}

declare module 'three/examples/jsm/postprocessing/RenderPass.js' {
  export class RenderPass {
    constructor(scene: any, camera: any);
  }
}

declare module 'three/examples/jsm/postprocessing/UnrealBloomPass.js' {
  export class UnrealBloomPass {
    strength: number;
    radius: number;
    threshold: number;
    constructor(resolution: any, strength: number, radius: number, threshold: number);
  }
}

