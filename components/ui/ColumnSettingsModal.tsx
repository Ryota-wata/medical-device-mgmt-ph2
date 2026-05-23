'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';

interface ColumnDef {
  key: string;
  label: string;
  width?: string;
  defaultVisible?: boolean;
  group?: string;
}

interface ColumnSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  columns: ColumnDef[];
  visibleColumns: Record<string, boolean>;
  onVisibilityChange: (key: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  /** 管理者によりロックされたカラムキー（ユーザーがONにできない） */
  lockedColumns?: Set<string>;
}

interface Bookmark {
  id: string;
  name: string;
  visibleColumns: Record<string, boolean>;
  createdAt: string;
}

const COLUMN_GROUPS = [
  // 編集リスト（リモデル申請）用グループ
  { id: 'commonMaster', label: '共通部署マスタ' },
  { id: 'newLocation', label: '(新)設置情報' },
  { id: 'contract', label: '契約情報' },
  { id: 'purchaseApplication', label: '購入申請情報' },
  { id: 'estimate', label: '見積・積算' },
  { id: 'disposalApplication', label: '廃棄申請情報' },
  { id: 'transferApplication', label: '移動申請情報' },
  // 資産情報（原本・検索結果画面用）
  { id: 'basic', label: '基本情報' },
  { id: 'location', label: '設置情報' },
  { id: 'identity', label: '識別情報' },
  { id: 'classification', label: '資産分類' },
  { id: 'specification', label: '機器仕様' },
  { id: 'acquisition', label: '取得情報' },
  { id: 'other', label: 'その他' },
  { id: 'leaseDetail', label: 'リース詳細' },
  { id: 'financial', label: '財務情報' },
  { id: 'lifespan', label: '耐用年数' },
];

