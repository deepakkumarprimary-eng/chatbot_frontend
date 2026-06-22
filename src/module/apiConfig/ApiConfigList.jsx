import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Button, Table, Spinner, Alert } from "react-bootstrap";
import { ApiConfigService } from "./ApiConfigService.jsx";

const ApiConfigList = () => {
    const navigate = useNavigate();
    const [configs, setConfigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        fetchConfigs();
    }, []);

    const fetchConfigs = async () => {
        try {
            setLoading(true);
            setError(null);
            const { data } = await ApiConfigService.getAll();
            setConfigs(data);
        } catch (err) {
            setError("Failed to load API configurations. Is the backend running?");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Delete API config "${name}"? This cannot be undone.`)) return;
        try {
            setDeletingId(id);
            await ApiConfigService.delete(id);
            setConfigs((prev) => prev.filter((c) => c.id !== id));
        } catch (err) {
            alert("Failed to delete. Please try again.");
        } finally {
            setDeletingId(null);
        }
    };

    const methodVariant = (method) => {
        const map = { GET: "success", POST: "primary", PUT: "warning", DELETE: "danger" };
        return map[method] || "secondary";
    };

    return (
        <div className="container-fluid py-4">
            {/* Page Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 className="mb-0 fw-bold">API Configurations</h4>
                    <small className="text-muted">Manage external API integrations used by chatbot nodes</small>
                </div>
                <Button variant="primary" onClick={() => navigate("/api-configs/new")}>
                    + New API Config
                </Button>
            </div>

            {error && (
                <Alert variant="danger" dismissible onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {loading ? (
                <div className="d-flex justify-content-center align-items-center" style={{ height: 200 }}>
                    <Spinner animation="border" variant="primary" />
                </div>
            ) : configs.length === 0 ? (
                <div
                    className="text-center py-5 rounded border"
                    style={{ background: "#f8f9fa", color: "#6c757d" }}
                >
                    <div style={{ fontSize: 48 }}>📭</div>
                    <h5 className="mt-3">No API configurations yet</h5>
                    <p className="mb-3">Create your first API config to use it in workflow nodes.</p>
                    <Button variant="primary" onClick={() => navigate("/api-configs/new")}>
                        Create API Config
                    </Button>
                </div>
            ) : (
                <div className="table-responsive rounded border">
                    <Table hover className="mb-0 align-middle">
                        <thead className="table-light">
                            <tr>
                                <th>#</th>
                                <th>Name</th>
                                <th>URL</th>
                                <th>Method</th>
                                <th>Timeout (ms)</th>
                                <th>Retries</th>
                                <th>Headers</th>
                                <th>Payload</th>
                                <th>Resp. Mappings</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {configs.map((cfg, index) => (
                                <tr key={cfg.id}>
                                    <td className="text-muted">{index + 1}</td>
                                    <td className="fw-semibold">{cfg.name}</td>
                                    <td>
                                        <span
                                            className="text-truncate d-inline-block"
                                            style={{ maxWidth: 220, fontSize: 13 }}
                                            title={cfg.url}
                                        >
                                            {cfg.url}
                                        </span>
                                    </td>
                                    <td>
                                        <Badge bg={methodVariant(cfg.method)} style={{ fontSize: 12 }}>
                                            {cfg.method}
                                        </Badge>
                                    </td>
                                    <td>{cfg.timeoutMs}</td>
                                    <td>{cfg.retryCount}</td>
                                    <td>
                                        <Badge bg="secondary">{cfg.headers?.length ?? 0}</Badge>
                                    </td>
                                    <td>
                                        {cfg.payloadTemplate ? (
                                            <Badge bg="info" text="dark">Yes</Badge>
                                        ) : (
                                            <span className="text-muted">—</span>
                                        )}
                                    </td>
                                    <td>
                                        <Badge bg="secondary">{cfg.responseMappings?.length ?? 0}</Badge>
                                    </td>
                                    <td>
                                        <div className="d-flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline-primary"
                                                onClick={() => navigate(`/api-configs/edit/${cfg.id}`)}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline-danger"
                                                disabled={deletingId === cfg.id}
                                                onClick={() => handleDelete(cfg.id, cfg.name)}
                                            >
                                                {deletingId === cfg.id ? (
                                                    <Spinner animation="border" size="sm" />
                                                ) : (
                                                    "Delete"
                                                )}
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>
            )}
        </div>
    );
};

export default ApiConfigList;
