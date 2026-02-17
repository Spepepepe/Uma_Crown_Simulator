import { Module } from '@nestjs/common';
import { RaceController } from './race.controller.js';
import { RaceService } from './race.service.js';
import { RacePatternService } from './race-pattern.service.js';
import { BreedingCountService } from './breeding-count.service.js';

@Module({
  controllers: [RaceController],
  providers: [RaceService, RacePatternService, BreedingCountService],
})
export class RaceModule {}
