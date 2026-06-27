import { Handle, Position } from "@xyflow/react";

/**
 * WorkflowNode — represents a link/jump to another saved workflow.
 * 3D design with teal/cyan gradient, depth, and perspective.
 */
export function WorkflowNode({ id, data }) {
    return (
        <div
            style={{
                background: "linear-gradient(145deg, #14b8a6, #0e7490)",
                color: "#fff",
                padding: "16px 20px",
                borderRadius: 14,
                minWidth: 200,
                textAlign: "center",
                position: "relative",
                boxShadow:
                    "0 8px 24px rgba(13,148,136,0.45), 0 2px 4px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.2)",
                border: "2px solid rgba(255,255,255,0.2)",
                transform: "perspective(800px) rotateX(2deg)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = "perspective(800px) rotateX(0deg) translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 12px 32px rgba(13,148,136,0.55), 0 4px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.25)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = "perspective(800px) rotateX(2deg)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(13,148,136,0.45), 0 2px 4px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.2)";
            }}
        >
            <Handle type="target" position={Position.Top} style={{ background: "#5eead4", width: 10, height: 10, border: "2px solid #fff" }} />

            {/* 3D top highlight */}
            <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: "40%",
                background: "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 100%)",
                borderRadius: "14px 14px 0 0", pointerEvents: "none",
            }} />

            {/* Icon + label */}
            <div style={{ fontSize: 20, marginBottom: 4 }}>🔗</div>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2, letterSpacing: 0.3, textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>
                Workflow Link
            </div>
            <div
                style={{
                    fontSize: 12,
                    opacity: 0.92,
                    marginBottom: 10,
                    maxWidth: 170,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    margin: "0 auto 10px",
                    background: "rgba(255,255,255,0.12)",
                    padding: "3px 10px",
                    borderRadius: 8,
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
                    border: "2px solid rgba(255,255,255,0.35)",
                    background: "rgba(255,255,255,0.15)",
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: 15,
                    lineHeight: 1,
                    boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                    transition: "background 0.15s",
                }}
            >
                +
            </button>

            <Handle type="source" position={Position.Bottom} style={{ background: "#5eead4", width: 10, height: 10, border: "2px solid #fff" }} />
        </div>
    );
}
