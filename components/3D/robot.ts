import gsap from "gsap";
import ScrollTrigger from "gsap/dist/ScrollTrigger";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const initRobot = (): {
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
} => {
  const canvas = document.querySelector(
    "canvas.robot-3D",
  ) as HTMLCanvasElement;

  // Scene
  const scene = new THREE.Scene();

  // Sizes
  const size = {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: window.devicePixelRatio,
  };

  // Camera — wide FOV so robot head + text all fit on initial view
  const camera = new THREE.PerspectiveCamera(
    35,
    size.width / size.height,
    0.1,
    1000,
  );
  // Start further back & slightly above center so the robot head sits
  // in the lower half of the viewport, leaving the upper area for text + CTA
  camera.position.set(0, 1.4, 5.5);
  camera.lookAt(0, 0.6, 0);
  scene.add(camera);

  // Renderer
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(size.width, size.height);
  renderer.setPixelRatio(size.pixelRatio);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);

  const mainLight = new THREE.DirectionalLight(0xffffff, 2.0);
  mainLight.position.set(4, 6, 5);
  scene.add(mainLight);

  const fillLight = new THREE.DirectionalLight(0xb4d4ff, 0.7);
  fillLight.position.set(-4, 3, -3);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xffffff, 1.0);
  rimLight.position.set(0, 4, -5);
  scene.add(rimLight);

  // Bottom fill — keeps legs / lower body from being too dark
  const bottomFill = new THREE.DirectionalLight(0xffffff, 0.3);
  bottomFill.position.set(0, -3, 2);
  scene.add(bottomFill);

  // Load GLB models
  const loader = new GLTFLoader();
  let robotModel: THREE.Group | null = null;
  let humanModel: THREE.Group | null = null;

  const baseYOffset = -0.95; // shared vertical nudge so heads stay below text + CTA

  // Helper: center & scale a loaded model, place feet at y = 0
  function placeModel(
    m: THREE.Group,
    desiredHeight: number,
  ) {
    const box = new THREE.Box3().setFromObject(m);
    const boxSize = box.getSize(new THREE.Vector3());
    const scaleFactor = desiredHeight / boxSize.y;
    m.scale.setScalar(scaleFactor);

    // Recompute after scaling
    box.setFromObject(m);
    const center = box.getCenter(new THREE.Vector3());
    m.position.x -= center.x;
    m.position.z -= center.z;
    m.position.y -= box.min.y; // feet at y = 0
  }

  // Robot (behind)
  loader.load(
    "/Meshy_AI_Cyber_Sentinel_Superi_0215162113_texture.glb",
    (gltf) => {
      robotModel = gltf.scene;
      placeModel(robotModel, 2.5);

      // Push robot back so it stands behind the human
      robotModel.position.z -= 0.5;
      robotModel.position.y += baseYOffset;
      robotModel.position.x -= 0.5;

      scene.add(robotModel);
    },
  );

  // Human (in front, facing camera)
  loader.load(
    "/male_09_official.glb",
    (gltf) => {
      humanModel = gltf.scene;
      placeModel(humanModel, 1.8); // realistic human height relative to robot

      // Position in front of the robot, closer to camera
      humanModel.position.z += 0.9;
      humanModel.position.y += baseYOffset;
      humanModel.position.x += 0.3;

      scene.add(humanModel);
    },
  );

  // GSAP scroll animations
  gsap.registerPlugin(ScrollTrigger);

  gsap
    .timeline({
      scrollTrigger: {
        trigger: ".hero_main",
        start: () => "top top",
        scrub: 3,
        anticipatePin: 1,
        pin: true,
      },
    })
    .to(
      ".hero_main .content",
      {
        filter: "blur(40px)",
        autoAlpha: 0,
        scale: 0.5,
        duration: 2,
        ease: "power1.inOut",
      },
      "setting",
    )
    .to(
      camera.position,
      {
        y: 1.0,
        z: window.innerWidth > 768 ? 3.2 : 4.2,
        x: 0,
        duration: 2,
        ease: "power1.inOut",
      },
      "setting",
    );

  // Idle animation — gentle bob + subtle rotation
  gsap.ticker.add((time) => {
    if (robotModel) {
      // Gentle floating bob
      robotModel.position.y =
        baseYOffset + Math.sin(time * 1.5) * 0.04;

      // Slow subtle Y rotation
      robotModel.rotation.y = Math.sin(time * 0.5) * 0.15;
    }

    if (humanModel) {
      // Very subtle breathing sway
      humanModel.position.y =
        baseYOffset + Math.sin(time * 1.2 + 0.5) * 0.015;
    }

    renderer.render(scene, camera);
  });

  gsap.ticker.lagSmoothing(0);

  // Resize
  window.addEventListener("resize", () => {
    size.width = window.innerWidth;
    size.height = window.innerHeight;
    size.pixelRatio = window.devicePixelRatio;

    camera.aspect = size.width / size.height;
    camera.updateProjectionMatrix();

    renderer.setSize(size.width, size.height);
    renderer.setPixelRatio(size.pixelRatio);
  });

  return { scene, renderer };
};

export default initRobot;
