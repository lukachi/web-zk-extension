// eslint-disable-next-line import/no-nodejs-modules
import { Buffer } from 'buffer'
import { openDB } from 'idb'

export interface IFileCache {
  getChunk(key: string, ttl?: number): Promise<Uint8Array | null>
  setChunk(key: string, data: Uint8Array): Promise<void>
  clear(fileKey: string): Promise<void>
  clearOldVersions(fileKey: string, currentVersion: string): Promise<void>
}

export class IndexedDBCache implements IFileCache {
  private dbPromise = openDB('FileChunksDB', 1, {
    upgrade(db) {
      db.createObjectStore('chunks', { keyPath: 'key' })
    },
  })

  async getChunk(key: string, ttl?: number): Promise<Uint8Array | null> {
    const db = await this.dbPromise
    const entry = await db.get('chunks', key)
    if (!entry) return null

    // If TTL is configured, check if the cached chunk is expired.
    if (ttl !== undefined) {
      const now = Date.now()
      if (now - entry.timestamp > ttl) {
        await db.delete('chunks', key)
        return null
      }
    }
    return entry.data
  }

  async setChunk(key: string, data: Uint8Array): Promise<void> {
    const db = await this.dbPromise
    await db.put('chunks', { key, data, timestamp: Date.now() })
  }

  async clear(fileKey: string): Promise<void> {
    const db = await this.dbPromise
    const tx = db.transaction('chunks', 'readwrite')
    const store = tx.objectStore('chunks')
    const allKeys = await store.getAllKeys()
    for (const key of allKeys) {
      if (typeof key === 'string' && key.startsWith(fileKey)) {
        await store.delete(key)
      }
    }
    await tx.done
  }

  async clearOldVersions(
    fileKey: string,
    currentVersion: string,
  ): Promise<void> {
    const db = await this.dbPromise
    const tx = db.transaction('chunks', 'readwrite')
    const store = tx.objectStore('chunks')
    const allKeys = await store.getAllKeys()
    for (const key of allKeys) {
      if (
        typeof key === 'string' &&
        key.startsWith(fileKey) &&
        !key.startsWith(`${fileKey}-${currentVersion}-`)
      ) {
        await store.delete(key)
      }
    }
    await tx.done
  }
}

export interface IRemoteFileLoader {
  cancel(): void
  onProgress: ((progress: number) => void) | null
  onError: ((error: Error) => void) | null
}

export class CachedRemoteFileLoader implements IRemoteFileLoader {
  private url: string
  private version: string
  private chunkSize: number
  private totalChunks: number | null
  private processedChunks: number
  private controller: AbortController
  private cache: IFileCache
  private cacheExpiration?: number // in milliseconds
  public onProgress: ((progress: number) => void) | null
  public onError: ((error: Error) => void) | null

  constructor(
    url: string,
    options: {
      chunkSize?: number
      onProgress?: (progress: number) => void
      onError?: (error: Error) => void
      cache?: IFileCache
      version?: string
      cacheExpiration?: number // e.g. 24 * 60 * 60 * 1000 for 24 hours
    } = {},
  ) {
    this.url = url
    this.chunkSize = options.chunkSize || 1024 * 1024 // 1MB default
    this.version = options.version || '1' // default version
    this.cacheExpiration = options.cacheExpiration || 24 * 60 * 60 * 1000
    this.totalChunks = null
    this.processedChunks = 0
    this.controller = new AbortController()
    this.onProgress = options.onProgress || null
    this.onError = options.onError || null
    this.cache = options.cache || new IndexedDBCache()
  }

  // Generate a cache key that incorporates the URL, version, and chunk index.
  private getCacheKey(index: number): string {
    return `${this.url}-${this.version}-${index}`
  }

  private async getTotalFileSize(): Promise<number> {
    const response = await fetch(this.url, {
      method: 'HEAD',
      signal: this.controller.signal,
    })

    if (!response.ok) {
      throw new Error(`Failed to get file size: ${response.statusText}`)
    }

    const contentLength = response.headers.get('content-length')
    if (!contentLength) {
      throw new Error('Content-Length header not found')
    }

    return parseInt(contentLength, 10)
  }

