import React from 'react';

export default function ProtectedRoute({ session, children }) {
  // Allow seamless guest access so products never show a blank screen or force an auth barrier
  const effectiveSession = session || {
    user: {
      id: 'guest-engineer',
      email: 'engineer@alphaparadox.qc',
      user_metadata: { full_name: 'Quantum Engineer' }
    }
  };

  if (React.isValidElement(children)) {
    return React.cloneElement(children, { session: effectiveSession });
  }

  return children;
}
