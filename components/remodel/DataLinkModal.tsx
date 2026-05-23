'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Asset } from '@/lib/types';
import { AssetMaster, VendorMaster } from '@/lib/types/master';
import { ReceivedQuotationGroup, ReceivedQuotationItem, QuotationPhase } from '@/lib/types/quotation';
import { RfqGroup } from '@/lib/types/rfqGroup';

// ============================
// 型定義
// ============================

type DataSource = '資産Master' | '業者Master' | '原本リスト' | '見積DB';
type LinkKey = '資産Master ID' | 'QRコード' | '部署ID' | '事業者ID' | '見積依頼No.';
type QuotationStep = 1 | 2; // 1:紐付け 2:追加

interface SourceColumn {
  sourceKey: string;
  label: string;
  targetKey?: string;
  group: string;
}

interface DataLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAssets: Asset[];
  baseAssets: Asset[];
  assetMasters: AssetMaster[];
  vendors: VendorMaster[];
  quotationGroups: ReceivedQuotationGroup[];
  quotationItems: ReceivedQuotationItem[];
  rfqGroups: RfqGroup[];
  onExecute: (updates: Map<number, Partial<Asset>>) => void;
  onAddNewAssets: (newAssets: Asset[]) => void;
  /**
   * 'copy': Data Link（資産Master/業者Master/原本リスト）
   * 'quotation': 見積DB Link（見積DBウィザード固定）
   */
  mode?: 'copy' | 'quotation';
}


const SOURCE_AVAILABLE_KEYS: Record<Exclude<DataSource, '見積DB'>, LinkKey[]> = {
  '資産Master': ['資産Master ID'],
  '業者Master': ['事業者ID'],
  '原本リスト': ['QRコード', '資産Master ID'],
};

// ============================
// カラム定義（変更なし）
// ============================

const ASSET_MASTER_COLUMNS: SourceColumn[] = [
  // SHIP資産マスタ
  { sourceKey: 'category', label: 'カテゴリ', targetKey: 'category', group: 'SHIP資産マスタ' },
  { sourceKey: 'largeClass', label: '大分類', targetKey: 'largeClass', group: 'SHIP資産マスタ' },
  { sourceKey: 'mediumClass', label: '中分類', targetKey: 'mediumClass', group: 'SHIP資産マスタ' },
  { sourceKey: 'item', label: '品目（個体管理品目名）', targetKey: 'item', group: 'SHIP資産マスタ' },
  { sourceKey: 'maker', label: 'メーカー（略称）', targetKey: 'maker', group: 'SHIP資産マスタ' },
  { sourceKey: 'model', label: '型式', targetKey: 'model', group: 'SHIP資産マスタ' },
  { sourceKey: 'tradeName', label: '販売名', targetKey: 'name', group: 'JMDN分類' },
  { sourceKey: 'manufacturer', label: '製造販売業者等', targetKey: 'manufacturer', group: 'JMDN分類' },
  // 設備情報
  { sourceKey: 'width', label: '幅(W)', targetKey: 'width', group: '設備情報' },
  { sourceKey: 'depth', label: '奥行(D)', targetKey: 'depth', group: '設備情報' },
  { sourceKey: 'height', label: '高さ(H)', targetKey: 'height', group: '設備情報' },
  { sourceKey: 'powerConnection', label: '電源接続', targetKey: 'powerConnection', group: '設備情報' },
  { sourceKey: 'powerType', label: '電源種別', targetKey: 'powerType', group: '設備情報' },
  { sourceKey: 'powerConsumption', label: '消費電力', targetKey: 'powerConsumption', group: '設備情報' },
  { sourceKey: 'weight', label: '重量(kg)', targetKey: 'weight', group: '設備情報' },
  // 資産情報
  { sourceKey: 'legalServiceLife', label: '耐用年数（法定）', targetKey: 'legalServiceLife', group: '資産情報' },
  { sourceKey: 'endOfService', label: 'End of service', targetKey: 'endOfService', group: '資産情報' },
  { sourceKey: 'endOfSupport', label: 'End of support', targetKey: 'endOfSupport', group: '資産情報' },
  { sourceKey: 'catalogDocument', label: 'カタログ', targetKey: 'catalogDocument', group: '資産情報' },
];

const VENDOR_MASTER_COLUMNS: SourceColumn[] = [
  { sourceKey: 'vendorName', label: '業者名', targetKey: 'rfqVendor', group: '業者情報' },
];

const ORIGINAL_LIST_COLUMNS: SourceColumn[] = [
  { sourceKey: 'shipDivision', label: '部門名', targetKey: 'shipDivision', group: '共通部署マスタ' },
  { sourceKey: 'shipDepartment', label: '部署名', targetKey: 'shipDepartment', group: '共通部署マスタ' },
  { sourceKey: 'building', label: '棟', targetKey: 'building', group: '設置場所' },
  { sourceKey: 'floor', label: '階', targetKey: 'floor', group: '設置場所' },
  { sourceKey: 'department', label: '部門', targetKey: 'department', group: '設置場所' },
  { sourceKey: 'section', label: '部署', targetKey: 'section', group: '設置場所' },
  { sourceKey: 'roomName', label: '室名', targetKey: 'roomName', group: '設置場所' },
  { sourceKey: 'managementDept', label: '管理部署', targetKey: 'managementDept', group: '識別・分類' },
  { sourceKey: 'qrCode', label: 'QRコード', targetKey: 'qrCode', group: '識別・分類' },
  { sourceKey: 'assetNo', label: '台帳番号', targetKey: 'assetNo', group: '識別・分類' },
  { sourceKey: 'assetMasterId', label: '資産マスタID', targetKey: 'assetMasterId', group: '識別・分類' },
  { sourceKey: 'category', label: 'Category', targetKey: 'category', group: '識別・分類' },
  { sourceKey: 'largeClass', label: '大分類', targetKey: 'largeClass', group: '識別・分類' },
  { sourceKey: 'mediumClass', label: '中分類', targetKey: 'mediumClass', group: '識別・分類' },
  { sourceKey: 'detailCategory', label: '明細区分', targetKey: 'detailCategory', group: '識別・分類' },
  { sourceKey: 'parentItem', label: '明細親機', targetKey: 'parentItem', group: '識別・分類' },
  { sourceKey: 'item', label: '個体管理品目', targetKey: 'item', group: '識別・分類' },
  { sourceKey: 'maker', label: 'メーカー名', targetKey: 'maker', group: '識別・分類' },
  { sourceKey: 'model', label: '型式', targetKey: 'model', group: '識別・分類' },
  { sourceKey: 'serialNumber', label: 'シリアルNo.', targetKey: 'serialNumber', group: '取得情報・契約' },
  { sourceKey: 'purchaseDate', label: '購入年月日', targetKey: 'purchaseDate', group: '取得情報・契約' },
  { sourceKey: 'lease', label: 'リース', targetKey: 'lease', group: '取得情報・契約' },
  { sourceKey: 'rental', label: '貸出品', targetKey: 'rental', group: '取得情報・契約' },
  { sourceKey: 'contractName', label: '契約･見積名称', targetKey: 'contractName', group: '取得情報・契約' },
  { sourceKey: 'contractNo', label: '契約番号', targetKey: 'contractNo', group: '取得情報・契約' },
  { sourceKey: 'contractDate', label: '契約･発注日', targetKey: 'contractDate', group: '取得情報・契約' },
  { sourceKey: 'deliveryDate', label: '納品日', targetKey: 'deliveryDate', group: '取得情報・契約' },
  { sourceKey: 'inspectionDate', label: '検収日', targetKey: 'inspectionDate', group: '取得情報・契約' },
  { sourceKey: 'acquisitionCost', label: '取得価格', targetKey: 'acquisitionCost', group: '財務・耐用年数' },
  { sourceKey: 'legalServiceLife', label: '耐用年数（法定）', targetKey: 'legalServiceLife', group: '財務・耐用年数' },
  { sourceKey: 'recommendedServiceLife', label: '使用年数（メーカー推奨）', targetKey: 'recommendedServiceLife', group: '財務・耐用年数' },
  { sourceKey: 'endOfService', label: 'End of service', targetKey: 'endOfService', group: '財務・耐用年数' },
  { sourceKey: 'endOfSupport', label: 'End of support', targetKey: 'endOfSupport', group: '財務・耐用年数' },
];

