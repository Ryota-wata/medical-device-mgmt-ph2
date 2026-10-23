/**
 * Ph2 施設マスタ（顧客ワイヤー 操作UI_施設マスタ v3.3）の項目定義とサンプル値
 *
 * 顧客の SHIP施設マスタ（8,055 件）には契約・認定・病床の値がほとんど入っていないため、
 * モックの他画面で使っている 21 施設（masterStore の初期施設）にだけサンプル値を付ける。
 */
import type { FacilityContractStatus, FacilityMaster } from '@/lib/types/master';

// ──────────────────────────────────────────────
// 項目定義（ワイヤーの CERTS / BEDS_L / BEDS_R / ROOMS）
// ──────────────────────────────────────────────
export interface CertCategory {
  name: string;
  options: string[];
}

/** 認定情報。分類ごとに複数選択。選択肢の追加・変更はコード値マスタで行う想定 */
export const CERT_CATEGORIES: CertCategory[] = [
  {
    name: '① 救急医療関連',
    options: ['高度救命救急センター', '地域救命救急センター', '救命救急センター（高度・地域以外）', '三次救急医療機関', '二次救急医療機関', '一次救急医療機関', '小児救命救急センター'],
  },
  {
    name: '② がん医療関連',
    options: ['都道府県がん診療連携拠点病院（国指定）', '地域がん診療連携拠点病院（国指定）', 'がん診療拠点病院（都道府県指定）', '小児がん拠点病院（国指定）', 'がんゲノム医療中核拠点病院', 'がんゲノム医療拠点病院', 'がんゲノム医療連携病院'],
  },
  { name: '③ 周産期・小児医療', options: ['総合周産期母子医療センター', '地域周産期母子医療センター', '小児中核病院', '地域小児医療センター'] },
  { name: '④ 地域医療・政策医療', options: ['地域医療支援病院', 'へき地医療拠点病院', '在宅療養後方支援病院', '基幹災害拠点病院', '地域災害拠点病院'] },
  { name: '⑤ 感染症医療', options: ['特定感染症指定医療機関', '第一種感染症指定医療機関', '第二種感染症指定医療機関', '結核患者収容モデル事業'] },
];

export interface BedItem {
  /** 0＝総数 / 1＝法定区分・治療室 / 2＝内訳 */
  level: 0 | 1 | 2;
  label: string;
}

/** 総病床数と法定区分（level 1 の合計が総病床数と一致するか確認する） */
export const BED_ITEMS_LEFT: BedItem[] = [
  { level: 0, label: '総病床数' },
  { level: 1, label: '一般病床' },
  { level: 2, label: '一般病床（急性期一般）' },
  { level: 2, label: '一般病床（緩和ケア）' },
  { level: 2, label: '一般病床（回復期リハ）' },
  { level: 2, label: '一般病床（地域包括ケア）' },
  { level: 1, label: '療養病床' },
  { level: 1, label: '精神病床' },
  { level: 1, label: '感染症病床' },
  { level: 1, label: '結核病床' },
];

/** 治療室（一般病床の内数）。ICU の内訳（level 2）は ICU と一致するか確認する */
export const BED_ITEMS_RIGHT: BedItem[] = [
  { level: 1, label: '救急病棟' },
  { level: 1, label: 'ICU' },
  { level: 2, label: 'E-ICU' },
  { level: 2, label: 'G-ICU' },
  { level: 2, label: 'CCU' },
  { level: 1, label: 'HCU' },
  { level: 1, label: 'SCU' },
  { level: 1, label: 'NICU' },
  { level: 1, label: 'GCU' },
  { level: 1, label: 'MFICU' },
  { level: 1, label: 'PICU' },
];

export const ROOM_ITEMS: { label: string; unit: string }[] = [
  { label: '救急初療室数', unit: '室' },
  { label: '中央処置ベッド数', unit: '床' },
  { label: '化学療法ベッド数', unit: '床' },
  { label: '分娩室数', unit: '室' },
  { label: '内視鏡室数', unit: '室' },
  { label: '人工透析ベッド数', unit: '床' },
  { label: '手術室数', unit: '室' },
  { label: '中央採血台数', unit: '台' },
];

