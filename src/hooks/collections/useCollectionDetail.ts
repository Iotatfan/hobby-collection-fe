import { ICollection } from "@/libs/collection/collection"
import collectionServices from "@/services/content/collectionServices"
import { useState } from "react"

const useCollectionDetail = () => {

    const [collection, setCollection] = useState<ICollection>()
    

    const getCollectionDetail = async (id: number) => {
        const response = await collectionServices.getCollection(id)

        console.log("Collection Detail:", response)
        setCollection(response)
    }

    return {
        collection,
        getCollectionDetail
    }
}

export default useCollectionDetail