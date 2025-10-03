import { defineConfig } from 'vitepress'
import markdownItContainer from 'markdown-it-container'
import path from 'path'

export default defineConfig({
  title: 'EncolaJS Form Controller',
  description: 'Universal Form Controller for all web apps',
  base: '/form-controller/',
  themeConfig: {
    search: {
      provider: 'local',
    },
    editLink: {
      pattern:
        'https://github.com/encolajs/encolajs-form-controller/tree/main/docs/:path',
    },
    logo: '/logo.png',
    socialLinks: [
      { icon: 'github', link: 'https://github.com/encolajs/encolajs-form-controller' },
    ],
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Documentation', link: '/getting-started' },
      { text: 'More...',
        items: [
          {text: 'EncolaJS Enforma', link: 'https://encolajs.com/enforma/'},
          {text: 'EncolaJS Validator', link: 'https://encolajs.com/validator/'},
          {text: 'EncolaJS Hydrator', link: 'https://encolajs.com/hydrator/'},
        ]
      },
    ],
    sidebar: {
      '/': [
        { text: 'Overview', link: '/getting-started' },
        { text: 'Installation', link: '/installation' },
        { text: 'Quick Start', link: '/quick-start' },
        { text: 'FormController API', link: '/form-controller-api' },
        {
          text: 'Validation',
          link: '/validation/',
          items: [
            { text: 'Zod Adapter', link: '/validation/zod' },
            { text: 'Yup Adapter', link: '/validation/yup' },
            { text: 'Valibot Adapter', link: '/validation/valibot' },
            { text: 'Encola Adapter', link: '/validation/encola-validator' },
            { text: 'Using a Custom Validator', link: '/validation/custom-validator' },
          ],
        },
        {
          text: 'UI Integration Examples',
          link: '/ui-integration/',
          items: [
            { text: 'VueJS', link: '/ui-integration/vuejs' },
            { text: 'AlpineJS', link: '/ui-integration/alpinejs' },
            { text: 'Vanilla JS', link: '/ui-integration/vanilla-javascript' },
            { text: 'React (TBD)', link: '/ui-integration/react' },
            { text: 'Svelte (TBD)', link: '/ui-integration/svelte' },
            { text: 'SolidJS (TBD)', link: '/ui-integration/solidjs' },
          ],
        },
      ],
    },
    footer: {
      message: 'MIT Licensed',
      copyright:
        'Copyright © 2025-present EncolaJS & Contributors',
    },
  },
  markdown: {
    config(md) {
      // ::: Tabs
      md.use(markdownItContainer, 'Tabs', {
        render(tokens, idx) {
          const token = tokens[idx]
          return token.nesting === 1
            ? `<Tabs>\n`
            : `</Tabs>\n`
        },
      })

      // ::: Tab "Label"
      md.use(markdownItContainer, 'Tab', {
        validate(params) {
          return params.trim().match(/^Tab\s+(.*)$/)
        },
        render(tokens, idx) {
          const m = tokens[idx].info.trim().match(/^Tab\s+(.*)$/)
          if (tokens[idx].nesting === 1) {
            const label = m[1].replace(/"/g, '')
            const name = label.toLowerCase().replace(/\s+/g, '-')
            return `<Tab name="${name}" label="${label}">\n`
          } else {
            return '</Tab>\n'
          }
        },
      })
    },
  },
  head: [
    [
      'script',
      {
        src: 'https://cdn.tailwindcss.com/',
        async: true,
        defer: true
      }
    ],
    ['link', { rel: 'icon', href: '/form-controller/favicon.ico' }],
    [
      'script',
      {
        async: true,
        src: 'https://www.googletagmanager.com/gtag/js?id=G-4CP1E3Z3Q0',
      },
    ],
    [
      'script',
      {},
      "window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);};gtag('js', new Date());gtag('config', 'G-4CP1E3Z3Q0');",
    ],
  ],
  vite: {
    ssr: {
      noExternal: [/\.css$/, /^vuetify/]
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '../../src'),
      },
      extensions: ['.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
    },
  },
  vue: {
    template: {
      compilerOptions: {
        // Suppress the "Extraneous non-props attributes" warning
        warnExtraProps: false
      }
    }
  },
})