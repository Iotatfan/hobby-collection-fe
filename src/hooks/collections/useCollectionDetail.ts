import { ICollection } from "@/libs/collection/collection"
import collectionServices from "@/services/content/collectionServices"
import { delay } from "@/utils/delay"
import { useState, useCallback, useRef } from "react"

const useCollectionDetail = () => {

    const [collection, setCollection] = useState<ICollection>()
    const latestRequestIdRef = useRef(0)

    const getCollectionDetail = useCallback(async (id: number) => {
        latestRequestIdRef.current += 1
        const requestId = latestRequestIdRef.current

        const response = await collectionServices.getCollection(id)

        if (requestId !== latestRequestIdRef.current) {
            return
        }

        setCollection(response.data)

        if (response.fromCache) {
            return delay(500)
        }
    }, [])

    return {
        collection,
        getCollectionDetail
    }
}

export default useCollectionDetail
