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

import _ from 'lodash';
import type { AstarteDataTuple } from 'astarte-client';

import type {
  AstarteChartProvider,
  AstarteChartOperator,
  AstarteChartListValue,
  AstarteChartValueIndividualTimestamped,
} from '../index';

type SourceProvider = AstarteChartProvider<
  AstarteChartListValue<AstarteChartValueIndividualTimestamped>
>;
type ResultProvider = AstarteChartProvider<
  AstarteChartListValue<AstarteChartValueIndividualTimestamped>
>;

const filterOperator = (
  filterFunction: (data: AstarteDataTuple) => boolean,
  provider: SourceProvider,
): ResultProvider => ({
  get kind() {
    return provider.kind;
  },
  get name() {
    return provider.name;
  },
  async getData() {
    const data = await provider.getData();
    return _.filter(data, (value) => filterFunction(value.data));
  },
});

export const getFilterOperator = (
  filterFunction: (data: AstarteDataTuple) => boolean,
): AstarteChartOperator<SourceProvider, ResultProvider> => {
  return filterOperator.bind(null, filterFunction);
};
