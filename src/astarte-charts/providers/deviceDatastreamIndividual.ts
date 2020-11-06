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

import AstarteClient, { AstarteDataTuple } from 'astarte-client';
import type { AstarteDatastreamIndividualData } from 'astarte-client';

import {
  AstarteChartProvider,
  AstarteChartValueIndividualTimestamped,
  AstarteChartListValue,
} from '../index';

type AstarteDeviceDatastreamIndividualProviderValue = AstarteChartListValue<
  AstarteChartValueIndividualTimestamped
>;

interface AstarteDeviceDatastreamIndividualProviderParams {
  name?: string;
  deviceId: string;
  interfaceName: string;
  endpoint: string;
}

export class AstarteDeviceDatastreamIndividualProvider
  implements AstarteChartProvider<AstarteDeviceDatastreamIndividualProviderValue> {
  readonly kind = 'ListIndividualTimestamped';

  private readonly client: AstarteClient;

  private readonly params: AstarteDeviceDatastreamIndividualProviderParams;

  constructor(client: AstarteClient, params: AstarteDeviceDatastreamIndividualProviderParams) {
    this.client = client;
    this.params = params;
  }

  async getData(): Promise<AstarteDeviceDatastreamIndividualProviderValue> {
    const dataTree = await this.client.getDeviceDataTree({
      deviceId: this.params.deviceId,
      interfaceName: this.params.interfaceName,
    });
    if (dataTree.dataKind !== 'datastream_individual') {
      return [];
    }
    const deviceValues = dataTree.toData() as AstarteDatastreamIndividualData[];
    const filteredDeviceValues = deviceValues.filter(
      (deviceValue) => deviceValue.endpoint === this.params.endpoint,
    );
    return filteredDeviceValues.map(
      (deviceValue) =>
        new AstarteChartValueIndividualTimestamped({
          data: {
            value: deviceValue.value,
            type: deviceValue.type,
          } as AstarteDataTuple,
          timestamp: deviceValue.timestamp,
        }),
    );
  }

  get name(): string {
    return this.params.name || this.params.deviceId;
  }
}
