import gsap from "gsap";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

type InitRobotResult = {
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  destroy: () => void;
};

type CameraFrame = {
  stage1: {
    position: { x: number; y: number; z: number };
    target: { x: number; y: number; z: number };
  };
  stage2: {
    position: { x: number; y: number; z: number };
    target: { x: number; y: number; z: number };
  };
};

const getCameraFrame = (isMobile: boolean): CameraFrame => {
  if (isMobile) {
    return {
      stage1: {
        // Position camera higher and look upward to push models lower on screen
        position: { x: 0.04, y: 1.8, z: 9.1 },
        target: { x: 0.02, y: 0.8, z: 0.08 },
      },
      stage2: {
        position: { x: 0.0, y: 1.35, z: 1.55 },
        target: { x: 0.0, y: 1.18, z: 0.0 },
      },
    };
  }

  return {
    stage1: {
      // Position camera higher and look upward to push models lower on screen
      position: { x: 0.02, y: 1.9, z: 7.9 },
      target: { x: 0, y: 0.9, z: 0.06 },
    },
    stage2: {
      position: { x: 0.0, y: 1.35, z: 1.15 },
      target: { x: 0.0, y: 1.18, z: 0.0 },
    },
  };
};

const isLowPowerDevice = () => {
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const lowCpu = (navigator.hardwareConcurrency ?? 8) <= 4;
  const lowMemory = (navigator as Navigator & { deviceMemory?: number })
    .deviceMemory;

  return coarsePointer || lowCpu || (typeof lowMemory === "number" && lowMemory <= 4);
};

const disposeMaterial = (material: THREE.Material) => {
  for (const value of Object.values(material)) {
    if (value instanceof THREE.Texture) {
      value.dispose();
    }
  }
  material.dispose();
};

const disposeObject3D = (object: THREE.Object3D | null) => {
  if (!object) return;

  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;

    child.geometry.dispose();

    if (Array.isArray(child.material)) {
      child.material.forEach(disposeMaterial);
      return;
    }

    disposeMaterial(child.material);
  });
};

const animateModelIntro = (
  model: THREE.Group,
  options: {
    delay: number;
    yLift: number;
    baseY: number;
    lowPowerDevice: boolean;
    markDirty: () => void;
  },
) => {
  const { delay, yLift, baseY, lowPowerDevice, markDirty } = options;
  const materialTargets = new Map<
    THREE.Material,
    { opacity: number; transparent: boolean }
  >();

  model.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;

    const materials = Array.isArray(child.material)
      ? child.material
      : [child.material];

    for (const material of materials) {
      if (materialTargets.has(material)) continue;
      materialTargets.set(material, {
        opacity: material.opacity,
        transparent: material.transparent,
      });
      material.transparent = true;
      material.opacity = 0;
      material.needsUpdate = true;
    }
  });

  const fromScale = lowPowerDevice ? 0.985 : 0.96;
  model.scale.multiplyScalar(fromScale);
  model.position.y = baseY - yLift;

  gsap.to(model.position, {
    y: baseY,
    duration: lowPowerDevice ? 0.62 : 0.84,
    delay,
    ease: "power2.out",
    onUpdate: markDirty,
  });

  gsap.to(model.scale, {
    x: model.scale.x / fromScale,
    y: model.scale.y / fromScale,
    z: model.scale.z / fromScale,
    duration: lowPowerDevice ? 0.62 : 0.84,
    delay,
    ease: "power2.out",
    onUpdate: markDirty,
  });

  for (const [material, targetState] of materialTargets) {
    gsap.to(material, {
      opacity: targetState.opacity,
      duration: lowPowerDevice ? 0.54 : 0.76,
      delay: delay + 0.04,
      ease: "power1.out",
      onUpdate: markDirty,
      onComplete: () => {
        material.transparent = targetState.transparent;
        material.needsUpdate = true;
      },
    });
  }
};

