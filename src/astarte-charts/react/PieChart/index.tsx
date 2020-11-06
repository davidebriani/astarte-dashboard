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
import { Pie } from 'react-chartjs-2';
import Color from 'color';
import type {
  AstarteChartProvider,
  AstarteChartSingleValue,
  AstarteChartValueObject,
  AstarteChartValueObjectTimestamped,
} from 'astarte-charts';

import { useChartProviders } from '../hooks';

const chartOptions = {
  responsive: true,
  legend: {
    position: 'right',
    align: 'start',
  },
};

type ProviderValue =
  | AstarteChartSingleValue<AstarteChartValueObject>
  | AstarteChartSingleValue<AstarteChartValueObjectTimestamped>
  | null;
type Provider = AstarteChartProvider<ProviderValue>;

interface AstartePieChartProps {
  providers: [Provider];
  height?: number;
  width?: number;
  refreshInterval?: number;
}

export const AstartePieChart = ({
  providers,
  height,
  width,
  refreshInterval = 10000,
}: AstartePieChartProps): React.ReactElement => {
  const dataFetcher = useChartProviders<ProviderValue>(providers, refreshInterval);

  const chartData = useMemo(() => {
    if (dataFetcher.data == null || dataFetcher.data[0] == null) {
      return { labels: [], datasets: [] };
    }
    const { data } = dataFetcher.data[0];
    const labels = Object.keys(data);
    const series = labels.map((label) => data[label].value);
    const colors = labels.map((label, index) =>
      Color.hsl((index * 360) / labels.length, 70, 70)
        .rgb()
        .string(),
    );
    return {
      labels,
      datasets: [
        {
          data: series,
          backgroundColor: colors,
        },
      ],
    };
  }, [dataFetcher.data]);

  return <Pie data={chartData} width={width} height={height} options={chartOptions} />;
};
