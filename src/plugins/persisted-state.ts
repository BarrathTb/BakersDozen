// import type { PiniaPluginContext } from 'pinia'

// /**
//  * Custom persisted state plugin for Pinia
//  * 
//  * This plugin provides localStorage persistence for Pinia stores
//  * with error handling and recovery mechanisms.
//  */
// export const createPersistedState = (options: {
//   prefix?: string;
//   storage?: Storage;
// } = {}) => {
//   const prefix = options.prefix || 'pinia-'
//   const storage = options.storage || localStorage
  
//   return ({ store }: PiniaPluginContext) => {
//     // Load initial state from storage if available
//     try {
//       const storageKey = `${prefix}${store.$id}`
//       const storedState = storage.getItem(storageKey)
      
//       if (storedState) {
//         try {
//           store.$patch(JSON.parse(storedState))
//         } catch (error) {
//           console.error(`Error parsing stored state for ${store.$id}:`, error)
//           // Remove corrupted state
//           storage.removeItem(storageKey)
//         }
//       }
      
//       // Subscribe to state changes and save to storage
//       store.$subscribe((_: any, state: any) => {
//         try {
//           storage.setItem(storageKey, JSON.stringify(state))
//         } catch (error) {
//           console.error(`Error storing state for ${store.$id}:`, error)
//         }
//       })
//     } catch (error) {
//       console.error('Error in persisted state plugin:', error)
//     }
//   }
// }

// export default createPersistedState