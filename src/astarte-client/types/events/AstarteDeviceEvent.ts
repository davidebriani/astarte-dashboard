/* eslint-disable camelcase */
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

export abstract class AstarteDeviceEvent {
  readonly deviceId: string;
  readonly timestamp: Date;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected constructor(arg: any) {
    if (!arg || !_.isPlainObject(arg)) {
      throw Error('Invalid argument');
    }

    if (!arg.device_id || typeof arg.device_id !== 'string') {
      throw Error('Invalid device id');
    }

    if (!arg.timestamp || typeof arg.timestamp !== 'number') {
      throw Error('Invalid timestamp');
    }

    this.deviceId = arg.device_id;
    this.timestamp = new Date(arg.timestamp);
  }
}
