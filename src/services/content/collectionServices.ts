import { ICollection, ICollectionDrawerContent, ICollectionUploadPayload, ICollectionUpsertPayload } from "@/libs/collection/collection";
import http, { getAuthToken, isValidJwtToken } from "@/services/http"
import { getCachedCollection, setCachedCollection, getCachedCollectionList, setCachedCollectionList, invalidateCollectionCache, getCachedCollectionDrawer, setCachedCollectionDrawer } from "@/utils/collectionCaches";

const getAllCollections = async () => {
    const cached = getCachedCollectionList()
    if (cached) return cached as ICollection[]

    try {
        const response = await http.get('/collection',)
        setCachedCollectionList(response.data.data.collections as ICollection[])

        return response.data.data.collections as ICollection[]
    } catch (error) {
        console.error("Error fetching collections:", error)
        throw error
    }
}

const getCollection = async (id: number) => {
    const cached = getCachedCollection(id)
    if (cached) {
        return { data: cached as ICollection, fromCache: true}
    }
    
    try {
        const response = await http.get(`/collection/${id}`)
        setCachedCollection(response.data.data as ICollection)

        return { data: response.data.data as ICollection, fromCache: false }
    } catch (error) {
        console.error("Error fetching collection detail:", error)
        throw error
    }
}

const getDrawerContent = async () => {
    const cached = getCachedCollectionDrawer()
    if (cached) return cached as ICollectionDrawerContent

    try {
        const response = await http.get('/collection/drawer')
        setCachedCollectionDrawer(response.data.data as ICollectionDrawerContent)
        return response.data.data as ICollectionDrawerContent
    } catch (error) {
        console.error("Error fetching drawer content:", error)
        throw error
    }
}

type CollectionMutationPayload = ICollectionUpsertPayload | ICollectionUploadPayload | FormData

const createCollection = async (payload: CollectionMutationPayload) => {
    const token = getAuthToken()
    if (!isValidJwtToken(token)) {
        throw new Error("Missing or invalid JWT token. Set localStorage jwt.")
    }

    const response = await http.post('/create_collection', payload, {
        headers: {
            ...(payload instanceof FormData ? { "Content-Type": "multipart/form-data" } : {}),
            Authorization: `Bearer ${token}`,
        },
    })
    const data = response.data.data as ICollection
    invalidateCollectionCache(data.id)
    setCachedCollection(data)
    return data
}

const updateCollection = async (id: number, payload: CollectionMutationPayload) => {
    const token = getAuthToken()
    if (!isValidJwtToken(token)) {
        throw new Error("Missing or invalid JWT token. Set localStorage jwt.")
    }

    const response = await http.patch(`/collection/${id}`, payload, {
        headers: {
            ...(payload instanceof FormData ? { "Content-Type": "multipart/form-data" } : {}),
            Authorization: `Bearer ${token}`,
        },
    })
    const data = response.data.data as ICollection
    invalidateCollectionCache(id)
    setCachedCollection(data)
    return data
}

const collectionServices = {
    getAllCollections,
    getCollection,
    getDrawerContent,
    createCollection,
    updateCollection,
}

export default collectionServices
