import { Component, inject, signal, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { RemainingRace } from '@shared/types';
import { NavigationService } from '../../core/services/navigation.service';

@Component({
  selector: 'app-remaining-race-list',
  standalone: true,
  template: `
    <div class="fixed inset-0 bg-cover bg-center bg-no-repeat -z-10"
         style="background-image: url('/image/backgroundFile/remaining-race-list.png')"></div>
    <div class="min-h-screen p-6">
    @if (loading()) {
      <div class="min-h-full flex justify-center items-center">
        <p class="text-gray-300 text-xl">読み込み中...</p>
      </div>
    } @else {
      <div class="overflow-x-auto bg-black/30 backdrop-blur-sm rounded-xl shadow-lg border border-white/20">
        <table class="table-auto w-full border-collapse">
          <!-- ヘッダー -->
          <thead class="sticky top-0">
            <tr>
              <th class="border border-white/20 px-2 py-2 bg-black/60 text-white">処理</th>
              <th colspan="2" class="border border-white/20 px-2 py-2 bg-black/60 text-white">情報</th>
              <th colspan="4" class="border border-white/20 px-2 py-2 bg-green-500 text-white">芝</th>
              <th colspan="3" class="border border-white/20 px-2 py-2 bg-red-500 text-white">ダート</th>
            </tr>
            <tr>
              <th class="border border-white/20 px-2 py-2 w-20 bg-black/50 text-white">パターン</th>
              <th class="border border-white/20 px-2 py-2 w-24 bg-black/50 text-white">ウマ娘</th>
              <th class="border border-white/20 px-2 py-2 w-16 bg-black/50 text-white">総数</th>
              <th class="border border-white/20 px-2 py-2 w-16 bg-green-600/70 text-white">短距離</th>
              <th class="border border-white/20 px-2 py-2 w-16 bg-green-600/70 text-white">マイル</th>
              <th class="border border-white/20 px-2 py-2 w-16 bg-green-600/70 text-white">中距離</th>
              <th class="border border-white/20 px-2 py-2 w-16 bg-green-600/70 text-white">長距離</th>
              <th class="border border-white/20 px-2 py-2 w-16 bg-red-600/70 text-white">短距離</th>
              <th class="border border-white/20 px-2 py-2 w-16 bg-red-600/70 text-white">マイル</th>
              <th class="border border-white/20 px-2 py-2 w-16 bg-red-600/70 text-white">中距離</th>
            </tr>
          </thead>
          <tbody>
            @for (r of remainingRaces(); track r.umamusume.umamusume_id) {
              <tr class="hover:bg-white/10">
                <!-- パターンボタン -->
                <td class="border border-white/20 px-1 py-2 text-center">
                  @if (r.isAllCrown) {
                    <span class="font-bold text-yellow-400">全冠</span>
                  } @else {
                    <button
                      class="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-400 cursor-pointer"
                      (click)="openPattern(r)"
                    >パターン</button>
                  }
                </td>
                <!-- ウマ娘名 + 画像 -->
                <td class="border border-white/20 px-1 py-2 text-center">
                  <div class="p-1 bg-gradient-to-b from-green-400 to-green-100 rounded-lg shadow-md w-16 h-16 mx-auto mb-1">
                    <div
                      class="w-full h-full rounded-md bg-gray-100 bg-cover bg-center"
                      [style.background-image]="'url(/image/umamusumeData/' + r.umamusume.umamusume_name + '.png)'"
                    ></div>
                  </div>
                  <span class="text-pink-300 font-bold text-xs">{{ r.umamusume.umamusume_name }}</span>
                </td>
                <!-- 総数 -->
                <td class="border border-white/20 px-1 py-2 text-center">
                  <span [class]="getRaceCountClass(r.allCrownRace)">
                    {{ getRaceCountDisplay(r.allCrownRace) }}
                  </span>
                </td>
                <!-- 芝: 短距離/マイル/中距離/長距離 -->
                <td class="border border-white/20 px-1 py-2 text-center">
                  <span [class]="getRaceCountClass(r.turfSprintRace)">{{ getRaceCountDisplay(r.turfSprintRace) }}</span>
                </td>
                <td class="border border-white/20 px-1 py-2 text-center">
                  <span [class]="getRaceCountClass(r.turfMileRace)">{{ getRaceCountDisplay(r.turfMileRace) }}</span>
                </td>
                <td class="border border-white/20 px-1 py-2 text-center">
                  <span [class]="getRaceCountClass(r.turfClassicRace)">{{ getRaceCountDisplay(r.turfClassicRace) }}</span>
                </td>
                <td class="border border-white/20 px-1 py-2 text-center">
                  <span [class]="getRaceCountClass(r.turfLongDistanceRace)">{{ getRaceCountDisplay(r.turfLongDistanceRace) }}</span>
                </td>
                <!-- ダート: 短距離/マイル/中距離 -->
                <td class="border border-white/20 px-1 py-2 text-center">
                  <span [class]="getRaceCountClass(r.dirtSprintDistanceRace)">{{ getRaceCountDisplay(r.dirtSprintDistanceRace) }}</span>
                </td>
                <td class="border border-white/20 px-1 py-2 text-center">
                  <span [class]="getRaceCountClass(r.dirtMileRace)">{{ getRaceCountDisplay(r.dirtMileRace) }}</span>
                </td>
                <td class="border border-white/20 px-1 py-2 text-center">
                  <span [class]="getRaceCountClass(r.dirtClassicRace)">{{ getRaceCountDisplay(r.dirtClassicRace) }}</span>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
    </div>
  `,
})
/** 残レース一覧を表示するコンポーネント */
export class RemainingRaceListComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly navService = inject(NavigationService);

  /** 残レース情報の一覧 */
  remainingRaces = signal<RemainingRace[]>([]);
  /** データ読み込み中フラグ */
  loading = signal(true);

  /** コンポーネント初期化時に残レース情報を取得する */
  ngOnInit() {
    this.fetchRemainingRaces();
  }

  /**
   * APIから残レース情報を取得してシグナルにセットする
   */
  private fetchRemainingRaces() {
    this.loading.set(true);
    this.http
      .get<RemainingRace[]>(`${environment.apiUrl}/races/remaining`)
      .subscribe({
        next: (data) => {
          this.remainingRaces.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Failed to fetch remaining races:', err);
          this.loading.set(false);
        },
      });
  }

  /**
   * パターン画面に遷移する
   * @param r - 対象の残レース情報
   */
  openPattern(r: RemainingRace) {
    this.navService.navigate({ page: 'remaining-race-pattern', umamusumeId: r.umamusume.umamusume_id });
  }

  /**
   * 残レース数に応じたTailwindCSSクラスを返す
   * @param count - 残レース数
   * @returns CSSクラス文字列（0=王冠色, 1-2=緑, それ以上=赤）
   */
  getRaceCountClass(count: number): string {
    if (count === 0) return 'text-yellow-500 text-2xl font-bold';
    if (count <= 2) return 'text-green-600 text-xl font-bold';
    return 'text-red-600 text-xl font-bold';
  }

  /**
   * 残レース数の表示文字列を返す
   * @param count - 残レース数
   * @returns 0の場合は王冠絵文字、それ以外は数値文字列
   */
  getRaceCountDisplay(count: number): string {
    return count === 0 ? '\uD83D\uDC51' : count.toString();
  }
}
