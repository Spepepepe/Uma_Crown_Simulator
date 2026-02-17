import { Module, Global } from '@nestjs/common';
import { CognitoService } from './cognito.service.js';

@Global()
@Module({
  providers: [CognitoService],
  exports: [CognitoService],
})
export class CognitoModule {}
