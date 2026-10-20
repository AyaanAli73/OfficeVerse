export type RobotRole = 'manager' | 'researcher' | 'creator' | 'reviewer';

export type RobotExpression =
  | 'happy'
  | 'excited'
  | 'wink'
  | 'love'
  | 'curious'
  | 'surprised'
  | 'sleepy'
  | 'sad';

export type RobotActionMode =
  | 'work'
  | 'idle'
  | 'patrol'
  | 'wave'
  | 'dance'
  | 'bounce'
  | 'celebrate'
  | 'curious'
  | 'bow'
  | 'sleep';

export type WorkflowStageId =
  | 'all_working'
  | 'step_1_plan'
  | 'step_2_research'
  | 'step_3_create'
  | 'step_4_review'
  | 'step_5_deliver';

export interface RobotColorTheme {
  accentPlasticHex: string;
  earInnerHex: string;
  earEmissiveHex: string;
  neonCoreHex: string;
  neonMidHex: string;
  neonEdgeHex: string;
  badgeColorHex: string;
}

export interface RobotConfig {
  id: string;
  index: number;
  code: string;
  name: string;
  title: string;
  role: RobotRole;
  roleLabel: string;
  visibleStateLabel: string;
  stationLabel: string;
  description: string;
  isSeatedAtDesk: boolean;
  seatElevationY: number;
  homePos: { x: number; y: number; z: number };
  homeRotY: number;
  focusCamOffset: { x: number; y: number; z: number };
  focusZoom: number;
  defaultExpression: RobotExpression;
  theme: RobotColorTheme;
  patrolWaypoints: Array<{ x: number; y: number; z: number }>;
}

export interface RobotPoseState {
  robotX: number;
  robotY: number;
  robotRotY: number;
  robotScaleX: number;
  robotScaleY: number;
  robotScaleZ: number;
  upperY: number;
  upperRotX: number;
  upperRotY: number;
  upperRotZ: number;
  headY: number;
  headRotX: number;
  headRotY: number;
  headRotZ: number;
  leftArmRotX: number;
  leftArmRotY: number;
  leftArmRotZ: number;
  rightArmRotX: number;
  rightArmRotY: number;
  rightArmRotZ: number;
  leftLegY: number;
  leftLegRotX: number;
  leftLegRotZ: number;
  rightLegY: number;
  rightLegRotX: number;
  rightLegRotZ: number;
}

export const HIP_PIVOT_Y = 1.52;

export const DEFAULT_REST_POSE: RobotPoseState = {
  robotX: 0,
  robotY: 0,
  robotRotY: 0,
  robotScaleX: 1,
  robotScaleY: 1,
  robotScaleZ: 1,
  upperY: HIP_PIVOT_Y,
  upperRotX: 0,
  upperRotY: 0,
  upperRotZ: 0,
  headY: 4.42,
  headRotX: 0,
  headRotY: 0,
  headRotZ: 0,
  leftArmRotX: -0.04,
  leftArmRotY: 0,
  leftArmRotZ: -0.34,
  rightArmRotX: -0.04,
  rightArmRotY: 0,
  rightArmRotZ: 0.34,
  leftLegY: HIP_PIVOT_Y,
  leftLegRotX: 0,
  leftLegRotZ: 0,
  rightLegY: HIP_PIVOT_Y,
  rightLegRotX: 0,
  rightLegRotZ: 0,
};

/**
 * The 4 AI Employees from the OfficeVerse AI Concept Report:
 * 1. AURA — Office Manager (Plans & coordinates at the Team Dashboard Wall)
 * 2. NOVA — Researcher (Finds & organizes information on the Research Tablet in the center)
 * 3. PIXEL — Creator (Seated in the ergonomic chair at Foreground Dual-Monitor PC, writing code & drafts)
 * 4. ORBIT — Quality Reviewer (Seated in the ergonomic chair at Left-Wall Dual-Monitor PC, reviewing & checking)
 */
