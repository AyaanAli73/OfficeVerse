import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  RotateCcw,
  Grid,
  Tag,
  Focus,
  Terminal,
  BookOpen,
  LayoutDashboard,
  ShieldCheck,
  Users,
  Eye,
  Sparkles,
  Menu,
  X,
  Layers,
} from 'lucide-react';
import {
  FOUR_ROBOT_CONFIGS,
  type RobotConfig,
  type RobotExpression,
  type RobotActionMode,
  type WorkflowStageId,
} from './utils/robotTasks';
import {
  createRobotEnvironments,
  createRobotMaterials,
  createCompanionRobotHierarchy,
  FacialExpressionController,
  OfficeRobotAnimationController,
} from './scene/companionRobotBuilder';
import { buildPastelOfficeEnvironment } from './scene/officeEnvironmentBuilder';

interface AssetLabelItem {
  id: string;
  name: string;
  pos: THREE.Vector3;
}

const OFFICE_ASSET_LABELS: AssetLabelItem[] = [
  { id: '01', name: 'Modular Floor Platform', pos: new THREE.Vector3(0.55, -0.1, -5.15) },
  { id: '02', name: 'Low Perimeter Wall', pos: new THREE.Vector3(3.4, 0.72, -5.15) },
  { id: '03', name: 'Glass Divider Panel', pos: new THREE.Vector3(5.55, 1.85, -1.15) },
  { id: '04', name: 'Creator Workstation (PIXEL)', pos: new THREE.Vector3(0.55, 0.85, -2.55) },
  { id: '05', name: 'Secondary Workstation', pos: new THREE.Vector3(2.35, 0.85, -0.95) },
  { id: '09', name: 'Reviewer Dual-PC Desk (ORBIT)', pos: new THREE.Vector3(-4.65, 1.38, -2.35) },
  { id: '12', name: 'Team Dashboard Wall (AURA)', pos: new THREE.Vector3(-0.45, 2.45, 4.75) },
  { id: '13', name: 'Mobile Console Cabinet', pos: new THREE.Vector3(-0.45, 0.65, 4.15) },
  { id: '14', name: 'Wall Pegboard', pos: new THREE.Vector3(-5.3, 2.55, -3.3) },
  { id: '15', name: 'Framed Wall Art', pos: new THREE.Vector3(-5.3, 2.55, -2.1) },
  { id: '16', name: 'Open Bookshelf', pos: new THREE.Vector3(-4.95, 2.15, -0.95) },
  { id: '17', name: 'Two-Tier Plant Shelf', pos: new THREE.Vector3(-3.45, 1.55, 0.0) },
  { id: '18', name: 'Storage & Mini Fridge', pos: new THREE.Vector3(-4.65, 0.75, 4.35) },
  { id: '19', name: 'Espresso Machine', pos: new THREE.Vector3(-4.95, 1.25, 3.75) },
  { id: '20', name: 'Lounge Sofa', pos: new THREE.Vector3(-3.45, 0.88, -3.85) },
  { id: '21', name: 'Round Pink Pouf', pos: new THREE.Vector3(-1.68, 0.48, -2.42) },
  { id: '22', name: 'Round Coffee Table', pos: new THREE.Vector3(-2.98, 0.55, -2.52) },
  { id: '28', name: 'Glass Kanban Notice Board', pos: new THREE.Vector3(3.55, 2.1, 3.68) },
];

const EXPRESSION_OPTIONS: Array<{ id: RobotExpression; label: string }> = [
  { id: 'happy', label: 'Happy' },
  { id: 'excited', label: 'Excited' },
  { id: 'wink', label: 'Wink' },
  { id: 'love', label: 'Love' },
  { id: 'curious', label: 'Curious' },
  { id: 'surprised', label: 'Surprised' },
  { id: 'sleepy', label: 'Sleepy' },
  { id: 'sad', label: 'Sad' },
];

const ACTION_OPTIONS: Array<{ id: RobotActionMode; label: string }> = [
  { id: 'work', label: 'Work Task' },
  { id: 'idle', label: 'Idle' },
  { id: 'patrol', label: 'Patrol' },
  { id: 'wave', label: 'Wave' },
  { id: 'dance', label: 'Dance' },
  { id: 'bounce', label: 'Bounce' },
  { id: 'celebrate', label: 'Celebrate' },
  { id: 'curious', label: 'Head Tilt' },
  { id: 'bow', label: 'Bow' },
  { id: 'sleep', label: 'Sleep' },
];

