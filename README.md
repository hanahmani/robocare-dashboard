# RoboCare Notification Dashboard

Dashboard React pour le microservice de notification RoboCare (PFE).
Stack : **React 18** + **Vite** + **Tailwind CSS** + **React Router** + **Recharts** + **Lucide React**.

## Installation

```bash
npm install
npm run dev
```

L'application sera disponible sur http://localhost:5173

## Build production

```bash
npm run build
npm run preview
```

## Structure du projet

```
src/
├── components/              # Composants réutilisables
│   ├── Card.jsx
│   ├── StatCard.jsx
│   ├── Badges.jsx           # StatusBadge, ChannelTag, Avatar
│   ├── FilterBar.jsx
│   ├── NotificationVolumeChart.jsx
│   ├── ChannelBreakdownPanel.jsx
│   ├── CriticalErrorsPanel.jsx
│   ├── SuccessFailureChart.jsx
│   └── RecentNotificationsTable.jsx
├── pages/                   # Pages (routes)
│   ├── DashboardPage.jsx
│   ├── NotificationsPage.jsx
│   ├── RecipientsPage.jsx
│   ├── TemplatesPage.jsx
│   ├── ChannelsPage.jsx
│   └── SettingsPage.jsx
├── layouts/
│   └── MainLayout.jsx       # Sidebar + topbar
├── data/
│   └── mockData.js          # À remplacer par les appels API
├── App.jsx                  # Router
├── main.jsx                 # Point d'entrée
└── index.css                # Tailwind
```

## Routes disponibles

| Route | Page |
|-------|------|
| `/` | Dashboard (vue principale) |
| `/notifications` | Liste complète des notifications |
| `/recipients` | Gestion des destinataires |
| `/templates` | Gestion des templates SMS/Email/WhatsApp |
| `/channels` | Configuration des canaux |
| `/settings` | Paramètres (filtre nuit, retry, etc.) |

## Intégration avec le backend Spring Boot

Le fichier `vite.config.js` proxy déjà `/api/*` vers `http://localhost:8080`.

Pour remplacer les données mockées, créer un service API (par exemple `src/services/api.js`) :

```javascript
const API_BASE = '/api'

export async function fetchDashboardStats() {
  const res = await fetch(`${API_BASE}/notifications/stats`)
  if (!res.ok) throw new Error('Failed to fetch stats')
  return res.json()
}

export async function fetchRecentNotifications(limit = 10) {
  const res = await fetch(`${API_BASE}/notifications?limit=${limit}`)
  return res.json()
}

export async function fetchChannelBreakdown() {
  const res = await fetch(`${API_BASE}/notifications/channels/stats`)
  return res.json()
}

// etc.
```

Puis dans les pages, utiliser `useEffect` + `useState` :

```javascript
import { useEffect, useState } from 'react'
import { fetchDashboardStats } from '../services/api'

export default function DashboardPage() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    fetchDashboardStats().then(setStats)
  }, [])

  if (!stats) return <div>Loading...</div>
  // ...
}
```

## Endpoints Spring Boot suggérés (selon l'architecture du PFE)

| Endpoint | Description |
|----------|-------------|
| `GET /api/notifications/stats` | KPIs (total, success, failed, partial, success rate) |
| `GET /api/notifications` | Liste paginée des notifications |
| `GET /api/notifications/{id}` | Détail d'une notification |
| `GET /api/notifications/volume?period=24h` | Volume sur une période |
| `GET /api/notifications/channels/stats` | Breakdown par canal |
| `GET /api/notifications/errors/critical` | Erreurs critiques récentes |
| `GET /api/recipients` | Liste des destinataires |
| `GET /api/templates` | Liste des templates |
| `GET /api/channels` | État des 3 canaux (Email, SMS, WhatsApp) |

## Personnalisation

- **Couleurs** : voir `tailwind.config.js` (objet `brand`)
- **Données mockées** : `src/data/mockData.js`
- **Navigation** : `src/layouts/MainLayout.jsx` (tableau `navItems`)
