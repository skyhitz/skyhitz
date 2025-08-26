let secureStorage

if (typeof window === 'undefined') {
  secureStorage = {
    save: async (key: string, value: string) => {
      return
    },
    clear: async (key: string) => {
      return
    },
    get: async (key: string) => {
      return null
    },
  }
} else {
  secureStorage = {
    save: async (key: string, value: string) => {
      await localStorage.setItem(key, value)
    },
    clear: async (key: string) => {
      await localStorage.removeItem(key)
    },
    get: async (key: string) => {
      return await localStorage.getItem(key)
    },
  }
}

export const SecureStorage = secureStorage
