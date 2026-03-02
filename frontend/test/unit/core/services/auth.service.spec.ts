import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

/**
 * 対象: src/app/core/services/auth.service.ts
 *
 * vi.hoisted() でモック関数をホイスト前に初期化し、
 * amazon-cognito-identity-js を完全にモック化してテストする。
 */

// ─── モック関数を vi.hoisted() で事前定義 ─────────────────────────────────
// vi.mock() はファイル先頭にホイストされるため、通常の const は未初期化(TDZ)になる。
// vi.hoisted() で定義した変数は vi.mock() ファクトリ内でも安全に参照できる。
const mocks = vi.hoisted(() => ({
  mockGetCurrentUser: vi.fn<() => any>().mockReturnValue(null),
  mockSignOut: vi.fn(),
  mockAuthenticateUser: vi.fn(),
  mockSignUp: vi.fn(),
  mockConfirmRegistration: vi.fn(),
  mockResendConfirmationCode: vi.fn(),
  mockGetSession: vi.fn(),
  mockGetJwtToken: vi.fn().mockReturnValue('mock-jwt-token'),
  mockForgotPassword: vi.fn(),
  mockConfirmPassword: vi.fn(),
}));

// ─── amazon-cognito-identity-js をモック化 ────────────────────────────────
// new で呼ばれるクラスは mockImplementation(function(){return ...}) を使う。
// mockReturnValue は内部で () => value（アロー関数）を使うため
// アロー関数はコンストラクタになれず TypeError になる。
vi.mock('amazon-cognito-identity-js', () => ({
  CognitoUserPool: vi.fn().mockImplementation(function () {
    return {
      getCurrentUser: mocks.mockGetCurrentUser,
      signUp: mocks.mockSignUp,
    };
  }),
  CognitoUser: vi.fn().mockImplementation(function () {
    return {
      getSession: mocks.mockGetSession,
      authenticateUser: mocks.mockAuthenticateUser,
      signOut: mocks.mockSignOut,
      confirmRegistration: mocks.mockConfirmRegistration,
      resendConfirmationCode: mocks.mockResendConfirmationCode,
      forgotPassword: mocks.mockForgotPassword,
      confirmPassword: mocks.mockConfirmPassword,
    };
  }),
  AuthenticationDetails: vi.fn().mockImplementation(function () {}),
}));

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    // 各テスト前にモックをリセット
    mocks.mockGetCurrentUser.mockReset();
    mocks.mockGetCurrentUser.mockReturnValue(null);
    mocks.mockAuthenticateUser.mockReset();
    mocks.mockSignUp.mockReset();
    mocks.mockConfirmRegistration.mockReset();
    mocks.mockResendConfirmationCode.mockReset();
    mocks.mockSignOut.mockReset();
    mocks.mockGetSession.mockReset();
    mocks.mockGetJwtToken.mockReturnValue('mock-jwt-token');
    mocks.mockForgotPassword.mockReset();
    mocks.mockConfirmPassword.mockReset();

    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });

    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  // ─────────────────────────────────────────────
  // 初期状態
  // ─────────────────────────────────────────────
  describe('初期状態', () => {
    it('トークンが null であること', () => {
      expect(service.getToken()).toBeNull();
    });

    it('isLoggedIn が false であること', () => {
      expect(service.isLoggedIn()).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  // restoreSession（セッション復元）
  // ─────────────────────────────────────────────
  describe('セッション復元', () => {
    it('Cognitoに現在ユーザーがいない場合はトークンが設定されない', () => {
      // beforeEach で mockGetCurrentUser は null を返すよう設定済み
      expect(service.getToken()).toBeNull();
    });

    it('セッションが有効な場合はトークンが設定される', () => {
      const mockSession = {
        isValid: () => true,
        getIdToken: () => ({ getJwtToken: mocks.mockGetJwtToken }),
      };
      mocks.mockGetCurrentUser.mockReturnValue({
        getSession: (cb: Function) => cb(null, mockSession),
      });

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [provideRouter([])] });
      const svc = TestBed.inject(AuthService);

      expect(svc.getToken()).toBe('mock-jwt-token');
      expect(svc.isLoggedIn()).toBe(true);
    });

    it('セッションが無効な場合はトークンが設定されない', () => {
      mocks.mockGetCurrentUser.mockReturnValue({
        getSession: (cb: Function) => cb(null, { isValid: () => false }),
      });

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [provideRouter([])] });
      const svc = TestBed.inject(AuthService);

      expect(svc.getToken()).toBeNull();
    });

    it('getSession がエラーを返した場合はトークンが設定されない', () => {
      mocks.mockGetCurrentUser.mockReturnValue({
        getSession: (cb: Function) => cb(new Error('SessionError'), null),
      });

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [provideRouter([])] });
      const svc = TestBed.inject(AuthService);

      expect(svc.getToken()).toBeNull();
    });

    it('Cognito ユーザーがいない場合は isInitialized が true になる', () => {
      // beforeEach で mockGetCurrentUser は null を返すよう設定済み
      expect(service.isInitialized()).toBe(true);
    });

    it('セッション復元が完了したら isInitialized が true になる', () => {
      const mockSession = {
        isValid: () => true,
        getIdToken: () => ({ getJwtToken: mocks.mockGetJwtToken }),
      };
      mocks.mockGetCurrentUser.mockReturnValue({
        getSession: (cb: Function) => cb(null, mockSession),
      });

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [provideRouter([])] });
      const svc = TestBed.inject(AuthService);

      expect(svc.isInitialized()).toBe(true);
    });
  });

  // ─────────────────────────────────────────────
  // login
  // ─────────────────────────────────────────────
  describe('login', () => {
    it('認証成功時に success: true を返し、トークンを設定する', async () => {
      const mockSession = {
        getIdToken: () => ({ getJwtToken: () => 'new-jwt-token' }),
      };
      mocks.mockAuthenticateUser.mockImplementation((_d: any, cb: any) => {
        cb.onSuccess(mockSession);
      });

      const result = await service.login('test@example.com', 'password');

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(service.getToken()).toBe('new-jwt-token');
      expect(service.isLoggedIn()).toBe(true);
    });

    it('認証失敗時に success: false と error メッセージを返す', async () => {
      mocks.mockAuthenticateUser.mockImplementation((_d: any, cb: any) => {
        cb.onFailure(new Error('NotAuthorizedException'));
      });

      const result = await service.login('test@example.com', 'wrong-password');

      expect(result.success).toBe(false);
      expect(result.error).toBe('NotAuthorizedException');
      expect(service.getToken()).toBeNull();
    });
  });

  // ─────────────────────────────────────────────
  // signUp
  // ─────────────────────────────────────────────
  describe('signUp', () => {
    it('登録成功時に success: true を返す', async () => {
      mocks.mockSignUp.mockImplementation(
        (_e: string, _p: string, _a: any, _b: any, cb: Function) => cb(null, {}),
      );

      const result = await service.signUp('new@example.com', 'Password1!');

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('登録失敗時に success: false と error メッセージを返す', async () => {
      mocks.mockSignUp.mockImplementation(
        (_e: string, _p: string, _a: any, _b: any, cb: Function) =>
          cb(new Error('UsernameExistsException')),
      );

      const result = await service.signUp('existing@example.com', 'Password1!');

      expect(result.success).toBe(false);
      expect(result.error).toBe('UsernameExistsException');
    });
  });

  // ─────────────────────────────────────────────
  // confirmSignUp
  // ─────────────────────────────────────────────
  describe('confirmSignUp', () => {
    it('確認成功時に success: true を返す', async () => {
      mocks.mockConfirmRegistration.mockImplementation(
        (_code: string, _force: boolean, cb: Function) => cb(null, 'SUCCESS'),
      );

      const result = await service.confirmSignUp('test@example.com', '123456');

      expect(result.success).toBe(true);
    });

    it('確認失敗時に success: false と error メッセージを返す', async () => {
      mocks.mockConfirmRegistration.mockImplementation(
        (_code: string, _force: boolean, cb: Function) =>
          cb(new Error('CodeMismatchException')),
      );

      const result = await service.confirmSignUp('test@example.com', 'wrong-code');

      expect(result.success).toBe(false);
      expect(result.error).toBe('CodeMismatchException');
    });
  });

  // ─────────────────────────────────────────────
  // logout
  // ─────────────────────────────────────────────
  describe('logout', () => {
    it('トークンをクリアしてisLoggedInがfalseになる', async () => {
      // まずログイン状態にする
      mocks.mockAuthenticateUser.mockImplementation((_d: any, cb: any) => {
        cb.onSuccess({ getIdToken: () => ({ getJwtToken: () => 'existing-token' }) });
      });
      await service.login('test@example.com', 'password');
      expect(service.isLoggedIn()).toBe(true);

      // ログアウト実行
      mocks.mockGetCurrentUser.mockReturnValue({ signOut: mocks.mockSignOut });

      service.logout();

      expect(service.getToken()).toBeNull();
      expect(service.isLoggedIn()).toBe(false);
      expect(mocks.mockSignOut).toHaveBeenCalled();
    });

    it('Cognitoユーザーがいない状態でも正常にlogoutできる', () => {
      mocks.mockGetCurrentUser.mockReturnValue(null);

      expect(() => service.logout()).not.toThrow();
      expect(service.getToken()).toBeNull();
    });
  });

  // ─────────────────────────────────────────────
  // getToken
  // ─────────────────────────────────────────────
  describe('getToken', () => {
    it('ログイン前は null を返す', () => {
      expect(service.getToken()).toBeNull();
    });

    it('ログイン後はトークン文字列を返す', async () => {
      mocks.mockAuthenticateUser.mockImplementation((_d: any, cb: any) => {
        cb.onSuccess({ getIdToken: () => ({ getJwtToken: () => 'my-token' }) });
      });

      await service.login('test@example.com', 'password');

      expect(service.getToken()).toBe('my-token');
    });
  });

  // ─────────────────────────────────────────────
  // forgotPassword
  // ─────────────────────────────────────────────
  describe('forgotPassword', () => {
    it('送信成功時に success: true を返す', async () => {
      mocks.mockForgotPassword.mockImplementation((cb: any) => {
        cb.onSuccess();
      });

      const result = await service.forgotPassword('test@example.com');

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('送信失敗時に success: false と error メッセージを返す', async () => {
      mocks.mockForgotPassword.mockImplementation((cb: any) => {
        cb.onFailure(new Error('UserNotFoundException'));
      });

      const result = await service.forgotPassword('notfound@example.com');

      expect(result.success).toBe(false);
      expect(result.error).toBe('UserNotFoundException');
    });
  });

  // ─────────────────────────────────────────────
  // confirmForgotPassword
  // ─────────────────────────────────────────────
  describe('confirmForgotPassword', () => {
    it('パスワードリセット成功時に success: true を返す', async () => {
      mocks.mockConfirmPassword.mockImplementation((_code: string, _pw: string, cb: any) => {
        cb.onSuccess();
      });

      const result = await service.confirmForgotPassword('test@example.com', '123456', 'NewPass1!');

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('パスワードリセット失敗時に success: false と error メッセージを返す', async () => {
      mocks.mockConfirmPassword.mockImplementation((_code: string, _pw: string, cb: any) => {
        cb.onFailure(new Error('CodeMismatchException'));
      });

      const result = await service.confirmForgotPassword('test@example.com', 'wrong', 'NewPass1!');

      expect(result.success).toBe(false);
      expect(result.error).toBe('CodeMismatchException');
    });
  });

  // ─────────────────────────────────────────────
  // resendConfirmationCode
  // ─────────────────────────────────────────────
  describe('resendConfirmationCode', () => {
    it('再送成功時に success: true を返す', async () => {
      mocks.mockResendConfirmationCode.mockImplementation((cb: Function) => cb(null, 'SUCCESS'));

      const result = await service.resendConfirmationCode('test@example.com');

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('再送失敗時に success: false と error メッセージを返す', async () => {
      mocks.mockResendConfirmationCode.mockImplementation((cb: Function) =>
        cb(new Error('LimitExceededException')),
      );

      const result = await service.resendConfirmationCode('test@example.com');

      expect(result.success).toBe(false);
      expect(result.error).toBe('LimitExceededException');
    });
  });

  // ─────────────────────────────────────────────
  // getFreshToken
  // ─────────────────────────────────────────────
  describe('getFreshToken', () => {
    it('Cognito ユーザーがいない場合は null を返す', async () => {
      // beforeEach で mockGetCurrentUser は null を返すよう設定済み
      const result = await service.getFreshToken();

      expect(result).toBeNull();
    });

    it('セッションが有効な場合はトークンを返し tokenSignal も更新する', async () => {
      const freshToken = 'fresh-jwt-token';
      mocks.mockGetCurrentUser.mockReturnValue({
        getSession: mocks.mockGetSession,
      });
      mocks.mockGetSession.mockImplementation((cb: Function) => {
        cb(null, {
          isValid: () => true,
          getIdToken: () => ({ getJwtToken: () => freshToken }),
        });
      });

      const result = await service.getFreshToken();

      expect(result).toBe(freshToken);
      expect(service.getToken()).toBe(freshToken);
    });

    it('セッションが無効な場合は null を返し tokenSignal をクリアする', async () => {
      mocks.mockGetCurrentUser.mockReturnValue({
        getSession: mocks.mockGetSession,
      });
      mocks.mockGetSession.mockImplementation((cb: Function) => {
        cb(null, { isValid: () => false });
      });

      const result = await service.getFreshToken();

      expect(result).toBeNull();
      expect(service.getToken()).toBeNull();
    });

    it('getSession がエラーを返した場合は null を返し tokenSignal をクリアする', async () => {
      mocks.mockGetCurrentUser.mockReturnValue({
        getSession: mocks.mockGetSession,
      });
      mocks.mockGetSession.mockImplementation((cb: Function) => {
        cb(new Error('TokenExpired'), null);
      });

      const result = await service.getFreshToken();

      expect(result).toBeNull();
      expect(service.getToken()).toBeNull();
    });
  });
});
