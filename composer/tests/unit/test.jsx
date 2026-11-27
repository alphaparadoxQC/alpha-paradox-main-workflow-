const op = { qubits: [0, 2] };
const qIdx = 2;
const line = (
  <div style={{
    position: 'absolute',
    bottom: '50%',
    left: '50%',
    width: '1px',
    background: 'rgba(255,255,255,0.4)',
    transform: 'translateX(-50%)',
    zIndex: 5,
    height: `${(Math.max(...op.qubits) - Math.min(...op.qubits)) * 44}px`
  }}></div>
);
console.log(line);
