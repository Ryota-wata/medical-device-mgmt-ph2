/*
 * アダプタ: 共通マスタ / 施設マスタ（操作UI_施設マスタ v3.3）
 *
 * 上部の「画面外」帯と設計メモは説明なので隠す。
 * 帯にあるロール選択と画面切替（MS-101 / MS-102）は、モック側の操作欄に出す。
 * モックのデータの流し込みは手順 4 で追加する。
 */
window.__wfAdapter = {
  id: 'facility-master',
  guideSelectors: ['.outer', '#memo'],
  controls: [
    { id: 'role', label: 'ログイン中', type: 'select', selector: '#roleSel' },
    { id: 'screen', label: '画面', type: 'buttons', selectors: ['#nav-list', '#nav-edit'], activeClass: 'on' },
  ],
  needs: [],
};
