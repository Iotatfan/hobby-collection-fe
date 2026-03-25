import { ICollection, ICollectionDrawerContent, ICollectionFilterQuery, ICollectionTypeFilterItem } from "@/libs/collection/collection"

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

type CollectionFilterCache = {
  data: ICollectionTypeFilterItem[]
  timestamp: number
}

const CACHE_DURATION  = 24 * 60 * 60 * 1000 // one day

function parseCachedJson<T>(raw: string, key: string): T | null {
  try {
    return JSON.parse(raw) as T
  } catch {
    localStorage.removeItem(key)
    return null
  }
}

function getCollectionListCacheKey(query?: ICollectionFilterQuery) {
  if (!query) return "collection_list"

  const { collection_type_id, grade_id, release_type_id, sort, limit, offset } = query
  const releaseTypeKey = (release_type_id && release_type_id.length > 0)
    ? [...release_type_id].sort((a, b) => a - b).join("-")
    : undefined
  const hasQuery = [collection_type_id, grade_id, limit, offset].some((value) => typeof value === "number")
    || Boolean(sort)
    || Boolean(releaseTypeKey)
  if (!hasQuery) return "collection_list"

  return `collection_list_ct${collection_type_id ?? "all"}_g${grade_id ?? "all"}_l${limit ?? "all"}_o${offset ?? "all"}_s${sort ?? "default"}_rt${releaseTypeKey ?? "none"}`
}

export function getCachedCollection(id: number): ICollection | null {
  const key = `collection_${id}`
  const raw = localStorage.getItem(key)
  if (!raw) return null

  const parsed = parseCachedJson<CollectionDetailCache>(raw, key)
  if (!parsed) return null

  if (Date.now() - parsed.timestamp > CACHE_DURATION ) {
    localStorage.removeItem(key)
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
  const key = getCollectionListCacheKey(query)
  const raw = localStorage.getItem(key)
  if (!raw) return null

  const parsed = parseCachedJson<CollectionListCache>(raw, key)
  if (!parsed) return null

  if (Date.now() - parsed.timestamp > CACHE_DURATION ) {
    localStorage.removeItem(key)
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
  const key = `collection_drawer`
  const raw = localStorage.getItem(key)
  if (!raw) return null

  const parsed = parseCachedJson<CollectionDrawerCache>(raw, key)
  if (!parsed) return null

  if (Date.now() - parsed.timestamp > CACHE_DURATION) {
    localStorage.removeItem(key)
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

export function getCachedCollectionTypeFilters(): ICollectionTypeFilterItem[] | null {
  const key = `collection_filters`
  const raw = localStorage.getItem(key)
  if (!raw) return null

  const parsed = parseCachedJson<CollectionFilterCache>(raw, key)
  if (!parsed) return null

  if (Date.now() - parsed.timestamp > CACHE_DURATION) {
    localStorage.removeItem(key)
    return null
  }

  return parsed.data
}

export function setCachedCollectionTypeFilters(data: ICollectionTypeFilterItem[]) {
  const entry: CollectionFilterCache = {
    data,
    timestamp: Date.now(),
  }

  localStorage.setItem(`collection_filters`, JSON.stringify(entry))
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
  localStorage.removeItem(`collection_filters`)
  if (typeof id === "number") {
    localStorage.removeItem(`collection_${id}`)
  }
}
