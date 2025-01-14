import AsyncStorage from "@react-native-async-storage/async-storage";

interface CacheItem<T> {
  timestamp: number;
  data: T;
  version?: string;
}

interface CacheOptions {
  duration?: number;
  prefix?: string;
  validator?: (data: any) => boolean;
  compress?: boolean;
  version?: string;
}

export default class Cache {
  private static readonly DEFAULT_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly DEFAULT_PREFIX = "app_cache:";

  private static getFullKey(key: string, options: CacheOptions): string {
    const prefix =
      options.prefix !== undefined ? options.prefix : this.DEFAULT_PREFIX;
    return prefix + key;
  }

  static async get<T>(
    key: string,
    options: CacheOptions = {}
  ): Promise<T | null> {
    try {
      const fullKey = this.getFullKey(key, options);
      const cached = await AsyncStorage.getItem(fullKey);
      if (!cached) return null;

      const cacheItem: CacheItem<T> = JSON.parse(cached);

      if (this.isExpired(cacheItem.timestamp, options.duration)) {
        await AsyncStorage.removeItem(fullKey);
        return null;
      }

      if (options.version && cacheItem.version !== options.version) {
        await AsyncStorage.removeItem(fullKey);
        return null;
      }

      if (options.validator && !options.validator(cacheItem.data)) {
        await AsyncStorage.removeItem(fullKey);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.error("Cache read error:", error);
      return null;
    }
  }

  static async save<T>(
    key: string,
    data: T,
    options: CacheOptions = {}
  ): Promise<void> {
    try {
      const fullKey = this.getFullKey(key, options);
      const cacheItem: CacheItem<T> = {
        timestamp: Date.now(),
        data,
        version: options.version,
      };
      await AsyncStorage.setItem(fullKey, JSON.stringify(cacheItem));
    } catch (error) {
      console.error("Cache write error:", error);
    }
  }

  static async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      await AsyncStorage.multiRemove(keys);
      console.log("Cache cleared");
    } catch (error) {
      console.error("Cache clear error:", error);
    }
  }

  static async removeExpired(options: CacheOptions = {}): Promise<void> {
    try {
      const prefix =
        options.prefix !== undefined ? options.prefix : this.DEFAULT_PREFIX;
      const keys = await AsyncStorage.getAllKeys();
      const prefixedKeys = keys.filter((key) => key.startsWith(prefix));

      for (const key of prefixedKeys) {
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          const { timestamp }: CacheItem<any> = JSON.parse(cached);
          if (this.isExpired(timestamp, options.duration)) {
            await AsyncStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.error("Cache cleanup error:", error);
    }
  }

  static async getSize(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys.length;
    } catch (error) {
      console.error("Cache size check error:", error);
      return 0;
    }
  }

  static async fetchUrl<T>(
    url: string,
    parser: (data: string) => T,
    options: CacheOptions = {}
  ): Promise<T | null> {
    const cachedData = await this.get<T>(url, options);
    if (cachedData) return cachedData;

    return await this.fetchAndCache<T>(url, parser, options);
  }

  private static async tryGetFromCache<T>(url: string): Promise<T | null> {
    const cachedData = await this.get(url);
    if (cachedData) {
      return cachedData as T;
    }
    return null;
  }

  private static async fetchAndCache<T>(
    url: string,
    parser: (data: string) => T,
    options: CacheOptions
  ): Promise<T | null> {
    try {
      const rawData = await this.fetchData(url);
      if (!rawData) return null;

      const parsedData = parser(rawData);
      await this.save(url, parsedData, options);
      return parsedData;
    } catch (error) {
      console.error("Error processing data for:", url, error);
      return null;
    }
  }

  private static isExpired(timestamp: number, duration?: number): boolean {
    return Date.now() - timestamp > (duration || this.DEFAULT_DURATION);
  }

  private static async fetchData(url: string): Promise<string | null> {
    try {
      const response = await fetch(url);
      return await response.text();
    } catch (error) {
      console.error("Network error for:", url, error);
      return null;
    }
  }
}
