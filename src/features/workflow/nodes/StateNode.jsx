import { Handle, Position } from "@xyflow/react";

export function StateNode({ id, data }) {
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
        e.currentTarget.style.transform =
          "perspective(800px) rotateX(0deg) translateY(-2px)";
        e.currentTarget.style.boxShadow =
          "0 12px 32px rgba(79,99,255,0.5), 0 4px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.25)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "perspective(800px) rotateX(2deg)";
        e.currentTarget.style.boxShadow =
          "0 8px 24px rgba(79,99,255,0.4), 0 2px 4px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.2)";
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: "#a5b4fc", width: 10, height: 10, border: "2px solid #fff" }}
      />
      {/* 3D top highlight */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "40%",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 100%)",
          borderRadius: "14px 14px 0 0",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          fontWeight: 700,
          fontSize: 14,
          marginBottom: 10,
          textShadow: "0 1px 2px rgba(0,0,0,0.2)",
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
          width: 28,
          height: 28,
          borderRadius: "50%",
          border: "2px solid rgba(255,255,255,0.4)",
          cursor: "pointer",
          fontSize: 16,
          lineHeight: 1,
          background: "rgba(255,255,255,0.15)",
          color: "#fff",
          boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
          transition: "background 0.15s",
        }}
      >
        +
      </button>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: "#a5b4fc", width: 10, height: 10, border: "2px solid #fff" }}
      />
    </div>
  );
}
