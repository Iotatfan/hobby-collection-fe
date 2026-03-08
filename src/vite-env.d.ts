/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: string
    readonly VITE_API_JWT?: string
    readonly VITE_CLOUDINARY_CLOUD_NAME?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

interface Window {
    __APP_CONFIG__?: {
        API_BASE_URL?: string
        API_JWT?: string
        CLOUDINARY_CLOUD_NAME?: string
    }
}
