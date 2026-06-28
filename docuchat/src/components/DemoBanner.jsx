import React from 'react'
import { useLang } from '../i18n.jsx'

export default function DemoBanner() {
  const { t } = useLang()
  return (
    <div className="demo-banner">
      {t.demoBanner}
    </div>
  )
}
