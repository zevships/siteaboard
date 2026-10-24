import type { ContentPost } from '../../../../../packages/core/src/content.ts';
/** Code-drawn fictional artwork; never fetches images, fonts or remote media. */
export function ContentArt({ kind, seed = 0 }: { kind: ContentPost['art']; seed?: number }) {
  const hue = (seed * 29) % 360;
  return (
    <svg
      className="content-art"
      viewBox="0 0 600 360"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <rect
        width="600"
        height="360"
        fill={
          kind === 'terminal'
            ? '#d8c9b2'
            : kind === 'landscape'
              ? '#bed6c3'
              : kind === 'shapes'
                ? '#f0f0fc'
                : kind === 'editor'
                  ? '#d5e2eb'
                  : kind === 'dashboard'
                    ? '#e9e4d9'
                    : '#edb692'
        }
      />
      {kind === 'terminal' ? (
        <>
          <ellipse cx="300" cy="330" rx="180" ry="14" fill="#b7a88f" />
          <path d="M155 35H445L460 280H140Z" fill="#d2c8b5" stroke="#a39880" strokeWidth="5" />
          <rect x="178" y="57" width="244" height="180" rx="20" fill="#1b2828" />
          <text x="196" y="90" fill="#8cc6a6" fontSize="14" fontFamily="monospace">
            $ hello, small internet
          </text>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect
              key={i}
              x="196"
              y={112 + i * 16}
              width={80 + ((i * 33 + seed * 9) % 145)}
              height="5"
              rx="2"
              fill={i % 2 ? '#809e93' : '#b6cbba'}
            />
          ))}
          <rect x="190" y="254" width="90" height="8" fill="#918b7c" />
          <path d="M140 290H460L500 332H100Z" fill="#e4daca" stroke="#aaa08d" strokeWidth="3" />
          {Array.from({ length: 16 }, (_, i) => (
            <rect
              key={i}
              x={133 + (i % 8) * 43}
              y={299 + Math.floor(i / 8) * 13}
              width="34"
              height="9"
              rx="2"
              fill="#b3aa99"
            />
          ))}
        </>
      ) : null}
      {kind === 'landscape' ? (
        <>
          <circle cx="470" cy="65" r="35" fill="#fff2bd" />
          <path d="M0 210L160 84 310 221 450 112 600 235V360H0Z" fill="#6f9d90" />
          <path d="M70 280L300 148 530 280 300 350Z" fill="#74a888" />
          <path d="M70 280L300 350V360L70 300Z" fill="#527b70" />
          <path d="M300 350L530 280V300L300 360Z" fill="#3e6d5d" />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <g key={i} transform={`translate(${150 + i * 46} ${190 + (i % 3) * 25})`}>
              <rect x="-3" y="35" width="6" height="30" fill="#665847" />
              <path d="M0 -20L-24 38H24ZM0 0L-30 50H30Z" fill={i % 2 ? '#356654' : '#477c58'} />
            </g>
          ))}
          <path d="M255 250L300 226 345 250 300 276Z" fill="#efe2a8" />
          <path d="M255 250V280L300 306V276Z" fill="#d4bf89" />
          <path d="M345 250V280L300 306V276Z" fill="#b59f70" />
        </>
      ) : null}
      {kind === 'shapes' ? (
        <>
          <rect x="178" y="80" width="65" height="200" rx="32" fill="#0c1220" />
          <rect
            x="268"
            y="80"
            width="65"
            height="200"
            rx="32"
            fill={`hsl(${220 + (hue % 70)} 90% 58%)`}
          />
          <rect x="358" y="80" width="65" height="200" rx="32" fill="#0c1220" />
          <circle cx="300" cy="321" r="4" fill="#9c9baf" />
        </>
      ) : null}
      {kind === 'editor' ? (
        <>
          <rect
            x="35"
            y="26"
            width="530"
            height="309"
            rx="12"
            fill="#f4f7f9"
            stroke="#a7b7c5"
            strokeWidth="2"
          />
          <path d="M35 60H565" stroke="#a7b7c5" />
          {[0, 1, 2].map((i) => (
            <circle
              key={i}
              cx={52 + i * 15}
              cy="43"
              r="4"
              fill={['#dd867a', '#e7c470', '#86bca0'][i]}
            />
          ))}
          <rect x="48" y="73" width="72" height="244" rx="4" fill="#e1e8ed" />
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x="59" y={90 + i * 33} width="47" height="6" rx="2" fill="#a7b7c5" />
          ))}
          <path
            d="M170 245Q245 90 305 180T460 130M180 260Q270 145 345 213T480 240"
            fill="none"
            stroke="#728da3"
            strokeWidth="3"
          />
          <circle
            cx="320"
            cy="180"
            r="68"
            fill="none"
            stroke="#9cb5c8"
            strokeWidth="2"
            strokeDasharray="5 5"
          />
          <rect x="350" y="272" width="158" height="30" rx="5" fill="#688d80" />
          <text x="429" y="292" textAnchor="middle" fill="white" fontSize="13">
            A small experiment
          </text>
        </>
      ) : null}
      {kind === 'dashboard' ? (
        <>
          <rect x="35" y="30" width="530" height="300" rx="14" fill="#fcfcf8" />
          <text x="61" y="66" fontSize="17" fill="#383e37">
            A little progress, every day
          </text>
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <rect
                x={60 + i * 162}
                y="88"
                width="148"
                height="70"
                rx="8"
                fill={['#e1ece4', '#e7e9f1', '#f5e9d9'][i]}
              />
              <text x={75 + i * 162} y="132" fontSize="25" fill="#303b38">
                {[128, 364, 72][i]}
              </text>
            </g>
          ))}
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
            <rect
              key={i}
              x={60 + i * 41}
              y={280 - ((35 + i * 7 + (seed % 5) * 4) % 110)}
              width="28"
              height={(35 + i * 7 + (seed % 5) * 4) % 110}
              rx="4"
              fill={i > 7 ? '#3f8777' : '#a4c8bc'}
            />
          ))}
          <path d="M60 281H536" stroke="#d5ddd4" />
        </>
      ) : null}
      {kind === 'type' ? (
        <>
          <text x="55" y="100" fontSize="24" fill="#724b3a" fontFamily="serif">
            FIELD NOTES / 0{(seed % 9) + 1}
          </text>
          <text x="50" y="185" fontSize="70" fill="#352d2c" fontFamily="Georgia, serif">
            Make it small.
          </text>
          <text x="50" y="255" fontSize="70" fill="#352d2c" fontFamily="Georgia, serif">
            Make it yours.
          </text>
          <path d="M55 293H545" stroke="#9f735c" />
          <circle cx="525" cy="70" r="22" fill="#6b8d78" />
        </>
      ) : null}
    </svg>
  );
}
