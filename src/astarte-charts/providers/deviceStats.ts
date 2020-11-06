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
import _ from 'lodash';

import { AstarteChartProvider, AstarteChartSingleValue, AstarteChartValueObject } from '../index';

type AstarteDeviceStatsProviderValue = AstarteChartSingleValue<AstarteChartValueObject>;

interface AstarteDeviceStatsProviderParams {
  name?: string;
  deviceId: string;
  stats?: 'exchangedBytes' | 'exchangedMessages';
}

export class AstarteDeviceStatsProvider
  implements AstarteChartProvider<AstarteDeviceStatsProviderValue> {
  readonly kind = 'SingleObject';

  name: string;

  readonly client: AstarteClient;

  readonly params: AstarteDeviceStatsProviderParams;

  constructor(client: AstarteClient, params: AstarteDeviceStatsProviderParams) {
    this.client = client;
    this.params = params;
    this.name = this.params.name || '';
  }

  async getData(): Promise<AstarteDeviceStatsProviderValue> {
    const device = await this.client.getDeviceInfo(this.params.deviceId).catch(() => {
      throw new Error(`Could not find device with ID ${this.params.deviceId}`);
    });
    const currentInterfaces = Array.from(device.introspection.values());
    const interfaces = [...currentInterfaces, ...device.previousInterfaces];
    const totalBytes = device.totalReceivedBytes;
    const totalMessages = device.totalReceivedMessages;
    const interfacesBytes = _.sumBy(interfaces, 'exchangedBytes');
    const interfacesMessages = _.sumBy(interfaces, 'exchangedMessages');
    const otherBytes = totalBytes - interfacesBytes;
    const otherMessages = totalMessages - interfacesMessages;
    if (!this.params.name && device.name) {
      this.name = device.name;
    }
    return new AstarteChartValueObject({
      data: interfaces.reduce(
        (acc, iface) => ({
          ...acc,
          [`${iface.name} v${iface.major}.${iface.minor}`]: {
            type: 'integer',
            value:
              (this.params.stats === 'exchangedMessages'
                ? iface.exchangedMessages
                : iface.exchangedBytes) || 0,
          },
        }),
        {
          Other: {
            type: 'integer',
            value: this.params.stats === 'exchangedMessages' ? otherMessages : otherBytes,
          },
        },
      ),
    });
  }
}
