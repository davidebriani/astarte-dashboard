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

import * as yup from 'yup';

interface AstarteDeviceBaseEventObject {
  device_id: string;
  timestamp: number;
}

const astarteDeviceEventSchema: yup.ObjectSchema<AstarteDeviceBaseEventObject> = yup
  .object({
    device_id: yup.string().required(),
    timestamp: yup.number().integer().min(0).required(),
  })
  .required();

export abstract class AstarteDeviceBaseEvent {
  readonly deviceId: string;

  readonly timestamp: Date;

  protected constructor(obj: AstarteDeviceBaseEventObject) {
    const validatedObj = astarteDeviceEventSchema.validateSync(obj);
    this.deviceId = validatedObj.device_id;
    this.timestamp = new Date(validatedObj.timestamp);
  }
}
