import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service.js';
import * as fs from 'fs';
import * as path from 'path';

const BATCH_SIZE = 100;

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const count = await this.prisma.umamusumeTable.count();
    if (count === 0) {
      this.logger.log('データベースが空です。シードデータを投入します...');
      await this.seedAll();
    } else {
      this.logger.log(`既にデータが存在します (${count} 件)。シードをスキップします。`);
    }
  }

  async seedAll() {
    this.logger.log('データ投入を開始します...');
    await this.seedUmamusume();
    await this.seedRaces();
    await this.seedScenarioRaces();
    this.logger.log('データ投入が完了しました');
  }

  private async seedUmamusume() {
    const dataPath = path.resolve(process.cwd(), 'data/Umamusume.json');
    const raw = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    const records: any[] = [];
    for (const [name, data] of Object.entries(raw) as [string, any][]) {
      records.push({
        umamusume_name: name,
        turf_aptitude: data.turf_aptitude ?? 'A',
        dirt_aptitude: data.dirt_aptitude ?? 'G',
        front_runner_aptitude: data.front_runner_aptitude ?? 'G',
        early_foot_aptitude: data.early_foot_aptitude ?? 'A',
        midfield_aptitude: data.midfield_aptitude ?? 'A',
        closer_aptitude: data.closer_aptitude ?? 'G',
        sprint_aptitude: data.sprint_aptitude ?? 'G',
        mile_aptitude: data.mile_aptitude ?? 'A',
        classic_aptitude: data.classic_aptitude ?? 'A',
        long_distance_aptitude: data.long_distance_aptitude ?? 'A',
      });
    }

    let inserted = 0;
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      await this.prisma.umamusumeTable.createMany({ data: batch });
      inserted += batch.length;
    }
    this.logger.log(`umamusume_table: ${inserted} 件を投入しました`);
  }

  private async seedRaces() {
    const dataPath = path.resolve(process.cwd(), 'data/Race.json');
    const raw = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    const records: any[] = [];
    for (const [name, data] of Object.entries(raw) as [string, any][]) {
      records.push({
        race_name: name,
        race_state: data.race_state ?? 0,
        distance: data.distance ?? 1,
        distance_detail: data.distance_detail ?? null,
        num_fans: data.num_fans ?? 0,
        race_months: data.race_months ?? 1,
        half_flag: data.half_flag ?? false,
        race_rank: data.race_rank ?? 1,
        junior_flag: data.junior_flag ?? false,
        classic_flag: data.classic_flag ?? false,
        senior_flag: data.senior_flag ?? false,
        scenario_flag: data.scenario_flag ?? false,
      });
    }

    let inserted = 0;
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      await this.prisma.raceTable.createMany({ data: batch });
      inserted += batch.length;
    }
    this.logger.log(`race_table: ${inserted} 件を投入しました`);
  }

  private async seedScenarioRaces() {
    const dataPath = path.resolve(process.cwd(), 'data/Umamusume.json');
    const raw = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    const umamusumes = await this.prisma.umamusumeTable.findMany({
      select: { umamusume_id: true, umamusume_name: true },
    });

    const umamusumeMap = new Map<string, number>();
    for (const u of umamusumes) {
      umamusumeMap.set(u.umamusume_name, u.umamusume_id);
    }

    const races = await this.prisma.raceTable.findMany({
      select: { race_id: true, race_name: true },
    });

    const raceMap = new Map<string, number>();
    for (const r of races) {
      raceMap.set(r.race_name, r.race_id);
    }

    const records: any[] = [];
    for (const [name, data] of Object.entries(raw) as [string, any][]) {
      const umamusumeId = umamusumeMap.get(name);
      if (!umamusumeId) continue;

      const scenarios = data.scenarios;
      if (!scenarios) continue;

      for (const [raceNum, entry] of Object.entries(scenarios) as [string, any][]) {
        const num = parseInt(raceNum);
        this.processScenarioEntry(entry, num, umamusumeId, raceMap, records);
      }
    }

    if (records.length > 0) {
      let inserted = 0;
      for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);
        await this.prisma.scenarioRaceTable.createMany({ data: batch });
        inserted += batch.length;
      }
      this.logger.log(`scenario_race_table: ${inserted} 件を投入しました`);
    }
  }

  private processScenarioEntry(
    entry: any,
    raceNumber: number,
    umamusumeId: number,
    raceMap: Map<string, number>,
    records: any[],
    randomGroup?: number,
  ) {
    if (typeof entry === 'string') {
      // 形式A: 単純な文字列（レース名のみ）
      const raceId = raceMap.get(entry);
      if (raceId) {
        records.push({
          umamusume_id: umamusumeId,
          race_id: raceId,
          race_number: raceNumber,
          random_group: randomGroup ?? null,
          senior_flag: null,
        });
      }
    } else if (entry && typeof entry === 'object') {
      if ('名前' in entry) {
        // 形式B: { 名前, 時期 } オブジェクト
        const raceId = raceMap.get(entry['名前']);
        if (raceId) {
          const period = entry['時期'];
          let seniorFlag: boolean | null = null;
          if (period === 'シニア') seniorFlag = true;
          else if (period === 'クラシック') seniorFlag = false;

          records.push({
            umamusume_id: umamusumeId,
            race_id: raceId,
            race_number: raceNumber,
            random_group: randomGroup ?? null,
            senior_flag: seniorFlag,
          });
        }
      } else {
        // 形式C/D: ネストされた選択肢 { "1": ..., "2": ... }
        for (const [groupNum, subEntry] of Object.entries(entry) as [string, any][]) {
          this.processScenarioEntry(
            subEntry,
            raceNumber,
            umamusumeId,
            raceMap,
            records,
            parseInt(groupNum),
          );
        }
      }
    }
  }
}
