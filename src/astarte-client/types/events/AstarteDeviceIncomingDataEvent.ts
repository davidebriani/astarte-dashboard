/* eslint-disable camelcase */
/* eslint-disable no-template-curly-in-string */
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
import _ from 'lodash';

import { AstarteDeviceBaseEvent } from './AstarteDeviceBaseEvent';
import type { AstarteDataValue } from '../dataType';

type IndividualValue = NonNullable<AstarteDataValue>;
type ObjectValue = { [key: string]: NonNullable<AstarteDataValue> };

interface AstarteDeviceIncomingDataObject {
  device_id: string;
  timestamp: number;
  event: {
    type: 'incoming_data';
    interface: string;
    path: string;
    value: IndividualValue | ObjectValue;
  };
}

const astarteIndividualValueSchema = yup
  .mixed()
  .required()
  .test('Astarte object value', '${path} must be an Astarte object value', (value: unknown) =>
    [
      yup.string().required(),
      yup.number().required(),
      yup.boolean().required(),
      yup.array(yup.string().required()).defined(),
      yup.array(yup.number().required()).defined(),
      yup.array(yup.boolean().required()).defined(),
    ].some((schema) => schema.isValidSync(value)),
  );

const astarteObjectValueSchema = yup
  .mixed<ObjectValue>()
  .required()
  .test(
    'Astarte object value',
    '${path} must be an Astarte object value',
    (obj: any) =>
      _.isPlainObject(obj) &&
      Object.values(obj).every((value) => astarteIndividualValueSchema.isValidSync(value)),
  );

const astarteDeviceIncomingDataSchema: yup.ObjectSchema<AstarteDeviceIncomingDataObject> = yup
  .object({
    device_id: yup.string().required(),
    timestamp: yup.number().integer().min(0).required(),
    event: yup
      .object({
        type: yup.string().oneOf(['incoming_data']).required(),
        interface: yup.string().required(),
        path: yup.string().required(),
        value: yup
          .mixed()
          .required()
          .test(
            'Astarte individual or object value',
            '${path} must be an Astarte individual or object value',
            (value: unknown) =>
              [astarteIndividualValueSchema, astarteObjectValueSchema].some((schema) =>
                schema.isValidSync(value),
              ),
          ),
      })
      .required(),
  })
  .required();

export class AstarteDeviceIncomingDataEvent extends AstarteDeviceBaseEvent {
  readonly interfaceName: string;

  readonly path: string;

  readonly value: IndividualValue | ObjectValue;

  constructor(obj: AstarteDeviceIncomingDataObject) {
    super(obj);
    const validatedObj = astarteDeviceIncomingDataSchema.validateSync(obj);
    this.interfaceName = validatedObj.event.interface;
    this.path = validatedObj.event.path;
    this.value = validatedObj.event.value;
  }
}
