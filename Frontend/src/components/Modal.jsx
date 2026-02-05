import React, { useEffect, useState } from "react";
import "../styles/Modal.css";

const Modal = ({ isOpen, onClose, title, children, size, titleSize }) => {
  const [show, setShow] = useState(isOpen);

  useEffect(() => {
  if (isOpen) {
    setShow(true);
  } else {
    setShow(false);
  }
}, [isOpen]);


  const handleClose = () => {
    setShow(false);
    setTimeout(() => {
      onClose();
    }, 250); // mismo tiempo que la animación
  };

  if (!isOpen && !show) return null;
  const isSmallModal = size === "sm";


  return (
    <div className={`modal-overlay ${show ? "fade-in" : "fade-out"}`}>
      <div className={`modal-container ${size} ${show ? "zoom-in" : "zoom-out"}`}>
        <div className="modal-header">
          <p style={{ fontSize: titleSize }}>{title}</p>
          
            <button className="close-btn btn-sm" onClick={handleClose}>
              ✖
            </button>
        </div>

        <div className="modal-body">
          {children}
         
        </div>
      </div>
    </div>
  );
};

export default Modal;
