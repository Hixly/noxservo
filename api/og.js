import { ImageResponse } from '@vercel/og'

export const config = { runtime: 'edge' }

const P = 18
const N_PIXELS = [
  [0,0],[5,0],
  [0,1],[1,1],[5,1],
  [0,2],[1,2],[5,2],
  [0,3],[2,3],[5,3],
  [0,4],[3,4],[5,4],
  [0,5],[3,5],[5,5],
  [0,6],[4,6],[5,6],
  [0,7],[5,7],
]
const N_W = 6 * P
const N_H = 8 * P

export default async function handler() {
  // Load Press Start 2P from Google Fonts
  const css = await fetch(
    'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap',
    { headers: { 'User-Agent': 'Mozilla/5.0 (compatible)' } }
  ).then(r => r.text())

  const fontUrl = css.match(/src: url\(([^)]+)\) format/)?.[1]
  const fontData = fontUrl
    ? await fetch(fontUrl).then(r => r.arrayBuffer())
    : null

  return new ImageResponse(
    {
      type: 'div',
      props: {
        style: {
          width: '1200px',
          height: '630px',
          background: '#000000',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: fontData ? 'PressStart2P' : '"Courier New", monospace',
          position: 'relative',
        },
        children: [
          // Border frame
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                top: '32px', right: '32px', bottom: '32px', left: '32px',
                border: '1px solid #111111',
                display: 'flex',
              },
            },
          },

          // Pixel-art N
          {
            type: 'div',
            props: {
              style: {
                position: 'relative',
                width: `${N_W}px`,
                height: `${N_H}px`,
                marginBottom: '40px',
                display: 'flex',
                flexShrink: 0,
              },
              children: N_PIXELS.map(([col, row]) => ({
                type: 'div',
                props: {
                  style: {
                    position: 'absolute',
                    left: `${col * P}px`,
                    top: `${row * P}px`,
                    width: `${P - 2}px`,
                    height: `${P - 2}px`,
                    background: '#c8c8c8',
                  },
                },
              })),
            },
          },

          // NOXSERVO in Press Start 2P
          {
            type: 'div',
            props: {
              style: {
                fontSize: '52px',
                color: '#c8c8c8',
                letterSpacing: '8px',
                lineHeight: 1,
                marginBottom: '28px',
              },
              children: 'NOXSERVO',
            },
          },

          // Divider
          {
            type: 'div',
            props: {
              style: {
                width: '420px',
                height: '1px',
                background: '#1a1a1a',
                marginBottom: '24px',
              },
            },
          },

          // Tagline
          {
            type: 'div',
            props: {
              style: {
                fontSize: '14px',
                color: '#2e2e2e',
                letterSpacing: '6px',
              },
              children: 'search quietly.',
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      headers: { 'Cache-Control': 'no-store, must-revalidate' },
      fonts: fontData ? [{
        name: 'PressStart2P',
        data: fontData,
        style: 'normal',
      }] : [],
    }
  )
}
