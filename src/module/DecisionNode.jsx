import { Handle, Position } from "@xyflow/react";

export function DecisionNode({ data }) {
    return (
        <div
            style={{
                width: 150,
                height: 150,
                background: "#f59e0b",
                transform: "rotate(45deg)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                borderRadius: 8,
            }}
        >
            {/* Input Handle */}
            <Handle
                type="target"
                position={Position.Top}
                style={{
                    left: "2%",

                    // transform: "translateX(-50%)",
                }}
            />

            {/* Label */}
            <div
                style={{
                    transform: "rotate(-45deg)",
                    color: "#fff",
                    fontWeight: "bold",
                    textAlign: "center",
                }}
            >
                {data?.label || "Decision"}
            </div>

            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Bottom}
                style={{
                    left: "99%",

                    transform: "translateX(-50%)",
                }}
            />
        </div>
    );
}