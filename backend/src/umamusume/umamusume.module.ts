import { Module } from '@nestjs/common';
import { UmamusumeController } from './umamusume.controller.js';
import { UmamusumeService } from './umamusume.service.js';

@Module({
  controllers: [UmamusumeController],
  providers: [UmamusumeService],
  exports: [UmamusumeService],
})
export class UmamusumeModule {}
