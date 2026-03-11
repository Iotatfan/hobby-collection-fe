import axios from "axios"
import env from "../config/env"

export const getAuthToken = () => localStorage.getItem("jwt") || ""

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
    const parts = token.split(".")
    if (parts.length !== 3) return null

    try {
        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/")
        const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=")
        const json = atob(padded)
        return JSON.parse(json) as Record<string, unknown>
    } catch {
        return null
    }
}

export const isValidJwtToken = (token: string) => {
    if (!token) return false

    const payload = decodeJwtPayload(token)
    if (!payload) return false

    const exp = payload.exp
    if (typeof exp === "number") {
        const nowInSeconds = Math.floor(Date.now() / 1000)
        if (exp <= nowInSeconds) return false
    }

    return true
}

export const canManageCollection = () => {
    return isValidJwtToken(getAuthToken())
}

const http = axios.create({
    baseURL: env.apiBaseUrl,
})

export default http
