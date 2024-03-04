/*
   This file is part of Astarte.

   Copyright 2020-2024 SECO Mind Srl

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

import { Suspense, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Col, Container, Row, Spinner } from 'react-bootstrap';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { AstarteCustomBlock } from 'astarte-client';
import { useMutation, useSuspenseQuery, useQueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';

import { AlertsBanner, useAlerts } from './AlertManager';
import { useAstarte } from './AstarteManager';
import Empty from './components/Empty';
import ConfirmModal from './components/modals/Confirm';
import SingleCardPage from './ui/SingleCardPage';

const blockTypeToLabel = {
  consumer: 'Consumer',
  producer: 'Producer',
  producer_consumer: 'Producer & Consumer',
};

function BlockSource() {
  const { blockId = '' } = useParams();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletionAlerts, deletionAlertsController] = useAlerts();
  const navigate = useNavigate();
  const astarte = useAstarte();
  const blockQuery = useSuspenseQuery({
    queryKey: ['block', blockId],
    queryFn: () => astarte.client.getBlock(blockId),
  });
  const deleteBlockMutation = useMutation({
    mutationFn: () => astarte.client.deleteBlock(blockId),
    onSuccess: () => navigate('/blocks'),
    onError: (error) => {
      deletionAlertsController.showError(`Couldn't delete block: ${error.message}`);
      setShowDeleteModal(false);
    },
  });

  const block = blockQuery.data;

  return (
    <>
      <AlertsBanner alerts={deletionAlerts} />
      <Row>
        <Col>
          <h5 className="mt-2 mb-2">Name</h5>
          <p>{block.name}</p>
          <h5 className="mt-2 mb-2">Type</h5>
          <p>{blockTypeToLabel[block.type]}</p>
          {block instanceof AstarteCustomBlock && (
            <>
              <h5 className="mt-2 mb-2">Source</h5>
              <SyntaxHighlighter language="json" showLineNumbers>
                {block.source}
              </SyntaxHighlighter>
            </>
          )}
          <h5 className="mt-2 mb-2">Schema</h5>
          <SyntaxHighlighter language="json" showLineNumbers>
            {JSON.stringify(block.schema, null, 2)}
          </SyntaxHighlighter>
        </Col>
      </Row>
      {block instanceof AstarteCustomBlock && (
        <Row className="justify-content-end m-2">
          <Button
            variant="danger"
            onClick={() => setShowDeleteModal(true)}
            disabled={deleteBlockMutation.isPending}
          >
            {deleteBlockMutation.isPending && (
              <Spinner as="span" size="sm" animation="border" role="status" className="mr-2" />
            )}
            Delete block
          </Button>
        </Row>
      )}
      {showDeleteModal && (
        <ConfirmModal
          title="Warning"
          confirmLabel="Delete"
          confirmVariant="danger"
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={() => deleteBlockMutation.mutate()}
          isConfirming={deleteBlockMutation.isPending}
        >
          <p>
            Delete block <b>{blockId}</b>?
          </p>
        </ConfirmModal>
      )}
    </>
  );
}

function BlockSourcePage() {
  const queryErrorBoundary = useQueryErrorResetBoundary();

  return (
    <SingleCardPage title="Block Details" backLink="/blocks">
      <Suspense
        fallback={
          <Container fluid className="text-center">
            <Spinner animation="border" role="status" />
          </Container>
        }
      >
        <ErrorBoundary
          FallbackComponent={(props) => (
            <Empty title="Couldn't load block source" onRetry={props.resetErrorBoundary} />
          )}
          onReset={queryErrorBoundary.reset}
        >
          <BlockSource />
        </ErrorBoundary>
      </Suspense>
    </SingleCardPage>
  );
}

export default BlockSourcePage;
