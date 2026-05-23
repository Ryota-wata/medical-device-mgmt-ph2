// Auto-generated from SHIP資産マスタ.xlsx — do not edit manually
// Re-generate: node docs/customer-sample-data/convert.mjs
// データ本体: asset-master.json (36365件)

export interface CustomerAssetMaster {
  classificationCode: string;
  jmdnCode: string;
  classificationName: string;
  jmdnSubCategory: string;
  generalName: string;
  tradeName: string;
  jmdnManufacturer: string;
  packageInsert: string;
  pharmaceuticalAffairs: string;
  assetMasterId: string;
  category: string;
  largeClass: string;
  mediumClass: string;
  detailCategory: string;
  item: string;
  maker: string;
  model: string;
  shipFlag: string;
  drawingNo: string;
  layoutReflection: string;
  specialEquipment: string;
  masterStandardDrawing: string;
  width: string;
  depth: string;
  height: string;
  powerConnection: string;
  powerType: string;
  powerConsumption: string;
  waterSupplySize: string;
  hotWaterSize: string;
  drainageSize: string;
  exhaustSize: string;
  exhaustVolume: string;
  steamSize: string;
  gas: string;
  weight: string;
  reinforcement: string;
  mountAnchor: string;
  floorLowering: string;
  equipmentRemarks: string;
  legalServiceLife: string;
  serviceLifePeriod: string;
  endOfService: string;
  endOfSupport: string;
  dedicatedConsumables: string;
  catalogDocument: string;
  operationManual: string;
  otherDocument: string;
  pmdaClassNotification: string;
  pmdaMaintenanceNotification: string;
  pmdaInstallNotification: string;
  pmdaClassCode: string;
  pmdaClassName: string;
  pmdaSubCategory: string;
  pmdaCode: string;
  pmdaGeneralName: string;
  pmdaGeneralNameDef: string;
  pmdaClassification: string;
  pmdaGhtfRule: string;
  pmdaSpecificMaintenance: string;
  pmdaInstallMgmt: string;
  pmdaRepairCategory: string;
  pmdaQms316: string;
  pmdaOldGeneralNameCode: string;
  pmdaOldGeneralName: string;
  pmdaOldClassification: string;
  pmdaOldRepairType: string;
  pmdaRevisionCount: string;
  pmdaLastUpdated: string;
  registrationStatus: string;
}

// JSONデータの読み込み
import assetMasterJson from './asset-master.json';
export const customerAssetMasters: CustomerAssetMaster[] = assetMasterJson as CustomerAssetMaster[];
