import { useEffect, useState } from "react";
import { Form } from "react-bootstrap";
import axios from "axios";

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
    const [apiList, setApiList] = useState([]);

    useEffect(() => {
        loadApis();
    }, []);

    const loadApis = async () => {
        try {
            const { data } = await axios.get(
                "http://localhost:8080/api/api-configs"
            );

            // const options = data.map((item) => ({
            //     value: item.id,
            //     label: item.name,
            // }));

            setApiList(data);
        } catch (error) {
            console.error("Error loading APIs:", error);
        }
    };

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
        console.log(nodes);
    };

    return (
        <>
            <div className="row" style={{ marginBottom: 10 }}>
                {/* Node Label */}
                <div className="mb-3 mt-2 col-md-4">
                    <InputField
                        label="Node Label"
                        value={currentNode?.data?.label || ""}
                        onChange={(e) =>
                            updateNode("label", e.target.value)
                        }
                    />
                </div>

                {/* Configuration Required */}
                <div className="mb-3 mt-3 col-md-4">
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
                {currentNode?.data?.config?.isNodeConfigRequired && (
                    <div className="mb-3 mt-2 col-md-4">
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


  {currentNode?.data?.config?.isNodeConfigRequired && currentNode?.data?.config?.nodeType == "input" && (
                            <div className="mb-3 mt-2 col-md-4">
                                <SelectComponent
                                    label="Variable Name"
                                    dropdownOptions={[
                                        {
                                            label: "Mobile Number",
                                            value: "mobile_no",
                                        },
                                        {
                                            label: "OTP",
                                            value: "OTP",
                                        },
                                        {
                                            label: "AWB Number",
                                            value: "awb_no",
                                        },
                                        {
                                            label: "Customer ID",
                                            value: "customer_id",
                                        },
                                        {
                                            label: "Order ID",
                                            value: "order_id",
                                        },
                                        {
                                            label: "Pincode",
                                            value: "pincode",
                                        },
                                    ]}
                                    value={
                                        currentNode?.data?.config?.variableName || ""
                                    }
                                    onChange={(e) =>
                                        updateNodeConfig(
                                            "variableName",
                                            e.target.value
                                        )
                                    }
                                />
                            </div>
                        )}

                {/* API Configuration */}
                {currentNode?.data?.config?.isNodeConfigRequired && currentNode?.data?.config?.nodeType === "api" && (
                    <>
                        {/* API Dropdown From Backend */}
                        <div className="mb-3 mt-2 col-md-4">
                            <Form.Group className="mb-3">
                                <Form.Label>API List</Form.Label>

                                <Form.Select
                                    value={currentNode?.data?.config?.apiConfigId || ""}
                                    onChange={(e) => {
                                        console.log("Selected API ID:", e.target.value);
                                        // const selectedApi = apiList.find((api) =>String(api.value) === e.target.value);
                                        updateNodeConfig(
                                            "apiConfigId",
                                            e.target.value+""
                                        );

                                        // updateNodeConfig(
                                        //     "apiName",
                                        //     selectedApi?.label
                                        // );
                                    }}
                                >
                                    <option value="">Select API </option>

                                    {apiList?.map((option) => (
                                        <option
                                            key={option.id}
                                            value={option.id}
                                        >
                                            {option.name}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                            {/* <SelectComponent
                                    label="API List"
                                    dropdownOptions={apiList}
                                    value={
                                        
                                    }
                                    onChange={(e) => {
                                        const selectedApi =
                                            apiList.find(
                                                (api) =>
                                                    String(
                                                        api.value
                                                    ) ===
                                                    e.target.value
                                            );

                                        updateNodeConfig(
                                            "apiConfigId",
                                            selectedApi?.value
                                        );

                                        updateNodeConfig(
                                            "apiName",
                                            selectedApi?.label
                                        );
                                    }}
                                /> */}
                        </div>

                        {/* API Type */}
                        <div className="mb-3 mt-2 col-md-4">
                            <SelectComponent
                                label="API Type"
                                dropdownOptions={[
                                    {
                                        value: "otp",
                                        label: "API with OTP",
                                    },
                                    {
                                        value: "input",
                                        label: "API with Input Type",
                                    },
                                    {
                                        value: "condition",
                                        label: "API with Condition",
                                    },
                                    {
                                        value: "buttons",
                                        label: "API with Buttons",
                                    },
                                    {
                                        value: "response",
                                        label: "API with Response",
                                    },
                                ]}
                                value={
                                    currentNode?.data?.config
                                        ?.apiType || ""
                                }
                                onChange={(e) =>
                                    updateNodeConfig(
                                        "apiType",
                                        e.target.value
                                    )
                                }
                            />


                        </div>


                      
                        {/* Headers Configuration */}
                        {/* <div className="col-md-12">
                                <HeaderConfiguration
                                    currentNode={currentNode}
                                    updateNodeConfig={
                                        updateNodeConfig
                                    }
                                />
                            </div> */}
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
                                    edge.source ===
                                    currentNode.id
                            )
                            .map((edge, index) => (
                                <div
                                    className="mb-3 mt-2 col-md-4"
                                    key={edge.id}
                                >
                                    <Form.Label>
                                        Condition {index + 1}
                                    </Form.Label>

                                    <Form.Control
                                        type="text"
                                        placeholder="amount > 1000"
                                        value={
                                            edge.data?.condition ||
                                            ""
                                        }
                                        onChange={(e) => {
                                            const value =
                                                e.target.value;

                                            setEdges((eds) =>
                                                eds.map((ed) =>
                                                    ed.id ===
                                                        edge.id
                                                        ? {
                                                            ...ed,
                                                            label:
                                                                value,
                                                            data: {
                                                                ...ed.data,
                                                                condition:
                                                                    value,
                                                            },
                                                        }
                                                        : ed
                                                )
                                            );
                                        }}
                                    />
                                </div>
                            ))}
                    </>
                )}
            </div>
        </>
    );
};

export default NodeDetails;