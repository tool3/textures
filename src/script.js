import './style.css';
import * as THREE from 'three';
import * as dat from 'lil-gui';
import gsap from 'gsap';
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { FlakesTexture } from './FlakesTexture';
/**
 * Debug
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
};
const gui = new dat.GUI();

const parameters = {
  materialColor: '#ffeded'
};

gui.addColor(parameters, 'materialColor').onChange((val) => {
  particlesMaterial.color.set(val);
});

/**
 * Base
 */
// Canvasbe
const canvas = document.querySelector('canvas.webgl');

const renderer = new THREE.WebGLRenderer({
  alpha: true,
  canvas: canvas
});
let envmaploader = new THREE.PMREMGenerator(renderer);
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;

// Scene
const scene = new THREE.Scene();

const textureLoader = new THREE.TextureLoader();
const gradientMap = textureLoader.load('textures/gradients/5.jpg');
const normal = textureLoader.load('textures/part.png');
gradientMap.magFilter = THREE.NearestFilter;

function makeSpehre(hdrmap, color, position, scale) {
  const envmap = envmaploader.fromCubemap(hdrmap);
  const texture = new THREE.CanvasTexture(new FlakesTexture());
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.x = 10;
  texture.repeat.y = 6;

  const ballMaterial = {
    clearcoat: 1.0,
    cleacoatRoughness: 0.1,
    metalness: 0.9,
    roughness: 0.5,
    color,
    normalMap: texture,
    normalScale: new THREE.Vector2(0.15, 0.15),
    envMap: envmap.texture
  };

  const ballGeo = new THREE.SphereGeometry(100, 64, 64);
  const ballMat = new THREE.MeshPhysicalMaterial(ballMaterial);
  const ballMesh = new THREE.Mesh(ballGeo, ballMat);
  ballMesh.position.set(position.x, position.y, position.z);
  ballMesh.scale.set(scale.x, scale.y, scale.z);
  ballMesh.material.shading = THREE.SmoothShading;
  return ballMesh;
}

new RGBELoader().setPath('textures/').load('cayley_interior_4k.hdr', function (hdrmap) {
  const envmap = envmaploader.fromCubemap(hdrmap);
  mesh1.material.envMap = envmap.texture;
  mesh1.material.needsUpdate = true;

  mesh3.material.envMap = envmap.texture;
  mesh3.material.needsUpdate = true;
});

const material = new THREE.MeshNormalMaterial();

function createTextureMaterial(TextureClass, repeat, normalScale, color) {
  const texture = new THREE.CanvasTexture(new TextureClass());
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  texture.repeat = repeat;

  const material = {
    clearcoat: 1.0,
    cleacoatRoughness: 0.1,
    metalness: 0.9,
    roughness: 0.5,
    normalMap: texture,
    color,
    normalScale
  };

  return new THREE.MeshPhysicalMaterial(material);
}

const objectDistance = 4;
const ballMat = createTextureMaterial(FlakesTexture, { x: 10, y: 10 }, new THREE.Vector2(0.15, 0.15), 0xff00ff);
const mesh1 = new THREE.Mesh(new THREE.SphereBufferGeometry(1, 16, 100, 16), ballMat);
mesh1.shading = THREE.SmoothShading;

const cubeMateriale = createTextureMaterial(FlakesTexture, { x: 30, y: 4 }, new THREE.Vector2(0.5, 0.5), 0xff0000);
const mesh3 = new THREE.Mesh(new THREE.TorusKnotGeometry(0.6, 0.25, 100, 64), cubeMateriale);
mesh3.shading = THREE.SmoothShading;

const sides = 4;
const height = 10;
const capHeight = 5;
const radius = 4;

// The middle part of the crystal, with open-ended top and bottom faces
const middle = new THREE.CylinderBufferGeometry(radius, radius, height, sides, 1);

// Create an open-ended cone
const coneTop = new THREE.ConeBufferGeometry(radius, capHeight, sides, 1);

