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

import type {
  AstarteChartProvider,
  AstarteChartOperator,
  AstarteChartListValue,
  AstarteChartSingleValue,
  AstarteChartValueIndividualTimestamped,
  AstarteChartValueObjectTimestamped,
} from '../index';

const firstOperator = <
  Value extends AstarteChartValueIndividualTimestamped | AstarteChartValueObjectTimestamped
>(
  provider: AstarteChartProvider<AstarteChartListValue<Value>>,
  // @ts-expect-error cannot infer type
): AstarteChartProvider<AstarteChartSingleValue<Value> | null> => ({
  get kind() {
    return provider.kind;
  },
  get name() {
    return provider.name;
  },
  async getData() {
    const data = await provider.getData();
    return data.length > 0 ? data[0] : null;
  },
});

export const getFirstOperator = (): AstarteChartOperator<
  AstarteChartProvider<AstarteChartListValue>,
  AstarteChartProvider<AstarteChartSingleValue | null>
> => {
  return <
    Value extends AstarteChartValueIndividualTimestamped | AstarteChartValueObjectTimestamped
  >(
    provider: AstarteChartProvider<AstarteChartListValue<Value>>,
  ) => firstOperator(provider);
};
