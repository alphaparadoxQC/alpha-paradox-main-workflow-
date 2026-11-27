import { useState, useRef, useEffect } from 'react';
import '../../styles/composer.css';

export default function CustomDropdown({ options, value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  
  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = options.find(o => o.value === value)?.label || options[0]?.label;

  return (
    <div className="custom-dropdown-container" ref={ref}>
      <button className="custom-dropdown-btn" onClick={() => setIsOpen(!isOpen)}>
        {selectedLabel}
        <span style={{ fontSize: '0.6rem', marginLeft: '2px' }}>▼</span>
      </button>
      {isOpen && (
        <div className="custom-dropdown-menu">
          {options.map(opt => (
            <div 
              key={opt.value} 
              className={`custom-dropdown-item ${value === opt.value ? 'selected' : ''}`}
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
            >
              <span className="check-icon">✓</span>
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
