import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { BreedingCountService } from './breeding-count.service.js';

@Injectable()
export class RaceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly breedingCountService: BreedingCountService,
  ) {}

  /** レース一覧取得 (フィルタ付き) */
  async getRaceList(state: number, distance: number) {
    const where: any = {};
    if (state !== -1) where.race_state = state;
    if (distance !== -1) where.distance = distance;

    return this.prisma.raceTable.findMany({
      where,
      orderBy: [
        { junior_flag: 'desc' },
        { classic_flag: 'desc' },
        { race_months: 'asc' },
        { half_flag: 'asc' },
        { race_rank: 'asc' },
      ],
    });
  }

  /** 登録用レースリスト取得 (G1/G2/G3) */
  async getRegistRaceList() {
    return this.prisma.raceTable.findMany({
      where: { race_rank: { in: [1, 2, 3] } },
      orderBy: [
        { race_rank: 'asc' },
        { race_months: 'asc' },
        { half_flag: 'asc' },
      ],
    });
  }

  /** 残レース一覧取得 */
  async getRemaining(userId: string) {
    // ユーザー登録済みウマ娘を取得
    const registUmamusumes = await this.prisma.registUmamusumeTable.findMany({
      where: { user_id: userId },
      include: { umamusume: true },
    });

    // G1/G2/G3 レースを取得
    const targetRaces = await this.prisma.raceTable.findMany({
      where: { race_rank: { in: [1, 2, 3] } },
    });

    // ユーザーの出走済みレースを取得
    const umamusumeIds = registUmamusumes.map((r) => r.umamusume_id);
    const runRaces = await this.prisma.registUmamusumeRaceTable.findMany({
      where: {
        user_id: userId,
        ...(umamusumeIds.length > 0
          ? { umamusume_id: { in: umamusumeIds } }
          : { umamusume_id: 0 }),
      },
      select: { umamusume_id: true, race_id: true },
    });

    // ウマ娘IDごとに出走済みレースIDをマッピング
    const runRacesByUmamusume: Record<number, number[]> = {};
    for (const item of runRaces) {
      if (!runRacesByUmamusume[item.umamusume_id]) {
        runRacesByUmamusume[item.umamusume_id] = [];
      }
      runRacesByUmamusume[item.umamusume_id].push(item.race_id);
    }

    const results: any[] = [];

    for (const regist of registUmamusumes) {
      const registRaceIds = runRacesByUmamusume[regist.umamusume_id] || [];
      const remainingRaces = targetRaces.filter(
        (r) => !registRaceIds.includes(r.race_id),
      );
      const isAllCrown = remainingRaces.length === 0;

      let breedingCount = 0;
      const counts = {
        allCrownRace: 0,
        turfSprintRace: 0,
        turfMileRace: 0,
        turfClassicRace: 0,
        turfLongDistanceRace: 0,
        dirtSprintDistanceRace: 0,
        dirtMileRace: 0,
        dirtClassicRace: 0,
      };

      if (!isAllCrown) {
        breedingCount = this.breedingCountService.calculate(remainingRaces);

        counts.allCrownRace = remainingRaces.length;
        for (const race of remainingRaces) {
          if (race.race_state === 0 && race.distance === 1)
            counts.turfSprintRace++;
          if (race.race_state === 0 && race.distance === 2)
            counts.turfMileRace++;
          if (race.race_state === 0 && race.distance === 3)
            counts.turfClassicRace++;
          if (race.race_state === 0 && race.distance === 4)
            counts.turfLongDistanceRace++;
          if (race.race_state === 1 && race.distance === 1)
            counts.dirtSprintDistanceRace++;
          if (race.race_state === 1 && race.distance === 2)
            counts.dirtMileRace++;
          if (race.race_state === 1 && race.distance === 3)
            counts.dirtClassicRace++;
        }
      }

      results.push({
        umamusume: regist.umamusume,
        isAllCrown,
        breedingCount,
        ...counts,
      });
    }

    // allCrownRace昇順 → ウマ娘名昇順でソート
    results.sort((a, b) => {
      if (a.allCrownRace !== b.allCrownRace)
        return a.allCrownRace - b.allCrownRace;
      return a.umamusume.umamusume_name.localeCompare(
        b.umamusume.umamusume_name,
      );
    });

    return results;
  }

  /** 月別残レース取得 */
  async getRemainingToRace(
    userId: string,
    umamusumeId: number,
    season: number,
    month: number,
    half: boolean,
  ) {
    // 出走済みレースIDを取得
    const registRaces = await this.prisma.registUmamusumeRaceTable.findMany({
      where: { user_id: userId, umamusume_id: umamusumeId },
      select: { race_id: true },
    });

    const registRaceIds = registRaces.map((r) => r.race_id);

    const props = {
      season,
      month,
      half,
      isRaceReturn: false,
      isRaceForward: false,
    };

    let races = await this.findRemainingRaces(
      registRaceIds,
      season,
      month,
      half,
    );

    // 該当レースがなければ次のスロットを探索
    let loopCount = 0;
    while ((!races || races.length === 0) && loopCount < 2) {
      const secondHalf = !half;
      let secondMonth = month;
      let secondSeason = season;

      if (half) {
        secondMonth = month + 1;
        if (month === 12) {
          secondMonth = 1;
          if (season < 3) secondSeason = season + 1;
        }
      }

      props.season = secondSeason;
      props.month = secondMonth;
      props.half = secondHalf;

      races = await this.findRemainingRaces(
        registRaceIds,
        secondSeason,
        secondMonth,
        secondHalf,
      );
      loopCount++;
    }

    props.isRaceReturn = await this.hasRaceBefore(registRaceIds, props);
    props.isRaceForward = await this.hasRaceAfter(registRaceIds, props);

    return { data: races || [], Props: props };
  }

  /** 出走登録 (1件) */
  async registerOne(userId: string, umamusumeId: number, race: any) {
    const raceId = race.race_id;
    const raceName = race.race_name || `ID:${raceId}`;

    // 既存チェック
    const existing = await this.prisma.registUmamusumeRaceTable.findFirst({
      where: { user_id: userId, umamusume_id: umamusumeId, race_id: raceId },
      select: { id: true },
    });

    if (existing) {
      return { message: `${raceName}は既に出走済みです。` };
    }

    await this.prisma.registUmamusumeRaceTable.create({
      data: { user_id: userId, umamusume_id: umamusumeId, race_id: raceId },
    });

    return { message: `${raceName}を出走登録しました。` };
  }

  /** 出走登録 */
  async raceRun(userId: string, umamusumeId: number, raceId: number) {
    await this.prisma.registUmamusumeRaceTable.create({
      data: { user_id: userId, umamusume_id: umamusumeId, race_id: raceId },
    });

    return { message: '出走完了' };
  }

  /** パターン一括出走登録 */
  async registerPattern(userId: string, umamusumeId: number, races: any[]) {
    const records = races.map((race) => ({
      user_id: userId,
      umamusume_id: umamusumeId,
      race_id: race.race_id,
    }));

    await this.prisma.registUmamusumeRaceTable.createMany({
      data: records,
      skipDuplicates: true,
    });

    return { message: 'レースパターンを登録しました。' };
  }

  // --- Private helpers ---

  private async findRemainingRaces(
    registRaceIds: number[],
    season: number,
    month: number,
    half: boolean,
  ) {
    const seasonWhere =
      season === 1
        ? { junior_flag: true }
        : season === 2
          ? { classic_flag: true }
          : { senior_flag: true };

    const data = await this.prisma.raceTable.findMany({
      where: {
        race_rank: { in: [1, 2, 3] },
        race_months: month,
        half_flag: half,
        ...(registRaceIds.length > 0
          ? { race_id: { notIn: registRaceIds } }
          : {}),
        ...seasonWhere,
      },
    });

    return data;
  }

  private async hasRaceBefore(
    registRaceIds: number[],
    props: { season: number; month: number; half: boolean },
  ): Promise<boolean> {
    const notInFilter =
      registRaceIds.length > 0 ? { notIn: registRaceIds } : undefined;

    for (let s = props.season; s >= 1; s--) {
      const seasonWhere =
        s === 1
          ? { junior_flag: true }
          : s === 2
            ? { classic_flag: true }
            : { senior_flag: true };

      if (s === props.season) {
        if (props.half) {
          const count = await this.prisma.raceTable.count({
            where: {
              race_rank: { in: [1, 2, 3] },
              ...seasonWhere,
              race_months: props.month,
              half_flag: false,
              ...(notInFilter ? { race_id: notInFilter } : {}),
            },
          });
          if (count > 0) return true;
        }

        const count = await this.prisma.raceTable.count({
          where: {
            race_rank: { in: [1, 2, 3] },
            ...seasonWhere,
            race_months: { lt: props.month },
            ...(notInFilter ? { race_id: notInFilter } : {}),
          },
        });
        if (count > 0) return true;
      } else {
        const count = await this.prisma.raceTable.count({
          where: {
            race_rank: { in: [1, 2, 3] },
            ...seasonWhere,
            ...(notInFilter ? { race_id: notInFilter } : {}),
          },
        });
        if (count > 0) return true;
      }
    }
    return false;
  }

  private async hasRaceAfter(
    registRaceIds: number[],
    props: { season: number; month: number; half: boolean },
  ): Promise<boolean> {
    const notInFilter =
      registRaceIds.length > 0 ? { notIn: registRaceIds } : undefined;

    for (let s = props.season; s <= 3; s++) {
      const seasonWhere =
        s === 1
          ? { junior_flag: true }
          : s === 2
            ? { classic_flag: true }
            : { senior_flag: true };

      if (s === props.season) {
        if (!props.half) {
          const count = await this.prisma.raceTable.count({
            where: {
              race_rank: { in: [1, 2, 3] },
              ...seasonWhere,
              race_months: props.month,
              half_flag: true,
              ...(notInFilter ? { race_id: notInFilter } : {}),
            },
          });
          if (count > 0) return true;
        }

        const count = await this.prisma.raceTable.count({
          where: {
            race_rank: { in: [1, 2, 3] },
            ...seasonWhere,
            race_months: { gt: props.month },
            ...(notInFilter ? { race_id: notInFilter } : {}),
          },
        });
        if (count > 0) return true;
      } else {
        const count = await this.prisma.raceTable.count({
          where: {
            race_rank: { in: [1, 2, 3] },
            ...seasonWhere,
            ...(notInFilter ? { race_id: notInFilter } : {}),
          },
        });
        if (count > 0) return true;
      }
    }
    return false;
  }
}
