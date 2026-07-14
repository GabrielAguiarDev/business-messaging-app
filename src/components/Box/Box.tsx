import React from 'react';

import {
  Pressable,
  PressableProps,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';

import {createBox} from '@shopify/restyle';

import {Theme} from '@theme';

export const Box = createBox<Theme>();
export type BoxProps = React.ComponentProps<typeof Box>;

export const TouchableOpacityBox = createBox<
  Theme,
  TouchableOpacityProps & {children?: React.ReactNode}
>(TouchableOpacity);
export type TouchableOpacityBoxProps = React.ComponentProps<
  typeof TouchableOpacityBox
>;

export const PressableBox = createBox<
  Theme,
  PressableProps & {children?: React.ReactNode}
>(Pressable);
export type PressableBoxProps = React.ComponentProps<typeof PressableBox>;
