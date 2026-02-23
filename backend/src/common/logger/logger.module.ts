import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    PinoLoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        timestamp: () => `,"time":"${new Date().toISOString()}"`,
        // ヘルスチェックエンドポイントへのリクエストはログ出力しない
        autoLogging: {
          ignore: (req) => req.url === '/api/v1/health',
        },
        // req/res のログ出力フィールドを必要最小限に絞る
        // デフォルトではヘッダー全体（Authorizationトークン含む）・remotePort等が出力されるため
        serializers: {
          req: (req) => ({
            method: req.method,
            url: req.url,
          }),
          res: (res) => ({
            statusCode: res.statusCode,
          }),
        },
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true } }
            : undefined,
      },
    }),
  ],
  exports: [PinoLoggerModule],
})
export class LoggerModule {}
