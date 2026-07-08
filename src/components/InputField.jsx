import { Form } from "react-bootstrap";

const InputField = ({ label, value, onChange, type = "text", placeholder = "" }) => {
  return (
    <Form.Group className="mb-3">
      <Form.Label>{label}</Form.Label>
      <Form.Control
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
      />
    </Form.Group>
  );
};

export default InputField;
