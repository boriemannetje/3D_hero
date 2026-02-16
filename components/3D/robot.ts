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
  stage3: {
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
        position: { x: 0.1, y: 1.16, z: 2.2 },
        target: { x: 0.08, y: 1.02, z: 0.24 },
      },
      stage3: {
        position: { x: 0.68, y: 1.4, z: 0.92 },
        target: { x: 1.38, y: 1.7, z: -2.4 },
      },
    };
  }

  return {
    stage1: {
      position: { x: 0.02, y: 1.08, z: 7.9 },
      target: { x: 0, y: 0.03, z: 0.06 },
    },
    stage2: {
      position: { x: 0.16, y: 1.15, z: 1.62 },
      target: { x: 0.05, y: 1.02, z: 0.34 },
    },
    stage3: {
      position: { x: 0.84, y: 1.52, z: 0.56 },
      target: { x: 1.48, y: 1.8, z: -2.8 },
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
    robotBase: new THREE.Vector3(-0.42, -0.98, -0.62),
    humanBase: new THREE.Vector3(0.4, -1.34, 0.84),
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
      placeModel(robotModel, 2.55);
      robotModel.position.add(modelRig.robotBase);
      robotModel.rotation.y = -0.16;
      scene.add(robotModel);
    },
  );

  loader.load("/male_09_official.glb", (gltf) => {
    humanModel = gltf.scene;
    placeModel(humanModel, 1.9);
    humanModel.position.add(modelRig.humanBase);
    humanModel.rotation.y = 0.12;
    scene.add(humanModel);
  });

  let needsRender = true;
  const hero = document.querySelector(".hero_main") as HTMLElement | null;

  const timeline = gsap.timeline({
    scrollTrigger: {
      id: "hero-scroll",
      trigger: ".hero_main",
      start: "top top",
      end: "+=340%",
      scrub: 1,
      pin: true,
      anticipatePin: 1,
      snap: {
        snapTo: "labelsDirectional",
        duration: { min: 0.4, max: 0.9 },
        delay: 0.02,
        ease: "power2.inOut",
        inertia: false,
      },
      onUpdate: ({ progress }) => {
        needsRender = true;
        if (!hero) return;
        if (progress < 0.25) {
          hero.dataset.stage = "1";
        } else if (progress < 0.75) {
          hero.dataset.stage = "2";
        } else {
          hero.dataset.stage = "3";
        }
      },
    },
  });

  timeline
    .addLabel("stage1", 0)
    .to(
      ".hero_main .stage_intro .content",
      {
        autoAlpha: 0,
        scale: 0.74,
        yPercent: -10,
        duration: 1.0,
        ease: "power2.inOut",
      },
      0.03,
    )
    .to(
      cameraRig,
      {
        ...cameraFrame.stage2.position,
        duration: 1.5,
        ease: "power2.inOut",
      },
      0,
    )
    .to(
      cameraTargetRig,
      {
        ...cameraFrame.stage2.target,
        duration: 1.5,
        ease: "power2.inOut",
      },
      0,
    )
    .fromTo(
      ".hero_main .stage_access",
      { autoAlpha: 0, yPercent: 12 },
      {
        autoAlpha: 1,
        yPercent: 0,
        duration: 1.0,
        ease: "power2.out",
      },
      0.5,
    )
    .addLabel("stage2", 1.5)
    .to(
      ".hero_main .stage_access",
      {
        autoAlpha: 0,
        yPercent: -11,
        duration: 0.85,
        ease: "power2.inOut",
      },
      1.75,
    )
    .to(
      cameraRig,
      {
        ...cameraFrame.stage3.position,
        duration: 1.5,
        ease: "power2.inOut",
      },
      1.5,
    )
    .to(
      cameraTargetRig,
      {
        ...cameraFrame.stage3.target,
        duration: 1.5,
        ease: "power2.inOut",
      },
      1.5,
    )
    .fromTo(
      ".hero_main .stage_pricing",
      { autoAlpha: 0, yPercent: 10 },
      {
        autoAlpha: 1,
        yPercent: 0,
        duration: 0.9,
        ease: "power2.out",
      },
      2.1,
    )
    .addLabel("stage3", 3.0);

  if (hero) {
    hero.dataset.stage = "1";
  }

  const tick = (time: number) => {
    if (robotModel) {
      robotModel.position.y =
        modelRig.robotBase.y + Math.sin(time * 1.3) * 0.025;
      robotModel.rotation.y = -0.16 + Math.sin(time * 0.46) * 0.08;
      needsRender = true;
    }

    if (humanModel) {
      humanModel.position.y =
        modelRig.humanBase.y + Math.sin(time * 1.05 + 0.7) * 0.012;
      humanModel.rotation.y = 0.12 + Math.sin(time * 0.34) * 0.02;
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
