import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService, FactCheckResult } from './services/gemini.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class AppComponent {
  private readonly geminiService = inject(GeminiService);

  llmResponse = signal<string>('');
  knowledgeBase = signal<string>('');
  isChecking = signal<boolean>(false);
  checkResult = signal<FactCheckResult[] | null>(null);
  error = signal<string | null>(null);
  
  exampleLlmResponse = `当社の主力製品「QuantumLeap」は、AIによるデータ分析を自動化するクラウドサービスです。主な機能として、リアルタイムでの異常検知、将来予測、そして自然言語でのレポート生成が挙げられます。さらに、月面でのデータセンター運用もサポートしています。`;
  exampleKnowledgeBase = `【社内資料：QuantumLeap製品概要】
製品名: QuantumLeap
カテゴリ: AI搭載型データ分析クラウドプラットフォーム
提供形態: SaaS
主な機能:
1. リアルタイム異常検知: ストリーミングデータを監視し、異常パターンを即座に特定します。
2. 将来予測モデリング: 過去のデータに基づき、高精度な需要予測やトレンド分析を実行します。
3. 自動レポート生成: 分析結果を自然言語のレポートとして自動で作成し、関係者へ配信します。
提供環境: 主要なパブリッククラウド（AWS, Azure, GCP）上で利用可能です。`;

  loadExample(): void {
    this.llmResponse.set(this.exampleLlmResponse);
    this.knowledgeBase.set(this.exampleKnowledgeBase);
    this.checkResult.set(null);
    this.error.set(null);
  }

  async performFactCheck(): Promise<void> {
    if (!this.llmResponse() || !this.knowledgeBase() || this.isChecking()) {
      return;
    }

    this.isChecking.set(true);
    this.checkResult.set(null);
    this.error.set(null);

    try {
      const result = await this.geminiService.factCheck(this.llmResponse(), this.knowledgeBase());
      this.checkResult.set(result);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : '不明なエラーが発生しました。';
      this.error.set(errorMessage);
    } finally {
      this.isChecking.set(false);
    }
  }

  onLlmResponseInput(event: Event): void {
    this.llmResponse.set((event.target as HTMLTextAreaElement).value);
  }

  onKnowledgeBaseInput(event: Event): void {
    this.knowledgeBase.set((event.target as HTMLTextAreaElement).value);
  }
}
