import { Form } from "react-bootstrap";
import InputField from "./component/InputField";
import SelectComponent from "./component/SelectComponent";
import HeaderConfiguration from "./HeaderConfiguration";

const NodeDetails = ({
    selectedNode,
    nodes,
    setNodes,
    edges,
    setEdges,
}) => {
    if (!selectedNode) return null;

    const currentNode = nodes.find(
        (nd) => nd.id === selectedNode.id
    );

    const updateNode = (field, value) => {
        setNodes((nds) =>
            nds.map((nd) =>
                nd.id === selectedNode.id
                    ? {
                        ...nd,
                        data: {
                            ...nd.data,
                            [field]: value,
                        },
                    }
                    : nd
            )
        );
    };

    const updateNodeConfig = (key, value) => {
        setNodes((nds) =>
            nds.map((nd) =>
                nd.id === selectedNode.id
                    ? {
                        ...nd,
                        data: {
                            ...nd.data,
                            config: {
                                ...nd.data?.config,
                                [key]: value,
                            },
                        },
                    }
                    : nd
            )
        );
    };

    return (
        <>
            <div className="row" style={{ marginBottom: 10 }}>


                {/* <div> */}
                {/* Node Label */}
                <div className="mb-3 mt-2 col-md-4" >
                    <InputField
                        label="Node Label"
                        value={currentNode?.data?.label || ""}
                        onChange={(e) =>
                            updateNode("label", e.target.value)
                        }
                    />
                </div>


                {/* Configuration Required */}
                <div className="mb-3 mt-3 col-md-4" >
                    <Form.Check
                        type="checkbox"
                        label="Node Configuration Required"
                        checked={
                            currentNode?.data?.config
                                ?.isNodeConfigRequired || false
                        }
                        onChange={(e) =>
                            updateNodeConfig(
                                "isNodeConfigRequired",
                                e.target.checked
                            )
                        }
                    />
                </div>

                {/* Node Type */}
                {currentNode?.data?.config
                    ?.isNodeConfigRequired && (
                        <div className="mb-3 mt-2 col-md-4" >
                            <SelectComponent
                                label="Node Type"
                                dropdownOptions={[
                                    {
                                        label: "API Configuration",
                                        value: "api",
                                    },
                                    {
                                        label: "Input",
                                        value: "input",
                                    },
                                    {
                                        label: "Output",
                                        value: "output",
                                    },
                                    {
                                        label: "Buttons",
                                        value: "buttons",
                                    },
                                ]}
                                value={
                                    currentNode?.data?.config
                                        ?.nodeType || ""
                                }
                                onChange={(e) =>
                                    updateNodeConfig(
                                        "nodeType",
                                        e.target.value
                                    )
                                }
                            />
                        </div>
                    )}

                {/* API Configuration */}
                {currentNode?.data?.config?.isNodeConfigRequired && currentNode?.data?.config?.nodeType === "api" && (
                    <>
                        
                        <div className="mb-3 mt-2 col-md-4" >
                            <SelectComponent
                                label="API List"
                                dropdownOptions={[
                                    {
                                        value: "https://jsonplaceholder.typicode.com/users",
                                        label: "Get Users"
                                    },
                                    {
                                        value: "https://jsonplaceholder.typicode.com/posts",
                                        label: "Get Posts"
                                    },
                                    {
                                        value: "https://jsonplaceholder.typicode.com/comments",
                                        label: "Get Comments"
                                    },
                                    {
                                        value: "https://jsonplaceholder.typicode.com/albums",
                                        label: "Get Albums"
                                    },
                                ]}
                                value={currentNode?.data?.config?.api || ""}
                                onChange={(e) =>
                                    updateNodeConfig(
                                        "api",
                                        e.target.value
                                    )
                                }
                            />
                        </div>
                        <div className="mb-3 mt-2 col-md-4" >
                            <SelectComponent
                                label="API Type"
                                dropdownOptions={[
                                    { value: "otp", label: "API with OTP" },
                                    { value: "input", label: "API with Input Type" },
                                    { value: "condition", label: "API with Condition" },
                                    { value: "buttons", label: "API with Buttons" },
                                    { value: "response", label: "API with Response" }
                                ]}
                                value={currentNode?.data?.config?.apiType || ""}
                                onChange={(e) =>
                                    updateNodeConfig(
                                        "apiType",
                                        e.target.value
                                    )
                                }
                            />
                        </div>
                    </>

                )}



                {/* Decision Conditions */}
                {currentNode?.type === "decision" && (
                    <>
                        <h4
                            style={{
                                marginTop: 20,
                                marginBottom: 10,
                            }}
                        >
                            Decision Conditions
                        </h4>

                        {edges
                            .filter(
                                (edge) =>
                                    edge.source === currentNode.id
                            )
                            .map((edge, index) => (
                                <div className="mb-3 mt-2 col-md-4" >
                                    <div
                                        key={edge.id}
                                        style={{
                                            marginBottom: 15,
                                        }}
                                    >
                                        <Form.Label>
                                            Condition {index + 1}
                                        </Form.Label>

                                        <Form.Control
                                            type="text"
                                            placeholder="amount > 1000"
                                            value={
                                                edge.data?.condition || ""
                                            }
                                            onChange={(e) => {
                                                const value =
                                                    e.target.value;

                                                setEdges((eds) =>
                                                    eds.map((ed) =>
                                                        ed.id === edge.id
                                                            ? {
                                                                ...ed,
                                                                label: value,
                                                                data: {
                                                                    ...ed.data,
                                                                    condition: value,
                                                                },
                                                            }
                                                            : ed
                                                    )
                                                );
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                    </>
                )}

            </div>
        </>
    );
};

export default NodeDetails;