const WORKFLOW_STAGES: Array<{
  id: WorkflowStageId;
  stepNum: string;
  label: string;
  leadRobotId: string | null;
  summary: string;
}> = [
  {
    id: 'all_working',
    stepNum: 'ALL',
    label: 'All 4 Active',
    leadRobotId: null,
    summary: 'All 4 AI employees executing their specialized roles simultaneously across the studio.',
  },
  {
    id: 'step_1_plan',
    stepNum: '01',
    label: 'Plan (AURA)',
    leadRobotId: 'robot-aura',
    summary: 'Step 1 — AURA breaks the project goal into tasks & dependencies at the Team Dashboard.',
  },
  {
    id: 'step_2_research',
    stepNum: '02',
    label: 'Research (NOVA)',
    leadRobotId: 'robot-nova',
    summary: 'Step 2 — NOVA gathers sources, documents & notes on her digital Research Tablet.',
  },
  {
    id: 'step_3_create',
    stepNum: '03',
    label: 'Create (PIXEL)',
    leadRobotId: 'robot-pixel',
    summary: 'Step 3 — PIXEL sits at the foreground dual-monitor PC writing code & deliverables.',
  },
  {
    id: 'step_4_review',
    stepNum: '04',
    label: 'Review (ORBIT)',
    leadRobotId: 'robot-orbit',
    summary: 'Step 4 — ORBIT sits at the left-wall PC reviewing & verifying output quality.',
  },
  {
    id: 'step_5_deliver',
    stepNum: '05',
    label: 'Deliver',
    leadRobotId: null,
    summary: 'Step 5 — Final approved package is assembled and celebrated by the entire AI team!',
  },
];

