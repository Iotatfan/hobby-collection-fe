import axios from "axios"
axios.defaults.baseURL = 'http://localhost:8080';

const getAllCollections = async () => {
    try {
        const response = await axios.get('/collection', )
        return response.data.data.collections
    } catch (error) {
        console.log("Error fetching collections:", error)
    }
}

const getCollection = async (id: number) => {
    try {
        const response = await axios.get(`/collection/${id}`) 
        return response.data.data
            } catch (error) {
        console.log("Error fetching collection detail:", error)
    }
}      

const collectionServices = {
    getAllCollections,
    getCollection
}

export default collectionServices