// Initial Telemetry Chart Data
export const INITIAL_CHART_DATA = [
  { time: '12:00', indoor: 38, outdoor: 52, co2: 590, temp: 24.0 },
  { time: '12:15', indoor: 40, outdoor: 54, co2: 605, temp: 24.2 },
  { time: '12:30', indoor: 43, outdoor: 58, co2: 625, temp: 24.5 },
  { time: '12:45', indoor: 41, outdoor: 56, co2: 615, temp: 24.4 },
  { time: '13:00', indoor: 39, outdoor: 53, co2: 610, temp: 24.2 },
  { time: '13:15', indoor: 40, outdoor: 55, co2: 620, temp: 24.0 }
];

// Initial System Notifications
export const INITIAL_NOTIFICATIONS = [
  {
    title: 'Optimal Air Quality Maintained',
    message: 'Indoor PM2.5 is healthy. Air Purifier in Eco Standby to save energy.',
    time: 'Just now',
    type: 'success'
  },
  {
    title: 'Live Ambient Data Synced',
    message: 'Connected to Open-Meteo meteorological satellite feed.',
    time: '5 mins ago',
    type: 'info'
  }
];

// Initial Activity Stream
export const INITIAL_ACTIVITIES = [
  {
    time: '01:22 PM',
    text: 'Air quality optimal → Windows open for fresh inflow, Purifier set to Eco Standby (OFF)',
    type: 'green'
  },
  {
    time: '01:10 PM',
    text: 'CO₂ level balanced at 620 ppm → Normal ventilation maintained',
    type: 'green'
  },
  {
    time: '12:48 PM',
    text: 'Weather synced with ambient meteorological station',
    type: 'blue'
  }
];

// Privacy-Preserving Aggregate Facility Zones
export const FACILITY_ZONES = [
  {
    id: 'z1',
    zone: 'Academic Block A - Room 301',
    aqi: 40,
    co2: 620,
    occ: '28 Occupants [Identity Masked]',
    flow: '450 m³/h',
    status: 'Optimal'
  },
  {
    id: 'z2',
    zone: 'Campus Library Lounge - West',
    aqi: 35,
    co2: 540,
    occ: '64 Occupants [Identity Masked]',
    flow: '620 m³/h',
    status: 'Optimal'
  },
  {
    id: 'z3',
    zone: 'STEM Robotics Center - Lab 4',
    aqi: 58,
    co2: 780,
    occ: '16 Occupants [Identity Masked]',
    flow: '380 m³/h',
    status: 'Moderate'
  },
  {
    id: 'z4',
    zone: 'Student Dining Hall Center',
    aqi: 72,
    co2: 890,
    occ: '120 Occupants [Identity Masked]',
    flow: '850 m³/h',
    status: 'Moderate'
  }
];

// Quick Switch Preset Zones for Master Broadcast
export const ADMIN_ZONE_TABS = [
  { id: 'all', label: '🏢 All Campus Zones (Broadcast)' },
  { id: 'room301', label: '🏫 Block A - Room 301' },
  { id: 'library', label: '📚 Campus Library Lounge' },
  { id: 'lab4', label: '🤖 STEM Robotics Lab 4' },
  { id: 'dining', label: '🍽️ Student Dining Hall' }
];
