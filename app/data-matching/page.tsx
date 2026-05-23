'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { useDataMatchingFilters } from '@/lib/hooks/useDataMatchingFilters';
import { SurveyData, LedgerData, MatchingStatus } from '@/lib/types/data-matching';
import { surveyDataSample, ledgerDataSample, meLedgerDataSample } from '@/lib/data/data-matching-sample';

// 整形済みリスト（asset-matchingで作成されたリスト）の型
interface CleanedList {
  id: string;
  name: string;
  type: 'fixed-asset' | 'me-ledger' | 'other';
  recordCount: number;
  createdAt: string;
  createdBy: string;
}

// 統合リストアイテム（突合結果を蓄積）
interface MergedListItem {
  id: string;
  qrCode?: string;
  assetNo?: string;
  meNo?: string;
  department: string;
  section: string;
  roomName?: string;
  category: string;
  majorCategory: string;
  middleCategory: string;
  item: string;
  manufacturer?: string;
  model?: string;
  serialNo?: string;
  quantity: number;
  acquisitionDate?: string;
  sourceListNames: string[];  // どのリストから来たか
  matchingStatus?: MatchingStatus;  // undefined = 未突合
  memo?: string;
}

// 一致検索フィルタータイプ
type MatchFilterType = 'none' | 'category' | 'assetNo' | 'majorCategory' | 'item' | 'manufacturer';

// ドラッグ分割の最小サイズ（%）
const MIN_PANEL_PERCENT = 20;

