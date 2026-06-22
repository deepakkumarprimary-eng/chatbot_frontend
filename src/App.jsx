import { useCallback, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  addEdge,
} from "@xyflow/react";
import { Modal, Button, Form } from "react-bootstrap";

import "@xyflow/react/dist/style.css";
import { DecisionNode } from "./module/DecisionNode";
import { WorkflowNode } from "./module/WorkflowNode";
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
        boxShadow: "0 4px 12px rgba(79,99,255,0.35)",
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

const nodeTypes = {
  state: StateNode,
  decision: DecisionNode,
  workflow: WorkflowNode,
};

/* ─── App ───────────────────────────────────────────────────────────────── */
export default function App() {
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);

  // Workflow name modal
  const [showNameModal, setShowNameModal] = useState(false);
  const [workflowName, setWorkflowName] = useState("");
  const [workflowNameError, setWorkflowNameError] = useState("");
  const nameInputRef = useRef(null);

  const [saving, setSaving] = useState(false);

  /* ── onConnect — allows manual drag-connections for loop-back edges ───── */
  const onConnect = useCallback(
    (params) =>
      setEdges((eds) =>
        addEdge({ ...params, data: { condition: "" } }, eds)
      ),
    [setEdges]
  );

  /* ── addChildNode ─────────────────────────────────────────────────────── */
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
      const existingDecision = nodes.find((n) => n.id === firstTarget && n.type === "decision");

      if (existingDecision) {
        setNodes((nds) => [
          ...nds,
          {
            id: newNodeId,
            type: "state",
            position: { x: existingDecision.position.x + outgoingEdges.length * 250, y: existingDecision.position.y + 180 },
            data: { label: "New State", config: { isNodeConfigRequired: false, nodeType: undefined, headers: [] } },
          },
        ]);
        setEdges((eds) => [...eds, { id: `${existingDecision.id}-${newNodeId}`, source: existingDecision.id, target: newNodeId, data: { condition: "" } }]);
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

  /* ── Add a Workflow Link node ─────────────────────────────────────────── */
  const addWorkflowNode = () => {
    const id = `workflow-${Date.now()}`;
    // Place near the centre of the current view
    const lastNode = nodes[nodes.length - 1];
    const position = lastNode
      ? { x: lastNode.position.x + 300, y: lastNode.position.y }
      : { x: 300, y: 300 };

    setNodes((nds) => [
      ...nds,
      {
        id,
        type: "workflow",
        position,
        data: {
          label: "Workflow Link",
          linkedWorkflowId: null,
          linkedWorkflowName: null,
        },
      },
    ]);
  };

  /* ── nodesWithActions ─────────────────────────────────────────────────── */
  const nodesWithActions = useMemo(
    () => nodes.map((node) => ({ ...node, data: { ...node.data, onAdd: addChildNode } })),
    [nodes, addChildNode]
  );

  /* ── Workflow name modal ──────────────────────────────────────────────── */
  const openNameModal = () => {
    setWorkflowName("");
    setWorkflowNameError("");
    setShowNameModal(true);
    setTimeout(() => nameInputRef.current?.focus(), 150);
  };

  const confirmCreateWorkflow = () => {
    const trimmed = workflowName.trim();
    if (!trimmed) { setWorkflowNameError("Workflow name is required."); nameInputRef.current?.focus(); return; }
    if (trimmed.length > 100) { setWorkflowNameError("Name must be 100 characters or fewer."); return; }

    setShowNameModal(false);
    const id = Date.now().toString();
    setNodes([{ id, type: "state", position: { x: 300, y: 100 }, data: { label: "Start State" } }]);
    setEdges([]);
  };

  /* ── updateLabel / deleteNode ─────────────────────────────────────────── */
  const updateLabel = (value) => {
    setNodes((nds) =>
      nds.map((n) => n.id === selectedNodeId ? { ...n, data: { ...n.data, label: value } } : n)
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
      workflowJson: {
        nodes: nodes.map((node) => ({
          id: node.id,
          type: node.type,
          name: node.data.label,
          position: node.position,
          config: node.data.config || null,
          displayVariable: node.data.displayVariable || null,
          // Workflow link node specific
          linkedWorkflowId: node.data.linkedWorkflowId || null,
          decision: node.type === "decision" ? { label: node.data.label } : null,
        })),
        transitions: edges.map((edge) => ({
          id: edge.id,
          sourceNodeId: edge.source,
          targetNodeId: edge.target,
          condition: edge.data?.condition || "",
        })),
      },
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

  /* ─── Render ─────────────────────────────────────────────────────────── */
  return (
    <>
      <div style={{ display: "flex", height: "100%" }}>
        <div style={{ flex: 1, position: "relative" }}>

          {/* ── Toolbar ─────────────────────────────────────────────────── */}
          <div
            style={{
              position: "absolute", top: 16, left: 16, zIndex: 1000,
              display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
            }}
          >
            {nodes.length === 0 ? (
              <button
                onClick={openNameModal}
                style={{
                  padding: "10px 18px", borderRadius: 8,
                  background: "#4f63ff", color: "#fff", border: "none",
                  fontWeight: 600, cursor: "pointer", fontSize: 14,
                  boxShadow: "0 2px 8px rgba(79,99,255,0.4)",
                }}
              >
                + Create Workflow
              </button>
            ) : (
              <>
                {/* Workflow name badge */}
                {workflowName && (
                  <span style={{
                    background: "#f0f4ff", border: "1px solid #c7d2fe",
                    color: "#4338ca", borderRadius: 8, padding: "8px 14px",
                    fontWeight: 600, fontSize: 13,
                  }}>
                    📋 {workflowName}
                  </span>
                )}

                {/* Add Workflow Link node button */}
                <button
                  onClick={addWorkflowNode}
                  style={{
                    padding: "8px 14px", borderRadius: 8,
                    background: "linear-gradient(135deg,#0d9488,#0891b2)",
                    color: "#fff", border: "none",
                    fontWeight: 600, cursor: "pointer", fontSize: 13,
                    boxShadow: "0 2px 8px rgba(13,148,136,0.4)",
                  }}
                >
                  🔗 Add Workflow Link
                </button>

                {/* Save */}
                <button
                  className="btn btn-success"
                  style={{ padding: "8px 18px", fontWeight: 600 }}
                  onClick={saveWorkflow}
                  disabled={saving}
                >
                  {saving ? "Saving…" : "💾 Save Workflow"}
                </button>
              </>
            )}
          </div>

          <ReactFlow
            nodes={nodesWithActions}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={handleNodeClick}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>
      </div>

      {/* ── Workflow Name Modal ──────────────────────────────────────────── */}
      <Modal show={showNameModal} onHide={() => setShowNameModal(false)} centered size="sm">
        <Modal.Header closeButton style={{ borderBottom: "1px solid #e5e7eb", padding: "18px 24px" }}>
          <Modal.Title style={{ fontSize: 18, fontWeight: 700 }}>🗂️ Name Your Workflow</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: "24px" }}>
          <Form onSubmit={(e) => { e.preventDefault(); confirmCreateWorkflow(); }}>
            <Form.Group>
              <Form.Label style={{ fontWeight: 600, marginBottom: 6 }}>
                Workflow Name <span style={{ color: "#ef4444" }}>*</span>
              </Form.Label>
              <Form.Control
                ref={nameInputRef}
                type="text"
                value={workflowName}
                onChange={(e) => { setWorkflowName(e.target.value); if (workflowNameError) setWorkflowNameError(""); }}
                placeholder="e.g. Track Shipment, OTP Verification…"
                isInvalid={!!workflowNameError}
                maxLength={100}
                autoComplete="off"
              />
              <Form.Control.Feedback type="invalid">{workflowNameError}</Form.Control.Feedback>
              <Form.Text className="text-muted" style={{ fontSize: 12 }}>{workflowName.length}/100</Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer style={{ borderTop: "1px solid #e5e7eb", padding: "14px 24px", gap: 8 }}>
          <Button variant="outline-secondary" onClick={() => setShowNameModal(false)} style={{ borderRadius: 8 }}>Cancel</Button>
          <Button variant="primary" onClick={confirmCreateWorkflow} disabled={!workflowName.trim()} style={{ borderRadius: 8, minWidth: 140 }}>
            Create Workflow
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ── Node Settings Modal ──────────────────────────────────────────── */}
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
