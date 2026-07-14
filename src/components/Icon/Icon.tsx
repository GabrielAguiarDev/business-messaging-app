import React from 'react';

import Svg, {Circle, Path, Rect} from 'react-native-svg';

import {useAppTheme} from '@hooks';
import {ThemeColors} from '@theme';

export type IconName =
  | 'back'
  | 'bell'
  | 'bellOff'
  | 'camera'
  | 'chat'
  | 'check'
  | 'chevronRight'
  | 'chevronUp'
  | 'close'
  | 'doubleCheck'
  | 'dots'
  | 'file'
  | 'headset'
  | 'image'
  | 'lock'
  | 'megaphone'
  | 'mic'
  | 'modules'
  | 'newChat'
  | 'pause'
  | 'paperclip'
  | 'person'
  | 'pin'
  | 'play'
  | 'plus'
  | 'poll'
  | 'search'
  | 'send'
  | 'settings'
  | 'trash';

export interface IconProps {
  name: IconName;
  size?: number;
  color?: keyof ThemeColors;
}

/**
 * Ícones centrais do app — paths extraídos do design (handoff).
 * Todos desenhados em viewBox 24x24, cor via tema (nome semântico).
 */
export function Icon({name, size = 24, color = 'text'}: IconProps) {
  const {colors} = useAppTheme();
  const c = colors[color];

  const icons: Record<IconName, React.JSX.Element> = {
    back: (
      <Path
        d="M15 4.5 7.5 12l7.5 7.5"
        stroke={c}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
    chevronRight: (
      <Path
        d="M9 5l7 7-7 7"
        stroke={c}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
    chevronUp: (
      <Path
        d="M5 15l7-7 7 7"
        stroke={c}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
    lock: (
      <>
        <Rect x={5.5} y={11} width={13} height={9.5} rx={2.6} stroke={c} strokeWidth={1.9} />
        <Path
          d="M8 11V8a4 4 0 018 0v3"
          stroke={c}
          strokeWidth={1.9}
          strokeLinecap="round"
        />
        <Circle cx={12} cy={15.5} r={1.4} fill={c} />
      </>
    ),
    play: <Path d="M7 4.5v15l13-7.5-13-7.5z" fill={c} />,
    pause: (
      <>
        <Rect x={6.5} y={4.5} width={4} height={15} rx={1.2} fill={c} />
        <Rect x={13.5} y={4.5} width={4} height={15} rx={1.2} fill={c} />
      </>
    ),
    close: (
      <Path
        d="M6 6l12 12M18 6L6 18"
        stroke={c}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
    ),
    image: (
      <>
        <Rect x={3} y={5} width={18} height={14} rx={3} stroke={c} strokeWidth={1.8} />
        <Circle cx={8.5} cy={9.8} r={1.6} fill={c} />
        <Path
          d="M5.5 17l4-4.2 3 3 3-3.4 3.5 4"
          stroke={c}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
    file: (
      <>
        <Path
          d="M6.5 3h7l4.5 4.5V21h-11.5V3z"
          stroke={c}
          strokeWidth={1.8}
          strokeLinejoin="round"
        />
        <Path d="M13.5 3v4.5H18" stroke={c} strokeWidth={1.8} strokeLinejoin="round" />
      </>
    ),
    pin: (
      <>
        <Path
          d="M12 21s-6.5-5.2-6.5-10a6.5 6.5 0 0113 0C18.5 15.8 12 21 12 21z"
          stroke={c}
          strokeWidth={1.8}
          strokeLinejoin="round"
        />
        <Circle cx={12} cy={11} r={2.3} stroke={c} strokeWidth={1.8} />
      </>
    ),
    person: (
      <>
        <Circle cx={12} cy={8} r={3.4} stroke={c} strokeWidth={1.9} />
        <Path
          d="M5.5 20c.8-3.4 3.4-5.2 6.5-5.2s5.7 1.8 6.5 5.2"
          stroke={c}
          strokeWidth={1.9}
          strokeLinecap="round"
        />
      </>
    ),
    poll: (
      <Path
        d="M6 20v-8M12 20V4M18 20v-5"
        stroke={c}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
    ),
    plus: (
      <Path
        d="M12 4v16M4 12h16"
        stroke={c}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
    ),
    search: (
      <>
        <Circle cx={10.5} cy={10.5} r={7} stroke={c} strokeWidth={1.9} />
        <Path
          d="m15.8 15.8 4.7 4.7"
          stroke={c}
          strokeWidth={1.9}
          strokeLinecap="round"
        />
      </>
    ),
    chat: (
      <Path
        d="M4 5h16v11H9l-4 4V5z"
        stroke={c}
        strokeWidth={1.9}
        strokeLinejoin="round"
      />
    ),
    newChat: (
      <>
        <Path
          d="M4 5h13v9H9l-4 4V5z"
          stroke={c}
          strokeWidth={1.9}
          strokeLinejoin="round"
        />
        <Path d="M18 3v6M15 6h6" stroke={c} strokeWidth={1.9} strokeLinecap="round" />
      </>
    ),
    modules: (
      <>
        <Circle cx={8.5} cy={8} r={3} stroke={c} strokeWidth={1.9} />
        <Path
          d="M2.5 19c0-3 2.7-5 6-5s6 2 6 5"
          stroke={c}
          strokeWidth={1.9}
          strokeLinecap="round"
        />
        <Path
          d="M16 6.4a2.8 2.8 0 010 5.2M18.6 18.6c-.2-1.9-1.1-3.3-2.5-4.1"
          stroke={c}
          strokeWidth={1.9}
          strokeLinecap="round"
        />
      </>
    ),
    headset: (
      <>
        <Path
          d="M5 13v-1a7 7 0 0114 0v1"
          stroke={c}
          strokeWidth={1.9}
          strokeLinecap="round"
        />
        <Rect x={2.6} y={12.5} width={3.8} height={7} rx={1.9} stroke={c} strokeWidth={1.9} />
        <Rect x={17.6} y={12.5} width={3.8} height={7} rx={1.9} stroke={c} strokeWidth={1.9} />
        <Path
          d="M19.5 19.5v.4a3 3 0 01-3 3H14"
          stroke={c}
          strokeWidth={1.9}
          strokeLinecap="round"
        />
      </>
    ),
    settings: (
      <>
        <Circle cx={12} cy={12} r={3.2} stroke={c} strokeWidth={1.9} />
        <Path
          d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"
          stroke={c}
          strokeWidth={1.9}
          strokeLinecap="round"
        />
      </>
    ),
    dots: (
      <>
        <Circle cx={5} cy={12} r={2.3} fill={c} />
        <Circle cx={12} cy={12} r={2.3} fill={c} />
        <Circle cx={19} cy={12} r={2.3} fill={c} />
      </>
    ),
    mic: (
      <>
        <Rect x={9} y={3} width={6} height={11} rx={3} fill={c} />
        <Path
          d="M5 11a7 7 0 0014 0M12 18v3"
          stroke={c}
          strokeWidth={1.8}
          strokeLinecap="round"
        />
      </>
    ),
    send: (
      <Path
        d="M12 20V5M6 11l6-6 6 6"
        stroke={c}
        strokeWidth={2.3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
    camera: (
      <>
        <Rect x={3} y={7} width={18} height={13} rx={3} stroke={c} strokeWidth={1.8} />
        <Circle cx={12} cy={13} r={3.2} stroke={c} strokeWidth={1.8} />
        <Path d="M8 7l1.5-2h5L16 7" stroke={c} strokeWidth={1.8} />
      </>
    ),
    paperclip: (
      <Path
        d="M20 11l-8 8a5 5 0 01-7-7l8-8a3.5 3.5 0 015 5l-8 8a2 2 0 01-3-3l7-7"
        stroke={c}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
    check: (
      <Path
        d="M5 13l4 4 10-10"
        stroke={c}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
    doubleCheck: (
      <>
        <Path
          d="M2 13l4 4 8.5-9.5"
          stroke={c}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M11 16.2l1.5 1.8L21 8.5"
          stroke={c}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
    bell: (
      <>
        <Path
          d="M18 15.5v-5a6 6 0 10-12 0v5L4.5 18h15L18 15.5z"
          stroke={c}
          strokeWidth={1.9}
          strokeLinejoin="round"
        />
        <Path
          d="M10 21a2.2 2.2 0 004 0"
          stroke={c}
          strokeWidth={1.9}
          strokeLinecap="round"
        />
      </>
    ),
    bellOff: (
      <>
        <Path d="M4 9v6h4l5 4V5L8 9H4z" fill={c} />
        <Path
          d="M17 8l5 8M22 8l-5 8"
          stroke={c}
          strokeWidth={1.8}
          strokeLinecap="round"
        />
      </>
    ),
    trash: (
      <>
        <Path
          d="M4.5 6.5h15M9.5 6.5V4.5h5v2M7 6.5l1 14h8l1-14"
          stroke={c}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M10.2 10.5v6.5M13.8 10.5v6.5"
          stroke={c}
          strokeWidth={1.8}
          strokeLinecap="round"
        />
      </>
    ),
    megaphone: (
      <>
        <Path d="M3 10v4h3l6 4V6L6 10H3z" fill={c} />
        <Path
          d="M16 9c1.6 1.2 1.6 4.8 0 6"
          stroke={c}
          strokeWidth={1.8}
          strokeLinecap="round"
        />
      </>
    ),
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {icons[name]}
    </Svg>
  );
}
