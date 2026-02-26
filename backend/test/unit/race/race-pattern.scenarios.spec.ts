import * as fs from 'fs';
import * as path from 'path';
import { RacePatternService } from '@src/race/race-pattern.service';
import type { RaceRow, ScenarioRaceRow, UmamusumeRow } from '@src/race/race.types';

/**
 * BCシナリオ残レース数（1/3/5/7/9）× ラーク残存（あり/なし）の組み合わせシナリオテスト
 *
 * 各ウマ娘について以下を検証する:
 * - BC残レース数に応じた BC パターン数が正しい
 * - ラーク残存ありの場合に larc パターンが 1 件含まれる
 * - ラーク残存なしの場合に larc パターンが含まれない
 * - 各パターンに必須フィールドが揃っている
 */

// ============================================================
// テストデータ読み込み
// ============================================================

const DATA_DIR = path.join(__dirname, '../../../data');

const raceJson: Record<string, any> = JSON.parse(
  fs.readFileSync(path.join(DATA_DIR, 'Race.json'), 'utf8'),
);
const umaJson: Record<string, any> = JSON.parse(
  fs.readFileSync(path.join(DATA_DIR, 'Umamusume.json'), 'utf8'),
);

/** Race.json を RaceRow[] に変換（race_id を連番付与） */
const allRacesFromJson: RaceRow[] = Object.values(raceJson).map((r: any, idx: number) => ({
  race_id: idx + 1,
  race_name: r.race_name,
  race_state: r.race_state,
  distance: r.distance,
  distance_detail: r.distance_detail ?? null,
  num_fans: r.num_fans,
  race_months: r.race_months,
  half_flag: r.half_flag,
  race_rank: r.race_rank,
  junior_flag: r.junior_flag,
  classic_flag: r.classic_flag,
  senior_flag: r.senior_flag,
  larc_flag: r.larc_flag,
  bc_flag: r.bc_flag,
}));

const raceByName = new Map<string, RaceRow>(allRacesFromJson.map((r) => [r.race_name, r]));

/** BC中間レース名（getRacePattern が raceTable から取得するレールに含まれる） */
const BC_MANDATORY_NAMES = new Set([
  'ホープフルステークス', '日本ダービー', 'ジャパンカップ', '宝塚記念',
  '阪神ジュベナイルフィリーズ', 'オークス', 'エリザベス女王杯', 'ヴィクトリアマイル',
  '京王杯ジュニアステークス', '葵ステークス', 'スプリンターズステークス', '高松宮記念',
  '朝日杯フューチュリティステークス', 'NHKマイルカップ', 'マイルチャンピオンシップ', '安田記念',
  'オキザリス賞', '昇竜ステークス', 'JBCスプリント', '根岸ステークス',
  '全日本ジュニア優駿', 'ユニコーンステークス', 'マイルチャンピオンシップ南部杯', 'フェブラリーステークス',
  '関東オークス', 'JBCレディスクラシック', 'TCK女王盃',
  'ジャパンダートダービー', 'JBCクラシック', '帝王賞',
]);

/**
 * raceTable.findMany のモックに返すレースプール
 * rank1-3 + BC中間レース名を含む（ラーク関連レースも rank1-3 であれば含まれる）
 */
const allGRaces: RaceRow[] = allRacesFromJson.filter(
  (r) => r.race_rank <= 3 || BC_MANDATORY_NAMES.has(r.race_name),
);

/** BC最終レース一覧（bc_flag=true） */
const bcFinalRaces = allGRaces.filter((r) => r.bc_flag);

/** ラーク関連レース（larc_flag または固有名） */
const LARC_RACE_NAMES = new Set(['凱旋門賞', 'ニエル賞', 'フォワ賞']);
const larcRaceIds = new Set(
  allGRaces
    .filter((r) => r.larc_flag || LARC_RACE_NAMES.has(r.race_name))
    .map((r) => r.race_id),
);

// ============================================================
// ヘルパー関数
// ============================================================

function makeUmamusumeRow(name: string, id: number): UmamusumeRow {
  const d = umaJson[name];
  return {
    umamusume_id: id,
    umamusume_name: name,
    turf_aptitude: d.turf_aptitude,
    dirt_aptitude: d.dirt_aptitude,
    front_runner_aptitude: d.front_runner_aptitude,
    early_foot_aptitude: d.early_foot_aptitude,
    midfield_aptitude: d.midfield_aptitude,
    closer_aptitude: d.closer_aptitude,
    sprint_aptitude: d.sprint_aptitude,
    mile_aptitude: d.mile_aptitude,
    classic_aptitude: d.classic_aptitude,
    long_distance_aptitude: d.long_distance_aptitude,
  };
}

function buildScenarioRaces(umaName: string, umaId: number): ScenarioRaceRow[] {
  const uma = umaJson[umaName];
  if (!uma?.scenarios) return [];

  return Object.entries(uma.scenarios).flatMap(([key, val]: [string, any]) => {
    let raceName: string;
    let seniorFlag: boolean | null;

    if (typeof val === 'string') {
      raceName = val;
      seniorFlag = null;
    } else {
      raceName = val['名前'];
      if (val['時期'] === 'シニア') seniorFlag = true;
      else if (val['時期'] === 'クラシック') seniorFlag = false;
      else seniorFlag = null;
    }

    const race = raceByName.get(raceName);
    if (!race) return [];

    return [
      {
        umamusume_id: umaId,
        race_id: race.race_id,
        race_number: parseInt(key),
        random_group: null,
        senior_flag: seniorFlag,
        race,
      } as ScenarioRaceRow,
    ];
  });
}

