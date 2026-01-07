import * as THREE from "three";
import "./style.css";
import gsap from "gsap";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// Scene
const scene = new THREE.Scene();

// Loading Manager
const loadingManager = new THREE.LoadingManager();
const textureLoader = new THREE.TextureLoader(loadingManager);

// Sizes
let sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  300
);
camera.position.set(0, 0, 45);
scene.add(camera);

// Renderer
const canvas = document.querySelector(".webgl");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

// Lights
const directionalLight = new THREE.DirectionalLight(0xffffff, 15);
directionalLight.position.set(5, 3, 5);
scene.add(directionalLight);

const ambientLight = new THREE.AmbientLight(0x333333, 10);
scene.add(ambientLight);

// Earth
const geometry = new THREE.SphereGeometry(15, 64, 64);
const earthTexture = textureLoader.load("./8k_earth_daymap.jpg");
earthTexture.colorSpace = THREE.SRGBColorSpace;

const material = new THREE.MeshStandardMaterial({
  map: earthTexture,
  roughness: 0.5,
  metalness: 0.3,
});

const mesh = new THREE.Mesh(geometry, material);
mesh.rotation.z = THREE.MathUtils.degToRad(23.4);
scene.add(mesh);

// Stars
const starsGeometry = new THREE.BufferGeometry();
const starsMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.25,
  sizeAttenuation: true,
  transparent: true,
  opacity: 0.85, // enables fading later if you want
});

const starsVertices = [];
for (let i = 0; i < 5000; i++) {
  const x = (Math.random() - 0.5) * 500;
  const y = (Math.random() - 0.5) * 500;
  const z = (Math.random() - 0.5) * 500;
  starsVertices.push(x, y, z);
}
starsGeometry.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(starsVertices, 3)
);
const stars = new THREE.Points(starsGeometry, starsMaterial);
scene.add(stars);

// Clouds
const cloudsTexture = textureLoader.load("./Earth-clouds.png");
cloudsTexture.colorSpace = THREE.SRGBColorSpace;

const cloudsMaterial = new THREE.MeshStandardMaterial({
  map: cloudsTexture,
  transparent: true,
  opacity: 0.3,
  depthWrite: false,
});
const cloudsGeometry = new THREE.SphereGeometry(15.05, 64, 64);
const cloudsMesh = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
cloudsMesh.rotation.z = mesh.rotation.z;
scene.add(cloudsMesh);

// Atmosphere (simple glow shell)
const atmosphereGeometry = new THREE.SphereGeometry(15.2, 64, 64);
const atmosphereMaterial = new THREE.MeshBasicMaterial({
  color: 0x66ccff,
  transparent: true,
  opacity: 0.12,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});
const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
atmosphereMesh.rotation.z = mesh.rotation.z;
scene.add(atmosphereMesh);

// OrbitControls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.enableZoom = false;
controls.enablePan = false;
controls.autoRotate = true;
controls.autoRotateSpeed = 2.0;
controls.dampingFactor = 0.05;
controls.target.set(0, 0, 0);

// Pointer parallax
const pointer = { x: 0, y: 0 };
canvas.style.pointerEvents = "auto";

canvas.addEventListener("pointermove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1; // [-1,1]
  const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1); // [-1,1]
  pointer.x = THREE.MathUtils.clamp(nx, -1, 1);
  pointer.y = THREE.MathUtils.clamp(ny, -1, 1);
});
canvas.addEventListener("pointerleave", () => {
  pointer.x = 0;
  pointer.y = 0;
});


// Cinematic intro timeline
const tl = gsap.timeline({
  defaults: { duration: 1 },
  paused: true,
});

tl.fromTo(
  camera.position,
  { z: 100 },
  {
    z: 45,
    duration: 3,
    ease: "power1.inOut",
    onUpdate: () => camera.lookAt(mesh.position),
  }
);

tl.fromTo(".title", { opacity: 0 }, { opacity: 1, duration: 1 });

// Loading indicator hooks
loadingManager.onStart = () => {
  console.log("Loading started");
};

loadingManager.onLoad = () => {
  const loadingScreen = document.getElementById("loading-screen");
  if (loadingScreen) loadingScreen.style.display = "none";
  tl.play();
};

// Resize
window.addEventListener("resize", () => {
  sizes = { width: window.innerWidth, height: window.innerHeight };

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Loop
const loop = () => {
  controls.update();

  // Base rotation
  mesh.rotation.y += 0.0001;
  cloudsMesh.rotation.y += 0.00012;

  const px = THREE.MathUtils.clamp(pointer.x, -1, 1);
  const py = THREE.MathUtils.clamp(pointer.y, -1, 1);

  // Earth responds a bit
  mesh.rotation.y += px * 0.00035;
  mesh.rotation.x += py * 0.0002;

  // Clouds lag slightly more for depth
  cloudsMesh.rotation.y += px * 0.00055;
  cloudsMesh.rotation.x += py * 0.0003;

  // Atmosphere follows Earth
  atmosphereMesh.rotation.copy(mesh.rotation);

  renderer.render(scene, camera);
  window.requestAnimationFrame(loop);
};
loop();

// Cleanup
window.addEventListener("beforeunload", () => {
  geometry.dispose();
  material.dispose();
  earthTexture.dispose();

  cloudsGeometry.dispose();
  cloudsMaterial.dispose();
  cloudsTexture.dispose();

  starsGeometry.dispose();
  starsMaterial.dispose();

  atmosphereGeometry.dispose();
  atmosphereMaterial.dispose();

  renderer.dispose();
});
