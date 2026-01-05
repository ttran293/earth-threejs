import * as THREE from 'three';
import './style.css';
import gsap from 'gsap';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';



//Scene
const scene = new THREE.Scene();

//Create our sphere
const geometry = new THREE.SphereGeometry(15, 64, 64);

//Loading Manager
const loadingManager = new THREE.LoadingManager();
const textureLoader = new THREE.TextureLoader(loadingManager);

// Show loading indicator
loadingManager.onStart = () => {
  console.log("Loading started");
};

loadingManager.onLoad = () => {
  const loadingScreen = document.getElementById("loading-screen");
  if (loadingScreen) {
    loadingScreen.style.display = "none";
  }
  tl.play();
};

loadingManager.onProgress = (url, loaded, total) => {
  console.log(`Loading: ${loaded}/${total}`);
};


const earthTexture = textureLoader.load("./8k_earth_daymap.jpg");

const material = new THREE.MeshStandardMaterial({
  map: earthTexture,
  roughness: 0.5,
  metalness: 0.3,
});
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

//Stars
const starsGeometry = new THREE.BufferGeometry();
const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.25, sizeAttenuation: true });
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

//Clouds
const cloudsTexture = textureLoader.load("/Earth-clouds.png");
const cloudsMaterial = new THREE.MeshStandardMaterial({
  map: cloudsTexture,
  transparent: true,
  opacity: 0.3,
  depthWrite: false,
});
const cloudsGeometry = new THREE.SphereGeometry(15.05, 64, 64);
const cloudsMesh = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
scene.add(cloudsMesh);


//Sizes
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
};

//Lights
const directionalLight = new THREE.DirectionalLight(0xffffff, 4);
directionalLight.position.set(5, 3, 5);
scene.add(directionalLight);

const ambientLight = new THREE.AmbientLight(0x333333, 2);
scene.add(ambientLight);

//Camera
const camera = new THREE.PerspectiveCamera(75, sizes.width/sizes.height, 0.1, 300);
camera.position.z = 5
scene.add(camera);

//Renderer
const canvas = document.querySelector('.webgl');
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.render(scene, camera);

//OrbitControls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.enableZoom = false;
controls.enablePan = false;
controls.autoRotate = true;
controls.autoRotateSpeed = 2.0;
controls.dampingFactor = 0.05;

window.addEventListener('resize', () => {
  //Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  //Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  //Update renderer
  renderer.setSize(sizes.width, sizes.height);
});



//Loop
const loop = () => {
  controls.update();
  //Update objects
  mesh.rotation.y += 0.0001;
  cloudsMesh.rotation.y += 0.00012;
  //Render the scene
  renderer.render(scene, camera);
  //Request the next frame
  window.requestAnimationFrame(loop);
};
loop();

//Timeline
const tl = gsap.timeline({
  defaults: {
    duration: 1,
  },
  paused: true,
})


tl.fromTo(
  camera.position,
  { z: 100 },
  { z: 5, duration: 3, ease: "power1.in", onUpdate: () => {
    camera.lookAt(mesh.position);
  } }
);

tl.fromTo('.title', { opacity: 0 }, { opacity: 1 });

window.addEventListener("beforeunload", () => {
  geometry.dispose();
  material.dispose();
  earthTexture.dispose();
  cloudsTexture.dispose();
  cloudsMaterial.dispose();
  starsGeometry.dispose();
  starsMaterial.dispose();
  renderer.dispose();
});