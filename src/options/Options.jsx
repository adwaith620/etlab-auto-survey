import React, { useEffect, useState } from 'react'
import { RATING_MODES, RATING_LABELS, DEFAULT_RATING_MODE } from '../core/constants.js'
import { getSelectedRatingMode, setSelectedRatingMode } from '../common/storage.js'

export default function Options() {
  const [defaultMode, setDefaultMode] = useState(DEFAULT_RATING_MODE)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getSelectedRatingMode().then((mode) => {
      if (mode) setDefaultMode(mode)
    })
  }, [])

  const handleChange = async (e) => {
    const newMode = e.target.value
    setDefaultMode(newMode)
    await setSelectedRatingMode(newMode)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ padding: '24px', fontFamily: 'sans-serif', maxWidth: '500px', margin: '0 auto' }}>
      <h2>ETLAB Auto Survey — Preferences</h2>
      <p>Configure your default rating mode for one-click survey submissions:</p>

      <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>
        Default Rating Mode:
      </label>
      <select
        value={defaultMode}
        onChange={handleChange}
        style={{ padding: '8px 12px', fontSize: '15px', borderRadius: '4px', width: '100%' }}
      >
        {Object.entries(RATING_LABELS).map(([mode, label]) => (
          <option key={mode} value={mode}>
            {label}
          </option>
        ))}
      </select>

      {saved && (
        <p style={{ color: '#16a34a', fontWeight: 'bold', marginTop: '12px' }}>
          ✓ Preferences saved successfully.
        </p>
      )}
    </div>
  )
}
