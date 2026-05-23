'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { useMasterStore } from '@/lib/stores';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

interface Photo {
  id: string;
  url: string;
  filename: string;
}

interface RegistrationData {
  id: number;
  surveyDate: string;
  surveyor: string;
  category: string;
  building: string;
  floor: string;
  department: string;
  section: string;
  sealNo: string;
  roomName: string;
  assetNo: string;
  equipmentNo: string;
  serialNo: string;
  detailType: '本体' | '明細' | '付属品' | '';
  parentId: number | null;
  purchaseDate: string;
  lease: string;
  rental: string;
  photoCount: number;
  photos: Photo[];
  largeClass: string;
  mediumClass: string;
  item: string;
  manufacturer: string;
  model: string;
  width: string;
  depth: string;
  height: string;
  remarks: string;
  masterId: string;
}

export default function RegistrationEditPage() {
  const router = useRouter();
  const { isMobile } = useResponsive();
  const { assets: assetMasters, facilities } = useMasterStore();
  const [selectedAll, setSelectedAll] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<RegistrationData | null>(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [selectedRowForPhoto, setSelectedRowForPhoto] = useState<RegistrationData | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [modalPosition, setModalPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // 紐付けモード状態
  const [linkingParentId, setLinkingParentId] = useState<number | null>(null);

  // フィルター状態
  const [filters, setFilters] = useState({
    building: '',
    floor: '',
    department: '',
    section: '',
    category: '',
    largeClass: '',
    mediumClass: '',
    surveyor: ''
  });

  // ソート状態
  type SortKey = keyof RegistrationData | null;
  type SortDirection = 'asc' | 'desc';
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // ソートハンドラ
  const handleSort = (key: keyof RegistrationData) => {
    if (sortKey === key) {
      // 同じカラムをクリックした場合は方向を切り替え
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // 新しいカラムをクリックした場合は昇順でソート
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  // ソートアイコン表示
  const getSortIcon = (key: keyof RegistrationData) => {
    if (sortKey !== key) return ' ↕';
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  const sampleData: RegistrationData[] = [
    {
      id: 1,
      surveyDate: '2025-11-01',
      surveyor: '山田太郎',
      category: '医療機器',
      building: '本館',
      floor: '2F',
      department: '手術部門',
      section: '器材室',
      sealNo: '22-00474',
      roomName: '手術室A',
      assetNo: '10605379-000',
      equipmentNo: '1338',
      serialNo: 'SN-001234',
      detailType: '本体',
      parentId: null,
      purchaseDate: '2022-04-15',
      lease: 'なし',
      rental: 'なし',
      photoCount: 3,
      photos: [
        { id: '1-1', url: 'https://placehold.co/800x600/e3f2fd/1976d2?text=Photo+1', filename: '装置全体.jpg' },
        { id: '1-2', url: 'https://placehold.co/800x600/e3f2fd/1976d2?text=Photo+2', filename: 'ラベル.jpg' },
        { id: '1-3', url: 'https://placehold.co/800x600/e3f2fd/1976d2?text=Photo+3', filename: '型式銘板.jpg' }
      ],
      largeClass: '医療機器',
      mediumClass: '滅菌機器',
      item: '燻蒸滅菌装置',
      manufacturer: 'VENLE GO',
      model: 'CEパルサマドライ',
      width: 'φ500',
      depth: '',
      height: '',
      remarks: '',
      masterId: 'M001'
    },
    {
      id: 2,
      surveyDate: '2025-11-02',
      surveyor: '佐藤花子',
      category: '医療機器',
      building: '本館',
      floor: '3F',
      department: '放射線科',
      section: 'CT室',
      sealNo: 'シールなし',
      roomName: 'CT室1',
      assetNo: '',
      equipmentNo: '',
      serialNo: '',
      detailType: '本体',
      parentId: null,
      purchaseDate: '',
      lease: 'あり',
      rental: 'なし',
      photoCount: 1,
      photos: [
        { id: '2-1', url: 'https://placehold.co/800x600/fff3cd/f57c00?text=Photo+1', filename: '内視鏡本体.jpg' }
      ],
      largeClass: '医療機器',
      mediumClass: '内視鏡関連機器',
      item: '特殊内視鏡 BF-TYPE ABC',
      manufacturer: 'オリンパスメディカル',
      model: 'BF-ABC-123-XYZ',
      width: '',
      depth: '',
      height: '',
      remarks: 'リース期限近い',
      masterId: ''
    },
    {
      id: 3,
      surveyDate: '2025-11-03',
      surveyor: '田中一郎',
      category: '医療機器',
      building: '別館',
      floor: '1F',
      department: '検査科',
      section: '検査室',
      sealNo: '22-00812',
      roomName: '検査室B',
      assetNo: '10605421-000',
      equipmentNo: '2156',
      serialNo: 'SN-003456',
      detailType: '本体',
      parentId: null,
      purchaseDate: '2023-01-20',
      lease: 'なし',
      rental: 'なし',
      photoCount: 2,
      photos: [
        { id: '3-1', url: 'https://placehold.co/800x600/c8e6c9/388e3c?text=Photo+1', filename: '本体正面.jpg' },
        { id: '3-2', url: 'https://placehold.co/800x600/c8e6c9/388e3c?text=Photo+2', filename: '操作パネル.jpg' }
      ],
      largeClass: '検査機器',
      mediumClass: '血液検査装置',
      item: '自動血球計数器',
      manufacturer: 'シスメックス',
      model: 'XN-3000',
      width: '600',
      depth: '550',
      height: '450',
      remarks: '',
      masterId: 'M002'
    },
    {
      id: 4,
      surveyDate: '2025-11-03',
      surveyor: '鈴木美咲',
      category: '什器備品',
      building: '新館',
      floor: '2F',
      department: '外科',
      section: '診察室',
      sealNo: '22-01035',
      roomName: '診察室3',
      assetNo: '10606523-000',
      equipmentNo: '3421',
      serialNo: 'SN-004567',
      detailType: '明細',
      parentId: null,
      purchaseDate: '2024-06-10',
      lease: 'なし',
      rental: 'なし',
      photoCount: 1,
      photos: [
        { id: '4-1', url: 'https://placehold.co/800x600/ffecb3/ff9800?text=Photo+1', filename: '診察台.jpg' }
      ],
      largeClass: '什器備品',
      mediumClass: '診察台',
      item: '電動診察台',
      manufacturer: '高田ベッド製作所',
      model: 'TB-1234',
      width: '1800',
      depth: '650',
      height: '700',
      remarks: '昇降機能付き',
      masterId: 'M003'
    },
    {
      id: 5,
      surveyDate: '2025-11-04',
      surveyor: '高橋健太',
      category: '医療機器',
      building: '本館',
      floor: '4F',
      department: '整形外科',
      section: '処置室',
      sealNo: '22-01247',
      roomName: '処置室A',
      assetNo: '10607834-000',
      equipmentNo: '4892',
      serialNo: 'SN-005678',
      detailType: '本体',
      parentId: null,
      purchaseDate: '2021-09-15',
      lease: 'あり',
      rental: 'なし',
      photoCount: 4,
      photos: [
        { id: '5-1', url: 'https://placehold.co/800x600/f3e5f5/9c27b0?text=Photo+1', filename: '超音波治療器全体.jpg' },
        { id: '5-2', url: 'https://placehold.co/800x600/f3e5f5/9c27b0?text=Photo+2', filename: '操作パネル.jpg' },
        { id: '5-3', url: 'https://placehold.co/800x600/f3e5f5/9c27b0?text=Photo+3', filename: 'プローブ.jpg' },
        { id: '5-4', url: 'https://placehold.co/800x600/f3e5f5/9c27b0?text=Photo+4', filename: 'メンテナンス記録.jpg' }
      ],
      largeClass: '治療機器',
      mediumClass: '物理療法機器',
      item: '超音波治療器',
      manufacturer: '伊藤超短波',
      model: 'US-750',
      width: '350',
      depth: '280',
      height: '120',
      remarks: '定期メンテナンス済',
      masterId: 'M004'
    },
    {
      id: 6,
      surveyDate: '2025-11-05',
      surveyor: '田中一郎',
      category: '医療機器',
      building: '新館',
      floor: '1F',
      department: '検査科',
      section: '検体検査室',
      sealNo: 'シールなし',
      roomName: '検体検査室B',
      assetNo: '',
      equipmentNo: '',
      serialNo: '',
      detailType: '付属品',
      parentId: null,
      purchaseDate: '',
      lease: 'なし',
      rental: 'なし',
      photoCount: 2,
      photos: [
        { id: '6-1', url: 'https://placehold.co/800x600/fff9c4/f57f17?text=Photo+1', filename: '血球計数器本体.jpg' },
        { id: '6-2', url: 'https://placehold.co/800x600/fff9c4/f57f17?text=Photo+2', filename: '型式プレート.jpg' }
      ],
      largeClass: '検査装置',
      mediumClass: '血液検査装置',
      item: '自動血球計数器 XYZ-2000',
      manufacturer: 'ABC医療機器',
      model: 'XYZ-2000-Pro',
      width: '450',
      depth: '500',
      height: '400',
      remarks: 'マスタ未登録機器',
      masterId: ''
    },
    {
      id: 7,
      surveyDate: '2025-11-06',
      surveyor: '佐藤花子',
      category: '什器備品',
      building: '本館',
      floor: '1F',
      department: '事務部',
      section: '総務課',
      sealNo: '22-01500',
      roomName: '事務室',
      assetNo: '10608123-000',
      equipmentNo: '5123',
      serialNo: 'SN-007890',
      detailType: '',
      parentId: null,
      purchaseDate: '2023-03-20',
      lease: 'なし',
      rental: 'なし',
      photoCount: 1,
      photos: [
        { id: '7-1', url: 'https://placehold.co/800x600/e1f5fe/0277bd?text=Photo+1', filename: 'スチール書庫.jpg' }
      ],
      largeClass: 'オフィス家具',
      mediumClass: '書庫',
      item: 'スチール書庫 H1800',
      manufacturer: 'コクヨ',
      model: 'S-D36F1N',
      width: '900',
      depth: '400',
      height: '1800',
      remarks: '',
      masterId: ''
    }
  ];

  const [data, setData] = useState(sampleData);

  // フィルターoptionsを生成（施設マスタから）
  const buildingOptions = useMemo(() => {
    const uniqueBuildings = Array.from(new Set(facilities.map(f => f.building)));
    return uniqueBuildings.filter(Boolean) as string[];
  }, [facilities]);

  const floorOptions = useMemo(() => {
    const uniqueFloors = Array.from(new Set(facilities.map(f => f.floor)));
    return uniqueFloors.filter(Boolean) as string[];
  }, [facilities]);

  const departmentOptions = useMemo(() => {
    const uniqueDepartments = Array.from(new Set(facilities.map(f => f.department)));
    return uniqueDepartments.filter(Boolean) as string[];
  }, [facilities]);

  const sectionOptions = useMemo(() => {
    const uniqueSections = Array.from(new Set(facilities.map(f => f.section)));
    return uniqueSections.filter(Boolean) as string[];
  }, [facilities]);

  // フィルターoptionsを生成（資産マスタから）
  const categoryOptions = useMemo(() => {
    const uniqueCategories = Array.from(new Set(assetMasters.map(a => a.category)));
    return uniqueCategories.filter(Boolean);
  }, [assetMasters]);

  const largeClassOptions = useMemo(() => {
    const uniqueLargeClasses = Array.from(new Set(assetMasters.map(a => a.largeClass)));
    return uniqueLargeClasses.filter(Boolean);
  }, [assetMasters]);

  const mediumClassOptions = useMemo(() => {
    const uniqueMediumClasses = Array.from(new Set(assetMasters.map(a => a.mediumClass)));
    return uniqueMediumClasses.filter(Boolean);
  }, [assetMasters]);

  // 担当者オプションを生成（サンプルデータから）
  const surveyorOptions = useMemo(() => {
    const uniqueSurveyors = Array.from(new Set(data.map(d => d.surveyor)));
    return uniqueSurveyors.filter(Boolean);
  }, [data]);

  // フィルタリングされたデータ
  const filteredData = useMemo(() => {
    let filtered = data;

    if (filters.building) {
      filtered = filtered.filter(d => d.building === filters.building);
    }
    if (filters.floor) {
      filtered = filtered.filter(d => d.floor === filters.floor);
    }
    if (filters.department) {
      filtered = filtered.filter(d => d.department === filters.department);
    }
    if (filters.section) {
      filtered = filtered.filter(d => d.section === filters.section);
    }
    if (filters.category) {
      filtered = filtered.filter(d => d.category === filters.category);
    }
    if (filters.largeClass) {
      filtered = filtered.filter(d => d.largeClass === filters.largeClass);
    }
    if (filters.mediumClass) {
      filtered = filtered.filter(d => d.mediumClass === filters.mediumClass);
    }
    if (filters.surveyor) {
      filtered = filtered.filter(d => d.surveyor === filters.surveyor);
    }

    // ソート処理
    if (sortKey) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortKey];
        const bValue = b[sortKey];

        // null/undefined チェック
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return sortDirection === 'asc' ? 1 : -1;
        if (bValue == null) return sortDirection === 'asc' ? -1 : 1;

        // 数値の場合
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }

        // 文字列の場合
        const aStr = String(aValue);
        const bStr = String(bValue);
        const comparison = aStr.localeCompare(bStr, 'ja');
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [data, filters, sortKey, sortDirection]);

  // 親子グルーピング表示用データ
  const groupedData = useMemo(() => {
    const result: RegistrationData[] = [];
    const childrenMap = new Map<number, RegistrationData[]>();
    const parentIds = new Set<number>();

    // 子レコードを親IDごとにグルーピング
    for (const row of filteredData) {
      if (row.parentId !== null) {
        const children = childrenMap.get(row.parentId) || [];
        children.push(row);
        childrenMap.set(row.parentId, children);
      }
    }

    // 本体レコードのIDを集める
    for (const row of filteredData) {
      if (row.detailType === '本体') {
        parentIds.add(row.id);
      }
    }

    // filteredData順にループし、本体の直後に子を挿入
    const insertedChildren = new Set<number>();
    for (const row of filteredData) {
      if (row.parentId !== null && insertedChildren.has(row.id)) {
        continue; // 既に親の下に挿入済み
      }
      if (row.parentId !== null) {
        // 子レコードだが親がfilteredDataにない場合はそのまま配置
        if (!parentIds.has(row.parentId)) {
          result.push(row);
        }
        continue;
      }
      result.push(row);
      // 本体の場合、子を直後に挿入
      if (row.detailType === '本体') {
        const children = childrenMap.get(row.id) || [];
        for (const child of children) {
          result.push(child);
          insertedChildren.add(child.id);
        }
      }
    }

    return result;
  }, [filteredData]);

  // 紐付けモードの親レコード情報
  const linkingParent = useMemo(() => {
    if (linkingParentId === null) return null;
    return data.find(r => r.id === linkingParentId) || null;
  }, [linkingParentId, data]);

  // フィルタークリア
  const handleClearFilters = () => {
    setFilters({
      building: '',
      floor: '',
      department: '',
      section: '',
      category: '',
      largeClass: '',
      mediumClass: '',
      surveyor: ''
    });
  };

  // マスタに存在するかチェックする関数（masterId が設定されている場合はマスタ登録済みとみなす）
  const isInMaster = (field: 'largeClass' | 'mediumClass' | 'item' | 'manufacturer' | 'model', value: string, masterId: string): boolean => {
    if (!value) return true; // 空の場合は通常表示
    if (masterId) return true; // masterId が設定されている場合はマスタ登録済み

    const fieldMap = {
      largeClass: 'largeClass',
      mediumClass: 'mediumClass',
      item: 'item',
      manufacturer: 'maker',
      model: 'model'
    };

    const masterField = fieldMap[field];
    return assetMasters.some(master => master[masterField as keyof typeof master] === value);
  };

  // フリー入力セルのスタイル（動的な背景色のため inline style を維持）
  const getFreeInputCellStyle = (field: 'largeClass' | 'mediumClass' | 'item' | 'manufacturer' | 'model', value: string, masterId: string, baseStyle: React.CSSProperties): React.CSSProperties => {
    const isFreeInput = !isInMaster(field, value, masterId);
    return {
      ...baseStyle,
      backgroundColor: isFreeInput ? '#FDF1E5' : (baseStyle.backgroundColor || 'white')
    };
  };

  const handleBack = () => {
    router.push('/main');
  };

  // 本体に設定して紐付けモードに入る
  const handleSetParent = (id: number) => {
    setData(prev => prev.map(row =>
      row.id === id ? { ...row, detailType: '本体' as const } : row
    ));
    setLinkingParentId(id);
    setSelectedRows(new Set());
    setSelectedAll(false);
  };

  // 選択行を明細として紐付け
  const handleLinkAsDetail = () => {
    if (linkingParentId === null || selectedRows.size === 0) return;
    setData(prev => prev.map(row =>
      selectedRows.has(row.id)
        ? { ...row, detailType: '明細' as const, parentId: linkingParentId }
        : row
    ));
    setSelectedRows(new Set());
    setSelectedAll(false);
  };

  // 選択行を付属品として紐付け
  const handleLinkAsAccessory = () => {
    if (linkingParentId === null || selectedRows.size === 0) return;
    setData(prev => prev.map(row =>
      selectedRows.has(row.id)
        ? { ...row, detailType: '付属品' as const, parentId: linkingParentId }
        : row
    ));
    setSelectedRows(new Set());
    setSelectedAll(false);
  };

  // 個別の紐付け解除（1行ずつ）
  const handleUnlinkSingle = (id: number) => {
    setData(prev => prev.map(row =>
      row.id === id ? { ...row, detailType: '' as const, parentId: null } : row
    ));
  };

  // 紐付けモード解除
  const handleExitLinking = () => {
    setLinkingParentId(null);
    setSelectedRows(new Set());
    setSelectedAll(false);
  };

  const toggleSelectAll = (checked: boolean) => {
    setSelectedAll(checked);
    if (checked) {
      // 紐付けモード中は紐付け先の親を除外
      const selectableRows = groupedData.filter(row =>
        linkingParentId === null || row.id !== linkingParentId
      );
      setSelectedRows(new Set(selectableRows.map(row => row.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const toggleRowSelection = (id: number) => {
    // 紐付けモード中は紐付け先の親を選択不可
    if (linkingParentId !== null && id === linkingParentId) return;
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
    const selectableCount = groupedData.filter(row =>
      linkingParentId === null || row.id !== linkingParentId
    ).length;
    setSelectedAll(newSelected.size === selectableCount);
  };

  const handleEdit = (id: number) => {
    const row = data.find(r => r.id === id);
    if (row) {
      setEditingRow(id);
      setEditingData({ ...row });
    }
  };

  const handleSave = () => {
    if (editingData && editingRow !== null) {
      setData(data.map(row => row.id === editingRow ? editingData : row));
      setEditingRow(null);
      setEditingData(null);
    }
  };

  const handleCancel = () => {
    setEditingRow(null);
    setEditingData(null);
  };

  const handlePhotoClick = (row: RegistrationData) => {
    setSelectedRowForPhoto(row);
    setIsPhotoModalOpen(true);
    setSelectedPhoto(null);
    setModalPosition({ x: 100, y: 100 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - modalPosition.x,
      y: e.clientY - modalPosition.y
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setModalPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart.x, dragStart.y]);

  const handlePhotoDelete = (photoId: string) => {
    if (!selectedRowForPhoto) return;

    const updatedRow = {
      ...selectedRowForPhoto,
      photos: selectedRowForPhoto.photos.filter(p => p.id !== photoId),
      photoCount: selectedRowForPhoto.photos.filter(p => p.id !== photoId).length
    };

    setData(data.map(row => row.id === selectedRowForPhoto.id ? updatedRow : row));
    setSelectedRowForPhoto(updatedRow);
    setSelectedPhoto(null);
  };

  const handlePhotoModalClose = () => {
    setIsPhotoModalOpen(false);
    setSelectedRowForPhoto(null);
    setSelectedPhoto(null);
  };

  const handleOpenAssetMaster = () => {
    const width = 1200;
    const height = 800;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    // GitHub Pages対応: basePathを付与
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

    window.open(
      `${basePath}/asset-master`,
      'AssetMasterWindow',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
  };

  // 資産マスタからのメッセージを受信
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // セキュリティチェック: 同じオリジンからのメッセージのみ受け入れる
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'ASSET_SELECTED' && editingData) {
        const assetMasters = event.data.assets as any[];
        const scope = event.data.scope as 'all' | 'toMaker' | 'toItem';

        // 最初の資産を適用
        if (assetMasters.length > 0) {
          const master = assetMasters[0];

          // スコープに応じて適用するフィールドを決定
          // 範囲外のフィールドは空白にする
          let updatedData: typeof editingData;

          switch (scope) {
            case 'toItem':
              // 品目まで確定: Category, 大分類, 中分類, 個体管理品目
              // メーカー、型式は空白にする
              updatedData = {
                ...editingData,
                category: master.category || editingData.category,
                largeClass: master.largeClass || editingData.largeClass,
                mediumClass: master.mediumClass || editingData.mediumClass,
                item: master.item || editingData.item,
                manufacturer: '',  // 範囲外なので空白
                model: '',         // 範囲外なので空白
                masterId: master.id
              };
              break;
            case 'toMaker':
              // メーカーまで確定: Category, 大分類, 中分類, 個体管理品目, メーカー
              // 型式は空白にする
              updatedData = {
                ...editingData,
                category: master.category || editingData.category,
                largeClass: master.largeClass || editingData.largeClass,
                mediumClass: master.mediumClass || editingData.mediumClass,
                item: master.item || editingData.item,
                manufacturer: master.maker || editingData.manufacturer,
                model: '',         // 範囲外なので空白
                masterId: master.id
              };
              break;
            case 'all':
            default:
              // 全て確定: 全カラム
              updatedData = {
                ...editingData,
                category: master.category || editingData.category,
                largeClass: master.largeClass || editingData.largeClass,
                mediumClass: master.mediumClass || editingData.mediumClass,
                item: master.item || editingData.item,
                manufacturer: master.maker || editingData.manufacturer,
                model: master.model || editingData.model,
                masterId: master.id
              };
              break;
          }

          setEditingData(updatedData);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [editingData]);

  const handleConfirm = (id: number) => {
    const row = data.find(r => r.id === id);
    if (!row) return;

    if (!row.masterId) {
      alert('マスタIDが登録されていないため確定できません');
      return;
    }

    if (confirm(`ID: ${row.id} のレコードを確定しますか？\n確定後、このレコードは画面から削除されます。`)) {
      setData(data.filter(r => r.id !== id));
      setSelectedRows(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleBulkConfirm = () => {
    if (selectedRows.size === 0) {
      alert('確定する行を選択してください');
      return;
    }
    const invalidRows = data.filter(row => selectedRows.has(row.id) && !row.masterId);
    if (invalidRows.length > 0) {
      alert(`${invalidRows.length}件のマスタ未登録行があります。先にマスタ登録を完了してください。`);
      return;
    }

    if (confirm(`選択した${selectedRows.size}件のレコードを一括確定しますか？\n確定後、これらのレコードは画面から削除されます。`)) {
      setData(data.filter(row => !selectedRows.has(row.id)));
      setSelectedRows(new Set());
      setSelectedAll(false);
    }
  };

  if (isMobile) {
    return (
      <div className="p-4 bg-[#FAFAFA] min-h-dvh">
        <div className="mb-4 text-center text-lg font-bold text-[#4A4A4A]">
          現有品調査内容修正
        </div>
        <div className="text-red-600 mb-4 text-sm text-center">
          この画面はデスクトップ表示に最適化されています
        </div>
        <button
          onClick={handleBack}
          className="w-full py-3 bg-[#008C1D] text-white border-none rounded-lg cursor-pointer text-base"
        >
          メイン画面に戻る
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-dvh bg-[#FAFAFA] overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-[#E1E1E1] px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-[#008C1D] text-white px-2 py-1 rounded font-bold text-sm">
            SHIP
          </div>
          <h1 className="text-xl font-bold text-[#4A4A4A] m-0 text-balance">
            現有品調査内容修正
          </h1>
        </div>
        <button
          onClick={handleBack}
          className="px-4 py-2 bg-white border border-[#E1E1E1] rounded cursor-pointer text-sm text-[#8A8A8A] hover:bg-[#FAFAFA]"
        >
          メイン画面に戻る
        </button>
      </header>

      {/* Filter Header */}
      <div className="bg-white px-6 py-4 border-b border-[#E1E1E1]">
        <div className="flex gap-3 flex-wrap items-end">
          <div className="flex-1 min-w-[120px]">
            <SearchableSelect
              label="棟"
              value={filters.building}
              onChange={(value) => setFilters({...filters, building: value})}
              options={buildingOptions}
              placeholder="全て"
              isMobile={false}
            />
          </div>

          <div className="flex-1 min-w-[100px]">
            <SearchableSelect
              label="階"
              value={filters.floor}
              onChange={(value) => setFilters({...filters, floor: value})}
              options={floorOptions}
              placeholder="全て"
              isMobile={false}
            />
          </div>

          <div className="flex-1 min-w-[120px]">
            <SearchableSelect
              label="部門"
              value={filters.department}
              onChange={(value) => setFilters({...filters, department: value})}
              options={departmentOptions}
              placeholder="全て"
              isMobile={false}
            />
          </div>

          <div className="flex-1 min-w-[120px]">
            <SearchableSelect
              label="部署"
              value={filters.section}
              onChange={(value) => setFilters({...filters, section: value})}
              options={sectionOptions}
              placeholder="全て"
              isMobile={false}
            />
          </div>

          <div className="flex-1 min-w-[120px]">
            <SearchableSelect
              label="担当者"
              value={filters.surveyor}
              onChange={(value) => setFilters({...filters, surveyor: value})}
              options={surveyorOptions}
              placeholder="全て"
              isMobile={false}
            />
          </div>

          <div className="flex-1 min-w-[120px]">
            <SearchableSelect
              label="Category"
              value={filters.category}
              onChange={(value) => setFilters({...filters, category: value})}
              options={categoryOptions}
              placeholder="全て"
              isMobile={false}
            />
          </div>

          <div className="flex-1 min-w-[150px]">
            <SearchableSelect
              label="大分類"
              value={filters.largeClass}
              onChange={(value) => setFilters({...filters, largeClass: value})}
              options={largeClassOptions}
              placeholder="全て"
              isMobile={false}
            />
          </div>

          <div className="flex-1 min-w-[150px]">
            <SearchableSelect
              label="中分類"
              value={filters.mediumClass}
              onChange={(value) => setFilters({...filters, mediumClass: value})}
              options={mediumClassOptions}
              placeholder="全て"
              isMobile={false}
            />
          </div>

          <button
            onClick={handleClearFilters}
            className="px-4 py-2 bg-[#4A4A4A] text-white border-none rounded cursor-pointer text-sm hover:bg-[#4A4A4A]"
          >
            クリア
          </button>
        </div>
      </div>

      {/* Linking Bar */}
      {linkingParent && (
        <div className="bg-[#EBF5EE] border-b-2 border-[#008C1D]">
          {/* ヘッダー行 */}
          <div className="px-6 py-2.5 flex justify-between items-center bg-[#EBF5EE]">
            <div className="flex items-center gap-3">
              <span className="bg-[#146E2E] text-white px-2.5 py-0.5 rounded text-xs font-semibold">紐付け登録モード</span>
              <span className="font-semibold text-[#146E2E] text-sm">
                本体: {linkingParent.item}
                <span className="text-[#8A8A8A] font-normal ml-2">({linkingParent.sealNo})</span>
              </span>
            </div>
            <button
              onClick={handleExitLinking}
              className="px-4 py-1.5 bg-white text-[#8A8A8A] border border-[#E1E1E1] rounded cursor-pointer text-[13px]"
            >
              モードを終了
            </button>
          </div>
          {/* 操作ガイド行 */}
          <div className="px-6 py-2.5 flex items-center gap-4 flex-wrap">
            {selectedRows.size === 0 ? (
              <span className="text-[#146E2E] text-[13px]">
                子にしたいレコードのチェックボックスを選択してください
              </span>
            ) : (
              <>
                <span className="text-[#146E2E] text-[13px] font-semibold">
                  {selectedRows.size}件選択中 — 種別を選んで紐付け:
                </span>
                <button
                  onClick={handleLinkAsDetail}
                  className="px-5 py-2 bg-[#4A4A4A] text-white border-none rounded cursor-pointer text-[13px] font-semibold"
                >
                  明細として紐付ける
                </button>
                <button
                  onClick={handleLinkAsAccessory}
                  className="px-5 py-2 bg-[#4A4A4A] text-white border-none rounded cursor-pointer text-[13px] font-semibold"
                >
                  付属品として紐付ける
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 min-h-0 p-6">
        <div className="bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.1)] overflow-auto h-full">
          <table className="w-full border-separate border-spacing-0 text-[13px]">
            <thead>
              <tr>
                {/* --- 通常カラム（sticky top のみ） --- */}
                {([
                  { key: 'sealNo' as const, label: 'QRコード' },
                  { key: 'floor' as const, label: '階' },
                  { key: 'department' as const, label: '部門' },
                  { key: 'section' as const, label: '部署' },
                  { key: 'roomName' as const, label: '室名' },
                  { key: 'category' as const, label: 'Category' },
                  { key: 'largeClass' as const, label: '大分類' },
                  { key: 'mediumClass' as const, label: '中分類' },
                  { key: 'detailType' as const, label: '明細区分' },
                  { key: 'item' as const, label: '個体管理品目' },
                  { key: 'manufacturer' as const, label: 'メーカー' },
                  { key: 'model' as const, label: '型式' },
                  { key: 'width' as const, label: 'W' },
                  { key: 'depth' as const, label: 'D' },
                  { key: 'height' as const, label: 'H' },
                  { key: 'assetNo' as const, label: '資産番号' },
                  { key: 'equipmentNo' as const, label: 'ME番号' },
                  { key: 'serialNo' as const, label: 'シリアルNo' },
                  { key: 'purchaseDate' as const, label: '購入年月日' },
                  { key: 'remarks' as const, label: '備考' },
                  { key: 'lease' as const, label: 'リース・借用' },
                  { key: 'surveyDate' as const, label: '調査日付' },
                  { key: 'surveyor' as const, label: '担当者' },
                ]).map(col => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="px-2 py-3 border border-[#E1E1E1] whitespace-nowrap cursor-pointer select-none sticky top-0 z-[2] bg-[#FAFAFA] text-left text-[#4A4A4A] font-semibold text-xs"
                  >
                    {col.label}{getSortIcon(col.key)}
                  </th>
                ))}
                {/* 写真（ソートなし、sticky top のみ） */}
                <th className="px-2 py-3 border border-[#E1E1E1] whitespace-nowrap sticky top-0 z-[2] bg-[#FAFAFA] text-left text-[#4A4A4A] font-semibold text-xs">写真</th>
                {/* --- 操作（sticky top + right） --- */}
                <th className="px-2 py-3 border border-[#E1E1E1] whitespace-nowrap sticky top-0 right-[48px] z-[3] bg-[#FAFAFA] shadow-[-2px_0_4px_rgba(0,0,0,0.06)] text-left text-[#4A4A4A] font-semibold text-xs">操作</th>
                {/* --- チェックボックス（sticky top + right） --- */}
                <th className="px-2 py-3 border border-[#E1E1E1] text-center whitespace-nowrap sticky top-0 right-0 z-[3] bg-[#FAFAFA] w-12 min-w-[48px]">
                  <input
                    type="checkbox"
                    checked={selectedAll}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {groupedData.map((row) => {
                const isChild = row.parentId !== null;
                const isLinkingTarget = linkingParentId !== null && row.id === linkingParentId;
                const parentRow = isChild ? data.find(r => r.id === row.parentId) : null;
                const rowBgColor = isLinkingTarget ? '#EBF5EE' : isChild ? '#FAFAFA' : 'white';
                return (
                <tr key={row.id} style={{ backgroundColor: rowBgColor }}>
                  {/* ① QRコード */}
                  <td className="px-2 py-2 border border-[#E1E1E1] whitespace-nowrap text-[#4A4A4A]">
                    {isChild && <span className="text-[#8A8A8A] mr-1">└</span>}
                    {row.sealNo}
                  </td>
                  {/* ② 階 */}
                  <td className="px-2 py-2 border border-[#E1E1E1] whitespace-nowrap text-[#4A4A4A]">{row.floor}</td>
                  {/* ③ 部門 */}
                  <td className="px-2 py-2 border border-[#E1E1E1] whitespace-nowrap text-[#4A4A4A]">{row.department}</td>
                  {/* ④ 部署 */}
                  <td className="px-2 py-2 border border-[#E1E1E1] whitespace-nowrap text-[#4A4A4A]">{row.section}</td>
                  {/* ⑤ 室名 */}
                  <td className="px-2 py-2 border border-[#E1E1E1] whitespace-nowrap text-[#4A4A4A]">{row.roomName}</td>
                  {/* ⑥ Category */}
                  <td className="px-2 py-2 border border-[#E1E1E1] whitespace-nowrap text-[#4A4A4A]">{row.category}</td>
                  {/* ⑥ 大分類 */}
                  <td style={getFreeInputCellStyle('largeClass', editingRow === row.id && editingData ? editingData.largeClass : row.largeClass, row.masterId, { padding: '8px', borderBottom: '1px solid #E1E1E1', whiteSpace: 'nowrap' })}>
                    {editingRow === row.id && editingData ? (
                      <input
                        type="text"
                        value={editingData.largeClass || ''}
                        onChange={(e) => setEditingData({ ...editingData, largeClass: e.target.value })}
                        className="w-full p-1 border border-[#E1E1E1] rounded"
                      />
                    ) : row.largeClass}
                  </td>
                  {/* ⑥ 中分類 */}
                  <td style={getFreeInputCellStyle('mediumClass', editingRow === row.id && editingData ? editingData.mediumClass : row.mediumClass, row.masterId, { padding: '8px', borderBottom: '1px solid #E1E1E1', whiteSpace: 'nowrap' })}>
                    {editingRow === row.id && editingData ? (
                      <input
                        type="text"
                        value={editingData.mediumClass || ''}
                        onChange={(e) => setEditingData({ ...editingData, mediumClass: e.target.value })}
                        className="w-full p-1 border border-[#E1E1E1] rounded"
                      />
                    ) : row.mediumClass}
                  </td>
                  {/* 明細区分 */}
                  <td className="px-2 py-2 border border-[#E1E1E1] whitespace-nowrap">
                    {editingRow === row.id && editingData ? (
                      <select
                        value={editingData.detailType}
                        onChange={(e) => setEditingData({ ...editingData, detailType: e.target.value as RegistrationData['detailType'] })}
                        className="w-full p-1 border border-[#E1E1E1] rounded text-xs"
                      >
                        <option value="">未設定</option>
                        <option value="本体">本体</option>
                        <option value="明細">明細</option>
                        <option value="付属品">付属品</option>
                      </select>
                    ) : (
                      row.detailType ? (
                        <div className="flex items-center gap-1">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            row.detailType === '本体'
                              ? 'bg-[#EBF5EE] text-[#4A4A4A]'
                              : row.detailType === '明細'
                                ? 'bg-[#FDF1E5] text-[#4A4A4A]'
                                : 'bg-[#FAFAFA] text-[#4A4A4A]'
                          }`}>
                            {row.detailType}
                          </span>
                          {/* 子行: インライン解除ボタン */}
                          {isChild && (
                            <button
                              onClick={() => handleUnlinkSingle(row.id)}
                              aria-label={`${row.item}の紐付けを解除`}
                              className="w-[18px] h-[18px] p-0 border border-[#E1E1E1] rounded bg-[#FAFAFA] text-[#8A8A8A] text-[11px] leading-4 cursor-pointer inline-flex items-center justify-center shrink-0"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-[#E1E1E1] text-[11px]">ー</span>
                      )
                    )}
                  </td>
                  {/* ⑥ 個体管理品目 */}
                  <td style={getFreeInputCellStyle('item', editingRow === row.id && editingData ? editingData.item : row.item, row.masterId, { padding: '8px', borderBottom: '1px solid #E1E1E1', whiteSpace: 'nowrap' })}>
                    {editingRow === row.id && editingData ? (
                      <input
                        type="text"
                        value={editingData.item || ''}
                        onChange={(e) => setEditingData({ ...editingData, item: e.target.value })}
                        className="w-full p-1 border border-[#E1E1E1] rounded"
                      />
                    ) : row.item}
                  </td>
                  {/* ⑦ メーカー */}
                  <td style={getFreeInputCellStyle('manufacturer', editingRow === row.id && editingData ? editingData.manufacturer : row.manufacturer, row.masterId, { padding: '8px', borderBottom: '1px solid #E1E1E1', whiteSpace: 'nowrap' })}>
                    {editingRow === row.id && editingData ? (
                      <input
                        type="text"
                        value={editingData.manufacturer || ''}
                        onChange={(e) => setEditingData({ ...editingData, manufacturer: e.target.value })}
                        className="w-full p-1 border border-[#E1E1E1] rounded"
                      />
                    ) : row.manufacturer}
                  </td>
                  {/* ⑧ 型式 */}
                  <td style={getFreeInputCellStyle('model', editingRow === row.id && editingData ? editingData.model : row.model, row.masterId, { padding: '8px', borderBottom: '1px solid #E1E1E1', whiteSpace: 'nowrap' })}>
                    {editingRow === row.id && editingData ? (
                      <input
                        type="text"
                        value={editingData.model || ''}
                        onChange={(e) => setEditingData({ ...editingData, model: e.target.value })}
                        className="w-full p-1 border border-[#E1E1E1] rounded"
                      />
                    ) : row.model}
                  </td>
                  {/* ⑩ W */}
                  <td className="px-2 py-2 border border-[#E1E1E1] whitespace-nowrap text-[#4A4A4A]">
                    {editingRow === row.id && editingData ? (
                      <input
                        type="text"
                        value={editingData.width || ''}
                        onChange={(e) => setEditingData({ ...editingData, width: e.target.value })}
                        className="w-full p-1 border border-[#E1E1E1] rounded"
                      />
                    ) : row.width}
                  </td>
                  {/* ⑩ D */}
                  <td className="px-2 py-2 border border-[#E1E1E1] whitespace-nowrap text-[#4A4A4A]">
                    {editingRow === row.id && editingData ? (
                      <input
                        type="text"
                        value={editingData.depth || ''}
                        onChange={(e) => setEditingData({ ...editingData, depth: e.target.value })}
                        className="w-full p-1 border border-[#E1E1E1] rounded"
                      />
                    ) : row.depth}
                  </td>
                  {/* ⑩ H */}
                  <td className="px-2 py-2 border border-[#E1E1E1] whitespace-nowrap text-[#4A4A4A]">
                    {editingRow === row.id && editingData ? (
                      <input
                        type="text"
                        value={editingData.height || ''}
                        onChange={(e) => setEditingData({ ...editingData, height: e.target.value })}
                        className="w-full p-1 border border-[#E1E1E1] rounded"
                      />
                    ) : row.height}
                  </td>
                  {/* ⑪ 資産番号 */}
                  <td className="px-2 py-2 border border-[#E1E1E1] whitespace-nowrap text-[#4A4A4A]">
                    {editingRow === row.id && editingData ? (
                      <input
                        type="text"
                        value={editingData.assetNo || ''}
                        onChange={(e) => setEditingData({ ...editingData, assetNo: e.target.value })}
                        className="w-full p-1 border border-[#E1E1E1] rounded"
                      />
                    ) : row.assetNo}
                  </td>
                  {/* ⑫ ME番号 */}
                  <td className="px-2 py-2 border border-[#E1E1E1] whitespace-nowrap text-[#4A4A4A]">
                    {editingRow === row.id && editingData ? (
                      <input
                        type="text"
                        value={editingData.equipmentNo || ''}
                        onChange={(e) => setEditingData({ ...editingData, equipmentNo: e.target.value })}
                        className="w-full p-1 border border-[#E1E1E1] rounded"
                      />
                    ) : row.equipmentNo}
                  </td>
                  {/* ⑬ シリアルNo */}
                  <td className="px-2 py-2 border border-[#E1E1E1] whitespace-nowrap text-[#4A4A4A]">
                    {editingRow === row.id && editingData ? (
                      <input
                        type="text"
                        value={editingData.serialNo || ''}
                        onChange={(e) => setEditingData({ ...editingData, serialNo: e.target.value })}
                        className="w-full p-1 border border-[#E1E1E1] rounded"
                      />
                    ) : row.serialNo}
                  </td>
                  {/* ⑭ 購入年月日 */}
                  <td className="px-2 py-2 border border-[#E1E1E1] whitespace-nowrap text-[#4A4A4A]">
                    {editingRow === row.id && editingData ? (
                      <input
                        type="date"
                        value={editingData.purchaseDate || ''}
                        onChange={(e) => setEditingData({ ...editingData, purchaseDate: e.target.value })}
                        className="w-full p-1 border border-[#E1E1E1] rounded"
                      />
                    ) : row.purchaseDate}
                  </td>
                  {/* ⑭ 備考 */}
                  <td className="px-2 py-2 border border-[#E1E1E1] whitespace-nowrap text-[#4A4A4A]">
                    {editingRow === row.id && editingData ? (
                      <input
                        type="text"
                        value={editingData.remarks || ''}
                        onChange={(e) => setEditingData({ ...editingData, remarks: e.target.value })}
                        className="w-full p-1 border border-[#E1E1E1] rounded"
                      />
                    ) : row.remarks}
                  </td>
                  {/* ⑮ リース・借用 */}
                  <td className="px-2 py-2 border border-[#E1E1E1] whitespace-nowrap text-[#4A4A4A]">
                    {editingRow === row.id && editingData ? (
                      <select
                        value={editingData.lease}
                        onChange={(e) => setEditingData({ ...editingData, lease: e.target.value })}
                        className="w-full p-1 border border-[#E1E1E1] rounded"
                      >
                        <option value="あり">あり</option>
                        <option value="なし">なし</option>
                      </select>
                    ) : row.lease}
                  </td>
                  {/* ⑯ 調査日付 */}
                  <td className="px-2 py-2 border border-[#E1E1E1] whitespace-nowrap text-[#4A4A4A]">{row.surveyDate}</td>
                  {/* ⑰ 担当者 */}
                  <td className="px-2 py-2 border border-[#E1E1E1] whitespace-nowrap text-[#4A4A4A]">{row.surveyor}</td>
                  {/* 写真 */}
                  <td className="px-2 py-2 border border-[#E1E1E1] whitespace-nowrap">
                    <button
                      onClick={() => handlePhotoClick(row)}
                      className="px-2 py-1 text-xs bg-[#EBF5EE] text-[#4A4A4A] border-none rounded cursor-pointer"
                    >
                      {row.photoCount}枚
                    </button>
                  </td>
                  <td
                    className="px-2 py-2 border border-[#E1E1E1] whitespace-nowrap sticky right-[48px] z-[1] shadow-[-2px_0_4px_rgba(0,0,0,0.06)]"
                    style={{ backgroundColor: rowBgColor }}
                  >
                    <div className="flex gap-1 flex-wrap">
                      {editingRow === row.id ? (
                        <>
                          <button
                            onClick={handleOpenAssetMaster}
                            className="px-2 py-1 text-xs bg-[#008C1D] text-white border-none rounded cursor-pointer whitespace-nowrap"
                          >
                            資産マスタを別ウィンドウで開く
                          </button>
                          <button
                            onClick={handleSave}
                            className="px-2 py-1 text-xs bg-[#EBF5EE] text-[#4A4A4A] border-none rounded cursor-pointer"
                          >
                            保存
                          </button>
                          <button
                            onClick={handleCancel}
                            className="px-2 py-1 text-xs bg-[#FDF1E5] text-[#4A4A4A] border-none rounded cursor-pointer"
                          >
                            キャンセル
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(row.id)}
                            className="px-2 py-1 text-xs bg-[#EBF5EE] text-[#4A4A4A] border-none rounded cursor-pointer"
                          >
                            編集
                          </button>
                          <button
                            onClick={() => handleConfirm(row.id)}
                            disabled={!row.masterId}
                            className={`px-2 py-1 text-xs border-none rounded ${
                              row.masterId
                                ? 'bg-[#008C1D] text-white cursor-pointer opacity-100'
                                : 'bg-[#FAFAFA] text-[#8A8A8A] cursor-not-allowed opacity-50'
                            }`}
                          >
                            確定
                          </button>
                          {/* 紐付け操作ボタン (Figma 133:6095 準拠) */}
                          {!isChild && (
                            <button
                              onClick={() => handleSetParent(row.id)}
                              className={`px-2 py-1 text-xs rounded cursor-pointer font-medium whitespace-nowrap ${
                                row.detailType === '本体'
                                  ? 'bg-white text-[#146E2E] border border-[#146E2E]'
                                  : 'bg-white text-[#146E2E] border border-[#146E2E]'
                              }`}
                            >
                              {row.detailType === '本体' ? '明細を追加' : '本体に設定'}
                            </button>
                          )}
                          {/* 子行: 親レコードへの参照 */}
                          {isChild && parentRow && (
                            <span className="text-[11px] text-[#4A4A4A] whitespace-nowrap bg-[#EBF5EE] px-1.5 py-0.5 rounded">
                              親: {parentRow.sealNo}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                  {/* チェックボックス */}
                  <td
                    className="px-2 py-2 border border-[#E1E1E1] text-center sticky right-0 z-[1] w-12 min-w-[48px]"
                    style={{ backgroundColor: rowBgColor }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedRows.has(row.id)}
                      onChange={() => toggleRowSelection(row.id)}
                      disabled={isLinkingTarget}
                    />
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E1E1E1] px-6 py-4 flex justify-center gap-4">
        <button
          onClick={handleBulkConfirm}
          className="px-8 py-3 bg-[#008C1D] text-white border-none rounded-lg cursor-pointer text-base font-semibold hover:bg-[#008C1D]"
        >
          一括確定
        </button>
      </footer>

      {/* Photo Modal */}
      {isPhotoModalOpen && selectedRowForPhoto && (
        <div
          className="fixed bg-white rounded-xl w-[600px] max-h-[80vh] shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex flex-col z-[1000]"
          style={{ top: modalPosition.y, left: modalPosition.x }}
        >
          <div
            onMouseDown={handleMouseDown}
            className={`flex justify-between items-center px-6 py-4 border-b border-[#E1E1E1] select-none bg-[#FAFAFA] rounded-t-xl ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          >
            <h2 className="m-0 text-lg font-bold text-[#4A4A4A]">📷 写真一覧</h2>
            <button
              onClick={handlePhotoModalClose}
              onMouseDown={(e) => e.stopPropagation()}
              className="px-3 py-1.5 bg-white border border-[#E1E1E1] rounded cursor-pointer text-sm text-[#8A8A8A]"
            >
              ✕
            </button>
          </div>

          <div className="p-5 overflow-auto flex-1">

            <div className="grid grid-cols-2 gap-3">
              {selectedRowForPhoto.photos.map((photo) => (
                <div
                  key={photo.id}
                  className={`rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${
                    selectedPhoto === photo.id
                      ? 'border-[3px] border-[#4A4A4A]'
                      : 'border border-[#E1E1E1]'
                  }`}
                  onClick={() => setSelectedPhoto(selectedPhoto === photo.id ? null : photo.id)}
                >
                  <img
                    src={photo.url}
                    alt={photo.filename}
                    className="w-full h-[120px] object-cover"
                  />
                  <div className="p-2">
                    <div className="text-xs font-bold mb-1 text-[#4A4A4A]">{photo.filename}</div>
                    {selectedPhoto === photo.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`「${photo.filename}」を削除しますか?`)) {
                            handlePhotoDelete(photo.id);
                          }
                        }}
                        className="w-full px-2 py-1 bg-red-600 text-white border-none rounded cursor-pointer text-xs"
                      >
                        削除
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {selectedPhoto && (
              <div className="mt-5">
                <h3 className="text-base font-bold mb-3 text-[#4A4A4A]">拡大表示</h3>
                <img
                  src={selectedRowForPhoto.photos.find(p => p.id === selectedPhoto)?.url}
                  alt="拡大写真"
                  className="w-full max-h-[300px] object-contain border border-[#E1E1E1] rounded-lg"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
