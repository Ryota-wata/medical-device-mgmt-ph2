import { create } from 'zustand';
import type { FacilityMaster } from '@/lib/types/master';
import { CONFIGURABLE_FEATURES, type FeatureSubject } from '@/lib/data/featureCatalog';
import { SHIP_MANAGING_ORGS } from '@/lib/data/facilityMasterSamples';

/**
 * 施設マスタ MS-102「権限設定」タブの状態（施設ごと）
 * 顧客ワイヤー 操作UI_施設マスタ v3.3 の ADMINS / fnState / permDone に当たる。
 *
 * 施設ごとの初期値は施設の契約状況から作る（契約済みの施設は設定済み、未契約は設定途中）。
 * 一度でも変更した施設だけを state に持つ。
 */
export type AdminType = '病院管理者' | '管理組織';
export type AdminStatus = '有効' | '招待中' | '未招待';

export interface FacilityAdmin {
  id: string;
  type: AdminType;
  /** 病院管理者＝氏名 / 管理組織＝管理組織名 */
  name: string;
  /** 管理者の氏名（病院管理者は name と同じ） */
  person: string;
  /** 所属部署（病院）／所属組織（SHIP） */
  org: string;
  members: number;
  status: AdminStatus;
  mail: string;
}

export interface FeatureSetting {
  use: boolean;
  /** '－' は実施主体が未設定 */
  subject: FeatureSubject | '－';
  /** 担当管理組織（実施主体が SHIP／両方 の機能だけ） */
  orgs: string[];
}

export interface FacilityAdminState {
  admins: FacilityAdmin[];
  features: Record<string, FeatureSetting>;
  /** ［権限設定を完了する］を押したか（一度きりのマイルストーン。完了後も設定は変えられる） */
  permDone: boolean;
}

let seq = 0;
const newId = () => `adm-${Date.now()}-${++seq}`;

function defaultSubject(options: FeatureSubject[]): FeatureSubject {
  if (options.length === 1) return options[0];
  return '病院';
}

/** 契約状況から施設ごとの初期値を作る */
export function buildDefaultAdminState(facility: FacilityMaster): FacilityAdminState {
  // サンプル値を付けた施設（担当の管理組織がある施設）だけ、管理者と割り当て済みの状態から始める。
  // 新しく登録した施設や顧客 SHIP施設マスタの施設は、管理者なし・未割り当てから始める
  const hasSample = !!facility.managingOrgs?.length;
  const contracted = hasSample && !!facility.contractStatus && facility.contractStatus !== '未契約';
  const orgs = hasSample ? (facility.managingOrgs as string[]) : [SHIP_MANAGING_ORGS[0]];

  const features: Record<string, FeatureSetting> = {};
  if (!hasSample) {
    // 新規施設は全機能 OFF・実施主体未設定・担当管理組織なし（正本 README の初期状態）
    CONFIGURABLE_FEATURES.forEach((f) => {
      features[f.code] = { use: false, subject: '－', orgs: [] };
    });
    return { admins: [], features, permDone: false };
  }
  CONFIGURABLE_FEATURES.forEach((f, i) => {
    const subject = defaultSubject(f.subjectOptions);
    const needsOrg = subject === 'SHIP' || subject === '両方';
    features[f.code] = {
      use: true,
      subject,
      // 未契約の施設は設定途中の状態を見せるため、SHIP 担当の機能の一部を未割り当てにする
      orgs: needsOrg && (contracted || i % 2 === 0) ? [orgs[0]] : [],
    };
  });

  const admins: FacilityAdmin[] = [
    {
      id: newId(), type: '病院管理者', name: '山田 太郎', person: '山田 太郎', org: '事務部／総務課',
      members: Math.max(Math.round((facility.bedCount || 100) * 0.6), 10), status: contracted ? '有効' : '未招待', mail: 'admin@example-hp.jp',
    },
    ...orgs.map<FacilityAdmin>((org, i) => ({
      id: newId(), type: '管理組織', name: org, person: i === 0 ? '佐藤 一郎' : '木村 智', org: org.replace(/（.*$/, ''),
      members: i === 0 ? 8 : 5, status: contracted ? '有効' : '未招待', mail: i === 0 ? 'sato.i@ship-hd.co.jp' : 'kimura.s@ship-hd.co.jp',
    })),
  ];
  return { admins, features, permDone: contracted };
}

interface FacilityAdminStore {
  byFacility: Record<string, FacilityAdminState>;
  /** 施設の状態（未変更なら初期値）。描画中に呼んでよい（state は変えない） */
  stateOf: (facility: FacilityMaster) => FacilityAdminState;
  update: (facility: FacilityMaster, updater: (current: FacilityAdminState) => FacilityAdminState) => void;
}

/** 初期値は施設ごとに 1 回だけ作る（描画のたびに作ると管理者の id が変わるため） */
const defaults = new Map<string, FacilityAdminState>();
function defaultOf(facility: FacilityMaster) {
  let d = defaults.get(facility.id);
  if (!d) {
    d = buildDefaultAdminState(facility);
    defaults.set(facility.id, d);
  }
  return d;
}

export const useFacilityAdminStore = create<FacilityAdminStore>((set, get) => ({
  byFacility: {},
  stateOf: (facility) => get().byFacility[facility.id] ?? defaultOf(facility),
  update: (facility, updater) =>
    set((s) => ({
      byFacility: { ...s.byFacility, [facility.id]: updater(s.byFacility[facility.id] ?? defaultOf(facility)) },
    })),
}));

export const newAdminId = newId;
