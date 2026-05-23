'use client';

import { useState, useEffect, useMemo } from 'react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useAssetStore, useInspectionStore } from '@/lib/stores';
import {
  InspectionMenuFormData,
  InspectionMenuType,
  DailyInspectionTiming,
  EvaluationType,
  InspectionItem,
  InspectionMenu,
} from '@/lib/types';

interface InspectionMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  editMenu?: InspectionMenu;
}

interface InspectionItemFormData {
  order: number;
  itemName: string;
  content: string;
  inputType: '選択' | 'フリー入力';
  evaluationType: EvaluationType;
  unitValue?: string;
  unitCustom?: string;
  freeValue?: string;
  selectOptions?: string[];
}

export function InspectionMenuModal({
  isOpen,
  onClose,
  editMenu,
}: InspectionMenuModalProps) {
  const { assets } = useAssetStore();
  const { addMenu, updateMenu, menus } = useInspectionStore();

  // assetsからユニークな値を抽出
  const largeClasses = useMemo(() => [...new Set(assets.map((a) => a.largeClass))], [assets]);
  const allMediumClasses = useMemo(() => [...new Set(assets.map((a) => a.mediumClass))], [assets]);
  const allItems = useMemo(() => [...new Set(assets.map((a) => a.item))], [assets]);

  // 子から親を逆引きするマップ
  const mediumToLarge = useMemo(() => {
    const map: Record<string, string> = {};
    assets.forEach((a) => {
      if (!map[a.mediumClass]) {
        map[a.mediumClass] = a.largeClass;
      }
    });
    return map;
  }, [assets]);

  const itemToMedium = useMemo(() => {
    const map: Record<string, string> = {};
    assets.forEach((a) => {
      if (!map[a.item]) {
        map[a.item] = a.mediumClass;
      }
    });
    return map;
  }, [assets]);

  // 中分類選択時に大分類を自動セット
  const handleMediumClassChange = (mediumClass: string) => {
    const largeClass = mediumToLarge[mediumClass] || '';
    setFormData((prev) => ({ ...prev, mediumClass, largeClass }));
  };

  // 品目選択時に中分類・大分類を自動セット
  const handleItemChange = (item: string) => {
    const mediumClass = itemToMedium[item] || '';
    const largeClass = mediumToLarge[mediumClass] || '';
    setFormData((prev) => ({ ...prev, item, mediumClass, largeClass }));
  };

  // フォーム状態
  const [formData, setFormData] = useState<InspectionMenuFormData>({
    name: '',
    largeClass: '',
    mediumClass: '',
    item: '',
    menuType: '定期点検',
    cycleMonths: 3,
    dailyTiming: undefined,
    inspectionItems: [],
  });

  // 点検種別タブ
  const [selectedMenuType, setSelectedMenuType] = useState<'定期点検' | '日常点検'>('日常点検');
  const [selectedDailyTiming, setSelectedDailyTiming] = useState<DailyInspectionTiming>('使用前');

  // 新規項目入力用
  const [newItem, setNewItem] = useState<InspectionItemFormData>({
    order: 1,
    itemName: '',
    content: '',
    inputType: 'フリー入力',
    evaluationType: '合否',
  });

  // 点検項目の編集インデックス（-1 = 新規追加モード）
  const [editingItemIndex, setEditingItemIndex] = useState<number>(-1);

  // 選択中の既存メニューID（null = 新規作成モード）
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null);

  // 既存メニュー名のリスト
  const existingMenuNames = useMemo(() => menus.map((m) => m.name), [menus]);

  // 既存メニューを選択
  const handleSelectExistingMenu = (menuName: string) => {
    const menu = menus.find((m) => m.name === menuName);
    if (menu) {
      setSelectedMenuId(menu.id);
      setFormData({
        name: menu.name,
        largeClass: menu.largeClass,
        mediumClass: menu.mediumClass,
        item: menu.item,
        menuType: menu.menuType,
        cycleMonths: menu.cycleMonths,
        dailyTiming: menu.dailyTiming,
        inspectionItems: menu.inspectionItems.map(({ id, ...rest }) => rest),
      });
      setSelectedMenuType(menu.menuType);
      if (menu.dailyTiming) {
        setSelectedDailyTiming(menu.dailyTiming);
      }
      resetNewItemForm();
    }
  };

  // 新規作成モードに切り替え
  const handleNewMenu = () => {
    setSelectedMenuId(null);
    setFormData({
      name: '',
      largeClass: '',
      mediumClass: '',
      item: '',
      menuType: '日常点検',
      cycleMonths: 3,
      dailyTiming: '使用前',
      inspectionItems: [],
    });
    setSelectedMenuType('日常点検');
    setSelectedDailyTiming('使用前');
    resetNewItemForm();
  };

  // 編集モード時の初期化
  useEffect(() => {
    if (editMenu) {
      setSelectedMenuId(editMenu.id);
      setFormData({
        name: editMenu.name,
        largeClass: editMenu.largeClass,
        mediumClass: editMenu.mediumClass,
        item: editMenu.item,
        menuType: editMenu.menuType,
        cycleMonths: editMenu.cycleMonths,
        dailyTiming: editMenu.dailyTiming,
        inspectionItems: editMenu.inspectionItems.map(({ id, ...rest }) => rest),
      });
      setSelectedMenuType(editMenu.menuType);
      if (editMenu.dailyTiming) {
        setSelectedDailyTiming(editMenu.dailyTiming);
      }
    } else {
      setSelectedMenuId(null);
      setFormData({
        name: '',
        largeClass: '',
        mediumClass: '',
        item: '',
        menuType: '日常点検',
        cycleMonths: 3,
        dailyTiming: '使用前',
        inspectionItems: [],
      });
      setSelectedMenuType('日常点検');
      setSelectedDailyTiming('使用前');
    }
  }, [editMenu, isOpen]);

  // menuType更新
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      menuType: selectedMenuType,
      dailyTiming: selectedMenuType === '日常点検' ? selectedDailyTiming : undefined,
    }));
  }, [selectedMenuType, selectedDailyTiming]);

  const resetNewItemForm = () => {
    setNewItem({
      order: formData.inspectionItems.length + 1,
      itemName: '',
      content: '',
      inputType: 'フリー入力',
      evaluationType: '合否',
      unitValue: undefined,
      unitCustom: undefined,
      freeValue: undefined,
    });
    setEditingItemIndex(-1);
  };

  const handleAddOrUpdateItem = () => {
    if (!newItem.itemName || !newItem.content) return;

    // 単位の値を決定（プルダウン選択 or カスタム入力）
    let unitValue: string | undefined;
    if (newItem.evaluationType === '単位') {
      if (newItem.unitValue === 'その他' && newItem.unitCustom) {
        unitValue = newItem.unitCustom;
      } else {
        unitValue = newItem.unitValue;
      }
    }

    const itemData: Omit<InspectionItem, 'id'> = {
      order: editingItemIndex >= 0 ? editingItemIndex + 1 : formData.inspectionItems.length + 1,
      itemName: newItem.itemName,
      content: newItem.content,
      inputType: newItem.inputType,
      evaluationType: newItem.evaluationType,
      unitValue: newItem.evaluationType === '単位' ? unitValue : undefined,
      freeValue: newItem.evaluationType === 'フリー入力' ? newItem.freeValue : undefined,
      selectOptions: newItem.inputType === '選択' ? newItem.selectOptions : undefined,
    };

    if (editingItemIndex >= 0) {
      // 更新モード
      setFormData((prev) => ({
        ...prev,
        inspectionItems: prev.inspectionItems.map((item, i) =>
          i === editingItemIndex ? { ...item, ...itemData } : item
        ),
      }));
    } else {
      // 追加モード
      setFormData((prev) => ({
        ...prev,
        inspectionItems: [...prev.inspectionItems, itemData],
      }));
    }

    resetNewItemForm();
  };

  const handleEditItem = (index: number) => {
    const item = formData.inspectionItems[index];
    setNewItem({
      order: item.order,
      itemName: item.itemName,
      content: item.content,
      inputType: item.inputType,
      evaluationType: item.evaluationType,
      unitValue: item.unitValue,
      unitCustom: undefined,
      freeValue: item.freeValue,
    });
    setEditingItemIndex(index);
  };

  const handleCancelEdit = () => {
    resetNewItemForm();
  };

  const handleRemoveItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      inspectionItems: prev.inspectionItems
        .filter((_, i) => i !== index)
        .map((item, i) => ({ ...item, order: i + 1 })),
    }));
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...formData.inspectionItems];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    newItems.forEach((item, i) => {
      item.order = i + 1;
    });

    setFormData((prev) => ({ ...prev, inspectionItems: newItems }));
  };

  const handleSubmit = () => {
    if (!formData.largeClass || !formData.mediumClass || !formData.item) {
      alert('対象機器を選択してください');
      return;
    }

    if (formData.inspectionItems.length === 0) {
      alert('点検項目を1つ以上追加してください');
      return;
    }

    // 既存メニューの更新または新規作成
    const menuToUpdate = selectedMenuId ? menus.find((m) => m.id === selectedMenuId) : null;

    if (menuToUpdate) {
      updateMenu(menuToUpdate.id, {
        ...formData,
        inspectionItems: formData.inspectionItems.map((item, index) => ({
          ...item,
          id: menuToUpdate.inspectionItems[index]?.id || `ITEM_${Date.now()}_${index}`,
        })),
      });
    } else {
      addMenu(formData);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* ヘッダー */}
        <div style={styles.header}>
          <div style={styles.titleRow}>
            <h2 style={styles.title}>点検メニュー登録</h2>
          </div>
          <button style={styles.closeButton} onClick={onClose} aria-label="閉じる">
            ×
          </button>
        </div>

        {/* コンテンツ */}
        <div style={styles.content}>
          {/* モード選択（最上部） */}
          <div style={styles.section}>
            <div style={styles.modeSelection}>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="editMode"
                  checked={selectedMenuId === null}
                  onChange={handleNewMenu}
                  style={styles.radioInput}
                />
                <span>新規作成</span>
              </label>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="editMode"
                  checked={selectedMenuId !== null}
                  onChange={() => {
                    if (menus.length > 0 && selectedMenuId === null) {
                      handleSelectExistingMenu(menus[0].name);
                    }
                  }}
                  style={styles.radioInput}
                  disabled={menus.length === 0}
                />
                <span style={menus.length === 0 ? { color: '#E1E1E1' } : {}}>
                  既存プラン編集 {menus.length === 0 && '（プランなし）'}
                </span>
              </label>
            </div>

            {/* 既存プラン編集モードの場合 */}
            {selectedMenuId !== null && (
              <div style={styles.existingPlanSelect}>
                <label style={styles.label}>検索するプランを選択</label>
                <select
                  style={styles.selectFull}
                  value={formData.name}
                  onChange={(e) => handleSelectExistingMenu(e.target.value)}
                >
                  {menus.map((menu) => (
                    <option key={menu.id} value={menu.name}>
                      {menu.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 対象機器 */}
          <div style={styles.section}>
            <div style={styles.topRow}>
              <div style={styles.targetSection}>
                <div style={styles.targetField}>
                  <label style={styles.label}>大分類</label>
                  <SearchableSelect
                    value={formData.largeClass}
                    onChange={(v) => setFormData((prev) => ({ ...prev, largeClass: v }))}
                    options={largeClasses}
                    placeholder="選択"
                  />
                </div>
                <div style={styles.targetField}>
                  <label style={styles.label}>中分類</label>
                  <SearchableSelect
                    value={formData.mediumClass}
                    onChange={handleMediumClassChange}
                    options={allMediumClasses}
                    placeholder="選択"
                  />
                </div>
                <div style={styles.targetField}>
                  <label style={styles.label}>品目</label>
                  <SearchableSelect
                    value={formData.item}
                    onChange={handleItemChange}
                    options={allItems}
                    placeholder="選択"
                  />
                </div>
              </div>
            </div>
            <p style={styles.hintSmall}>
              点検項目を作成、編集する医療機器を選択してください（点検対象の医療機器のみ選択が可能です）
            </p>
          </div>

          {/* 点検プラン名称 + 種別タブ */}
          <div style={styles.section}>
            <div style={styles.planRow}>
              <div style={styles.planNameSection}>
                <label style={styles.label}>点検プラン名称</label>
                <input
                  type="text"
                  style={styles.input}
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="点検プラン名称を入力"
                  readOnly={selectedMenuId !== null}
                />
              </div>
              <div style={styles.typeTabSection}>
                <label style={styles.label}>点検区分設定</label>
                <div style={styles.radioGroup}>
                  <label style={styles.radioLabel}>
                    <input
                      type="radio"
                      name="menuType"
                      value="定期点検"
                      checked={selectedMenuType === '定期点検'}
                      onChange={() => setSelectedMenuType('定期点検')}
                      style={styles.radioInput}
                    />
                    <span>定期点検</span>
                  </label>
                  {selectedMenuType === '定期点検' && (
                    <div style={styles.cycleInputInline}>
                      <input
                        type="number"
                        style={styles.cycleNumberSmall}
                        value={formData.cycleMonths || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, cycleMonths: parseInt(e.target.value) || 1 }))}
                        min={1}
                      />
                      <span style={styles.cycleUnitSmall}>ヶ月ごと</span>
                    </div>
                  )}
                  <label style={styles.radioLabel}>
                    <input
                      type="radio"
                      name="menuType"
                      value="日常点検"
                      checked={selectedMenuType === '日常点検'}
                      onChange={() => setSelectedMenuType('日常点検')}
                      style={styles.radioInput}
                    />
                    <span>日常点検</span>
                  </label>
                </div>
                {selectedMenuType === '日常点検' && (
                  <div style={styles.timingGroup}>
                    <label style={styles.radioLabel}>
                      <input
                        type="radio"
                        name="dailyTiming"
                        value="使用前"
                        checked={selectedDailyTiming === '使用前'}
                        onChange={() => setSelectedDailyTiming('使用前')}
                        style={styles.radioInput}
                      />
                      <span>使用前</span>
                    </label>
                    <label style={styles.radioLabel}>
                      <input
                        type="radio"
                        name="dailyTiming"
                        value="使用中"
                        checked={selectedDailyTiming === '使用中'}
                        onChange={() => setSelectedDailyTiming('使用中')}
                        style={styles.radioInput}
                      />
                      <span>使用中</span>
                    </label>
                    <label style={styles.radioLabel}>
                      <input
                        type="radio"
                        name="dailyTiming"
                        value="使用後"
                        checked={selectedDailyTiming === '使用後'}
                        onChange={() => setSelectedDailyTiming('使用後')}
                        style={styles.radioInput}
                      />
                      <span>使用後</span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 新たな点検項目 */}
          <div style={{
            ...styles.section,
            ...(editingItemIndex >= 0 ? { border: '2px solid #008C1D', backgroundColor: '#FAFAFA' } : {})
          }}>
            <h3 style={styles.sectionTitle}>
              {editingItemIndex >= 0 ? `点検項目の編集（${editingItemIndex + 1}行目）` : '新たな点検項目'}
            </h3>
            <div style={styles.newItemRow}>
              <div style={styles.newItemField}>
                <label style={styles.labelSmall}>項目</label>
                <input
                  type="text"
                  style={styles.inputSmall}
                  value={newItem.itemName}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, itemName: e.target.value }))}
                  placeholder="選択orフリー入力"
                />
              </div>
              <div style={styles.newItemField}>
                <label style={styles.labelSmall}>点検内容</label>
                <input
                  type="text"
                  style={styles.inputSmall}
                  value={newItem.content}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder="フリー入力"
                />
              </div>
              <div style={styles.evaluationSection}>
                <label style={styles.labelSmall}>評価</label>
                <div style={styles.evaluationInputs}>
                  <select
                    style={styles.evalSelect}
                    value={newItem.evaluationType}
                    onChange={(e) => setNewItem((prev) => ({
                      ...prev,
                      evaluationType: e.target.value as EvaluationType,
                      unitValue: undefined,
                      unitCustom: undefined,
                      freeValue: undefined,
                    }))}
                  >
                    <option value="合否">合・否</option>
                    <option value="単位">単位</option>
                    <option value="フリー入力">フリー入力</option>
                  </select>
                  {newItem.evaluationType === '単位' && (
                    <>
                      <select
                        style={styles.evalSelect}
                        value={newItem.unitValue || ''}
                        onChange={(e) => setNewItem((prev) => ({ ...prev, unitValue: e.target.value }))}
                      >
                        <option value="">選択</option>
                        <option value="℃">℃</option>
                        <option value="%">%</option>
                        <option value="個">個</option>
                        <option value="その他">その他</option>
                      </select>
                      {newItem.unitValue === 'その他' && (
                        <input
                          type="text"
                          style={styles.evalInput}
                          value={newItem.unitCustom || ''}
                          onChange={(e) => setNewItem((prev) => ({ ...prev, unitCustom: e.target.value }))}
                          placeholder="単位を入力"
                        />
                      )}
                    </>
                  )}
                  {newItem.evaluationType === 'フリー入力' && (
                    <input
                      type="text"
                      style={styles.evalInput}
                      value={newItem.freeValue || ''}
                      onChange={(e) => setNewItem((prev) => ({ ...prev, freeValue: e.target.value }))}
                      placeholder="評価内容を入力"
                    />
                  )}
                </div>
              </div>
              <div style={styles.newItemFieldNarrow}>
                <label style={styles.labelSmall}>操作</label>
                <div style={styles.formActions}>
                  <button style={styles.addButton} onClick={handleAddOrUpdateItem}>
                    {editingItemIndex >= 0 ? '更新' : '登録'}
                  </button>
                  {editingItemIndex >= 0 && (
                    <button style={styles.cancelEditButton} onClick={handleCancelEdit}>
                      キャンセル
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 点検項目の編集 */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>点検項目の編集</h3>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>項目</th>
                  <th style={styles.th}>点検内容</th>
                  <th style={styles.th}>評価</th>
                  <th style={styles.th}>操作</th>
                </tr>
              </thead>
              <tbody>
                {formData.inspectionItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ ...styles.td, textAlign: 'center', color: '#8A8A8A', padding: '20px' }}>
                      点検項目がありません
                    </td>
                  </tr>
                ) : (
                  formData.inspectionItems.map((item, index) => (
                    <tr key={index}>
                      <td style={styles.td}>{item.itemName}</td>
                      <td style={styles.td}>{item.content}</td>
                      <td style={styles.td}>
                        {item.evaluationType === '合否'
                          ? '合・否'
                          : item.evaluationType === '単位'
                            ? `単位: ${item.unitValue || '-'}`
                            : item.freeValue || 'フリー'}
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actionButtons}>
                          <button
                            style={{
                              ...styles.editButton,
                              ...(editingItemIndex === index ? { backgroundColor: '#4A4A4A' } : {})
                            }}
                            onClick={() => handleEditItem(index)}
                            aria-label="編集"
                          >
                            {editingItemIndex === index ? '編集中' : '編集'}
                          </button>
                          <div style={styles.orderButtons}>
                            <button
                              style={styles.orderButton}
                              onClick={() => handleMoveItem(index, 'up')}
                              disabled={index === 0}
                              aria-label="上へ"
                            >
                              ▲
                            </button>
                            <button
                              style={styles.orderButton}
                              onClick={() => handleMoveItem(index, 'down')}
                              disabled={index === formData.inspectionItems.length - 1}
                              aria-label="下へ"
                            >
                              ▼
                            </button>
                          </div>
                          <button
                            style={styles.deleteButton}
                            onClick={() => handleRemoveItem(index)}
                          >
                            削除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <p style={styles.hintSmall}>※選択項目のみ作成</p>
          </div>
        </div>

        {/* フッター */}
        <div style={styles.footer}>
          <button style={styles.cancelButton} onClick={onClose}>
            キャンセル
          </button>
          <button style={styles.submitButton} onClick={handleSubmit}>
            {selectedMenuId === null ? '点検メニュー登録' : '点検メニュー更新'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#FAFAFA',
    borderRadius: '8px',
    width: '95%',
    maxWidth: '900px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
    border: '1px solid #E1E1E1',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 20px',
    borderBottom: '1px solid #E1E1E1',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  title: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 600,
    color: '#4A4A4A',
  },
  modeBadgeNew: {
    backgroundColor: '#008C1D',
    color: 'white',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 500,
  },
  modeBadgeEdit: {
    backgroundColor: '#4E9440',
    color: 'white',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 500,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#8A8A8A',
    padding: '4px 8px',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 20px',
  },
  topRow: {
    display: 'flex',
    gap: '24px',
    alignItems: 'flex-end',
    marginBottom: '8px',
  },
  targetSection: {
    display: 'flex',
    gap: '12px',
    flex: 1,
  },
  targetField: {
    flex: 1,
    minWidth: '120px',
  },
  hint: {
    fontSize: '12px',
    color: '#8A8A8A',
    margin: '0 0 16px 0',
  },
  hintSmall: {
    fontSize: '11px',
    color: '#8A8A8A',
    margin: '4px 0 0 0',
  },
  planRow: {
    display: 'flex',
    gap: '24px',
    marginBottom: '16px',
  },
  planNameSection: {
    flex: 2,
    minWidth: '300px',
  },
  planNameInput: {
    display: 'flex',
    gap: '8px',
  },
  input: {
    flex: 1,
    minWidth: '280px',
    padding: '8px 12px',
    border: '1px solid #E1E1E1',
    borderRadius: '4px',
    fontSize: '14px',
  },
  newButton: {
    backgroundColor: '#008C1D',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 16px',
    fontSize: '13px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  modeSelection: {
    display: 'flex',
    gap: '24px',
    marginBottom: '16px',
    padding: '12px 16px',
    backgroundColor: '#FAFAFA',
    borderRadius: '6px',
    border: '1px solid #E1E1E1',
  },
  existingPlanSelect: {
    marginTop: '12px',
    maxWidth: '400px',
  },
  selectFull: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #E1E1E1',
    borderRadius: '4px',
    fontSize: '14px',
    backgroundColor: 'white',
  },
  typeTabSection: {
    display: 'flex',
    flexDirection: 'column',
  },
  radioGroup: {
    display: 'flex',
    gap: '16px',
    marginBottom: '8px',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: '#4A4A4A',
    cursor: 'pointer',
  },
  radioInput: {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
    accentColor: '#008C1D',
  },
  cycleInputInline: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginLeft: '8px',
    paddingLeft: '8px',
    borderLeft: '1px solid #E1E1E1',
  },
  cycleNumberSmall: {
    width: '50px',
    padding: '4px 8px',
    border: '1px solid #E1E1E1',
    borderRadius: '4px',
    fontSize: '13px',
    textAlign: 'center',
  },
  cycleUnitSmall: {
    fontSize: '13px',
    color: '#4A4A4A',
  },
  timingGroup: {
    display: 'flex',
    gap: '16px',
    marginLeft: '24px',
    paddingLeft: '16px',
    borderLeft: '2px solid #E1E1E1',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: 500,
    color: '#4A4A4A',
    marginBottom: '4px',
  },
  labelSmall: {
    display: 'block',
    fontSize: '11px',
    fontWeight: 500,
    color: '#4A4A4A',
    marginBottom: '4px',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: '6px',
    padding: '12px 16px',
    marginBottom: '12px',
  },
  sectionTitle: {
    margin: '0 0 12px 0',
    fontSize: '13px',
    fontWeight: 600,
    color: '#4A4A4A',
    paddingBottom: '8px',
    borderBottom: '1px solid #E1E1E1',
  },
  newItemRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-end',
  },
  newItemField: {
    flex: 1,
  },
  newItemFieldNarrow: {
    width: '120px',
  },
  evaluationSection: {
    flex: 1,
    minWidth: '200px',
  },
  evaluationInputs: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  evalSelect: {
    padding: '6px 10px',
    border: '1px solid #E1E1E1',
    borderRadius: '4px',
    fontSize: '13px',
    backgroundColor: 'white',
    minWidth: '80px',
  },
  evalInput: {
    padding: '6px 10px',
    border: '1px solid #E1E1E1',
    borderRadius: '4px',
    fontSize: '13px',
    width: '100px',
  },
  inputSmall: {
    width: '100%',
    padding: '6px 10px',
    border: '1px solid #E1E1E1',
    borderRadius: '4px',
    fontSize: '13px',
    boxSizing: 'border-box',
  },
  selectSmall: {
    width: '100%',
    padding: '6px 10px',
    border: '1px solid #E1E1E1',
    borderRadius: '4px',
    fontSize: '13px',
    backgroundColor: 'white',
  },
  addButton: {
    backgroundColor: '#008C1D',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '6px 12px',
    fontSize: '12px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  formActions: {
    display: 'flex',
    gap: '6px',
  },
  cancelEditButton: {
    backgroundColor: '#8A8A8A',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '6px 10px',
    fontSize: '12px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  },
  th: {
    backgroundColor: '#FAFAFA',
    padding: '8px 10px',
    textAlign: 'left',
    fontWeight: 500,
    color: '#4A4A4A',
    borderBottom: '1px solid #E1E1E1',
  },
  td: {
    padding: '8px 10px',
    borderBottom: '1px solid #E1E1E1',
    verticalAlign: 'middle',
  },
  actionButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  orderButtons: {
    display: 'flex',
    gap: '2px',
  },
  orderButton: {
    padding: '2px 6px',
    border: '1px solid #E1E1E1',
    borderRadius: '3px',
    backgroundColor: 'white',
    fontSize: '10px',
    cursor: 'pointer',
  },
  editButton: {
    backgroundColor: '#4A4A4A',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '4px 10px',
    fontSize: '12px',
    cursor: 'pointer',
  },
  deleteButton: {
    backgroundColor: '#8A8A8A',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '4px 10px',
    fontSize: '12px',
    cursor: 'pointer',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '12px 20px',
    borderTop: '1px solid #E1E1E1',
    backgroundColor: '#FAFAFA',
    borderRadius: '0 0 8px 8px',
  },
  cancelButton: {
    backgroundColor: '#8A8A8A',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 20px',
    fontSize: '13px',
    cursor: 'pointer',
  },
  submitButton: {
    backgroundColor: '#008C1D',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 20px',
    fontSize: '13px',
    cursor: 'pointer',
  },
};