export default function DataMatchingPage() {
  const router = useRouter();
  const { isMobile } = useResponsive();

  // 画面モード: 'select' = リスト選択, 'matching' = 突合作業中
  const [mode, setMode] = useState<'select' | 'matching'>('select');

  // 統合済みリスト名の履歴
  const [mergedListNames, setMergedListNames] = useState<string[]>(['現有品調査リスト']);

  // 統合リスト（突合結果を蓄積していく）
  const [mergedList, setMergedList] = useState<MergedListItem[]>(() => {
    return surveyDataSample.map(item => ({
      id: item.id,
      qrCode: item.qrCode,
      assetNo: item.assetNo,
      department: item.department,
      section: item.section,
      roomName: item.roomName,
      category: item.category,
      majorCategory: item.majorCategory,
      middleCategory: item.middleCategory,
      item: item.item,
      manufacturer: item.manufacturer,
      model: item.model,
      quantity: item.quantity,
      acquisitionDate: item.acquisitionDate,
      sourceListNames: ['現有品調査リスト'],
      matchingStatus: undefined,
      memo: undefined,
    }));
  });

  // 整形済みリスト
  const [availableLists, setAvailableLists] = useState<CleanedList[]>([
    {
      id: 'list-1',
      name: '固定資産台帳_2024年12月',
      type: 'fixed-asset',
      recordCount: ledgerDataSample.length,
      createdAt: '2024-12-03 14:30',
      createdBy: '田中太郎',
    },
    {
      id: 'list-2',
      name: 'ME管理台帳_外来部門',
      type: 'me-ledger',
      recordCount: meLedgerDataSample.length,
      createdAt: '2024-12-05 10:15',
      createdBy: '田中太郎',
    },
  ]);

  // 現在選択中のリスト
  const [selectedListId, setSelectedListId] = useState<string | null>(null);

  // 現在突合中のリストのデータ
  const [currentLedgerData, setCurrentLedgerData] = useState<LedgerData[]>([]);

  // 突合作業用: 統合リストから作業対象
  const [workingMergedData, setWorkingMergedData] = useState<MergedListItem[]>([]);

  // UI状態
  const [selectedMergedIds, setSelectedMergedIds] = useState<Set<string>>(new Set());
  const [selectedLedgerIds, setSelectedLedgerIds] = useState<Set<string>>(new Set());
  const [matchFilter, setMatchFilter] = useState<MatchFilterType>('none');

  // 原本リストモーダル
  const [showResultModal, setShowResultModal] = useState(false);

  // タブ切り替え: 'pending' = 対応中, 'completed' = 対応済み
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');

  // ドラッグ分割パネル
  const [splitPercent, setSplitPercent] = useState(50);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // フィルターフック（統合リストに対して適用）
  const {
    filters,
    setFilters,
    filteredData: filteredMergedData,
    departmentOptions,
    sectionOptions,
    categoryOptions,
    majorCategoryOptions,
    middleCategoryOptions,
    itemOptions,
    manufacturerOptions,
    modelOptions,
    resetFilters
  } = useDataMatchingFilters({
    data: workingMergedData.map(item => ({
      ...item,
      matchingStatus: undefined
    })) as SurveyData[]
  });

  // フィルター適用後の作業データ
  const displayMergedData = React.useMemo(() => {
    return workingMergedData.filter(item => {
      return filteredMergedData.some(f => f.id === item.id);
    });
  }, [workingMergedData, filteredMergedData]);

  // 台帳側のフィルタリング（共通フィルターを適用）
  const filteredLedgerData = React.useMemo(() => {
    let filtered = currentLedgerData;

    if (filters.department) {
      filtered = filtered.filter(d => d.department === filters.department);
    }
    if (filters.section) {
      filtered = filtered.filter(d => d.section === filters.section);
    }
    if (filters.category) {
      filtered = filtered.filter(d => d.category === filters.category);
    }
    if (filters.majorCategory) {
      filtered = filtered.filter(d => d.majorCategory === filters.majorCategory);
    }
    if (filters.middleCategory) {
      filtered = filtered.filter(d => d.middleCategory === filters.middleCategory);
    }
    if (filters.item) {
      filtered = filtered.filter(d => d.item === filters.item);
    }
    if (filters.manufacturer) {
      filtered = filtered.filter(d => d.manufacturer === filters.manufacturer);
    }
    if (filters.model) {
      filtered = filtered.filter(d => d.model === filters.model);
    }
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase();
      filtered = filtered.filter(d =>
        d.assetNo?.toLowerCase().includes(keyword) ||
        d.item?.toLowerCase().includes(keyword) ||
        d.manufacturer?.toLowerCase().includes(keyword) ||
        d.model?.toLowerCase().includes(keyword) ||
        d.roomName?.toLowerCase().includes(keyword)
      );
    }

    // 台帳は未突合のみ表示
    filtered = filtered.filter(d => !d.matchingStatus);

    return filtered;
  }, [currentLedgerData, filters]);

  // 現在選択中のリスト
  const currentList = availableLists.find(l => l.id === selectedListId);

  // タブに基づいてフィルタリング
  const tabFilteredData = React.useMemo(() => {
    const currentListName = currentList?.name || '';

    return displayMergedData.filter(item => {
      const isMatchedWithCurrentLedger = item.sourceListNames.includes(currentListName) ||
        item.sourceListNames.includes(`${currentListName}(未登録)`);

      if (activeTab === 'pending') {
        // 対応中: 現在の台帳と突合されていないもの
        return !isMatchedWithCurrentLedger;
      } else {
        // 対応済み: 現在の台帳と突合済み（再確認含む）
        return isMatchedWithCurrentLedger;
      }
    });
  }, [displayMergedData, activeTab, currentList?.name]);

  // 一致検索フィルターを適用（上パネル）
  const matchFilteredData = React.useMemo(() => {
    if (matchFilter === 'none') {
      return tabFilteredData;
    }

    const ledgerValues = new Set<string>();
    filteredLedgerData.forEach(l => {
      switch (matchFilter) {
        case 'category': ledgerValues.add(l.category); break;
        case 'assetNo': if (l.assetNo) ledgerValues.add(l.assetNo); break;
        case 'majorCategory': ledgerValues.add(l.majorCategory); break;
        case 'item': ledgerValues.add(l.item); break;
        case 'manufacturer': if (l.manufacturer) ledgerValues.add(l.manufacturer); break;
      }
    });

    return tabFilteredData.filter(item => {
      switch (matchFilter) {
        case 'category': return ledgerValues.has(item.category);
        case 'assetNo': return item.assetNo ? ledgerValues.has(item.assetNo) : false;
        case 'majorCategory': return ledgerValues.has(item.majorCategory);
        case 'item': return ledgerValues.has(item.item);
        case 'manufacturer': return item.manufacturer ? ledgerValues.has(item.manufacturer) : false;
        default: return true;
      }
    });
  }, [tabFilteredData, matchFilter, filteredLedgerData]);

  // 一致検索フィルターを適用（下パネル）
  const ledgerMatchFilteredData = React.useMemo(() => {
    if (matchFilter === 'none') {
      return filteredLedgerData;
    }

    const mergedValues = new Set<string>();
    tabFilteredData.forEach(m => {
      switch (matchFilter) {
        case 'category': mergedValues.add(m.category); break;
        case 'assetNo': if (m.assetNo) mergedValues.add(m.assetNo); break;
        case 'majorCategory': mergedValues.add(m.majorCategory); break;
        case 'item': mergedValues.add(m.item); break;
        case 'manufacturer': if (m.manufacturer) mergedValues.add(m.manufacturer); break;
      }
    });

    return filteredLedgerData.filter(item => {
      switch (matchFilter) {
        case 'category': return mergedValues.has(item.category);
        case 'assetNo': return item.assetNo ? mergedValues.has(item.assetNo) : false;
        case 'majorCategory': return mergedValues.has(item.majorCategory);
        case 'item': return mergedValues.has(item.item);
        case 'manufacturer': return item.manufacturer ? mergedValues.has(item.manufacturer) : false;
        default: return true;
      }
    });
  }, [filteredLedgerData, matchFilter, tabFilteredData]);

  const handleBack = () => {
    if (mode === 'matching') {
      if (confirm('突合作業を中断してリスト選択に戻りますか？\n作業中の突合結果は保持されます。')) {
        setMode('select');
        setSelectedListId(null);
        setSelectedMergedIds(new Set());
        setSelectedLedgerIds(new Set());
        setMatchFilter('none');
      }
    } else {
      router.push('/main');
    }
  };

  // リスト選択して突合開始
  const startMatching = () => {
    if (!selectedListId) {
      alert('突合するリストを選択してください');
      return;
    }

    const list = availableLists.find(l => l.id === selectedListId);
    if (!list) return;

    setMode('matching');

    if (list.type === 'fixed-asset') {
      setCurrentLedgerData(ledgerDataSample.map(d => ({ ...d, matchingStatus: undefined })));
    } else if (list.type === 'me-ledger') {
      setCurrentLedgerData(meLedgerDataSample.map(d => ({
        id: d.id,
        assetNo: d.assetNo || d.meNo,
        department: d.department,
        section: d.section,
        roomName: d.roomName,
        category: d.category,
        majorCategory: d.majorCategory,
        middleCategory: d.middleCategory,
        item: d.item,
        manufacturer: d.manufacturer,
        model: d.model,
        quantity: d.quantity,
        acquisitionDate: d.inspectionDate || '',
        matchingStatus: undefined,
      })));
    }

    setWorkingMergedData([...mergedList]);
  };

  // 統合リスト側チェックボックス
  const handleSelectMergedRow = (id: string) => {
    const newSelected = new Set(selectedMergedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedMergedIds(newSelected);
  };

  const handleSelectAllMerged = () => {
    if (selectedMergedIds.size === matchFilteredData.length) {
      setSelectedMergedIds(new Set());
    } else {
      setSelectedMergedIds(new Set(matchFilteredData.map(d => d.id)));
    }
  };

  // 台帳側チェックボックス
  const handleSelectLedgerRow = (id: string) => {
    const newSelected = new Set(selectedLedgerIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedLedgerIds(newSelected);
  };

  const handleSelectAllLedger = () => {
    if (selectedLedgerIds.size === ledgerMatchFilteredData.length) {
      setSelectedLedgerIds(new Set());
    } else {
      setSelectedLedgerIds(new Set(ledgerMatchFilteredData.map(d => d.id)));
    }
  };

  // 突合状況を直接登録（アクションボタンから呼び出し）
  const executeMatchWithStatus = (status: MatchingStatus) => {
    if (selectedMergedIds.size === 0) {
      alert('統合リスト側から突合する項目を選択してください');
      return;
    }

    if (selectedLedgerIds.size === 0) {
      alert('台帳から突合する項目を選択してください');
      return;
    }

    const currentListName = currentList?.name || '';
    const pendingLedgerIds = Array.from(selectedLedgerIds);

    const selectedLedgers = currentLedgerData.filter(l => pendingLedgerIds.includes(l.id));

    // 統合リストを更新
    const updatedMergedList = mergedList.map(item => {
      if (selectedMergedIds.has(item.id)) {
        const ledger = selectedLedgers[0];
        return {
          ...item,
          assetNo: item.assetNo || ledger?.assetNo,
          sourceListNames: [...item.sourceListNames, currentListName],
          matchingStatus: status,
        };
      }
      return item;
    });

    const updatedWorkingData = workingMergedData.map(item => {
      if (selectedMergedIds.has(item.id)) {
        const ledger = selectedLedgers[0];
        return {
          ...item,
          assetNo: item.assetNo || ledger?.assetNo,
          sourceListNames: [...item.sourceListNames, currentListName],
          matchingStatus: status,
        };
      }
      return item;
    });

    const now = new Date().toISOString();
    const updatedLedgerData = currentLedgerData.map(item => {
      if (pendingLedgerIds.includes(item.id)) {
        return {
          ...item,
          matchingStatus: status,
          matchedAt: now,
          matchedBy: '現在のユーザー'
        };
      }
      return item;
    });

    setMergedList(updatedMergedList);
    setWorkingMergedData(updatedWorkingData);
    setCurrentLedgerData(updatedLedgerData);
    setSelectedMergedIds(new Set());
    setSelectedLedgerIds(new Set());

    alert(`${selectedMergedIds.size}件の突合が完了しました（${status}）`);
  };

  // 未登録として登録（統合リストにあるが台帳にない）
  const handleMarkAsUnregistered = () => {
    if (selectedMergedIds.size === 0) {
      alert('未登録として登録する項目を選択してください');
      return;
    }

    const confirmMark = confirm(
      `選択した${selectedMergedIds.size}件を「未登録」（${currentList?.name}に存在しない）として登録しますか？`
    );
    if (!confirmMark) return;

    const currentListName = currentList?.name || '';

    const updatedMergedList = mergedList.map(item => {
      if (selectedMergedIds.has(item.id)) {
        return {
          ...item,
          sourceListNames: [...item.sourceListNames, `${currentListName}(未登録)`],
          matchingStatus: '未登録' as MatchingStatus,
          memo: `${currentListName}に存在しない`,
        };
      }
      return item;
    });

    const updatedWorkingData = workingMergedData.map(item => {
      if (selectedMergedIds.has(item.id)) {
        return {
          ...item,
          sourceListNames: [...item.sourceListNames, `${currentListName}(未登録)`],
          matchingStatus: '未登録' as MatchingStatus,
          memo: `${currentListName}に存在しない`,
        };
      }
      return item;
    });

    setMergedList(updatedMergedList);
    setWorkingMergedData(updatedWorkingData);
    setSelectedMergedIds(new Set());

    alert(`${selectedMergedIds.size}件を「未登録」として登録しました`);
  };

  // 未確認として確定（台帳にあるが統合リストにない）
  const handleMarkAsUnconfirmed = () => {
    if (selectedLedgerIds.size === 0) {
      alert('「未確認」として確定するレコードを選択してください');
      return;
    }

    const confirmMark = confirm(
      `選択した${selectedLedgerIds.size}件を「未確認」（現場に存在しない）として確定しますか？\n確定後、統合リストに追加されます。`
    );
    if (!confirmMark) return;

    const now = new Date().toISOString();
    const currentListName = currentList?.name || '台帳';
    const selectedItems = currentLedgerData.filter(d => selectedLedgerIds.has(d.id));

    // 統合リストに追加
    const newItems: MergedListItem[] = selectedItems.map(item => ({
      id: `merged-ledger-${item.id}-${Date.now()}`,
      assetNo: item.assetNo,
      department: item.department,
      section: item.section,
      roomName: item.roomName,
      category: item.category,
      majorCategory: item.majorCategory,
      middleCategory: item.middleCategory,
      item: item.item,
      manufacturer: item.manufacturer,
      model: item.model,
      quantity: item.quantity,
      acquisitionDate: item.acquisitionDate,
      sourceListNames: [currentListName],
      matchingStatus: '未確認' as MatchingStatus,
      memo: '台帳のみ存在（現場に未確認）',
    }));

    setMergedList(prev => [...prev, ...newItems]);
    setWorkingMergedData(prev => [...prev, ...newItems]);

    // 台帳データを更新
    setCurrentLedgerData(prev => prev.map(l => {
      if (selectedLedgerIds.has(l.id)) {
        return {
          ...l,
          matchingStatus: '未確認' as MatchingStatus,
          matchedAt: now,
          matchedBy: '現在のユーザー'
        };
      }
      return l;
    }));

    setSelectedLedgerIds(new Set());
    alert(`${selectedLedgerIds.size}件を「未確認」として確定しました。統合リストに追加されます。`);
  };

  const handleMatchFilterClick = (type: MatchFilterType) => {
    if (matchFilter === type) {
      setMatchFilter('none');
    } else {
      setMatchFilter(type);
    }
  };

  // タブ切り替え時に選択をクリア
  const handleTabChange = (tab: 'pending' | 'completed') => {
    setActiveTab(tab);
    setSelectedMergedIds(new Set());
    setMatchFilter('none');
  };

  // 現在のリストとの突合を完了
  const completeCurrentMatching = () => {
    if (!currentList) return;

    const unmatchedMergedCount = workingMergedData.filter(m =>
      !m.sourceListNames.includes(currentList.name) &&
      !m.sourceListNames.includes(`${currentList.name}(未登録)`)
    ).length;
    const ledgerUnmatched = currentLedgerData.filter(l => !l.matchingStatus).length;

    if (unmatchedMergedCount > 0 || ledgerUnmatched > 0) {
      const confirmComplete = confirm(
        `未突合の項目が残っています:\n` +
        `・統合リスト: ${unmatchedMergedCount}件\n` +
        `・${currentList.name}: ${ledgerUnmatched}件\n\n` +
        `このまま突合を完了しますか？`
      );
      if (!confirmComplete) return;
    }

    setMergedListNames(prev => [...prev, currentList.name]);
    setAvailableLists(prev => prev.filter(l => l.id !== selectedListId));

    setMode('select');
    setSelectedListId(null);
    setSelectedMergedIds(new Set());
    setSelectedLedgerIds(new Set());
    setMatchFilter('none');

    alert(`「${currentList.name}」との突合が完了しました。\n統合リストが更新されました。`);
  };

  const getStatusColor = (status?: MatchingStatus) => {
    if (!status) return '#8A8A8A';
    switch (status) {
      case '完全一致': return '#008C1D';
      case '部分一致': return '#008C1D';
      case '数量不一致': return '#4A4A4A';
      case '再確認': return '#4A4A4A';
      case '未確認': return '#DA0000';
      case '未登録': return '#4A4A4A';
      default: return '#8A8A8A';
    }
  };

  // タブ別件数計算
  const pendingItems = workingMergedData.filter(item => {
    const isMatchedWithCurrentLedger = item.sourceListNames.includes(currentList?.name || '') ||
      item.sourceListNames.includes(`${currentList?.name}(未登録)`);
    return !isMatchedWithCurrentLedger;
  });

  const completedItems = workingMergedData.filter(item => {
    const isMatchedWithCurrentLedger = item.sourceListNames.includes(currentList?.name || '') ||
      item.sourceListNames.includes(`${currentList?.name}(未登録)`);
    return isMatchedWithCurrentLedger;
  });

  // 台帳統計
  const ledgerUnmatchedCount = currentLedgerData.filter(d => !d.matchingStatus).length;
  const ledgerMatchedCount = currentLedgerData.filter(d => !!d.matchingStatus).length;

  // 進捗計算
  const totalItems = workingMergedData.length;
  const completedCount = completedItems.length;
  const progressPercent = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

  // ドラッグハンドル
  const handleMouseDown = useCallback(() => {
    isDragging.current = true;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const percent = ((e.clientY - rect.top) / rect.height) * 100;
      const clamped = Math.min(Math.max(percent, MIN_PANEL_PERCENT), 100 - MIN_PANEL_PERCENT);
      setSplitPercent(clamped);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  if (isMobile) {
    return (
      <div style={{ padding: '16px', backgroundColor: '#FAFAFA', minHeight: '100vh' }}>
        <div style={{ marginBottom: '16px', textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}>
          データ統合
        </div>
        <div style={{ color: '#DA0000', marginBottom: '16px', fontSize: '14px', textAlign: 'center' }}>
          この画面はデスクトップ表示に最適化されています
        </div>
        <button
          onClick={() => router.push('/main')}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#008C1D',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          メイン画面に戻る
        </button>
      </div>
    );
  }

  // === リスト選択モード ===
  if (mode === 'select') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: '#FAFAFA'
      }}>
        {/* Header */}
        <header style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #E1E1E1',
          padding: '16px 24px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            maxWidth: '1200px',
            margin: '0 auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                onClick={() => router.push('/main')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #E1E1E1',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>←</span> メイン画面に戻る
              </button>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#4A4A4A', margin: 0 }}>
                データ統合
              </h1>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main style={{ flex: 1, padding: '24px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {/* 現在の統合リスト */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              padding: '24px',
              marginBottom: '24px'
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#4A4A4A', marginBottom: '16px' }}>
                現在の統合リスト
              </h2>

              <div style={{
                padding: '16px',
                backgroundColor: '#FAFAFA',
                borderRadius: '8px',
                marginBottom: '16px'
              }}>
                {mergedListNames.map((name, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: idx < mergedListNames.length - 1 ? '8px' : 0 }}>
                    {idx > 0 && (
                      <span style={{ color: '#008C1D', fontWeight: '600', marginRight: '8px' }}>+</span>
                    )}
                    <span style={{
                      padding: '4px 12px',
                      backgroundColor: idx === 0 ? '#EBF5EE' : '#EBF5EE',
                      color: idx === 0 ? '#008C1D' : '#146E2E',
                      borderRadius: '4px',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      {name}
                    </span>
                    {idx > 0 && (
                      <span style={{ color: '#008C1D', fontSize: '14px' }}>✓ 突合済み</span>
                    )}
                  </div>
                ))}
                <div style={{
                  borderTop: '1px dashed #E1E1E1',
                  marginTop: '12px',
                  paddingTop: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontWeight: '600', color: '#4A4A4A' }}>=</span>
                  <span style={{
                    padding: '6px 16px',
                    backgroundColor: '#4A4A4A',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '16px',
                    fontWeight: '600'
                  }}>
                    統合リスト: {mergedList.length}件
                  </span>
                </div>
              </div>
            </div>

            {/* 次に突合するリスト */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              padding: '24px'
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#4A4A4A', marginBottom: '8px' }}>
                次に突合するリストを選択
              </h2>
              <p style={{ fontSize: '14px', color: '#8A8A8A', marginBottom: '24px' }}>
                統合リストと突合するリストを選択してください
              </p>

              {availableLists.length === 0 ? (
                <div style={{
                  padding: '32px',
                  textAlign: 'center',
                  backgroundColor: '#EBF5EE',
                  borderRadius: '8px',
                  border: '1px solid #008C1D'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '12px' }}>✓</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#146E2E', marginBottom: '8px' }}>
                    すべてのリストとの突合が完了しました
                  </div>
                  <div style={{ fontSize: '14px', color: '#8A8A8A', marginBottom: '16px' }}>
                    統合リストを原本リストとして確定できます
                  </div>
                  <button
                    onClick={() => {
                      alert(`原本リスト ${mergedList.length}件の登録が完了しました`);
                    }}
                    style={{
                      padding: '12px 32px',
                      backgroundColor: '#008C1D',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: '600'
                    }}
                  >
                    原本リストとして確定
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                    {availableLists.map(list => (
                      <label
                        key={list.id}
                        style={{
                          padding: '16px',
                          border: selectedListId === list.id ? '2px solid #008C1D' : '1px solid #E1E1E1',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px',
                          backgroundColor: selectedListId === list.id ? '#EBF5EE' : 'white',
                          cursor: 'pointer'
                        }}
                      >
                        <input
                          type="radio"
                          name="targetList"
                          checked={selectedListId === list.id}
                          onChange={() => setSelectedListId(list.id)}
                          style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '16px', fontWeight: '600', color: '#4A4A4A' }}>
                              {list.name}
                            </span>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              backgroundColor: list.type === 'fixed-asset' ? '#EBF5EE' : list.type === 'me-ledger' ? '#EBF5EE' : '#FAFAFA',
                              color: list.type === 'fixed-asset' ? '#008C1D' : list.type === 'me-ledger' ? '#146E2E' : '#8A8A8A'
                            }}>
                              {list.type === 'fixed-asset' ? '固定資産台帳' : list.type === 'me-ledger' ? 'ME管理台帳' : 'その他'}
                            </span>
                          </div>
                          <div style={{ fontSize: '13px', color: '#8A8A8A' }}>
                            {list.recordCount}件 | 作成: {list.createdAt} | 作成者: {list.createdBy}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => {
                        if (confirm('現在の統合リストを原本リストとして確定しますか？\n残りのリストとの突合はスキップされます。')) {
                          alert(`原本リスト ${mergedList.length}件の登録が完了しました`);
                        }
                      }}
                      style={{
                        padding: '12px 24px',
                        backgroundColor: '#ffffff',
                        color: '#008C1D',
                        border: '2px solid #008C1D',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}
                    >
                      このまま原本リスト確定
                    </button>
                    <button
                      onClick={startMatching}
                      disabled={!selectedListId}
                      style={{
                        padding: '12px 24px',
                        backgroundColor: selectedListId ? '#008C1D' : '#E1E1E1',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: selectedListId ? 'pointer' : 'not-allowed',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}
                    >
                      選択したリストと突合を開始
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // === 突合作業モード（上下分割） ===

  // セルスタイルの共通定義
  const thStyle: React.CSSProperties = { padding: '10px 6px', borderBottom: '2px solid #E1E1E1', whiteSpace: 'nowrap', fontSize: '12px', textAlign: 'left' };
  const tdStyle: React.CSSProperties = { padding: '6px', borderBottom: '1px solid #E1E1E1', whiteSpace: 'nowrap', fontSize: '12px' };

  // REQ-037: 上下リストのカラム幅を完全一致させるための共通定義
  const matchColWidth = {
    status: '90px',
    qrCode: '100px',
    assetNo: '130px',
    meNo: '110px',
    department: '110px',
    section: '110px',
    roomName: '90px',
    category: '110px',
    majorCategory: '110px',
    middleCategory: '110px',
    item: '130px',
    manufacturer: '110px',
    model: '130px',
    quantity: '60px',
    acquisitionDate: '110px',
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100dvh',
      backgroundColor: '#FAFAFA'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #E1E1E1',
        padding: '12px 24px',
        flexShrink: 0
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={handleBack}
              style={{
                padding: '8px 16px',
                backgroundColor: '#ffffff',
                border: '1px solid #E1E1E1',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>←</span> リスト選択に戻る
            </button>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#4A4A4A', margin: 0 }}>
              データ統合
            </h1>
            <span style={{
              padding: '4px 12px',
              backgroundColor: currentList?.type === 'me-ledger' ? '#EBF5EE' : '#EBF5EE',
              color: currentList?.type === 'me-ledger' ? '#146E2E' : '#008C1D',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              突合中: {mergedListNames.length === 1 ? '現有品調査リスト' : '統合リスト'} × {currentList?.name}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* 進捗 */}
            <span style={{ fontSize: '13px', color: '#8A8A8A', fontVariantNumeric: 'tabular-nums' }}>
              {completedCount}/{totalItems}件 ({progressPercent}%)
            </span>
            <div style={{
              width: '120px',
              height: '8px',
              backgroundColor: '#E1E1E1',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${progressPercent}%`,
                height: '100%',
                backgroundColor: progressPercent === 100 ? '#008C1D' : '#008C1D',
                borderRadius: '4px',
                transition: 'width 0.3s ease'
              }} />
            </div>
            <button
              onClick={completeCurrentMatching}
              style={{
                padding: '8px 16px',
                backgroundColor: '#4A4A4A',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              このリストとの突合を完了
            </button>
          </div>
        </div>
      </header>

      {/* 共通フィルター */}
      <div style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #E1E1E1',
        padding: '8px 24px',
        flexShrink: 0
      }}>
        <div style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <select
            value={filters.department}
            onChange={(e) => setFilters({ department: e.target.value })}
            style={{ padding: '6px 8px', border: '1px solid #E1E1E1', borderRadius: '4px', fontSize: '13px' }}
          >
            <option value="">共通部門</option>
            {departmentOptions.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          <select
            value={filters.section}
            onChange={(e) => setFilters({ section: e.target.value })}
            disabled={!filters.department}
            style={{
              padding: '6px 8px',
              border: '1px solid #E1E1E1',
              borderRadius: '4px',
              fontSize: '13px',
              backgroundColor: filters.department ? 'white' : '#FAFAFA'
            }}
          >
            <option value="">共通部署</option>
            {sectionOptions.map(section => (
              <option key={section} value={section}>{section}</option>
            ))}
          </select>

          <select
            value={filters.category}
            onChange={(e) => setFilters({ category: e.target.value })}
            style={{ padding: '6px 8px', border: '1px solid #E1E1E1', borderRadius: '4px', fontSize: '13px' }}
          >
            <option value="">カテゴリ</option>
            {categoryOptions.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={filters.majorCategory}
            onChange={(e) => setFilters({ majorCategory: e.target.value })}
            style={{ padding: '6px 8px', border: '1px solid #E1E1E1', borderRadius: '4px', fontSize: '13px' }}
          >
            <option value="">大分類</option>
            {majorCategoryOptions.map(major => (
              <option key={major} value={major}>{major}</option>
            ))}
          </select>

          <select
            value={filters.middleCategory}
            onChange={(e) => setFilters({ middleCategory: e.target.value })}
            style={{ padding: '6px 8px', border: '1px solid #E1E1E1', borderRadius: '4px', fontSize: '13px' }}
          >
            <option value="">中分類</option>
            {middleCategoryOptions.map(middle => (
              <option key={middle} value={middle}>{middle}</option>
            ))}
          </select>

          <select
            value={filters.item}
            onChange={(e) => setFilters({ item: e.target.value })}
            style={{ padding: '6px 8px', border: '1px solid #E1E1E1', borderRadius: '4px', fontSize: '13px' }}
          >
            <option value="">個体管理品目</option>
            {itemOptions.map(it => (
              <option key={it} value={it}>{it}</option>
            ))}
          </select>

          <select
            value={filters.manufacturer}
            onChange={(e) => setFilters({ manufacturer: e.target.value })}
            style={{ padding: '6px 8px', border: '1px solid #E1E1E1', borderRadius: '4px', fontSize: '13px' }}
          >
            <option value="">メーカー</option>
            {manufacturerOptions.map(mfr => (
              <option key={mfr} value={mfr}>{mfr}</option>
            ))}
          </select>

          <select
            value={filters.model}
            onChange={(e) => setFilters({ model: e.target.value })}
            style={{ padding: '6px 8px', border: '1px solid #E1E1E1', borderRadius: '4px', fontSize: '13px' }}
          >
            <option value="">型式</option>
            {modelOptions.map(mdl => (
              <option key={mdl} value={mdl}>{mdl}</option>
            ))}
          </select>

          <button
            onClick={() => {
              resetFilters();
              setMatchFilter('none');
            }}
            style={{
              padding: '6px 12px',
              backgroundColor: '#FAFAFA',
              border: '1px solid #E1E1E1',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            フィルター解除
          </button>
        </div>
      </div>

      {/* 上下分割パネル */}
      <div ref={containerRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* 上パネル: 統合リスト */}
        <div style={{ height: `${splitPercent}%`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* 上パネル ヘッダー */}
          <div style={{
            padding: '8px 16px',
            backgroundColor: '#EBF5EE',
            borderBottom: '1px solid #087CB6',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#008C1D' }}>
                {mergedListNames.length === 1 ? '現有品調査リスト' : '統合リスト'}
              </span>

              {/* タブ */}
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => handleTabChange('pending')}
                  style={{
                    padding: '4px 12px',
                    backgroundColor: activeTab === 'pending' ? '#008C1D' : 'transparent',
                    color: activeTab === 'pending' ? 'white' : '#008C1D',
                    border: activeTab === 'pending' ? 'none' : '1px solid #008C1D',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}
                >
                  対応中 {pendingItems.length}
                </button>
                <button
                  onClick={() => handleTabChange('completed')}
                  style={{
                    padding: '4px 12px',
                    backgroundColor: activeTab === 'completed' ? '#008C1D' : 'transparent',
                    color: activeTab === 'completed' ? 'white' : '#008C1D',
                    border: activeTab === 'completed' ? 'none' : '1px solid #008C1D',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}
                >
                  対応済み {completedItems.length}
                </button>
              </div>

              {/* 一致検索ボタン */}
              <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: '#8A8A8A', marginRight: '4px' }}>一致検索:</span>
                {([
                  { value: 'category' as MatchFilterType, label: 'カテゴリ' },
                  { value: 'assetNo' as MatchFilterType, label: '資産番号' },
                  { value: 'majorCategory' as MatchFilterType, label: '大分類' },
                  { value: 'item' as MatchFilterType, label: '品目' },
                  { value: 'manufacturer' as MatchFilterType, label: 'メーカー' },
                ]).map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => handleMatchFilterClick(value)}
                    style={{
                      padding: '4px 10px',
                      backgroundColor: matchFilter === value ? '#008C1D' : '#ffffff',
                      color: matchFilter === value ? '#ffffff' : '#008C1D',
                      border: '1px solid #008C1D',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: '600'
                    }}
                  >
                    {label}
                  </button>
                ))}
                {matchFilter !== 'none' && (
                  <button
                    onClick={() => setMatchFilter('none')}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#FAFAFA',
                      color: '#8A8A8A',
                      border: '1px solid #E1E1E1',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '11px'
                    }}
                  >
                    解除
                  </button>
                )}
              </div>
            </div>
            {activeTab === 'pending' && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', color: '#8A8A8A' }}>
                  選択: {selectedMergedIds.size}件
                </span>
                <button
                  onClick={handleSelectAllMerged}
                  style={{
                    padding: '4px 10px',
                    backgroundColor: '#FAFAFA',
                    border: '1px solid #E1E1E1',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  {selectedMergedIds.size === matchFilteredData.length && matchFilteredData.length > 0 ? '全解除' : '全選択'}
                </button>

                {/* 突合状況アクションボタン */}
                <div style={{ display: 'flex', gap: '2px', alignItems: 'center', borderLeft: '1px solid #E1E1E1', paddingLeft: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#8A8A8A', marginRight: '4px' }}>突合状況:</span>
                  {([
                    { status: '完全一致' as MatchingStatus, label: '完全一致', color: '#008C1D', needsBoth: true },
                    { status: '数量不一致' as MatchingStatus, label: '数量不一致', color: '#4A4A4A', needsBoth: true },
                    { status: '部分一致' as MatchingStatus, label: '部分一致', color: '#008C1D', needsBoth: true },
                    { status: '未確認' as MatchingStatus, label: '未確認(現場無)', color: '#DA0000', needsBoth: false },
                    { status: '未登録' as MatchingStatus, label: '未登録(台帳無)', color: '#4A4A4A', needsBoth: false },
                    { status: '再確認' as MatchingStatus, label: '再確認', color: '#4A4A4A', needsBoth: true },
                  ]).map(({ status, label, color, needsBoth }) => {
                    const isEnabled = needsBoth
                      ? selectedMergedIds.size > 0 && selectedLedgerIds.size > 0
                      : status === '未登録'
                        ? selectedMergedIds.size > 0 && selectedLedgerIds.size === 0
                        : status === '未確認'
                          ? selectedLedgerIds.size > 0 && selectedMergedIds.size === 0
                          : false;
                    return (
                      <button
                        key={status}
                        onClick={() => {
                          if (status === '未登録') {
                            handleMarkAsUnregistered();
                          } else if (status === '未確認') {
                            handleMarkAsUnconfirmed();
                          } else {
                            executeMatchWithStatus(status);
                          }
                        }}
                        disabled={!isEnabled}
                        style={{
                          padding: '4px 10px',
                          backgroundColor: isEnabled ? '#ffffff' : '#FAFAFA',
                          color: isEnabled ? color : '#bbb',
                          border: `1px solid ${isEnabled ? color : '#E1E1E1'}`,
                          borderRadius: '4px',
                          cursor: isEnabled ? 'pointer' : 'not-allowed',
                          fontSize: '11px',
                          fontWeight: '600'
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 上パネル テーブル */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            <table style={{ width: activeTab === 'pending' ? '1590px' : '1550px', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <thead>
                <tr style={{ backgroundColor: '#FAFAFA', position: 'sticky', top: 0, zIndex: 1 }}>
                  {activeTab === 'pending' && (
                    <th style={{ ...thStyle, width: '40px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={selectedMergedIds.size === matchFilteredData.length && matchFilteredData.length > 0}
                        onChange={handleSelectAllMerged}
                        style={{ cursor: 'pointer' }}
                      />
                    </th>
                  )}
                  <th style={{ ...thStyle, width: matchColWidth.status }}>突合状況</th>
                  <th style={{ ...thStyle, width: matchColWidth.qrCode }}>QRコード</th>
                  <th style={{ ...thStyle, width: matchColWidth.assetNo }}>資産番号</th>
                  <th style={{ ...thStyle, width: matchColWidth.meNo }}>ME番号</th>
                  <th style={{ ...thStyle, width: matchColWidth.department }}>共通部門</th>
                  <th style={{ ...thStyle, width: matchColWidth.section }}>共通部署</th>
                  <th style={{ ...thStyle, width: matchColWidth.roomName }}>室名</th>
                  <th style={{ ...thStyle, width: matchColWidth.category }}>カテゴリ</th>
                  <th style={{ ...thStyle, width: matchColWidth.majorCategory }}>大分類</th>
                  <th style={{ ...thStyle, width: matchColWidth.middleCategory }}>中分類</th>
                  <th style={{ ...thStyle, width: matchColWidth.item }}>品目</th>
                  <th style={{ ...thStyle, width: matchColWidth.manufacturer }}>メーカー</th>
                  <th style={{ ...thStyle, width: matchColWidth.model }}>型式</th>
                  <th style={{ ...thStyle, width: matchColWidth.quantity }}>数量</th>
                  <th style={{ ...thStyle, width: matchColWidth.acquisitionDate }}>購入年月日</th>
                </tr>
              </thead>
              <tbody>
                {matchFilteredData.map((row) => (
                  <tr key={row.id} style={{ backgroundColor: selectedMergedIds.has(row.id) && activeTab === 'pending' ? '#EBF5EE' : 'transparent' }}>
                    {activeTab === 'pending' && (
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedMergedIds.has(row.id)}
                          onChange={() => handleSelectMergedRow(row.id)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                    )}
                    <td style={tdStyle}>
                      {row.matchingStatus ? (
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          backgroundColor: getStatusColor(row.matchingStatus) + '20',
                          color: getStatusColor(row.matchingStatus),
                          fontWeight: '600'
                        }}>
                          {row.matchingStatus}
                        </span>
                      ) : (
                        <span style={{ color: '#8A8A8A', fontSize: '11px' }}>ー</span>
                      )}
                    </td>
                    <td style={tdStyle}>{row.qrCode || '-'}</td>
                    <td style={tdStyle}>{row.assetNo || '-'}</td>
                    <td style={tdStyle}>{row.meNo || '-'}</td>
                    <td style={tdStyle}>{row.department}</td>
                    <td style={tdStyle}>{row.section}</td>
                    <td style={tdStyle}>{row.roomName || '-'}</td>
                    <td style={tdStyle}>{row.category || '-'}</td>
                    <td style={tdStyle}>{row.majorCategory || '-'}</td>
                    <td style={tdStyle}>{row.middleCategory || '-'}</td>
                    <td style={tdStyle}>{row.item}</td>
                    <td style={tdStyle}>{row.manufacturer || '-'}</td>
                    <td style={tdStyle}>{row.model || '-'}</td>
                    <td style={{ ...tdStyle, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{row.quantity}</td>
                    <td style={tdStyle}>{row.acquisitionDate || '-'}</td>
                  </tr>
                ))}
                {matchFilteredData.length === 0 && activeTab === 'pending' && pendingItems.length === 0 && (
                  <tr>
                    <td colSpan={16} style={{ padding: '24px', textAlign: 'center' }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#146E2E' }}>
                        すべての突合が完了しました
                      </div>
                      <button
                        onClick={completeCurrentMatching}
                        style={{
                          marginTop: '8px',
                          padding: '8px 24px',
                          backgroundColor: '#008C1D',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '600'
                        }}
                      >
                        このリストとの突合を完了して次へ
                      </button>
                    </td>
                  </tr>
                )}
                {matchFilteredData.length === 0 && activeTab === 'pending' && pendingItems.length > 0 && (
                  <tr>
                    <td colSpan={16} style={{ padding: '24px', textAlign: 'center', color: '#8A8A8A', fontSize: '13px' }}>
                      フィルター条件に該当するデータがありません
                    </td>
                  </tr>
                )}
                {matchFilteredData.length === 0 && activeTab === 'completed' && (
                  <tr>
                    <td colSpan={16} style={{ padding: '24px', textAlign: 'center', color: '#8A8A8A', fontSize: '13px' }}>
                      まだ対応済みの項目はありません
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ドラッグハンドル */}
        <div
          onMouseDown={handleMouseDown}
          style={{
            height: '6px',
            backgroundColor: '#E1E1E1',
            cursor: 'row-resize',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderTop: '1px solid #E1E1E1',
            borderBottom: '1px solid #E1E1E1'
          }}
        >
          <div style={{
            width: '40px',
            height: '4px',
            backgroundColor: '#E1E1E1',
            borderRadius: '2px'
          }} />
        </div>

        {/* 下パネル: 台帳リスト */}
        <div style={{ height: `${100 - splitPercent}%`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* 下パネル ヘッダー */}
          <div style={{
            padding: '8px 16px',
            backgroundColor: '#FDF1E5',
            borderBottom: '1px solid #FDF1E5',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#4A4A4A' }}>
                {currentList?.name}
              </span>
              <span style={{ fontSize: '12px', color: '#8A8A8A' }}>
                対応中 {ledgerUnmatchedCount}件 / 突合済 {ledgerMatchedCount}件 / 全{currentLedgerData.length}件
              </span>
              {ledgerUnmatchedCount === 0 && (
                <span style={{
                  padding: '2px 8px',
                  backgroundColor: '#EBF5EE',
                  borderRadius: '4px',
                  color: '#146E2E',
                  fontWeight: '600',
                  fontSize: '11px'
                }}>
                  突合完了
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#8A8A8A' }}>
                選択: {selectedLedgerIds.size}件
              </span>
              <button
                onClick={handleSelectAllLedger}
                style={{
                  padding: '4px 10px',
                  backgroundColor: '#FAFAFA',
                  border: '1px solid #E1E1E1',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                {selectedLedgerIds.size === ledgerMatchFilteredData.length && ledgerMatchFilteredData.length > 0 ? '全解除' : '全選択'}
              </button>
            </div>
          </div>

          {/* 下パネル テーブル */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            <table style={{ width: '1590px', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <thead>
                <tr style={{ backgroundColor: '#FAFAFA', position: 'sticky', top: 0, zIndex: 1 }}>
                  <th style={{ ...thStyle, width: '40px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selectedLedgerIds.size === ledgerMatchFilteredData.length && ledgerMatchFilteredData.length > 0}
                      onChange={handleSelectAllLedger}
                      style={{ cursor: 'pointer' }}
                    />
                  </th>
                  <th style={{ ...thStyle, width: matchColWidth.status }}>突合状況</th>
                  <th style={{ ...thStyle, width: matchColWidth.qrCode }}>QRコード</th>
                  <th style={{ ...thStyle, width: matchColWidth.assetNo }}>資産番号</th>
                  <th style={{ ...thStyle, width: matchColWidth.meNo }}>ME番号</th>
                  <th style={{ ...thStyle, width: matchColWidth.department }}>共通部門</th>
                  <th style={{ ...thStyle, width: matchColWidth.section }}>共通部署</th>
                  <th style={{ ...thStyle, width: matchColWidth.roomName }}>室名</th>
                  <th style={{ ...thStyle, width: matchColWidth.category }}>カテゴリ</th>
                  <th style={{ ...thStyle, width: matchColWidth.majorCategory }}>大分類</th>
                  <th style={{ ...thStyle, width: matchColWidth.middleCategory }}>中分類</th>
                  <th style={{ ...thStyle, width: matchColWidth.item }}>品目</th>
                  <th style={{ ...thStyle, width: matchColWidth.manufacturer }}>メーカー</th>
                  <th style={{ ...thStyle, width: matchColWidth.model }}>型式</th>
                  <th style={{ ...thStyle, width: matchColWidth.quantity }}>数量</th>
                  <th style={{ ...thStyle, width: matchColWidth.acquisitionDate }}>購入年月日</th>
                </tr>
              </thead>
              <tbody>
                {ledgerMatchFilteredData.map((row) => (
                  <tr key={row.id} style={{ backgroundColor: selectedLedgerIds.has(row.id) ? '#FDF1E5' : 'transparent' }}>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={selectedLedgerIds.has(row.id)}
                        onChange={() => handleSelectLedgerRow(row.id)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                    <td style={tdStyle}>
                      {row.matchingStatus ? (
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          backgroundColor: getStatusColor(row.matchingStatus) + '20',
                          color: getStatusColor(row.matchingStatus),
                          fontWeight: '600'
                        }}>
                          {row.matchingStatus}
                        </span>
                      ) : (
                        <span style={{ color: '#8A8A8A', fontSize: '11px' }}>ー</span>
                      )}
                    </td>
                    <td style={tdStyle}>{row.qrCode || '-'}</td>
                    <td style={tdStyle}>{row.assetNo}</td>
                    <td style={tdStyle}>{row.meNo || '-'}</td>
                    <td style={tdStyle}>{row.department}</td>
                    <td style={tdStyle}>{row.section}</td>
                    <td style={tdStyle}>{row.roomName || '-'}</td>
                    <td style={tdStyle}>{row.category || '-'}</td>
                    <td style={tdStyle}>{row.majorCategory || '-'}</td>
                    <td style={tdStyle}>{row.middleCategory || '-'}</td>
                    <td style={tdStyle}>{row.item}</td>
                    <td style={tdStyle}>{row.manufacturer || '-'}</td>
                    <td style={tdStyle}>{row.model || '-'}</td>
                    <td style={{ ...tdStyle, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{row.quantity}</td>
                    <td style={tdStyle}>{row.acquisitionDate || '-'}</td>
                  </tr>
                ))}
                {ledgerMatchFilteredData.length === 0 && (
                  <tr>
                    <td colSpan={currentList?.type === 'me-ledger' ? 16 : 15} style={{ padding: '24px', textAlign: 'center', color: '#8A8A8A', fontSize: '13px' }}>
                      {ledgerUnmatchedCount === 0 ? '全ての台帳レコードの突合が完了しました' : 'フィルター条件に該当するデータがありません'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 統合リストモーダル */}
      {showResultModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            width: '95%',
            maxWidth: '1400px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #E1E1E1',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#4A4A4A' }}>
                  統合リスト
                </h3>
                <div style={{ fontSize: '13px', color: '#8A8A8A', marginTop: '4px' }}>
                  統合元: {mergedListNames.join(' + ')} = {mergedList.length}件
                </div>
              </div>
              <button
                onClick={() => setShowResultModal(false)}
                style={{
                  fontSize: '24px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  color: '#8A8A8A'
                }}
                aria-label="閉じる"
              >
                ×
              </button>
            </div>

            <div style={{ padding: '20px', flex: 1, overflow: 'auto' }}>
              <div style={{ overflow: 'auto', maxHeight: '500px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#FAFAFA', position: 'sticky', top: 0 }}>
                      <th style={thStyle}>突合状況</th>
                      <th style={thStyle}>QRコード</th>
                      <th style={thStyle}>資産番号</th>
                      <th style={thStyle}>共通部門</th>
                      <th style={thStyle}>共通部署</th>
                      <th style={thStyle}>室名</th>
                      <th style={thStyle}>カテゴリ</th>
                      <th style={thStyle}>大分類</th>
                      <th style={thStyle}>中分類</th>
                      <th style={thStyle}>品目</th>
                      <th style={thStyle}>メーカー</th>
                      <th style={thStyle}>数量</th>
                      <th style={thStyle}>購入年月日</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mergedList.map((row) => (
                      <tr key={row.id}>
                        <td style={tdStyle}>
                          {row.matchingStatus ? (
                            <span style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              backgroundColor: getStatusColor(row.matchingStatus) + '20',
                              color: getStatusColor(row.matchingStatus),
                              fontWeight: '600'
                            }}>
                              {row.matchingStatus}
                            </span>
                          ) : (
                            <span style={{ color: '#8A8A8A', fontSize: '11px' }}>ー</span>
                          )}
                        </td>
                        <td style={tdStyle}>{row.qrCode || '-'}</td>
                        <td style={tdStyle}>{row.assetNo || '-'}</td>
                        <td style={tdStyle}>{row.department}</td>
                        <td style={tdStyle}>{row.section}</td>
                        <td style={tdStyle}>{row.roomName || '-'}</td>
                        <td style={tdStyle}>{row.category || '-'}</td>
                        <td style={tdStyle}>{row.majorCategory || '-'}</td>
                        <td style={tdStyle}>{row.middleCategory || '-'}</td>
                        <td style={tdStyle}>{row.item}</td>
                        <td style={tdStyle}>{row.manufacturer || '-'}</td>
                        <td style={{ ...tdStyle, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{row.quantity}</td>
                        <td style={tdStyle}>{row.acquisitionDate || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{
              padding: '20px',
              borderTop: '1px solid #E1E1E1',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                onClick={() => setShowResultModal(false)}
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #E1E1E1',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
