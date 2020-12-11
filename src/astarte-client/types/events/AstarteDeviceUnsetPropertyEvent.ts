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

import { AstarteDeviceBaseEvent } from './AstarteDeviceBaseEvent';

interface AstarteDeviceUnsetPropertyObject {
  device_id: string;
  timestamp: number;
  event: {
    type: 'incoming_data';
    interface: string;
    path: string;
    value: null;
  };
}

const astarteDeviceUnsetPropertySchema: yup.ObjectSchema<AstarteDeviceUnsetPropertyObject> = yup
  .object({
    device_id: yup.string().required(),
    timestamp: yup.number().integer().min(0).required(),
    event: yup
      .object({
        type: yup.string().oneOf(['incoming_data']).required(),
        interface: yup.string().required(),
        path: yup.string().required(),
        value: yup.mixed().oneOf([null]).defined(),
      })
      .required(),
  })
  .required();

export class AstarteDeviceUnsetPropertyEvent extends AstarteDeviceBaseEvent {
  readonly interfaceName: string;

  readonly path: string;

  constructor(obj: AstarteDeviceUnsetPropertyObject) {
    super(obj);
    const validatedObj = astarteDeviceUnsetPropertySchema.validateSync(obj);
    this.interfaceName = validatedObj.event.interface;
    this.path = validatedObj.event.path;
  }
}
