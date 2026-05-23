'use client';

import { useState, useEffect, useRef } from 'react';

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (value: string) => void;  // ドロップダウンから選択時のみ呼ばれる
  options: string[];
  placeholder?: string;
  label?: string;
  isMobile?: boolean;
  disabled?: boolean;
  dropdownMinWidth?: string;
}

export function SearchableSelect({
  value,
  onChange,
  onSelect,
  options,
  placeholder = '選択または入力してください',
  label,
  isMobile = false,
  disabled = false,
  dropdownMinWidth = '200px'
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState(options);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearching) {
      if (searchQuery) {
        const filtered = options.filter((option) =>
          option.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredOptions(filtered);
      } else {
        setFilteredOptions(options);
      }
    } else {
      setFilteredOptions(options);
    }
  }, [searchQuery, options, isSearching]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsSearching(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    setIsSearching(true);
    setIsOpen(true);
  };

  const handleOptionClick = (option: string) => {
    onChange(option);
    if (onSelect) {
      onSelect(option);
    }
    setIsOpen(false);
    setIsSearching(false);
    setSearchQuery('');
  };

  const handleFocus = () => {
    setIsOpen(true);
    setIsSearching(true);
    setSearchQuery('');
  };

  return (
    <div style={{ width: '100%', position: 'relative' }} ref={containerRef}>
      {label && (
        <label style={{
          display: 'block',
          fontSize: isMobile ? '13px' : '14px',
          fontWeight: 600,
          color: '#4A4A4A',
          marginBottom: isMobile ? '6px' : '8px'
        }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          value={isSearching ? searchQuery : (value || '')}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={isSearching && value ? value : placeholder}
          disabled={disabled}
          style={{
            width: '100%',
            paddingTop: '10px',
            paddingBottom: '10px',
            paddingLeft: isMobile ? '10px' : '12px',
            paddingRight: '36px',
            border: '1px solid #E1E1E1',
            borderRadius: '6px',
            fontSize: '14px',
            background: disabled ? '#FAFAFA' : 'white',
            cursor: disabled ? 'not-allowed' : 'text',
            boxSizing: 'border-box'
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            color: '#8A8A8A',
            fontSize: '12px'
          }}
        >
          ▼
        </div>
      </div>

      {isOpen && filteredOptions.length > 0 && !disabled && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          minWidth: dropdownMinWidth,
          marginTop: '4px',
          background: 'white',
          border: '1px solid #E1E1E1',
          borderRadius: '6px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          maxHeight: isMobile ? '200px' : '350px',
          overflowY: 'auto',
          zIndex: 9999
        }}>
          {/* REQ-002: 一番上に「すべて選択」を配置（クリックで絞込解除＝全体に戻す） */}
          <div
            onClick={() => handleOptionClick('')}
            style={{
              padding: isMobile ? '10px 12px' : '12px 14px',
              cursor: 'pointer',
              fontSize: isMobile ? '13px' : '14px',
              color: '#4A4A4A',
              fontWeight: 600,
              background: value === '' ? '#EBF5EE' : 'white',
              borderBottom: '1px solid #E1E1E1',
              transition: 'background 0.15s',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => { if (value !== '') e.currentTarget.style.background = '#FAFAFA'; }}
            onMouseLeave={(e) => { if (value !== '') e.currentTarget.style.background = 'white'; }}
          >
            すべて選択
          </div>
          {filteredOptions.map((option, index) => (
            <div
              key={index}
              onClick={() => handleOptionClick(option)}
              style={{
                padding: isMobile ? '10px 12px' : '12px 14px',
                cursor: 'pointer',
                fontSize: isMobile ? '13px' : '14px',
                color: '#4A4A4A',
                background: option === value ? '#EBF5EE' : 'white',
                borderBottom: index < filteredOptions.length - 1 ? '1px solid #FAFAFA' : 'none',
                transition: 'background 0.15s',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                if (option !== value) {
                  e.currentTarget.style.background = '#FAFAFA';
                }
              }}
              onMouseLeave={(e) => {
                if (option !== value) {
                  e.currentTarget.style.background = 'white';
                }
              }}
            >
              {option}
            </div>
          ))}
        </div>
      )}

      {isOpen && filteredOptions.length === 0 && searchQuery && !disabled && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '4px',
          background: 'white',
          border: '1px solid #E1E1E1',
          borderRadius: '6px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          padding: isMobile ? '12px' : '16px',
          textAlign: 'center',
          color: '#8A8A8A',
          fontSize: isMobile ? '13px' : '14px',
          zIndex: 9999
        }}>
          検索結果がありません
        </div>
      )}
    </div>
  );
}
