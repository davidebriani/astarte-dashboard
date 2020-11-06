/* eslint-disable max-classes-per-file */
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

import {
  AstarteConnectedDevicesProvider,
  AstarteDeviceDatastreamIndividualProvider,
  AstarteDeviceDatastreamObjectProvider,
  AstarteDevicePropertyProvider,
  AstarteDeviceStatsProvider,
} from './providers';

class AstarteChartValueIndividualTimestamped {
  readonly data: AstarteDataTuple;

  readonly timestamp: string;

  constructor(params: { data: AstarteDataTuple; timestamp: string }) {
    this.data = params.data;
    this.timestamp = params.timestamp;
  }
}

class AstarteChartValueObject {
  readonly data: {
    [property: string]: AstarteDataTuple;
  };

  constructor(params: {
    data: {
      [property: string]: AstarteDataTuple;
    };
  }) {
    this.data = params.data;
  }
}

class AstarteChartValueObjectTimestamped {
  readonly data: {
    [property: string]: AstarteDataTuple;
  };

  readonly timestamp: string;

  constructor(params: {
    data: {
      [property: string]: AstarteDataTuple;
    };
    timestamp: string;
  }) {
    this.data = params.data;
    this.timestamp = params.timestamp;
  }
}

type AstarteChartSingleValue<
  V extends
    | AstarteChartValueIndividualTimestamped
    | AstarteChartValueObjectTimestamped
    | AstarteChartValueObject =
    | AstarteChartValueIndividualTimestamped
    | AstarteChartValueObjectTimestamped
    | AstarteChartValueObject
> = V extends AstarteChartValueIndividualTimestamped
  ? AstarteChartValueIndividualTimestamped
  : V extends AstarteChartValueObjectTimestamped
  ? AstarteChartValueObjectTimestamped
  : AstarteChartValueObject;

type AstarteChartListValue<
  V extends AstarteChartValueIndividualTimestamped | AstarteChartValueObjectTimestamped =
    | AstarteChartValueIndividualTimestamped
    | AstarteChartValueObjectTimestamped
> = V extends AstarteChartValueIndividualTimestamped
  ? AstarteChartValueIndividualTimestamped[]
  : AstarteChartValueObjectTimestamped[];

type AstarteChartProvider<
  AstarteChartProviderValue extends null | AstarteChartSingleValue | AstarteChartListValue =
    | null
    | AstarteChartSingleValue
    | AstarteChartListValue
> = AstarteChartProviderValue extends AstarteChartSingleValue<
  AstarteChartValueIndividualTimestamped
> | null
  ? {
      kind: 'SingleIndividualTimestamped';
      name: string;
      getData: () => Promise<AstarteChartValueIndividualTimestamped | null>;
    }
  : AstarteChartProviderValue extends AstarteChartSingleValue<
      AstarteChartValueObjectTimestamped
    > | null
  ? {
      kind: 'SingleObjectTimestamped';
      name: string;
      getData: () => Promise<AstarteChartValueObjectTimestamped | null>;
    }
  : AstarteChartProviderValue extends AstarteChartSingleValue<AstarteChartValueObject> | null
  ? { kind: 'SingleObject'; name: string; getData: () => Promise<AstarteChartValueObject | null> }
  : AstarteChartProviderValue extends AstarteChartListValue<AstarteChartValueIndividualTimestamped>
  ? {
      kind: 'ListIndividualTimestamped';
      name: string;
      getData: () => Promise<AstarteChartListValue<AstarteChartValueIndividualTimestamped>>;
    }
  : AstarteChartProviderValue extends AstarteChartListValue<AstarteChartValueObjectTimestamped>
  ? {
      kind: 'ListObjectTimestamped';
      name: string;
      getData: () => Promise<AstarteChartListValue<AstarteChartValueObjectTimestamped>>;
    }
  : never;

type AstarteConfig =
  | AstarteClient
  | {
      realmManagementUrl: string;
      appengineUrl: string;
      token: string;
      realm: string;
    };

const getAstarteClient = (astarteConfig: AstarteConfig): AstarteClient => {
  if (astarteConfig instanceof AstarteClient) {
    return astarteConfig;
  }
  const astarteClient = new AstarteClient({
    realmManagementUrl: astarteConfig.realmManagementUrl,
    appengineUrl: astarteConfig.appengineUrl,
    pairingUrl: '',
    flowUrl: '',
  });
  astarteClient.setCredentials({
    token: astarteConfig.token,
    realm: astarteConfig.realm,
  });
  return astarteClient;
};

const getConnectedDevices = (
  astarteConfig: AstarteConfig,
  params: { name?: string } = {},
): AstarteConnectedDevicesProvider => {
  return new AstarteConnectedDevicesProvider(getAstarteClient(astarteConfig), params);
};

const getDeviceDatastreamIndividual = (
  astarteConfig: AstarteConfig,
  params: {
    name?: string;
    deviceId: string;
    interfaceName: string;
    endpoint: string;
  },
): AstarteDeviceDatastreamIndividualProvider => {
  return new AstarteDeviceDatastreamIndividualProvider(getAstarteClient(astarteConfig), params);
};

const getDeviceDatastreamObject = (
  astarteConfig: AstarteConfig,
  params: {
    name?: string;
    deviceId: string;
    interfaceName: string;
    endpoint: string;
  },
): AstarteDeviceDatastreamObjectProvider => {
  return new AstarteDeviceDatastreamObjectProvider(getAstarteClient(astarteConfig), params);
};

const getDeviceProperty = (
  astarteConfig: AstarteConfig,
  params: {
    name?: string;
    deviceId: string;
    interfaceName: string;
    endpoint: string;
  },
): AstarteDevicePropertyProvider => {
  return new AstarteDevicePropertyProvider(getAstarteClient(astarteConfig), params);
};

const getDeviceStats = (
  astarteConfig: AstarteConfig,
  params: {
    name?: string;
    deviceId: string;
    stats?: 'exchangedBytes' | 'exchangedMessages';
  },
): AstarteDeviceStatsProvider => {
  return new AstarteDeviceStatsProvider(getAstarteClient(astarteConfig), params);
};

export {
  AstarteChartValueIndividualTimestamped,
  AstarteChartValueObject,
  AstarteChartValueObjectTimestamped,
  getConnectedDevices,
  getDeviceDatastreamIndividual,
  getDeviceDatastreamObject,
  getDeviceProperty,
  getDeviceStats,
};

export type {
  AstarteChartSingleValue,
  AstarteChartListValue,
  AstarteChartProvider,
  AstarteDeviceDatastreamIndividualProvider,
  AstarteDeviceDatastreamObjectProvider,
  AstarteDevicePropertyProvider,
  AstarteConnectedDevicesProvider,
  AstarteDeviceStatsProvider,
};
