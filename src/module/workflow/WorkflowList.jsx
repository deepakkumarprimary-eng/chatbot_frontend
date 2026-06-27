import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Badge, Button, Modal, Spinner, Table } from "react-bootstrap";
import { WorkflowService } from "./WorkflowService.jsx";

/* ── tiny helper ── */
const fmt = (iso) =>
    iso ? new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "—";

const nodeCount = (wf) => {
    try { return wf.workflowJson?.nodes?.length ?? 0; } catch { return 0; }
};

export default function WorkflowList() {
    const navigate = useNavigate();
    const [workflows, setWorkflows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    /* preview modal */
    const [preview, setPreview] = useState(null);

    useEffect(() => { fetchWorkflows(); }, []);

    const fetchWorkflows = async () => {
        try {
            setLoading(true);
            setError(null);
            const { data } = await WorkflowService.getAll();
            setWorkflows(data);
        } catch {
            setError("Failed to load workflows. Is the backend running?");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Delete workflow "${name}"? This cannot be undone.`)) return;
        try {
            setDeletingId(id);
            await WorkflowService.delete(id);
            setWorkflows((prev) => prev.filter((w) => w.id !== id));
        } catch {
            alert("Failed to delete. Please try again.");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="container-fluid py-4" style={{ maxWidth: 1200 }}>

            {/* ── Header ───────────────────────────────────────────────── */}
            <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                    <h4 className="mb-0 fw-bold">Workflows</h4>
                    <small className="text-muted">Build and manage chatbot conversation flows</small>
                </div>
                <div className="d-flex gap-2">
                    <Button variant="outline-primary" onClick={() => navigate("/builder")}>
                        🛠️ Create with Builder
                    </Button>
                    <Button variant="primary" onClick={() => navigate("/workflows/new")}>
                        + New Workflow Without Builder 
                    </Button>
                </div>
            </div>

            {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}

            {/* ── Loading ───────────────────────────────────────────────── */}
            {loading ? (
                <div className="d-flex justify-content-center align-items-center" style={{ height: 200 }}>
                    <Spinner animation="border" variant="primary" />
                </div>

            /* ── Empty ───────────────────────────────────────────────── */
            ) : workflows.length === 0 ? (
                <div className="text-center py-5 rounded border" style={{ background: "#f8f9fa", color: "#6c757d" }}>
                    <div style={{ fontSize: 48 }}>🗂️</div>
                    <h5 className="mt-3">No workflows yet</h5>
                    <p className="mb-3">Create your first workflow to power the chatbot.</p>
                    <div className="d-flex justify-content-center gap-2">
                        <Button variant="outline-primary" onClick={() => navigate("/builder")}>
                            🛠️ Create with Builder
                        </Button>
                        <Button variant="primary" onClick={() => navigate("/workflows/new")}>
                            Create Workflow
                        </Button>
                    </div>
                </div>

            /* ── Table ───────────────────────────────────────────────── */
            ) : (
                <div className="table-responsive rounded border shadow-sm">
                    <Table hover className="mb-0 align-middle">
                        <thead className="table-light">
                            <tr>
                                <th style={{ width: 48 }}>#</th>
                                <th>Name</th>
                                <th style={{ width: 90 }}>Nodes</th>
                                <th style={{ width: 90 }}>Transitions</th>
                                <th>Created</th>
                                <th>Updated</th>
                                <th style={{ width: 180 }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {workflows.map((wf, index) => (
                                <tr key={wf.id}>
                                    <td className="text-muted">{index + 1}</td>
                                    <td>
                                        <div className="fw-semibold">{wf.name}</div>
                                        <small className="text-muted">ID: {wf.id}</small>
                                    </td>
                                    <td>
                                        <Badge bg="primary" style={{ fontSize: 12 }}>
                                            {nodeCount(wf)}
                                        </Badge>
                                    </td>
                                    <td>
                                        <Badge bg="secondary" style={{ fontSize: 12 }}>
                                            {wf.workflowJson?.transitions?.length ?? 0}
                                        </Badge>
                                    </td>
                                    <td style={{ fontSize: 13, color: "#6c757d" }}>{fmt(wf.createdAt)}</td>
                                    <td style={{ fontSize: 13, color: "#6c757d" }}>{fmt(wf.updatedAt)}</td>
                                    <td>
                                        <div className="d-flex gap-2">
                                            <Button size="sm" variant="outline-secondary"
                                                onClick={() => setPreview(wf)}>
                                                View
                                            </Button>
                                            <Button size="sm" variant="outline-info"
                                                onClick={() => navigate(`/builder/edit/${wf.id}`)}>
                                                Builder
                                            </Button>
                                            <Button size="sm" variant="outline-primary"
                                                onClick={() => navigate(`/workflows/edit/${wf.id}`)}>
                                                Edit
                                            </Button>
                                            <Button size="sm" variant="outline-danger"
                                                disabled={deletingId === wf.id}
                                                onClick={() => handleDelete(wf.id, wf.name)}>
                                                {deletingId === wf.id
                                                    ? <Spinner animation="border" size="sm" />
                                                    : "Delete"}
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>
            )}

            {/* ── Workflow JSON preview modal ───────────────────────────── */}
            <Modal show={!!preview} onHide={() => setPreview(null)} size="lg" centered>
                <Modal.Header closeButton className="workflow-header">
                    <Modal.Title style={{ fontSize: 17, fontWeight: 700 }}>
                        🗂️ {preview?.name}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ padding: 0 }}>
                    {preview && (
                        <div style={{ display: "flex", height: 500 }}>
                            {/* ── Node list ── */}
                            <div style={{ width: 260, borderRight: "1px solid #e5e7eb", overflowY: "auto", padding: "16px 14px", background: "#f8faff" }}>
                                <p style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                                    Nodes ({preview.workflowJson?.nodes?.length ?? 0})
                                </p>
                                {(preview.workflowJson?.nodes || []).map((n) => (
                                    <div key={n.id} style={{ marginBottom: 8, padding: "8px 10px", borderRadius: 8, background: "#fff", border: "1px solid #e2e8f0", fontSize: 13 }}>
                                        <div style={{ fontWeight: 600, color: "#1e293b" }}>{n.name || n.id}</div>
                                        <div style={{ color: "#64748b", fontSize: 11.5, marginTop: 2 }}>
                                            <Badge bg={n.type === "decision" ? "warning" : n.type === "workflow" ? "success" : "primary"}
                                                text={n.type === "decision" ? "dark" : undefined}
                                                style={{ fontSize: 10 }}>
                                                {n.type}
                                            </Badge>
                                            {n.config?.nodeType && (
                                                <span style={{ marginLeft: 6, color: "#94a3b8" }}>{n.config.nodeType}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* ── Raw JSON ── */}
                            <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
                                <p style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                                    Raw JSON
                                </p>
                                <pre style={{ fontSize: 12, margin: 0, color: "#1e293b", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                                    {JSON.stringify(preview.workflowJson, null, 2)}
                                </pre>
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer style={{ borderTop: "1px solid #e5e7eb", padding: "12px 20px", gap: 8 }}>
                    <Button variant="outline-info"
                        onClick={() => { setPreview(null); navigate(`/builder/edit/${preview?.id}`); }}>
                        Open in Builder
                    </Button>
                    <Button variant="outline-primary"
                        onClick={() => { setPreview(null); navigate(`/workflows/edit/${preview?.id}`); }}>
                        Edit JSON
                    </Button>
                    <Button variant="outline-secondary" onClick={() => setPreview(null)}>Close</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
