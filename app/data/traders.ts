import { Trader } from "@/app/types/trader"

const STRENGTHS = [
  "High risk/reward setups",
  "Strong trend detection",
  "Capital protection focus"
]

const WEAKNESSES = [
  "Underperforms in ranging markets",
  "Low trade frequency",
  "Deep drawdowns possible"
]

export const TRADERS: Trader[] = [
  {
    id: 1,
    name: "Axion",
    level: "STANDARD",
    winRate: 63,
    avgRoi: 18,
    maxDrawdown: 42,
    strengths: STRENGTHS,
    weaknesses: WEAKNESSES,
    isOnline: true
  },
  {
    id: 2,
    name: "Nexar",
    level: "STANDARD",
    winRate: 58,
    avgRoi: 22,
    maxDrawdown: 51,
    strengths: STRENGTHS,
    weaknesses: WEAKNESSES,
    isOnline: false
  },
  {
    id: 3,
    name: "Kronos",
    level: "PRO",
    winRate: 71,
    avgRoi: 35,
    maxDrawdown: 38,
    strengths: STRENGTHS,
    weaknesses: WEAKNESSES,
    isOnline: false
  },
  {
    id: 4,
    name: "Orion",
    level: "STANDARD",
    winRate: 61,
    avgRoi: 20,
    maxDrawdown: 47,
    strengths: STRENGTHS,
    weaknesses: WEAKNESSES,
    isOnline: true
  },
  {
    id: 5,
    name: "Vektor",
    level: "STANDARD",
    winRate: 56,
    avgRoi: 15,
    maxDrawdown: 55,
    strengths: STRENGTHS,
    weaknesses: WEAKNESSES,
    isOnline: false
  },
  {
    id: 6,
    name: "Helix",
    level: "PRO",
    winRate: 74,
    avgRoi: 41,
    maxDrawdown: 33,
    strengths: STRENGTHS,
    weaknesses: WEAKNESSES,
    isOnline: false
  },
  {
    id: 7,
    name: "Nova",
    level: "STANDARD",
    winRate: 59,
    avgRoi: 19,
    maxDrawdown: 49,
    strengths: STRENGTHS,
    weaknesses: WEAKNESSES,
    isOnline: true
  },
  {
    id: 8,
    name: "Apex",
    level: "PRO",
    winRate: 76,
    avgRoi: 46,
    maxDrawdown: 31,
    strengths: STRENGTHS,
    weaknesses: WEAKNESSES,
    isOnline: false
  },
  {
    id: 9,
    name: "Pulse",
    level: "STANDARD",
    winRate: 57,
    avgRoi: 17,
    maxDrawdown: 52,
    strengths: STRENGTHS,
    weaknesses: WEAKNESSES,
    isOnline: false
  },
  {
    id: 10,
    name: "Torion-X",
    level: "TORION",
    winRate: 81,
    avgRoi: 62,
    maxDrawdown: 24,
    strengths: STRENGTHS,
    weaknesses: WEAKNESSES,
    isOnline: false
  }
]

