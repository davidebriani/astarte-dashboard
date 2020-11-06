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

import type AstarteClient from 'astarte-client';

import { AstarteChartProvider, AstarteChartValueObject, AstarteChartSingleValue } from '../index';

type AstarteConnectedDevicesProviderValue = AstarteChartSingleValue<AstarteChartValueObject>;

interface AstarteConnectedDevicesProviderParams {
  name?: string;
}

export class AstarteConnectedDevicesProvider
  implements AstarteChartProvider<AstarteConnectedDevicesProviderValue> {
  readonly kind = 'SingleObject';

  private readonly client: AstarteClient;

  private readonly params: AstarteConnectedDevicesProviderParams;

  constructor(client: AstarteClient, params: AstarteConnectedDevicesProviderParams = {}) {
    this.client = client;
    this.params = params;
  }

  async getData(): Promise<AstarteConnectedDevicesProviderValue> {
    const devicesStats = await this.client.getDevicesStats();
    return new AstarteChartValueObject({
      data: {
        connected: {
          value: devicesStats.connected_devices,
          type: 'integer',
        },
        disconnected: {
          value: devicesStats.total_devices - devicesStats.connected_devices,
          type: 'integer',
        },
      },
    });
  }

  get name(): string {
    return this.params.name || this.client.realm;
  }
}
