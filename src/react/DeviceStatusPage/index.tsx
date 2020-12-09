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

import React, { useCallback, useState } from 'react';
import { Col, Container, Row, Spinner } from 'react-bootstrap';
import _ from 'lodash';

import AstarteClient from 'astarte-client';
import type { AstarteDevice } from 'astarte-client';
import BackButton from '../ui/BackButton';
import WaitForData from '../components/WaitForData';
import useFetch from '../hooks/useFetch';

import DeviceInfoCard from './DeviceInfoCard';
import AliasesCard from './AliasesCard';
import MetadataCard from './MetadataCard';
import GroupsCard from './GroupsCard';
import IntrospectionCard from './IntrospectionCard';
import PreviousInterfacesCard from './PreviousInterfacesCard';
import ExchangedBytesCard from './ExchangedBytesCard';
import DeviceStatusEventsCard from './DeviceStatusEventsCard';
import DeviceLiveEventsCard from './DeviceLiveEventsCard';

import NewAliasModal from './NewAliasModal';
import EditAliasModal from './EditAliasModal';
import NewMetadataModal from './NewMetadataModal';
import EditMetadataModal from './EditMetadataModal';
import ConfirmModal from '../components/modals/Confirm';

type WipeCredentialsModalT = {
  kind: 'wipe_credentials_modal';
  isWipingCredentials: boolean;
};

type AddToGroupModalT = {
  kind: 'add_to_group_modal';
  isAddingToGroup: boolean;
};

type NewAliasModalT = {
  kind: 'new_alias_modal';
  isAddingAlias: boolean;
};

type EditAliasModalT = {
  kind: 'edit_alias_modal';
  isUpdatingAlias: boolean;
  targetAlias: string;
};

type DeleteAliasModalT = {
  kind: 'delete_alias_modal';
  isDeletingAlias: boolean;
  aliasKey: string;
  aliasValue: string;
};

type NewMetadataModalT = {
  kind: 'new_metadata_modal';
  isAddingMetadata: boolean;
};

type EditMetadataModalT = {
  kind: 'edit_metadata_modal';
  isUpdatingMetadata: boolean;
  targetMetadata: string;
};

type DeleteMetadataModalT = {
  kind: 'delete_metadata_modal';
  isDeletingMetadata: boolean;
  metadataKey: string;
  metadataValue: string;
};

function isWipeCredentialsModal(modal: PageModal): modal is WipeCredentialsModalT {
  return modal.kind === 'wipe_credentials_modal';
}

function isAddToGroupModal(modal: PageModal): modal is AddToGroupModalT {
  return modal.kind === 'add_to_group_modal';
}

function isNewAliasModal(modal: PageModal): modal is NewAliasModalT {
  return modal.kind === 'new_alias_modal';
}

function isEditAliasModal(modal: PageModal): modal is EditAliasModalT {
  return modal.kind === 'edit_alias_modal';
}

function isDeleteAliasModal(modal: PageModal): modal is DeleteAliasModalT {
  return modal.kind === 'delete_alias_modal';
}

function isNewMetadataModal(modal: PageModal): modal is NewMetadataModalT {
  return modal.kind === 'new_metadata_modal';
}

function isEditMetadataModal(modal: PageModal): modal is EditMetadataModalT {
  return modal.kind === 'edit_metadata_modal';
}

function isDeleteMetadataModal(modal: PageModal): modal is DeleteMetadataModalT {
  return modal.kind === 'delete_metadata_modal';
}

type PageModal =
  | WipeCredentialsModalT
  | AddToGroupModalT
  | NewAliasModalT
  | EditAliasModalT
  | DeleteAliasModalT
  | NewMetadataModalT
  | EditMetadataModalT
  | DeleteMetadataModalT;

interface Props {
  astarte: AstarteClient;
  history: any;
  deviceId: string;
}