interface RobotRuntimeInstance {
  config: RobotConfig;
  anchor: THREE.Group;
  exprCtrl: FacialExpressionController;
  animCtrl: OfficeRobotAnimationController;
}

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const robotLabelRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const assetLabelRefs = useRef<Array<HTMLDivElement | null>>([]);

  // UI State
  const [selectedTarget, setSelectedTarget] = useState<string>('all'); // 'all' or robot.id
  const [focusedRobotId, setFocusedRobotId] = useState<string | null>(null);
  const [workflowStage, setWorkflowStage] = useState<WorkflowStageId>('all_working');
  const [wireframe, setWireframe] = useState(false);
  const [showRobotBadges, setShowRobotBadges] = useState(true);
  const [showAssetLabels, setShowAssetLabels] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);


  const [robotStates, setRobotStates] = useState<
    Record<string, { action: RobotActionMode; expression: RobotExpression }>
  >(() => {
    const init: Record<string, { action: RobotActionMode; expression: RobotExpression }> = {};
    FOUR_ROBOT_CONFIGS.forEach((c) => {
      init[c.id] = { action: 'work', expression: c.defaultExpression };
    });
    return init;
  });

  // Refs shared with Three.js render loop
  const robotsRef = useRef<RobotRuntimeInstance[]>([]);
  const allMaterialsRef = useRef<THREE.Material[]>([]);
  const cameraStateRef = useRef<{
    mode: 'overview' | 'resetting' | 'focus';
    focusedId: string | null;
  }>({
    mode: 'overview',
    focusedId: null,
  });
  const showRobotBadgesRef = useRef(true);
  const showAssetLabelsRef = useRef(false);

  useEffect(() => {
    showRobotBadgesRef.current = showRobotBadges;
  }, [showRobotBadges]);

  useEffect(() => {
    showAssetLabelsRef.current = showAssetLabels;
  }, [showAssetLabels]);

  const handleRobotStateSync = useCallback(
    (robotId: string, action: RobotActionMode, expression: RobotExpression) => {
      setRobotStates((prev) => {
        const cur = prev[robotId];
        if (cur && cur.action === action && cur.expression === expression) return prev;
        return {
          ...prev,
          [robotId]: { action, expression },
        };
      });
    },
    []
  );

  // Initialize Three.js Scene Once
  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    const isHeadless =
      navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent);

    const scene = new THREE.Scene();

    const renderer = new THREE.WebGLRenderer({
      antialias: !isHeadless,
      powerPreference: 'high-performance',
      alpha: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    renderer.shadowMap.enabled = !isHeadless;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTexture;
    scene.environmentIntensity = 0.16;
    pmremGenerator.dispose();

    const frustumSize = 15.0;
    const aspect = window.innerWidth / window.innerHeight;
    const camera = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      120
    );

    const DEFAULT_CAM_POS = new THREE.Vector3(-15.6, 13.4, -15.6);
    const DEFAULT_TARGET = new THREE.Vector3(0.0, 1.25, 0.0);
    const DEFAULT_ZOOM = 1.09;

    camera.position.copy(DEFAULT_CAM_POS);
    camera.zoom = DEFAULT_ZOOM;
    camera.updateProjectionMatrix();

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(DEFAULT_TARGET);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.minPolarAngle = 0.25;
    controls.minZoom = 0.55;
    controls.maxZoom = 3.5;
    controls.update();

    const controlsStartListener = () => {
      if (cameraStateRef.current.mode === 'resetting') {
        cameraStateRef.current.mode = 'overview';
      }
    };
    controls.addEventListener('start', controlsStartListener);

    const registeredMats: THREE.Material[] = [];
    const registerMat = <T extends THREE.Material>(m: T): T => {
      registeredMats.push(m);
      return m;
    };

    // Build Pastel Co-Working Office Environment
    const { addContactShadow, addWarmGlowPool, updatables } =
      buildPastelOfficeEnvironment(scene, registerMat);

    // Build All 4 OfficeVerse AI Employees (AURA, NOVA, PIXEL, ORBIT)
    const robotEnvs = createRobotEnvironments(renderer);
    const builtRobots: RobotRuntimeInstance[] = [];

    FOUR_ROBOT_CONFIGS.forEach((cfg) => {
      const rMats = createRobotMaterials(robotEnvs, cfg.theme, registerMat);
      const rParts = createCompanionRobotHierarchy(rMats, cfg.role);

      const anchor = new THREE.Group();
      anchor.name = `RobotAnchor_${cfg.id}`;
      anchor.position.set(cfg.homePos.x, cfg.homePos.y, cfg.homePos.z);
      anchor.rotation.y = cfg.homeRotY;

      // Standing employees get floor contact shadow & warm glow directly under their boots
      if (!cfg.isSeatedAtDesk) {
        addContactShadow(anchor, 1.15, 1.05, 0, 0.005, 0, 0.88);
        addWarmGlowPool(anchor, 1.35, 1.25, 0, 0.007, 0.08, 0.62);
      }

      rParts.robotGroup.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.castShadow = true;
          obj.receiveShadow = true;
        }
      });

      const scaleWrapper = new THREE.Group();
      scaleWrapper.scale.setScalar(0.155);
      scaleWrapper.add(rParts.robotGroup);
      anchor.add(scaleWrapper);

      // Subtle localized accent light per employee
      const rLight = new THREE.PointLight(cfg.theme.neonEdgeHex, 0.55, 2.2, 1.8);
      rLight.position.set(0, 0.95, 0.32);
      anchor.add(rLight);

      scene.add(anchor);

      const exprCtrl = new FacialExpressionController(
        rParts.headGroup.userData.faceGroup,
        rMats,
        cfg.defaultExpression
      );
      const animCtrl = new OfficeRobotAnimationController(
        cfg,
        rParts,
        anchor,
        exprCtrl,
        handleRobotStateSync
      );
      // Start each employee in their specialized 'work' mode
      animCtrl.setAction('work');

      builtRobots.push({
        config: cfg,
        anchor,
        exprCtrl,
        animCtrl,
      });
    });

    robotsRef.current = builtRobots;
    allMaterialsRef.current = registeredMats;

    // Pre-compile shaders once
    renderer.compile(scene, camera);

    // Pre-allocated vectors for zero GC in render loop
    const projVec = new THREE.Vector3();
    const focusTargetVec = new THREE.Vector3();
    const focusCamPosVec = new THREE.Vector3();
    const clock = new THREE.Clock();

    let animFrameId = 0;
    let headlessTimerId: ReturnType<typeof setTimeout> | null = null;

    function updateFloatingDOMLabels() {
      const halfW = window.innerWidth / 2;
      const halfH = window.innerHeight / 2;

      if (showRobotBadgesRef.current) {
        for (let i = 0; i < builtRobots.length; i++) {
          const r = builtRobots[i];
          const el = robotLabelRefs.current[r.config.id];
          if (!el) continue;
          const badgeY = r.anchor.position.y + (r.config.isSeatedAtDesk ? 1.56 : 1.72);
          projVec.set(r.anchor.position.x, badgeY, r.anchor.position.z);
          projVec.project(camera);
          const x = projVec.x * halfW + halfW;
          const y = -(projVec.y * halfH) + halfH;
          el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -100%)`;
        }
      }

      if (showAssetLabelsRef.current) {
        for (let i = 0; i < OFFICE_ASSET_LABELS.length; i++) {
          const item = OFFICE_ASSET_LABELS[i];
          const el = assetLabelRefs.current[i];
          if (!el) continue;
          projVec.copy(item.pos);
          projVec.x *= -1; // Match officeGroup.scale.x = -1
          projVec.project(camera);
          const x = projVec.x * halfW + halfW;
          const y = -(projVec.y * halfH) + halfH;
          el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
        }
      }
    }

    function scheduleNextFrame() {
      if (isHeadless) {
        headlessTimerId = setTimeout(() => {
          animFrameId = requestAnimationFrame(animate);
        }, 140);
      } else {
        animFrameId = requestAnimationFrame(animate);
      }
    }

    function animate() {
      const dt = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.getElapsedTime();

      // Update all 4 OfficeVerse AI Employees
      for (let i = 0; i < builtRobots.length; i++) {
        builtRobots[i].exprCtrl.update(dt, elapsed);
        builtRobots[i].animCtrl.update(dt, elapsed);
      }

      // Animate AURA's Coordinator Target Reticle on the Team Dashboard Wall
      updatables.auraDashboardCursor.position.x = Math.cos(elapsed * 1.9 * 0.7) * 0.85;
      updatables.auraDashboardCursor.position.y = 2.15 + Math.sin(elapsed * 1.9) * 0.36;
      updatables.auraDashboardCursor.rotation.z = elapsed * 1.4;

      // Animate PIXEL's Live Creation/Coding Panel above Workstation 2
      updatables.codingFloatPanel.position.y = 1.48 + Math.sin(elapsed * 3.0) * 0.02;

      // Animate ORBIT's Quality Review Layer above Workstation 1
      updatables.pcFloatPreview.position.y = 1.44 + Math.cos(elapsed * 2.5) * 0.02;

      // Animate Kanban Board Cursor
      updatables.boardLaserCursor.position.x = Math.cos(elapsed * 1.85 * 0.75) * 0.34;
      updatables.boardLaserCursor.position.y = 1.48 + Math.sin(elapsed * 1.85) * 0.32;

      // Smooth Camera Choreography
      const camMode = cameraStateRef.current.mode;
      const focusedId = cameraStateRef.current.focusedId;

      if (camMode === 'focus' && focusedId) {
        const targetRobot = builtRobots.find((r) => r.config.id === focusedId);
        if (targetRobot) {
          focusTargetVec.set(
            targetRobot.anchor.position.x,
            targetRobot.anchor.position.y + 0.82,
            targetRobot.anchor.position.z
          );
          focusCamPosVec.set(
            targetRobot.anchor.position.x + targetRobot.config.focusCamOffset.x,
            targetRobot.config.focusCamOffset.y,
            targetRobot.anchor.position.z + targetRobot.config.focusCamOffset.z
          );
          const dampFactor = isHeadless ? 0.45 : 1 - Math.exp(-7.5 * dt);
          camera.position.lerp(focusCamPosVec, dampFactor);
          controls.target.lerp(focusTargetVec, dampFactor);
          camera.zoom = THREE.MathUtils.lerp(
            camera.zoom,
            targetRobot.config.focusZoom,
            dampFactor
          );
          camera.updateProjectionMatrix();
        }
      } else if (camMode === 'resetting') {
        const dampFactor = isHeadless ? 0.5 : 1 - Math.exp(-8.5 * dt);
        camera.position.lerp(DEFAULT_CAM_POS, dampFactor);
        controls.target.lerp(DEFAULT_TARGET, dampFactor);
        camera.zoom = THREE.MathUtils.lerp(camera.zoom, DEFAULT_ZOOM, dampFactor);
        camera.updateProjectionMatrix();

        if (
          camera.position.distanceTo(DEFAULT_CAM_POS) < 0.02 &&
          controls.target.distanceTo(DEFAULT_TARGET) < 0.02 &&
          Math.abs(camera.zoom - DEFAULT_ZOOM) < 0.005
        ) {
          camera.position.copy(DEFAULT_CAM_POS);
          controls.target.copy(DEFAULT_TARGET);
          camera.zoom = DEFAULT_ZOOM;
          camera.updateProjectionMatrix();
          cameraStateRef.current.mode = 'overview';
        }
      }

      controls.update();
      updateFloatingDOMLabels();
      renderer.render(scene, camera);
      scheduleNextFrame();
    }

    animate();

    const handleResize = () => {
      const newAspect = window.innerWidth / window.innerHeight;
      camera.left = (-frustumSize * newAspect) / 2;
      camera.right = (frustumSize * newAspect) / 2;
      camera.top = frustumSize / 2;
      camera.bottom = -frustumSize / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      updateFloatingDOMLabels();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animFrameId);
      if (headlessTimerId) clearTimeout(headlessTimerId);
      window.removeEventListener('resize', handleResize);
      controls.removeEventListener('start', controlsStartListener);
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [handleRobotStateSync]);

  // Keyboard shortcuts ('M' or 'H' to toggle menu, 'Escape' to close menu, '0' to reset camera, '1'-'4' to focus employee)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'h' || e.key === 'H' || e.key === 'm' || e.key === 'M') {
        setIsMenuOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsMenuOpen(false);
      } else if (e.key === '0') {
        handleResetCamera();
      } else if (['1', '2', '3', '4'].includes(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        const cfg = FOUR_ROBOT_CONFIGS[idx];
        if (cfg) handleFocusRobot(cfg.id);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Action Handlers
  const handleResetCamera = () => {
    setFocusedRobotId(null);
    cameraStateRef.current = {
      mode: 'resetting',
      focusedId: null,
    };
  };

  const handleFocusRobot = (robotId: string) => {
    setSelectedTarget(robotId);
    if (focusedRobotId === robotId) {
      handleResetCamera();
    } else {
      setFocusedRobotId(robotId);
      cameraStateRef.current = {
        mode: 'focus',
        focusedId: robotId,
      };
    }
  };

  const handleSelectTarget = (targetId: string) => {
    setSelectedTarget(targetId);
    if (targetId === 'all') {
      handleResetCamera();
    } else {
      setFocusedRobotId(targetId);
      cameraStateRef.current = {
        mode: 'focus',
        focusedId: targetId,
      };
    }
  };

  const handleSelectWorkflowStage = (stageId: WorkflowStageId) => {
    setWorkflowStage(stageId);
    const stage = WORKFLOW_STAGES.find((s) => s.id === stageId);
    if (!stage) return;

    if (stageId === 'all_working') {
      setSelectedTarget('all');
      handleResetCamera();
      robotsRef.current.forEach((r) => {
        r.animCtrl.setAction('work');
      });
    } else if (stageId === 'step_5_deliver') {
      setSelectedTarget('all');
      handleResetCamera();
      robotsRef.current.forEach((r) => {
        r.animCtrl.setAction('celebrate');
      });
    } else if (stage.leadRobotId) {
      setSelectedTarget(stage.leadRobotId);
      setFocusedRobotId(stage.leadRobotId);
      cameraStateRef.current = {
        mode: 'focus',
        focusedId: stage.leadRobotId,
      };
      robotsRef.current.forEach((r) => {
        if (r.config.id === stage.leadRobotId) {
          r.animCtrl.setAction('work');
          r.exprCtrl.setExpression('excited', true);
        } else {
          r.animCtrl.setAction('work');
        }
      });
    }
  };

  const handleToggleWireframe = () => {
    const next = !wireframe;
    setWireframe(next);
    allMaterialsRef.current.forEach((m) => {
      if ('wireframe' in m) {
        (m as THREE.MeshStandardMaterial).wireframe = next;
      }
    });
  };

  const handleApplyExpression = (expr: RobotExpression) => {
    robotsRef.current.forEach((r) => {
      if (selectedTarget === 'all' || r.config.id === selectedTarget) {
        r.exprCtrl.setExpression(expr, true);
        handleRobotStateSync(r.config.id, r.animCtrl.currentAction, r.exprCtrl.currentExpression);
      }
    });
  };

  const handleTriggerBlink = () => {
    robotsRef.current.forEach((r) => {
      if (selectedTarget === 'all' || r.config.id === selectedTarget) {
        r.exprCtrl.triggerBlink();
      }
    });
  };

  const handleApplyAction = (action: RobotActionMode) => {
    robotsRef.current.forEach((r) => {
      if (selectedTarget === 'all' || r.config.id === selectedTarget) {
        r.animCtrl.setAction(action);
      }
    });
  };

  const handleSyncAllToWork = () => {
    setWorkflowStage('all_working');
    setSelectedTarget('all');
    robotsRef.current.forEach((r) => {
      r.animCtrl.setAction('work');
    });
  };

  // Active status for the currently selected scope ('all' or single employee)
  const activeScopeConfig =
    selectedTarget === 'all'
      ? null
      : FOUR_ROBOT_CONFIGS.find((c) => c.id === selectedTarget) || FOUR_ROBOT_CONFIGS[0];

  const activeScopeState = activeScopeConfig
    ? robotStates[activeScopeConfig.id]
    : robotStates[FOUR_ROBOT_CONFIGS[0].id];

  const getRoleIcon = (role: RobotConfig['role']) => {
    switch (role) {
      case 'manager':
        return <LayoutDashboard className="w-3.5 h-3.5" />;
      case 'researcher':
        return <BookOpen className="w-3.5 h-3.5" />;
      case 'creator':
        return <Terminal className="w-3.5 h-3.5" />;
      case 'reviewer':
        return <ShieldCheck className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none"
      data-state="office-active"
      data-robot-count={FOUR_ROBOT_CONFIGS.length}
      data-focused-robot={focusedRobotId || 'overview'}
      data-workflow-stage={workflowStage}
    >
      {/* Dedicated WebGL Canvas Container */}
      <div
        ref={canvasMountRef}
        data-testid="office-webgl-canvas"
        className="fixed inset-0 w-full h-full"
      />

      {/* 3D Floating Employee Role & State Badges (Interactive DOM Overlays) */}
      <div
        className={`fixed inset-0 pointer-events-none z-10 overflow-hidden transition-opacity duration-200 ${
          showRobotBadges ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {FOUR_ROBOT_CONFIGS.map((cfg) => {
          const st = robotStates[cfg.id];
          const isFocused = focusedRobotId === cfg.id;
          return (
            <button
              key={cfg.id}
              ref={(el) => {
                robotLabelRefs.current[cfg.id] = el;
              }}
              type="button"
              onClick={() => handleFocusRobot(cfg.id)}
              aria-label={`Focus ${cfg.name} (${cfg.title}) - ${cfg.visibleStateLabel}`}
              className={`pointer-events-auto absolute top-0 left-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-left transition-shadow duration-150 cursor-pointer whitespace-nowrap ${
                isFocused
                  ? 'bg-[#1e212b] text-white border-[#f08cae] shadow-lg'
                  : 'bg-[#ffffffee] text-[#232630] border-[#e2d8df] hover:bg-white shadow-md'
              }`}
            >
              <span
                className="font-mono-tabular text-[10px] font-bold w-4 h-4 rounded flex items-center justify-center text-white shrink-0"
                style={{ backgroundColor: cfg.theme.badgeColorHex }}
              >
                {cfg.code}
              </span>
              <span className="text-xs font-bold tracking-tight">{cfg.name}</span>
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                  isFocused
                    ? 'bg-white/15 text-pink-200'
                    : 'bg-[#f4eff2] text-[#4b5162]'
                }`}
              >
                {cfg.title}
              </span>
              <span className="text-xs opacity-40" aria-hidden="true">
                ·
              </span>
              <span
                className={`text-[11px] font-medium ${
                  isFocused ? 'text-pink-200' : 'text-[#555b6d]'
                }`}
              >
                {st?.action === 'work' ? cfg.visibleStateLabel : `Action: ${st?.action}`}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3D Architectural Asset Breakdown Labels */}
      <div
        className={`fixed inset-0 pointer-events-none z-10 overflow-hidden transition-opacity duration-200 ${
          showAssetLabels ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {OFFICE_ASSET_LABELS.map((item, idx) => (
          <div
            key={item.id}
            ref={(el) => {
              assetLabelRefs.current[idx] = el;
            }}
            className="absolute top-0 left-0 bg-[#fffffff0] border border-[#f08cae] rounded-md px-2 py-0.5 flex items-center gap-1.5 text-[11px] font-semibold text-[#252830] shadow-sm whitespace-nowrap"
          >
            <span className="font-mono-tabular text-[10px] font-bold text-[#c94a78]">
              {item.id}
            </span>
            <span aria-hidden="true">·</span>
            <span>{item.name}</span>
          </div>
        ))}
      </div>

      {/* Top Floating Bar: Hamburger & 3D OfficeVerse Logo */}
      <header className="fixed top-3 left-3 sm:top-4 sm:left-4 z-30 flex items-center gap-2.5 pointer-events-auto">
        <button
          type="button"
          onClick={() => setIsMenuOpen(true)}
          aria-label="Open menu and controls"
          aria-expanded={isMenuOpen}
          className="group relative flex items-center justify-center p-2 sm:p-2.5 rounded-2xl bg-white/90 hover:bg-white text-[#1f232e] border border-white/80 shadow-[0_8px_24px_rgba(35,38,48,0.08)] backdrop-blur-xl transition-[transform,background-color,box-shadow] duration-200 hover:scale-[1.03] active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-purple-400 cursor-pointer"
        >
          <Menu className="w-5 h-5 text-[#232630] transition-transform duration-200 group-hover:scale-110" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-2.5 px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-2xl bg-white/95 border border-white/90 shadow-[0_8px_24px_rgba(35,38,48,0.08)] backdrop-blur-xl transition-transform duration-200 hover:scale-[1.02]">
          <span className="relative flex h-2.5 w-2.5 shrink-0 ml-0.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <img
            src="/officeverse-logo.png"
            alt="OfficeVerse Logo"
            className="h-11 sm:h-13 w-auto object-contain select-none filter drop-shadow-[0_2px_8px_rgba(236,72,153,0.22)]"
          />
        </div>
      </header>

      {/* Floating "Return to Overview" Pill (Visible when Camera is Focused on a Robot) */}
      {focusedRobotId !== null && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
          <button
            type="button"
            onClick={handleResetCamera}
            className="px-4 py-2 rounded-full bg-[#1e212b]/90 hover:bg-[#1e212b] text-white text-xs font-bold shadow-xl backdrop-blur-md border border-white/10 flex items-center gap-2 cursor-pointer transition-[transform,background-color] hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-purple-400"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Return to Studio Overview</span>
          </button>
        </div>
      )}

      {/* Hamburger Menu Backdrop Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[2px] transition-opacity duration-300"
          onClick={() => setIsMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Left-Side Hamburger Menu Drawer */}
      <aside
        aria-label="OfficeVerse Controls Menu"
        aria-hidden={!isMenuOpen}
        className={`fixed top-0 left-0 bottom-0 z-50 w-full sm:w-[440px] max-w-[92vw] bg-[#fffffff7] dark:bg-[#1a1c27f7] backdrop-blur-2xl border-r border-[#e8dfe5] dark:border-white/10 shadow-2xl flex flex-col transition-transform duration-300 ease-out overscroll-contain ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        }`}
      >
        {/* Drawer Header with 3D Robot Logo */}
        <div className="p-4 sm:p-5 border-b border-[#ece3e8] dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/officeverse-logo.png"
              alt="OfficeVerse Logo"
              className="h-14 sm:h-16 w-auto object-contain select-none filter drop-shadow-[0_4px_12px_rgba(236,72,153,0.28)]"
            />
          </div>
          <button
            type="button"
            onClick={() => setIsMenuOpen(false)}
            aria-label="Close controls menu"
            className="p-2 rounded-xl text-[#686f82] hover:text-[#232630] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-400"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Section 1: Scene & View Controls (Previously in Top-Right Toolbar) */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#7c8294]">
              <Layers className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Scene & View Controls</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleResetCamera}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold border transition-[background-color,transform] duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-400 ${
                  focusedRobotId === null
                    ? 'bg-[#232630] text-white border-[#232630] shadow-sm'
                    : 'bg-white text-[#232630] border-[#e6dde2] hover:bg-[#f7f2f5]'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Overview View</span>
              </button>

              <button
                type="button"
                onClick={handleSyncAllToWork}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold border bg-white text-[#232630] border-[#e6dde2] hover:bg-[#f7f2f5] transition-[background-color,transform] duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-400"
              >
                <Users className="w-3.5 h-3.5 text-[#d9648a]" aria-hidden="true" />
                <span>All Work Tasks</span>
              </button>

              <button
                type="button"
                onClick={() => setShowRobotBadges((prev) => !prev)}
                aria-pressed={showRobotBadges}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold border transition-[background-color,transform] duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-400 ${
                  showRobotBadges
                    ? 'bg-[#f08cae] text-white border-[#f08cae]'
                    : 'bg-white text-[#232630] border-[#e6dde2] hover:bg-[#f7f2f5]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Badges</span>
                </span>
                <span className="text-[10px] uppercase font-mono-tabular opacity-90">
                  {showRobotBadges ? 'ON' : 'OFF'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowAssetLabels((prev) => !prev)}
                aria-pressed={showAssetLabels}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold border transition-[background-color,transform] duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-400 ${
                  showAssetLabels
                    ? 'bg-[#9b82f3] text-white border-[#9b82f3]'
                    : 'bg-white text-[#232630] border-[#e6dde2] hover:bg-[#f7f2f5]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Assets</span>
                </span>
                <span className="text-[10px] uppercase font-mono-tabular opacity-90">
                  {showAssetLabels ? 'ON' : 'OFF'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleToggleWireframe}
                aria-pressed={wireframe}
                className={`col-span-2 flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold border transition-[background-color,transform] duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-400 ${
                  wireframe
                    ? 'bg-[#232630] text-white border-[#232630]'
                    : 'bg-white text-[#232630] border-[#e6dde2] hover:bg-[#f7f2f5]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Grid className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Wireframe Mode</span>
                </span>
                <span className="text-[10px] uppercase font-mono-tabular opacity-90">
                  {wireframe ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>
          </div>

          {/* Section 2: Workflow Pipeline */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#7c8294]">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#7c3aed]" aria-hidden="true" />
                <span>Workflow Pipeline</span>
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {WORKFLOW_STAGES.map((stage) => {
                const isCurrent = workflowStage === stage.id;
                return (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={() => handleSelectWorkflowStage(stage.id)}
                    className={`p-2.5 rounded-xl text-left border text-xs font-semibold transition-[background-color,border-color,box-shadow] duration-150 cursor-pointer flex flex-col justify-between focus-visible:ring-2 focus-visible:ring-purple-400 ${
                      isCurrent
                        ? 'bg-[#7c3aed] text-white border-[#7c3aed] shadow-md'
                        : 'bg-white text-[#232630] border-[#e8dfe5] hover:bg-[#f9f5f8]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono-tabular text-[10px] opacity-80">
                        {stage.stepNum}
                      </span>
                      {isCurrent && <span className="w-2 h-2 rounded-full bg-white animate-pulse" aria-hidden="true" />}
                    </div>
                    <div className="mt-1 font-bold text-[11px] truncate">{stage.label}</div>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-[#636b80] bg-[#f7f2f5] p-2.5 rounded-xl border border-[#ede5ea] leading-snug">
              {WORKFLOW_STAGES.find((s) => s.id === workflowStage)?.summary}
            </p>
          </div>

          {/* Section 3: AI Robot Team Selector */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#7c8294]">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#d9648a]" aria-hidden="true" />
                <span>AI Robot Team</span>
              </span>
              <span className="text-[10px] font-mono-tabular font-bold px-1.5 py-0.5 rounded bg-[#f4eff2] text-[#4b5162]">
                {selectedTarget === 'all' ? 'All 4 Selected' : 'Target: 1 Robot'}
              </span>
            </div>

            {/* All-team selector button */}
            <button
              type="button"
              onClick={() => handleSelectTarget('all')}
              className={`w-full p-3 rounded-xl border text-left transition-[background-color,border-color,box-shadow] duration-150 cursor-pointer flex items-center justify-between focus-visible:ring-2 focus-visible:ring-purple-400 ${
                selectedTarget === 'all'
                  ? 'bg-[#232630] text-white border-[#232630] shadow-sm'
                  : 'bg-white text-[#232630] border-[#e8dfe5] hover:bg-[#f9f5f8]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-[#7c3aed] text-white text-[11px] font-mono-tabular font-bold flex items-center justify-center">
                  4
                </span>
                <div>
                  <div className="text-xs font-bold">All 4 AI Employees</div>
                  <div
                    className={`text-[10px] ${
                      selectedTarget === 'all' ? 'text-slate-300' : 'text-[#7c8294]'
                    }`}
                  >
                    AURA · NOVA · PIXEL · ORBIT
                  </div>
                </div>
              </div>
              {selectedTarget === 'all' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/20 text-white font-mono-tabular">
                  SELECTED
                </span>
              )}
            </button>

            {/* Individual robot cards */}
            <div className="grid grid-cols-2 gap-2">
              {FOUR_ROBOT_CONFIGS.map((cfg) => {
                const isSelected = selectedTarget === cfg.id;
                const isCamFocused = focusedRobotId === cfg.id;
                const st = robotStates[cfg.id];
                return (
                  <div
                    key={cfg.id}
                    className={`p-2.5 rounded-xl border text-left transition-[background-color,border-color,box-shadow] duration-150 flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#232630] text-white border-[#232630] shadow-sm'
                        : 'bg-white text-[#232630] border-[#e8dfe5] hover:bg-[#f9f5f8]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectTarget(cfg.id)}
                      className="w-full text-left cursor-pointer focus-visible:ring-1 focus-visible:ring-purple-400 rounded-lg p-0.5"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className="font-mono-tabular text-[10px] font-bold w-4 h-4 rounded flex items-center justify-center text-white shrink-0"
                          style={{ backgroundColor: cfg.theme.badgeColorHex }}
                        >
                          {cfg.code}
                        </span>
                        <span className="text-xs font-bold truncate flex-1 ml-1.5">
                          {cfg.name}
                        </span>
                        <span className="opacity-80 shrink-0">{getRoleIcon(cfg.role)}</span>
                      </div>
                      <div className="mt-1.5">
                        <div
                          className={`text-[10px] font-semibold truncate ${
                            isSelected ? 'text-pink-200' : 'text-[#4e5466]'
                          }`}
                        >
                          {cfg.title}
                        </div>
                        <div
                          className={`text-[10px] font-mono-tabular capitalize truncate mt-0.5 ${
                            isSelected ? 'text-pink-300' : 'text-[#8b91a2]'
                          }`}
                        >
                          {st?.action} · {st?.expression}
                        </div>
                      </div>
                    </button>
                    <div className="mt-2 pt-1.5 border-t border-black/5 dark:border-white/10 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFocusRobot(cfg.id);
                        }}
                        aria-label={`Focus camera on ${cfg.name}`}
                        className={`text-[10px] font-bold inline-flex items-center gap-1 px-2 py-0.5 rounded cursor-pointer transition-colors focus-visible:ring-1 focus-visible:ring-purple-400 ${
                          isCamFocused
                            ? 'bg-[#f08cae] text-white'
                            : isSelected
                            ? 'bg-white/15 text-pink-200 hover:bg-white/25'
                            : 'bg-[#f4eff2] text-[#c94a78] hover:bg-[#ede3e8]'
                        }`}
                      >
                        <Focus className="w-3 h-3" aria-hidden="true" />
                        <span>{isCamFocused ? 'Focused' : 'Zoom'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: Expressions & Behavior Actions */}
          <div className="bg-[#faf7f9] border border-[#eee4ea] rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between border-b border-[#ece2e8] pb-2.5">
              <div>
                <div className="text-xs font-bold text-[#232630]">
                  {activeScopeConfig
                    ? `${activeScopeConfig.name} (${activeScopeConfig.title})`
                    : 'All 4 AI Employees'}
                </div>
                <div className="text-[10px] text-[#71788c] mt-0.5">
                  {activeScopeConfig
                    ? activeScopeConfig.stationLabel
                    : 'Broadcast mode: applies to all 4 robots'}
                </div>
              </div>
              <span className="text-[10px] font-mono-tabular font-bold px-2 py-0.5 rounded bg-violet-100 text-violet-700 capitalize">
                {activeScopeState?.action}
              </span>
            </div>

            {/* Facial Expressions */}
            <div>
              <div className="text-[11px] font-bold text-[#454b5c] mb-1.5 flex items-center justify-between">
                <span>Facial Expression</span>
                <span className="font-mono-tabular text-[10px] text-pink-600 capitalize">
                  {activeScopeState?.expression || 'happy'}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {EXPRESSION_OPTIONS.map((expr) => {
                  const isActive = activeScopeState?.expression === expr.id;
                  return (
                    <button
                      key={expr.id}
                      type="button"
                      onClick={() => handleApplyExpression(expr.id)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap focus-visible:ring-1 focus-visible:ring-purple-400 ${
                        isActive
                          ? 'bg-[#f08cae] text-white shadow-xs'
                          : 'bg-white text-[#232630] border border-[#e6dde2] hover:bg-[#f6f1f4]'
                      }`}
                    >
                      {expr.label}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={handleTriggerBlink}
                  className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-white text-[#232630] border border-[#e6dde2] hover:bg-[#f6f1f4] transition-colors cursor-pointer whitespace-nowrap focus-visible:ring-1 focus-visible:ring-purple-400"
                >
                  Blink
                </button>
              </div>
            </div>

            {/* Behavior & Task Modes */}
            <div>
              <div className="text-[11px] font-bold text-[#454b5c] mb-1.5 flex items-center justify-between">
                <span>Behavior & Task Mode</span>
                <span className="font-mono-tabular text-[10px] text-violet-600 capitalize">
                  {activeScopeState?.action || 'work'}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {ACTION_OPTIONS.map((act) => {
                  const isActive = activeScopeState?.action === act.id;
                  return (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => handleApplyAction(act.id)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap focus-visible:ring-1 focus-visible:ring-purple-400 ${
                        isActive
                          ? 'bg-[#8b5cf6] text-white shadow-xs'
                          : 'bg-white text-[#232630] border border-[#e6dde2] hover:bg-[#f6f1f4]'
                      }`}
                    >
                      {act.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-3 border-t border-[#ece3e8] dark:border-white/10 text-center">
          <p className="text-[11px] text-[#9399a9]">
            Press <kbd className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono-tabular font-bold">Esc</kbd> or click outside to close
          </p>
        </div>
      </aside>
    </div>
  );
}
