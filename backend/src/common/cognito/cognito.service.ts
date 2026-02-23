import { Injectable } from '@nestjs/common';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

/** AWS CognitoのJWTトークン検証を行うサービス */
@Injectable()
export class CognitoService {
  private readonly verifier: ReturnType<typeof CognitoJwtVerifier.create>;

  constructor(@InjectPinoLogger(CognitoService.name) private readonly logger: PinoLogger) {
    const userPoolId = process.env.COGNITO_USER_POOL_ID;
    const clientId = process.env.COGNITO_CLIENT_ID;

    if (!userPoolId || !clientId) {
      throw new Error('COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID must be set');
    }

    this.verifier = CognitoJwtVerifier.create({
      userPoolId,
      tokenUse: 'id',
      clientId,
    });
  }

  /** CognitoのIDトークンを検証してユーザーIDを返す
   * @param token - BearerトークンからスライスしたJWT文字列
   * @returns 検証成功時はCognitoユーザーID (sub)、失敗時は null
   */
  async verifyToken(token: string): Promise<string | null> {
    try {
      const payload = await this.verifier.verify(token);
      return payload.sub;
    } catch (error) {
      this.logger.debug({ err: error }, 'Token verification failed');
      return null;
    }
  }
}
