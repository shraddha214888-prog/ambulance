export type VehicleRole = 'motorist' | 'emergency';

export type MotoristVehicleType = 'sedan' | 'suv' | 'truck' | 'motorcycle' | 'user_car';

export type EmergencyType = 'ambulance' | 'fire_engine' | 'police_escort';

export type AlertLevel = 'safe' | 'caution' | 'critical_yield';

export type LanePosition = 'left' | 'center' | 'right';

export interface Coordinates {
  x: number;
  y: number;
}

export interface EmergencyVehicle {
  id: string;
  unitCode: string;
  name: string;
  vehicleType: EmergencyType;
  driverName: string;
  callSign: string;
  origin: string;
  destination: string;
  patientCondition: string;
  urgency: 'code_3_critical' | 'code_2_urgent' | 'code_1_routine';
  speedKmh: number;
  position: Coordinates;
  headingDeg: number;
  targetProgress: number; // 0 to 100%
  alertRadiusMeters: number; // e.g. 750
  sirenActive: boolean;
  sirenMode: 'yelp' | 'wail' | 'hi_lo' | 'silent_v2x';
  corridorClearancePercent: number;
  motoristsNotifiedCount: number;
  timeToDestinationMin: number;
}

export interface MotoristVehicle {
  id: string;
  licensePlate: string;
  model: string;
  type: MotoristVehicleType;
  position: Coordinates;
  speedKmh: number;
  currentLane: LanePosition;
  targetLane: LanePosition;
  headingDeg: number;
  isUserVehicle?: boolean;
  status: 'normal' | 'alerted' | 'clearing' | 'cleared';
  distanceToAmbulanceMeters: number;
  bearingFromUserToAmbulance: number; // degrees
  relativePosition: 'behind' | 'ahead' | 'adjacent' | 'out_of_range';
  alertLevel: AlertLevel;
  timeToInterceptSec: number;
  hasYielded: boolean;
}

export interface TrafficSignal {
  id: string;
  name: string;
  position: Coordinates;
  roadAxis: 'avenue' | 'cross_street';
  state: 'green' | 'yellow' | 'red' | 'preempted_green';
  preemptionActive: boolean;
  countdownSec: number;
}

export interface CorridorAlertLog {
  id: string;
  timestamp: string;
  type: 'broadcast' | 'yield_confirmed' | 'signal_preemption' | 'hazard_cleared';
  message: string;
  unit: string;
}