const initRobot = (): InitRobotResult => {
  const canvas = document.querySelector(
    "canvas.robot-3D",
  ) as HTMLCanvasElement | null;

  if (!canvas) {
    throw new Error("Missing .robot-3D canvas element");
  }

  const scene = new THREE.Scene();
  const lowPowerDevice = isLowPowerDevice();
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  const size = {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: Math.min(window.devicePixelRatio, lowPowerDevice ? 1.25 : 2),
  };

  const cameraFrame = getCameraFrame(window.innerWidth < 768);
  const cameraRig = { ...cameraFrame.stage1.position };
  const cameraTargetRig = { ...cameraFrame.stage1.target };

  const camera = new THREE.PerspectiveCamera(
    34,
    size.width / size.height,
    0.1,
    1000,
  );
  camera.position.set(cameraRig.x, cameraRig.y, cameraRig.z);
  camera.lookAt(cameraTargetRig.x, cameraTargetRig.y, cameraTargetRig.z);
  scene.add(camera);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !lowPowerDevice,
    powerPreference: "high-performance",
  });
  renderer.setSize(size.width, size.height);
  renderer.setPixelRatio(size.pixelRatio);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.28;

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
  scene.add(ambientLight);

  const mainLight = new THREE.DirectionalLight(0xffffff, 2.1);
  mainLight.position.set(4, 6, 4.5);
  scene.add(mainLight);

  const fillLight = new THREE.DirectionalLight(0xbad9ff, 0.65);
  fillLight.position.set(-4, 3, -3);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xffffff, 0.95);
  rimLight.position.set(0, 4, -5);
  scene.add(rimLight);

  const bottomFill = new THREE.DirectionalLight(0xffffff, 0.34);
  bottomFill.position.set(0, -3, 2);
  scene.add(bottomFill);

  const loader = new GLTFLoader();
  let robotModel: THREE.Group | null = null;
  let humanModel: THREE.Group | null = null;

  const modelRig = {
    robotBase: new THREE.Vector3(-1, -1.0, -1.5),
    humanBase: new THREE.Vector3(0.7, -2.9, -1),
  };

  function placeModel(model: THREE.Group, desiredHeight: number) {
    const box = new THREE.Box3().setFromObject(model);
    const boxSize = box.getSize(new THREE.Vector3());
    const scaleFactor = desiredHeight / boxSize.y;
    model.scale.setScalar(scaleFactor);

    box.setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.x -= center.x;
    model.position.z -= center.z;
    model.position.y -= box.min.y;
  }

  loader.load(
    "/Meshy_AI_Cyber_Sentinel_Superi_0215162113_texture.glb",
    (gltf) => {
      robotModel = gltf.scene;
      placeModel(robotModel, 4.5);
      robotModel.position.add(modelRig.robotBase);
      robotModel.rotation.y = 1.16;

      // Make robot materials shiny/metallic
      robotModel.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];
        for (const material of materials) {
          if (material instanceof THREE.MeshStandardMaterial) {
            material.metalness = 0.44;
            material.roughness = 0.05;
            material.needsUpdate = true;
          }
        }
      });

      scene.add(robotModel);

      animateModelIntro(robotModel, {
        delay: 0.08,
        yLift: lowPowerDevice ? 0.04 : 0.08,
        baseY: modelRig.robotBase.y,
        lowPowerDevice,
        markDirty: () => {
          needsRender = true;
        },
      });
    },
  );

  loader.load("/male_09_official.glb", (gltf) => {
    humanModel = gltf.scene;
    placeModel(humanModel, 4.1);
    humanModel.position.add(modelRig.humanBase);
    humanModel.rotation.y = 1.12;
    scene.add(humanModel);

    animateModelIntro(humanModel, {
      delay: 0.2,
      yLift: lowPowerDevice ? 0.03 : 0.07,
      baseY: modelRig.humanBase.y,
      lowPowerDevice,
      markDirty: () => {
        needsRender = true;
      },
    });
  });

  let needsRender = true;
  let pageVisible = document.visibilityState !== "hidden";
  const hero = document.querySelector(".hero_main") as HTMLElement | null;

  // --- TWEAK: Scroll & transition pacing ---
  // Higher = more viewport heights to scroll through (the pinned section's scroll range).
  // Reduced on mobile for fewer swipe gestures needed
  const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
  const SCROLL_DISTANCE_PERCENT = isTouchDevice ? 280 : 555;
  // Duration of each segment in timeline units. Higher = slower camera/content transition as you scroll.
  const SEGMENT_DURATION = 2.5;
  // Ease for scroll-driven transitions. "power2.out" = gentler; "power2.inOut" = more punch.
  const TIMELINE_EASE = "power2.out" as const;

  const LABELS = ["stage1", "stage2"] as const;
  let currentLabelIndex = 0;
  let isScrolling = false;

  const timeline = gsap.timeline({
    scrollTrigger: {
      id: "hero-scroll",
      trigger: ".hero_main",
      start: "top top",
      end: `+=${SCROLL_DISTANCE_PERCENT}%`,
      scrub: 0.1,
      pin: true,
      anticipatePin: 1,
      snap: {
        snapTo: "labels",
        duration: { min: 0.15, max: 0.35 },
        delay: 0,
        ease: "power2.out",
      },
      onUpdate: ({ progress }) => {
        needsRender = true;
        if (!hero) return;
        if (progress < 0.5) {
          hero.dataset.stage = "1";
          currentLabelIndex = 0;
        } else {
          hero.dataset.stage = "2";
          currentLabelIndex = 1;
        }
      },
    },
  });

  const d = SEGMENT_DURATION;
  timeline
    .addLabel("stage1", 0)
    .to(
      ".hero_main .stage_intro .content",
      {
        autoAlpha: 0,
        scale: 0.74,
        yPercent: -10,
        duration: 1.2,
        ease: TIMELINE_EASE,
      },
      0.04,
    )
    .to(
      cameraRig,
      {
        ...cameraFrame.stage2.position,
        duration: d,
        ease: TIMELINE_EASE,
      },
      0,
    )
    .to(
      cameraTargetRig,
      {
        ...cameraFrame.stage2.target,
        duration: d,
        ease: TIMELINE_EASE,
      },
      0,
    )
    .set(".hero_main .stage_waitlist", { opacity: 1, visibility: "visible" }, 0.6)
    .fromTo(
      ".hero_main .stage_header",
      { autoAlpha: 0, yPercent: 12 },
      {
        autoAlpha: 1,
        yPercent: 0,
        duration: 1.2,
        ease: "power2.out",
      },
      0.6,
    )
    .fromTo(
      ".hero_main .glass_panel",
      { autoAlpha: 0, yPercent: 12 },
      {
        autoAlpha: 1,
        yPercent: 0,
        duration: 1.2,
        ease: "power2.out",
      },
      0.6,
    )
    .addLabel("stage2", d);

  if (hero) {
    hero.dataset.stage = "1";
  }

  // Wheel handler for desktop - snaps to sections
  // Note: Touch devices use ScrollTrigger's snap instead
  let wheelHandler: ((e: WheelEvent) => void) | null = null;
  
  if (!isTouchDevice) {
    wheelHandler = (e: WheelEvent) => {
      const trigger = timeline.scrollTrigger;
      if (!trigger) return;

      const scrollY = window.scrollY;
      if (scrollY < trigger.start - 50 || scrollY > trigger.end + 50) return;

      e.preventDefault();

      if (isScrolling) return;

      const direction = e.deltaY > 0 ? 1 : e.deltaY < 0 ? -1 : 0;
      if (direction === 0) return;

      const nextIndex = currentLabelIndex + direction;
      if (nextIndex < 0 || nextIndex >= LABELS.length) return;

      currentLabelIndex = nextIndex;
      isScrolling = true;

      const target = trigger.labelToScroll(LABELS[currentLabelIndex]);
      gsap.to(window, {
        scrollTo: { y: target, autoKill: false },
        duration: 1.2,
        ease: "power2.out",
        overwrite: "auto",
        onComplete: () => {
          isScrolling = false;
        },
      });
    };

    window.addEventListener("wheel", wheelHandler, { passive: false });
  }

  const tick = (time: number) => {
    if (!pageVisible) return;

    if (robotModel) {
      if (!prefersReducedMotion) {
        robotModel.position.y =
          modelRig.robotBase.y + Math.sin(time * 1.3) * 0.025;
        robotModel.rotation.y = -6.12 + Math.sin(time * 0.46) * 0.22;
      }
      needsRender = true;
    }

    if (humanModel) {
      if (!prefersReducedMotion) {
        humanModel.position.y =
          modelRig.humanBase.y + Math.sin(time * 1.05 + 0.7) * 0.012;
        humanModel.rotation.y = 6.12 + Math.sin(time * 0.44) * -0.22;
      }
      needsRender = true;
    }

    camera.position.set(cameraRig.x, cameraRig.y, cameraRig.z);
    camera.lookAt(cameraTargetRig.x, cameraTargetRig.y, cameraTargetRig.z);

    if (needsRender) {
      renderer.render(scene, camera);
      needsRender = false;
    }
  };

  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  const handleVisibilityChange = () => {
    pageVisible = document.visibilityState !== "hidden";
    if (pageVisible) {
      needsRender = true;
    }
  };

  let resizeRaf = 0;
  const handleResize = () => {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
      size.width = window.innerWidth;
      size.height = window.innerHeight;
      size.pixelRatio = Math.min(window.devicePixelRatio, lowPowerDevice ? 1.25 : 2);

      camera.aspect = size.width / size.height;
      camera.updateProjectionMatrix();

      renderer.setSize(size.width, size.height);
      renderer.setPixelRatio(size.pixelRatio);
      needsRender = true;
    });
  };

  window.addEventListener("resize", handleResize);
  document.addEventListener("visibilitychange", handleVisibilityChange);

  const destroy = () => {
    cancelAnimationFrame(resizeRaf);
    if (wheelHandler) {
      window.removeEventListener("wheel", wheelHandler);
    }
    gsap.ticker.remove(tick);
    window.removeEventListener("resize", handleResize);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    // `timeline.kill()` also disposes its ScrollTrigger; avoid double-kill
    // because pin teardown mutations can throw in some environments.
    timeline.kill();
    disposeObject3D(robotModel);
    disposeObject3D(humanModel);
    if (hero) {
      hero.dataset.stage = "1";
    }
  };

  return { scene, renderer, destroy };
};

export default initRobot;
