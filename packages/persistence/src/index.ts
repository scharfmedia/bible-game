// @bible/persistence — IndexedDB save store + zod-validated SaveFile schema + migrations.
export { SaveStore, saveStore } from './store'
export { migrateSave } from './migrations'
export {
  SaveFileSchema,
  ProfileSchema,
  emptySaveFile,
  CURRENT_SCHEMA_VERSION,
  type SaveFile,
} from './schema'
