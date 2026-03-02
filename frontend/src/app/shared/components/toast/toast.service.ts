import { Injectable, signal } from '@angular/core';

/** トースト通知の状態を表すインターフェース */
export interface Toast {
  /** 表示するメッセージ */
  message: string;
  /** 通知タイプ */
  type: 'success' | 'error';
  /** 表示中かどうか */
  isVisible: boolean;
  /** 自動非表示しない場合 true */
  persistent?: boolean;
}

/** 画面上部にトースト通知を表示するサービス */
@Injectable({ providedIn: 'root' })
export class ToastService {
  /** 現在のトースト状態 */
  readonly toast = signal<Toast>({ message: '', type: 'success', isVisible: false });

  /** 自動非表示タイマーのID */
  private timerId: ReturnType<typeof setTimeout> | null = null;

  /** トースト通知を表示して3秒後に自動的に非表示にする
   * @param message - 表示するメッセージ
   * @param type - 通知タイプ（デフォルト: 'success'）
   */
  show(message: string, type: 'success' | 'error' = 'success') {
    if (this.timerId) {
      clearTimeout(this.timerId);
    }

    this.toast.set({ message, type, isVisible: true });

    this.timerId = setTimeout(() => {
      this.toast.set({ message: '', type: 'success', isVisible: false });
      this.timerId = null;
    }, 3000);
  }

  /** セッション切れ通知を表示する（自動非表示なし・重複表示しない） */
  showSessionExpired() {
    if (this.toast().isVisible && this.toast().persistent) return;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.toast.set({
      message: 'セッションの有効期限が切れました。ページを更新してください。',
      type: 'error',
      isVisible: true,
      persistent: true,
    });
  }
}
