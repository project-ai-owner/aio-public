// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// ```mermaid フェンスを描画用の <pre class="mermaid"> へ変換する remark プラグイン。
// 依存追加を避けるため unist-util-visit を使わず手動走査する。
function remarkMermaid() {
  const esc = (s) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const walk = (node) => {
    if (!node || !Array.isArray(node.children)) return;
    for (const child of node.children) {
      if (child.type === 'code' && child.lang === 'mermaid') {
        child.type = 'html';
        child.value = `<pre class="mermaid">${esc(child.value)}</pre>`;
        delete child.lang;
        delete child.meta;
      } else {
        walk(child);
      }
    }
  };
  return (tree) => walk(tree);
}

// 図があるページでだけ Mermaid を CDN から動的 import して描画する（他ページには JS を足さない）。
const mermaidHead = `
if (document.querySelector('pre.mermaid')) {
  const { default: mermaid } = await import('https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs');
  const dark = document.documentElement.dataset.theme === 'dark'
    || matchMedia('(prefers-color-scheme: dark)').matches;
  mermaid.initialize({ startOnLoad: false, theme: dark ? 'dark' : 'default', securityLevel: 'strict' });
  await mermaid.run({ querySelector: 'pre.mermaid' });
}
`;

// GitHub Pages (project pages) 用設定
export default defineConfig({
  site: 'https://project-ai-owner.github.io',
  base: '/aio-public',
  markdown: {
    remarkPlugins: [remarkMermaid],
  },
  integrations: [
    starlight({
      title: 'AI Improvement OS 実践記録',
      description:
        '個人が制約下で AI エージェント運用基盤を設計・構築・改善した実践記録。失敗と改善過程を含めて公開する。',
      defaultLocale: 'root',
      locales: {
        root: { label: '日本語', lang: 'ja' },
      },
      head: [
        { tag: 'script', attrs: { type: 'module' }, content: mermaidHead },
      ],
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
      // 過剰な JS を避ける: 図のあるページのみ Mermaid を動的 import（他は静的 HTML のまま）
    }),
  ],
});
