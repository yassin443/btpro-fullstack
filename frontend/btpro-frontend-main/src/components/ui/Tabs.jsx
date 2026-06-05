import { useState } from 'react'

// tabs: [{ key, label }]
// controlled: pass activeTab + onTabChange for external control
export function Tabs({ tabs = [], defaultTab, activeTab: controlledTab, onTabChange, className = '' }) {
  const [internal, setInternal] = useState(defaultTab ?? tabs[0]?.key)
  const active = controlledTab ?? internal
  const handleChange = (k) => {
    setInternal(k)
    onTabChange?.(k)
  }
  return (
    <div className={`tabs ${className}`}>
      {tabs.map(({ key, label }) => (
        <button
          key={key}
          className={active === key ? 'active' : ''}
          onClick={() => handleChange(key)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

// Convenience: useTabs hook
export function useTabs(tabs, defaultKey) {
  const [active, setActive] = useState(defaultKey ?? tabs[0]?.key)
  return { active, setActive }
}
