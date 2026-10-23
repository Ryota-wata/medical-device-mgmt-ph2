/*
 * アダプタ: 原本リスト（申請）/ 原本・編集リスト・棚卸 統合（操作UI v2.1）
 *
 * ワイヤーは本来「データインポート」画面で原本登録用リスト（Excel）を取り込んでから動く。
 * ここではモックの原本データ（781 件）を、ワイヤー自身の initRow() で原本リストとして登録し、
 * SC-01 原本リスト一覧を開いた状態にする（ワイヤーの demo() / doImport() と同じ登録手順）。
 *
 * 前提にしているワイヤー側のグローバル: ORG, APPS, SCR, MODE, initRow, now, openOrg
 * （scripts/wireframe-adapters.mjs で同期時に検査）
 * 分類（カテゴリ・大分類・中分類）は本来 _data/資産マスタ.js から引くが、正本の配置ではこのファイルが
 * 読めない（参照切れ）ため、モック側の分類をそのまま入れる。
 *
 * 顧客のサンプルリストでは、構成品（子）が自前の QR を持たない。
 *   - QR に「(内訳)」が付く行、または品目が「･」で始まる行を子とする
 *   - 子と「ｼｰﾙなし」の行は QR を空にする。ワイヤーは QR で行を引く処理（Data Link 等）があり、
 *     同じ QR が並ぶと別の個体の値を取り違えるため。内部 ID は initRow が行番号から振る
 *   - 子の明細親機 QR は「(内訳)」を除いた QR。QR で引けない子は、直前の親の QR を使う
 */
(function () {
  var NO_QR = 'ｼｰﾙなし';

  function toRows(assets) {
    var lastParentQr = '';
    return assets.map(function (a, i) {
      var rawQr = a.qrCode || '';
      var rawItem = String(a.item || '');
      var isChild = rawQr.indexOf('(内訳)') >= 0 || /^･/.test(rawItem);
      var ownQr = isChild || rawQr === NO_QR ? '' : rawQr;
      var parentQr = '';
      if (isChild) {
        var base = rawQr.replace('(内訳)', '');
        parentQr = base && base !== NO_QR ? base : lastParentQr;
      } else {
        lastParentQr = ownQr;
      }
      return {
        st: '送付済み', ts: '', mst: '突合済', rule: '', gid: '', from: 'モック',
        qr: ownQr, amid: a.assetMasterId || '', item: rawItem.replace(/^･+/, ''), mk: a.maker || '', md: a.model || '',
        tou: a.building || '', kai: a.floor || '', bu: a.department || '', bs: a.section || '', rm: a.roomName || '',
        dt: a.deliveryDate || a.purchaseDate || '', fa: a.assetNo || '', me: a.managementNo || '', sn: a.serialNumber || '',
        qty: String(a.quantity || 1), mb: a.managementDept || '',
        kb: isChild ? '子' : '親', pq: parentQr, pqk: '',
        cat: a.category || '', maj: a.largeClass || '', mid: a.mediumClass || '',
        pn: [], lg: {}, line: i + 2,
      };
    });
  }

  var SCREEN_BUTTONS = {
    I: '#nav-I',
    orgB: ".outer button[onclick=\"openOrg('B')\"]",
    orgC: ".outer button[onclick=\"openOrg('C')\"]",
    orgD: ".outer button[onclick=\"openOrg('D')\"]",
    T: '#nav-T',
    rm: ".outer button[onclick=\"navCase('リモデル')\"]",
    er: ".outer button[onclick=\"navCase('ルーティン')\"]",
    iv: ".outer button[onclick=\"navCase('棚卸')\"]",
  };

  window.__wfAdapter = {
    id: 'original-list-integrated',
    // 説明の帯・設計メモ・画面ごとの申し送り（権限の説明を含む）は顧客の説明なので隠す
    guideSelectors: ['.outer', '#memo', '#scrNote'],
    controls: [
      { id: 'role', label: 'ログイン中', type: 'select', selector: '#roleSel' },
      {
        id: 'screen',
        label: '画面',
        type: 'buttons',
        // 帯の［検証］ボタン（サンプルを入れる・初期化・設計メモ等）は実装しない操作なので出さない
        selectors: Object.keys(SCREEN_BUTTONS).map(function (k) { return SCREEN_BUTTONS[k]; }),
        // 原本の 3 画面と編集リストは同じ画面（B/C/D）を MODE で使い分けるため、クラスでは表示中を判定できない
        current: function () {
          if (SCR === 'I' || SCR === 'T') return SCREEN_BUTTONS[SCR];
          if (MODE === 'org') return SCREEN_BUTTONS['org' + SCR] || '';
          return SCREEN_BUTTONS[MODE] || '';
        },
      },
    ],
    needs: ['originalAssets'],
    apply: function (payload) {
      var assets = payload.originalAssets || [];
      if (!assets.length) return;
      // 毎回入れ替える（apply は複数回呼ばれ得る）
      var rows = toRows(assets).map(function (o, i) {
        return initRow(o, i + 1);
      });
      // それでも QR が重複する行（顧客データ側の重複）は内部 ID に #2, #3… を添える（doImport と同じ扱い）
      var seen = new Map();
      rows.forEach(function (r) {
        var n = (seen.get(r.id) || 0) + 1;
        seen.set(r.id, n);
        if (n > 1) r.id = r.id + '#' + n;
      });
      ORG.rows = rows;
      ORG.file = 'モックの原本データ';
      ORG.at = now();
      ORG.n = rows.length;
      APPS.clear();
      openOrg('B');
    },
  };
})();
