import React, { useCallback, useMemo, useState } from 'react';
import { PanResponder, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Line, Polyline, Text as SvgText } from 'react-native-svg';

import type { CompletedRound } from '../domain/gamePlayState';
import {
  buildCumulativeSeriesPerPlayer,
  getYRangeForSeries,
} from '../domain/scoreSeries';
import { getPlayerChartColor } from '../utils/playerChartColors';

const CHART_HEIGHT = 248;
const PADDING = { left: 46, right: 14, top: 14, bottom: 40 };

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

function xFromTouchLocation(
  locationX: number,
  innerWidth: number,
  maxRound: number,
): number {
  const innerX = Math.max(0, Math.min(innerWidth, locationX - PADDING.left));
  if (maxRound <= 0) return 0;
  const rf = (innerX / innerWidth) * maxRound;
  return Math.round(Math.max(0, Math.min(maxRound, rf)));
}

function yAxisTicks(minY: number, maxY: number): number[] {
  if (minY === maxY) return [minY];
  const ticks = new Set<number>([minY, maxY]);
  if (minY < 0 && maxY > 0) ticks.add(0);
  return [...ticks].sort((a, b) => b - a);
}

function formatScoreLabel(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

export function ScoreEvolutionChart({ roundsCompleted, playerNames }: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const chartWidth = Math.max(280, windowWidth - 32);
  const innerWidth = chartWidth - PADDING.left - PADDING.right;
  const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  const [touchRoundIndex, setTouchRoundIndex] = useState<number | null>(null);

  const series = useMemo(
    () => buildCumulativeSeriesPerPlayer(roundsCompleted, playerNames.length),
    [roundsCompleted, playerNames.length],
  );

  const { minY, maxY } = useMemo(() => getYRangeForSeries(series), [series]);
  const maxRound = Math.max(1, roundsCompleted.length);
  const yTicks = useMemo(() => yAxisTicks(minY, maxY), [minY, maxY]);

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

  const updateTouchFromX = useCallback(
    (locationX: number) => {
      setTouchRoundIndex(xFromTouchLocation(locationX, innerWidth, maxRound));
    },
    [innerWidth, maxRound],
  );

  const clearTouch = useCallback(() => setTouchRoundIndex(null), []);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => {
          updateTouchFromX(e.nativeEvent.locationX);
        },
        onPanResponderMove: (e) => {
          updateTouchFromX(e.nativeEvent.locationX);
        },
        onPanResponderRelease: clearTouch,
        onPanResponderTerminate: clearTouch,
      }),
    [updateTouchFromX, clearTouch],
  );

  const hasRound = roundsCompleted.length > 0;

  const cursorX =
    touchRoundIndex !== null
      ? PADDING.left + mapX(touchRoundIndex, maxRound, innerWidth)
      : null;

  const xAxisLabels = useMemo(() => {
    const labels: number[] = [];
    const step = maxRound > 14 ? Math.ceil(maxRound / 14) : 1;
    for (let k = 0; k <= maxRound; k += step) labels.push(k);
    if (labels[labels.length - 1] !== maxRound) labels.push(maxRound);
    return labels;
  }, [maxRound]);

  const xGridIndices = useMemo(() => {
    const out: number[] = [];
    for (let k = 0; k <= maxRound; k += 1) out.push(k);
    return out;
  }, [maxRound]);

  return (
    <View testID="score-evolution-chart-block" className="mb-6">
      <Text className="mb-2 text-sm font-medium text-neutral-700">
        Évolution des scores (cumul)
      </Text>
      <Text className="mb-2 text-xs text-neutral-500">
        Abscisse : numéro de manche · Ordonnée : score cumulé · Glissez sur le graphique pour
        afficher les scores.
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
        <>
          <View
            testID="score-chart-touch-area"
            {...panResponder.panHandlers}
            style={{ width: chartWidth, height: CHART_HEIGHT }}
          >
            <Svg testID="score-evolution-chart" width={chartWidth} height={CHART_HEIGHT}>
              {/* Grille horizontale (scores) */}
              {yTicks.map((tick) => {
                const y = PADDING.top + mapY(tick, minY, maxY, innerHeight);
                return (
                  <Line
                    key={`hgrid-${tick}`}
                    x1={PADDING.left}
                    y1={y}
                    x2={PADDING.left + innerWidth}
                    y2={y}
                    stroke="#f5f5f5"
                    strokeWidth={1}
                  />
                );
              })}
              {/* Grille verticale (manches) */}
              {xGridIndices.map((k) => {
                const x = PADDING.left + mapX(k, maxRound, innerWidth);
                return (
                  <Line
                    key={`vgrid-${k}`}
                    x1={x}
                    y1={PADDING.top}
                    x2={x}
                    y2={PADDING.top + innerHeight}
                    stroke="#fafafa"
                    strokeWidth={1}
                  />
                );
              })}
              <Line
                x1={PADDING.left}
                y1={PADDING.top + innerHeight}
                x2={PADDING.left + innerWidth}
                y2={PADDING.top + innerHeight}
                stroke="#d4d4d4"
                strokeWidth={1}
              />
              <Line
                x1={PADDING.left}
                y1={PADDING.top}
                x2={PADDING.left}
                y2={PADDING.top + innerHeight}
                stroke="#d4d4d4"
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
              {yTicks.map((tick) => {
                const y = PADDING.top + mapY(tick, minY, maxY, innerHeight);
                return (
                  <SvgText
                    key={`ylabel-${tick}`}
                    x={PADDING.left - 6}
                    y={y + 4}
                    fontSize={10}
                    fill="#737373"
                    textAnchor="end"
                  >
                    {formatScoreLabel(tick)}
                  </SvgText>
                );
              })}
              {xAxisLabels.map((k) => {
                const x = PADDING.left + mapX(k, maxRound, innerWidth);
                return (
                  <SvgText
                    key={`xlabel-${k}`}
                    x={x}
                    y={CHART_HEIGHT - 18}
                    fontSize={10}
                    fill="#737373"
                    textAnchor="middle"
                  >
                    {String(k)}
                  </SvgText>
                );
              })}
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
              {cursorX !== null ? (
                <Line
                  x1={cursorX}
                  y1={PADDING.top}
                  x2={cursorX}
                  y2={PADDING.top + innerHeight}
                  stroke="#737373"
                  strokeWidth={1}
                  strokeDasharray="4 3"
                />
              ) : null}
            </Svg>
          </View>

          {touchRoundIndex !== null ? (
            <View
              testID="score-chart-touch-tooltip"
              className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2"
            >
              <Text className="mb-2 text-xs font-medium text-neutral-600">
                {touchRoundIndex === 0
                  ? 'Départ (avant la manche 1)'
                  : `Après la manche ${touchRoundIndex}`}
              </Text>
              {playerNames.map((name, i) => {
                const pt = series[i]?.[touchRoundIndex];
                const score = pt?.cumulative ?? 0;
                return (
                  <View
                    key={`tip-${name}-${i}`}
                    testID={`score-chart-tooltip-row-${i}`}
                    className="mb-1 flex-row items-center justify-between last:mb-0"
                  >
                    <View className="flex-row items-center gap-2">
                      <View
                        style={{ backgroundColor: getPlayerChartColor(i) }}
                        className="h-2.5 w-2.5 rounded-full"
                      />
                      <Text className="text-sm text-neutral-800">{name}</Text>
                    </View>
                    <Text
                      className="text-sm font-semibold tabular-nums"
                      style={{ color: getPlayerChartColor(i) }}
                    >
                      {formatScoreLabel(score)}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}
