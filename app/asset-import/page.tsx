'use client';

import { useRouter } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  Pin,
  Upload,
  X,
} from 'lucide-react';
import { Header } from '@/components/layouts/Header';

type FileType = 'fixed-asset' | 'me-ledger';

interface UploadedFile {
  type: FileType;
  name: string;
  size: string;
  rows: string;
  uploadedAt: string;
}

interface MatchingProgress {
  totalRows: number;
  completedRows: number;
  pendingRows: number;
}

export default function AssetImportPage() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: string; rows: string } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFileType, setSelectedFileType] = useState<FileType>('fixed-asset');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [matchingProgress, setMatchingProgress] = useState<MatchingProgress | null>(null);

  // シミュレーション: 既存のアップロード状況を取得
  useEffect(() => {
    // 本番環境では、ここでAPIから既存のアップロード状況を取得
    const existingFiles: UploadedFile[] = [
      // {
      //   type: 'fixed-asset',
      //   name: '固定資産管理台帳_2024.xlsx',
      //   size: '2.5 MB',
      //   rows: '150 件',
      //   uploadedAt: '2024-12-03 14:30'
      // }
    ];

    const progress: MatchingProgress | null = null;
    // progress = {
    //   totalRows: 150,
    //   completedRows: 45,
    //   pendingRows: 105
    // };

    setUploadedFiles(existingFiles);
    setMatchingProgress(progress);
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const processFile = useCallback((file: File) => {
    const allowedExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      alert('対応していないファイル形式です。.xlsx, .xls, .csv のファイルをアップロードしてください。');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('ファイルサイズが大きすぎます。10MB以下のファイルをアップロードしてください。');
      return;
    }

    setSelectedFile(file);
    setFileInfo({
      name: file.name,
      size: formatFileSize(file.size),
      rows: '解析中...'
    });

    setTimeout(() => {
      setFileInfo(prev => prev ? { ...prev, rows: '150 件' } : null);
    }, 500);
  }, []);

  const handleUploadAndProceed = () => {
    if (!selectedFile || !fileInfo) {
      alert('ファイルを選択してください');
      return;
    }

    // ファイルをアップロード済みリストに追加（シミュレーション）
    const newUploadedFile: UploadedFile = {
      type: selectedFileType,
      name: fileInfo.name,
      size: fileInfo.size,
      rows: fileInfo.rows,
      uploadedAt: new Date().toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    setUploadedFiles(prev => [...prev, newUploadedFile]);
    setSelectedFile(null);
    setFileInfo(null);

    // 突き合わせ画面へ遷移
    router.push('/asset-matching');
  };

  const handleResumeMatching = () => {
    router.push('/asset-matching');
  };

  const handleRemoveUploadedFile = (index: number) => {
    if (confirm('このファイルを削除しますか？突き合わせ途中のデータも削除されます。')) {
      setUploadedFiles(prev => prev.filter((_, i) => i !== index));
      if (uploadedFiles.length === 1) {
        setMatchingProgress(null);
      }
    }
  };

  const getFileTypeLabel = (type: FileType): string => {
    return type === 'fixed-asset' ? '固定資産管理台帳' : 'その他台帳';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFileInfo(null);
  };

  const hasFixedAssetFile = uploadedFiles.some(f => f.type === 'fixed-asset');
  const hasMELedgerFile = uploadedFiles.some(f => f.type === 'me-ledger');

  return (
    <div className="min-h-dvh bg-surface-screen flex flex-col">
      <Header
        title="台帳取込"
        showBackButton={true}
        backHref="/main"
        backLabel="メイン画面に戻る"
        backButtonVariant="secondary"
        hideMenu={true}
        hideHomeButton={true}
      />

      {/* Main Content */}
      <main className="flex-1 px-5 py-5 md:px-8 md:py-8 lg:px-12 lg:py-12 w-full max-w-[1000px] mx-auto box-border">
        <div className="bg-surface-card rounded-xl p-6 md:p-8 lg:p-10 shadow-[0_2px_12px_rgba(0,0,0,0.08)]">

          {/* Matching Progress - if there's ongoing matching */}
          {matchingProgress && (
            <div className="bg-surface-select border border-cta-primary rounded-lg p-4 md:p-5 mb-6 md:mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="inline-flex items-center gap-2 text-[15px] md:text-base font-bold text-cta-primary-dark">
                  <BarChart3 className="w-4 h-4" aria-hidden />
                  突き合わせ作業が途中です
                </h3>
                <button
                  onClick={handleResumeMatching}
                  className="px-5 py-2 bg-cta-primary text-white border-none rounded-md text-[13px] md:text-sm font-semibold cursor-pointer hover:bg-cta-primary-dark transition-colors min-h-[44px]"
                >
                  作業を再開する
                </button>
              </div>
              <div className="flex flex-col gap-2 text-[13px] md:text-sm text-cta-primary-dark">
                <div>全体: {matchingProgress.totalRows} 件</div>
                <div>完了: {matchingProgress.completedRows} 件 / 未処理: {matchingProgress.pendingRows} 件</div>
                <div className="w-full h-2 bg-stroke-card rounded mt-2 overflow-hidden">
                  <div
                    className="h-full bg-cta-primary-dark transition-[width] duration-300"
                    style={{ width: `${(matchingProgress.completedRows / matchingProgress.totalRows) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Uploaded Files Status */}
          {uploadedFiles.length > 0 && (
            <div className="bg-surface-select border border-cta-primary rounded-lg p-4 md:p-5 mb-6 md:mb-8">
              <h3 className="inline-flex items-center gap-2 text-[15px] md:text-base font-bold text-cta-primary-dark mb-3">
                <Check className="w-4 h-4" aria-hidden />
                アップロード済みファイル
              </h3>
              <div className="flex flex-col gap-3">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="bg-surface-card border border-stroke-input rounded-md p-3 flex justify-between items-center">
                    <div className="flex-1">
                      <div className="text-[13px] md:text-sm font-semibold text-content-primary mb-1">
                        {getFileTypeLabel(file.type)}
                      </div>
                      <div className="text-xs md:text-[13px] text-content-sub">
                        {file.name} ({file.size} / {file.rows})
                      </div>
                      <div className="text-[11px] md:text-xs text-content-sub mt-1">
                        アップロード日時: {file.uploadedAt}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveUploadedFile(index)}
                      className="bg-content-alert text-white border-none rounded px-3 py-1.5 text-xs cursor-pointer hover:opacity-90 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                    >
                      削除
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instruction */}
          <div className="mb-6 md:mb-8">
            <h2 className="text-lg md:text-xl font-bold text-content-primary mb-3 text-balance">
              {uploadedFiles.length === 0 ? 'Excelファイルをアップロードしてください' : '追加のファイルをアップロード'}
            </h2>
            <p className="text-sm md:text-[15px] text-content-sub leading-relaxed text-pretty">
              固定資産管理台帳またはその他台帳のExcelファイル（.xlsx, .xls）またはCSVファイル（.csv）をアップロードできます。
            </p>
          </div>

          {/* File Type Selection */}
          <div className="mb-6 md:mb-8">
            <h3 className="text-[15px] md:text-base font-bold text-content-primary mb-3">
              アップロードするファイルの種類を選択
            </h3>
            <div className="flex gap-6 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer text-sm md:text-[15px] text-content-primary">
                <input
                  type="radio"
                  name="fileType"
                  value="fixed-asset"
                  checked={selectedFileType === 'fixed-asset'}
                  onChange={(e) => setSelectedFileType(e.target.value as FileType)}
                  className="cursor-pointer accent-cta-primary"
                />
                <span>固定資産管理台帳</span>
                {hasFixedAssetFile && <span className="inline-flex items-center gap-0.5 text-cta-primary text-xs"><Check className="w-3 h-3" aria-hidden />済</span>}
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm md:text-[15px] text-content-primary">
                <input
                  type="radio"
                  name="fileType"
                  value="me-ledger"
                  checked={selectedFileType === 'me-ledger'}
                  onChange={(e) => setSelectedFileType(e.target.value as FileType)}
                  className="cursor-pointer accent-cta-primary"
                />
                <span>その他台帳</span>
                {hasMELedgerFile && <span className="inline-flex items-center gap-0.5 text-cta-primary text-xs"><Check className="w-3 h-3" aria-hidden />済</span>}
              </label>
            </div>
          </div>

          {/* Dropzone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-xl text-center transition-all duration-300 mb-6 md:mb-8 px-5 py-10 md:px-10 md:py-16 lg:px-10 lg:py-20 ${
              isDragOver
                ? 'border-cta-primary bg-surface-select'
                : 'border-stroke-input bg-surface-screen'
            }`}
          >
            <div className="mb-4 flex justify-center">
              <Upload className="w-12 h-12 md:w-16 md:h-16 text-content-sub" strokeWidth={2.5} aria-hidden />
            </div>
            <p className="text-[15px] md:text-[17px] font-semibold text-content-primary mb-2">
              ここにファイルをドラッグ&ドロップ
            </p>
            <p className="text-[13px] md:text-sm text-content-sub mb-5">または</p>
            <input
              type="file"
              id="fileInput"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileSelect}
            />
            <button
              onClick={() => document.getElementById('fileInput')?.click()}
              className="px-7 py-3 md:px-8 md:py-3.5 bg-cta-primary text-white border-none rounded-lg text-sm md:text-[15px] font-semibold cursor-pointer hover:bg-cta-primary-dark transition-colors mb-4 min-h-[44px]"
            >
              ファイルを選択
            </button>
            <p className="text-xs md:text-[13px] text-content-sub">
              対応形式: .xlsx, .xls, .csv （最大サイズ: 10MB）
            </p>
          </div>

          {/* File Info */}
          {fileInfo && (
            <div className="bg-surface-screen border border-stroke-input rounded-lg p-4 md:p-5 mb-6 md:mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[15px] md:text-base font-bold text-content-primary">
                  選択済みファイル
                </h3>
                <button
                  onClick={removeFile}
                  aria-label="ファイル選択を解除"
                  className="bg-content-alert text-white border-none rounded-full cursor-pointer flex items-center justify-center hover:opacity-90 transition-colors min-w-[44px] min-h-[44px]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                  <span className="text-[13px] md:text-sm text-content-sub font-semibold">ファイル名:</span>
                  <span className="text-[13px] md:text-sm text-content-primary">{fileInfo.name}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="text-[13px] md:text-sm text-content-sub font-semibold">ファイルサイズ:</span>
                  <span className="text-[13px] md:text-sm text-content-primary">{fileInfo.size}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="text-[13px] md:text-sm text-content-sub font-semibold">データ件数:</span>
                  <span className="text-[13px] md:text-sm text-content-primary">{fileInfo.rows}</span>
                </div>
              </div>
            </div>
          )}

          {/* Notice (Figma 仕様: 赤 alert スタイル) */}
          <div className="bg-surface-card border border-content-alert rounded-lg p-4 md:p-5 mb-6 md:mb-8">
            <h3 className="inline-flex items-center gap-2 text-sm md:text-[15px] font-bold text-content-alert mb-3">
              <Pin className="w-4 h-4" aria-hidden />
              アップロード時の注意事項
            </h3>
            <ul className="text-[13px] md:text-sm text-content-alert leading-[1.8] pl-5 m-0">
              <li>Excelファイルの1行目はヘッダー行として認識されます</li>
              <li>データは2行目から読み込まれます</li>
              <li>空白行は自動的にスキップされます</li>
              <li>必須項目: 資産番号、品名、取得年月日</li>
            </ul>
          </div>

          {/* Action Buttons (Figma: 左寄せコンパクト幅) */}
          <div className="flex gap-3 flex-col md:flex-row">
            <button
              onClick={() => router.push('/main')}
              className="px-6 py-3 bg-surface-negative text-content-primary border-none rounded-lg text-sm md:text-[15px] font-semibold cursor-pointer flex items-center justify-center gap-2 hover:bg-stroke-input transition-colors min-h-[44px] md:min-w-[200px]"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden />
              <span>メイン画面に戻る</span>
            </button>
            {selectedFile && fileInfo ? (
              <button
                onClick={handleUploadAndProceed}
                className="px-6 py-3 bg-cta-primary text-white border-none rounded-lg text-sm md:text-[15px] font-semibold cursor-pointer flex items-center justify-center gap-2 hover:bg-cta-primary-dark transition-colors min-h-[44px] md:min-w-[260px]"
              >
                <span>アップロードして突き合わせへ</span>
                <ArrowRight className="w-4 h-4" aria-hidden />
              </button>
            ) : uploadedFiles.length > 0 ? (
              <button
                onClick={handleResumeMatching}
                className="px-6 py-3 bg-cta-primary text-white border-none rounded-lg text-sm md:text-[15px] font-semibold cursor-pointer flex items-center justify-center gap-2 hover:bg-cta-primary-dark transition-colors min-h-[44px] md:min-w-[200px]"
              >
                <span>突き合わせ画面へ</span>
                <ArrowRight className="w-4 h-4" aria-hidden />
              </button>
            ) : (
              <button
                onClick={() => router.push('/asset-matching')}
                className="px-6 py-3 bg-surface-card text-cta-primary border-2 border-cta-primary rounded-lg text-sm md:text-[15px] font-semibold cursor-pointer flex items-center justify-center gap-2 hover:bg-surface-select transition-colors min-h-[44px] md:min-w-[200px]"
              >
                <span>次へ</span>
                <ArrowRight className="w-4 h-4" aria-hidden />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
