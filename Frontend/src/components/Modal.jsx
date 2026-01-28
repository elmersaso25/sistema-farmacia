import React, { useEffect, useState } from "react";
import "../styles/Modal.css";

const Modal = ({ isOpen, onClose, title, children }) => {
  const [show, setShow] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShow(true);
    }
  }, [isOpen]);

  const handleClose = () => {
    setShow(false);
    setTimeout(() => {
      onClose();
    }, 250); // mismo tiempo que la animación
  };

  if (!isOpen && !show) return null;

  return (
    <div className={`modal-overlay ${show ? "fade-in" : "fade-out"}`}>
      <div className={`modal-container ${show ? "zoom-in" : "zoom-out"}`}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="close-btn" onClick={handleClose}>
            ✖
          </button>
        </div>

        <div className="modal-body">
          {children}
          <div className="text-end mt-3">
            <button className="btn btn-secondary" onClick={handleClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
