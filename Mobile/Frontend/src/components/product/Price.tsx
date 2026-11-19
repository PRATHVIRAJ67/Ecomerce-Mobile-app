import { discountPercent } from '@ecommerce/shared';
import { View } from 'react-native';
import { formatINR } from '@/lib/format';
import { Txt } from '../ui';

export function Price({ price, mrp, size = 'md', stacked }: { price: number; mrp: number | null; size?: 'sm' | 'md' | 'lg'; stacked?: boolean }) {
  const off = discountPercent(price, mrp);
  const big = size === 'lg' ? 'text-[30px]' : size === 'md' ? 'text-lg' : 'text-[16px]';
  const small = size === 'lg' ? 'text-base' : 'text-[12px]';
  const label = `Price ${formatINR(price)}${off > 0 && mrp ? `, MRP ${formatINR(mrp)}, ${off}% off` : ''}`;
  return (
    <View accessible accessibilityLabel={label} className={stacked ? '' : 'flex-row flex-wrap items-baseline gap-x-2'}>
      <Txt weight="bold" className={big}>
        {formatINR(price)}
      </Txt>
      {off > 0 && mrp ? (
        <View className="flex-row items-baseline gap-1.5">
          <Txt className={`${small} text-muted line-through`}>{formatINR(mrp)}</Txt>
          <Txt weight="bold" className={`${small} text-terracotta-600`}>
            {off}% off
          </Txt>
        </View>
      ) : null}
    </View>
  );
}
