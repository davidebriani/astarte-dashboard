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

export default class Device {
  constructor() {
    this.id = "";
    this.aliases = {};
    this.connected = false;
    this.introspection = [];
    this.totalReceivedMsgs = 0;
    this.totalReceivedBytes = 0;
    this.credentialsinhibited = false;
    this.groups = [];
    this.previousInterfaces = [];
  }

  get hasNameAlias() {
    return this.aliases.has("name");
  }

  get name() {
    if (this.hasNameAlias) {
      return this.aliases.get("name");
    } else {
      return this.id;
    }
  }

  static fromJSON(jsonValue) {
    let device;
    try {
      const obj = JSON.parse(jsonValue);
      device = fromObject(obj);
    } catch (err) {
      return null;
    }

    return device;
  }

  static fromObject(obj) {
    let device = new Device();

    if (obj.id) {
      device.id = obj.id;
    } else {
      throw "Missing device id";
    }

    if ("connected" in obj) {
      device.connected = obj.connected;
    }

    if ("credentials_inhibited" in obj) {
      device.credentialsInhibited = obj.credentials_inhibited;
    }

    if ("aliases" in obj) {
      device.aliases = new Map();
      for (let [key, value] of Object.entries(obj.aliases)) {
        device.aliases.set(key, value);
      }
    }

    if ("groups" in obj) {
      device.groups = obj.groups;
    }

    if ("introspection" in obj) {
      device.introspection = obj.introspection;
    }

    if ("previous_interfaces" in obj) {
      device.previousInterfaces = obj.previous_interfaces;
    }

    if ("total_received_msgs" in obj) {
      device.totalReceivedMsgs = obj.total_received_msgs;
    }

    if ("total_received_bytes" in obj) {
      device.totalReceivedBytes = obj.total_received_msgs;
    }

    if (obj.first_registration) {
      device.firstRegistration = new Date(obj.first_registration);
    }

    if (obj.first_credentials_request) {
      device.firstCredentialsRequest = new Date(obj.first_credentials_request);
    }

    if (obj.last_disconnection) {
      device.lastDisconnection = new Date(obj.last_disconnection);
    }

    if (obj.last_connection) {
      device.lastConnection = new Date(obj.last_connection);
    }

    if (obj.last_seen_ip) {
      device.lastSeenIp = obj.last_seen_ip;
    }

    if (obj.last_credentials_request_ip) {
      device.lastCredentialsRequestIp = obj.last_credentials_request_ip;
    }

    return device;
  }
}
