import { useState } from "react";
import { Button, Form } from "react-bootstrap";
import InputField from "../../../components/InputField";

const HeaderConfiguration = ({ currentNode, updateNodeConfig }) => {
  const [showHeaderForm, setShowHeaderForm] = useState(false);
  const [headerForm, setHeaderForm] = useState({ key: "", value: "" });

  const saveHeader = () => {
    const headers = currentNode?.data?.config?.headers || [];
    updateNodeConfig("headers", [...headers, headerForm]);
    setHeaderForm({ key: "", value: "" });
    setShowHeaderForm(false);
  };

  const removeHeader = (index) => {
    const updated = currentNode?.data?.config?.headers?.filter((_, i) => i !== index) || [];
    updateNodeConfig("headers", updated);
  };

  return (
    <div className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>Headers</h5>
        <Button size="sm" onClick={() => setShowHeaderForm(true)}>
          Add Header
        </Button>
      </div>

      {showHeaderForm && (
        <div className="border rounded p-3 mb-3">
          <InputField
            label="Header Key"
            value={headerForm.key}
            onChange={(e) => setHeaderForm((p) => ({ ...p, key: e.target.value }))}
          />
          <InputField
            label="Header Value"
            value={headerForm.value}
            onChange={(e) => setHeaderForm((p) => ({ ...p, value: e.target.value }))}
          />
          <div className="d-flex gap-2 mt-2">
            <Button variant="success" size="sm" onClick={saveHeader}>
              Save Header
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => { setShowHeaderForm(false); setHeaderForm({ key: "", value: "" }); }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {(currentNode?.data?.config?.headers || []).map((header, index) => (
        <div key={index} className="border rounded p-2 mb-2">
          <div className="d-flex gap-4">
            <div><strong>Key:</strong> {header.key}</div>
            <div><strong>Value:</strong> {header.value}</div>
            <div>
              <Button variant="danger" size="sm" className="mt-2" onClick={() => removeHeader(index)}>
                Remove
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default HeaderConfiguration;
