import { Component, inject, signal, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../environments/environment';
import { Race } from '@shared/types';

@Component({
  selector: 'app-race-list',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="fixed inset-0 bg-cover bg-center bg-no-repeat -z-10"
         style="background-image: url('/image/backgroundFile/race-list.png')"></div>
    <div class="min-h-screen p-6 flex flex-col gap-4">
      @if (loading()) {
        <div class="flex justify-center items-center h-64">
          <p class="text-gray-500 text-xl">読み込み中...</p>
        </div>
      } @else {
        <!-- フィルタ -->
        <div class="flex gap-4 items-center flex-shrink-0">
          <div>
            <label class="font-semibold mr-2 text-white drop-shadow">馬場</label>
            <select [(ngModel)]="selectedState" (ngModelChange)="fetchRaces()" class="border rounded p-2">
              <option [ngValue]="-1">すべて</option>
              <option [ngValue]="0">芝</option>
              <option [ngValue]="1">ダート</option>
            </select>
          </div>
          <div>
            <label class="font-semibold mr-2 text-white drop-shadow">距離</label>
            <select [(ngModel)]="selectedDistance" (ngModelChange)="fetchRaces()" class="border rounded p-2">
              <option [ngValue]="-1">すべて</option>
              <option [ngValue]="1">短距離</option>
              <option [ngValue]="2">マイル</option>
              <option [ngValue]="3">中距離</option>
              <option [ngValue]="4">長距離</option>
            </select>
          </div>
          <div class="ml-auto text-sm text-white drop-shadow">全{{ races().length }}件</div>
        </div>

        <!-- 4列グリッド -->
        <div class="grid grid-cols-4 gap-4">
          @for (race of races(); track race.race_id) {
            <div
              class="cursor-pointer rounded-xl overflow-hidden shadow-md transition-all duration-150
                     hover:scale-105 hover:shadow-xl border-2 border-white/20 bg-black/50 flex flex-col"
              (click)="openDialog(race)"
            >
              <!-- レース画像 -->
              <div class="p-2 relative">
                <div [class]="gradeBg(race.race_rank) + ' p-1.5 rounded-xl shadow-md'">
                  <div
                    class="w-full aspect-video rounded-lg bg-white bg-contain bg-center bg-no-repeat"
                    [style.background-image]="'url(/image/raceData/' + race.race_name + '.png)'"
                  ></div>
                </div>
                <!-- グレードバッジ -->
                <span [class]="gradeBadge(race.race_rank) + ' absolute top-3 right-3 text-xs font-black px-1.5 py-0.5 rounded shadow'">
                  {{ getRaceRank(race.race_rank) }}
                </span>
              </div>
              <!-- レース名 -->
              <div class="text-white text-sm text-center font-semibold py-1.5 px-2 bg-black/60 truncate">
                {{ race.race_name }}
              </div>
            </div>
          }
        </div>
      }
    </div>

    <!-- 詳細ダイアログ (オーバーレイ) -->
    @if (selectedRace()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        (click)="closeDialog()"
      >
        <div
          class="relative bg-white/95 rounded-2xl shadow-2xl p-6 w-96 mx-4 flex flex-col items-center gap-4"
          (click)="$event.stopPropagation()"
        >
          <!-- 閉じるボタン -->
          <button
            class="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-2xl font-bold
                   w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
            (click)="closeDialog()"
          >
            ×
          </button>

          <!-- グレードバッジ -->
          <span [class]="gradeBadge(selectedRace()!.race_rank) + ' text-sm font-black px-4 py-1 rounded-full shadow'">
            {{ getRaceRank(selectedRace()!.race_rank) }}
          </span>

          <!-- レース画像 -->
          <div [class]="gradeBg(selectedRace()!.race_rank) + ' p-2 rounded-xl shadow-lg w-full'">
            <div
              class="w-full aspect-video rounded-lg bg-white bg-contain bg-center bg-no-repeat"
              [style.background-image]="'url(/image/raceData/' + selectedRace()!.race_name + '.png)'"
            ></div>
          </div>

          <!-- レース名 -->
          <h2 class="text-xl font-black text-gray-800 text-center">{{ selectedRace()!.race_name }}</h2>

          <!-- 詳細情報 -->
          <div class="w-full space-y-2">
            <div class="flex items-center gap-2 px-2 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
              <span class="text-xs font-bold text-gray-500 w-20 flex-shrink-0">馬場</span>
              <span class="text-sm font-semibold text-gray-700">{{ selectedRace()!.race_state ? 'ダート' : '芝' }}</span>
            </div>
            <div class="flex items-center gap-2 px-2 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
              <span class="text-xs font-bold text-gray-500 w-20 flex-shrink-0">距離</span>
              <span class="text-sm font-semibold text-gray-700">
                {{ getDistance(selectedRace()!.distance) }}{{ selectedRace()!.distance_detail ? ' / ' + selectedRace()!.distance_detail + 'm' : '' }}
              </span>
            </div>
            <div class="flex items-center gap-2 px-2 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
              <span class="text-xs font-bold text-gray-500 w-20 flex-shrink-0">獲得ファン数</span>
              <span class="text-sm font-semibold text-gray-700">{{ selectedRace()!.num_fans }}</span>
            </div>
            <div class="flex items-center gap-2 px-2 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
              <span class="text-xs font-bold text-gray-500 w-20 flex-shrink-0">出走時期</span>
              <span class="text-sm font-semibold text-gray-700">{{ getRunSeason(selectedRace()!) }}</span>
            </div>
            <div class="flex items-center gap-2 px-2 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
              <span class="text-xs font-bold text-gray-500 w-20 flex-shrink-0">開催月</span>
              <span class="text-sm font-semibold text-gray-700">{{ selectedRace()!.race_months }}月{{ selectedRace()!.half_flag ? '後半' : '前半' }}</span>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
/** 馬場・距離フィルタ付きのG1〜G3レースをグリッド表示し、クリックで詳細を表示するコンポーネント */
export class RaceListComponent implements OnInit {
  private readonly http = inject(HttpClient);

  /** レース一覧 */
  races = signal<Race[]>([]);
  /** 読み込み中フラグ */
  loading = signal(true);
  /** 馬場フィルタ選択値（-1=全て） */
  selectedState = -1;
  /** 距離フィルタ選択値（-1=全て） */
  selectedDistance = -1;
  /** 詳細ダイアログで表示中のレース */
  selectedRace = signal<Race | null>(null);


  /** コンポーネント初期化時にレース一覧を取得する */
  ngOnInit() {
    this.fetchRaces();
  }

  /** フィルタ条件でレース一覧をAPIから取得する */
  fetchRaces() {
    this.loading.set(true);
    this.http
      .get<Race[]>(`${environment.apiUrl}/races`, {
        params: {
          state: this.selectedState.toString(),
          distance: this.selectedDistance.toString(),
        },
      })
      .subscribe({
        next: (data) => {
          this.races.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Failed to fetch races:', err);
          this.loading.set(false);
        },
      });
  }

  /** レースカードクリック時に詳細ダイアログを開く */
  openDialog(race: Race) {
    this.selectedRace.set(race);
  }

  /** 詳細ダイアログを閉じる */
  closeDialog() {
    this.selectedRace.set(null);
  }

  /** レースランク番号をGI/GII/GIIIに変換する */
  getRaceRank(rank: number): string {
    switch (rank) {
      case 1: return 'GI';
      case 2: return 'GII';
      case 3: return 'GIII';
      default: return '';
    }
  }

  /** グレードに対応する背景グラデーションクラスを返す */
  gradeBg(rank: number): string {
    switch (rank) {
      case 1: return 'bg-gradient-to-b from-amber-400 to-amber-100';
      case 2: return 'bg-gradient-to-b from-slate-400 to-slate-100';
      case 3: return 'bg-gradient-to-b from-orange-400 to-orange-100';
      default: return 'bg-gradient-to-b from-gray-300 to-gray-100';
    }
  }

  /** グレードに対応するバッジクラスを返す */
  gradeBadge(rank: number): string {
    switch (rank) {
      case 1: return 'bg-amber-400 text-white';
      case 2: return 'bg-slate-400 text-white';
      case 3: return 'bg-orange-400 text-white';
      default: return 'bg-gray-300 text-white';
    }
  }

  /** 距離区分番号を日本語名に変換する */
  getDistance(d: number): string {
    switch (d) {
      case 1: return '短距離';
      case 2: return 'マイル';
      case 3: return '中距離';
      case 4: return '長距離';
      default: return '';
    }
  }

  /** レースの出走可能時期を日本語スラッシュ区切りで返す */
  getRunSeason(race: Race): string {
    const parts: string[] = [];
    if (race.junior_flag) parts.push('ジュニア');
    if (race.classic_flag) parts.push('クラシック');
    if (race.senior_flag) parts.push('シニア');
    return parts.join(' / ');
  }
}