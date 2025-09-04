import React from 'react'
import { Metadata } from 'next'
import { OfflinePage } from '@/components/ServiceWorkerProvider'

export const metadata: Metadata = {
  title: 'Offline - Godot Tekko',
  description: 'You are currently offline. Some features may be limited.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function OfflinePageRoute() {
  return <OfflinePage />
}
