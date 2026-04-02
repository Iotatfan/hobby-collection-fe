import { ICollection, ICollectionDrawerContent, ICollectionFilterQuery, ICollectionTypeFilterItem, ICollectionUploadPayload, ICollectionUpsertPayload } from "@/libs/collection/collection";
import http, { getAuthToken, isValidJwtToken } from "@/services/http"
import { getCachedCollection, setCachedCollection, getCachedCollectionList, setCachedCollectionList, invalidateCollectionCache, getCachedCollectionDrawer, setCachedCollectionDrawer, getCachedCollectionTypeFilters, setCachedCollectionTypeFilters } from "@/utils/collectionCaches";

const logError = (...args: unknown[]) => {
    if (import.meta.env.DEV) {
        console.error(...args)
    }
}

const getAllCollections = async (query?: ICollectionFilterQuery) => {
    const cached = getCachedCollectionList(query)
    if (cached) return cached as ICollection[]

    try {
        const response = await http.get('/collection', {
            params: {
                collection_type_id: query?.collection_type_id,
                grade_id: query?.grade_id,
                release_type_id: query?.release_type_id,
                sort: query?.sort,
                limit: query?.limit,
                offset: query?.offset,
            },
            paramsSerializer: {
                indexes: null,
            },
        })
        setCachedCollectionList(response.data.data.collections as ICollection[], query)

        return response.data.data.collections as ICollection[]
    } catch (error) {
        logError("Error fetching collections:", error)
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
        logError("Error fetching collection detail:", error)
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
        logError("Error fetching drawer content:", error)
        throw error
    }
}

const getCollectionTypeFilters = async () => {
    const cached = getCachedCollectionTypeFilters()
    if (cached) return cached as ICollectionTypeFilterItem[]

    try {
        const response = await http.get('/collection/filter')
        const data = response.data?.data

        const resolved =
            Array.isArray(data) ? (data as ICollectionTypeFilterItem[]) :
            Array.isArray(data?.collection_types) ? (data.collection_types as ICollectionTypeFilterItem[]) :
            Array.isArray(data?.items) ? (data.items as ICollectionTypeFilterItem[]) :
            ([] as ICollectionTypeFilterItem[])

        setCachedCollectionTypeFilters(resolved)
        return resolved
    } catch (error) {
        logError("Error fetching collection filters:", error)
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
    getCollectionTypeFilters,
    createCollection,
    updateCollection,
}

export default collectionServices
