import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BackHandler, PanResponder, Pressable, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

import type { CompletedRound } from '../domain/gamePlayState';
import {
  buildCumulativeSeriesPerPlayer,
  getYRangeForSeries,
} from '../domain/scoreSeries';
import { getPlayerChartColor } from '../utils/playerChartColors';

const CHART_HEIGHT = 260;
const PADDING = { left: 46, right: 14, top: 14, bottom: 52 };

type Props = {
  roundsCompleted: CompletedRound[];
  playerNames: string[];
  /**
   * Onglet Partie : pas de titres / légendes d’usage ni placeholder ; pas de détail au toucher sur le graphique
   * (détail conservé dans l’historique).
   */
  compact?: boolean;
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

/** Regroupe les scores pour détecter les ex aequo (tolérance flottants). */
function tieScoreKey(cumulative: number): string {
  return String(Math.round(cumulative * 1e6) / 1e6);
}

/**
 * Décalage vertical en pixels pour chaque joueur quand plusieurs ont le même cumul à cette manche,
 * afin que les courbes ne se masquent pas.
 */
function pixelYOffsetsForTiesAtRound(
  series: { roundIndex: number; cumulative: number }[][],
  roundIndex: number,
): number[] {
  const n = series.length;
  const offsets = new Array<number>(n).fill(0);
  const scores = series.map((line) => line[roundIndex]?.cumulative ?? 0);
  const groups = new Map<string, number[]>();
  for (let i = 0; i < n; i++) {
    const key = tieScoreKey(scores[i]!);
    let arr = groups.get(key);
    if (!arr) {
      arr = [];
      groups.set(key, arr);
    }
    arr.push(i);
  }
  const spreadPx = 3.5;
  for (const indices of groups.values()) {
    if (indices.length <= 1) continue;
    indices.sort((a, b) => a - b);
    const m = indices.length;
    for (let k = 0; k < m; k++) {
      const idx = indices[k]!;
      offsets[idx] = (k - (m - 1) / 2) * spreadPx;
    }
  }
  return offsets;
}

type ChartPoint = { x: number; y: number; cumulative: number };

/**
 * Courbes lissées (Catmull-Rom → cubiques) entre manches dont le cumul change.
 * Si le cumul est identique sur deux manches de suite, segment droit (`L`) : sinon la spline
 * « tire » la courbe vers les points suivants et crée un faux creux (undershoot) sur un palier.
 */
function buildSmoothPath(points: ChartPoint[], tensionDivisor: number): string {
  if (points.length === 0) return '';
  if (points.length === 1) {
    const p = points[0]!;
    return `M ${p.x} ${p.y}`;
  }
  let d = `M ${points[0]!.x} ${points[0]!.y}`;
  const t = tensionDivisor;
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const flatPlateau = tieScoreKey(p1.cumulative) === tieScoreKey(p2.cumulative);
    if (flatPlateau) {
      d += ` L ${p2.x} ${p2.y}`;
      continue;
    }
    const p0 = points[i - 1] ?? p1;
    const p3 = points[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / t;
    const c1y = p1.y + (p2.y - p0.y) / t;
    const c2x = p2.x - (p3.x - p1.x) / t;
    const c2y = p2.y - (p3.y - p1.y) / t;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export function ScoreEvolutionChart({
  roundsCompleted,
  playerNames,
  compact = false,
}: Props) {
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

  const linePathsAndDots = useMemo(() => {
    const tensionDivisor = 4;
    const maxRoundIndex = roundsCompleted.length;
    const offsetsByRound: number[][] = [];
    for (let r = 0; r <= maxRoundIndex; r++) {
      offsetsByRound.push(pixelYOffsetsForTiesAtRound(series, r));
    }
    return series.map((points, playerIndex) => {
      const mapped = points.map((pt) => {
        const x = PADDING.left + mapX(pt.roundIndex, maxRound, innerWidth);
        const baseY = PADDING.top + mapY(pt.cumulative, minY, maxY, innerHeight);
        const off = offsetsByRound[pt.roundIndex]?.[playerIndex] ?? 0;
        return { x, y: baseY + off, cumulative: pt.cumulative };
      });
      return {
        playerIndex,
        d: buildSmoothPath(mapped, tensionDivisor),
        dots: mapped,
        color: getPlayerChartColor(playerIndex),
      };
    });
  }, [series, maxRound, innerWidth, innerHeight, minY, maxY, roundsCompleted.length]);

  const updateTouchFromX = useCallback(
    (locationX: number) => {
      setTouchRoundIndex(xFromTouchLocation(locationX, innerWidth, maxRound));
    },
    [innerWidth, maxRound],
  );

  const clearTouch = useCallback(() => setTouchRoundIndex(null), []);

  useEffect(() => {
    if (touchRoundIndex === null) {
      return;
    }
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      clearTouch();
      return true;
    });
    return () => sub.remove();
  }, [touchRoundIndex, clearTouch]);

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
      }),
    [updateTouchFromX],
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
      {compact ? null : (
        <>
          <Text className="mb-2 text-sm font-medium text-neutral-700">
            Évolution des scores (cumul)
          </Text>
        </>
      )}

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
            <Text className="text-base font-medium text-neutral-800">{name}</Text>
          </View>
        ))}
      </View>

      {!hasRound ? (
        compact ? null : (
          <Text testID="score-chart-placeholder" className="text-sm text-neutral-500">
            Terminez une manche pour afficher la courbe d’évolution.
          </Text>
        )
      ) : (
        <>
          <View
            testID="score-chart-touch-area"
            pointerEvents={compact ? 'none' : 'auto'}
            {...(compact ? {} : panResponder.panHandlers)}
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
                const cards =
                  k >= 1 && k <= roundsCompleted.length
                    ? roundsCompleted[k - 1]?.cardsPerHand
                    : undefined;
                return (
                  <React.Fragment key={`xlabel-${k}`}>
                    <SvgText
                      x={x}
                      y={CHART_HEIGHT - 34}
                      fontSize={10}
                      fill="#737373"
                      textAnchor="middle"
                    >
                      {String(k)}
                    </SvgText>
                    {cards !== undefined ? (
                      <SvgText
                        x={x}
                        y={CHART_HEIGHT - 18}
                        fontSize={9}
                        fill="#a3a3a3"
                        textAnchor="middle"
                      >
                        {cards}c
                      </SvgText>
                    ) : null}
                  </React.Fragment>
                );
              })}
              {linePathsAndDots.map(({ playerIndex, d, dots, color }) => (
                <React.Fragment key={`player-line-${playerIndex}`}>
                  <Path
                    d={d}
                    fill="none"
                    stroke={color}
                    strokeWidth={2.5}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  {dots.map((p, dotIdx) => (
                    <Circle
                      key={`dot-${playerIndex}-${dotIdx}`}
                      cx={p.x}
                      cy={p.y}
                      r={3}
                      fill={color}
                      stroke="#ffffff"
                      strokeWidth={1.5}
                    />
                  ))}
                </React.Fragment>
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
              <View className="mb-2 flex-row items-start justify-between gap-2">
                <View className="min-w-0 flex-1 pr-2">
                  {compact ? (
                    <Text className="text-xs font-medium text-neutral-600">
                      {touchRoundIndex === 0
                        ? 'Départ (avant la manche 1)'
                        : `Après la manche ${touchRoundIndex}`}
                    </Text>
                  ) : (
                    <>
                      <Text className="text-xs font-medium text-neutral-600">
                        {touchRoundIndex === 0
                          ? 'Départ (avant la manche 1)'
                          : `Après la manche ${touchRoundIndex}`}
                      </Text>
                      {touchRoundIndex >= 1 &&
                        roundsCompleted[touchRoundIndex - 1]?.cardsPerHand !== undefined ? (
                        <Text className="mt-0.5 text-xs text-neutral-500">
                          {roundsCompleted[touchRoundIndex - 1]!.cardsPerHand} carte
                          {(roundsCompleted[touchRoundIndex - 1]!.cardsPerHand ?? 0) > 1 ? 's' : ''} en
                          main
                        </Text>
                      ) : null}
                    </>
                  )}
                </View>
                <Pressable
                  accessibilityLabel="Fermer le détail du graphique"
                  testID="score-chart-dismiss-tooltip"
                  onPress={clearTouch}
                  hitSlop={8}
                  className="shrink-0 py-0.5"
                >
                  <Text className="text-sm font-semibold text-neutral-700">Fermer</Text>
                </Pressable>
              </View>
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
