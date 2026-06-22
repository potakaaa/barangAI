export const responseTrend = [
  { time: "08:00", minutes: 3.4, target: 5 },
  { time: "12:00", minutes: 3.1, target: 5 },
  { time: "16:00", minutes: 4.2, target: 5 },
  { time: "20:00", minutes: 6.3, target: 5 },
  { time: "00:00", minutes: 4.1, target: 5 },
  { time: "04:00", minutes: 5.8, target: 5 },
]

export const stats = [
  { label: "Avg. response time", value: "4.2", unit: "mins", trend: "-12%", good: true },
  { label: "Total incidents", value: "1,467", unit: "", trend: "+4%", good: false },
  { label: "Dispatch efficiency", value: "98.4", unit: "%", trend: "+8%", good: true },
  { label: "Active patrols", value: "42", unit: "", trend: "online", good: true },
]

export const totalIncidentsSparkline: number[] = [18, 24, 16, 30, 22, 34, 28, 40, 32, 44]

export const dispatchEfficiency: { value: number } = { value: 98.4 }

export const activePatrols: { active: number; total: number; teams: string[] } = {
  active: 42,
  total: 50,
  teams: ["P1", "P2", "P3", "+39"],
}

export const categories = [
  { name: "Public Disturbance", percentage: 67 },
  { name: "Medical Emergency", percentage: 46.4 },
  { name: "Flood Safety", percentage: 38.1 },
  { name: "Traffic/Accident", percentage: 24.7 },
  { name: "Peace & Order", percentage: 10.3 },
]

export const recentIncidents = [
  { id: "INC-1048", urgency: "critical", location: "San Juan, Zone 4", title: "Flooding Cluster: Zone 4", timeAgo: "10m ago" },
  { id: "INC-1047", urgency: "critical", location: "Poblacion, Purok 1", title: "Flooding Cluster: Purok 1", timeAgo: "17m ago" },
  { id: "INC-1046", urgency: "medium", location: "Santa Cruz, Purok 3", title: "Public Disturbance: Evacuation", timeAgo: "26m ago" },
]

export const logs = [
  { message: "Dispatch Alpha assigned to Zone 4 incident.", timeAgo: "2m ago" },
  { message: "SMS gateway heartbeat stable at 99.8%.", timeAgo: "5m ago" },
  { message: "Flood reports linked into active cluster.", timeAgo: "8m ago" },
]

export type SmsStatus = "verified" | "processing" | "pending"

export const smsFeed: { timestamp: string; origin: string; content: string; status: SmsStatus }[] = [
  { timestamp: "14:22:01", origin: "+63 917 555 1201", content: "Water is entering my garage, drain is blocked by trash, Zone 4.", status: "verified" },
  { timestamp: "14:18:45", origin: "+63 920 444 8832", content: "Road impassable near the chapel, high flooding.", status: "verified" },
  { timestamp: "14:15:30", origin: "+63 908 111 2293", content: "Emergency power cut needed in Zone 4 residential area.", status: "processing" },
]

export type HeatDensity = "safe" | "moderate" | "high" | "critical"

export interface HeatZone {
  zone: string
  label: string
  density: HeatDensity
  wideOnMd?: boolean
}

export const heatZones: HeatZone[] = [
  { zone: "ZONE 01", label: "Safe Level", density: "safe" },
  { zone: "ZONE 02-03", label: "Increased Activity", density: "high", wideOnMd: true },
  { zone: "ZONE 04", label: "Safe Level", density: "safe" },
  { zone: "ZONE 05", label: "High Density", density: "critical" },
  { zone: "ZONE 06", label: "Moderate", density: "moderate" },
  { zone: "ZONE 07-08", label: "Critical Area", density: "critical", wideOnMd: true },
  { zone: "ZONE 09", label: "Moderate", density: "moderate" },
  { zone: "ZONE 10", label: "Safe Level", density: "safe" },
  { zone: "ZONE 11-12", label: "Increased Activity", density: "high" },
]

export type PersonnelStatus = "online" | "busy" | "offline"
export type PersonnelAction = "Deploy" | "Re-assign" | "Message"

export const personnel: { name: string; location: string; status: PersonnelStatus; action: PersonnelAction }[] = [
  { name: "BDRRMC Team Alpha", location: "Sitio Mansanitas", status: "online", action: "Deploy" },
  { name: "BDRRMC Team Beta", location: "Main Highway", status: "busy", action: "Re-assign" },
  { name: "Cebu Patrol 02", location: "Banilad Flyover", status: "online", action: "Message" },
]

export const mapIncidents = [
  { id: "M1", position: [10.3157, 123.8854] as [number, number], title: "Flooding Cluster: Zone 4", urgency: "critical" },
  { id: "M2", position: [10.322, 123.892] as [number, number], title: "Medical Emergency", urgency: "high" },
  { id: "M3", position: [10.309, 123.878] as [number, number], title: "Traffic obstruction", urgency: "medium" },
]
