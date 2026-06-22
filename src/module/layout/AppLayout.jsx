import { NavLink, Outlet } from "react-router-dom";
import { Nav, Navbar } from "react-bootstrap";

const AppLayout = () => {
    return (
        <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Top Nav — Bootstrap default is ~56px */}
            <Navbar bg="dark" variant="dark" expand="lg" className="px-3 py-2" style={{ flexShrink: 0 }}>
                <Navbar.Brand href="/" className="fw-bold me-4">
                    🤖 Chatbot Studio
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="main-nav" />
                <Navbar.Collapse id="main-nav">
                    <Nav className="me-auto gap-1">
                        <Nav.Link
                            as={NavLink}
                            to="/"
                            end
                            style={({ isActive }) => ({
                                color: isActive ? "#fff" : "#adb5bd",
                                fontWeight: isActive ? 600 : 400,
                            })}
                        >
                            Workflow Builder
                        </Nav.Link>
                        <Nav.Link
                            as={NavLink}
                            to="/api-configs"
                            style={({ isActive }) => ({
                                color: isActive ? "#fff" : "#adb5bd",
                                fontWeight: isActive ? 600 : 400,
                            })}
                        >
                            API Configurations
                        </Nav.Link>
                        <Nav.Link
                            as={NavLink}
                            to="/chatbot"
                            style={({ isActive }) => ({
                                color: isActive ? "#fff" : "#adb5bd",
                                fontWeight: isActive ? 600 : 400,
                            })}
                        >
                            Chatbot Preview
                        </Nav.Link>
                    </Nav>
                </Navbar.Collapse>
            </Navbar>

            {/* Page content — scrolls independently per page */}
            <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
                <Outlet />
            </div>
        </div>
    );
};

export default AppLayout;
