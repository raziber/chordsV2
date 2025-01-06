import AsyncStorage from "@react-native-async-storage/async-storage";

interface CacheItem {
  timestamp: number;
  data: any;
}

export default class Cache {
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  static async get(key: string): Promise<any | null> {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return null;

      const { data }: CacheItem = JSON.parse(cached);
      return data;
    } catch (error) {
      console.error("Cache read error:", error);
      return null;
    }
  }

  static async save(key: string, data: any): Promise<void> {
    try {
      const cacheItem: CacheItem = {
        timestamp: Date.now(),
        data,
      };
      await AsyncStorage.setItem(key, JSON.stringify(cacheItem));
    } catch (error) {
      console.error("Cache write error:", error);
    }
  }

  static async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error("Cache clear error:", error);
    }
  }

  static async removeExpired(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      for (const key of keys) {
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          const { timestamp }: CacheItem = JSON.parse(cached);
          if (Date.now() - timestamp > this.CACHE_DURATION) {
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
}
