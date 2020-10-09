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

import axios from 'axios';
import { Socket as PhoenixSocket } from 'phoenix';

import { AstarteCustomBlock, toAstarteBlock } from './models/Block';
import type { AstarteBlock } from './models/Block';
import type { AstarteBlockDTO, AstarteJWT } from './types';

const AstarteDevice = require('../react/astarte/Device').default;

type AstarteDevice = typeof AstarteDevice;
type Channel = any;
type Trigger = any;

// Wrap phoenix lib calls in promise for async handling
async function openNewSocketConnection(
  connectionParams: any,
  onErrorHanlder: any,
  onCloseHandler: any,
): Promise<PhoenixSocket> {
  const { socketUrl, realm, token } = connectionParams;

  return new Promise((resolve) => {
    const phoenixSocket = new PhoenixSocket(socketUrl, {
      params: {
        realm,
        token,
      },
    });
    phoenixSocket.onError((e: any) => onErrorHanlder(e));
    phoenixSocket.onClose((e: any) => onCloseHandler(e));
    phoenixSocket.onOpen(() => {
      resolve(phoenixSocket);
    });
    phoenixSocket.connect();
  });
}

async function joinChannel(phoenixSocket: PhoenixSocket, channelString: string): Promise<Channel> {
  return new Promise((resolve, reject) => {
    const channel = phoenixSocket.channel(channelString, {});
    channel
      .join()
      .receive('ok', () => {
        resolve(channel);
      })
      .receive('error', (err: any) => {
        reject(err);
      });
  });
}

async function leaveChannel(channel: Channel): Promise<void> {
  return new Promise((resolve, reject) => {
    channel
      .leave()
      .receive('ok', () => {
        resolve();
      })
      .receive('error', (err: any) => {
        reject(err);
      });
  });
}

async function registerTrigger(channel: Channel, triggerPayload: Trigger): Promise<void> {
  return new Promise((resolve, reject) => {
    channel
      .push('watch', triggerPayload)
      .receive('ok', () => {
        resolve();
      })
      .receive('error', (err: any) => {
        reject(err);
      });
  });
}

function astarteAPIurl(strings: any, baseUrl: any, ...keys: any) {
  return (...values: any) => {
    const dict = values[values.length - 1] || {};
    const result = [strings[1]];
    keys.forEach((key: any, i: any) => {
      const value = Number.isInteger(key) ? values[key] : dict[key];
      result.push(value, strings[i + 2]);
    });
    return new URL(result.join(''), baseUrl);
  };
}

interface AstarteClientConfig {
  appengineUrl: string;
  enableFlowPreview?: boolean;
  flowUrl: string;
  onSocketClose?: () => any;
  onSocketError?: () => any;
  pairingUrl: string;
  realm?: string;
  realmManagementUrl: string;
  token?: AstarteJWT;
}

class AstarteClient {
  private config: { realm: string; enableFlowPreview: boolean };

  private apiConfig: any;

  private joinedChannels: {
    [roomName: string]: Channel;
  };

  private listeners: {
    [eventName: string]: Array<() => any>;
  };

  private onSocketClose?: () => any;

  private onSocketError?: () => any;

  private phoenixSocket: PhoenixSocket | null;

  private token: AstarteJWT;

  private devices: null | AstarteDevice[] = null;

  private devicesNextRequestToken: null | string = null;

