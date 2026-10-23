import { useAssetStore } from '@/lib/stores/assetStore';
import { useMasterStore } from '@/lib/stores/masterStore';

/**
 * ワイヤーへ渡せるモックのデータ。アダプタの needs に書かれた名前で引く。
 * 新しいデータが必要になったら、ここに名前と取得方法を追加する。
 */
export const WIREFRAME_DATA_SOURCES: Record<string, () => unknown> = {
  /** 原本リスト（顧客サンプルリスト由来の個体 781 件） */
  originalAssets: () => useAssetStore.getState().assets,
  /** 施設マスタ */
  facilities: () => useMasterStore.getState().facilities,
  /** 部署マスタ */
  departments: () => useMasterStore.getState().departments,
};

/** needs に対応するデータをまとめる。未登録の名前は unknownNeeds で返す */
export function buildWireframePayload(needs: string[]) {
  const payload: Record<string, unknown> = {};
  const unknownNeeds: string[] = [];
  for (const name of needs) {
    const source = WIREFRAME_DATA_SOURCES[name];
    if (source) payload[name] = source();
    else unknownNeeds.push(name);
  }
  return { payload, unknownNeeds };
}
