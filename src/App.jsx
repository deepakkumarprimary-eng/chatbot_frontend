import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import { Modal, Button, Form } from "react-bootstrap";

import "@xyflow/react/dist/style.css";
import { DecisionNode } from "./module/DecisionNode";
import NodeDetails from "./module/NodeDetails";

/* ─── StateNode ─────────────────────────────────────────────────────────── */
function StateNode({ id, data }) {
  return (
    <div
      style={{
        background: "#4f63ff",
        color: "#fff",
        padding: "16px",
        borderRadius: 10,
        minWidth: 180,
        textAlign: "center",
        position: "relative",
      }}
    >
      <Handle type="target" position={Position.Top} />
      <div style={{ fontWeight: 600, marginBottom: 10 }}>{data.label}</div>
      <button
        className="nodrag nopan"
        onClick={(e) => { e.stopPropagation(); data.onAdd(id); }}
        style={{ width: 30, height: 30, borderRadius: "50%", border: "none", cursor: "pointer", fontSize: 18 }}
      >
        +
      </button>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

const nodeTypes = { state: StateNode, decision: DecisionNode };

/* ─── App ───────────────────────────────────────────────────────────────── */
export default function App() {
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);

  // ── Workflow name modal state ──────────────────────────────────────────
  const [showNameModal, setShowNameModal] = useState(false);
  const [workflowName, setWorkflowName] = useState("");
  const [workflowNameError, setWorkflowNameError] = useState("");
  const nameInputRef = useRef(null);

  // ── Saving state ───────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);

  /* ── addChildNode ──────────────────────────────────────────────────────── */
  const addChildNode = useCallback(
    (parentId) => {
      const parent = nodes.find((n) => n.id === parentId);
      if (!parent) return;

      const outgoingEdges = edges.filter((e) => e.source === parentId);
      const newNodeId = Date.now().toString();

      if (outgoingEdges.length === 0) {
        setNodes((nds) => [
          ...nds,
          {
            id: newNodeId,
            type: "state",
            position: { x: parent.position.x, y: parent.position.y + 180 },
            data: { label: "New State", config: { isNodeConfigRequired: false, nodeType: undefined, headers: [] } },
          },
        ]);
        setEdges((eds) => [...eds, { id: `${parentId}-${newNodeId}`, source: parentId, target: newNodeId, data: { condition: "" } }]);
        return;
      }

      const firstTarget = outgoingEdges[0]?.target;
      const decisionNode = nodes.find((n) => n.id === firstTarget && n.type === "decision");

      if (decisionNode) {
        setNodes((nds) => [
          ...nds,
          {
            id: newNodeId,
            type: "state",
            position: { x: decisionNode.position.x + outgoingEdges.length * 250, y: decisionNode.position.y + 180 },
            data: { label: "New State", config: { isNodeConfigRequired: false, nodeType: undefined, headers: [] } },
          },
        ]);
        setEdges((eds) => [...eds, { id: `${decisionNode.id}-${newNodeId}`, source: decisionNode.id, target: newNodeId, data: { condition: "" } }]);
        return;
      }

      const existingTarget = outgoingEdges[0].target;
      const decisionId = `decision-${Date.now()}`;

      setNodes((nds) => [
        ...nds,
        { id: decisionId, type: "decision", position: { x: parent.position.x, y: parent.position.y + 120 }, data: { label: "Decision" } },
        {
          id: newNodeId,
          type: "state",
          position: { x: parent.position.x + 250, y: parent.position.y + 300 },
          data: { label: "New State", config: { isNodeConfigRequired: false, nodeType: undefined, headers: [] } },
        },
      ]);

      setEdges((eds) => {
        const filtered = eds.filter((e) => e.id !== outgoingEdges[0].id);
        return [
          ...filtered,
          { id: `${parentId}-${decisionId}`, source: parentId, target: decisionId },
          { id: `${decisionId}-${existingTarget}`, source: decisionId, target: existingTarget, data: { condition: "Condition 1" }, label: "Condition 1" },
          { id: `${decisionId}-${newNodeId}`, source: decisionId, target: newNodeId, data: { condition: "Condition 2" }, label: "Condition 2" },
        ];
      });
    },
    [nodes, edges]
  );

  /* ── nodesWithActions ─────────────────────────────────────────────────── */
  const nodesWithActions = useMemo(
    () => nodes.map((node) => ({ ...node, data: { ...node.data, onAdd: addChildNode } })),
    [nodes, addChildNode]
  );

  /* ── Open name modal (intercepts "Create Workflow" click) ─────────────── */
  const openNameModal = () => {
    setWorkflowName("");
    setWorkflowNameError("");
    setShowNameModal(true);
    // auto-focus input after modal renders
    setTimeout(() => nameInputRef.current?.focus(), 150);
  };

  /* ── Confirm name → create root node ──────────────────────────────────── */
  const confirmCreateWorkflow = () => {
    const trimmed = workflowName.trim();
    if (!trimmed) {
      setWorkflowNameError("Workflow name is required.");
      nameInputRef.current?.focus();
      return;
    }
    if (trimmed.length > 100) {
      setWorkflowNameError("Name must be 100 characters or fewer.");
      return;
    }

    setShowNameModal(false);

    const id = Date.now().toString();
    setNodes([
      {
        id,
        type: "state",
        position: { x: 300, y: 100 },
        data: { label: "Start State", onAdd: addChildNode },
      },
    ]);
    setEdges([]);
  };

  /* ── updateLabel / deleteNode ─────────────────────────────────────────── */
  const updateLabel = (value) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === selectedNodeId ? { ...node, data: { ...node.data, label: value } } : node
      )
    );
  };

  const deleteNode = () => {
    if (!selectedNodeId) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
    setSelectedNodeId(null);
  };

  /* ── saveWorkflow ─────────────────────────────────────────────────────── */
  const saveWorkflow = async () => {
    const workflowData = {
      name: workflowName.trim(),
      workflowJson: {   // ← sent to backend
        nodes: nodes.map((node) => ({
          id: node.id,
          type: node.type,
          name: node.data.label,
          position: node.position,
          config: node.data.config || null,
          decision: node.type === "decision" ? { label: node.data.label } : null,
        })),
        transitions: edges.map((edge) => ({
          id: edge.id,
          sourceNodeId: edge.source,
          targetNodeId: edge.target,
          condition: edge.data?.condition || "",
        })),
      }
    };

    try {
      setSaving(true);
      const res = await fetch("http://localhost:8080/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(workflowData),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Save failed");
      }

      alert("Workflow saved successfully");
    } catch (error) {
      console.error(error);
      alert(`Failed to save workflow: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  /* ── handleNodeClick ──────────────────────────────────────────────────── */
  const handleNodeClick = (e, node) => {
    if (e.target.tagName === "BUTTON" || e.target.closest("button")) return;
    setSelectedNodeId(node.id);
    setSelectedNode(node);
  };

  /* ─── Render ────────────────────────────────────────────────────────── */
  return (
    <>
      {/* ── ReactFlow canvas ──────────────────────────────────────────── */}
      <div style={{ display: "flex", height: "100%" }}>
        <div style={{ flex: 1, position: "relative" }}>

          {/* Create Workflow button */}
          {nodes.length === 0 && (
            <button
              onClick={openNameModal}
              style={{ position: "absolute", top: 20, left: 20, zIndex: 1000, padding: "12px 20px" }}
            >
              Create Workflow
            </button>
          )}

          {/* Save Workflow button */}
          {nodes.length > 0 && (
            <div style={{ position: "absolute", top: 20, left: 20, zIndex: 1000, display: "flex", alignItems: "center", gap: 10 }}>
              {/* workflow name badge */}
              {workflowName && (
                <span
                  style={{
                    background: "#f0f4ff",
                    border: "1px solid #c7d2fe",
                    color: "#4338ca",
                    borderRadius: 8,
                    padding: "6px 14px",
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                >
                  📋 {workflowName}
                </span>
              )}
              <button
                className="btn btn-success"
                style={{ padding: "10px 20px" }}
                onClick={saveWorkflow}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save Workflow"}
              </button>
            </div>
          )}

          <ReactFlow
            nodes={nodesWithActions}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>
      </div>

      {/* ── Workflow Name Modal ────────────────────────────────────────── */}
      <Modal
        show={showNameModal}
        onHide={() => setShowNameModal(false)}
        centered
        size="sm"
      >
        <Modal.Header closeButton style={{ borderBottom: "1px solid #e5e7eb", padding: "18px 24px" }}>
          <Modal.Title style={{ fontSize: 18, fontWeight: 700 }}>
            🗂️ Name Your Workflow
          </Modal.Title>
        </Modal.Header>

        <Modal.Body style={{ padding: "24px" }}>
          <Form
            onSubmit={(e) => {
              e.preventDefault();
              confirmCreateWorkflow();
            }}
          >
            <Form.Group>
              <Form.Label style={{ fontWeight: 600, marginBottom: 6 }}>
                Workflow Name <span style={{ color: "#ef4444" }}>*</span>
              </Form.Label>
              <Form.Control
                ref={nameInputRef}
                type="text"
                value={workflowName}
                onChange={(e) => {
                  setWorkflowName(e.target.value);
                  if (workflowNameError) setWorkflowNameError("");
                }}
                placeholder="e.g. Track Shipment, OTP Verification…"
                isInvalid={!!workflowNameError}
                maxLength={100}
                autoComplete="off"
              />
              <Form.Control.Feedback type="invalid">
                {workflowNameError}
              </Form.Control.Feedback>
              <Form.Text className="text-muted" style={{ fontSize: 12 }}>
                {workflowName.length}/100 characters
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>

        <Modal.Footer style={{ borderTop: "1px solid #e5e7eb", padding: "14px 24px", gap: 8 }}>
          <Button
            variant="outline-secondary"
            onClick={() => setShowNameModal(false)}
            style={{ borderRadius: 8, minWidth: 80 }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={confirmCreateWorkflow}
            disabled={!workflowName.trim()}
            style={{ borderRadius: 8, minWidth: 140 }}
          >
            Create Workflow
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ── Node Settings Modal ────────────────────────────────────────── */}
      <Modal
        show={!!selectedNode}
        onHide={() => { setSelectedNode(null); setSelectedNodeId(null); }}
        size="xl"
        dialogClassName="workflow-modal"
        contentClassName="workflow-content"
      >
        <Modal.Header closeButton className="workflow-header">
          <Modal.Title>⚙️ Node Settings</Modal.Title>
        </Modal.Header>

        <Modal.Body className="workflow-body">
          {selectedNode && (
            <NodeDetails
              selectedNode={selectedNode}
              edges={edges}
              setEdges={setEdges}
              updateLabel={updateLabel}
              setSelectedNode={setSelectedNode}
              setNodes={setNodes}
              nodes={nodes}
            />
          )}
        </Modal.Body>

        <Modal.Footer className="workflow-footer">
          <Button
            variant="outline-danger"
            onClick={() => { deleteNode(); setSelectedNode(null); setSelectedNodeId(null); }}
          >
            Delete Node
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
