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

import { AstarteDeviceEvent } from './AstarteDeviceEvent';
import { AstarteDeviceConnectedEvent } from './AstarteDeviceConnectedEvent';
import { AstarteDeviceDisconnectedEvent } from './AstarteDeviceDisconnectedEvent';
//import { AstarteDeviceErrorEvent } from './AstarteDeviceErrorEvent';
import { AstarteDeviceIncomingDataEvent } from './AstarteDeviceIncomingDataEvent';
import { AstarteDeviceUnsetPropertyEvent } from './AstarteDeviceUnsetPropertyEvent';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function decodeEvent(arg: any): AstarteDeviceEvent | null {
  return decodeAnyOf(
    [
      AstarteDeviceConnectedEvent.fromJSON,
      AstarteDeviceDisconnectedEvent.fromJSON,
      AstarteDeviceUnsetPropertyEvent.fromJSON,
      AstarteDeviceIncomingDataEvent.fromJSON,
    ],
    arg,
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventDecoder = (arg: any) => AstarteDeviceEvent;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function decodeAnyOf(decoders: EventDecoder[], value: any): AstarteDeviceEvent | null {
  let decodedValue = null;

  for (let i = 0; i < decoders.length && decodedValue === null; i += 1) {
    try {
      decodedValue = decoders[i](value);
    } catch (err) {
      // decoder not matching
    }
  }

  return decodedValue;
}

export {
  AstarteDeviceEvent,
  AstarteDeviceConnectedEvent,
  AstarteDeviceDisconnectedEvent,
  AstarteDeviceErrorEvent,
  AstarteDeviceIncomingDataEvent,
  AstarteDeviceUnsetPropertyEvent,
  decodeEvent,
};