// Clone it so we have two different geometries (one for each end)
const coneBottom = coneTop.clone();

// Move the top cap up to the correct place
coneTop.translate(0, height / 2 + capHeight / 2, 0);

// First flip the bottom cap, then move it down
coneBottom.rotateZ(Math.PI);
coneBottom.translate(0, -height / 2 - capHeight / 2, 0);

// Now construct our final geometry
const geometry = mergeBufferGeometries([coneTop, middle, coneBottom]);

// Notice I am using flat shading in the material, to give it a faceted look.
// Most ThreeJS geometries will appear smooth by default.
const material2 = new THREE.MeshNormalMaterial({ flatShading: true });
const mesh2 = new THREE.Mesh(geometry, material2);
mesh2.scale.set(0.1, 0.1, 0.1);

// scale the mesh
// mesh2.scale.set(2, 2, 2);

const sectionMeshes = [mesh1, mesh2, mesh3];

mesh1.position.y = -objectDistance * 0;
mesh1.position.x = 2;

mesh2.position.y = -objectDistance * 1;
mesh2.position.x = -2;

mesh3.position.y = -objectDistance * 2;
mesh3.position.x = 2;

scene.add(mesh1, mesh2, mesh3);

const particlesCount = 5000;
const positions = new Float32Array(particlesCount * 3);

for (let i = 0; i < particlesCount; i++) {
  positions[i * 3] = (Math.random() - 0.5) * 10;
  positions[i * 3 + 1] = objectDistance * 0.5 - Math.random() * objectDistance * sectionMeshes.length;
  positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
}

const particlesGeometry = new THREE.BufferGeometry();
particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

const particlesMaterial = new THREE.PointsMaterial({
  transparent: true,
  color: parameters.materialColor,
  sizeAttenuation: true,
  size: 0.03,
  map: normal
});

const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

const directionalLight = new THREE.DirectionalLight('#ffffff', 1);
directionalLight.position.set(1, 1, 0);
scene.add(directionalLight);

window.addEventListener('resize', () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

const cameraGroup = new THREE.Group();
scene.add(cameraGroup);
/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100);
camera.position.z = 6;
cameraGroup.add(camera);

/**
 * Renderer
 */

/**
 * Animate
 */
const clock = new THREE.Clock();

// scroll

let scrollY = window.scrollY;
let currentSection = 0;

window.addEventListener('scroll', () => {
  scrollY = window.scrollY;
  const newSection = Math.round(scrollY / sizes.height);
  if (newSection !== currentSection) {
    currentSection = newSection;
    const titles = [...document.querySelectorAll('h1')];
    const effects = [{ y: 100 }, { rotateX: -180 }, { rotateY: 180 }];
    gsap.from(`.${titles[currentSection].className}`, {
      duration: 1,
      stagger: 0.2,
      scale: 3,
      autoAlpha: 2,
      ...effects[currentSection]
    });

    gsap.to(sectionMeshes[currentSection].rotation, {
      duration: 1.5,
      ease: 'power2.inOut',
      //   x: '+=3',
      y: '+=3'
      //   z: '+=1.5'
    });
  }
});

const cursor = { x: 0, y: 0 };

window.addEventListener('mousemove', (e) => {
  cursor.x = e.clientX / sizes.width - 0.5;
  cursor.y = e.clientY / sizes.height - 0.5;
});

let previousTime = 0;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - previousTime;
  previousTime = elapsedTime;

  camera.position.y = (-scrollY / sizes.height) * objectDistance;

  const parallaxX = cursor.x * 0.5;
  const parallaxY = -cursor.y * 0.5;

  cameraGroup.position.x += (parallaxX - cameraGroup.position.x) * 5 * deltaTime;
  cameraGroup.position.y += (parallaxY - cameraGroup.position.y) * 5 * deltaTime;

  for (const mesh of sectionMeshes) {
    // mesh.rotation.x += deltaTime * 0.1;
    mesh.rotation.y += deltaTime * 0.12;
  }

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
