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
        position: { x: 0.04, y: 1.04, z: 9.1 },
        target: { x: 0.02, y: 0.04, z: 0.08 },
      },
      stage2: {
        position: { x: 0.0, y: 1.35, z: 1.55 },
        target: { x: 0.0, y: 1.18, z: 0.0 },
      },
    };
  }

  return {
    stage1: {
      position: { x: 0.02, y: 1.08, z: 7.9 },
      target: { x: 0, y: 0.03, z: 0.06 },
    },
    stage2: {
      position: { x: 0.0, y: 1.35, z: 1.15 },
      target: { x: 0.0, y: 1.18, z: 0.0 },
    },
  };
};

const initRobot = (): InitRobotResult => {
  const canvas = document.querySelector(
    "canvas.robot-3D",
  ) as HTMLCanvasElement | null;

  if (!canvas) {
    throw new Error("Missing .robot-3D canvas element");
  }

  const scene = new THREE.Scene();

  const size = {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: Math.min(window.devicePixelRatio, 2),
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

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
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
      scene.add(robotModel);
    },
  );

  loader.load("/male_09_official.glb", (gltf) => {
    humanModel = gltf.scene;
    placeModel(humanModel, 4.1);
    humanModel.position.add(modelRig.humanBase);
    humanModel.rotation.y = 1.12;
    scene.add(humanModel);
  });

  let needsRender = true;
  const hero = document.querySelector(".hero_main") as HTMLElement | null;

  // --- TWEAK: Scroll & transition pacing ---
  // Higher = more viewport heights to scroll through (the pinned section's scroll range).
  const SCROLL_DISTANCE_PERCENT = 555;
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
    .fromTo(
      ".hero_main .stage_waitlist",
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

  // Section-step wheel handler: one scroll gesture = one section transition
  const handleWheel = (e: WheelEvent) => {
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
    // TWEAK: duration = total transition time (seconds). "power2.out" = fast start, gentle landing.
    gsap.to(window, {
      scrollTo: { y: target, autoKill: false },
      duration: 2.0,
      ease: "power2.out",
      overwrite: "auto",
      onComplete: () => {
        isScrolling = false;
      },
    });
  };

  window.addEventListener("wheel", handleWheel, { passive: false });

  const tick = (time: number) => {
    if (robotModel) {
      robotModel.position.y =
        modelRig.robotBase.y + Math.sin(time * 1.3) * 0.025;
      robotModel.rotation.y = -6.12 + Math.sin(time * 0.46) * 0.22;
      needsRender = true;
    }

    if (humanModel) {
      humanModel.position.y =
        modelRig.humanBase.y + Math.sin(time * 1.05 + 0.7) * 0.012;
      humanModel.rotation.y = 6.12 + Math.sin(time * 0.44) * -0.22;
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

  let resizeRaf = 0;
  const handleResize = () => {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
      size.width = window.innerWidth;
      size.height = window.innerHeight;
      size.pixelRatio = Math.min(window.devicePixelRatio, 2);

      camera.aspect = size.width / size.height;
      camera.updateProjectionMatrix();

      renderer.setSize(size.width, size.height);
      renderer.setPixelRatio(size.pixelRatio);
      needsRender = true;
    });
  };

  window.addEventListener("resize", handleResize);

  const destroy = () => {
    cancelAnimationFrame(resizeRaf);
    window.removeEventListener("wheel", handleWheel);
    gsap.ticker.remove(tick);
    window.removeEventListener("resize", handleResize);
    timeline.kill();
    timeline.scrollTrigger?.kill();
    if (hero) {
      hero.dataset.stage = "1";
    }
  };

  return { scene, renderer, destroy };
};

export default initRobot;