export function ColumnSettingsModal({
  isOpen,
  onClose,
  columns,
  visibleColumns,
  onVisibilityChange,
  onSelectAll,
  onDeselectAll,
  lockedColumns,
}: ColumnSettingsModalProps) {
  // ドラッグ機能の状態管理
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

  // リサイズ機能の状態管理
  const [size, setSize] = useState({ width: 900, height: 600 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [resizeDirection, setResizeDirection] = useState<string>('');

  // ブックマーク機能の状態管理
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isBookmarkInputOpen, setIsBookmarkInputOpen] = useState(false);
  const [bookmarkName, setBookmarkName] = useState('');
  const [showBookmarks, setShowBookmarks] = useState(false);

  // localStorageからブックマークを読み込み
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('columnBookmarks');
      if (saved) {
        try {
          setBookmarks(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to load bookmarks:', e);
        }
      }
    }
  }, []);

  // ブックマーク保存
  const saveBookmark = () => {
    if (!bookmarkName.trim()) {
      alert('ブックマーク名を入力してください');
      return;
    }

    const newBookmark: Bookmark = {
      id: Date.now().toString(),
      name: bookmarkName.trim(),
      visibleColumns: { ...visibleColumns },
      createdAt: new Date().toISOString(),
    };

    const updatedBookmarks = [...bookmarks, newBookmark];
    setBookmarks(updatedBookmarks);
    localStorage.setItem('columnBookmarks', JSON.stringify(updatedBookmarks));
    setBookmarkName('');
    setIsBookmarkInputOpen(false);
  };

  // ブックマーク適用
  const applyBookmark = (bookmark: Bookmark) => {
    Object.keys(bookmark.visibleColumns).forEach((key) => {
      if (visibleColumns[key] !== bookmark.visibleColumns[key]) {
        onVisibilityChange(key);
      }
    });
  };

  // ブックマーク削除
  const deleteBookmark = (id: string) => {
    if (!confirm('このブックマークを削除しますか？')) return;

    const updatedBookmarks = bookmarks.filter(b => b.id !== id);
    setBookmarks(updatedBookmarks);
    localStorage.setItem('columnBookmarks', JSON.stringify(updatedBookmarks));
  };

  // モーダルが開いたときに中央に配置
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const modalWidth = modalRef.current.offsetWidth;
      const modalHeight = modalRef.current.offsetHeight;
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      setPosition({
        x: (windowWidth - modalWidth) / 2,
        y: (windowHeight - modalHeight) / 2,
      });
    }
  }, [isOpen]);

  // ドラッグ開始
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  // リサイズ開始
  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    });
  };

  // ドラッグ中
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !modalRef.current) return;

      const modalWidth = modalRef.current.offsetWidth;
      const modalHeight = modalRef.current.offsetHeight;
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      let newX = e.clientX - dragStart.x;
      let newY = e.clientY - dragStart.y;

      // 画面外に出ないように制限
      newX = Math.max(0, Math.min(newX, windowWidth - modalWidth));
      newY = Math.max(0, Math.min(newY, windowHeight - modalHeight));

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isDragging, dragStart]);

  // リサイズ中
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;

      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;
      let newX = position.x;
      let newY = position.y;

      const minWidth = 600;
      const minHeight = 400;
      const maxWidth = window.innerWidth - 100;
      const maxHeight = window.innerHeight - 100;

      if (resizeDirection.includes('e')) {
        newWidth = Math.max(minWidth, Math.min(maxWidth, resizeStart.width + deltaX));
      }
      if (resizeDirection.includes('s')) {
        newHeight = Math.max(minHeight, Math.min(maxHeight, resizeStart.height + deltaY));
      }
      if (resizeDirection.includes('w')) {
        const proposedWidth = resizeStart.width - deltaX;
        if (proposedWidth >= minWidth && proposedWidth <= maxWidth) {
          newWidth = proposedWidth;
          newX = position.x + deltaX;
        }
      }
      if (resizeDirection.includes('n')) {
        const proposedHeight = resizeStart.height - deltaY;
        if (proposedHeight >= minHeight && proposedHeight <= maxHeight) {
          newHeight = proposedHeight;
          newY = position.y + deltaY;
        }
      }

      setSize({ width: newWidth, height: newHeight });
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeDirection('');
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isResizing, resizeStart, resizeDirection, position]);

  // グループごとにカラムを分類
  const groupedColumns = useMemo(() => {
    const groups: Record<string, ColumnDef[]> = {};
    COLUMN_GROUPS.forEach(group => {
      groups[group.id] = columns.filter(col => col.group === group.id);
    });
    return groups;
  }, [columns]);

  // Hooksの後にreturn
  if (!isOpen) return null;

  // グループ全選択/全解除
  const handleGroupToggle = (groupId: string) => {
    const groupColumns = groupedColumns[groupId];
    const allSelected = groupColumns.every(col => visibleColumns[col.key]);

    groupColumns.forEach(col => {
      if (allSelected && visibleColumns[col.key]) {
        onVisibilityChange(col.key);
      } else if (!allSelected && !visibleColumns[col.key]) {
        onVisibilityChange(col.key);
      }
    });
  };

  // グループの選択状態を判定
  const getGroupStatus = (groupId: string) => {
    const groupColumns = groupedColumns[groupId];
    if (groupColumns.length === 0) return 'none';
    const selectedCount = groupColumns.filter(col => visibleColumns[col.key]).length;
    if (selectedCount === 0) return 'none';
    if (selectedCount === groupColumns.length) return 'all';
    return 'partial';
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
      }}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          top: `${position.y}px`,
          left: `${position.x}px`,
          width: `${size.width}px`,
          height: `${size.height}px`,
          background: 'white',
          borderRadius: '8px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* モーダルヘッダー（Figma準拠: light bg + dark text） */}
        <div
          onMouseDown={handleMouseDown}
          style={{
            background: '#FAFAFA',
            color: '#4A4A4A',
            padding: '14px 20px',
            fontSize: 16,
            fontWeight: 700,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            borderBottom: '1px solid #E1E1E1',
          }}
        >
          <span>表示カラム設定 <span style={{ fontSize: 13, color: '#8A8A8A', fontWeight: 500, marginLeft: 6 }}>{columns.length}カラム</span></span>
          <button
            onClick={onClose}
            onMouseDown={(e) => e.stopPropagation()}
            aria-label="閉じる"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8A8A8A',
              cursor: 'pointer',
              padding: 0,
              width: 28,
              height: 28,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 4,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F1F1')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* モーダルボディ */}
        <div style={{ padding: '24px', overflow: 'auto', flex: 1 }}>
          <div style={{ marginBottom: 16, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={onSelectAll}
              style={{
                padding: '6px 12px',
                background: '#FFFFFF',
                color: '#146E2E',
                border: '1px solid #008C1D',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#EBF5EE')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
            >
              全て選択
            </button>
            <button
              onClick={onDeselectAll}
              style={{
                padding: '6px 12px',
                background: '#FFFFFF',
                color: '#4A4A4A',
                border: '1px solid #E1E1E1',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F1F1')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
            >
              全て解除
            </button>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
              <button
                onClick={() => setIsBookmarkInputOpen(!isBookmarkInputOpen)}
                style={{
                  padding: '6px 12px',
                  background: '#FFFFFF',
                  color: '#4A4A4A',
                  border: '1px solid #E1E1E1',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F1F1')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
              >
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
                ブックマーク保存
              </button>
              <button
                onClick={() => setShowBookmarks(!showBookmarks)}
                style={{
                  padding: '6px 12px',
                  background: '#FFFFFF',
                  color: '#4A4A4A',
                  border: '1px solid #E1E1E1',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F1F1')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
              >
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
                ブックマーク一覧 <span className="tabular-nums">({bookmarks.length})</span>
              </button>
            </div>
          </div>

          {/* ブックマーク保存フォーム */}
          {isBookmarkInputOpen && (
            <div style={{
              marginBottom: 16,
              padding: 14,
              background: '#FAFAFA',
              border: '1px solid #E1E1E1',
              borderRadius: 6,
            }}>
              <div style={{ marginBottom: 10, fontSize: 13, fontWeight: 600, color: '#4A4A4A' }}>
                現在の選択状態をブックマークとして保存
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={bookmarkName}
                  onChange={(e) => setBookmarkName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && saveBookmark()}
                  placeholder="ブックマーク名を入力..."
                  style={{
                    flex: 1,
                    padding: '7px 10px',
                    border: '1px solid #E1E1E1',
                    borderRadius: 6,
                    fontSize: 13,
                  }}
                />
                <button
                  onClick={saveBookmark}
                  style={{
                    padding: '7px 14px',
                    background: '#008C1D',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#146E2E')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#008C1D')}
                >
                  保存
                </button>
                <button
                  onClick={() => {
                    setIsBookmarkInputOpen(false);
                    setBookmarkName('');
                  }}
                  style={{
                    padding: '7px 14px',
                    background: '#FFFFFF',
                    color: '#4A4A4A',
                    border: '1px solid #E1E1E1',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F1F1')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}

          {/* ブックマーク一覧 */}
          {showBookmarks && (
            <div style={{
              marginBottom: 16,
              padding: 14,
              background: '#FAFAFA',
              border: '1px solid #E1E1E1',
              borderRadius: 6,
              maxHeight: 300,
              overflow: 'auto',
            }}>
              <div style={{ marginBottom: 10, fontSize: 13, fontWeight: 600, color: '#4A4A4A' }}>
                保存済みブックマーク
              </div>
              {bookmarks.length === 0 ? (
                <div style={{ padding: 16, textAlign: 'center', color: '#8A8A8A', fontSize: 13 }}>
                  ブックマークがまだ保存されていません
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {bookmarks.map((bookmark) => {
                    const selectedCount = Object.values(bookmark.visibleColumns).filter(Boolean).length;
                    return (
                      <div
                        key={bookmark.id}
                        style={{
                          padding: 10,
                          background: '#FFFFFF',
                          borderRadius: 6,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          border: '1px solid #E1E1E1',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: '#4A4A4A', marginBottom: 2 }}>
                            {bookmark.name}
                          </div>
                          <div style={{ fontSize: 11, color: '#8A8A8A' }}>
                            {selectedCount}カラム選択 • {new Date(bookmark.createdAt).toLocaleString('ja-JP')}
                          </div>
                        </div>
                        <button
                          onClick={() => applyBookmark(bookmark)}
                          style={{
                            padding: '5px 10px',
                            background: '#008C1D',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontSize: 12,
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#146E2E')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = '#008C1D')}
                        >
                          適用
                        </button>
                        <button
                          onClick={() => deleteBookmark(bookmark.id)}
                          style={{
                            padding: '5px 10px',
                            background: '#FFFFFF',
                            color: '#DA0000',
                            border: '1px solid #E1E1E1',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontSize: 12,
                            whiteSpace: 'nowrap',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#FDF1E5'; e.currentTarget.style.borderColor = '#DA0000'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = '#E1E1E1'; }}
                        >
                          削除
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}


          {/* グループごとの表示 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {COLUMN_GROUPS.map(group => {
              const groupCols = groupedColumns[group.id];
              if (groupCols.length === 0) return null;
              const status = getGroupStatus(group.id);

              const groupBg = status === 'all' ? '#EBF5EE' : status === 'partial' ? '#FDF1E5' : '#FAFAFA';
              const groupBgHover = status === 'all' ? '#EBF5EE' : status === 'partial' ? '#FDF1E5' : '#F1F1F1';
              return (
                <div key={group.id} style={{ border: '1px solid #E1E1E1', borderRadius: 6, overflow: 'hidden' }}>
                  {/* グループヘッダー */}
                  <div
                    onClick={() => handleGroupToggle(group.id)}
                    style={{
                      background: groupBg,
                      padding: '10px 14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      borderBottom: '1px solid #E1E1E1',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = groupBgHover)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = groupBg)}
                  >
                    <input
                      type="checkbox"
                      checked={status === 'all'}
                      ref={(el) => {
                        if (el) el.indeterminate = status === 'partial';
                      }}
                      onChange={() => {}}
                      style={{ cursor: 'pointer', width: 16, height: 16, accentColor: '#008C1D' }}
                    />
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#4A4A4A' }}>
                      {group.label} <span style={{ fontSize: 12, color: '#8A8A8A', fontWeight: 500 }} className="tabular-nums">({groupCols.filter(col => visibleColumns[col.key]).length}/{groupCols.length})</span>
                    </span>
                  </div>

                  {/* グループ内のカラム */}
                  <div style={{ padding: 10, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, background: '#FFFFFF' }}>
                    {groupCols.map((col) => (
                      <label
                        key={col.key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '6px 10px',
                          background: visibleColumns[col.key] ? '#EBF5EE' : '#FFFFFF',
                          borderRadius: 4,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          border: `1px solid ${visibleColumns[col.key] ? '#008C1D' : 'transparent'}`,
                        }}
                        onMouseEnter={(e) => {
                          if (!visibleColumns[col.key]) e.currentTarget.style.background = '#FAFAFA';
                        }}
                        onMouseLeave={(e) => {
                          if (!visibleColumns[col.key]) e.currentTarget.style.background = '#FFFFFF';
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={visibleColumns[col.key]}
                          onChange={() => {
                            if (lockedColumns?.has(col.key)) return;
                            onVisibilityChange(col.key);
                          }}
                          disabled={lockedColumns?.has(col.key)}
                          style={{ cursor: lockedColumns?.has(col.key) ? 'not-allowed' : 'pointer', accentColor: '#008C1D' }}
                        />
                        <span style={{ fontSize: 12, color: lockedColumns?.has(col.key) ? '#8A8A8A' : '#4A4A4A' }}>
                          {col.label}
                          {lockedColumns?.has(col.key) && (
                            <span style={{ fontSize: 10, color: '#DA0000', marginLeft: 4 }}>管理者により非表示</span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* モーダルフッター */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid #E1E1E1',
            background: '#FAFAFA',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              background: '#FFFFFF',
              color: '#4A4A4A',
              border: '1px solid #E1E1E1',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F1F1')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
          >
            閉じる
          </button>
        </div>

        {/* リサイズハンドル */}
        {/* 上 */}
        <div
          onMouseDown={(e) => handleResizeStart(e, 'n')}
          style={{
            position: 'absolute',
            top: 0,
            left: '10px',
            right: '10px',
            height: '5px',
            cursor: 'ns-resize',
          }}
        />
        {/* 下 */}
        <div
          onMouseDown={(e) => handleResizeStart(e, 's')}
          style={{
            position: 'absolute',
            bottom: 0,
            left: '10px',
            right: '10px',
            height: '5px',
            cursor: 'ns-resize',
          }}
        />
        {/* 左 */}
        <div
          onMouseDown={(e) => handleResizeStart(e, 'w')}
          style={{
            position: 'absolute',
            top: '10px',
            bottom: '10px',
            left: 0,
            width: '5px',
            cursor: 'ew-resize',
          }}
        />
        {/* 右 */}
        <div
          onMouseDown={(e) => handleResizeStart(e, 'e')}
          style={{
            position: 'absolute',
            top: '10px',
            bottom: '10px',
            right: 0,
            width: '5px',
            cursor: 'ew-resize',
          }}
        />
        {/* 左上 */}
        <div
          onMouseDown={(e) => handleResizeStart(e, 'nw')}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '10px',
            height: '10px',
            cursor: 'nwse-resize',
          }}
        />
        {/* 右上 */}
        <div
          onMouseDown={(e) => handleResizeStart(e, 'ne')}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '10px',
            height: '10px',
            cursor: 'nesw-resize',
          }}
        />
        {/* 左下 */}
        <div
          onMouseDown={(e) => handleResizeStart(e, 'sw')}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '10px',
            height: '10px',
            cursor: 'nesw-resize',
          }}
        />
        {/* 右下 */}
        <div
          onMouseDown={(e) => handleResizeStart(e, 'se')}
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: '10px',
            height: '10px',
            cursor: 'nwse-resize',
          }}
        />
      </div>
    </div>
  );
}