  constructor(config: AstarteClientConfig) {
    this.config = {
      enableFlowPreview: config.enableFlowPreview || false,
      realm: config.realm || '',
    };

    this.token = config.token || '';

    this.onSocketClose = config.onSocketClose;
    this.onSocketError = config.onSocketError;

    this.phoenixSocket = null;
    this.joinedChannels = {};
    this.listeners = {};

    this.getDevicesStats = this.getDevicesStats.bind(this);
    this.getInterfaceNames = this.getInterfaceNames.bind(this);
    this.getTriggerNames = this.getTriggerNames.bind(this);
    this.getAppengineHealth = this.getAppengineHealth.bind(this);
    this.getRealmManagementHealth = this.getRealmManagementHealth.bind(this);
    this.getPairingHealth = this.getPairingHealth.bind(this);
    this.getFlowHealth = this.getFlowHealth.bind(this);

    // prettier-ignore
    this.apiConfig = {
      realmManagementHealth: astarteAPIurl`${config.realmManagementUrl}health`,
      auth:                  astarteAPIurl`${config.realmManagementUrl}v1/${'realm'}/config/auth`,
      interfaces:            astarteAPIurl`${config.realmManagementUrl}v1/${'realm'}/interfaces`,
      interfaceMajors:       astarteAPIurl`${config.realmManagementUrl}v1/${'realm'}/interfaces/${'interfaceName'}`,
      interfaceData:         astarteAPIurl`${config.realmManagementUrl}v1/${'realm'}/interfaces/${'interfaceName'}/${'interfaceMajor'}`,
      triggers:              astarteAPIurl`${config.realmManagementUrl}v1/${'realm'}/triggers`,
      appengineHealth:       astarteAPIurl`${config.appengineUrl}health`,
      devicesStats:          astarteAPIurl`${config.appengineUrl}v1/${'realm'}/stats/devices`,
      devices:               astarteAPIurl`${config.appengineUrl}v1/${'realm'}/devices`,
      deviceInfo:            astarteAPIurl`${config.appengineUrl}v1/${'realm'}/devices/${'deviceId'}`,
      deviceData:            astarteAPIurl`${config.appengineUrl}v1/${'realm'}/devices/${'deviceId'}/interfaces/${'interfaceName'}`,
      groups:                astarteAPIurl`${config.appengineUrl}v1/${'realm'}/groups`,
      groupDevices:          astarteAPIurl`${config.appengineUrl}v1/${'realm'}/groups/${'groupName'}/devices`,
      deviceInGroup:         astarteAPIurl`${config.appengineUrl}v1/${'realm'}/groups/${'groupName'}/devices/${'deviceId'}`,
      phoenixSocket:         astarteAPIurl`${config.appengineUrl}v1/socket`,
      pairingHealth:         astarteAPIurl`${config.pairingUrl}health`,
      registerDevice:        astarteAPIurl`${config.pairingUrl}v1/${'realm'}/agent/devices`,
      flowHealth:            astarteAPIurl`${config.flowUrl}health`,
      flows:                 astarteAPIurl`${config.flowUrl}v1/${'realm'}/flows`,
      flowInstance:          astarteAPIurl`${config.flowUrl}v1/${'realm'}/flows/${'instanceName'}`,
      pipelines:             astarteAPIurl`${config.flowUrl}v1/${'realm'}/pipelines`,
      pipelineSource:        astarteAPIurl`${config.flowUrl}v1/${'realm'}/pipelines/${'pipelineId'}`,
      blocks:                astarteAPIurl`${config.flowUrl}v1/${'realm'}/blocks`,
      blockSource:           astarteAPIurl`${config.flowUrl}v1/${'realm'}/blocks/${'blockId'}`,
    };
  }

  addListener(eventName: any, callback: any): void {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }

