// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// GitHub Pages (project pages) 用設定
export default defineConfig({
  site: 'https://project-ai-owner.github.io',
  base: '/aio-public',
  integrations: [
    starlight({
      title: 'AI Improvement OS 実践記録',
      description:
        '個人が制約下で AI エージェント運用基盤を設計・構築・改善した実践記録。失敗と改善過程を含めて公開する。',
      defaultLocale: 'root',
      locales: {
        root: { label: '日本語', lang: 'ja' },
      },
      sidebar: [
        { label: 'Home', link: '/' },
        { label: 'Overview', link: '/overview/' },
        { label: 'Architecture', link: '/architecture/' },
        { label: 'Decisions (ADR)', autogenerate: { directory: 'decisions' } },
        { label: 'Lessons Learned', autogenerate: { directory: 'lessons' } },
        { label: 'Current Status', link: '/status/' },
        { label: 'Development Log', autogenerate: { directory: 'log' } },
      ],
      customCss: [],
      // 過剰な JS を避ける: Starlight 既定（静的 HTML + 最小限のナビゲーション JS）のまま
    }),
  ],
});
