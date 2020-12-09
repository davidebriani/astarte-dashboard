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
import FormModal from '../components/modals/Form';
import type { JSONSchema7 } from 'json-schema';

interface MetadataKeyValue {
  key: string;
  value?: string;
}

const metadataFormSchema: JSONSchema7 = {
  type: 'object',
  required: ['key'],
  properties: {
    key: {
      title: 'Key',
      type: 'string',
    },
    value: {
      title: 'Value',
      type: 'string',
    },
  },
};

interface NewMetadataModalProps {
  onCancel: () => void;
  onConfirm: ({ key, value }: MetadataKeyValue) => void;
  isAddingMetadata: boolean;
}

const NewMetadataModal = ({
  onCancel,
  onConfirm,
  isAddingMetadata,
}: NewMetadataModalProps): React.ReactElement => (
  <FormModal
    title="Add New Metadata"
    schema={metadataFormSchema}
    onCancel={onCancel}
    onConfirm={onConfirm}
    isConfirming={isAddingMetadata}
  />
);

export default NewMetadataModal;
