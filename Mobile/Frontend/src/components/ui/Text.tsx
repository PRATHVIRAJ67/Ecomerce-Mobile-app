import { Text, type TextProps } from 'react-native';

type Weight = 'regular' | 'medium' | 'semibold' | 'bold';
const WEIGHT: Record<Weight, string> = {
  regular: 'font-sans',
  medium: 'font-ui-medium',
  semibold: 'font-ui-semibold',
  bold: 'font-ui-bold',
};

/**
 * Only apply the default ink colour when the caller didn't pass a colour class —
 * two `text-<colour>` classes on one element resolve by stylesheet order, not by position.
 */
const COLOR = /(^|\s)text-(ink|cream|white|muted|forest|terracotta|danger|success|warning|sand|black|transparent)\b/;
const withInk = (className: string) => (COLOR.test(className) ? className : `text-ink ${className}`);

/** Body/UI text (Inter). Font weight is selected by family so Android renders the right face. */
export function Txt({ weight = 'regular', className = '', ...rest }: TextProps & { weight?: Weight; className?: string }) {
  const family = /(^|\s)font-display/.test(className) ? '' : WEIGHT[weight];
  return <Text maxFontSizeMultiplier={1.6} className={`${family} ${withInk(className)}`} {...rest} />;
}

/** Editorial display text (Fraunces). */
export function Display({ italic, medium, className = '', ...rest }: TextProps & { italic?: boolean; medium?: boolean; className?: string }) {
  const family = italic ? 'font-display-italic' : medium ? 'font-display-medium' : 'font-display';
  return <Text accessibilityRole="header" maxFontSizeMultiplier={1.4} className={`${family} ${withInk(className)}`} {...rest} />;
}

/** Small uppercase label above section titles. */
export function Eyebrow({ className = '', ...rest }: TextProps & { className?: string }) {
  return <Text maxFontSizeMultiplier={1.4} className={`font-ui-semibold text-[11px] uppercase tracking-[2px] ${COLOR.test(className) ? '' : 'text-terracotta-600'} ${className}`} {...rest} />;
}