const QUOTATION_DB_COLUMNS: SourceColumn[] = [
  { sourceKey: 'vendorName', label: '見積業者', targetKey: 'rfqVendor', group: '見積ヘッダー' },
  { sourceKey: 'receivedQuotationNo', label: '見積番号', targetKey: 'rfqGroupName', group: '見積ヘッダー' },
  { sourceKey: 'category', label: 'Category', targetKey: 'category', group: '明細分類' },
  { sourceKey: 'largeClass', label: '大分類', targetKey: 'largeClass', group: '明細分類' },
  { sourceKey: 'middleClass', label: '中分類', targetKey: 'mediumClass', group: '明細分類' },
  { sourceKey: 'itemName', label: '個体管理品目', targetKey: 'item', group: '明細分類' },
  { sourceKey: 'manufacturer', label: 'メーカー', targetKey: 'maker', group: '明細分類' },
  { sourceKey: 'model', label: '型式', targetKey: 'model', group: '明細分類' },
  { sourceKey: 'allocTaxTotal', label: '税込金額', targetKey: 'rfqAmount', group: '価格情報' },
];

const COPY_SOURCE_COLUMNS: Record<Exclude<DataSource, '見積DB'>, SourceColumn[]> = {
  '資産Master': ASSET_MASTER_COLUMNS,
  '業者Master': VENDOR_MASTER_COLUMNS,
  '原本リスト': ORIGINAL_LIST_COLUMNS,
};

// ============================
// ユーティリティ
// ============================

function groupColumns(columns: SourceColumn[]) {
  const map = new Map<string, SourceColumn[]>();
  for (const col of columns) {
    if (!map.has(col.group)) map.set(col.group, []);
    map.get(col.group)!.push(col);
  }
  return Array.from(map.entries()).map(([group, cols]) => ({ group, cols }));
}

interface QuotationDisplayRecord {
  id: string;
  qi: ReceivedQuotationItem;
  qg: ReceivedQuotationGroup | undefined;
  displayLabel: string;
  displaySub: string;
  displayPrice: string;
  raw: Record<string, unknown>;
}

// ステップ定義
const STEPS: { id: QuotationStep; label: string; desc: string }[] = [
  { id: 1, label: '紐付け', desc: '編集リストと見積明細を対応付ける' },
  { id: 2, label: '追加', desc: '余った見積明細を新規行として追加する' },
];

// テーブル共通スタイル（columnを詰めて横スクロールなしで全列表示）
const editTh: React.CSSProperties = {
  padding: '5px 6px', textAlign: 'center', borderBottom: '1px solid #E1E1E1',
  fontSize: 11, fontWeight: 700, color: '#4A4A4A', whiteSpace: 'nowrap',
};
const editTd: React.CSSProperties = {
  padding: '5px 6px', textAlign: 'center', fontSize: 11, color: '#333',
  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
};
const quotTh: React.CSSProperties = {
  padding: '5px 6px', textAlign: 'center', borderBottom: '1px solid #E1E1E1',
  fontSize: 11, fontWeight: 700, color: '#555', whiteSpace: 'nowrap',
};
const quotTd: React.CSSProperties = {
  padding: '5px 6px', textAlign: 'center', fontSize: 11, color: '#333',
  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
};

// ============================
// コンポーネント
// ============================

