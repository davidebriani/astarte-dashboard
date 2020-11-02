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

import React, { useCallback, useRef, useState } from 'react';
import { Button, Modal, Spinner } from 'react-bootstrap';
import type { ModalProps } from 'react-bootstrap';
import metaSchemaDraft04 from 'ajv/lib/refs/json-schema-draft-04.json';
import JsonSchemaForm from '@rjsf/bootstrap-4';
import type { ComponentProps } from 'react';

const additionalMetaSchemas = [metaSchemaDraft04];

type JsonSchemaFormProps = ComponentProps<typeof JsonSchemaForm>;

type BoostrapVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'light'
  | 'dark'
  | 'link';

const checkContainedValidForm = (element: HTMLElement) => {
  return !!element.querySelector('form:valid');
};

interface Props {
  cancelLabel?: string;
  confirmLabel?: string;
  confirmVariant?: BoostrapVariant;
  initialData?: JsonSchemaFormProps['formData'];
  isConfirming?: boolean;
  onCancel: () => void;
  onConfirm: (formData: any) => void;
  schema: JsonSchemaFormProps['schema'];
  size?: ModalProps['size'];
  title: React.ReactNode;
  uiSchema?: JsonSchemaFormProps['uiSchema'];
}

const FormModal = ({
  cancelLabel = 'Cancel',
  confirmLabel = 'Confirm',
  confirmVariant = 'primary',
  initialData,
  isConfirming = false,
  onCancel,
  onConfirm,
  schema,
  size = 'lg',
  title,
  uiSchema,
}: Props): React.ReactElement => {
  const modalBodyRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = React.useState(initialData || null);
  const [isValidForm, setIsValidForm] = useState(false);

  const handleJsonSchemaFormSubmit = useCallback(
    (event: any) => {
      onConfirm(event.formData);
    },
    [onConfirm],
  );

  const handleJsonSchemaFormChange = useCallback(
    (event: any) => {
      const isValid = modalBodyRef.current != null && checkContainedValidForm(modalBodyRef.current);
      setFormData(event.formData);
      setIsValidForm(isValid);
    },
    [modalBodyRef, setIsValidForm],
  );

  return (
    <Modal show centered size={size} onHide={onCancel}>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div ref={modalBodyRef}>
          <JsonSchemaForm
            schema={schema}
            additionalMetaSchemas={additionalMetaSchemas}
            uiSchema={uiSchema}
            formData={formData}
            onChange={handleJsonSchemaFormChange}
            onSubmit={handleJsonSchemaFormSubmit}
            showErrorList={false}
          >
            <hr style={{ display: 'block', marginLeft: '-1em', marginRight: '-1em' }} />
            <div className="d-flex justify-content-end">
              <Button variant="secondary mr-2" onClick={onCancel}>
                {cancelLabel}
              </Button>
              <Button
                type="submit"
                variant={confirmVariant}
                disabled={!isValidForm || isConfirming}
              >
                {isConfirming && (
                  <Spinner className="mr-2" size="sm" animation="border" role="status" />
                )}
                {confirmLabel}
              </Button>
            </div>
          </JsonSchemaForm>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default FormModal;
