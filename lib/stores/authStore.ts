import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole, LoginCredentials } from '../types';

/**
 * テスト用ユーザーデータ
 */
export interface TestUser {
  email: string;
  role: UserRole;
  roleLabel: string;
  name: string;
  hospital?: string;
  department?: string;
  section?: string;
  accessibleFacilities?: string[];
  /** テストユーザー一覧のカテゴリ表示用 */
  category: 'system' | 'org_default' | 'hospital' | 'dedicated';
}

export const TEST_USERS: TestUser[] = [
  // --- システム ---
  {
    email: 'admin@ship.com',
    role: 'system_admin',
    roleLabel: 'システム管理者',
    name: '管理者 太郎',
    accessibleFacilities: ['全施設'],
    category: 'system',
  },
  // --- 組織デフォルト ---
  {
    email: 'org1@ship.com',
    role: 'org_default_1',
    roleLabel: '企業・選択肢1',
    name: '山田 花子',
    accessibleFacilities: ['東京中央病院', '横浜総合病院', '千葉医療センター'],
    category: 'org_default',
  },
  {
    email: 'org2@ship.com',
    role: 'org_default_2',
    roleLabel: '企業・選択肢2',
    name: '鈴木 一郎',
    accessibleFacilities: ['東京中央病院', '横浜総合病院'],
    category: 'org_default',
  },
  {
    email: 'org3@ship.com',
    role: 'org_default_3',
    roleLabel: '企業・選択肢3',
    name: '中村 太郎',
    accessibleFacilities: ['東京中央病院'],
    category: 'org_default',
  },
  {
    email: 'org4@ship.com',
    role: 'org_default_4',
    roleLabel: '企業・選択肢4',
    name: '小林 次郎',
    accessibleFacilities: ['東京中央病院'],
    category: 'org_default',
  },
  // --- 病院 ---
  {
    email: 'hospital-admin@hospital.com',
    role: 'hospital_sys_admin',
    roleLabel: '病院システム管理者',
    name: '佐藤 美智子',
    hospital: '東京中央病院',
    department: '経営企画部',
    section: '医療機器管理課',
    category: 'hospital',
  },
  {
    email: 'hospital-office@hospital.com',
    role: 'hospital_office',
    roleLabel: '事務',
    name: '高橋 健二',
    hospital: '東京中央病院',
    department: '経営企画部',
    section: '医療機器管理課',
    category: 'hospital',
  },
  {
    email: 'hospital-depthead@hospital.com',
    role: 'hospital_dept_head',
    roleLabel: '部署責任者',
    name: '伊藤 三郎',
    hospital: '東京中央病院',
    department: '手術部門',
    section: '手術室',
    category: 'hospital',
  },
  {
    email: 'hospital-me@hospital.com',
    role: 'hospital_me',
    roleLabel: 'ME担当',
    name: '田中 花子',
    hospital: '東京中央病院',
    department: 'ME室',
    section: 'ME室',
    category: 'hospital',
  },
  {
    email: 'hospital-dr@hospital.com',
    role: 'hospital_doctor_nurse',
    roleLabel: '医師看護師',
    name: '渡辺 京子',
    hospital: '東京中央病院',
    department: '内科',
    section: '第一内科',
    category: 'hospital',
  },
  // --- 専用 ---
  {
    email: 'rimo@hospital.com',
    role: 'rimo_hospital',
    roleLabel: 'リモ病院用',
    name: 'リモ 太郎',
    hospital: '東京中央病院',
    department: 'リモデル推進部',
    category: 'dedicated',
  },
  {
    email: 'estimate@hospital.com',
    role: 'estimate_staff',
    roleLabel: '見積登録担当者',
    name: '見積 担当',
    hospital: '東京中央病院',
    department: '経営企画部',
    category: 'dedicated',
  },
  {
    email: 'consign@hospital.com',
    role: 'consignment_staff',
    roleLabel: '委託スタッフ',
    name: '委託 次郎',
    hospital: '東京中央病院',
    department: '施設管理部',
    category: 'dedicated',
  },
  {
    email: 'lending-wh@hospital.com',
    role: 'lending_warehouse',
    roleLabel: '貸出倉庫',
    name: '倉庫 三郎',
    hospital: '東京中央病院',
    department: '物流管理部',
    category: 'dedicated',
  },
  {
    email: 'inspect-mob@hospital.com',
    role: 'inspection_mobile',
    roleLabel: '点検専用モバイル',
    name: '点検 モバイル',
    hospital: '東京中央病院',
    department: 'ME室',
    category: 'dedicated',
  },
  {
    email: 'transport@hospital.com',
    role: 'transport_mobile',
    roleLabel: '搬送スタッフモバイル',
    name: '搬送 モバイル',
    hospital: '東京中央病院',
    department: '施設管理部',
    category: 'dedicated',
  },
  {
    email: 'vendor-recv@hospital.com',
    role: 'vendor_receiving_mobile',
    roleLabel: '業者検収モバイル',
    name: '検収 モバイル',
    hospital: '東京中央病院',
    department: '物流管理部',
    category: 'dedicated',
  },
];

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  selectedFacility: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  setSelectedFacility: (facility: string) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      selectedFacility: null,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true });
        try {
          // TODO: 実際のAPIコールに置き換える
          await new Promise((resolve) => setTimeout(resolve, 500));

          // メールアドレスに基づいてテストユーザーを検索
          const testUser = TEST_USERS.find(u => u.email === credentials.username);

          let mockUser: User;

          if (testUser) {
            // 登録済みテストユーザー
            mockUser = {
              id: `user-${testUser.role}-001`,
              username: testUser.name,
              email: testUser.email,
              role: testUser.role,
              hospital: testUser.hospital,
              department: testUser.department,
              section: testUser.section,
              accessibleFacilities: testUser.accessibleFacilities,
            };
          } else {
            // 未登録ユーザーはログインエラー
            set({ isLoading: false });
            throw new Error('認証に失敗しました');
          }

          set({
            user: mockUser,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          selectedFacility: null,
        });
      },

      setUser: (user: User | null) => {
        set({
          user,
          isAuthenticated: user !== null
        });
      },

      setSelectedFacility: (facility: string) => {
        set({ selectedFacility: facility });
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        selectedFacility: state.selectedFacility,
      }),
    }
  )
);