    this.listeners[eventName].push(callback);
  }

  removeListener(eventName: any, callback: any): void {
    const previousListeners = this.listeners[eventName];
    if (previousListeners) {
      this.listeners[eventName] = previousListeners.filter((listener) => listener !== callback);
    }
  }

  private dispatch(eventName: any): void {
    const listeners = this.listeners[eventName];
    if (listeners) {
      listeners.forEach((listener) => listener());
    }
  }

  setCredentials({ realm, token }: any): void {
    this.config.realm = realm || '';
    this.token = token || '';

    this.dispatch('credentialsChange');
  }

  async getConfigAuth(): Promise<any> {
    return this.$get(this.apiConfig.auth(this.config));
  }

  async updateConfigAuth(publicKey: any): Promise<any> {
    return this.$put(this.apiConfig.auth(this.config), {
      jwt_public_key_pem: publicKey,
    });
  }

  async getInterfaceNames(): Promise<any> {
    return this.$get(this.apiConfig.interfaces(this.config));
  }

  async getInterfaceMajors(interfaceName: any): Promise<any> {
    return this.$get(this.apiConfig.interfaceMajors({ ...this.config, interfaceName }));
  }

  async getInterface({ interfaceName, interfaceMajor }: any): Promise<any> {
    return this.$get(
      this.apiConfig.interfaceData({
        interfaceName,
        interfaceMajor,
        ...this.config,
      }),
    );
  }

  async getTriggerNames(): Promise<any> {
    return this.$get(this.apiConfig.triggers(this.config));
  }

  async getDevicesStats(): Promise<any> {
    return this.$get(this.apiConfig.devicesStats(this.config));
  }

  get canGetMoreDevices(): boolean {
    return this.devicesNextRequestToken != null || this.devices == null;
  }

  async getSomeDevices({ details, count, refresh }: any): Promise<AstarteDevice[]> {
    if (refresh) {
      this.devices = null;
      this.devicesNextRequestToken = null;
    }
    let devices = this.devices || [];
    while (this.canGetMoreDevices && devices.length < count) {
      const from = this.devicesNextRequestToken;
      const response = await this.$getDevices({ details, from, limit: 100 });
      this.devicesNextRequestToken = new URLSearchParams(response.links.next).get('from_token');
      const fetchedDevices = response.data.map((device: any) => AstarteDevice.fromObject(device));
      devices = devices.concat(fetchedDevices);
      this.devices = devices;
    }
    return devices.slice(0, count);
  }

  async getAllDevices({ details, refresh }: any): Promise<AstarteDevice[]> {
    if (refresh) {
      this.devices = null;
      this.devicesNextRequestToken = null;
    }
    let devices = this.devices || [];
    if (this.devicesNextRequestToken) {
      const from = this.devicesNextRequestToken;
      const response = await this.$getDevices({ details, from });
      this.devicesNextRequestToken = null;
      const fetchedDevices = response.data.map((device: any) => AstarteDevice.fromObject(device));
      devices = devices.concat(fetchedDevices);
    } else if (this.devices == null) {
      const response = await this.$getDevices({ details });
      devices = response.data.map((device: any) => AstarteDevice.fromObject(device));
    }
    this.devices = devices;
    return this.devices.slice();
  }

  private async $getDevices({ details, limit, from }: any): Promise<any> {
    const endpointUri = new URL(this.apiConfig.devices(this.config));
    const query: any = {};

    if (details) {
      query.details = true;
    }

    if (limit) {
      query.limit = limit;
    }

    if (from) {
      query.from_token = from;
    }

    if (query) {
      endpointUri.search = new URLSearchParams(query).toString();
    }

    return this.$get(endpointUri.toString());
  }

  async getDeviceInfo(deviceId: any): Promise<any> {
    return this.$get(this.apiConfig.deviceInfo({ deviceId, ...this.config }));
  }

  async getDeviceData({ deviceId, interfaceName }: any): Promise<any> {
    return this.$get(
      this.apiConfig.deviceData({
        deviceId,
        interfaceName,
        ...this.config,
      }),
    );
  }

  async getGroupList(): Promise<any> {
    return this.$get(this.apiConfig.groups(this.config));
  }

  async createGroup(params: any): Promise<any> {
    const { groupName, deviceList } = params;
    return this.$post(this.apiConfig.groups(this.config), {
      group_name: groupName,
      devices: deviceList,
    });
  }

  async getDevicesInGroup({ groupName, details }: any): Promise<any> {
    if (!groupName) {
      throw Error('Invalid group name');
    }

    /* Double encoding to preserve the URL format when groupName contains % and / */
    const encodedGroupName = encodeURIComponent(encodeURIComponent(groupName));
    const endpointUri = new URL(
      this.apiConfig.groupDevices({
        ...this.config,
        groupName: encodedGroupName,
      }),
    );

    if (details) {
      endpointUri.search = new URLSearchParams({ details: true } as any).toString();
    }

    return this.$get(endpointUri.toString());
  }

  async removeDeviceFromGroup(params: any): Promise<any> {
    const { groupName, deviceId } = params;

    if (!groupName) {
      throw Error('Invalid group name');
    }

    if (!deviceId) {
      throw Error('Invalid device ID');
    }

    return this.$delete(
      this.apiConfig.deviceInGroup({
        ...this.config,
        groupName,
        deviceId,
      }),
    );
  }

  async registerDevice({ deviceId, introspection }: any): Promise<any> {
    const requestBody: any = {
      hw_id: deviceId,
    };

    if (introspection) {
      const encodedIntrospection: any = {};
      Array.from(introspection).forEach(([key, interfaceDescriptor]: any) => {
        encodedIntrospection[key] = {
          major: interfaceDescriptor.major,
          minor: interfaceDescriptor.minor,
        };
      });
      requestBody.initial_introspection = encodedIntrospection;
    }

    return this.$post(this.apiConfig.registerDevice(this.config), requestBody);
  }

  async getFlowInstances(): Promise<any> {
    return this.$get(this.apiConfig.flows(this.config));
  }

  async getFlowDetails(flowName: any): Promise<any> {
    return this.$get(this.apiConfig.flowInstance({ ...this.config, instanceName: flowName }));
  }

  async createNewFlowInstance(pipelineConfig: any): Promise<any> {
    return this.$post(this.apiConfig.flows(this.config), pipelineConfig);
  }

  async deleteFlowInstance(flowName: any): Promise<any> {
    return this.$delete(this.apiConfig.flowInstance({ ...this.config, instanceName: flowName }));
  }

  async getPipelineDefinitions(): Promise<any> {
    return this.$get(this.apiConfig.pipelines(this.config));
  }

  async registerPipeline(pipeline: any): Promise<any> {
    return this.$post(this.apiConfig.pipelines(this.config), pipeline);
  }

  async getPipelineInputConfig(pipelineId: any): Promise<any> {
    return this.$get(this.apiConfig.pipelineSource({ ...this.config, pipelineId }));
  }

  async getPipelineSource(pipelineId: any): Promise<any> {
    return this.$get(this.apiConfig.pipelineSource({ ...this.config, pipelineId }));
  }

  async deletePipeline(pipelineId: any): Promise<any> {
    return this.$delete(this.apiConfig.pipelineSource({ ...this.config, pipelineId }));
  }

  async getBlocks(): Promise<AstarteBlock[]> {
    return this.$get(this.apiConfig.blocks(this.config)).then((response) =>
      response.data.map((block: AstarteBlockDTO) => toAstarteBlock(block)),
    );
  }

  async registerBlock(block: AstarteCustomBlock): Promise<void> {
    await this.$post(this.apiConfig.blocks(this.config), block);
  }

  async getBlock(blockId: AstarteBlock['name']): Promise<AstarteBlock> {
    const response = await this.$get(this.apiConfig.blockSource({ ...this.config, blockId }));
    return toAstarteBlock(response.data as AstarteBlockDTO);
  }

  async deleteBlock(blockId: AstarteBlock['name']): Promise<void> {
    await this.$delete(this.apiConfig.blockSource({ ...this.config, blockId }));
  }

  async getRealmManagementHealth(): Promise<any> {
    return this.$get(this.apiConfig.realmManagementHealth(this.config));
  }

  async getAppengineHealth(): Promise<any> {
    return this.$get(this.apiConfig.appengineHealth(this.config));
  }

  async getPairingHealth(): Promise<any> {
    return this.$get(this.apiConfig.pairingHealth(this.config));
  }

  async getFlowHealth(): Promise<any> {
    return this.$get(this.apiConfig.flowHealth(this.config));
  }

  private async $get(url: string): Promise<any> {
    return axios({
      method: 'get',
      url,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json;charset=UTF-8',
      },
    }).then((response) => response.data);
  }

  private async $post(url: string, data: any): Promise<any> {
    return axios({
      method: 'post',
      url,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json;charset=UTF-8',
      },
      data: {
        data,
      },
    }).then((response) => response.data);
  }

  private async $put(url: string, data: any): Promise<any> {
    return axios({
      method: 'put',
      url,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json;charset=UTF-8',
      },
      data: {
        data,
      },
    }).then((response) => response.data);
  }

  private async $delete(url: string): Promise<any> {
    return axios({
      method: 'delete',
      url,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json;charset=UTF-8',
      },
    }).then((response) => response.data);
  }

  private async openSocketConnection(): Promise<PhoenixSocket> {
    if (this.phoenixSocket) {
      return Promise.resolve(this.phoenixSocket);
    }

    const socketUrl = new URL(this.apiConfig.phoenixSocket(this.config));
    socketUrl.protocol = socketUrl.protocol === 'https:' ? 'wss:' : 'ws:';

    return new Promise((resolve) => {
      openNewSocketConnection(
        {
          socketUrl,
          realm: this.config.realm,
          token: this.token,
        },
        () => {
          if (this.onSocketError) {
            this.onSocketError();
          }
        },
        () => {
          if (this.onSocketClose) {
            this.onSocketClose();
          }
        },
      ).then((socket) => {
        this.phoenixSocket = socket;
        resolve(socket);
      });
    });
  }

  async joinRoom(roomName: string): Promise<Channel> {
    const { phoenixSocket } = this;
    if (!phoenixSocket) {
      return new Promise((resolve) => {
        this.openSocketConnection().then(() => {
          resolve(this.joinRoom(roomName));
        });
      });
    }

    const channel = this.joinedChannels[roomName];
    if (channel) {
      return Promise.resolve(channel);
    }

    return new Promise((resolve) => {
      joinChannel(phoenixSocket, `rooms:${this.config.realm}:${roomName}`).then((joinedChannel) => {
        this.joinedChannels[roomName] = joinedChannel;
        resolve(joinedChannel);
      });
    });
  }

  async listenForEvents(roomName: string, eventHandler: () => any): Promise<void> {
    const channel = this.joinedChannels[roomName];
    if (!channel) {
      return Promise.reject(new Error("Can't listen for room events before joining it first"));
    }

    channel.on('new_event', eventHandler);
    return Promise.resolve();
  }

  async registerVolatileTrigger(roomName: string, triggerPayload: Trigger): Promise<void> {
    const channel = this.joinedChannels[roomName];
    if (!channel) {
      return Promise.reject(new Error("Room not joined, couldn't register trigger"));
    }

    return registerTrigger(channel, triggerPayload);
  }

  async leaveRoom(roomName: string): Promise<void> {
    const channel = this.joinedChannels[roomName];
    if (!channel) {
      return Promise.reject(new Error("Can't leave a room without joining it first"));
    }

    return leaveChannel(channel).then(() => {
      delete this.joinedChannels[roomName];
    });
  }

  get joinedRooms(): any[] {
    const rooms: string[] = [];
    Object.keys(this.joinedChannels).forEach((roomName) => {
      rooms.push(roomName);
    });
    return rooms;
  }
}

export default AstarteClient;
