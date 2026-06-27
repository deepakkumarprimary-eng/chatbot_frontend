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
  addEdge,
  MarkerType,
} from "@xyflow/react";
import { Modal, Button, Form, Spinner } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";

import "@xyflow/react/dist/style.css";
import { DecisionNode } from "./module/DecisionNode";
import { WorkflowNode } from "./module/WorkflowNode";
import NodeDetails from "./module/NodeDetails";
import { WorkflowService } from "./module/workflow/WorkflowService";

/* ─── Default edge options for flowchart-style routing ─────────────────── */
const defaultEdgeOptions = {
  type: "smoothstep",
  animated: true,
  style: { stroke: "#6366f1", strokeWidth: 2.5 },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: "#6366f1",
    width: 18,
    height: 18,
  },
  pathOptions: { offset: 20, borderRadius: 12 },
};

/* ─── StateNode (3D design) ─────────────────────────────────────────────── */
function StateNode({ id, data }) {
  return (
    <div
      style={{
        background: "linear-gradient(145deg, #6371ff, #4350e6)",
        color: "#fff",
        padding: "18px 22px",
        borderRadius: 14,
        minWidth: 190,
        textAlign: "center",
        position: "relative",
        boxShadow:
          "0 8px 24px rgba(79,99,255,0.4), 0 2px 4px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.2)",
        border: "1px solid rgba(255,255,255,0.15)",
        transform: "perspective(800px) rotateX(2deg)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "perspective(800px) rotateX(0deg) translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 12px 32px rgba(79,99,255,0.5), 0 4px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.25)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "perspective(800px) rotateX(2deg)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(79,99,255,0.4), 0 2px 4px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.2)";
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: "#a5b4fc", width: 10, height: 10, border: "2px solid #fff" }} />
      {/* 3D top highlight */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "40%",
        background: "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 100%)",
        borderRadius: "14px 14px 0 0", pointerEvents: "none",
      }} />
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>
        {data.label}
      </div>
      <button
        className="nodrag nopan"
        onClick={(e) => { e.stopPropagation(); data.onAdd(id); }}
        style={{
          width: 28, height: 28, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)",
          cursor: "pointer", fontSize: 16, lineHeight: 1,
          background: "rgba(255,255,255,0.15)", color: "#fff",
          boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
          transition: "background 0.15s",
        }}
      >
        +
      </button>
      <Handle type="source" position={Position.Bottom} style={{ background: "#a5b4fc", width: 10, height: 10, border: "2px solid #fff" }} />
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
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

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
  const [loadingWorkflow, setLoadingWorkflow] = useState(isEdit);
  const [workflowId, setWorkflowId] = useState(id || null);

  /* ── Load existing workflow for edit ──────────────────────────────────── */
  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        setLoadingWorkflow(true);
        const { data } = await WorkflowService.getById(id);
        setWorkflowName(data.name || "");
        setWorkflowId(data.id);

        const wfJson = data.workflowJson;
        if (wfJson) {
          // Fetch workflow list to resolve linked workflow names
          let workflowLookup = {};
          try {
            const wfListRes = await WorkflowService.getAll();
            workflowLookup = Object.fromEntries(
              (wfListRes.data || []).map((w) => [String(w.id), w.name])
            );
          } catch { /* ignore — names will just be empty */ }

          // Restore nodes
          const restoredNodes = (wfJson.nodes || []).map((n) => {
            // Determine the correct ReactFlow node type
            let nodeType = n.type || "state";
            if (nodeType === "state" && n.config?.nodeType === "workflow") {
              nodeType = "workflow";
            }

            // Resolve linked workflow ID from config or top-level
            const rawLinkedId = n.linkedWorkflowId || n.config?.workflowId || null;
            const linkedWorkflowId = rawLinkedId ? String(rawLinkedId) : null;
            const linkedWorkflowName = n.linkedWorkflowName
              || (linkedWorkflowId ? workflowLookup[linkedWorkflowId] : null)
              || null;

            return {
              id: n.id,
              type: nodeType,
              position: n.position || { x: 0, y: 0 },
              data: {
                label: n.name || n.id,
                config: n.config || { isNodeConfigRequired: false, nodeType: undefined, headers: [] },
                displayVariable: n.displayVariable || null,
                linkedWorkflowId: linkedWorkflowId,
                linkedWorkflowName: linkedWorkflowName,
              },
            };
          });

          // Restore edges
          const restoredEdges = (wfJson.transitions || []).map((t) => ({
            id: t.id,
            source: t.sourceNodeId,
            target: t.targetNodeId,
            type: "smoothstep",
            animated: true,
            style: { stroke: "#6366f1", strokeWidth: 2.5 },
            markerEnd: { type: MarkerType.ArrowClosed, color: "#6366f1", width: 18, height: 18 },
            data: { condition: t.condition || "" },
            label: t.condition || undefined,
          }));

          setNodes(restoredNodes);
          setEdges(restoredEdges);
        }
      } catch (error) {
        alert("Failed to load workflow: " + (error?.response?.data?.message || error.message));
        navigate("/workflows");
      } finally {
        setLoadingWorkflow(false);
      }
    })();
  }, [id, isEdit]);

  /* ── onConnect — allows manual drag-connections for loop-back edges ───── */
  const onConnect = useCallback(
    (params) =>
      setEdges((eds) =>
        addEdge({
          ...params,
          type: "smoothstep",
          animated: true,
          style: { stroke: "#6366f1", strokeWidth: 2.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color: "#6366f1", width: 18, height: 18 },
          data: { condition: "" },
        }, eds)
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

      const edgeStyle = {
        type: "smoothstep",
        animated: true,
        style: { stroke: "#6366f1", strokeWidth: 2.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#6366f1", width: 18, height: 18 },
      };

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
        setEdges((eds) => [...eds, { id: `${parentId}-${newNodeId}`, source: parentId, target: newNodeId, data: { condition: "" }, ...edgeStyle }]);
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
        setEdges((eds) => [...eds, { id: `${existingDecision.id}-${newNodeId}`, source: existingDecision.id, target: newNodeId, data: { condition: "" }, ...edgeStyle }]);
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
          { id: `${parentId}-${decisionId}`, source: parentId, target: decisionId, ...edgeStyle },
          { id: `${decisionId}-${existingTarget}`, source: decisionId, target: existingTarget, data: { condition: "Condition 1" }, label: "Condition 1", ...edgeStyle },
          { id: `${decisionId}-${newNodeId}`, source: decisionId, target: newNodeId, data: { condition: "Condition 2" }, label: "Condition 2", ...edgeStyle },
        ];
      });
    },
    [nodes, edges]
  );

  /* ── Add a Workflow Link node ─────────────────────────────────────────── */
  const addWorkflowNode = () => {
    const nodeId = `workflow-${Date.now()}`;
    // Place near the centre of the current view
    const lastNode = nodes[nodes.length - 1];
    const position = lastNode
      ? { x: lastNode.position.x + 300, y: lastNode.position.y }
      : { x: 300, y: 300 };

    setNodes((nds) => [
      ...nds,
      {
        id: nodeId,
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
    const startNodeId = Date.now().toString();
    setNodes([{ id: startNodeId, type: "state", position: { x: 300, y: 100 }, data: { label: "Start State" } }]);
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
        nodes: nodes.map((node) => {
          const config = node.data.config ? { ...node.data.config } : null;

          // For workflow link nodes, ensure workflowId is stored in config
          if (node.type === "workflow" && node.data.linkedWorkflowId) {
            if (config) {
              config.nodeType = "workflow";
              config.workflowId = node.data.linkedWorkflowId;
            }
          }

          return {
            id: node.id,
            type: node.type,
            name: node.data.label,
            position: node.position,
            config: config,
            displayVariable: node.data.displayVariable || null,
            linkedWorkflowId: node.data.linkedWorkflowId || null,
            linkedWorkflowName: node.data.linkedWorkflowName || null,
            decision: node.type === "decision" ? { label: node.data.label } : null,
          };
        }),
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
      let res;
      if (workflowId) {
        // Update existing workflow
        res = await WorkflowService.update(workflowId, workflowData);
      } else {
        // Create new workflow
        res = await WorkflowService.create(workflowData);
        // Store the ID for subsequent saves
        if (res.data?.id) {
          setWorkflowId(res.data.id);
          // Update URL to reflect edit mode without full reload
          navigate(`/builder/edit/${res.data.id}`, { replace: true });
        }
      }
      alert(`Workflow ${workflowId ? "updated" : "saved"} successfully`);
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || "Save failed";
      alert(`Failed to save workflow: ${msg}`);
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
  if (loadingWorkflow) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
        <Spinner animation="border" variant="primary" />
        <span style={{ marginLeft: 12, fontSize: 15, color: "#6c757d" }}>Loading workflow…</span>
      </div>
    );
  }

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
            {nodes.length === 0 && !isEdit ? (
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
                    {isEdit && <span style={{ marginLeft: 6, fontSize: 11, color: "#6366f1" }}>(editing)</span>}
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

                {/* Save / Update */}
                <button
                  className="btn btn-success"
                  style={{ padding: "8px 18px", fontWeight: 600 }}
                  onClick={saveWorkflow}
                  disabled={saving}
                >
                  {saving ? "Saving…" : workflowId ? "💾 Update Workflow" : "💾 Save Workflow"}
                </button>
              </>
            )}
          </div>

          <ReactFlow
            nodes={nodesWithActions}
            edges={edges}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            connectionLineType="smoothstep"
            connectionLineStyle={{ stroke: "#6366f1", strokeWidth: 2 }}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={handleNodeClick}
            fitView
          >
            <Background variant="dots" gap={20} size={1.5} color="#d1d5db" />
            <Controls />
            <MiniMap
              nodeColor={(n) => {
                if (n.type === "decision") return "#f59e0b";
                if (n.type === "workflow") return "#0d9488";
                return "#6366f1";
              }}
              maskColor="rgba(0,0,0,0.08)"
              style={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
            />
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
