import { useCallback, useEffect, useMemo, useState } from "react";
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
import { Modal, Button } from "react-bootstrap";

import "@xyflow/react/dist/style.css";
import { DecisionNode } from "./module/DecisionNode";
import NodeDetails from "./module/NodeDetails";

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

      <div
        style={{
          fontWeight: 600,
          marginBottom: 10,
        }}
      >
        {data.label}
      </div>

      <button
        className="nodrag nopan"
        onClick={(e) => {
          e.stopPropagation();
          data.onAdd(id);
        }}
        style={{
          width: 30,
          height: 30,
          borderRadius: "50%",
          border: "none",
          cursor: "pointer",
          fontSize: 18,
        }}
      >
        +
      </button>
      <Handle
        type="source"
        position={Position.Bottom}
      />
    </div>
  );
}

const nodeTypes = {
  state: StateNode,
  decision: DecisionNode,
};
export default function App() {
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);

  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [selectedNode, setSelectedNode] = useState(null);
  // const selectedNode = useMemo(
  //   () => nodes.find((node) => node.id === selectedNodeId),
  //   [nodes, selectedNodeId]
  // );


  useEffect(() => {
    console.log("Nodes updated:", nodes);
    console.log("Edges updated:", edges);
  }, [nodes]);

  useEffect(() => {
    console.log("Selected Node", selectedNode?.data);

  }, [selectedNode]);

  const addChildNode = useCallback(
    (parentId) => {
      const parent = nodes.find((n) => n.id === parentId);

      if (!parent) return;

      const outgoingEdges = edges.filter(
        (e) => e.source === parentId
      );

      const newNodeId = Date.now().toString();

      // First child -> normal flow
      if (outgoingEdges.length === 0) {
        const childNode = {
          id: newNodeId,
          type: "state",
          position: {
            x: parent.position.x,
            y: parent.position.y + 180,
          },
          data: {
            label: "New State",
            config: {
              isNodeConfigRequired: false,
              nodeType: undefined,
              headers: [],
            },
          },
        };

        const edge = {
          id: `${parentId}-${newNodeId}`,
          source: parentId,
          target: newNodeId,
          data: {
            condition: "",
          },
        };

        setNodes((nds) => [...nds, childNode]);
        setEdges((eds) => [...eds, edge]);

        return;
      }

      // Check if already connected to decision node
      const firstTarget = outgoingEdges[0]?.target;

      const decisionNode = nodes.find(
        (n) =>
          n.id === firstTarget &&
          n.type === "decision"
      );

      // Already decision node
      if (decisionNode) {
        const childNode = {
          id: newNodeId,
          type: "state",
          position: {
            x:
              decisionNode.position.x +
              outgoingEdges.length * 250,
            y: decisionNode.position.y + 180,
          },
          data: {
            label: "New State",
            config: {
              isNodeConfigRequired: false,
              nodeType: undefined,
              headers: [],
            },
          },
        };

        const edge = {
          id: `${decisionNode.id}-${newNodeId}`,
          source: decisionNode.id,
          target: newNodeId,
          data: {
            condition: "",
          },
        };

        setNodes((nds) => [...nds, childNode]);
        setEdges((eds) => [...eds, edge]);

        return;
      }

      // Convert existing flow to decision flow
      const existingTarget = outgoingEdges[0].target;

      const decisionId = `decision-${Date.now()}`;

      const decisionNodeData = {
        id: decisionId,
        type: "decision",
        position: {
          x: parent.position.x,
          y: parent.position.y + 120,
        },
        data: {
          label: "Decision",
        },
      };

      const newChildNode = {
        id: newNodeId,
        type: "state",
        position: {
          x: parent.position.x + 250,
          y: parent.position.y + 300,
        },
        data: {
          label: "New State",
          config: {
            isNodeConfigRequired: false,
            nodeType: undefined,
            headers: [],
          },
        },
      };

      setNodes((nds) => [
        ...nds,
        decisionNodeData,
        newChildNode,
      ]);

      setEdges((eds) => {
        const filtered = eds.filter(
          (e) => e.id !== outgoingEdges[0].id
        );

        return [
          ...filtered,

          // Parent -> Decision
          {
            id: `${parentId}-${decisionId}`,
            source: parentId,
            target: decisionId,
          },

          // Decision -> Existing child
          {
            id: `${decisionId}-${existingTarget}`,
            source: decisionId,
            target: existingTarget,
            data: {
              condition: "Condition 1",
            },
            label: "Condition 1",
          },

          // Decision -> New child
          {
            id: `${decisionId}-${newNodeId}`,
            source: decisionId,
            target: newNodeId,
            data: {
              condition: "Condition 2",
            },
            label: "Condition 2",
          },
        ];
      });
    },
    [nodes, edges]
  );


  const nodesWithActions = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onAdd: addChildNode,
        },
      })),
    [nodes, addChildNode]
  );

  const createRootNode = () => {
    const id = Date.now().toString();

    setNodes([
      {
        id,
        type: "state",
        position: {
          x: 300,
          y: 100,
        },
        data: {
          label: "Start State",
          onAdd: addChildNode,
        },
      },
    ]);

    setEdges([]);
  };

  const updateLabel = (value) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === selectedNodeId
          ? {
            ...node,
            data: {
              ...node.data,
              label: value,
            },
          }
          : node
      )
    );
  };

  const deleteNode = () => {
    if (!selectedNodeId) return;

    setNodes((nds) =>
      nds.filter(
        (node) => node.id !== selectedNodeId
      )
    );

    setEdges((eds) =>
      eds.filter(
        (edge) =>
          edge.source !== selectedNodeId &&
          edge.target !== selectedNodeId
      )
    );

    setSelectedNodeId(null);
  };


  const saveWorkflow = async () => {
    console.log("Saving workflow...");
    const workflowData = {
      nodes: nodes.map((node) => ({
        id: node.id,
        type: node.type,
        name: node.data.label,
        position: node.position,
        config: node.data.config || null,
        // Decision node specific data
        decision:
          node.type === "decision"
            ? {
              label: node.data.label,
            }
            : null,
      })),

      transitions: edges.map((edge) => ({
        id: edge.id,
        sourceNodeId: edge.source,
        targetNodeId: edge.target,

        // condition attached to edge
        condition:
          edge.data?.condition || "",
      })),
    };

    try {
      console.log(
        "Workflow Payload",
        workflowData
      );


      await fetch("http://localhost:8080/api/workflows", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(workflowData),
      });


      alert("Workflow saved successfully");
    } catch (error) {
      console.error(error);
      alert("Failed to save workflow");
    }
  };


  const handleNodeClick = (e, node) => {
    if (
      e.target.tagName === "BUTTON" ||
      e.target.closest("button")
    ) {
      return;
    }

    setSelectedNodeId(node.id);
    setSelectedNode(node);
  };
  return (
    <>



      <div
        style={{
          borderLeft: "1px solid #ddd",
          display: "flex",
          height: "100vh",
        }}
      >
        <div
          style={{
            flex: 1,
            position: "relative",
          }}
        >
          {nodes.length === 0 && (
            <>
              <div>
                <button
                  onClick={createRootNode}
                  style={{
                    position: "absolute",
                    top: 20,
                    left: 20,
                    zIndex: 1000,
                    padding: "12px 20px",
                  }}
                >
                  Create Workflow
                </button>
              </div>

            </>
          )}
          {
            nodes.length > 0 && (
              <div>

                <button
                  style={{
                    position: "absolute",
                    top: 20,
                    left: 20,
                    zIndex: 1000,
                    padding: "12px 20px",

                  }}
                  className="btn btn-success"
                  onClick={saveWorkflow}
                >
                  Save Workflow
                </button>

              </div>
            )
          }


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

        {
          //     nodes.length > 0 && selectedNode && (
          //        <div
          //       style={{
          //         width: 400,
          //         padding: 20,
          //         borderLeft: "1px solid #ddd",
          //       }}
          //     >

          //       <div className="mt-2 " style={{ paddingBottom: "0px", height: "85vh",backgroundColor:"transparent",overflowY:"scroll" }}>
          //         {!selectedNode ? (
          //           <div>Select a node</div>
          //         ) : (
          //           <>
          //             {/* NodeDetails */}
          //             <h3 className="text-lg text-center font-bold mb-4 ">Node Settings</h3>
          //             <NodeDetails
          //               selectedNode={selectedNode}
          //               edges={edges}
          //               setEdges={setEdges}
          //               updateLabel={updateLabel}
          //               setSelectedNode={setSelectedNode}
          //               setNodes={setNodes}
          //               nodes={nodes}
          //             />


          //           </>
          //         )}

          // <hr/>

          //       </div>

          //       <div class="fixed bottom-10 right-180 z-1000 flex justify-center gap-10 mt-20 w-100" style={{ backgroundColor: "red" }}>
          //         <div>
          //           <button
          //             onClick={deleteNode}
          //             style={{
          //               position: "fixed",
          //               bottom: 10,
          //               right: 200,
          //               padding: "12px 20px",
          //               background: "red",
          //               color: "#fff",
          //               border: "none",
          //               borderRadius: 6,
          //             }}
          //           >
          //             Delete Node
          //           </button>
          //         </div>
          //         <div>
          //           <button
          //             onClick={() => saveWorkflow()}
          //             style={{
          //               position: "fixed",
          //               bottom: 10,
          //               right: 20,
          //               zIndex: 1000,
          //               padding: "12px 20px",
          //               background: "#28a745",
          //               color: "#fff",
          //               border: "none",
          //               borderRadius: 6,
          //             }}
          //           >
          //             Save Workflow
          //           </button>
          //         </div>
          //       </div>


          //     </div>
          //     )
        }



      </div>



      <Modal dialogClassName="workflow-modal"
        contentClassName="workflow-content"
        show={!!selectedNode}
        onHide={() => {
          setSelectedNode(null);
          setSelectedNodeId(null);
        }}
        // centered
        size="xl"
        dialogClassName="workflow-modal"
      >
        <Modal.Header closeButton className="workflow-header">
          <Modal.Title>
            ⚙️ Node Settings
          </Modal.Title>
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