export const DataLinkModal: React.FC<DataLinkModalProps> = ({
  isOpen,
  onClose,
  selectedAssets,
  baseAssets,
  assetMasters,
  vendors,
  quotationGroups,
  quotationItems,
  rfqGroups,
  onExecute,
  onAddNewAssets,
  mode = 'copy',
}) => {
  const [dataSource, setDataSource] = useState<DataSource | ''>('');

  // コピーモード（資産/業者/原本）
  const [linkKey, setLinkKey] = useState<LinkKey | ''>('');
  const [checkedColumns, setCheckedColumns] = useState<Set<string>>(new Set());
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<{ matched: number; unmatched: number; added: number } | null>(null);

  // 見積DB ウィザード
  const [qStep, setQStep] = useState<QuotationStep>(1);
  const [pairings, setPairings] = useState<Map<number, string>>(new Map());
  const [activeLeftNo, setActiveLeftNo] = useState<number | null>(null);
  const [qSearch, setQSearch] = useState('');
  const [qCheckedColumns, setQCheckedColumns] = useState<Set<string>>(new Set());
  const [addTargets, setAddTargets] = useState<Set<string>>(new Set());
  const [inheritSourceNo, setInheritSourceNo] = useState<number | null>(null);

  // 見積依頼No / 見積フェーズ 選択
  const [selectedRfqNo, setSelectedRfqNo] = useState<string>('');
  const [selectedPhase, setSelectedPhase] = useState<QuotationPhase | ''>('');

  // モーダルを開いたタイミングで mode に応じて初期 dataSource を設定する
  useEffect(() => {
    if (!isOpen) return;
    if (mode === 'quotation') {
      setDataSource('見積DB');
    } else {
      setDataSource('');
    }
    setLinkKey('');
    setCheckedColumns(new Set());
    setQCheckedColumns(new Set());
    setPairings(new Map());
    setActiveLeftNo(null);
    setQSearch('');
    setAddTargets(new Set());
    setInheritSourceNo(null);
    setQStep(1);
    setSelectedRfqNo('');
    setSelectedPhase('');
    setResult(null);
  }, [isOpen, mode]);

  const handleDataSourceChange = useCallback((source: DataSource | '') => {
    setDataSource(source);
    setCheckedColumns(new Set());
    setQCheckedColumns(new Set());
    setResult(null);
    setPairings(new Map());
    setActiveLeftNo(null);
    setQSearch('');
    setAddTargets(new Set());
    setInheritSourceNo(null);
    setQStep(1);
    if (source && source !== '見積DB') {
      const keys = SOURCE_AVAILABLE_KEYS[source];
      setLinkKey(keys.length === 1 ? keys[0] : '');
    } else {
      setLinkKey('');
    }
  }, []);

  const isQuotationMode = dataSource === '見積DB';

  // ============================
  // コピーモード用
  // ============================

  const copyGroups = useMemo(() => {
    if (!dataSource || isQuotationMode) return [];
    return groupColumns(COPY_SOURCE_COLUMNS[dataSource as Exclude<DataSource, '見積DB'>]);
  }, [dataSource, isQuotationMode]);

  const copyLinkableKeys = useMemo(() => {
    if (!dataSource || isQuotationMode) return new Set<string>();
    return new Set(COPY_SOURCE_COLUMNS[dataSource as Exclude<DataSource, '見積DB'>].filter(c => c.targetKey).map(c => c.sourceKey));
  }, [dataSource, isQuotationMode]);

  // ============================
  // 見積DB用
  // ============================

  // 利用可能な見積依頼No（受領見積が登録されているもののみ）
  const availableRfqNos = useMemo(() => {
    const nos = new Set<string>();
    for (const qg of quotationGroups) {
      if (qg.rfqNo) nos.add(qg.rfqNo);
    }
    return Array.from(nos);
  }, [quotationGroups]);

  // 選択中の見積依頼No に紐づく RfqGroup
  const selectedRfqGroup = useMemo(() => {
    return rfqGroups.find(g => g.rfqNo === selectedRfqNo) || null;
  }, [rfqGroups, selectedRfqNo]);

  // 選択中の見積依頼No に紐づく ReceivedQuotationGroup（フェーズ別）
  const phasesForRfq = useMemo(() => {
    if (!selectedRfqNo) return [] as QuotationPhase[];
    const phases = new Set<QuotationPhase>();
    for (const qg of quotationGroups) {
      if (qg.rfqNo === selectedRfqNo) phases.add(qg.phase);
    }
    return Array.from(phases);
  }, [quotationGroups, selectedRfqNo]);

  // 選択中の ReceivedQuotationGroup（rfqNo + phase で一意）
  const selectedQuotationGroup = useMemo(() => {
    if (!selectedRfqNo || !selectedPhase) return null;
    return quotationGroups.find(qg => qg.rfqNo === selectedRfqNo && qg.phase === selectedPhase) || null;
  }, [quotationGroups, selectedRfqNo, selectedPhase]);

  // 開いた直後・selectedAssets 変化時に既定の RFQ を選択
  useEffect(() => {
    if (!isOpen || mode !== 'quotation') return;
    if (selectedRfqNo) return;
    // selectedAssets の rfqNo を優先
    let initialRfq = '';
    for (const a of selectedAssets) {
      if (a.rfqNo && availableRfqNos.includes(a.rfqNo)) { initialRfq = a.rfqNo; break; }
    }
    // フォールバックは availableRfqNos の先頭
    if (!initialRfq && availableRfqNos.length > 0) initialRfq = availableRfqNos[0];
    if (initialRfq) setSelectedRfqNo(initialRfq);
  }, [isOpen, mode, selectedAssets, availableRfqNos, selectedRfqNo]);

  // フェーズの既定値（rfq 切替時に未選択なら先頭）
  useEffect(() => {
    if (!selectedRfqNo) { setSelectedPhase(''); return; }
    if (selectedPhase && phasesForRfq.includes(selectedPhase)) return;
    if (phasesForRfq.length > 0) setSelectedPhase(phasesForRfq[0]);
    else setSelectedPhase('');
  }, [selectedRfqNo, phasesForRfq, selectedPhase]);

  // RFQ / フェーズ切替時に紐付け状態をクリア
  useEffect(() => {
    setPairings(new Map());
    setActiveLeftNo(null);
    setAddTargets(new Set());
    setQStep(1);
  }, [selectedRfqNo, selectedPhase]);

  // 選択中 RFQ に紐づく編集リスト側の資産（baseAssets から rfqNo 一致で抽出）
  const linkedAssets = useMemo(() => {
    if (!selectedRfqNo) return [] as Asset[];
    return baseAssets.filter(a => a.rfqNo === selectedRfqNo);
  }, [baseAssets, selectedRfqNo]);

  const filteredQuotationRecords: QuotationDisplayRecord[] = useMemo(() => {
    if (!isQuotationMode || !selectedQuotationGroup) return [];
    const items = quotationItems.filter(qi => qi.quotationGroupId === selectedQuotationGroup.id);

    return items.map(qi => {
      const qg = selectedQuotationGroup;
      const price = qi.allocTaxTotal ?? qi.purchasePriceTotal ?? qi.listPriceTotal;
      return {
        id: String(qi.id),
        qi,
        qg,
        displayLabel: `${qi.itemName || qi.originalItemName || '-'} / ${qi.manufacturer || '-'}`,
        displaySub: `${qi.model || '-'} [${qg?.vendorName || '-'}]`,
        displayPrice: price != null ? `¥${price.toLocaleString()}` : '-',
        raw: {
          ...qi,
          vendorName: qg?.vendorName,
          receivedQuotationNo: qg?.receivedQuotationNo,
          quotationDate: qg?.quotationDate,
          phase: qg?.phase,
        } as unknown as Record<string, unknown>,
      };
    });
  }, [isQuotationMode, quotationItems, selectedQuotationGroup]);

  // 見積データ側 合計金額
  const quotationTotalAmount = useMemo(() => {
    return filteredQuotationRecords.reduce((sum, r) => {
      const price = r.qi.allocTaxTotal ?? r.qi.purchasePriceTotal ?? r.qi.listPriceTotal ?? 0;
      return sum + price;
    }, 0);
  }, [filteredQuotationRecords]);

  const searchedQuotationRecords = useMemo(() => {
    if (!qSearch) return filteredQuotationRecords;
    const q = qSearch.toLowerCase();
    return filteredQuotationRecords.filter(r =>
      r.displayLabel.toLowerCase().includes(q) || r.displaySub.toLowerCase().includes(q)
    );
  }, [filteredQuotationRecords, qSearch]);

  const pairedQIds = useMemo(() => new Set(pairings.values()), [pairings]);

  const unpairedQuotationRecords = useMemo(() => {
    return filteredQuotationRecords.filter(r => !pairedQIds.has(r.id));
  }, [filteredQuotationRecords, pairedQIds]);

  // 紐付けごとに色とインデックスを付与（左右行で同じ色になり対応関係が見える）
  const pairColorPalette = ['#EBF5EE', '#FDF1E5', '#FAFAFA', '#FDF1E5', '#FDF1E5', '#EBF5EE', '#FAFAFA', '#FDF1E5'];
  const pairMeta = useMemo(() => {
    const colorByAssetNo = new Map<number, { color: string; index: number }>();
    const colorByQId = new Map<string, { color: string; index: number }>();
    let idx = 0;
    for (const [assetNo, qId] of pairings) {
      const color = pairColorPalette[idx % pairColorPalette.length];
      colorByAssetNo.set(assetNo, { color, index: idx + 1 });
      colorByQId.set(qId, { color, index: idx + 1 });
      idx++;
    }
    return { colorByAssetNo, colorByQId };
  }, [pairings]);

  const quotationColumnGroups = useMemo(() => groupColumns(QUOTATION_DB_COLUMNS), []);
  const quotationLinkableKeys = useMemo(() =>
    new Set(QUOTATION_DB_COLUMNS.filter(c => c.targetKey).map(c => c.sourceKey)), []);

  // ============================
  // 共通カラム操作
  // ============================

  const activeColumns = isQuotationMode ? qCheckedColumns : checkedColumns;
  const setActiveColumns = isQuotationMode ? setQCheckedColumns : setCheckedColumns;
  const activeGroups = isQuotationMode ? quotationColumnGroups : copyGroups;
  const activeLinkableKeys = isQuotationMode ? quotationLinkableKeys : copyLinkableKeys;

  const handleSelectAll = useCallback(() => {
    setActiveColumns(new Set(activeLinkableKeys));
  }, [activeLinkableKeys, setActiveColumns]);

  const handleDeselectAll = useCallback(() => {
    setActiveColumns(new Set());
  }, [setActiveColumns]);

  const handleToggleGroup = useCallback((groupName: string) => {
    const group = activeGroups.find(g => g.group === groupName);
    if (!group) return;
    const linkableCols = group.cols.filter(c => c.targetKey);
    if (linkableCols.length === 0) return;
    const allChecked = linkableCols.every(c => activeColumns.has(c.sourceKey));
    const next = new Set(activeColumns);
    if (allChecked) linkableCols.forEach(c => next.delete(c.sourceKey));
    else linkableCols.forEach(c => next.add(c.sourceKey));
    setActiveColumns(next);
  }, [activeGroups, activeColumns, setActiveColumns]);

  const handleToggleColumn = useCallback((sourceKey: string) => {
    setActiveColumns(prev => {
      const next = new Set(prev);
      if (next.has(sourceKey)) next.delete(sourceKey); else next.add(sourceKey);
      return next;
    });
  }, [setActiveColumns]);

  const groupCheckedCounts = useMemo(() => {
    const counts: Record<string, { checked: number; total: number }> = {};
    for (const { group, cols } of activeGroups) {
      const linkable = cols.filter(c => c.targetKey);
      counts[group] = {
        checked: linkable.filter(c => activeColumns.has(c.sourceKey)).length,
        total: linkable.length,
      };
    }
    return counts;
  }, [activeGroups, activeColumns]);

  // ============================
  // コピープレビュー（紐付け結果のプレビュー表示用）
  // ============================
  const copyPreview = useMemo(() => {
    if (!dataSource || isQuotationMode || !linkKey || checkedColumns.size === 0) return null;

    const columns = COPY_SOURCE_COLUMNS[dataSource as Exclude<DataSource, '見積DB'>];
    const checkedCols = columns.filter(c => checkedColumns.has(c.sourceKey) && c.targetKey);
    if (checkedCols.length === 0) return null;

    const rows: { assetNo: number; assetLabel: string; matched: boolean; changes: { label: string; before: string; after: string }[] }[] = [];

    for (const asset of selectedAssets) {
      let source: Record<string, unknown> | null = null;

      if (dataSource === '資産Master') {
        const master = assetMasters.find(m => m.assetMasterId === asset.assetMasterId);
        if (master) source = master as unknown as Record<string, unknown>;
      } else if (dataSource === '業者Master') {
        const vendor = vendors.find(v => v.id === asset.rfqVendor || v.vendorName === asset.rfqVendor);
        if (vendor) source = vendor as unknown as Record<string, unknown>;
      } else if (dataSource === '原本リスト') {
        let base: Asset | undefined;
        if (linkKey === 'QRコード') base = baseAssets.find(b => b.qrCode !== '' && b.qrCode === asset.qrCode);
        else if (linkKey === '資産Master ID') base = baseAssets.find(b => b.assetMasterId !== undefined && b.assetMasterId !== '' && b.assetMasterId === asset.assetMasterId);
        if (base) source = base as unknown as Record<string, unknown>;
      }

      const changes: { label: string; before: string; after: string }[] = [];
      if (source) {
        for (const col of checkedCols) {
          const before = String((asset as unknown as Record<string, unknown>)[col.targetKey!] || '');
          const after = String(source[col.sourceKey] || '');
          if (after && after !== before) {
            changes.push({ label: col.label, before, after });
          }
        }
      }

      rows.push({
        assetNo: asset.no,
        assetLabel: `${asset.item || asset.name || ''} / ${asset.maker || ''}`.substring(0, 30),
        matched: source !== null,
        changes,
      });
    }

    return {
      matchedCount: rows.filter(r => r.matched).length,
      unmatchedCount: rows.filter(r => !r.matched).length,
      changedCount: rows.filter(r => r.changes.length > 0).length,
      rows: rows.slice(0, 20), // プレビューは最大20行
      totalRows: rows.length,
    };
  }, [dataSource, isQuotationMode, linkKey, checkedColumns, selectedAssets, assetMasters, vendors, baseAssets]);

  // ============================
  // コピー実行（資産/業者/原本）
  // ============================
  const handleCopyExecute = useCallback(() => {
    if (!dataSource || isQuotationMode || !linkKey || checkedColumns.size === 0) return;
    setExecuting(true);
    setResult(null);

    const columns = COPY_SOURCE_COLUMNS[dataSource as Exclude<DataSource, '見積DB'>];
    const fieldMapping = new Map<string, string>();
    for (const col of columns) {
      if (checkedColumns.has(col.sourceKey) && col.targetKey) fieldMapping.set(col.sourceKey, col.targetKey);
    }

    const updates = new Map<number, Partial<Asset>>();
    let matched = 0;
    let unmatched = 0;

    for (const asset of selectedAssets) {
      const patch: Partial<Asset> = {};
      let found = false;

      if (dataSource === '資産Master') {
        const master = assetMasters.find(m => m.assetMasterId === asset.assetMasterId);
        if (master) { found = true; for (const [srcKey, tgtKey] of fieldMapping) { const val = (master as unknown as Record<string, unknown>)[srcKey]; if (val !== undefined) (patch as unknown as Record<string, unknown>)[tgtKey] = val; } }
      } else if (dataSource === '業者Master') {
        const vendor = vendors.find(v => v.id === asset.rfqVendor || v.vendorName === asset.rfqVendor);
        if (vendor) { found = true; for (const [srcKey, tgtKey] of fieldMapping) { const val = (vendor as unknown as Record<string, unknown>)[srcKey]; if (val !== undefined) (patch as unknown as Record<string, unknown>)[tgtKey] = val; } }
      } else if (dataSource === '原本リスト') {
        let base: Asset | undefined;
        if (linkKey === 'QRコード') base = baseAssets.find(b => b.qrCode !== '' && b.qrCode === asset.qrCode);
        else if (linkKey === '資産Master ID') base = baseAssets.find(b => b.assetMasterId && b.assetMasterId === asset.assetMasterId);
        if (base) { found = true; for (const [srcKey, tgtKey] of fieldMapping) { const val = (base as unknown as Record<string, unknown>)[srcKey]; if (val !== undefined) (patch as unknown as Record<string, unknown>)[tgtKey] = val; } }
      }

      if (found && Object.keys(patch).length > 0) { updates.set(asset.no, patch); matched++; }
      else unmatched++;
    }

    onExecute(updates);
    setResult({ matched, unmatched, added: 0 });
    setExecuting(false);
  }, [dataSource, isQuotationMode, linkKey, checkedColumns, selectedAssets, assetMasters, vendors, baseAssets, onExecute]);

  // ============================
  // 見積DB実行（カラム選択ステップは廃止し、対象カラム全件を自動転記）
  // ============================
  const handleQuotationExecute = useCallback(() => {
    if (pairings.size === 0 && addTargets.size === 0) return;
    setExecuting(true);
    setResult(null);

    // 全リンク可能カラムを自動マッピング
    const fieldMapping = new Map<string, string>();
    for (const col of QUOTATION_DB_COLUMNS) {
      if (col.targetKey) fieldMapping.set(col.sourceKey, col.targetKey);
    }

    const updates = new Map<number, Partial<Asset>>();
    let matched = 0;

    for (const [assetNo, qId] of pairings) {
      const asset = linkedAssets.find(a => a.no === assetNo);
      const qRec = filteredQuotationRecords.find(r => r.id === qId);
      if (!asset || !qRec) continue;
      const patch: Partial<Asset> = {};
      for (const [srcKey, tgtKey] of fieldMapping) {
        const val = qRec.raw[srcKey];
        if (val !== undefined) (patch as unknown as Record<string, unknown>)[tgtKey] = val;
      }
      if (Object.keys(patch).length > 0) { updates.set(assetNo, patch); matched++; }
    }

    if (updates.size > 0) onExecute(updates);

    const newAssets: Asset[] = [];
    if (addTargets.size > 0) {
      const maxNo = Math.max(...linkedAssets.map(a => a.no), ...baseAssets.map(a => a.no), 0);
      const inheritAsset = inheritSourceNo ? linkedAssets.find(a => a.no === inheritSourceNo) : null;
      let idx = 0;
      for (const qId of addTargets) {
        const qRec = filteredQuotationRecords.find(r => r.id === qId);
        if (!qRec) continue;
        const newAsset: Asset = {
          no: maxNo + 1 + idx, qrCode: '', assetNo: '', managementNo: '', serialNumber: '',
          item: '', maker: '', model: '', purchaseCategory: '新規', sourceType: 'added',
          newBuilding: inheritAsset?.newBuilding || '', newFloor: inheritAsset?.newFloor || '',
          newDepartment: inheritAsset?.newDepartment || '', newSection: inheritAsset?.newSection || '',
          newRoomName: inheritAsset?.newRoomName || '', executionFiscalYear: inheritAsset?.executionFiscalYear || '',
          comment: '',
        } as Asset;
        for (const [srcKey, tgtKey] of fieldMapping) {
          const val = qRec.raw[srcKey];
          if (val !== undefined) (newAsset as unknown as Record<string, unknown>)[tgtKey] = val;
        }
        newAssets.push(newAsset);
        idx++;
      }
      if (newAssets.length > 0) onAddNewAssets(newAssets);
    }

    setResult({ matched, unmatched: linkedAssets.length - matched, added: newAssets.length });
    setExecuting(false);
  }, [pairings, addTargets, linkedAssets, baseAssets, filteredQuotationRecords, onExecute, onAddNewAssets, inheritSourceNo]);

  if (!isOpen) return null;

  const canCopyExecute = dataSource && !isQuotationMode && linkKey && checkedColumns.size > 0 && !executing;
  const canQuotationExecute = (pairings.size > 0 || addTargets.size > 0) && !executing;

  const goNext = () => {
    if (qStep === 1) setQStep(2);
  };
  const goBack = () => {
    if (qStep === 2) setQStep(1);
  };

  // ============================
  // カラム選択パネル（共通）
  // ============================
  const renderColumnSelector = (groups: { group: string; cols: SourceColumn[] }[], checked: Set<string>) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {groups.map(({ group, cols }) => {
        const counts = groupCheckedCounts[group];
        if (!counts) return null;
        const linkableCols = cols.filter(c => c.targetKey);
        const hasLinkable = linkableCols.length > 0;
        const allChecked = hasLinkable && linkableCols.every(c => checked.has(c.sourceKey));
        return (
          <div key={group} style={{ border: '1px solid #E1E1E1', borderRadius: 8, overflow: 'hidden' }}>
            <div onClick={() => hasLinkable && handleToggleGroup(group)} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
              background: allChecked ? '#EBF5EE' : hasLinkable ? '#FAFAFA' : '#FAFAFA',
              cursor: hasLinkable ? 'pointer' : 'default', borderBottom: '1px solid #E1E1E1', userSelect: 'none',
            }}>
              <input type="checkbox" checked={allChecked} disabled={!hasLinkable}
                onChange={() => handleToggleGroup(group)} onClick={(e) => e.stopPropagation()}
                style={{ width: 16, height: 16, accentColor: '#008C1D' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>{group}</span>
              <span style={{ fontSize: 12, color: counts.checked > 0 ? '#008C1D' : '#8A8A8A', fontWeight: counts.checked > 0 ? 600 : 400 }}>
                ({counts.checked}/{counts.total})
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', padding: '6px 14px' }}>
              {cols.map(col => {
                const isLinkable = Boolean(col.targetKey);
                const isChecked = checked.has(col.sourceKey);
                return (
                  <label key={col.sourceKey} style={{
                    display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px',
                    minWidth: '50%', cursor: isLinkable ? 'pointer' : 'default',
                    opacity: isLinkable ? 1 : 0.4,
                    background: isChecked ? '#EBF5EE' : 'transparent', borderRadius: 4, fontSize: 12,
                  }}>
                    <input type="checkbox" checked={isChecked} disabled={!isLinkable}
                      onChange={() => handleToggleColumn(col.sourceKey)}
                      style={{ width: 14, height: 14, accentColor: '#008C1D' }} />
                    <span>{col.label}</span>
                    {isLinkable && isChecked && col.targetKey && (
                      <span style={{ color: '#008C1D', fontSize: 11 }}>→ {col.targetKey}</span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* 紐付けプレビュー */}
      {copyPreview && (
        <div style={{ marginTop: 16, border: '1px solid #E1E1E1', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '10px 16px', background: '#FAFAFA', display: 'flex', gap: 16, alignItems: 'center', fontSize: 13, borderBottom: '1px solid #E1E1E1' }}>
            <span style={{ fontWeight: 700 }}>紐付けプレビュー</span>
            <span style={{ color: '#008C1D', fontWeight: 600 }}>マッチ: {copyPreview.matchedCount}件</span>
            <span style={{ color: '#DA0000', fontWeight: 600 }}>未マッチ: {copyPreview.unmatchedCount}件</span>
            <span style={{ color: '#4A4A4A', fontWeight: 600 }}>変更あり: {copyPreview.changedCount}件</span>
          </div>
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead style={{ position: 'sticky', top: 0, background: '#FAFAFA' }}>
                <tr>
                  <th style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '1px solid #E1E1E1', whiteSpace: 'nowrap' }}>No</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '1px solid #E1E1E1' }}>品目 / メーカー</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center', borderBottom: '1px solid #E1E1E1', whiteSpace: 'nowrap' }}>状態</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '1px solid #E1E1E1' }}>変更内容</th>
                </tr>
              </thead>
              <tbody>
                {copyPreview.rows.map(row => (
                  <tr key={row.assetNo} style={{ borderBottom: '1px solid #E1E1E1', background: row.matched ? (row.changes.length > 0 ? '#EBF5EE' : '#fff') : '#FDF1E5' }}>
                    <td style={{ padding: '4px 8px', fontVariantNumeric: 'tabular-nums' }}>{row.assetNo}</td>
                    <td style={{ padding: '4px 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>{row.assetLabel}</td>
                    <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                      {row.matched ? (
                        <span style={{ padding: '1px 6px', borderRadius: 3, fontSize: 10, fontWeight: 600, color: 'white', background: row.changes.length > 0 ? '#008C1D' : '#8A8A8A' }}>
                          {row.changes.length > 0 ? `${row.changes.length}件変更` : 'マッチ(変更なし)'}
                        </span>
                      ) : (
                        <span style={{ padding: '1px 6px', borderRadius: 3, fontSize: 10, fontWeight: 600, color: 'white', background: '#DA0000' }}>未マッチ</span>
                      )}
                    </td>
                    <td style={{ padding: '4px 8px' }}>
                      {row.changes.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {row.changes.slice(0, 3).map((c, i) => (
                            <span key={i} style={{ fontSize: 10, padding: '1px 4px', background: '#EBF5EE', borderRadius: 2 }}>
                              {c.label}: <span style={{ color: '#8A8A8A', textDecoration: 'line-through' }}>{c.before || '(空)'}</span> → <span style={{ fontWeight: 600 }}>{c.after}</span>
                            </span>
                          ))}
                          {row.changes.length > 3 && <span style={{ fontSize: 10, color: '#8A8A8A' }}>+{row.changes.length - 3}</span>}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {copyPreview.totalRows > 20 && (
              <div style={{ padding: 8, textAlign: 'center', fontSize: 12, color: '#8A8A8A' }}>
                ...他 {copyPreview.totalRows - 20}件
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // ============================
  // 完了画面
  // ============================
  if (result) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
        <div style={{ background: 'white', borderRadius: 12, width: '90%', maxWidth: 540, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
          <div style={{ background: 'white', color: '#4A4A4A', padding: '16px 24px', borderRadius: '12px 12px 0 0', borderBottom: '1px solid #E1E1E1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#4A4A4A' }}>Data Link</h2>
            <button onClick={onClose} aria-label="閉じる" style={{ background: 'transparent', border: 'none', color: '#4A4A4A', fontSize: 20, cursor: 'pointer', padding: '4px 8px', lineHeight: 1 }}>&times;</button>
          </div>
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', margin: '0 auto 20px',
              background: result.matched > 0 || result.added > 0 ? '#008C1D' : '#4A4A4A',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 32, color: 'white' }}>{result.matched > 0 || result.added > 0 ? '\u2713' : '!'}</span>
            </div>
            <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: '#4A4A4A' }}>
              {isQuotationMode ? '見積データの適用が完了しました' : 'カラムコピーが完了しました'}
            </h3>
            <div style={{ width: '100%', maxWidth: 360, margin: '0 auto', border: '1px solid #E1E1E1', borderRadius: 8, overflow: 'hidden', textAlign: 'left' }}>
              <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, color: '#555' }}>更新件数</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#008C1D', fontVariantNumeric: 'tabular-nums' }}>{result.matched}件</span>
              </div>
              {result.unmatched > 0 && (
                <div style={{ padding: '12px 16px', borderTop: '1px solid #FAFAFA', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14, color: '#555' }}>未マッチ</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#4A4A4A', fontVariantNumeric: 'tabular-nums' }}>{result.unmatched}件</span>
                </div>
              )}
              {result.added > 0 && (
                <div style={{ padding: '12px 16px', borderTop: '1px solid #FAFAFA', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14, color: '#555' }}>新規追加</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#4A4A4A', fontVariantNumeric: 'tabular-nums' }}>{result.added}件</span>
                </div>
              )}
            </div>
          </div>
          <div style={{ padding: '16px 24px', borderTop: '1px solid #E1E1E1', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <button onClick={() => { setResult(null); setQStep(1); }} style={{
              padding: '10px 24px', fontSize: 14, fontWeight: 600,
              background: 'transparent', border: '1px solid #E1E1E1', borderRadius: 6, cursor: 'pointer', color: '#8A8A8A',
            }}>続けて操作</button>
            <button onClick={onClose} style={{
              padding: '10px 28px', fontSize: 14, fontWeight: 600,
              background: '#008C1D', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer',
            }}>閉じる</button>
          </div>
        </div>
      </div>
    );
  }

  // ============================
  // ステップインジケーター
  // ============================
  const renderStepIndicator = () => (
    <div style={{ display: 'flex', alignItems: 'center', padding: '12px 24px', background: '#FAFAFA', borderBottom: '1px solid #E1E1E1', gap: 4 }}>
      {STEPS.map((step, i) => {
        const isActive = qStep === step.id;
        const isDone = qStep > step.id;
        return (
          <React.Fragment key={step.id}>
            {i > 0 && <div style={{ flex: 1, height: 2, background: isDone ? '#008C1D' : '#E1E1E1', maxWidth: 40 }} />}
            <div
              onClick={() => {
                if (isDone || isActive) setQStep(step.id);
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 14px', borderRadius: 8,
                background: isActive ? '#4A4A4A' : isDone ? '#EBF5EE' : 'white',
                border: `1px solid ${isActive ? '#4A4A4A' : isDone ? '#008C1D' : '#E1E1E1'}`,
                cursor: (isDone || isActive) ? 'pointer' : 'default',
              }}
            >
              <div style={{
                width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, flexShrink: 0,
                background: isActive ? 'white' : isDone ? '#008C1D' : '#E1E1E1',
                color: isActive ? '#4A4A4A' : isDone ? 'white' : '#8A8A8A',
              }}>
                {isDone ? '\u2713' : step.id}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: isActive ? 'white' : isDone ? '#008C1D' : '#333' }}>
                  {step.label}
                </div>
                <div style={{ fontSize: 11, color: isActive ? 'rgba(255,255,255,0.8)' : '#888' }}>{step.desc}</div>
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );

  // ============================
  // メインUI
  // ============================
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
      <div style={{
        background: 'white', borderRadius: 12,
        width: isQuotationMode ? '98%' : '90%',
        maxWidth: isQuotationMode ? 1800 : 800,
        maxHeight: '92vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      }}>
        {/* ヘッダー (白背景 + 黒文字 + 下罫線) */}
        <div style={{
          background: 'white', color: '#4A4A4A', padding: '16px 24px',
          borderRadius: '12px 12px 0 0',
          borderBottom: '1px solid #E1E1E1',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#4A4A4A' }}>Data Link</h2>
            {mode === 'copy' && (
              <select value={dataSource} onChange={(e) => handleDataSourceChange(e.target.value as DataSource | '')} style={{
                padding: '4px 10px', fontSize: 13, border: '1px solid #E1E1E1', borderRadius: 4,
                background: 'white', color: '#4A4A4A', fontWeight: 600,
              }}>
                <option value="">選択してください</option>
                <option value="資産Master">資産Master</option>
                <option value="業者Master">業者Master</option>
                <option value="原本リスト">原本リスト</option>
              </select>
            )}
            {mode === 'quotation' && (
              <span style={{ fontSize: 13, color: '#8A8A8A' }}>見積DB &rarr; 編集リスト（{linkedAssets.length}件）</span>
            )}
          </div>
          <button onClick={onClose} aria-label="閉じる" style={{
            background: 'transparent', border: 'none', color: '#4A4A4A',
            fontSize: 20, cursor: 'pointer', padding: '4px 8px', lineHeight: 1,
          }}>&times;</button>
        </div>

        {/* 見積DB: ステップインジケーター + 見積依頼選択帯（mode='quotation' でのみ表示） */}
        {isQuotationMode && (
          <>
            <div style={{
              display: 'flex', alignItems: 'stretch', borderBottom: '1px solid #E1E1E1', background: '#FAFAFA',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                {renderStepIndicator()}
              </div>
              <div style={{
                display: 'grid', gridTemplateColumns: 'auto 1fr',
                columnGap: 8, rowGap: 4, padding: '8px 16px',
                alignItems: 'center', borderLeft: '1px solid #E1E1E1', background: 'white',
                fontSize: 12, minWidth: 320,
              }}>
                <label style={{ color: '#555', fontWeight: 600 }}>見積依頼No.</label>
                <select value={selectedRfqNo} onChange={(e) => setSelectedRfqNo(e.target.value)} style={{
                  padding: '4px 8px', fontSize: 12, border: '1px solid #ccc', borderRadius: 4, fontWeight: 600,
                }}>
                  <option value="">選択してください</option>
                  {availableRfqNos.map(no => (
                    <option key={no} value={no}>{no}</option>
                  ))}
                </select>
                <label style={{ color: '#555', fontWeight: 600 }}>見積グループ名</label>
                <span style={{ fontSize: 12, color: '#333', fontWeight: 600, padding: '4px 0' }}>
                  {selectedRfqGroup?.groupName || '-'}
                </span>
                <label style={{ color: '#555', fontWeight: 600 }}>見積フェーズ</label>
                <select value={selectedPhase} onChange={(e) => setSelectedPhase(e.target.value as QuotationPhase | '')} style={{
                  padding: '4px 8px', fontSize: 12, border: '1px solid #ccc', borderRadius: 4, fontWeight: 600,
                }} disabled={phasesForRfq.length === 0}>
                  <option value="">選択してください</option>
                  {phasesForRfq.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
          </>
        )}

        {/* コピーモード: 紐づけキー帯 */}
        {dataSource && !isQuotationMode && (
          <div style={{ padding: '12px 24px', borderBottom: '1px solid #E1E1E1', background: '#FAFAFA', display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, color: '#8A8A8A', fontWeight: 600 }}>紐づけキー</label>
              <select value={linkKey} onChange={(e) => setLinkKey(e.target.value as LinkKey | '')} style={{
                padding: '6px 12px', fontSize: 13, border: '2px solid #4A4A4A', borderRadius: 4, minWidth: 160, fontWeight: 600,
              }}>
                <option value="">選択してください</option>
                {SOURCE_AVAILABLE_KEYS[dataSource as Exclude<DataSource, '見積DB'>].map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
            <div style={{ marginLeft: 'auto', fontSize: 13, color: '#555' }}>
              対象: <strong>{selectedAssets.length}件</strong>
            </div>
          </div>
        )}

        {/* コンテンツ */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
          {!dataSource ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#8A8A8A', fontSize: 14 }}>
              Data Linkを選択してください
            </div>
          ) : isQuotationMode ? (
            /* ============================
               見積DB: ステップウィザード
               ============================ */
            <>
              {/* Step 1: 紐付け */}
              {qStep === 1 && (
                <>
                  {!selectedRfqNo || !selectedQuotationGroup ? (
                    <div style={{ padding: 48, textAlign: 'center', color: '#8A8A8A', fontSize: 14, lineHeight: 1.8 }}>
                      右上から見積依頼No. と見積フェーズを選択してください
                    </div>
                  ) : (
                    <>
                      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: 13, color: '#555' }}>
                          編集リストのレコードと見積明細を対応付けてください
                          <span style={{ marginLeft: 12, fontSize: 11, color: '#888' }}>
                            左の行をクリック → 右の見積明細をクリックで紐付け
                          </span>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: pairings.size > 0 ? '#008C1D' : '#8A8A8A' }}>
                          {pairings.size} / {linkedAssets.length} 紐付け済み
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(380px, 0.9fr) minmax(680px, 1.6fr)', gap: 8, alignItems: 'start' }}>
                        {/* 左: 編集リスト テーブル */}
                        <div style={{ border: '1px solid #E1E1E1', borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                          <div style={{ padding: '8px 12px', background: '#EBF5EE', borderBottom: '1px solid #E1E1E1', fontSize: 13, fontWeight: 700, color: '#4A4A4A' }}>
                            編集リスト
                          </div>
                          <div style={{ overflow: 'auto', maxHeight: 480 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, tableLayout: 'fixed' }}>
                              <colgroup>
                                <col style={{ width: 50 }} />
                                <col style={{ width: 36 }} />
                                <col style={{ width: 70 }} />
                                <col style={{ width: 70 }} />
                                <col />
                                <col />
                                <col style={{ width: 44 }} />
                              </colgroup>
                              <thead style={{ position: 'sticky', top: 0, background: '#FAFAFA', zIndex: 1 }}>
                                <tr>
                                  <th style={editTh}>棟</th>
                                  <th style={editTh}>階</th>
                                  <th style={editTh}>部門名</th>
                                  <th style={editTh}>部署名</th>
                                  <th style={editTh}>室名</th>
                                  <th style={{ ...editTh, textAlign: 'left' }}>品目名</th>
                                  <th style={{ ...editTh, textAlign: 'right' }}>数量</th>
                                </tr>
                              </thead>
                              <tbody>
                                {linkedAssets.length === 0 ? (
                                  <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#8A8A8A', fontSize: 12 }}>この見積依頼に紐づく資産はありません</td></tr>
                                ) : (
                                  linkedAssets.map(asset => {
                                    const pair = pairMeta.colorByAssetNo.get(asset.no);
                                    const isPaired = Boolean(pair);
                                    const isActive = activeLeftNo === asset.no;
                                    return (
                                      <tr key={asset.no} onClick={() => setActiveLeftNo(isActive ? null : asset.no)} style={{
                                        cursor: 'pointer',
                                        background: isActive ? '#EBF5EE' : isPaired ? pair!.color : 'white',
                                        borderBottom: '1px solid #FAFAFA',
                                      }}>
                                        <td style={editTd} title={asset.newBuilding || asset.building || ''}>
                                          {isPaired && (
                                            <span style={{ display: 'inline-block', minWidth: 16, padding: '0 4px', marginRight: 4, fontSize: 10, fontWeight: 700, color: '#fff', background: '#4A4A4A', borderRadius: 8, textAlign: 'center' }}>{pair!.index}</span>
                                          )}
                                          {asset.newBuilding || asset.building || '-'}
                                        </td>
                                        <td style={editTd} title={asset.newFloor || asset.floor || ''}>{asset.newFloor || asset.floor || '-'}</td>
                                        <td style={editTd} title={asset.newDepartment || asset.department || ''}>{asset.newDepartment || asset.department || '-'}</td>
                                        <td style={editTd} title={asset.newSection || asset.section || ''}>{asset.newSection || asset.section || '-'}</td>
                                        <td style={{ ...editTd, color: '#146E2E', fontWeight: 600 }} title={asset.newRoomName || asset.roomName || ''}>{asset.newRoomName || asset.roomName || '-'}</td>
                                        <td style={{ ...editTd, textAlign: 'left' }} title={asset.item || ''}>{asset.item || '-'}</td>
                                        <td style={{ ...editTd, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{asset.quantity ?? 1}</td>
                                      </tr>
                                    );
                                  })
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* 右: 見積データ側 + (新)設置情報 */}
                        <div style={{ border: '1px solid #E1E1E1', borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                          <div style={{ display: 'flex', borderBottom: '1px solid #E1E1E1' }}>
                            <div style={{ flex: 1, padding: '8px 12px', background: '#FDF1E5', display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: '#DA0000' }}>見積データ側</span>
                              <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: '#DA0000' }}>
                                ¥{quotationTotalAmount.toLocaleString()}
                              </span>
                            </div>
                            <div style={{ width: 286, padding: '8px 12px', background: '#EBF5EE', borderLeft: '1px solid #E1E1E1', fontSize: 13, fontWeight: 700, color: '#146E2E' }}>
                              （新）設置情報
                            </div>
                          </div>
                          <div style={{ overflow: 'auto', maxHeight: 480 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, tableLayout: 'fixed' }}>
                              <colgroup>
                                <col />
                                <col style={{ width: 96 }} />
                                <col style={{ width: 110 }} />
                                <col style={{ width: 44 }} />
                                <col style={{ width: 40 }} />
                                <col style={{ width: 56 }} />
                                <col style={{ width: 90 }} />
                                <col style={{ width: 50 }} />
                                <col style={{ width: 36 }} />
                                <col style={{ width: 60 }} />
                                <col style={{ width: 60 }} />
                                <col style={{ width: 80 }} />
                              </colgroup>
                              <thead style={{ position: 'sticky', top: 0, background: '#FAFAFA', zIndex: 1 }}>
                                <tr>
                                  <th style={{ ...quotTh, textAlign: 'left' }}>品目（個体管理品目名）</th>
                                  <th style={quotTh}>メーカー</th>
                                  <th style={quotTh}>型式</th>
                                  <th style={{ ...quotTh, textAlign: 'right' }}>数量</th>
                                  <th style={quotTh}>単位</th>
                                  <th style={{ ...quotTh, textAlign: 'right' }}>親子関係</th>
                                  <th style={{ ...quotTh, textAlign: 'right' }}>購入金額(税別)</th>
                                  <th style={{ ...quotTh, borderLeft: '2px solid #EBF5EE' }}>棟</th>
                                  <th style={quotTh}>階</th>
                                  <th style={quotTh}>部門名</th>
                                  <th style={quotTh}>部署名</th>
                                  <th style={quotTh}>室名</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredQuotationRecords.length === 0 ? (
                                  <tr><td colSpan={12} style={{ padding: 24, textAlign: 'center', color: '#8A8A8A', fontSize: 12 }}>見積明細がありません</td></tr>
                                ) : (
                                  filteredQuotationRecords.map(rec => {
                                    const pair = pairMeta.colorByQId.get(rec.id);
                                    const pairedAssetNo = Array.from(pairings.entries()).find(([, qid]) => qid === rec.id)?.[0];
                                    const pairedAsset = pairedAssetNo != null ? linkedAssets.find(a => a.no === pairedAssetNo) : null;
                                    const isPaired = Boolean(pair);
                                    const isClickable = activeLeftNo !== null && !isPaired;
                                    const price = rec.qi.allocTaxTotal ?? rec.qi.purchasePriceTotal ?? rec.qi.listPriceTotal ?? null;
                                    const rowBg = isPaired ? pair!.color : 'white';
                                    const installBg = isPaired ? pair!.color : '#FAFAFA';
                                    return (
                                      <tr key={rec.id} onClick={() => {
                                        if (!isClickable) return;
                                        setPairings(prev => {
                                          const next = new Map(prev);
                                          // 既存の紐付け解除（同じ qId / 同じ assetNo）
                                          for (const [an, qid] of next) {
                                            if (qid === rec.id || an === activeLeftNo) next.delete(an);
                                          }
                                          next.set(activeLeftNo!, rec.id);
                                          return next;
                                        });
                                        const nextUnpaired = linkedAssets.find(a => a.no !== activeLeftNo && !pairings.has(a.no));
                                        setActiveLeftNo(nextUnpaired?.no ?? null);
                                      }} style={{
                                        cursor: isClickable ? 'pointer' : 'default',
                                        background: rowBg,
                                        borderBottom: '1px solid #FAFAFA',
                                      }}>
                                        <td style={{ ...quotTd, textAlign: 'left' }} title={rec.qi.itemName || rec.qi.originalItemName || ''}>
                                          {isPaired && (
                                            <span style={{ display: 'inline-block', minWidth: 16, padding: '0 4px', marginRight: 4, fontSize: 10, fontWeight: 700, color: '#fff', background: '#4A4A4A', borderRadius: 8, textAlign: 'center' }}>{pair!.index}</span>
                                          )}
                                          {rec.qi.itemName || rec.qi.originalItemName || '-'}
                                          {isPaired && (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                if (pairedAssetNo == null) return;
                                                setPairings(prev => { const next = new Map(prev); next.delete(pairedAssetNo); return next; });
                                              }}
                                              aria-label="紐付け解除"
                                              style={{ marginLeft: 6, padding: '0 5px', fontSize: 10, fontWeight: 700, background: '#DA0000', color: 'white', border: 'none', borderRadius: 3, cursor: 'pointer' }}
                                            >×</button>
                                          )}
                                        </td>
                                        <td style={quotTd} title={rec.qi.manufacturer || ''}>{rec.qi.manufacturer || '-'}</td>
                                        <td style={quotTd} title={rec.qi.model || ''}>{rec.qi.model || '-'}</td>
                                        <td style={{ ...quotTd, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{rec.qi.aiQuantity ?? rec.qi.originalQuantity ?? '-'}</td>
                                        <td style={quotTd}>{rec.qi.unit || '-'}</td>
                                        <td style={{ ...quotTd, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{rec.qi.branchNo ?? ''}</td>
                                        <td style={{ ...quotTd, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{price != null ? price.toLocaleString() : '-'}</td>
                                        <td style={{ ...quotTd, borderLeft: '2px solid #EBF5EE', background: installBg }} title={pairedAsset?.newBuilding || pairedAsset?.building || ''}>{pairedAsset?.newBuilding || pairedAsset?.building || ''}</td>
                                        <td style={{ ...quotTd, background: installBg }} title={pairedAsset?.newFloor || pairedAsset?.floor || ''}>{pairedAsset?.newFloor || pairedAsset?.floor || ''}</td>
                                        <td style={{ ...quotTd, background: installBg }} title={pairedAsset?.newDepartment || pairedAsset?.department || ''}>{pairedAsset?.newDepartment || pairedAsset?.department || ''}</td>
                                        <td style={{ ...quotTd, background: installBg }} title={pairedAsset?.newSection || pairedAsset?.section || ''}>{pairedAsset?.newSection || pairedAsset?.section || ''}</td>
                                        <td style={{ ...quotTd, color: '#146E2E', fontWeight: 600, background: installBg }} title={pairedAsset?.newRoomName || pairedAsset?.roomName || ''}>{pairedAsset?.newRoomName || pairedAsset?.roomName || ''}</td>
                                      </tr>
                                    );
                                  })
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Step 2: 未紐付け明細の追加 */}
              {qStep === 2 && (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#333', marginBottom: 4 }}>
                      未紐付けの見積明細を新規行として追加しますか？
                    </div>
                    <div style={{ fontSize: 12, color: '#888' }}>
                      見積明細のうち{unpairedQuotationRecords.length}件が編集リストのレコードに紐付けられていません。必要なものだけ「追加」してください。
                    </div>
                  </div>

                  <div style={{ border: '1px solid #E1E1E1', borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
                    {unpairedQuotationRecords.length === 0 ? (
                      <div style={{ padding: 24, textAlign: 'center', color: '#8A8A8A', fontSize: 13 }}>
                        未紐付けの見積明細はありません
                      </div>
                    ) : (
                      unpairedQuotationRecords.map(rec => {
                        const isAdding = addTargets.has(rec.id);
                        return (
                          <div key={rec.id} style={{
                            padding: '12px 14px', borderBottom: '1px solid #FAFAFA',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            background: isAdding ? '#EBF5EE' : 'white',
                          }}>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>{rec.displayLabel}</div>
                              <div style={{ fontSize: 12, color: '#888' }}>{rec.displaySub} {rec.displayPrice}</div>
                            </div>
                            <button onClick={() => {
                              setAddTargets(prev => { const next = new Set(prev); if (next.has(rec.id)) next.delete(rec.id); else next.add(rec.id); return next; });
                            }} style={{
                              padding: '6px 16px', fontSize: 13, fontWeight: 600,
                              background: isAdding ? '#DA0000' : '#4A4A4A',
                              color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', whiteSpace: 'nowrap',
                            }}>
                              {isAdding ? '取り消す' : '追加する'}
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {addTargets.size > 0 && (
                    <div style={{ padding: '12px 16px', background: '#FAFAFA', border: '1px solid #FDF1E5', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                      <span style={{ color: '#8A8A8A', flexShrink: 0 }}>設置情報の引き継ぎ元:</span>
                      <select value={inheritSourceNo ?? ''} onChange={(e) => setInheritSourceNo(e.target.value ? Number(e.target.value) : null)}
                        style={{ padding: '4px 10px', fontSize: 13, border: '1px solid #E1E1E1', borderRadius: 4, flex: 1, maxWidth: 360 }}>
                        <option value="">引き継がない</option>
                        {linkedAssets.map(a => (
                          <option key={a.no} value={a.no}>
                            No.{a.no} {a.item || '-'} {a.newRoomName ? `(${a.newRoomName})` : ''}
                          </option>
                        ))}
                      </select>
                      <span style={{ fontSize: 12, color: '#8A8A8A' }}>新設置先などをコピーします</span>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            /* ============================
               コピーモード（資産/業者/原本）
               ============================ */
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handleSelectAll} style={{
                    padding: '6px 14px', fontSize: 13, fontWeight: 600,
                    background: dataSource ? '#008C1D' : '#D6D6D6', color: 'white',
                    border: 'none', borderRadius: 4, cursor: dataSource ? 'pointer' : 'default',
                  }}>全て選択</button>
                  <button onClick={handleDeselectAll} style={{
                    padding: '6px 14px', fontSize: 13, fontWeight: 600,
                    background: '#FAFAFA', color: '#333', border: '1px solid #E1E1E1', borderRadius: 4, cursor: 'pointer',
                  }}>全て解除</button>
                </div>
                <div style={{ padding: '8px 12px', background: '#FAFAFA', borderRadius: 4, fontSize: 13, color: '#555' }}>
                  対象レコード: <strong>{selectedAssets.length}件</strong>
                  {!linkKey && <span style={{ marginLeft: 12, color: '#8A8A8A' }}>紐づけキーを選択してください</span>}
                </div>
              </div>
              {renderColumnSelector(copyGroups, checkedColumns)}
            </>
          )}
        </div>

        {/* フッター */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #E1E1E1', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          {isQuotationMode ? (
            <>
              <div style={{ display: 'flex', gap: 8 }}>
                {qStep > 1 && (
                  <button onClick={goBack} style={{
                    padding: '10px 20px', fontSize: 14, fontWeight: 600,
                    background: 'transparent', border: '1px solid #E1E1E1', borderRadius: 6, cursor: 'pointer', color: '#8A8A8A',
                  }}>戻る</button>
                )}
                <button onClick={onClose} style={{
                  padding: '10px 20px', fontSize: 14, fontWeight: 600,
                  background: 'transparent', border: '1px solid #E1E1E1', borderRadius: 6, cursor: 'pointer', color: '#8A8A8A',
                }}>閉じる</button>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {qStep === 1 && (
                  <button onClick={goNext} disabled={!selectedQuotationGroup} style={{
                    padding: '10px 28px', fontSize: 14, fontWeight: 700,
                    background: selectedQuotationGroup ? '#4A4A4A' : '#D6D6D6',
                    color: 'white',
                    border: 'none', borderRadius: 6, cursor: selectedQuotationGroup ? 'pointer' : 'default',
                  }}>
                    次へ &rarr;
                  </button>
                )}
                {qStep === 2 && (
                  <button onClick={handleQuotationExecute} disabled={!canQuotationExecute} style={{
                    padding: '10px 28px', fontSize: 14, fontWeight: 700,
                    background: canQuotationExecute ? '#4A4A4A' : '#D6D6D6',
                    color: canQuotationExecute ? '#333' : '#8A8A8A',
                    border: 'none', borderRadius: 6, cursor: canQuotationExecute ? 'pointer' : 'default', minWidth: 160,
                  }}>
                    {executing ? '適用中...' : `適用する（${pairings.size}件更新${addTargets.size > 0 ? ` + ${addTargets.size}件追加` : ''}）`}
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <button onClick={onClose} style={{
                padding: '10px 24px', fontSize: 14, fontWeight: 600,
                background: 'transparent', border: '1px solid #E1E1E1', borderRadius: 6, cursor: 'pointer', color: '#8A8A8A',
              }}>閉じる</button>
              <button onClick={handleCopyExecute} disabled={!canCopyExecute} style={{
                padding: '10px 28px', fontSize: 14, fontWeight: 700,
                background: canCopyExecute ? '#4A4A4A' : '#D6D6D6',
                color: canCopyExecute ? 'white' : '#8A8A8A',
                border: 'none', borderRadius: 6, cursor: canCopyExecute ? 'pointer' : 'default', minWidth: 140,
              }}>{executing ? '実行中...' : 'コピー実行'}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
