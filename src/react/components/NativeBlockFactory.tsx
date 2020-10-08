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

import React from 'react';
import _ from 'lodash';
import { AbstractReactFactory, BaseModel } from '@projectstorm/react-canvas-core';
import { DefaultPortLabel, DiagramEngine } from '@projectstorm/react-diagrams';
import type { AstarteBlock } from 'astarte-client';

import NativeBlockModel from '../models/NativeBlockModel';
import NativeBlockWidget from './NativeBlockWidget';

type GenerateReactWidgetEvent = Parameters<AbstractReactFactory['generateReactWidget']>['0'];

type GenerateModelEvent = Parameters<AbstractReactFactory['generateModel']>['0'] & {
  name: AstarteBlock['name'];
  onSettingsClick?: (...args: any[]) => void;
};

class NativeBlockFactory extends AbstractReactFactory<BaseModel, DiagramEngine> {
  blockDefinitions: Map<AstarteBlock['name'], AstarteBlock>;

  constructor(blockDefinitions: AstarteBlock[]) {
    super('astarte-native');
    this.blockDefinitions = new Map();
    this.updateDefinitions(blockDefinitions);
  }

  generateReactWidget(event: GenerateReactWidgetEvent): React.ReactElement {
    const node = event.model as NativeBlockModel;
    const block = this.blockDefinitions.get(node.name);
    if (!block) {
      return <></>;
    }
    const hasSettings = !_.isEmpty(block.schema) && !_.isEmpty(block.schema.properties);
    const engine = this.engine as DefaultPortLabel['props']['engine'];
    return <NativeBlockWidget engine={engine} node={node} hasSettings={hasSettings} />;
  }

  generateModel({ name, onSettingsClick }: GenerateModelEvent): NativeBlockModel {
    const block = this.blockDefinitions.get(name);
    return new NativeBlockModel({
      name,
      blockType: block ? block.type : 'producer',
      onSettingsClick,
    });
  }

  updateDefinitions(blocks: AstarteBlock[]): void {
    if (blocks && blocks.length > 0) {
      this.blockDefinitions = new Map(blocks.map((b) => [b.name, b]));
    } else {
      this.blockDefinitions = new Map();
    }
  }
}

export default NativeBlockFactory;
