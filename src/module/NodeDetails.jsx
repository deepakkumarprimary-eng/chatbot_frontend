import { useEffect, useState } from "react";
import { Alert, Badge, Form, Spinner } from "react-bootstrap";
import axios from "axios";
import InputField from "./component/InputField";
import SelectComponent from "./component/SelectComponent";

/* ─────────────────────────────────────────────────────────────────────────
   Operator definitions per variable type
───────────────────────────────────────────────────────────────────────────*/
const OPERATORS = {
    integer: [
        { label: "== (equals)",            value: "==" },
        { label: "!= (not equals)",        value: "!=" },
        { label: "> (greater than)",       value: ">" },
        { label: "< (less than)",          value: "<" },
        { label: ">= (greater or equal)",  value: ">=" },
        { label: "<= (less or equal)",     value: "<=" },
    ],
    float: [
        { label: "== (equals)",            value: "==" },
        { label: "!= (not equals)",        value: "!=" },
        { label: "> (greater than)",       value: ">" },
        { label: "< (less than)",          value: "<" },
        { label: ">= (greater or equal)",  value: ">=" },
        { label: "<= (less or equal)",     value: "<=" },
    ],
    string: [
        { label: "== (equals)",            value: "==" },
        { label: "!= (not equals)",        value: "!=" },
        { label: "contains",               value: "contains" },
        { label: "not contains",           value: "not_contains" },
        { label: "starts with",            value: "starts_with" },
        { label: "ends with",              value: "ends_with" },
    ],
    boolean: [
        { label: "== true",  value: "== true" },
        { label: "== false", value: "== false" },
    ],
    date: [
        { label: "== (equals)",  value: "==" },
        { label: "!= (not equals)", value: "!=" },
        { label: "after (>)",    value: ">" },
        { label: "before (<)",   value: "<" },
    ],
};

const TYPE_OPTIONS = [
    { label: "String",  value: "string" },
    { label: "Integer", value: "integer" },
    { label: "Float",   value: "float" },
    { label: "Boolean", value: "boolean" },
    { label: "Date",    value: "date" },
];

/* Build a human-readable expression string from parts */
function buildExpression(variable, operator, value, varType) {
    if (!variable || !operator) return "";
    if (varType === "boolean") return `${variable} ${operator}`;
    if (!value && value !== 0) return "";
    const quoted = varType === "string" ? `"${value}"` : value;
    return `${variable} ${operator} ${quoted}`;
}

/* ─────────────────────────────────────────────────────────────────────────
   BFS upward: find nearest ancestor that is an API node with condition type
   Returns the full node object so we can get apiConfigId too
───────────────────────────────────────────────────────────────────────────*/
function findUpstreamApiNode(nodeId, nodes, edges) {
    const visited = new Set();
    const queue = [nodeId];
    while (queue.length) {
        const current = queue.shift();
        if (visited.has(current)) continue;
        visited.add(current);
        for (const edge of edges.filter((e) => e.target === current)) {
            const parent = nodes.find((n) => n.id === edge.source);
            if (!parent) continue;
            if (parent.data?.config?.nodeType === "api" && parent.data?.config?.apiType === "condition") {
                return parent;
            }
            queue.push(parent.id);
        }
    }
    return null;
}

