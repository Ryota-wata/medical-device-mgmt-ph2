'use client';

import React from 'react';

interface StepProgressBarProps {
  currentStep: number;
  steps?: { step: number; label: string }[];
  /** @deprecated Figma パレット統一に伴い無視。後方互換のため残存 (orphan `page 2.tsx` 用) */
  activeColor?: string;
}

const DEFAULT_STEPS = [
  { step: 1, label: '見積情報入力' },
  { step: 2, label: 'OCR明細確認' },
  { step: 3, label: '登録区分登録' },
  { step: 4, label: '個体品目AI判定' },
  { step: 5, label: '個体登録/金額按分' },
  { step: 6, label: '登録確認' },
];

export const StepProgressBar: React.FC<StepProgressBarProps> = ({ currentStep, steps }) => {
  const displaySteps = steps || DEFAULT_STEPS;

  return (
    <div className="flex items-start px-8 py-3 bg-surface-screen">
      {displaySteps.map((item, index) => {
        const isCompleted = item.step < currentStep;
        const isCurrent = item.step === currentStep;
        // 完了済み step は Figma palette `step-completed` (#8FCE9C)
        // 現在 step は cta-primary-dark (#146E2E)、未到達 step は stroke-input (#E1E1E1)
        const stepCompletedColor = '#8FCE9C';
        const ctaDarkColor = '#146E2E';
        const strokeInputColor = '#E1E1E1';
        const contentSubColor = '#8A8A8A';
        const circleStyle: React.CSSProperties = {
          backgroundColor: isCompleted ? stepCompletedColor : isCurrent ? ctaDarkColor : strokeInputColor,
        };
        const labelStyle: React.CSSProperties = {
          color: isCompleted ? stepCompletedColor : isCurrent ? ctaDarkColor : contentSubColor,
          fontWeight: isCurrent ? 700 : 400,
        };
        const connectorStyle: React.CSSProperties = {
          backgroundColor: isCompleted ? stepCompletedColor : strokeInputColor,
        };

        return (
          <React.Fragment key={item.step}>
            <div className="flex flex-col items-center gap-2 shrink-0 w-10">
              <div
                className="flex items-center justify-center size-10 rounded-full text-white text-sm tabular-nums"
                style={circleStyle}
              >
                {item.step}
              </div>
              <span className="text-xs text-center whitespace-nowrap" style={labelStyle}>{item.label}</span>
            </div>
            {index < displaySteps.length - 1 && (
              <div className="flex-1 h-0.5 mt-5 mx-2" style={connectorStyle} aria-hidden="true" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
