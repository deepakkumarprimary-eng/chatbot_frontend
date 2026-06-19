import { Form } from "react-bootstrap";

const SelectComponent = ({
  dropdownOptions,
  value,
  onChange,
  label
}) => {
  return (
    <Form.Group className="mb-3">
      <Form.Label>{label}</Form.Label>

      <Form.Select
        value={value}
        onChange={onChange}
      >
        <option value="">Select {label}</option>

        {dropdownOptions?.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </Form.Select>
    </Form.Group>
  );
};

export default SelectComponent;