  private async fetchChunk(start: number, end: number): Promise<ArrayBuffer> {
    try {
      const response = await fetch(this.url, {
        headers: {
          Range: `bytes=${start}-${end}`,
        },
        signal: this.controller.signal,
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch chunk: ${response.statusText}`)
      }

      return await response.arrayBuffer()
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw error
      }
      // Retry failed chunks after a brief delay.
      await new Promise(resolve => setTimeout(resolve, 500))
      return this.fetchChunk(start, end)
    }
  }

  public async loadFile(): Promise<Buffer> {
    try {
      // Get total file size and determine the total number of chunks.
      const totalSize = await this.getTotalFileSize()
      this.totalChunks = Math.ceil(totalSize / this.chunkSize)

      // Clear cached chunks from previous versions.
      await this.cache.clearOldVersions(this.url, this.version)

      const chunks: Array<Uint8Array> = []

      for (let i = 0; i < this.totalChunks; i++) {
        // Check the cache for a valid (non-expired) chunk.
        let cachedChunk = await this.cache.getChunk(
          this.getCacheKey(i),
          this.cacheExpiration,
        )
        if (!cachedChunk) {
          const rangeStart = i * this.chunkSize
          const rangeEnd = Math.min(
            rangeStart + this.chunkSize - 1,
            totalSize - 1,
          )
          const buffer = await this.fetchChunk(rangeStart, rangeEnd)
          cachedChunk = new Uint8Array(buffer)
          // Save the newly fetched chunk to cache.
          await this.cache.setChunk(this.getCacheKey(i), cachedChunk)
        }
        chunks.push(cachedChunk)
        this.processedChunks++

        // Update progress.
        const progress = (this.processedChunks / this.totalChunks) * 100
        this.onProgress?.(progress)
      }

      // Optionally clear the cache after the file is fully assembled.
      // await this.cache.clear(this.url)

      return Buffer.concat(chunks.map(chunk => Buffer.from(chunk)))
    } catch (error) {
      if (error instanceof Error) {
        this.onError?.(error)
      }
      throw error
    }
  }

  /**
   * Check whether the file is already fully downloaded.
   *
   * This method fetches the total file size (via a HEAD request) to determine
   * the expected number of chunks, then iterates over each chunk key in the cache.
   * If all expected chunks are present and valid (non-expired), it returns true.
   */
  public async isDownloaded(): Promise<boolean> {
    try {
      const totalSize = await this.getTotalFileSize()
      const expectedChunks = Math.ceil(totalSize / this.chunkSize)
      for (let i = 0; i < expectedChunks; i++) {
        const chunk = await this.cache.getChunk(
          this.getCacheKey(i),
          this.cacheExpiration,
        )
        if (chunk === null) {
          return false
        }
      }
      return true
    } catch (error) {
      if (error instanceof Error) {
        this.onError?.(error)
      }
      return false
    }
  }

  public cancel(): void {
    this.controller.abort()
  }

  /**
   * Stream the file chunks one by one as Uint8Array.
   */
  public async *streamFile(): AsyncGenerator<Uint8Array, void, unknown> {
    const totalSize = await this.getTotalFileSize()
    console.log('totalSize: ', totalSize)
    this.totalChunks = Math.ceil(totalSize / this.chunkSize)
    console.log('totalChunks: ', this.totalChunks)

    // Clear old versions as before.
    await this.cache.clearOldVersions(this.url, this.version)

    for (let i = 0; i < this.totalChunks; i++) {
      let cachedChunk = await this.cache.getChunk(
        this.getCacheKey(i),
        this.cacheExpiration,
      )
      if (!cachedChunk) {
        const rangeStart = i * this.chunkSize
        const rangeEnd = Math.min(
          rangeStart + this.chunkSize - 1,
          totalSize - 1,
        )
        const buffer = await this.fetchChunk(rangeStart, rangeEnd)
        cachedChunk = new Uint8Array(buffer)
        await this.cache.setChunk(this.getCacheKey(i), cachedChunk)
      }
      yield cachedChunk
      // Optionally update progress here if needed.
    }
  }
}
