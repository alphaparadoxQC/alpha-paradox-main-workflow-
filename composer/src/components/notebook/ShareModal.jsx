import React, { useState } from 'react';

/**
 * ShareModal — Google-style sharing dialog for notebooks.
 */
export default function ShareModal({ isOpen, onClose, notebookName, userEmail }) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [accessLevel, setAccessLevel] = useState('restricted');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="nb-modal-overlay" onClick={onClose}>
      <div className="nb-modal nb-share-modal" onClick={(e) => e.stopPropagation()}>
        <div className="nb-share-modal__header">
          <h2>Share "{notebookName || 'Untitled'}"</h2>
          <div className="nb-share-modal__header-icons">
            <button className="nb-share-modal__icon-btn" title="Help">❓</button>
            <button className="nb-share-modal__icon-btn" title="Settings">⚙️</button>
          </div>
        </div>

        {/* Invite field */}
        <input
          className="nb-share-modal__invite-input"
          placeholder="Add people, groups, spaces, and calendar events"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
        />

        {/* People with access */}
        <div className="nb-share-modal__section">
          <h3>People with access</h3>
          <div className="nb-share-modal__person">
            <div className="nb-share-modal__person-avatar">S</div>
            <div className="nb-share-modal__person-info">
              <span className="nb-share-modal__person-name">
                {userEmail ? userEmail.split('@')[0] : 'You'} (you)
              </span>
              <span className="nb-share-modal__person-email">
                {userEmail || 'user@example.com'}
              </span>
            </div>
            <span className="nb-share-modal__person-role">Owner</span>
          </div>
        </div>

        {/* General access */}
        <div className="nb-share-modal__section">
          <h3>General access</h3>
          <div className="nb-share-modal__access-row">
            <span className="nb-share-modal__access-icon">🔒</span>
            <div>
              <select
                className="nb-share-modal__access-select"
                value={accessLevel}
                onChange={(e) => setAccessLevel(e.target.value)}
              >
                <option value="restricted">Restricted</option>
                <option value="anyone">Anyone with the link</option>
              </select>
              <p className="nb-share-modal__access-desc">
                {accessLevel === 'restricted'
                  ? 'Only people with access can open with the link'
                  : 'Anyone on the internet with the link can view'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="nb-share-modal__footer">
          <button className="nb-share-modal__copy-btn" onClick={handleCopyLink}>
            🔗 {copied ? 'Copied!' : 'Copy link'}
          </button>
          <button className="nb-modal__btn nb-modal__btn--primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
