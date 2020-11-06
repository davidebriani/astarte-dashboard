/*
   This file is part of Astarte.

   Copyright 2020 Ispirata Srl

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import Color from 'color';
import type {
  AstarteChartProvider,
  AstarteChartListValue,
  AstarteChartValueIndividualTimestamped,
  AstarteChartValueObjectTimestamped,
} from 'astarte-charts';

import { useChartProviders } from '../hooks';

const chartOptions = {
  responsive: true,
  scales: {
    xAxes: [
      {
        type: 'time',
        distribution: 'linear',
        bounds: 'data',
      },
    ],
  },
  elements: {
    line: {
      tension: 0,
    },
  },
};

type ObjectProviderValue = AstarteChartListValue<AstarteChartValueObjectTimestamped>;
type ObjectProvider = AstarteChartProvider<ObjectProviderValue>;
type IndividualProviderValue = AstarteChartListValue<AstarteChartValueIndividualTimestamped>;
type IndividualProvider = AstarteChartProvider<IndividualProviderValue>;

interface AstarteTimeseriesChartProps {
  providers: Array<ObjectProvider | IndividualProvider>;
  height?: number;
  width?: number;
  refreshInterval?: number;
}

export const AstarteTimeseriesChart = ({
  providers,
  height,
  width,
  refreshInterval = 10000,
}: AstarteTimeseriesChartProps): React.ReactElement => {
  const individualTimeseriesProviders = useMemo(
    () =>
      providers.filter(
        (provider) => provider.kind === 'ListIndividualTimestamped',
      ) as IndividualProvider[],
    [providers],
  );
  const objectTimeseriesProviders = useMemo(
    () =>
      providers.filter((provider) => provider.kind === 'ListObjectTimestamped') as ObjectProvider[],
    [providers],
  );

  const individualTimeseriesFetcher = useChartProviders<IndividualProviderValue>(
    individualTimeseriesProviders,
    refreshInterval,
  );
  const objectTimeseriesFetcher = useChartProviders<ObjectProviderValue>(
    objectTimeseriesProviders,
    refreshInterval,
  );

  const chartData = useMemo(() => {
    if (individualTimeseriesFetcher.data == null || objectTimeseriesFetcher.data == null) {
      return { datasets: [] };
    }
    const colors = providers.map((provider, index) =>
      Color.hsl((index * 360) / providers.length, 70, 70)
        .rgb()
        .string(),
    );
    const individualSeries = individualTimeseriesFetcher.data.map(
      (providerData, providerIndex) => ({
        label: individualTimeseriesProviders[providerIndex].name,
        data: providerData.map(({ timestamp, data: { value } }) => ({
          x: new Date(timestamp),
          y: Number(value),
        })),
        backgroundColor: colors[providerIndex],
        borderColor: colors[providerIndex],
        fill: false,
        borderWidth: 1,
        pointRadius: providerData.length > 100 ? 0 : 3,
      }),
    );
    const objectSeries = objectTimeseriesFetcher.data
      .map((providerData, providerIndex) => {
        if (providerData.length === 0) {
          return [];
        }
        const providerEndpoints = Object.keys(providerData[0].data);
        return providerEndpoints.map((endpoint) => ({
          label: `${objectTimeseriesProviders[providerIndex].name}/${endpoint}`,
          data: providerData.map((dataPoint) => ({
            x: new Date(dataPoint.timestamp),
            y: Number(dataPoint.data[endpoint].value),
          })),
          backgroundColor: colors[individualTimeseriesProviders.length + providerIndex],
          borderColor: colors[individualTimeseriesProviders.length + providerIndex],
          fill: false,
          borderWidth: 1,
          pointRadius: providerData.length > 100 ? 0 : 3,
        }));
      })
      .flat();
    return { datasets: individualSeries.concat(objectSeries) };
  }, [individualTimeseriesFetcher.data, objectTimeseriesFetcher.data]);

  return <Line data={chartData} options={chartOptions} width={width} height={height} />;
};
