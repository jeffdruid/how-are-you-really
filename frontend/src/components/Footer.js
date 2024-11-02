import React, { useState } from 'react';
import { Container, Nav, Navbar } from 'react-bootstrap';
import FooterModal from './FooterModal';

function Footer() {
  const [modalType, setModalType] = useState('');
  const [showModal, setShowModal] = useState(false);

  const openModal = (type) => {
    setModalType(type);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType('');
  };

  return (
    <>
      <Navbar bg="dark" variant="dark" className="justify-content-center" fixed="bottom">
        <Nav>
          <Nav.Link href="#" onClick={() => openModal('about')} className="text-light">
            About
          </Nav.Link>
          <Nav.Link href="#" onClick={() => openModal('contact')} className="text-light">
            Contact
          </Nav.Link>
          <Nav.Link href="#" onClick={() => openModal('privacy')} className="text-light">
            Privacy Policy
          </Nav.Link>
          <Nav.Link href="#" onClick={() => openModal('terms')} className="text-light">
            Terms
          </Nav.Link>
        </Nav>
      </Navbar>
      <div className="bg-dark text-center py-2 text-light">
        <Container>
          <p className="mb-0">&copy; {new Date().getFullYear()} How Are You Really</p>
        </Container>
      </div>
      {showModal && <FooterModal type={modalType} onClose={closeModal} />}
    </>
  );
}

export default Footer;
