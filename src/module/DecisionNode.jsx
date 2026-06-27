import { Handle, Position } from "@xyflow/react";

export function DecisionNode({ data }) {
    return (
        <div
            style={{
                width: 140,
                height: 140,
                background: "linear-gradient(145deg, #fbbf24, #d97706)",
                transform: "rotate(45deg)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                borderRadius: 10,
                boxShadow:
                    "0 10px 28px rgba(245,158,11,0.45), 0 3px 6px rgba(0,0,0,0.12), inset 0 2px 0 rgba(255,255,255,0.25)",
                border: "1px solid rgba(255,255,255,0.2)",
                position: "relative",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 14px 36px rgba(245,158,11,0.55), 0 5px 10px rgba(0,0,0,0.15), inset 0 2px 0 rgba(255,255,255,0.3)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 10px 28px rgba(245,158,11,0.45), 0 3px 6px rgba(0,0,0,0.12), inset 0 2px 0 rgba(255,255,255,0.25)";
            }}
        >
            {/* 3D highlight overlay */}
            <div
                style={{
                    position: "absolute", top: 0, left: 0, right: 0, height: "45%",
                    background: "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 100%)",
                    borderRadius: "10px 10px 0 0", pointerEvents: "none",
                }}
            />

            {/* Input Handle */}
            <Handle
                type="target"
                position={Position.Top}
                style={{
                    left: "2%",
                    background: "#fde68a",
                    width: 10,
                    height: 10,
                    border: "2px solid #fff",
                }}
            />

            {/* Label */}
            <div
                style={{
                    transform: "rotate(-45deg)",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 13,
                    textAlign: "center",
                    textShadow: "0 1px 3px rgba(0,0,0,0.3)",
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
                    background: "#fde68a",
                    width: 10,
                    height: 10,
                    border: "2px solid #fff",
                }}
            />
        </div>
    );
}