/** 顧客 SHIP施設マスタの列 → 画面の項目名（値が入っている施設のための読み替え） */
export const CUSTOMER_BED_KEYS: Record<string, string> = {
  totalBeds: '総病床数', generalBeds: '一般病床', palliativeBeds: '一般病床（緩和ケア）',
  rehabilitationBeds: '一般病床（回復期リハ）', communityCareBeds: '一般病床（地域包括ケア）',
  chronicBeds: '療養病床', psychiatricBeds: '精神病床', infectiousBeds: '感染症病床',
  emergencyWard: '救急病棟', icu: 'ICU', eICU: 'E-ICU', gICU: 'G-ICU', ccu: 'CCU', hcu: 'HCU',
  scu: 'SCU', nicu: 'NICU', gcu: 'GCU', mficu: 'MFICU',
};
export const CUSTOMER_ROOM_KEYS: Record<string, string> = {
  erRooms: '救急初療室数', centralTreatmentBeds: '中央処置ベッド数', chemotherapyBeds: '化学療法ベッド数',
  deliveryRooms: '分娩室数', endoscopyRooms: '内視鏡室数', dialysisBeds: '人工透析ベッド数',
  operatingRooms: '手術室数', bloodCollectionUnits: '中央採血台数',
};

// ──────────────────────────────────────────────
// 管理組織・SHIP ユーザー（ワイヤーの SHIP_ADMINS / SHIP_USERS）
// ──────────────────────────────────────────────
export const SHIP_MANAGING_ORGS = ['コンサル1部（営業サポート）', 'コンサル2部（リモデル）', 'データ分析室（横断分析）'];

export interface ShipUserSample {
  mail: string;
  name: string;
  org: string;
  managingOrg: string;
  status: '利用中' | '招待中' | '休止中' | '退職';
}

/** 管理者登録で既存アカウントを引き継ぐ判定に使う（SHIP ユーザーマスタの写し） */
export const SHIP_USER_SAMPLES: ShipUserSample[] = [
  { mail: 'sato.i@ship-hd.co.jp', name: '佐藤 一郎', org: 'コンサル1部', managingOrg: 'コンサル1部（営業サポート）', status: '利用中' },
  { mail: 'okada.h@ship-hd.co.jp', name: '岡田 陽子', org: 'コンサル1部', managingOrg: 'コンサル1部（営業サポート）', status: '利用中' },
  { mail: 'kimura.s@ship-hd.co.jp', name: '木村 智', org: 'コンサル2部', managingOrg: 'コンサル2部（リモデル）', status: '利用中' },
  { mail: 'hayashi.m@ship-hd.co.jp', name: '林 美咲', org: 'コンサル2部', managingOrg: 'コンサル2部（リモデル）', status: '招待中' },
  { mail: 'taishoku@ship-hd.co.jp', name: '退職 次郎', org: 'コンサル1部', managingOrg: 'コンサル1部（営業サポート）', status: '退職' },
];

/** 病院管理者の所属部署の候補（その施設の病院ユーザーに登録されている所属部署。マスタは持たない） */
export const HOSPITAL_DEPT_CANDIDATES = ['事務部／総務課', '事務部／医事課', '事務部／施設管理課', '臨床工学部', '看護部／看護管理室', '放射線部', '薬剤部'];

// ──────────────────────────────────────────────
// 21 施設のサンプル値
// ──────────────────────────────────────────────
const AREAS: Record<string, string[]> = {
  東京都: ['区中央部', '区西部', '区西南部'], 神奈川県: ['横浜西部', '川崎南部'], 大阪府: ['大阪市'], 愛知県: ['名古屋・尾張中部'],
  福岡県: ['福岡・糸島'], 北海道: ['札幌'], 宮城県: ['仙台'], 兵庫県: ['神戸'], 京都府: ['京都・乙訓'], 広島県: ['広島'],
  千葉県: ['千葉'], 埼玉県: ['さいたま'], 静岡県: ['静岡'], 岡山県: ['県南東部'], 熊本県: ['熊本・上益城'],
  鹿児島県: ['鹿児島'], 新潟県: ['新潟'], 石川県: ['石川中央'], 長野県: ['松本'], 沖縄県: ['南部'],
};

/** [契約状況, リモデル契約] を施設の並び順に割り当てる（停止予定・停止中・未契約も一覧で見えるように散らす） */
const CONTRACT_PATTERN: [FacilityContractStatus, 'あり' | 'なし'][] = [
  ['契約中', 'あり'], ['契約中', 'なし'], ['契約中', 'あり'], ['未契約', 'なし'], ['契約中', 'なし'],
  ['停止予定', 'なし'], ['契約中', 'なし'], ['契約中', 'あり'], ['停止中', 'なし'], ['契約中', 'なし'],
  ['未契約', 'なし'], ['契約中', 'なし'], ['契約中', 'あり'], ['契約中', 'なし'], ['契約中', 'なし'],
  ['未契約', 'なし'], ['契約中', 'なし'], ['契約中', 'なし'], ['契約中', 'なし'], ['契約中', 'なし'], ['契約中', 'なし'],
];