/* ─────────────────────────────────────────────────────────────────────────
   ConditionBranchEditor — renders one branch card for a decision node
───────────────────────────────────────────────────────────────────────────*/
function ConditionBranchEditor({ edge, index, nodes, contextVariables, loadingVars, onConditionChange, onTargetChange, loopBackOptions }) {
    const targetNode = nodes.find((n) => n.id === edge.target);
    const condData = edge.data?.conditionData || {};

    const selectedVar   = condData.variable   || "";
    const selectedType  = condData.varType     || "string";
    const selectedOp    = condData.operator    || "";
    const condValue     = condData.value       || "";

    const operators = OPERATORS[selectedType] || OPERATORS.string;
    const isBool    = selectedType === "boolean";

    const update = (patch) => {
        const next = { ...condData, ...patch };
        const expr = buildExpression(next.variable, next.operator, next.value, next.varType);
        onConditionChange(edge.id, { ...next, expression: expr });
    };

    return (
        <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 18px", background: "#fafbff", marginBottom: 16 }}>
            {/* Branch header */}
            <div style={{ fontWeight: 700, fontSize: 13, color: "#374151", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ background: "#6366f1", color: "#fff", borderRadius: "50%", width: 22, height: 22, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>
                    {index + 1}
                </span>
                Branch {index + 1}
                {condData.expression && (
                    <code style={{ marginLeft: 8, fontSize: 11.5, background: "#eef2ff", color: "#4338ca", padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>
                        {condData.expression}
                    </code>
                )}
            </div>

            {loadingVars ? (
                <div className="d-flex align-items-center gap-2 py-1">
                    <Spinner animation="border" size="sm" variant="primary" />
                    <span style={{ fontSize: 12, color: "#64748b" }}>Loading context variables…</span>
                </div>
            ) : contextVariables.length === 0 ? (
                <Alert variant="warning" style={{ fontSize: 12, padding: "8px 12px", marginBottom: 12 }}>
                    No context variables found on the upstream API node. Add response mappings to the API config first.
                </Alert>
            ) : (
                <div className="row g-2 mb-3">
                    {/* Variable picker */}
                    <div className="col-md-4">
                        <Form.Label style={{ fontSize: 11.5, fontWeight: 600, color: "#475569" }}>Context Variable</Form.Label>
                        <Form.Select size="sm" value={selectedVar}
                            onChange={(e) => update({ variable: e.target.value, operator: "", value: "" })}>
                            <option value="">— select variable —</option>
                            {contextVariables.map((v) => (
                                <option key={v} value={v}>{v}</option>
                            ))}
                        </Form.Select>
                    </div>

                    {/* Variable type */}
                    <div className="col-md-3">
                        <Form.Label style={{ fontSize: 11.5, fontWeight: 600, color: "#475569" }}>Type</Form.Label>
                        <Form.Select size="sm" value={selectedType}
                            onChange={(e) => update({ varType: e.target.value, operator: "", value: "" })}>
                            {TYPE_OPTIONS.map((t) => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </Form.Select>
                    </div>

                    {/* Operator */}
                    <div className="col-md-3">
                        <Form.Label style={{ fontSize: 11.5, fontWeight: 600, color: "#475569" }}>Operator</Form.Label>
                        <Form.Select size="sm" value={selectedOp} disabled={!selectedVar}
                            onChange={(e) => update({ operator: e.target.value })}>
                            <option value="">— select —</option>
                            {operators.map((op) => (
                                <option key={op.value} value={op.value}>{op.label}</option>
                            ))}
                        </Form.Select>
                    </div>

                    {/* Value — hidden for boolean */}
                    {!isBool && (
                        <div className="col-md-2">
                            <Form.Label style={{ fontSize: 11.5, fontWeight: 600, color: "#475569" }}>Value</Form.Label>
                            <Form.Control size="sm" type={selectedType === "integer" || selectedType === "float" ? "number" : selectedType === "date" ? "date" : "text"}
                                value={condValue} disabled={!selectedOp}
                                placeholder="value"
                                onChange={(e) => update({ value: e.target.value })} />
                        </div>
                    )}
                </div>
            )}

            {/* Expression preview */}
            {condData.expression && (
                <div style={{ background: "#f1f5f9", borderRadius: 8, padding: "8px 12px", fontSize: 12.5, color: "#334155", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "#6366f1", fontWeight: 700 }}>Expression:</span>
                    <code style={{ color: "#4338ca", fontWeight: 600 }}>{condData.expression}</code>
                </div>
            )}

            {/* Go-to node */}
            <Form.Group>
                <Form.Label style={{ fontSize: 11.5, fontWeight: 600, color: "#475569" }}>
                    Go to Node
                    <span style={{ fontWeight: 400, color: "#94a3b8", marginLeft: 6 }}>
                        (current: <em>{targetNode?.data?.label || edge.target}</em>)
                    </span>
                </Form.Label>
                <Form.Select size="sm" value={edge.target} onChange={(e) => onTargetChange(edge.id, e.target.value)}>
                    <option value={edge.target}>{targetNode?.data?.label || edge.target} — current</option>
                    {loopBackOptions.filter((o) => o.value !== edge.target).map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </Form.Select>
                <Form.Text style={{ fontSize: 11, color: "#94a3b8" }}>
                    Any node — including start/API nodes for loop-back flows.
                </Form.Text>
            </Form.Group>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────────────
   InputFieldsManager — dynamic input fields for input-type nodes
   Each field has: fieldName (label shown to user) + variableName (storage key)
───────────────────────────────────────────────────────────────────────────*/
const EMPTY_INPUT_FIELD = { fieldName: "", variableName: "", inputType: "text" };

const INPUT_TYPE_OPTIONS = [
    { label: "Text",   value: "text" },
    { label: "Number", value: "number" },
    { label: "Email",  value: "email" },
    { label: "Phone",  value: "tel" },
    { label: "Date",   value: "date" },
    { label: "Password", value: "password" },
];

function InputFieldsManager({ inputFields, onChange }) {
    const [draft, setDraft] = useState(EMPTY_INPUT_FIELD);
    const [showForm, setShowForm] = useState(false);
    const [editIndex, setEditIndex] = useState(null);
    const [draftError, setDraftError] = useState("");

    const varNameValid = (v) => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(v.trim());

    const saveDraft = () => {
        if (!draft.fieldName.trim()) { setDraftError("Field label is required."); return; }
        if (!draft.variableName.trim()) { setDraftError("Variable name is required."); return; }
        if (!varNameValid(draft.variableName)) {
            setDraftError("Variable name must start with a letter/underscore and contain only letters, numbers, underscores.");
            return;
        }
        const duplicate = inputFields.some((f, i) => f.variableName === draft.variableName.trim() && i !== editIndex);
        if (duplicate) { setDraftError(`Variable name "${draft.variableName}" is already used.`); return; }

        const updated = editIndex !== null
            ? inputFields.map((f, i) => i === editIndex ? { ...draft, variableName: draft.variableName.trim() } : f)
            : [...inputFields, { ...draft, variableName: draft.variableName.trim() }];

        onChange(updated);
        setDraft(EMPTY_INPUT_FIELD);
        setShowForm(false);
        setEditIndex(null);
        setDraftError("");
    };

    const removeField = (index) => onChange(inputFields.filter((_, i) => i !== index));

    const startEdit = (index) => {
        setDraft({ ...inputFields[index] });
        setEditIndex(index);
        setShowForm(true);
        setDraftError("");
    };

    const cancelDraft = () => {
        setDraft(EMPTY_INPUT_FIELD);
        setShowForm(false);
        setEditIndex(null);
        setDraftError("");
    };

    return (
        <div className="col-md-12 mb-3 mt-1">
            <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", background: "#fff" }}>

                {/* Header */}
                <div style={{ background: "linear-gradient(135deg,#f8faff,#f1f5ff)", borderBottom: "1px solid #e2e8f0", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                        <span style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>Input Fields</span>
                        <Badge bg="primary" style={{ marginLeft: 8, fontSize: 11 }}>{inputFields.length}</Badge>
                        <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>
                            Define what the user will be asked to enter. Each field stores the response in a named variable.
                        </div>
                    </div>
                    {!showForm && (
                        <button onClick={() => { setShowForm(true); setEditIndex(null); setDraft(EMPTY_INPUT_FIELD); }}
                            style={{ padding: "7px 14px", borderRadius: 8, border: "1.5px solid #6366f1", background: "#fff", color: "#6366f1", fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "all 0.15s" }}>
                            + Add Field
                        </button>
                    )}
                </div>

                {/* Draft / Edit form */}
                {showForm && (
                    <div style={{ padding: "16px 18px", background: "#fafbff", borderBottom: "1px solid #e2e8f0" }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "#374151", marginBottom: 12 }}>
                            {editIndex !== null ? `✏️ Edit Field ${editIndex + 1}` : "➕ New Input Field"}
                        </div>
                        <div className="row g-2">
                            <div className="col-md-4">
                                <Form.Label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>
                                    Field Label <span style={{ color: "#ef4444" }}>*</span>
                                </Form.Label>
                                <Form.Control size="sm" type="text" value={draft.fieldName}
                                    placeholder="e.g. Enter your mobile number"
                                    onChange={(e) => { setDraft((p) => ({ ...p, fieldName: e.target.value })); setDraftError(""); }} />
                                <Form.Text style={{ fontSize: 11, color: "#64748b" }}>Shown to the user as the prompt.</Form.Text>
                            </div>
                            <div className="col-md-3">
                                <Form.Label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>
                                    Store As Variable <span style={{ color: "#ef4444" }}>*</span>
                                </Form.Label>
                                <Form.Control size="sm" type="text" value={draft.variableName}
                                    placeholder="e.g. mobile_no"
                                    onChange={(e) => { setDraft((p) => ({ ...p, variableName: e.target.value })); setDraftError(""); }} />
                                <Form.Text style={{ fontSize: 11, color: "#64748b" }}>Variable name (letters, numbers, _ only).</Form.Text>
                            </div>
                            <div className="col-md-3">
                                <Form.Label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Input Type</Form.Label>
                                <Form.Select size="sm" value={draft.inputType}
                                    onChange={(e) => setDraft((p) => ({ ...p, inputType: e.target.value }))}>
                                    {INPUT_TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </Form.Select>
                            </div>
                            <div className="col-md-2 d-flex align-items-end gap-2 pb-1">
                                <button onClick={saveDraft}
                                    disabled={!draft.fieldName.trim() || !draft.variableName.trim()}
                                    style={{ padding: "6px 14px", borderRadius: 7, border: "none", background: "#6366f1", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer", opacity: (!draft.fieldName.trim() || !draft.variableName.trim()) ? 0.5 : 1 }}>
                                    Save
                                </button>
                                <button onClick={cancelDraft}
                                    style={{ padding: "6px 12px", borderRadius: 7, border: "1.5px solid #cbd5e1", background: "#fff", color: "#64748b", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                                    ✕
                                </button>
                            </div>
                        </div>
                        {draftError && <div style={{ marginTop: 8, fontSize: 12, color: "#dc3545" }}>⚠ {draftError}</div>}
                    </div>
                )}

                {/* Field list */}
                {inputFields.length === 0 && !showForm ? (
                    <div style={{ padding: "24px 18px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                        No input fields yet. Click <strong>+ Add Field</strong> to define what the user will enter.
                    </div>
                ) : (
                    <div style={{ padding: inputFields.length ? "12px 18px" : 0 }}>
                        {inputFields.map((field, index) => (
                            <div key={index} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 9, border: "1px solid #e2e8f0", background: "#fafafa", marginBottom: 8 }}>
                                {/* Order badge */}
                                <span style={{ minWidth: 24, height: 24, borderRadius: "50%", background: "#6366f1", color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    {index + 1}
                                </span>
                                {/* Field info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 600, fontSize: 13.5, color: "#1e293b", marginBottom: 2 }}>{field.fieldName}</div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                        <span style={{ fontSize: 11.5, color: "#64748b" }}>stores in:</span>
                                        <code style={{ fontSize: 12, background: "#eef2ff", color: "#4338ca", padding: "1px 7px", borderRadius: 5, fontWeight: 700 }}>
                                            {field.variableName}
                                        </code>
                                        <Badge bg="light" text="dark" style={{ fontSize: 10.5, border: "1px solid #e2e8f0" }}>
                                            {INPUT_TYPE_OPTIONS.find((t) => t.value === field.inputType)?.label || "Text"}
                                        </Badge>
                                    </div>
                                </div>
                                {/* Actions */}
                                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                                    <button onClick={() => startEdit(index)}
                                        style={{ padding: "4px 10px", borderRadius: 6, border: "1.5px solid #6366f1", background: "#fff", color: "#6366f1", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                                        Edit
                                    </button>
                                    <button onClick={() => removeField(index)}
                                        style={{ padding: "4px 10px", borderRadius: 6, border: "1.5px solid #fca5a5", background: "#fff", color: "#dc2626", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────────────
   Main NodeDetails component
───────────────────────────────────────────────────────────────────────────*/
const NodeDetails = ({ selectedNode, nodes, setNodes, edges, setEdges }) => {
    const [apiList, setApiList]           = useState([]);
    const [workflowList, setWorkflowList] = useState([]);
    const [contextVariables, setContextVariables] = useState([]);   // for API node display-var picker
    const [loadingVariables, setLoadingVariables] = useState(false);

    // Context variables fetched specifically for decision node conditions
    const [decisionVars, setDecisionVars]         = useState([]);
    const [loadingDecisionVars, setLoadingDecisionVars] = useState(false);

    useEffect(() => {
        axios.get("http://localhost:8080/api/api-configs").then(({ data }) => setApiList(data)).catch(() => {});
        axios.get("http://localhost:8080/api/workflows").then(({ data }) => setWorkflowList(data)).catch(() => {});
    }, []);

    // When the modal opens, fetch vars for both the API node (display-var) and decision node (conditions)
    useEffect(() => {
        const node = nodes.find((nd) => nd.id === selectedNode?.id);
        if (!node) return;

        if (node.type === "state") {
            const apiId = node.data?.config?.apiConfigId;
            apiId ? fetchContextVariables(apiId) : setContextVariables([]);
        }

        if (node.type === "decision") {
            const upstream = findUpstreamApiNode(node.id, nodes, edges);
            if (upstream?.data?.config?.apiConfigId) {
                fetchDecisionVars(upstream.data.config.apiConfigId);
            } else {
                setDecisionVars([]);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedNode?.id]);

    const fetchContextVariables = async (apiId) => {
        if (!apiId) { setContextVariables([]); return; }
        try {
            setLoadingVariables(true);
            const { data } = await axios.get(`http://localhost:8080/api/api-configs/${apiId}`);
            setContextVariables((data?.responseMappings || []).map((m) => m.contextVariableName));
        } catch { setContextVariables([]); }
        finally { setLoadingVariables(false); }
    };

    const fetchDecisionVars = async (apiId) => {
        if (!apiId) { setDecisionVars([]); return; }
        try {
            setLoadingDecisionVars(true);
            const { data } = await axios.get(`http://localhost:8080/api/api-configs/${apiId}`);
            setDecisionVars((data?.responseMappings || []).map((m) => m.contextVariableName));
        } catch { setDecisionVars([]); }
        finally { setLoadingDecisionVars(false); }
    };

    if (!selectedNode) return null;
    const currentNode = nodes.find((nd) => nd.id === selectedNode.id);
    if (!currentNode) return null;

    const updateNode = (field, value) =>
        setNodes((nds) => nds.map((nd) => nd.id === selectedNode.id
            ? { ...nd, data: { ...nd.data, [field]: value } } : nd));

    const updateNodeConfig = (key, value) =>
        setNodes((nds) => nds.map((nd) => nd.id === selectedNode.id
            ? { ...nd, data: { ...nd.data, config: { ...nd.data?.config, [key]: value } } } : nd));

    const handleVariableSelect = (varName) =>
        updateNode("displayVariable", currentNode?.data?.displayVariable === varName ? "" : varName);

    const handleApiTypeChange = (newApiType) => {
        updateNodeConfig("apiType", newApiType);
        if (newApiType !== "condition") return;
        const outgoing = edges.filter((e) => e.source === currentNode.id);
        const alreadyHasDecision = outgoing.some((e) => nodes.find((n) => n.id === e.target)?.type === "decision");
        if (alreadyHasDecision) return;
        const ts = Date.now();
        const decisionId = `decision-${ts}`;
        const childId    = `state-${ts + 1}`;
        setNodes((nds) => [...nds,
            { id: decisionId, type: "decision", position: { x: currentNode.position.x, y: currentNode.position.y + 200 }, data: { label: "Condition" } },
            { id: childId, type: "state", position: { x: currentNode.position.x, y: currentNode.position.y + 420 },
              data: { label: "Result State", config: { isNodeConfigRequired: false, nodeType: undefined, headers: [] } } },
        ]);
        setEdges((eds) => [
            ...eds.filter((e) => e.source !== currentNode.id),
            { id: `${currentNode.id}-${decisionId}`, source: currentNode.id, target: decisionId },
            { id: `${decisionId}-${childId}`, source: decisionId, target: childId, data: { condition: "", conditionData: {} }, label: "Condition 1" },
        ]);
    };

    /* Update structured condition data on an edge */
    const handleConditionDataChange = (edgeId, condData) => {
        setEdges((eds) => eds.map((ed) => ed.id === edgeId
            ? { ...ed, label: condData.expression || "", data: { ...ed.data, condition: condData.expression || "", conditionData: condData } }
            : ed));
    };

    const handleConditionTargetChange = (edgeId, newTargetId) => {
        setEdges((eds) => eds.map((ed) => ed.id === edgeId
            ? { ...ed, target: newTargetId, id: `${ed.source}->${newTargetId}-${Date.now()}` } : ed));
    };

    const upstreamApiNode = currentNode.type === "decision"
        ? findUpstreamApiNode(currentNode.id, nodes, edges) : null;

    const loopBackTargetOptions = nodes
        .filter((n) => n.id !== currentNode.id)
        .map((n) => ({ value: n.id, label: `${n.data?.label || n.id} (${n.type})` }));

    return (
        <div className="row" style={{ marginBottom: 10 }}>

            {/* ── Node Label ─────────────────────────────────────────── */}
            <div className="mb-3 mt-2 col-md-4">
                <InputField label="Node Label" value={currentNode?.data?.label || ""}
                    onChange={(e) => updateNode("label", e.target.value)} />
            </div>

            {/* ── WORKFLOW LINK ───────────────────────────────────────── */}
            {currentNode.type === "workflow" && (
                <div className="col-md-12 mb-3">
                    <div style={{ border: "1px solid #99f6e4", borderRadius: 10, padding: "18px 20px", background: "linear-gradient(135deg,#f0fdfa,#ecfeff)" }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "#0f766e", marginBottom: 12 }}>🔗 Linked Workflow</div>
                        <Form.Group>
                            <Form.Label style={{ fontSize: 13, fontWeight: 600 }}>Select Workflow to Link</Form.Label>
                            <Form.Select value={currentNode?.data?.linkedWorkflowId || ""}
                                onChange={(e) => {
                                    const wf = workflowList.find((w) => String(w.id) === e.target.value);
                                    updateNode("linkedWorkflowId", e.target.value);
                                    updateNode("linkedWorkflowName", wf?.name || "");
                                }}>
                                <option value="">— Select a workflow —</option>
                                {workflowList.map((wf) => <option key={wf.id} value={String(wf.id)}>{wf.name}</option>)}
                            </Form.Select>
                            {currentNode?.data?.linkedWorkflowId && (
                                <Form.Text style={{ color: "#0d9488", fontSize: 12 }}>
                                    ✓ Will jump to: <strong>{currentNode.data.linkedWorkflowName}</strong>
                                </Form.Text>
                            )}
                        </Form.Group>
                    </div>
                </div>
            )}

            {/* Config Required (state nodes) */}
            {currentNode.type === "state" && (
                <div className="mb-3 mt-3 col-md-4 d-flex align-items-center">
                    <Form.Check type="checkbox" label="Node Configuration Required"
                        checked={currentNode?.data?.config?.isNodeConfigRequired || false}
                        onChange={(e) => updateNodeConfig("isNodeConfigRequired", e.target.checked)} />
                </div>
            )}

            {/* Node Type */}
            {currentNode?.data?.config?.isNodeConfigRequired && (
                <div className="mb-3 mt-2 col-md-4">
                    <SelectComponent label="Node Type"
                        dropdownOptions={[
                            { label: "API Configuration", value: "api" },
                            { label: "Input",             value: "input" },
                            { label: "Output",            value: "output" },
                            { label: "Buttons",           value: "buttons" },
                        ]}
                        value={currentNode?.data?.config?.nodeType || ""}
                        onChange={(e) => updateNodeConfig("nodeType", e.target.value)} />
                </div>
            )}

            {/* ── INPUT node ──────────────────────────────────────────── */}
            {currentNode?.data?.config?.isNodeConfigRequired && currentNode?.data?.config?.nodeType === "input" && (
                <InputFieldsManager
                    inputFields={currentNode?.data?.config?.inputFields || []}
                    onChange={(fields) => updateNodeConfig("inputFields", fields)}
                />
            )}

            {/* ── API node ─────────────────────────────────────────────── */}
            {currentNode?.data?.config?.isNodeConfigRequired && currentNode?.data?.config?.nodeType === "api" && (
                <>
                    <div className="mb-3 mt-2 col-md-4">
                        <Form.Group>
                            <Form.Label>API List</Form.Label>
                            <Form.Select value={currentNode?.data?.config?.apiConfigId || ""}
                                onChange={(e) => {
                                    updateNodeConfig("apiConfigId", e.target.value);
                                    updateNode("displayVariable", "");
                                    fetchContextVariables(e.target.value);
                                }}>
                                <option value="">Select API</option>
                                {apiList.map((api) => <option key={api.id} value={String(api.id)}>{api.name}</option>)}
                            </Form.Select>
                        </Form.Group>
                    </div>

                    <div className="mb-3 mt-2 col-md-4">
                        <Form.Group className="mb-3">
                            <Form.Label>API Type</Form.Label>
                            <Form.Select value={currentNode?.data?.config?.apiType || ""}
                                onChange={(e) => handleApiTypeChange(e.target.value)}>
                                <option value="">Select API Type</option>
                                <option value="otp">API with OTP</option>
                                <option value="input">API with Input Type</option>
                                <option value="condition">API with Condition</option>
                                <option value="buttons">API with Buttons</option>
                                <option value="response">API with Response</option>
                            </Form.Select>
                        </Form.Group>
                        {currentNode?.data?.config?.apiType === "condition" && (
                            <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "10px 14px", fontSize: 12.5, color: "#1d4ed8", display: "flex", gap: 8 }}>
                                <span>ℹ️</span>
                                <span>A <strong>Condition node</strong> and default <strong>Result State</strong> were added below this node.</span>
                            </div>
                        )}
                    </div>

                    {/* Display Variable picker */}
                    {currentNode?.data?.config?.apiConfigId && (
                        <div className="col-md-12 mb-3 mt-1">
                            <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: "16px 20px", background: "#f8faff" }}>
                                <div className="d-flex align-items-center justify-content-between mb-2">
                                    <div>
                                        <span style={{ fontWeight: 600, fontSize: 14, color: "#1e293b" }}>Display Variable</span>
                                        <span style={{ fontSize: 12, color: "#64748b", marginLeft: 8 }}>Select one context variable to display from the API response</span>
                                    </div>
                                    {currentNode?.data?.displayVariable && (
                                        <Badge bg="primary" style={{ fontSize: 12, padding: "5px 10px", borderRadius: 20 }}>
                                            ✓ {currentNode.data.displayVariable}
                                        </Badge>
                                    )}
                                </div>
                                {loadingVariables ? (
                                    <div className="d-flex align-items-center gap-2 py-2">
                                        <Spinner animation="border" size="sm" variant="primary" />
                                        <span style={{ fontSize: 13, color: "#64748b" }}>Loading variables…</span>
                                    </div>
                                ) : contextVariables.length === 0 ? (
                                    <p style={{ fontSize: 13, color: "#94a3b8", margin: 0, fontStyle: "italic" }}>No response mappings defined for this API.</p>
                                ) : (
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 6 }}>
                                        {contextVariables.map((varName) => {
                                            const isSelected = currentNode?.data?.displayVariable === varName;
                                            return (
                                                <label key={varName} onClick={() => handleVariableSelect(varName)}
                                                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 8,
                                                        border: isSelected ? "2px solid #6366f1" : "1.5px solid #cbd5e1",
                                                        background: isSelected ? "#eef2ff" : "#fff", cursor: "pointer", userSelect: "none",
                                                        fontWeight: isSelected ? 600 : 400, fontSize: 13.5,
                                                        color: isSelected ? "#4338ca" : "#334155",
                                                        boxShadow: isSelected ? "0 0 0 3px rgba(99,102,241,0.12)" : "none" }}>
                                                    <input type="checkbox" checked={isSelected}
                                                        onChange={() => handleVariableSelect(varName)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        style={{ accentColor: "#6366f1", width: 15, height: 15 }} />
                                                    <code style={{ fontSize: 13, background: "transparent", padding: 0, color: "inherit" }}>{varName}</code>
                                                </label>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ── DECISION node ────────────────────────────────────────── */}
            {currentNode?.type === "decision" && (
                <>
                    {/* Upstream API info banner */}
                    {upstreamApiNode ? (
                        <div className="col-md-12 mb-3">
                            <Alert variant="info" style={{ borderRadius: 10, fontSize: 13, padding: "12px 16px", border: "1px solid #bfdbfe", background: "linear-gradient(135deg,#eff6ff,#f0f9ff)", color: "#1e40af" }}>
                                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                                    <span style={{ fontSize: 20 }}>🔗</span>
                                    <div>
                                        <div style={{ fontWeight: 700, marginBottom: 3 }}>Connected to API node: "{upstreamApiNode.data?.label}"</div>
                                        <div style={{ fontSize: 12.5 }}>
                                            API: <strong>{apiList.find((a) => String(a.id) === upstreamApiNode.data?.config?.apiConfigId)?.name || `ID ${upstreamApiNode.data?.config?.apiConfigId}`}</strong>
                                            {" · "}Context variables loaded from its response mappings.
                                        </div>
                                        <div style={{ marginTop: 6, fontSize: 12, color: "#3b82f6" }}>
                                            💡 Select a variable below to build a condition expression for each branch.
                                        </div>
                                    </div>
                                </div>
                            </Alert>
                        </div>
                    ) : (
                        <div className="col-md-12 mb-3">
                            <Alert variant="warning" style={{ borderRadius: 10, fontSize: 13, padding: "10px 14px", border: "1px solid #fde68a", background: "#fffbeb", color: "#92400e" }}>
                                ⚠️ No upstream API node with <strong>API Type = Condition</strong> found.
                                Connect this condition node below an API node first.
                            </Alert>
                        </div>
                    )}

                    {/* Loop-back hint */}
                    <div className="col-md-12 mb-3">
                        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "9px 14px", fontSize: 12, color: "#166534", display: "flex", gap: 8 }}>
                            <span>🔄</span>
                            <span>Each branch can target <strong>any node</strong> in the flow — use the "Go to Node" selector to create loop-back or re-route flows.</span>
                        </div>
                    </div>

                    {/* Branch cards */}
                    <div className="col-md-12">
                        <h6 style={{ fontWeight: 700, marginBottom: 14, color: "#374151", fontSize: 14 }}>
                            Branch Conditions
                            <Badge bg="secondary" style={{ marginLeft: 8, fontSize: 11 }}>
                                {edges.filter((e) => e.source === currentNode.id).length} branches
                            </Badge>
                        </h6>
                        {edges.filter((e) => e.source === currentNode.id).map((edge, index) => (
                            <ConditionBranchEditor
                                key={edge.id}
                                edge={edge}
                                index={index}
                                nodes={nodes}
                                contextVariables={decisionVars}
                                loadingVars={loadingDecisionVars}
                                onConditionChange={handleConditionDataChange}
                                onTargetChange={handleConditionTargetChange}
                                loopBackOptions={loopBackTargetOptions}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default NodeDetails;
