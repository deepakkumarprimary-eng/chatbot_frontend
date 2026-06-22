import { NavLink, Outlet } from "react-router-dom";
import { Nav, Navbar } from "react-bootstrap";

const linkStyle = ({ isActive }) => ({
    color: isActive ? "#fff" : "#adb5bd",
    fontWeight: isActive ? 600 : 400,
    borderBottom: isActive ? "2px solid #6366f1" : "2px solid transparent",
    paddingBottom: 4,
    transition: "color 0.15s",
});

export default function AppLayout() {
    return (
        <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <Navbar bg="dark" variant="dark" expand="lg" className="px-3 py-2" style={{ flexShrink: 0 }}>
                <Navbar.Brand href="/" className="fw-bold me-4">🤖 Chatbot Studio</Navbar.Brand>
                <Navbar.Toggle aria-controls="main-nav" />
                <Navbar.Collapse id="main-nav">
                    <Nav className="me-auto gap-1">
                        <Nav.Link as={NavLink} to="/" end style={linkStyle}>
                            Workflow Builder
                        </Nav.Link>
                        <Nav.Link as={NavLink} to="/workflows" style={linkStyle}>
                            Workflows
                        </Nav.Link>
                        <Nav.Link as={NavLink} to="/api-configs" style={linkStyle}>
                            API Configurations
                        </Nav.Link>
                        <Nav.Link as={NavLink} to="/chatbot" style={linkStyle}>
                            Chatbot Preview
                        </Nav.Link>
                    </Nav>
                </Navbar.Collapse>
            </Navbar>

            {/* Scrollable page content area */}
            <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
                <Outlet />
            </div>
        </div>
    );
}
