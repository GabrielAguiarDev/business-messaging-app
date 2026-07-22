import React, {useCallback, useReducer, useRef} from 'react';

import {
  StyleSheet,
  Text as RNText,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import {
  GestureDetector,
  usePanGesture,
  usePinchGesture,
  useSimultaneousGestures,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import Svg, {Path} from 'react-native-svg';
import {scheduleOnRN} from 'react-native-worklets';

/** Traço de desenho já concluído (uma passada do dedo). */
export interface DrawPath {
  id: string;
  d: string;
  color: string;
  width: number;
}

/** Texto sobreposto à foto, arrastável dentro do frame. */
export interface TextItem {
  id: string;
  text: string;
  /** Canto superior-esquerdo, em coordenadas do frame exibido. */
  x: number;
  y: number;
  color: string;
  fontSize: number;
}

/** Retângulo do corte, em coordenadas do frame exibido. */
export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Área da imagem exibida (contain) dentro do container, em pontos. */
export interface Frame {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Paleta de cores para desenho/texto (estilo WhatsApp). */
export const EDITOR_COLORS = [
  '#FFFFFF',
  '#000000',
  '#FF3B30',
  '#FF9500',
  '#FFD60A',
  '#34C759',
  '#0A84FF',
  '#BF5AF2',
];

export const DRAW_STROKE_WIDTH = 5;
export const DEFAULT_TEXT_SIZE = 30;

function clamp(value: number, min: number, max: number) {
  'worklet';
  return Math.min(Math.max(value, min), max);
}

/** id simples suficiente para itens efêmeros de edição. */
let seq = 0;
export function editorId() {
  seq += 1;
  return `ed_${seq}`;
}

// ───────────────────────────── Desenho ─────────────────────────────

interface DrawingLayerProps {
  frame: Frame;
  color: string;
  paths: DrawPath[];
  onAddPath: (path: DrawPath) => void;
}

/**
 * Camada de desenho: renderiza os traços já feitos (SVG) e captura o
 * arrasto do dedo para compor o traço atual. Fica DENTRO da view capturada
 * pelo view-shot, então os traços são achatados na imagem final.
 */
export function DrawingLayer({frame, color, paths, onAddPath}: DrawingLayerProps) {
  const dRef = useRef('');
  const [, force] = useReducer((c: number) => c + 1, 0);

  const begin = useCallback((x: number, y: number) => {
    dRef.current = `M ${Math.round(x)} ${Math.round(y)}`;
    force();
  }, []);

  const extend = useCallback((x: number, y: number) => {
    if (!dRef.current) {
      dRef.current = `M ${Math.round(x)} ${Math.round(y)}`;
    } else {
      dRef.current += ` L ${Math.round(x)} ${Math.round(y)}`;
    }
    force();
  }, []);

  const end = useCallback(() => {
    const d = dRef.current;
    dRef.current = '';
    force();
    if (d.includes('L')) {
      onAddPath({id: editorId(), d, color, width: DRAW_STROKE_WIDTH});
    }
  }, [onAddPath, color]);

  const pan = usePanGesture({
    minDistance: 0,
    onBegin: e => {
      'worklet';
      scheduleOnRN(begin, e.x, e.y);
    },
    onUpdate: e => {
      'worklet';
      scheduleOnRN(extend, e.x, e.y);
    },
    onFinalize: () => {
      'worklet';
      scheduleOnRN(end);
    },
  });

  return (
    <GestureDetector gesture={pan}>
      <View style={StyleSheet.absoluteFill}>
        <Svg
          width={frame.width}
          height={frame.height}
          pointerEvents="none">
          {paths.map(p => (
            <Path
              key={p.id}
              d={p.d}
              stroke={p.color}
              strokeWidth={p.width}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {dRef.current ? (
            <Path
              d={dRef.current}
              stroke={color}
              strokeWidth={DRAW_STROKE_WIDTH}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}
        </Svg>
      </View>
    </GestureDetector>
  );
}

// ───────────────────────────── Texto ─────────────────────────────

interface DraggableTextProps {
  item: TextItem;
  frame: Frame;
  editable: boolean;
  onChangePos: (x: number, y: number) => void;
}

/** Texto sobreposto arrastável (mantido dentro do frame). */
export function DraggableText({
  item,
  frame,
  editable,
  onChangePos,
}: DraggableTextProps) {
  const tx = useSharedValue(item.x);
  const ty = useSharedValue(item.y);
  const startX = useSharedValue(item.x);
  const startY = useSharedValue(item.y);
  const scale = useSharedValue(1);
  const startScale = useSharedValue(1);

  const pan = usePanGesture({
    enabled: editable,
    minDistance: 0,
    onBegin: () => {
      'worklet';
      startX.value = tx.value;
      startY.value = ty.value;
    },
    onUpdate: e => {
      'worklet';
      tx.value = clamp(startX.value + e.translationX, 0, frame.width - 24);
      ty.value = clamp(startY.value + e.translationY, 0, frame.height - 24);
    },
    onFinalize: () => {
      'worklet';
      scheduleOnRN(onChangePos, tx.value, ty.value);
    },
  });

  // pinça = tamanho do texto (o scale é achatado na imagem ao confirmar)
  const pinch = usePinchGesture({
    enabled: editable,
    onBegin: () => {
      'worklet';
      startScale.value = scale.value;
    },
    onUpdate: e => {
      'worklet';
      scale.value = clamp(startScale.value * e.scale, 0.4, 6);
    },
  });

  const gesture = useSimultaneousGestures(pan, pinch);

  const style = useAnimatedStyle(() => ({
    transform: [
      {translateX: tx.value},
      {translateY: ty.value},
      {scale: scale.value},
    ],
  }));

  const textStyle: TextStyle = {
    color: item.color,
    fontSize: item.fontSize,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 4,
  };

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[$textWrap, style]}>
        <RNText style={textStyle}>{item.text}</RNText>
      </Animated.View>
    </GestureDetector>
  );
}

// ───────────────────────────── Corte ─────────────────────────────

interface CropFrameProps {
  frame: Frame;
  rect: CropRect;
  onChange: (updater: (prev: CropRect) => CropRect) => void;
}

const CROP_MIN = 56;
const HANDLE = 22;

/** Uma alça de canto do corte (arrasta e redimensiona). */
function CropHandle({
  style,
  onDrag,
}: {
  style: ViewStyle;
  onDrag: (dx: number, dy: number) => void;
}) {
  const pan = usePanGesture({
    minDistance: 0,
    onUpdate: e => {
      'worklet';
      scheduleOnRN(onDrag, e.changeX, e.changeY);
    },
  });
  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[$handle, style]} />
    </GestureDetector>
  );
}

/**
 * Moldura de corte: área nítida no centro, resto escurecido, com alças nos
 * quatro cantos e arrasto do corpo inteiro. Coordenadas relativas ao frame.
 * O corte em si (gerar a imagem cortada) é feito no PhotoPreview via view-shot.
 */
export function CropFrame({frame, rect, onChange}: CropFrameProps) {
  // IMPORTANTE: os callbacks precisam ser declarados ANTES dos gestos — o
  // worklet do gesto captura a função no momento em que é criado; capturar
  // uma `const` ainda não inicializada (TDZ) derruba o app ao entrar no corte.
  const applyMove = useCallback(
    (dx: number, dy: number) => {
      onChange(r => ({
        ...r,
        x: Math.min(Math.max(r.x + dx, 0), frame.width - r.width),
        y: Math.min(Math.max(r.y + dy, 0), frame.height - r.height),
      }));
    },
    [frame.width, frame.height, onChange],
  );

  // pinça = redimensiona o recorte a partir do centro (mantém dentro do frame)
  const applyPinch = useCallback(
    (change: number) => {
      onChange(r => {
        const cx = r.x + r.width / 2;
        const cy = r.y + r.height / 2;
        const width = Math.min(Math.max(r.width * change, CROP_MIN), frame.width);
        const height = Math.min(Math.max(r.height * change, CROP_MIN), frame.height);
        return {
          x: Math.min(Math.max(cx - width / 2, 0), frame.width - width),
          y: Math.min(Math.max(cy - height / 2, 0), frame.height - height),
          width,
          height,
        };
      });
    },
    [frame.width, frame.height, onChange],
  );

  const dragTL = useCallback(
    (dx: number, dy: number) =>
      onChange(r => {
        const nx = Math.min(Math.max(r.x + dx, 0), r.x + r.width - CROP_MIN);
        const ny = Math.min(Math.max(r.y + dy, 0), r.y + r.height - CROP_MIN);
        return {x: nx, y: ny, width: r.width + (r.x - nx), height: r.height + (r.y - ny)};
      }),
    [onChange],
  );
  const dragTR = useCallback(
    (dx: number, dy: number) =>
      onChange(r => {
        const ny = Math.min(Math.max(r.y + dy, 0), r.y + r.height - CROP_MIN);
        const width = Math.min(Math.max(r.width + dx, CROP_MIN), frame.width - r.x);
        return {...r, y: ny, width, height: r.height + (r.y - ny)};
      }),
    [frame.width, onChange],
  );
  const dragBL = useCallback(
    (dx: number, dy: number) =>
      onChange(r => {
        const nx = Math.min(Math.max(r.x + dx, 0), r.x + r.width - CROP_MIN);
        const height = Math.min(Math.max(r.height + dy, CROP_MIN), frame.height - r.y);
        return {...r, x: nx, width: r.width + (r.x - nx), height};
      }),
    [frame.height, onChange],
  );
  const dragBR = useCallback(
    (dx: number, dy: number) =>
      onChange(r => ({
        ...r,
        width: Math.min(Math.max(r.width + dx, CROP_MIN), frame.width - r.x),
        height: Math.min(Math.max(r.height + dy, CROP_MIN), frame.height - r.y),
      })),
    [frame.width, frame.height, onChange],
  );

  const move = usePanGesture({
    minDistance: 0,
    onUpdate: e => {
      'worklet';
      scheduleOnRN(applyMove, e.changeX, e.changeY);
    },
  });

  const pinch = usePinchGesture({
    onUpdate: e => {
      'worklet';
      scheduleOnRN(applyPinch, e.scaleChange);
    },
  });

  const bodyGesture = useSimultaneousGestures(move, pinch);

  const containerStyle: ViewStyle = {
    position: 'absolute',
    left: frame.left,
    top: frame.top,
    width: frame.width,
    height: frame.height,
  };

  return (
    <View style={containerStyle} pointerEvents="box-none">
      {/* Escurecimento fora do recorte */}
      <View style={[$dim, $dimTop, {height: rect.y}]} pointerEvents="none" />
      <View
        style={[$dim, $dimBottom, {top: rect.y + rect.height}]}
        pointerEvents="none"
      />
      <View
        style={[$dim, $dimLeftEdge, {top: rect.y, width: rect.x, height: rect.height}]}
        pointerEvents="none"
      />
      <View
        style={[
          $dim,
          $dimRightEdge,
          {left: rect.x + rect.width, top: rect.y, height: rect.height},
        ]}
        pointerEvents="none"
      />

      {/* Corpo do recorte (arrasta tudo / pinça redimensiona) */}
      <GestureDetector gesture={bodyGesture}>
        <Animated.View
          style={[
            $cropBody,
            {left: rect.x, top: rect.y, width: rect.width, height: rect.height},
          ]}
        />
      </GestureDetector>

      {/* Alças dos cantos */}
      <CropHandle style={{left: rect.x - HANDLE / 2, top: rect.y - HANDLE / 2}} onDrag={dragTL} />
      <CropHandle
        style={{left: rect.x + rect.width - HANDLE / 2, top: rect.y - HANDLE / 2}}
        onDrag={dragTR}
      />
      <CropHandle
        style={{left: rect.x - HANDLE / 2, top: rect.y + rect.height - HANDLE / 2}}
        onDrag={dragBL}
      />
      <CropHandle
        style={{
          left: rect.x + rect.width - HANDLE / 2,
          top: rect.y + rect.height - HANDLE / 2,
        }}
        onDrag={dragBR}
      />
    </View>
  );
}

const $textWrap: ViewStyle = {
  position: 'absolute',
  left: 0,
  top: 0,
  maxWidth: '92%',
  paddingHorizontal: 4,
};

const $dim: ViewStyle = {
  position: 'absolute',
  backgroundColor: 'rgba(0,0,0,0.55)',
};

const $dimTop: ViewStyle = {left: 0, right: 0, top: 0};
const $dimBottom: ViewStyle = {left: 0, right: 0, bottom: 0};
const $dimLeftEdge: ViewStyle = {left: 0};
const $dimRightEdge: ViewStyle = {right: 0};

const $cropBody: ViewStyle = {
  position: 'absolute',
  borderWidth: 2,
  borderColor: '#fff',
};

const $handle: ViewStyle = {
  position: 'absolute',
  width: HANDLE,
  height: HANDLE,
  borderRadius: HANDLE / 2,
  backgroundColor: '#fff',
  borderWidth: 2,
  borderColor: 'rgba(0,0,0,0.25)',
};
