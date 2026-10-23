'use client';

import { useAuthStore } from '@/lib/stores/authStore';

/**
 * 施設マスタでの立場（顧客ワイヤーのロールをモックのロールに読み替える）
 *   SAMS管理者 ＝ システム管理者（system_admin）: すべての操作ができる
 *   SHIP管理者 ＝ それ以外: 一覧の表示・検索だけ（MS-102・エクスポート・新規作成・この施設で開く は不可）
 * モックのユーザーは管理組織を持たないため、SHIP 管理者はワイヤーと同じく固定の管理組織（コンサル1部）に属するとみなす。
 * 未ログインで開いた場合は、デモのため SAMS 管理者として扱う。
 */
export function useFacilityMasterRole() {
  const user = useAuthStore((s) => s.user);
  const isSams = !user || user.role === 'system_admin';
  return { isSams };
}
