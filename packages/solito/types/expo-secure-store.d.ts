declare module 'expo-secure-store' {
  /**
   * Options used when setting and getting values from the secure store
   */
  export interface SecureStoreOptions {
    /**
     * iOS only: Specifies a custom accessibility level.
     */
    keychainAccessible?: string;
    /**
     * iOS only: Specifies the value of kSecAttrAccessGroup to share with other apps.
     */
    keychainService?: string;
    /**
     * iOS only: Specifies the iCloud Keychain service attribute.
     */
    requireAuthentication?: boolean;
    /**
     * Android only: Specifies how to encrypt the values for Android.
     */
    androidSharedPreferencesName?: string;
  }

  /**
   * Store a key-value pair in the secure store
   */
  export function setItemAsync(
    key: string,
    value: string,
    options?: SecureStoreOptions
  ): Promise<void>;

  /**
   * Get a value from the secure store for a given key
   */
  export function getItemAsync(
    key: string,
    options?: SecureStoreOptions
  ): Promise<string | null>;

  /**
   * Delete a key-value pair from the secure store
   */
  export function deleteItemAsync(
    key: string,
    options?: SecureStoreOptions
  ): Promise<void>;

  /**
   * Check if the secure store contains a value for a key
   */
  export function isAvailableAsync(): Promise<boolean>;
}