// ============================================================
// テスト対象ウマ娘
// ============================================================

const TARGET_UMAS = [
  'スペシャルウィーク',
  'ハルウララ',
  'サクラバクシンオー',
  'ホッコータルマエ',
  'キングヘイロー',
  'ジェンティルドンナ',
  'アーモンドアイ',
] as const;

const BC_COUNTS = [1, 3, 5, 7, 9] as const;

// ============================================================
// テスト本体
// ============================================================

describe('RacePatternService - BCシナリオ残レース数 × ラーク有無 シナリオテスト', () => {
  let service: RacePatternService;
  let mockPrisma: any;
  const mockLogger: any = {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(() => {
    mockPrisma = {
      registUmamusumeTable: { findUnique: jest.fn() },
      registUmamusumeRaceTable: { findMany: jest.fn() },
      raceTable: { findMany: jest.fn() },
      scenarioRaceTable: { findMany: jest.fn() },
    };
    service = new RacePatternService(mockPrisma, mockLogger);
  });

  for (const umaName of TARGET_UMAS) {
    describe(umaName, () => {
      for (const bcCount of BC_COUNTS) {
        // bcCount が実際の BC レース数を超える場合はスキップ
        const actualBCCount = Math.min(bcCount, bcFinalRaces.length);

        describe(`BC残${bcCount}件`, () => {
          /**
           * モックをセットアップし、getRacePattern 呼び出し用の umaId を返す
           * @param hasLarc - ラーク残存ありの場合 true
           */
          function setupMocks(hasLarc: boolean): number {
            const umaId = TARGET_UMAS.indexOf(umaName) + 1;
            const umaRow = makeUmamusumeRow(umaName, umaId);
            const scenarioRaces = buildScenarioRaces(umaName, umaId);

            // BC出走済みレース: 後ろ側 (bcFinalRaces.length - bcCount) 件
            const runBCRaceIds = new Set(
              bcFinalRaces.slice(actualBCCount).map((r) => r.race_id),
            );

            // ラーク残存なしの場合はラーク関連レースも出走済みに追加
            const runRaceIds = new Set(runBCRaceIds);
            if (!hasLarc) {
              larcRaceIds.forEach((id) => runRaceIds.add(id));
            }

            mockPrisma.registUmamusumeTable.findUnique.mockResolvedValue({
              user_id: 'test-user',
              umamusume_id: umaId,
              umamusume: umaRow,
            });
            // 出走済みレースを返す（service 内で remainingRacesAll を絞り込む）
            mockPrisma.registUmamusumeRaceTable.findMany.mockResolvedValue(
              Array.from(runRaceIds).map((id) => ({ race_id: id })),
            );
            // raceTable.findMany は全レースプールを返す（WHERE 句は無視）
            mockPrisma.raceTable.findMany.mockResolvedValue(allGRaces);
            mockPrisma.scenarioRaceTable.findMany.mockResolvedValue(scenarioRaces);

            return umaId;
          }

          describe('ラーク残存あり', () => {
            it(`BC${actualBCCount}件 + larcパターンが生成される`, async () => {
              const umaId = setupMocks(true);
              const result = await service.getRacePattern('test-user', umaId);

              expect(result.umamusumeName).toBe(umaName);

              const bcPatterns = result.patterns.filter((p) => p.scenario === 'bc');
              const larcPatterns = result.patterns.filter((p) => p.scenario === 'larc');

              expect(bcPatterns.length).toBe(actualBCCount);
              expect(larcPatterns.length).toBe(1);
            });

            it('各パターンに必須フィールドがある', async () => {
              const umaId = setupMocks(true);
              const result = await service.getRacePattern('test-user', umaId);

              for (const pattern of result.patterns) {
                expect(pattern).toHaveProperty('scenario');
                expect(Array.isArray(pattern.factors)).toBe(true);
                expect(pattern.factors).toHaveLength(6);
                expect((pattern.totalRaces ?? 0)).toBeGreaterThan(0);
              }
            });
          });

          describe('ラーク残存なし', () => {
            it(`BC${actualBCCount}件パターンのみ生成される（larcなし）`, async () => {
              const umaId = setupMocks(false);
              const result = await service.getRacePattern('test-user', umaId);

              expect(result.umamusumeName).toBe(umaName);

              const bcPatterns = result.patterns.filter((p) => p.scenario === 'bc');
              const larcPatterns = result.patterns.filter((p) => p.scenario === 'larc');

              expect(bcPatterns.length).toBe(actualBCCount);
              expect(larcPatterns.length).toBe(0);
            });

            it('各パターンに必須フィールドがある', async () => {
              const umaId = setupMocks(false);
              const result = await service.getRacePattern('test-user', umaId);

              for (const pattern of result.patterns) {
                expect(pattern).toHaveProperty('scenario');
                expect(Array.isArray(pattern.factors)).toBe(true);
                expect(pattern.factors).toHaveLength(6);
                expect((pattern.totalRaces ?? 0)).toBeGreaterThan(0);
              }
            });
          });
        });
      }
    });
  }
});
