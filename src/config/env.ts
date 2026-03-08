type AppRuntimeConfig = {
    API_BASE_URL?: string
    API_JWT?: string
    CLOUDINARY_CLOUD_NAME?: string
}

const runtimeConfig = window.__APP_CONFIG__ as AppRuntimeConfig | undefined

const env = {
    apiBaseUrl: runtimeConfig?.API_BASE_URL || import.meta.env.VITE_API_BASE_URL || "",
    apiJwt: runtimeConfig?.API_JWT || import.meta.env.VITE_API_JWT,
    cloudinaryCloudName: runtimeConfig?.CLOUDINARY_CLOUD_NAME || import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
} as const

if (!env.apiBaseUrl) {
    console.warn("Missing API base URL. Set window.__APP_CONFIG__.API_BASE_URL or VITE_API_BASE_URL.")
}

export default env
