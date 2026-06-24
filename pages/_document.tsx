import { Html, Head, Main, NextScript } from 'next/document'

// Apply the theme attribute before first paint so the initial frame already matches the user's
// stored/system preference. Without this, the static-export HTML renders with the default (dark)
// theme and only switches once ThemeProvider mounts, causing a visible dark->light flash (FOUC)
// for light-mode users. Mirrors the resolution logic in components/ThemeProvider.tsx.
const themeScript = `(function(){try{var k='parinum-theme';var s=window.localStorage.getItem(k);var t=(s==='light'||s==='dark')?s:((window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light');var d=document.documentElement;d.dataset.theme=t;d.style.colorScheme=t;}catch(e){}})();`

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