export default ({ history, astarte, deviceId }: Props): React.ReactElement => {
  const deviceFetcher = useFetch(() => astarte.getDeviceInfo(deviceId));
  const [activeModal, setActiveModal] = useState<PageModal | null>(null);

  const dismissModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  const inhibitDeviceCredentialsRequests = useCallback(
    (inhibit) => {
      astarte
        .inhibitDeviceCredentialsRequests(deviceId, inhibit)
        .then(() => {
          deviceFetcher.refresh();
        })
        .catch(() => {
          // TODO add alert
        });
    },
    [astarte, deviceId],
  );

  const wipeDeviceCredentials = useCallback(() => {
    astarte
      .wipeDeviceCredentials(deviceId)
      .then(() => {
        dismissModal();
      })
      .catch(() => {
        // TODO add alert
        dismissModal();
      });
  }, [astarte, deviceId]);

  const handleAliasUpdate = useCallback(
    (key, value) => {
      astarte
        .insertDeviceAlias(deviceId, key, value)
        .then(() => {
          dismissModal();
          deviceFetcher.refresh();
        })
        .catch(() => {
          // TODO add alert
          dismissModal();
        });
    },
    [astarte, deviceId],
  );

  const handleAliasDeletion = useCallback(
    (key) => {
      astarte
        .deleteDeviceAlias(deviceId, key)
        .then(() => {
          dismissModal();
          deviceFetcher.refresh();
        })
        .catch(() => {
          // TODO add alert
          dismissModal();
        });
    },
    [astarte, deviceId],
  );

  const handleMetadataUpdate = useCallback(
    (key, value) => {
      astarte
        .insertDeviceMetadata(deviceId, key, value)
        .then(() => {
          dismissModal();
          deviceFetcher.refresh();
        })
        .catch(() => {
          // TODO add alert
          dismissModal();
        });
    },
    [astarte, deviceId],
  );

  const handleMetadataDeletion = useCallback(
    (key) => {
      astarte
        .deleteDeviceMetadata(deviceId, key)
        .then(() => {
          dismissModal();
          deviceFetcher.refresh();
        })
        .catch(() => {
          // TODO add alert
          dismissModal();
        });
    },
    [astarte, deviceId],
  );

  return (
    <Container fluid className="p-3">
      <Row>
        <Col>
          <h2 className="pl-2">
            <BackButton href={`/devices`} />
            Device
          </h2>
        </Col>
      </Row>
      <WaitForData
        data={deviceFetcher.value}
        status={deviceFetcher.status}
        fallback={
          _.isEmpty(deviceFetcher.error) ? <Spinner animation="border" role="status" /> : <></>
        }
      >
        {(device: AstarteDevice) => (
          <Row>
            <DeviceInfoCard
              device={device}
              onInhibitCredentialsClick={() => inhibitDeviceCredentialsRequests(true)}
              onEnableCredentialsClick={() => inhibitDeviceCredentialsRequests(false)}
              onWipeCredentialsClick={() =>
                setActiveModal({
                  kind: 'wipe_credentials_modal',
                  isWipingCredentials: false,
                })
              }
            />
            <AliasesCard
              device={device}
              onNewAliasClick={() =>
                setActiveModal({
                  kind: 'new_alias_modal',
                  isAddingAlias: false,
                })
              }
              onEditAliasClick={(alias) =>
                setActiveModal({
                  kind: 'edit_alias_modal',
                  targetAlias: alias,
                  isUpdatingAlias: false,
                })
              }
              onRemoveAliasClick={({ key, value }) =>
                setActiveModal({
                  kind: 'delete_alias_modal',
                  aliasKey: key,
                  aliasValue: value,
                  isDeletingAlias: false,
                })
              }
            />
            <MetadataCard
              device={device}
              onNewMetadataClick={() =>
                setActiveModal({
                  kind: 'new_metadata_modal',
                  isAddingMetadata: false,
                })
              }
              onEditMetadataClick={(metadata) =>
                setActiveModal({
                  kind: 'edit_metadata_modal',
                  targetMetadata: metadata,
                  isUpdatingMetadata: false,
                })
              }
              onRemoveMetadataClick={({ key, value }) =>
                setActiveModal({
                  kind: 'delete_metadata_modal',
                  metadataKey: key,
                  metadataValue: value,
                  isDeletingMetadata: false,
                })
              }
            />
            <GroupsCard device={device} />
            <IntrospectionCard device={device} />
            <PreviousInterfacesCard device={device} />
            <ExchangedBytesCard device={device} />
            <DeviceStatusEventsCard device={device} />
            <DeviceLiveEventsCard astarte={astarte} deviceId={device.id} />
          </Row>
        )}
      </WaitForData>
      {}
      {activeModal && isWipeCredentialsModal(activeModal) && (
        <ConfirmModal
          title="Wipe Device Credentials"
          confirmLabel="Wipe credentials"
          confirmVariant="danger"
          onCancel={dismissModal}
          onConfirm={() => {
            setActiveModal({ ...activeModal, isWipingCredentials: true });
            wipeDeviceCredentials();
          }}
          isConfirming={activeModal.isWipingCredentials}
        >
          <p>
            This will remove the current device credential secret from Astarte, forcing the device
            to register again and store its new credentials secret. Continue?
          </p>
        </ConfirmModal>
      )}
      {activeModal && isAddToGroupModal(activeModal) && (
        <ConfirmModal
          title="Wipe Device Credentials"
          confirmLabel="Wipe credentials"
          onCancel={dismissModal}
          onConfirm={() => {
            setActiveModal({ ...activeModal, isAddingToGroup: true });
          }}
          isConfirming={activeModal.isAddingToGroup}
        >
          <p>WIP</p>
        </ConfirmModal>
      )}
      {activeModal && isNewAliasModal(activeModal) && (
        <NewAliasModal
          onCancel={dismissModal}
          onConfirm={({ key, value }) => {
            setActiveModal({ ...activeModal, isAddingAlias: true });
            handleAliasUpdate(key, value);
          }}
          isAddingAlias={activeModal.isAddingAlias}
        />
      )}
      {activeModal && isEditAliasModal(activeModal) && (
        <EditAliasModal
          onCancel={dismissModal}
          onConfirm={({ value }) => {
            setActiveModal({ ...activeModal, isUpdatingAlias: true });
            handleAliasUpdate(activeModal.targetAlias, value);
          }}
          targetAlias={activeModal.targetAlias}
          isUpdatingAlias={activeModal.isUpdatingAlias}
        />
      )}
      {activeModal && isDeleteAliasModal(activeModal) && (
        <ConfirmModal
          title="Delete Alias"
          confirmLabel="Delete"
          confirmVariant="danger"
          onCancel={dismissModal}
          onConfirm={() => {
            setActiveModal({ ...activeModal, isDeletingAlias: true });
            handleAliasDeletion(activeModal.aliasKey);
          }}
          isConfirming={activeModal.isDeletingAlias}
        >
          <p>{`Delete alias "${activeModal.aliasValue}"?`}</p>
        </ConfirmModal>
      )}
      {activeModal && isNewMetadataModal(activeModal) && (
        <NewMetadataModal
          onCancel={dismissModal}
          onConfirm={({ key, value }) => {
            setActiveModal({ ...activeModal, isAddingMetadata: true });
            handleMetadataUpdate(key, value);
          }}
          isAddingMetadata={activeModal.isAddingMetadata}
        />
      )}
      {activeModal && isEditMetadataModal(activeModal) && (
        <EditMetadataModal
          onCancel={dismissModal}
          onConfirm={({ value }) => {
            setActiveModal({ ...activeModal, isUpdatingMetadata: true });
            handleMetadataUpdate(activeModal.targetMetadata, value);
          }}
          targetMetadata={activeModal.targetMetadata}
          isUpdatingMetadata={activeModal.isUpdatingMetadata}
        />
      )}
      {activeModal && isDeleteMetadataModal(activeModal) && (
        <ConfirmModal
          title="Delete Metadata"
          confirmLabel="Delete"
          confirmVariant="danger"
          onCancel={dismissModal}
          onConfirm={() => {
            setActiveModal({ ...activeModal, isDeletingMetadata: true });
            handleMetadataDeletion(activeModal.metadataKey);
          }}
          isConfirming={activeModal.isDeletingMetadata}
        >
          <p>{`Do you want to delete "${activeModal.metadataKey}" from metadata?`}</p>
        </ConfirmModal>
      )}
    </Container>
  );
};
