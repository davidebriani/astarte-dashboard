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
  AstarteChartValueObjectTimestamped,
} from '../index';

const takeOperator = <
  ProviderValue extends
    | AstarteChartListValue<AstarteChartValueIndividualTimestamped>
    | AstarteChartListValue<AstarteChartValueObjectTimestamped>
>(
  count: number,
  provider: AstarteChartProvider<ProviderValue>,
  // @ts-expect-error cannot infer type
): AstarteChartProvider<ProviderValue> => ({
  get kind() {
    return provider.kind;
  },
  get name() {
    return provider.name;
  },
  async getData() {
    const data = await provider.getData();
    // @ts-expect-error cannot infer array type
    return _.take(data, count);
  },
});

export const getTakeOperator = (
  count: number,
): AstarteChartOperator<
  AstarteChartProvider<AstarteChartListValue>,
  AstarteChartProvider<AstarteChartListValue>
> => {
  return <
    ProviderValue extends
      | AstarteChartListValue<AstarteChartValueIndividualTimestamped>
      | AstarteChartListValue<AstarteChartValueObjectTimestamped>
  >(
    provider: AstarteChartProvider<ProviderValue>,
  ) => takeOperator<ProviderValue>(count, provider);
};
