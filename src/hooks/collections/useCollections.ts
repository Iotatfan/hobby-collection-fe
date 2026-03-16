import { ICollection, ICollectionFilterQuery } from "@/libs/collection/collection"
import collectionServices from "@/services/content/collectionServices"
import { useState, useCallback } from "react"

const useCollections = () => {

    const [collections, setCollections] = useState<ICollection[]>()

    const getCollections = useCallback(async (query?: ICollectionFilterQuery) => {
        const response = await collectionServices.getAllCollections(query)
        setCollections(response)
    }, [])

    return {
        collections,
        getCollections
    }
}

export default useCollections
