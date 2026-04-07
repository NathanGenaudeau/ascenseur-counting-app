import React, { useMemo } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import Svg, { Line, Polyline } from 'react-native-svg';

import type { CompletedRound } from '../domain/gamePlayState';
import {
  buildCumulativeSeriesPerPlayer,
  getYRangeForSeries,
} from '../domain/scoreSeries';
import { getPlayerChartColor } from '../utils/playerChartColors';

const CHART_HEIGHT = 200;
const PADDING = { left: 36, right: 12, top: 12, bottom: 8 };

type Props = {
  roundsCompleted: CompletedRound[];
  playerNames: string[];
};

function mapX(roundIndex: number, maxRound: number, innerWidth: number): number {
  if (maxRound <= 0) return 0;
  return (roundIndex / maxRound) * innerWidth;
}

function mapY(
  value: number,
  minY: number,
  maxY: number,
  innerHeight: number,
): number {
  const span = maxY - minY || 1;
  return innerHeight - ((value - minY) / span) * innerHeight;
}

export function ScoreEvolutionChart({ roundsCompleted, playerNames }: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const chartWidth = Math.max(280, windowWidth - 32);
  const innerWidth = chartWidth - PADDING.left - PADDING.right;
  const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  const series = useMemo(
    () => buildCumulativeSeriesPerPlayer(roundsCompleted, playerNames.length),
    [roundsCompleted, playerNames.length],
  );

  const { minY, maxY } = useMemo(() => getYRangeForSeries(series), [series]);
  const maxRound = Math.max(1, roundsCompleted.length);

  const polylines = useMemo(() => {
    return series.map((points, playerIndex) => {
      const pts = points
        .map((pt) => {
          const x = PADDING.left + mapX(pt.roundIndex, maxRound, innerWidth);
          const y = PADDING.top + mapY(pt.cumulative, minY, maxY, innerHeight);
          return `${x},${y}`;
        })
        .join(' ');
      return { playerIndex, pts, color: getPlayerChartColor(playerIndex) };
    });
  }, [series, maxRound, innerWidth, innerHeight, minY, maxY]);

  const hasRound = roundsCompleted.length > 0;

  return (
    <View testID="score-evolution-chart-block" className="mb-6">
      <Text className="mb-2 text-sm font-medium text-neutral-700">
        Évolution des scores (cumul)
      </Text>

      <View
        testID="chart-legend"
        className="mb-3 flex-row flex-wrap gap-x-4 gap-y-2"
      >
        {playerNames.map((name, i) => (
          <View key={`leg-${name}-${i}`} testID={`chart-legend-row-${i}`} className="flex-row items-center gap-2">
            <View
              testID={`chart-legend-swatch-${i}`}
              style={{ backgroundColor: getPlayerChartColor(i) }}
              className="h-3 w-3 rounded-full"
            />
            <Text className="text-xs text-neutral-800">{name}</Text>
          </View>
        ))}
      </View>

      {!hasRound ? (
        <Text testID="score-chart-placeholder" className="text-sm text-neutral-500">
          Terminez une manche pour afficher la courbe d’évolution.
        </Text>
      ) : (
        <Svg testID="score-evolution-chart" width={chartWidth} height={CHART_HEIGHT}>
          <Line
            x1={PADDING.left}
            y1={PADDING.top + innerHeight}
            x2={PADDING.left + innerWidth}
            y2={PADDING.top + innerHeight}
            stroke="#e5e5e5"
            strokeWidth={1}
          />
          <Line
            x1={PADDING.left}
            y1={PADDING.top}
            x2={PADDING.left}
            y2={PADDING.top + innerHeight}
            stroke="#e5e5e5"
            strokeWidth={1}
          />
          {minY < 0 && maxY > 0 ? (
            <Line
              x1={PADDING.left}
              y1={PADDING.top + mapY(0, minY, maxY, innerHeight)}
              x2={PADDING.left + innerWidth}
              y2={PADDING.top + mapY(0, minY, maxY, innerHeight)}
              stroke="#d4d4d4"
              strokeDasharray="4 4"
              strokeWidth={1}
            />
          ) : null}
          {polylines.map(({ playerIndex, pts, color }) => (
            <Polyline
              key={`line-${playerIndex}`}
              points={pts}
              fill="none"
              stroke={color}
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}
        </Svg>
      )}
    </View>
  );
}
