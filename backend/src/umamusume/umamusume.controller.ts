import { Controller, Get, Post, Body } from '@nestjs/common';
import { UmamusumeService } from './umamusume.service.js';
import { Public } from '../common/decorators/public.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@Controller('umamusumes')
export class UmamusumeController {
  constructor(private readonly umamusumeService: UmamusumeService) {}

  @Public()
  @Get()
  async list() {
    return this.umamusumeService.findAll();
  }

  @Get('unregistered')
  async unregistered(@CurrentUser() userId: string) {
    return this.umamusumeService.findUnregistered(userId);
  }

  @Get('registered')
  async registered(@CurrentUser() userId: string) {
    return this.umamusumeService.findRegistered(userId);
  }

  @Post('registrations')
  async register(
    @CurrentUser() userId: string,
    @Body()
    body: {
      umamusumeId: number;
      raceIdArray: number[];
    },
  ) {
    return this.umamusumeService.register(
      userId,
      body.umamusumeId,
      body.raceIdArray,
    );
  }
}
