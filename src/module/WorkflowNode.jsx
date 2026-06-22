import { Handle, Position } from "@xyflow/react";

/**
 * WorkflowNode — represents a link/jump to another saved workflow.
 * Visually distinct: teal/green gradient with a chain-link icon.
 */
export function WorkflowNode({ id, data }) {
    return (
        <div
            style={{
                background: "linear-gradient(135deg, #0d9488, #0891b2)",
                color: "#fff",
                padding: "14px 18px",
                borderRadius: 12,
                minWidth: 190,
                textAlign: "center",
                position: "relative",
                boxShadow: "0 4px 14px rgba(13,148,136,0.4)",
                border: "2px solid rgba(255,255,255,0.25)",
            }}
        >
            <Handle type="target" position={Position.Top} />

            {/* Icon + label */}
            <div style={{ fontSize: 18, marginBottom: 4 }}>🔗</div>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2, letterSpacing: 0.2 }}>
                Workflow Link
            </div>
            <div
                style={{
                    fontSize: 12,
                    opacity: 0.9,
                    marginBottom: 10,
                    maxWidth: 160,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    margin: "0 auto 10px",
                }}
                title={data.linkedWorkflowName || "Not configured"}
            >
                {data.linkedWorkflowName || (
                    <span style={{ opacity: 0.6, fontStyle: "italic" }}>Select workflow…</span>
                )}
            </div>

            {/* Add-child button */}
            <button
                className="nodrag nopan"
                onClick={(e) => {
                    e.stopPropagation();
                    data.onAdd(id);
                }}
                style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    border: "none",
                    background: "rgba(255,255,255,0.25)",
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: 16,
                    lineHeight: 1,
                }}
            >
                +
            </button>

            <Handle type="source" position={Position.Bottom} />
        </div>
    );
}
