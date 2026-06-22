import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Alert,
    Badge,
    Button,
    Card,
    Col,
    Form,
    Row,
    Spinner,
} from "react-bootstrap";
import { ApiConfigService } from "./ApiConfigService.jsx";
import InputField from "../component/InputField";

// ─── Default form state ───────────────────────────────────────────────────────
const EMPTY_FORM = {
    name: "",
    url: "",
    method: "GET",
    timeoutMs: 5000,
    retryCount: 1,
    username: "",
    password: "",
    clientId: "",
    headers: [],
    payloadTemplate: "",
    responseMappings: [],
};

const EMPTY_HEADER = { headerName: "", headerValue: "" };
const EMPTY_MAPPING = { responsePath: "", contextVariableName: "" };

// ─── Component ────────────────────────────────────────────────────────────────
const ApiConfigForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);

    const [form, setForm] = useState(EMPTY_FORM);
    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [payloadError, setPayloadError] = useState(null);

    // Header / mapping inline-add state
    const [headerDraft, setHeaderDraft] = useState(EMPTY_HEADER);
    const [showHeaderForm, setShowHeaderForm] = useState(false);
    const [mappingDraft, setMappingDraft] = useState(EMPTY_MAPPING);
    const [showMappingForm, setShowMappingForm] = useState(false);

    // ── Load existing config on edit ──────────────────────────────────────────
    useEffect(() => {
        if (!isEdit) return;
        (async () => {
            try {
                const { data } = await ApiConfigService.getById(id);
                setForm({
                    name: data.name ?? "",
                    url: data.url ?? "",
                    method: data.method ?? "GET",
                    timeoutMs: data.timeoutMs ?? 5000,
                    retryCount: data.retryCount ?? 1,
                    username: data.username ?? "",
                    password: data.password ?? "",
                    clientId: data.clientId ?? "",
                    headers: data.headers ?? [],
                    payloadTemplate: data.payloadTemplate
                        ? JSON.stringify(data.payloadTemplate, null, 2)
                        : "",
                    responseMappings: data.responseMappings ?? [],
                });
            } catch {
                setError("Failed to load API configuration.");
            } finally {
                setLoading(false);
            }
        })();
    }, [id, isEdit]);

    // ── Generic field updater ─────────────────────────────────────────────────
    const setField = (key, value) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    // ── Payload JSON validation ───────────────────────────────────────────────
    const handlePayloadChange = (value) => {
        setField("payloadTemplate", value);
        if (!value.trim()) {
            setPayloadError(null);
            return;
        }
        try {
            JSON.parse(value);
            setPayloadError(null);
        } catch {
            setPayloadError("Invalid JSON — please fix before saving.");
        }
    };

    // ── Headers ───────────────────────────────────────────────────────────────
    const addHeader = () => {
        if (!headerDraft.headerName.trim() || !headerDraft.headerValue.trim()) return;
        setField("headers", [...form.headers, { ...headerDraft }]);
        setHeaderDraft(EMPTY_HEADER);
        setShowHeaderForm(false);
    };

    const removeHeader = (index) =>
        setField("headers", form.headers.filter((_, i) => i !== index));

    const updateHeader = (index, key, value) => {
        const updated = form.headers.map((h, i) =>
            i === index ? { ...h, [key]: value } : h
        );
        setField("headers", updated);
    };

    // ── Response Mappings ─────────────────────────────────────────────────────
    const addMapping = () => {
        if (!mappingDraft.responsePath.trim() || !mappingDraft.contextVariableName.trim()) return;
        setField("responseMappings", [...form.responseMappings, { ...mappingDraft }]);
        setMappingDraft(EMPTY_MAPPING);
        setShowMappingForm(false);
    };

    const removeMapping = (index) =>
        setField("responseMappings", form.responseMappings.filter((_, i) => i !== index));

    const updateMapping = (index, key, value) => {
        const updated = form.responseMappings.map((m, i) =>
            i === index ? { ...m, [key]: value } : m
        );
        setField("responseMappings", updated);
    };

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (payloadError) return;

        let parsedPayload = null;
        if (form.payloadTemplate.trim()) {
            try {
                parsedPayload = JSON.parse(form.payloadTemplate);
            } catch {
                setPayloadError("Invalid JSON — please fix before saving.");
                return;
            }
        }

        const payload = {
            name: form.name.trim(),
            url: form.url.trim(),
            method: form.method,
            timeoutMs: Number(form.timeoutMs),
            retryCount: Number(form.retryCount),
            username: form.username.trim() || null,
            password: form.password.trim() || null,
            clientId: form.clientId.trim() || null,
            headers: form.headers,
            payloadTemplate: parsedPayload,
            responseMappings: form.responseMappings,
        };

        try {
            setSaving(true);
            setError(null);
            if (isEdit) {
                await ApiConfigService.update(id, payload);
            } else {
                await ApiConfigService.create(payload);
            }
            navigate("/api-configs");
        } catch (err) {
            const msg =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                "Save failed. Please check your inputs and try again.";
            setError(msg);
        } finally {
            setSaving(false);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: 300 }}>
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    return (
        <div className="container py-4" style={{ maxWidth: 900 }}>
            {/* Breadcrumb / back */}
            <div className="mb-3">
                <Button
                    variant="link"
                    className="ps-0 text-secondary text-decoration-none"
                    onClick={() => navigate("/api-configs")}
                >
                    ← API Configurations
                </Button>
            </div>

            <h4 className="fw-bold mb-1">
                {isEdit ? "Edit API Configuration" : "New API Configuration"}
            </h4>
            <p className="text-muted mb-4" style={{ fontSize: 14 }}>
                {isEdit
                    ? "Update the details of this API integration."
                    : "Define a new external API that can be used in chatbot workflow nodes."}
            </p>

            {error && (
                <Alert variant="danger" dismissible onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Form onSubmit={handleSubmit}>

                {/* ── Section 1: Basic Info ──────────────────────────────────── */}
                <Card className="mb-4 shadow-sm">
                    <Card.Header className="fw-semibold bg-white border-bottom">
                        Basic Information
                    </Card.Header>
                    <Card.Body>
                        <Row>
                            <Col md={6}>
                                <InputField
                                    label="Name *"
                                    value={form.name}
                                    placeholder="e.g. Track Shipment API"
                                    onChange={(e) => setField("name", e.target.value)}
                                />
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Method *</Form.Label>
                                    <Form.Select
                                        value={form.method}
                                        onChange={(e) => setField("method", e.target.value)}
                                    >
                                        {["GET", "POST", "PUT", "DELETE"].map((m) => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <InputField
                                    label="URL *"
                                    value={form.url}
                                    placeholder="https://api.example.com/v1/track"
                                    onChange={(e) => setField("url", e.target.value)}
                                />
                            </Col>
                            <Col md={6}>
                                <InputField
                                    label="Timeout (ms)"
                                    type="number"
                                    value={form.timeoutMs}
                                    placeholder="5000"
                                    onChange={(e) => setField("timeoutMs", e.target.value)}
                                />
                            </Col>
                            <Col md={6}>
                                <InputField
                                    label="Retry Count"
                                    type="number"
                                    value={form.retryCount}
                                    placeholder="1"
                                    onChange={(e) => setField("retryCount", e.target.value)}
                                />
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* ── Section 2: Authentication ──────────────────────────────── */}
                <Card className="mb-4 shadow-sm">
                    <Card.Header className="fw-semibold bg-white border-bottom">
                        Authentication <span className="text-muted fw-normal">(optional)</span>
                    </Card.Header>
                    <Card.Body>
                        <Row>
                            <Col md={4}>
                                <InputField
                                    label="Username"
                                    value={form.username}
                                    placeholder="Basic auth username"
                                    onChange={(e) => setField("username", e.target.value)}
                                />
                            </Col>
                            <Col md={4}>
                                <InputField
                                    label="Password"
                                    type="password"
                                    value={form.password}
                                    placeholder="Basic auth password"
                                    onChange={(e) => setField("password", e.target.value)}
                                />
                            </Col>
                            <Col md={4}>
                                <InputField
                                    label="Client ID"
                                    value={form.clientId}
                                    placeholder="OAuth client ID"
                                    onChange={(e) => setField("clientId", e.target.value)}
                                />
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* ── Section 3: Headers ────────────────────────────────────── */}
                <Card className="mb-4 shadow-sm">
                    <Card.Header className="d-flex justify-content-between align-items-center bg-white border-bottom">
                        <span className="fw-semibold">
                            Request Headers{" "}
                            <Badge bg="secondary" className="ms-1">{form.headers.length}</Badge>
                        </span>
                        <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => setShowHeaderForm(true)}
                        >
                            + Add Header
                        </Button>
                    </Card.Header>
                    <Card.Body>
                        {/* Inline add form */}
                        {showHeaderForm && (
                            <div className="border rounded p-3 mb-3 bg-light">
                                <Row>
                                    <Col md={5}>
                                        <InputField
                                            label="Header Name"
                                            value={headerDraft.headerName}
                                            placeholder="e.g. Authorization"
                                            onChange={(e) =>
                                                setHeaderDraft((p) => ({ ...p, headerName: e.target.value }))
                                            }
                                        />
                                    </Col>
                                    <Col md={5}>
                                        <InputField
                                            label="Header Value"
                                            value={headerDraft.headerValue}
                                            placeholder="e.g. Bearer {{token}}"
                                            onChange={(e) =>
                                                setHeaderDraft((p) => ({ ...p, headerValue: e.target.value }))
                                            }
                                        />
                                    </Col>
                                    <Col md={2} className="d-flex align-items-end gap-2 pb-3">
                                        <Button
                                            size="sm"
                                            variant="success"
                                            disabled={!headerDraft.headerName.trim() || !headerDraft.headerValue.trim()}
                                            onClick={addHeader}
                                        >
                                            Save
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => {
                                                setShowHeaderForm(false);
                                                setHeaderDraft(EMPTY_HEADER);
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </Col>
                                </Row>
                            </div>
                        )}

                        {/* Header list */}
                        {form.headers.length === 0 && !showHeaderForm ? (
                            <p className="text-muted mb-0" style={{ fontSize: 14 }}>
                                No headers added. Click "Add Header" to add request headers.
                            </p>
                        ) : (
                            form.headers.map((header, index) => (
                                <div
                                    key={index}
                                    className="border rounded p-2 mb-2 bg-white"
                                >
                                    <Row className="align-items-center">
                                        <Col md={5}>
                                            <Form.Control
                                                size="sm"
                                                value={header.headerName}
                                                placeholder="Header Name"
                                                onChange={(e) =>
                                                    updateHeader(index, "headerName", e.target.value)
                                                }
                                            />
                                        </Col>
                                        <Col md={5}>
                                            <Form.Control
                                                size="sm"
                                                value={header.headerValue}
                                                placeholder="Header Value"
                                                onChange={(e) =>
                                                    updateHeader(index, "headerValue", e.target.value)
                                                }
                                            />
                                        </Col>
                                        <Col md={2}>
                                            <Button
                                                size="sm"
                                                variant="outline-danger"
                                                onClick={() => removeHeader(index)}
                                            >
                                                Remove
                                            </Button>
                                        </Col>
                                    </Row>
                                </div>
                            ))
                        )}
                    </Card.Body>
                </Card>

                {/* ── Section 4: Payload Template ───────────────────────────── */}
                <Card className="mb-4 shadow-sm">
                    <Card.Header className="fw-semibold bg-white border-bottom">
                        Payload Template{" "}
                        <span className="text-muted fw-normal">(optional — JSON only)</span>
                    </Card.Header>
                    <Card.Body>
                        <Form.Group>
                            <Form.Label style={{ fontSize: 13, color: "#6c757d" }}>
                                Use <code>{"{{variable_name}}"}</code> syntax for dynamic values from context.
                            </Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={8}
                                value={form.payloadTemplate}
                                placeholder={'{\n  "mobileNumber": "{{mobile_no}}",\n  "awb": "{{awb_no}}"\n}'}
                                onChange={(e) => handlePayloadChange(e.target.value)}
                                style={{
                                    fontFamily: "monospace",
                                    fontSize: 13,
                                    borderColor: payloadError ? "#dc3545" : undefined,
                                }}
                            />
                            {payloadError && (
                                <Form.Text className="text-danger">{payloadError}</Form.Text>
                            )}
                        </Form.Group>
                    </Card.Body>
                </Card>

                {/* ── Section 5: Response Mappings ──────────────────────────── */}
                <Card className="mb-4 shadow-sm">
                    <Card.Header className="d-flex justify-content-between align-items-center bg-white border-bottom">
                        <span className="fw-semibold">
                            Response Mappings{" "}
                            <Badge bg="secondary" className="ms-1">{form.responseMappings.length}</Badge>
                        </span>
                        <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => setShowMappingForm(true)}
                        >
                            + Add Mapping
                        </Button>
                    </Card.Header>
                    <Card.Body>
                        <p className="text-muted mb-3" style={{ fontSize: 13 }}>
                            Map JSON paths from the API response to context variables that downstream nodes can use.
                        </p>

                        {/* Inline add form */}
                        {showMappingForm && (
                            <div className="border rounded p-3 mb-3 bg-light">
                                <Row>
                                    <Col md={5}>
                                        <InputField
                                            label="Response Path"
                                            value={mappingDraft.responsePath}
                                            placeholder="e.g. data.trackingStatus"
                                            onChange={(e) =>
                                                setMappingDraft((p) => ({ ...p, responsePath: e.target.value }))
                                            }
                                        />
                                    </Col>
                                    <Col md={5}>
                                        <InputField
                                            label="Context Variable Name"
                                            value={mappingDraft.contextVariableName}
                                            placeholder="e.g. tracking_status"
                                            onChange={(e) =>
                                                setMappingDraft((p) => ({
                                                    ...p,
                                                    contextVariableName: e.target.value,
                                                }))
                                            }
                                        />
                                    </Col>
                                    <Col md={2} className="d-flex align-items-end gap-2 pb-3">
                                        <Button
                                            size="sm"
                                            variant="success"
                                            disabled={
                                                !mappingDraft.responsePath.trim() ||
                                                !mappingDraft.contextVariableName.trim()
                                            }
                                            onClick={addMapping}
                                        >
                                            Save
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => {
                                                setShowMappingForm(false);
                                                setMappingDraft(EMPTY_MAPPING);
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </Col>
                                </Row>
                            </div>
                        )}

                        {/* Mapping list */}
                        {form.responseMappings.length === 0 && !showMappingForm ? (
                            <p className="text-muted mb-0" style={{ fontSize: 14 }}>
                                No mappings added. Click "Add Mapping" to extract values from the API response.
                            </p>
                        ) : (
                            <>
                                {/* Column labels */}
                                {form.responseMappings.length > 0 && (
                                    <Row className="mb-1 px-1">
                                        <Col md={5}>
                                            <small className="text-muted fw-semibold">Response Path</small>
                                        </Col>
                                        <Col md={5}>
                                            <small className="text-muted fw-semibold">Context Variable</small>
                                        </Col>
                                    </Row>
                                )}
                                {form.responseMappings.map((mapping, index) => (
                                    <div
                                        key={index}
                                        className="border rounded p-2 mb-2 bg-white"
                                    >
                                        <Row className="align-items-center">
                                            <Col md={5}>
                                                <Form.Control
                                                    size="sm"
                                                    value={mapping.responsePath}
                                                    placeholder="data.field"
                                                    onChange={(e) =>
                                                        updateMapping(index, "responsePath", e.target.value)
                                                    }
                                                />
                                            </Col>
                                            <Col md={5}>
                                                <Form.Control
                                                    size="sm"
                                                    value={mapping.contextVariableName}
                                                    placeholder="variable_name"
                                                    onChange={(e) =>
                                                        updateMapping(
                                                            index,
                                                            "contextVariableName",
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            </Col>
                                            <Col md={2}>
                                                <Button
                                                    size="sm"
                                                    variant="outline-danger"
                                                    onClick={() => removeMapping(index)}
                                                >
                                                    Remove
                                                </Button>
                                            </Col>
                                        </Row>
                                    </div>
                                ))}
                            </>
                        )}
                    </Card.Body>
                </Card>

                {/* ── Footer Actions ─────────────────────────────────────────── */}
                <div className="d-flex justify-content-end gap-2">
                    <Button
                        variant="outline-secondary"
                        onClick={() => navigate("/api-configs")}
                        disabled={saving}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={saving || !!payloadError}
                    >
                        {saving ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Saving…
                            </>
                        ) : isEdit ? (
                            "Save Changes"
                        ) : (
                            "Create API Config"
                        )}
                    </Button>
                </div>
            </Form>
        </div>
    );
};

export default ApiConfigForm;
