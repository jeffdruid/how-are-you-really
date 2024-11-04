import React, { useState } from "react";
import { Container, Nav, Navbar } from "react-bootstrap";
import FooterModal from "./FooterModal";

function Footer() {
  const [modalType, setModalType] = useState("");
  const [showModal, setShowModal] = useState(false);

  const openModal = (type) => {
    setModalType(type);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType("");
  };

  return (
    <>
      <div
        style={{
          position: "fixed",
          bottom: 0,
          width: "100%",
          zIndex: 1040,
          marginTop: "20px",
        }}
      >
        <Navbar
          bg="dark"
          variant="dark"
          className="justify-content-center py-0 footer"
          style={{ fontSize: "0.85rem" }}
        >
          <Nav>
            <Nav.Link
              href="#"
              onClick={() => openModal("about")}
              className="text-light"
            >
              About
            </Nav.Link>
            <Nav.Link
              href="#"
              onClick={() => openModal("contact")}
              className="text-light"
            >
              Contact
            </Nav.Link>
            <Nav.Link
              href="#"
              onClick={() => openModal("privacy")}
              className="text-light"
            >
              Privacy Policy
            </Nav.Link>
            <Nav.Link
              href="#"
              onClick={() => openModal("terms")}
              className="text-light"
            >
              Terms
            </Nav.Link>
          </Nav>
        </Navbar>
        <div
          className="bg-dark text-center py-0 text-light footer"
          style={{ fontSize: "0.8rem" }}
        >
          <Container>
            <p className="mb-0 footer">
              &copy; {new Date().getFullYear()} How Are You Really
            </p>
          </Container>
        </div>
      </div>

      {showModal && <FooterModal type={modalType} onClose={closeModal} />}
    </>
  );
}

export default Footer;
