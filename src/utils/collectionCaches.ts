import { ICollection, ICollectionDrawerContent, ICollectionFilterQuery } from "@/libs/collection/collection"

type CollectionDetailCache = {
  data: ICollection
  timestamp: number
}

type CollectionListCache = {
  data: ICollection[]
  timestamp: number
}

type CollectionDrawerCache = {
  data: ICollectionDrawerContent
  timestamp: number
}

const CACHE_DURATION  = 24 * 60 * 60 * 1000 // one day

function getCollectionListCacheKey(query?: ICollectionFilterQuery) {
  if (!query) return "collection_list"

  const { collection_type_id, grade_id, limit, offset } = query
  const hasQuery = [collection_type_id, grade_id, limit, offset].some((value) => typeof value === "number")
  if (!hasQuery) return "collection_list"

  return `collection_list_ct${collection_type_id ?? "all"}_g${grade_id ?? "all"}_l${limit ?? "all"}_o${offset ?? "all"}`
}

export function getCachedCollection(id: number): ICollection | null {
  const raw = localStorage.getItem(`collection_${id}`)
  if (!raw) return null

  const parsed: CollectionDetailCache = JSON.parse(raw)

  if (Date.now() - parsed.timestamp > CACHE_DURATION ) {
    localStorage.removeItem(`collection_${id}`)
    return null
  }

  return parsed.data
}

export function setCachedCollection(data: ICollection) {
  const entry: CollectionDetailCache = {
    data,
    timestamp: Date.now()
  }

  localStorage.setItem(`collection_${data.id}`, JSON.stringify(entry))
}

export function getCachedCollectionList(query?: ICollectionFilterQuery): ICollection[] | null {
  const raw = localStorage.getItem(getCollectionListCacheKey(query))
  if (!raw) return null

  const parsed: CollectionListCache = JSON.parse(raw)

  if (Date.now() - parsed.timestamp > CACHE_DURATION ) {
    localStorage.removeItem(getCollectionListCacheKey(query))
    return null
  }

  return parsed.data
}

export function setCachedCollectionList(data: ICollection[], query?: ICollectionFilterQuery) {
  const entry: CollectionListCache = {
    data,
    timestamp: Date.now()
  }

  localStorage.setItem(getCollectionListCacheKey(query), JSON.stringify(entry))
}

export function getCachedCollectionDrawer(): ICollectionDrawerContent | null {
  const raw = localStorage.getItem(`collection_drawer`)
  if (!raw) return null

  const parsed: CollectionDrawerCache = JSON.parse(raw)

  if (Date.now() - parsed.timestamp > CACHE_DURATION) {
    localStorage.removeItem(`collection_drawer`)
    return null
  }

  return parsed.data
}

export function setCachedCollectionDrawer(data: ICollectionDrawerContent) {
  const entry: CollectionDrawerCache = {
    data,
    timestamp: Date.now(),
  }

  localStorage.setItem(`collection_drawer`, JSON.stringify(entry))
}

export function invalidateCollectionCache(id?: number) {
  const listCacheKeys: string[] = []
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index)
    if (key?.startsWith("collection_list")) {
      listCacheKeys.push(key)
    }
  }
  listCacheKeys.forEach((key) => localStorage.removeItem(key))
  localStorage.removeItem(`collection_drawer`)
  if (typeof id === "number") {
    localStorage.removeItem(`collection_${id}`)
  }
}
