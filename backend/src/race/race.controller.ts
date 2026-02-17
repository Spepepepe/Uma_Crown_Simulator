import { Controller, Get, Post, Param, Query, Body, ParseIntPipe } from '@nestjs/common';
import { RaceService } from './race.service.js';
import { RacePatternService } from './race-pattern.service.js';
import { Public } from '../common/decorators/public.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@Controller('races')
export class RaceController {
  constructor(
    private readonly raceService: RaceService,
    private readonly racePatternService: RacePatternService,
  ) {}

  @Public()
  @Get()
  async list(
    @Query('state') state: string = '-1',
    @Query('distance') distance: string = '-1',
  ) {
    return this.raceService.getRaceList(Number(state), Number(distance));
  }

  @Get('registration-targets')
  async registrationTargets() {
    return this.raceService.getRegistRaceList();
  }

  @Get('remaining')
  async remaining(@CurrentUser() userId: string) {
    return this.raceService.getRemaining(userId);
  }

  @Get('remaining/search')
  async remainingSearch(
    @CurrentUser() userId: string,
    @Query('umamusumeId') umamusumeId: string,
    @Query('season') season: string,
    @Query('month') month: string,
    @Query('half') half: string,
  ) {
    return this.raceService.getRemainingToRace(
      userId,
      Number(umamusumeId),
      Number(season),
      Number(month),
      half === 'true',
    );
  }

  @Post('run')
  async run(
    @CurrentUser() userId: string,
    @Body() body: { umamusumeId: number; raceId: number },
  ) {
    return this.raceService.raceRun(userId, body.umamusumeId, body.raceId);
  }

  @Post('results')
  async registerOne(
    @CurrentUser() userId: string,
    @Body() body: { umamusumeId: number; race: any },
  ) {
    return this.raceService.registerOne(userId, body.umamusumeId, body.race);
  }

  @Post('results/batch')
  async registerPattern(
    @CurrentUser() userId: string,
    @Body() body: { umamusumeId: number; races: any[] },
  ) {
    return this.raceService.registerPattern(
      userId,
      body.umamusumeId,
      body.races,
    );
  }

  @Get('patterns/:umamusumeId')
  async pattern(
    @CurrentUser() userId: string,
    @Param('umamusumeId', ParseIntPipe) umamusumeId: number,
  ) {
    return this.racePatternService.getRacePattern(userId, umamusumeId);
  }
}