/** 契約更新日（＝契約終了日）。60 日以内の通知を見せるため一部を近い日付にする */
const RENEWAL_DATES = ['2027-03-31', '2027-03-31', '2027-06-30', '2027-03-31', '2026-11-30', '2027-03-31', '2027-06-30'];

function shortNameOf(name: string) {
  return name.replace(/(総合医療センター|医療センター|メディカルセンター|総合病院|中央病院|病院|クリニック)$/, '') || name;
}

function bedsFor(total: number, i: number): Record<string, string> {
  // 小さい施設に療養・精神病床を割り当てると一般病床がマイナスになるため、200 床以上に限る
  const psych = total >= 200 && i % 3 === 0 ? 40 : 0;
  const chronic = total >= 200 && i % 4 === 0 ? 40 : 0;
  const infect = total >= 100 && i % 5 === 0 ? 8 : 0;
  const general = total - psych - chronic - infect;
  const icu = total >= 400 ? 24 : total >= 200 ? 10 : 0;
  // ICU の内訳は整数で分け、端数は CCU に寄せる（内訳の合計＝ICU）
  const eIcu = Math.floor(icu / 2);
  const gIcu = Math.floor(icu / 4);
  return {
    総病床数: String(total),
    一般病床: String(general),
    '一般病床（急性期一般）': String(Math.max(general - 60, 0)),
    '一般病床（緩和ケア）': general > 300 ? '20' : '',
    '一般病床（回復期リハ）': '40',
    '一般病床（地域包括ケア）': '',
    療養病床: String(chronic),
    精神病床: String(psych),
    // わざと 1 件だけ合計がずれる施設を作り、法定区分の不一致の警告を見せる
    感染症病床: String(i === 1 ? infect + 2 : infect),
    結核病床: '0',
    救急病棟: total >= 300 ? '24' : '',
    ICU: String(icu),
    'E-ICU': String(eIcu),
    'G-ICU': String(gIcu),
    CCU: String(icu - eIcu - gIcu),
    HCU: total >= 300 ? '16' : '0',
    SCU: total >= 400 ? '6' : '0',
    NICU: total >= 400 ? '9' : '0',
    GCU: total >= 400 ? '12' : '0',
    MFICU: '',
    PICU: '',
  };
}

function roomsFor(total: number): Record<string, string> {
  const s = (n: number) => String(Math.max(Math.round(n), 0));
  return {
    救急初療室数: s(total / 120),
    中央処置ベッド数: s(total / 40),
    化学療法ベッド数: s(total / 20),
    分娩室数: total >= 300 ? '3' : '0',
    内視鏡室数: s(total / 80),
    人工透析ベッド数: s(total / 16),
    手術室数: s(total / 60),
    中央採血台数: s(total / 50),
  };
}

const CERT_PATTERN: string[][] = [
  ['高度救命救急センター', '三次救急医療機関', '地域がん診療連携拠点病院（国指定）', '地域周産期母子医療センター', '地域医療支援病院', '基幹災害拠点病院'],
  ['二次救急医療機関', '地域医療支援病院'],
  ['二次救急医療機関', 'がん診療拠点病院（都道府県指定）', '地域災害拠点病院', '第二種感染症指定医療機関'],
  [],
];

/** masterStore の初期施設 id → Ph2 の追加項目 */
export function buildPh2Sample(facility: FacilityMaster, index: number): Partial<FacilityMaster> {
  const [contractStatus, remodelContract] = CONTRACT_PATTERN[index % CONTRACT_PATTERN.length];
  const contractEndDate = RENEWAL_DATES[index % RENEWAL_DATES.length];
  const contracted = contractStatus !== '未契約';
  const total = facility.bedCount || 0;
  const areas = AREAS[facility.prefecture] ?? [''];
  return {
    shortName: shortNameOf(facility.facilityName),
    secondaryMedicalArea: areas[index % areas.length],
    floorArea: total ? (total * 52).toLocaleString('ja-JP') : '',
    contractStatus,
    remodelContract,
    contractStartDate: contracted ? '2024-04-01' : '',
    contractEndDate: contracted ? contractEndDate : '',
    useStartDate: contracted ? '2024/06/15' : '',
    stopPlanDate: contractStatus === '停止予定' ? '2026/10/31' : '',
    stopDate: contractStatus === '停止中' ? '2026/09/30' : '',
    certifications: CERT_PATTERN[index % CERT_PATTERN.length],
    beds: total ? bedsFor(total, index) : {},
    rooms: total ? roomsFor(total) : {},
    managingOrgs: index % 3 === 2 ? ['コンサル2部（リモデル）'] : ['コンサル1部（営業サポート）'],
  };
}
