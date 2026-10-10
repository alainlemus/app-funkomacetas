import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

export function Icon({ name, size = 22, color = colors.ink }: IconProps) {
  return <Ionicons name={name} size={size} color={color} />;
}

export { Ionicons };
export type { IconName };