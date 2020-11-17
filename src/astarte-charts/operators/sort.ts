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

import type {
  AstarteChartProvider,
  AstarteChartOperator,
  AstarteChartListValue,
  AstarteChartValueIndividualTimestamped,
} from '../index';

const sortOperator = (
  sortOrder: 'asc' | 'desc' = 'asc',
  provider: AstarteChartProvider<AstarteChartListValue<AstarteChartValueIndividualTimestamped>>,
): AstarteChartProvider<AstarteChartListValue<AstarteChartValueIndividualTimestamped>> => ({
  get kind() {
    return provider.kind;
  },
  get name() {
    return provider.name;
  },
  async getData() {
    const data = await provider.getData();
    return _.orderBy(data, ['data.value'], [sortOrder]);
  },
});

export const getSortOperator = (
  sortOrder: 'asc' | 'desc' = 'asc',
): AstarteChartOperator<
  AstarteChartProvider<AstarteChartListValue<AstarteChartValueIndividualTimestamped>>,
  AstarteChartProvider<AstarteChartListValue<AstarteChartValueIndividualTimestamped>>
> => {
  return sortOperator.bind(null, sortOrder);
};
