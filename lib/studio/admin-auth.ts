// Kept as the studio's import path; the implementation now lives in
// lib/admin/require-admin so every admin route in the app shares one check.
export { isAdminSession as isStudioAdmin, unauthorized } from '@/lib/admin/require-admin';
