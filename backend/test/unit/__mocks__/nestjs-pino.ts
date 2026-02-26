// Jest用 nestjs-pino モック
export const InjectPinoLogger = () => () => {};
export class PinoLogger {
  info = jest.fn();
  debug = jest.fn();
  warn = jest.fn();
  error = jest.fn();
}
