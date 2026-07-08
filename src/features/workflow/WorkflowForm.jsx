import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Badge, Button, Card, Col, Form, Row, Spinner } from "react-bootstrap";
import { WorkflowService } from "./WorkflowService.js";

const EMPTY_FORM = { name: "", workflowJson: "" };

export default function WorkflowForm() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const isEdit     = Boolean(id);

  const [form,      setForm]      = useState(EMPTY_FORM);
  const [loading,   setLoading]   = useState(isEdit);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState(null);
  const [jsonError, setJsonError] = useState(null);
  const [nodeCount, setNodeCount] = useState(null);
  const nameRef = useRef(null);

  useEffect(() => {
    if (!isEdit) { setTimeout(() => nameRef.current?.focus(), 100); return; }
    (async () => {
      try {
        const { data } = await WorkflowService.getById(id);
        const json = data.workflowJson ? JSON.stringify(data.workflowJson, null, 2) : "";
        setForm({ name: data.name ?? "", workflowJson: json });
        parseAndCountNodes(json);
      } catch {
        setError("Failed to load workflow.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit]);

  const parseAndCountNodes = (raw) => {
    if (!raw.trim()) { setNodeCount(null); setJsonError(null); return; }
    try {
      const parsed = JSON.parse(raw);
      setNodeCount(parsed?.nodes?.length ?? null);
      setJsonError(null);
    } catch {
      setNodeCount(null);
      setJsonError("Invalid JSON — fix before saving.");
    }
  };

  const handleJsonChange = (val) => {
    setForm((p) => ({ ...p, workflowJson: val }));
    parseAndCountNodes(val);
  };

  const formatJson = () => {
    try {
      const pretty = JSON.stringify(JSON.parse(form.workflowJson), null, 2);
      setForm((p) => ({ ...p, workflowJson: pretty }));
      setJsonError(null);
    } catch { /* already flagged */ }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Workflow name is required."); nameRef.current?.focus(); return; }
    if (jsonError) return;
    let parsedJson = null;
    if (form.workflowJson.trim()) {
      try { parsedJson = JSON.parse(form.workflowJson); }
      catch { setJsonError("Invalid JSON — fix before saving."); return; }
    }
    const payload = { name: form.name.trim(), workflowJson: parsedJson };
    try {
      setSaving(true); setError(null);
      if (isEdit) { await WorkflowService.update(id, payload); }
      else        { await WorkflowService.create(payload); }
      navigate("/workflows");
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.error || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: 300 }}>
      <Spinner animation="border" variant="primary" />
    </div>
  );

  return (
    <div className="container py-4" style={{ maxWidth: 860 }}>
      <Button variant="link" className="ps-0 text-secondary text-decoration-none mb-2"
        onClick={() => navigate("/workflows")}>
        ← Workflows
      </Button>

      <h4 className="fw-bold mb-1">{isEdit ? "Edit Workflow" : "New Workflow"}</h4>
      <p className="text-muted mb-4" style={{ fontSize: 14 }}>
        {isEdit
          ? "Update this workflow's name or its JSON definition."
          : "Create a new workflow. You can also build it visually from the Workflow Builder."}
      </p>

      {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Card className="mb-4 shadow-sm">
          <Card.Header className="fw-semibold bg-white border-bottom">Workflow Details</Card.Header>
          <Card.Body>
            <Row>
              <Col md={8}>
                <Form.Group className="mb-0">
                  <Form.Label className="fw-semibold">
                    Name <span style={{ color: "#ef4444" }}>*</span>
                  </Form.Label>
                  <Form.Control ref={nameRef} type="text" value={form.name}
                    placeholder="e.g. Track Shipment, OTP Verification…"
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    maxLength={255} autoComplete="off" />
                </Form.Group>
              </Col>
              <Col md={4} className="d-flex align-items-end">
                {isEdit && <div style={{ fontSize: 13, color: "#64748b" }}>Workflow ID: <strong>{id}</strong></div>}
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Card className="mb-4 shadow-sm">
          <Card.Header className="d-flex align-items-center justify-content-between bg-white border-bottom">
            <div className="fw-semibold">
              Workflow JSON
              <span className="text-muted fw-normal ms-2" style={{ fontSize: 13 }}>
                (auto-populated by the Workflow Builder)
              </span>
            </div>
            <div className="d-flex align-items-center gap-2">
              {nodeCount !== null && <Badge bg="primary" style={{ fontSize: 12 }}>{nodeCount} nodes</Badge>}
              <Button size="sm" variant="outline-secondary"
                disabled={!!jsonError || !form.workflowJson.trim()} onClick={formatJson}>
                Format JSON
              </Button>
            </div>
          </Card.Header>
          <Card.Body>
            <Form.Group>
              <Form.Label style={{ fontSize: 13, color: "#64748b" }}>
                Paste or edit the workflow JSON directly. Normally this is managed by the visual builder.
              </Form.Label>
              <Form.Control as="textarea" rows={14} value={form.workflowJson}
                placeholder={'{\n  "nodes": [],\n  "transitions": []\n}'}
                onChange={(e) => handleJsonChange(e.target.value)}
                style={{ fontFamily: "monospace", fontSize: 12.5, borderColor: jsonError ? "#dc3545" : undefined, background: "#fafafa" }} />
              {jsonError
                ? <Form.Text className="text-danger">{jsonError}</Form.Text>
                : <Form.Text className="text-muted">Must be valid JSON or leave empty.</Form.Text>}
            </Form.Group>
          </Card.Body>
        </Card>

        <div className="d-flex justify-content-end gap-2">
          <Button variant="outline-secondary" onClick={() => navigate("/workflows")} disabled={saving}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={saving || !!jsonError}>
            {saving ? <><Spinner animation="border" size="sm" className="me-2" />Saving…</> : isEdit ? "Save Changes" : "Create Workflow"}
          </Button>
        </div>
      </Form>
    </div>
  );
}