export const FOUR_ROBOT_CONFIGS: RobotConfig[] = [
  {
    id: 'robot-aura',
    index: 0,
    code: 'A',
    name: 'AURA',
    title: 'Office Manager',
    role: 'manager',
    roleLabel: 'Planning & Coordinating',
    visibleStateLabel: 'Planning / coordinating',
    stationLabel: 'Team Dashboard Wall',
    description:
      'Understands your goal, splits it into tasks, tracks dependencies on the big wall dashboard, and routes work to the team.',
    isSeatedAtDesk: false,
    seatElevationY: 0.0,
    homePos: { x: -0.35, y: 0.0, z: 3.18 },
    homeRotY: -Math.PI * 0.68, // Faces isometric camera & team in front of the Team Dashboard Wall (matches PDF!)
    focusCamOffset: { x: -8.2, y: 6.8, z: -8.2 },
    focusZoom: 2.65,
    defaultExpression: 'excited',
    theme: {
      accentPlasticHex: '#B9A2F8',
      earInnerHex: '#4E388C',
      earEmissiveHex: '#251652',
      neonCoreHex: '#F7F4FF',
      neonMidHex: '#C4B0FF',
      neonEdgeHex: '#8B5CF6',
      badgeColorHex: '#7C3AED',
    },
    patrolWaypoints: [
      { x: -0.35, y: 0.0, z: 3.18 },
      { x: -1.85, y: 0.0, z: 2.55 },
      { x: 1.15, y: 0.0, z: 2.45 },
      { x: -0.35, y: 0.0, z: 3.18 },
    ],
  },
  {
    id: 'robot-nova',
    index: 1,
    code: 'N',
    name: 'NOVA',
    title: 'Researcher',
    role: 'researcher',
    roleLabel: 'Researching & Reading',
    visibleStateLabel: 'Researching / reading',
    stationLabel: 'Central Research Tablet',
    description:
      'Collects research from sources and documents on her digital tablet pad, separates facts from assumptions, and prepares notes.',
    isSeatedAtDesk: false,
    seatElevationY: 0.0,
    homePos: { x: 0.42, y: 0.0, z: 0.18 },
    homeRotY: -Math.PI * 0.74, // Stands on central rug facing isometric camera holding Research Tablet
    focusCamOffset: { x: -8.0, y: 6.6, z: -8.0 },
    focusZoom: 2.85,
    defaultExpression: 'curious',
    theme: {
      accentPlasticHex: '#8CE6D8',
      earInnerHex: '#236B63',
      earEmissiveHex: '#0D3B36',
      neonCoreHex: '#F2FFFD',
      neonMidHex: '#7CE8D8',
      neonEdgeHex: '#14B8A6',
      badgeColorHex: '#0D9488',
    },
    patrolWaypoints: [
      { x: 0.42, y: 0.0, z: 0.18 },
      { x: 1.45, y: 0.0, z: 1.35 },
      { x: -0.65, y: 0.0, z: 1.65 },
      { x: 0.42, y: 0.0, z: 0.18 },
    ],
  },
  {
    id: 'robot-pixel',
    index: 2,
    code: 'P',
    name: 'PIXEL',
    title: 'Creator',
    role: 'creator',
    roleLabel: 'Writing & Creating',
    visibleStateLabel: 'Writing / creating',
    stationLabel: 'Foreground Dual-Monitor Desk',
    description:
      'Seated at the dual-monitor creation workstation, turning approved plans and research into reports, documents, and code.',
    isSeatedAtDesk: true,
    seatElevationY: 0.25,
    homePos: { x: -0.47, y: 0.25, z: -3.18 },
    homeRotY: 0.0, // Seated on chair facing +Z directly into Workstation 2 dual monitors & keyboard
    focusCamOffset: { x: -8.2, y: 6.6, z: -8.2 },
    focusZoom: 2.75,
    defaultExpression: 'wink',
    theme: {
      accentPlasticHex: '#F29BB8',
      earInnerHex: '#8C3B5A',
      earEmissiveHex: '#471528',
      neonCoreHex: '#FFF5F8',
      neonMidHex: '#F7A1C0',
      neonEdgeHex: '#EC4899',
      badgeColorHex: '#DB2777',
    },
    patrolWaypoints: [
      { x: -0.47, y: 0.0, z: -1.35 },
      { x: 0.65, y: 0.0, z: -1.15 },
      { x: 0.25, y: 0.0, z: -0.25 },
      { x: -0.47, y: 0.0, z: -1.35 },
    ],
  },
  {
    id: 'robot-orbit',
    index: 3,
    code: 'O',
    name: 'ORBIT',
    title: 'Quality Reviewer',
    role: 'reviewer',
    roleLabel: 'Reviewing & Checking',
    visibleStateLabel: 'Reviewing / checking',
    stationLabel: 'Left-Wall Dual PC Studio',
    description:
      'Seated at the left-wall dual-monitor PC workstation, checking deliverables against requirements for completeness and accuracy.',
    isSeatedAtDesk: true,
    seatElevationY: 0.25,
    homePos: { x: 3.97, y: 0.25, z: -1.74 },
    homeRotY: Math.PI / 2, // Seated on chair facing +X directly into Left-Wall Workstation 1 monitors
    focusCamOffset: { x: -8.0, y: 6.6, z: -8.0 },
    focusZoom: 2.75,
    defaultExpression: 'happy',
    theme: {
      accentPlasticHex: '#E5B69C',
      earInnerHex: '#9C6B56',
      earEmissiveHex: '#472212',
      neonCoreHex: '#FFF9EE',
      neonMidHex: '#FFC292',
      neonEdgeHex: '#FF7E38',
      badgeColorHex: '#EA580C',
    },
    patrolWaypoints: [
      { x: 2.55, y: 0.0, z: -1.75 },
      { x: 2.15, y: 0.0, z: -0.45 },
      { x: 1.55, y: 0.0, z: 0.45 },
      { x: 2.55, y: 0.0, z: -1.75 },
    ],
  },
];

