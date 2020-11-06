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

import AstarteClient from 'astarte-client';
import type { AstartePropertyData, AstarteDataTuple } from 'astarte-client';

import { AstarteChartProvider, AstarteChartValueObject, AstarteChartSingleValue } from '../index';

type AstarteDevicePropertyProviderValue = AstarteChartSingleValue<AstarteChartValueObject>;

interface AstarteDevicePropertyProviderParams {
  name?: string;
  deviceId: string;
  interfaceName: string;
  endpoint: string;
}

export class AstarteDevicePropertyProvider
  implements AstarteChartProvider<AstarteDevicePropertyProviderValue> {
  readonly kind = 'SingleObject';

  readonly client: AstarteClient;

  readonly params: AstarteDevicePropertyProviderParams;

  constructor(client: AstarteClient, params: AstarteDevicePropertyProviderParams) {
    this.client = client;
    this.params = params;
  }

  async getData(): Promise<AstarteDevicePropertyProviderValue> {
    const dataTree = await this.client.getDeviceDataTree({
      deviceId: this.params.deviceId,
      interfaceName: this.params.interfaceName,
    });
    if (dataTree.dataKind !== 'properties') {
      return new AstarteChartValueObject({
        data: {},
      });
    }
    const deviceValues = dataTree.toLinearizedData() as AstartePropertyData[];
    const property = deviceValues.find(
      (deviceValue) => deviceValue.endpoint === this.params.endpoint,
    );
    return new AstarteChartValueObject({
      data: property
        ? {
            [property.endpoint.split('/').slice(-1)[0]]: {
              value: property.value,
              type: property.type,
            } as AstarteDataTuple,
          }
        : {},
    });
  }

  get name(): string {
    return this.params.name || this.params.deviceId;
  }
}
