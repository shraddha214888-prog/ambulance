export type Language = 'en' | 'gu';

export interface Translations {
  appName: string;
  tagline: string;
  subTagline: string;
  tabs: {
    simulator: string;
    split: string;
    motorist: string;
    ambulance: string;
    command: string;
  };
  actions: {
    corridorRules: string;
    unmute: string;
    mute: string;
    runCorridor: string;
    pause: string;
    reset: string;
    followCorridor: string;
    followAmbulance: string;
    followUser: string;
    iHaveYielded: string;
    yieldConfirmed: string;
    reportHazard: string;
    auditionChime: string;
    voiceOn: string;
    voiceOff: string;
    understood: string;
    transmit: string;
    instantHorn: string;
    forceGreen: string;
  };
  metrics: {
    preAlertRange: string;
    avgSavedTime: string;
    greenWave: string;
    active: string;
    distance: string;
    meters: string;
    closingDelta: string;
    speed: string;
    interceptTime: string;
    pathClear: string;
    vehiclesInCone: string;
    yieldedToShoulder: string;
    pendingClearance: string;
    avgClearanceLatency: string;
    goldenHourSaved: string;
    motoristYieldCompliance: string;
    greenWavePreemption: string;
  };
  alerts: {
    nominalTitle: string;
    nominalDesc: string;
    cautionTitle: string;
    cautionDesc: string;
    criticalTitle: string;
    criticalDesc: string;
    yieldedTitle: string;
    yieldedDesc: string;
    voiceCritical: string;
    voiceNormal: string;
  };
  lanes: {
    lane1: string;
    lane2: string;
    lane3: string;
    emergencyCorridor: string;
    safeShoulder: string;
    vacateRequired: string;
    targetLane: string;
  };
  protocols: {
    step1: string;
    step2: string;
    step3: string;
  };
  hospital: string;
  unit: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    appName: "AuraPulse Corridor",
    tagline: "Instant Pre-Alert of Approaching Ambulances for Motorists",
    subTagline: "Notifying nearby drivers 750 meters ahead to safely yield lanes before sirens can even be heard, creating an open emergency rescue alley and preventing sudden panic maneuvers.",
    tabs: {
      simulator: "Live Simulator",
      split: "Dual In-Cabin / Paramedic",
      motorist: "Driver HUD View",
      ambulance: "Ambulance Cockpit",
      command: "City Traffic Command",
    },
    actions: {
      corridorRules: "Corridor Rules",
      unmute: "Unmute Audio",
      mute: "Mute Audio",
      runCorridor: "Run Corridor",
      pause: "Pause",
      reset: "Reset",
      followCorridor: "Full Corridor",
      followAmbulance: "Follow Paramedic",
      followUser: "Follow Your Car",
      iHaveYielded: "I HAVE YIELDED (MOVE TO RIGHT)",
      yieldConfirmed: "Yield Confirmed · Recorded by Dispatch",
      reportHazard: "Report Road Hazard / Stalled Car Ahead",
      auditionChime: "Audition Chime",
      voiceOn: "Voice: ON",
      voiceOff: "Voice: OFF",
      understood: "Understood",
      transmit: "Transmit",
      instantHorn: "Instant Acoustic Horn Pulse",
      forceGreen: "Force Green",
    },
    metrics: {
      preAlertRange: "Pre-Alert Range",
      avgSavedTime: "Avg Saved Time",
      greenWave: "Green Wave",
      active: "Active",
      distance: "Distance",
      meters: "meters",
      closingDelta: "Closing Delta",
      speed: "Speed",
      interceptTime: "Intercept",
      pathClear: "Path Clear",
      vehiclesInCone: "VEHICLES IN CONE",
      yieldedToShoulder: "YIELDED TO SHOULDER",
      pendingClearance: "PENDING CLEARANCE",
      avgClearanceLatency: "Avg Clearance Latency",
      goldenHourSaved: "Golden Hour Transit Saved",
      motoristYieldCompliance: "Motorist Yield Compliance",
      greenWavePreemption: "Green Wave Preemption",
    },
    alerts: {
      nominalTitle: "Corridor Clear · Drive Normally",
      nominalDesc: "No active priority vehicles in your direct trajectory. Maintain safe following distance.",
      cautionTitle: "Emergency Vehicle Broadcast in Range · Prepare Right Maneuver",
      cautionDesc: "An emergency vehicle is responding to a critical call behind you. Monitor mirrors and anticipate clearing center lane.",
      criticalTitle: "AMBULANCE APPROACHING FROM BEHIND — MOVE TO RIGHT LANE",
      criticalDesc: "Emergency Unit is closing fast behind you. Signal right and merge safely onto the shoulder lane.",
      yieldedTitle: "Thank You. Corridor Secured for Paramedics.",
      yieldedDesc: "Your vehicle is positioned safely in the shoulder lane. Please hold steady until the emergency convoy passes.",
      voiceCritical: "Pre-alert: Ambulance approaching from rear. Please move to the right lane safely.",
      voiceNormal: "Emergency vehicle has passed. Corridor is now clear.",
    },
    lanes: {
      lane1: "LANE 1 (FAST / PASS)",
      lane2: "LANE 2 (EMERGENCY CORRIDOR)",
      lane3: "LANE 3 (CLEARANCE SHOULDER)",
      emergencyCorridor: "EMERGENCY LANE",
      safeShoulder: "SAFE YIELD SHOULDER",
      vacateRequired: "VACATE REQUIRED",
      targetLane: "TARGET LANE",
    },
    protocols: {
      step1: "Check rear-view and side mirrors for overtaking motorcycles or secondary responders.",
      step2: "Activate your right turn indicator early to communicate intention to trailing drivers.",
      step3: "Smoothly decelerate and merge into Lane 3 / Shoulder without abrupt braking.",
    },
    hospital: "TRAUMA CENTER",
    unit: "PARAMEDIC-104",
  },
  gu: {
    appName: "ઓરાપલ્સ ઇમરજન્સી કોરિડોર",
    tagline: "વાહનચાલકો માટે એમ્બ્યુલન્સનું રિયલ-ટાઇમ પ્રી-એલર્ટ (અગાઉથી ચેતવણી)",
    subTagline: "સાયરન સંભળાય તે પહેલાં જ 750 મીટર આગળ રહેલા વાહનચાલકોને ડિજિટલ ચેતવણી આપી સલામત રીતે જમણી બાજુ ખસી જવા સૂચના, જેથી દર્દી માટે ગોલ્ડન અવરમાં જીવનરક્ષક માર્ગ ખુલ્લો થઈ શકે.",
    tabs: {
      simulator: "લાઈવ સિમ્યુલેટર",
      split: "ડ્યુઅલ ડ્રાઈવર / એમ્બ્યુલન્સ",
      motorist: "ડ્રાઈવર HUD વ્યુ",
      ambulance: "એમ્બ્યુલન્સ કોકપિટ",
      command: "ટ્રાફિક કંટ્રોલ રૂમ",
    },
    actions: {
      corridorRules: "ઇમરજન્સી નિયમો",
      unmute: "અવાજ ચાલુ કરો",
      mute: "અવાજ બંધ કરો",
      runCorridor: "સિમ્યુલેશન શરૂ કરો",
      pause: "થોભો",
      reset: "રીસેટ",
      followCorridor: "સમગ્ર રસ્તો",
      followAmbulance: "એમ્બ્યુલન્સ ટ્રેક કરો",
      followUser: "તમારી કાર ટ્રેક કરો",
      iHaveYielded: "મેં જગ્યા આપી દીધી છે (જમણી બાજુ ખસો)",
      yieldConfirmed: "જગ્યા ખાલી થઈ ગઈ · કંટ્રોલ રૂમમાં નોંધણી થઈ",
      reportHazard: "રસ્તામાં અડચણ કે બંધ પડેલ વાહનની જાણ કરો",
      auditionChime: "ચેતવણી અવાજ સાંભળો",
      voiceOn: "અવાજ: ચાલુ",
      voiceOff: "અવાજ: બંધ",
      understood: "સમજાઈ ગયું",
      transmit: "સંદેશ મોકલો",
      instantHorn: "ઇમરજન્સી હોર્ન સાયરન",
      forceGreen: "સિગ્નલ લીલું કરો",
    },
    metrics: {
      preAlertRange: "પ્રી-એલર્ટ રેન્જ",
      avgSavedTime: "બચેલો સમય",
      greenWave: "ગ્રીન વેવ સિગ્નલ",
      active: "સક્રિય",
      distance: "અંતર",
      meters: "મીટર",
      closingDelta: "ગતિ તફાવત",
      speed: "ઝડપ",
      interceptTime: "પહોંચવાનો સમય",
      pathClear: "માર્ગ ખુલ્લો",
      vehiclesInCone: "રેન્જમાં કુલ વાહનો",
      yieldedToShoulder: "જમણી બાજુ ખસેલા વાહનો",
      pendingClearance: "બાકી વાહનો",
      avgClearanceLatency: "સરેરાશ માર્ગ ખાલી થવાનો સમય",
      goldenHourSaved: "ગોલ્ડન અવરમાં બચેલો સમય",
      motoristYieldCompliance: "ડ્રાઈવર સહકાર ટકાવારી",
      greenWavePreemption: "સ્વચાલિત ગ્રીન વેવ સિગ્નલ",
    },
    alerts: {
      nominalTitle: "રસ્તો ખુલ્લો છે · સામાન્ય ગતિએ વાહન ચલાવો",
      nominalDesc: "તમારી આસપાસ કોઈ ઇમરજન્સી વાહન નથી. સલામત અંતર રાખી વાહન ચલાવો.",
      cautionTitle: "એમ્બ્યુલન્સ નજીક આવી રહી છે · જમણી બાજુ ખસવાની તૈયારી રાખો",
      cautionDesc: "તમારી પાછળ દર્દી સાથે એમ્બ્યુલન્સ આવી રહી છે. સાઇડ મિરરમાં ધ્યાન આપો અને વચ્ચેની લેન ખાલી કરો.",
      criticalTitle: "પાછળથી એમ્બ્યુલન્સ આવી રહી છે — તાત્કાલિક જમણી લેનમાં ખસો!",
      criticalDesc: "એમ્બ્યુલન્સ તમારી પાછળ ઝડપથી આવી રહી છે. સાઈડ લાઈટ આપીને સુરક્ષિત રીતે જમણી બાજુ રોડના શોલ્ડર પર ખસી જાઓ.",
      yieldedTitle: "આભાર! તમે એમ્બ્યુલન્સ માટે જીવનરક્ષક માર્ગ ખુલ્લો કર્યો છે.",
      yieldedDesc: "તમારું વાહન સુરક્ષિત રીતે જમણી બાજુ સ્થિર છે. એમ્બ્યુલન્સ પસાર ન થાય ત્યાં સુધી ત્યાં જ રહો.",
      voiceCritical: "સાવધાન: પાછળથી એમ્બ્યુલન્સ આવી રહી છે, કૃપા કરીને જમણી બાજુ ખસી જાઓ.",
      voiceNormal: "એમ્બ્યુલન્સ પસાર થઈ ગઈ છે. રસ્તો ખુલ્લો છે.",
    },
    lanes: {
      lane1: "લેન ૧ (ડાબી - ઝડપી લેન)",
      lane2: "લેન ૨ (એમ્બ્યુલન્સ કોરિડોર)",
      lane3: "લેન ૩ (જમણી - શોલ્ડર લેન)",
      emergencyCorridor: "ઇમરજન્સી લેન",
      safeShoulder: "સુરક્ષિત શોલ્ડર",
      vacateRequired: "ખાલી કરવું જરૂરી",
      targetLane: "આ લેનમાં ખસો",
    },
    protocols: {
      step1: "પાછળથી આવતી બાઇક કે અન્ય ઇમરજન્સી વાહનો જોવા સાઇડ મિરર અને રિયર મિરર તપાસો.",
      step2: "પાછળના ડ્રાઇવરોને સંકેત આપવા માટે વહેલા જમણી તરફનું ઇન્ડિકેટર (લાઈટ) ચાલુ કરો.",
      step3: "અચાનક બ્રેક માર્યા વગર ધીમેથી વાહનની ગતિ ઓછી કરી જમણી બાજુ લેન ૩ માં ખસી જાઓ.",
    },
    hospital: "ટ્રોમા સેન્ટર હોસ્પિટલ",
    unit: "પેરામેડિક-૧૦૪",
  },
};