/**
 * Pure kinematic pose generator for each employee's specialized work role (`action === 'work'`)
 * and seated vs. standing posture.
 */
export function computeWorkTaskPose(role: RobotRole, elapsed: number): RobotPoseState {
  const pose: RobotPoseState = { ...DEFAULT_REST_POSE };

  if (role === 'manager') {
    // AURA (Office Manager): Standing at the Team Dashboard Wall, pointing up at charts with left arm
    // and coordinating with right arm, just like the top-right robot in the PDF!
    const cycle = elapsed * 1.9;
    const chartPoint = Math.sin(cycle);
    const bodyTurn = Math.cos(cycle * 0.7);

    pose.upperY = HIP_PIVOT_Y + Math.abs(Math.sin(cycle)) * 0.04;
    pose.upperRotY = bodyTurn * 0.22;
    pose.upperRotZ = -chartPoint * 0.04;

    // Head glances between the big wall dashboard and the team in the room
    pose.headRotX = -0.14 - Math.max(0, chartPoint) * 0.1;
    pose.headRotY = bodyTurn * 0.28;
    pose.headRotZ = chartPoint * 0.06;

    // Left arm raised high pointing at the Team Dashboard bar/pie charts
    pose.leftArmRotX = -0.95 - chartPoint * 0.25;
    pose.leftArmRotY = 0.22;
    pose.leftArmRotZ = -1.18 - chartPoint * 0.18;

    // Right arm gesturing smoothly at waist/chest level
    pose.rightArmRotX = -0.52 + Math.sin(elapsed * 3.2) * 0.12;
    pose.rightArmRotY = -0.18;
    pose.rightArmRotZ = 0.42 + Math.cos(elapsed * 2.4) * 0.08;
  } else if (role === 'researcher') {
    // NOVA (Researcher): Standing in the center holding the Research Tablet Pad in left/both hands,
    // reading notes and tapping/scrolling on the tablet with right hand (matches PDF center robot!)
    const readScan = Math.sin(elapsed * 2.2);
    const tapPulse = Math.max(0, Math.sin(elapsed * 6.5));
    const breath = Math.sin(elapsed * 1.8);

    pose.upperY = HIP_PIVOT_Y + breath * 0.025;
    pose.upperRotX = 0.12; // Slight forward nod looking at the tablet screen
    pose.upperRotY = Math.sin(elapsed * 0.8) * 0.12;

    // Head tilted down looking at the Research Tablet and scanning across lines
    pose.headRotX = 0.22 + Math.sin(elapsed * 1.5) * 0.04;
    pose.headRotY = readScan * 0.15;
    pose.headRotZ = -0.08 + readScan * 0.05;

    // Left arm cradles the Research Tablet in front of chest
    pose.leftArmRotX = -0.92 + breath * 0.02;
    pose.leftArmRotY = 0.28;
    pose.leftArmRotZ = -0.22;

    // Right arm reaches over to tap/scroll notes on the tablet surface
    pose.rightArmRotX = -0.98 + tapPulse * 0.14 + readScan * 0.06;
    pose.rightArmRotY = -0.26 + readScan * 0.12;
    pose.rightArmRotZ = 0.22;
  } else if (role === 'creator') {
    // PIXEL (Creator): SEATED in the ergonomic office chair at Workstation 2,
    // both hands typing rapidly on the keyboard while looking at the dual monitors!
    const typeLeft = Math.sin(elapsed * 16.0);
    const typeRight = Math.cos(elapsed * 17.5);
    const lookMonitor = Math.sin(elapsed * 1.1);

    pose.upperY = HIP_PIVOT_Y + Math.sin(elapsed * 2.6) * 0.018;
    pose.upperRotX = 0.1; // Leaning slightly toward the keyboard
    pose.upperRotY = lookMonitor * 0.06;

    // Head at monitor eye-level scanning between left & right coding screens
    pose.headRotX = -0.04 + Math.sin(elapsed * 3.6) * 0.03;
    pose.headRotY = lookMonitor * 0.22;
    pose.headRotZ = Math.cos(elapsed * 1.1) * 0.04;

    // Arms raised forward resting over the desk keyboard, typing rapidly
    pose.leftArmRotX = -1.14 + typeLeft * 0.09;
    pose.leftArmRotY = 0.16;
    pose.leftArmRotZ = -0.18 + Math.cos(elapsed * 7.0) * 0.03;

    pose.rightArmRotX = -1.14 + typeRight * 0.09;
    pose.rightArmRotY = -0.16;
    pose.rightArmRotZ = 0.18 - Math.sin(elapsed * 7.5) * 0.03;

    // Seated leg posture on the pink chair cushion
    pose.leftLegY = HIP_PIVOT_Y + 0.08;
    pose.leftLegRotX = -1.18;
    pose.leftLegRotZ = -0.1;

    pose.rightLegY = HIP_PIVOT_Y + 0.08;
    pose.rightLegRotX = -1.18;
    pose.rightLegRotZ = 0.1;
  } else if (role === 'reviewer') {
    // ORBIT (Quality Reviewer): SEATED in the ergonomic office chair at Left-Wall Workstation 1,
    // left hand on keyboard shortcuts, right hand gliding the mouse to check & audit deliverables!
    const keyTap = Math.sin(elapsed * 7.5);
    const mouseGlideX = Math.sin(elapsed * 2.0);
    const mouseGlideZ = Math.cos(elapsed * 1.5);

    pose.upperY = HIP_PIVOT_Y + Math.sin(elapsed * 2.0) * 0.018;
    pose.upperRotX = 0.08;
    pose.upperRotY = mouseGlideX * 0.06;

    // Head carefully inspecting the left and right monitors with thoughtful nods
    pose.headRotX = -0.05 + Math.sin(elapsed * 2.8) * 0.045;
    pose.headRotY = Math.sin(elapsed * 0.85) * 0.25;
    pose.headRotZ = Math.sin(elapsed * 0.75) * 0.06;

    // Left arm on keyboard
    pose.leftArmRotX = -1.08 + Math.max(0, keyTap) * 0.07;
    pose.leftArmRotY = 0.14;
    pose.leftArmRotZ = -0.2;

    // Right arm gliding the wireless mouse across the pink desk pad
    pose.rightArmRotX = -1.06 + mouseGlideZ * 0.05;
    pose.rightArmRotY = -0.14 + mouseGlideX * 0.16;
    pose.rightArmRotZ = 0.26 + mouseGlideX * 0.12;

    // Seated leg posture on the pink chair cushion
    pose.leftLegY = HIP_PIVOT_Y + 0.08;
    pose.leftLegRotX = -1.18;
    pose.leftLegRotZ = -0.1;

    pose.rightLegY = HIP_PIVOT_Y + 0.08;
    pose.rightLegRotX = -1.18;
    pose.rightLegRotZ = 0.1;
  }

  return pose;
}

export function getRobotById(id: string): RobotConfig | undefined {
  return FOUR_ROBOT_CONFIGS.find((r) => r.id === id);
}
