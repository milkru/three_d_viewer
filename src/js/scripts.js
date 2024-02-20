// three_d_viewer

// TODO-MILKRU: Normalize bounding boxes to fixed size and position them above the grid accordingly

import * as THREE from 'three';
import * as dat from 'dat.gui';

import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {RGBELoader} from 'three/examples/jsm/loaders/RGBELoader.js';
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader.js';

const DEFAULT_HDRI_PATH = `./assets/hdri/MR_INT-004_BigWindowTree_Thea.hdr`;
const DEFAULT_OBJ_PATH = `./assets/bunny.obj`;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xC2C2BB);
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 3.0;

document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const aspectRatio = window.innerWidth / window.innerHeight;
const camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.01, 1000);

window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(0, 1.5, 3.5);
controls.update();

const loadingManager = new THREE.LoadingManager();

const progressBarContainer = document.querySelector('.progress-bar-container');
const progressBar = document.getElementById("progress-bar");

loadingManager.onStart = function(url, item, total) {
    progressBar.value = 0;
    progressBarContainer.style.display = 'flex';
};

loadingManager.onProgress = function(url, loaded, total) {
    progressBar.value = (loaded / total) * 100;
    console.log('proge');
};

loadingManager.onLoad = function() {
    progressBarContainer.style.display = 'none';
};

const hdriLoader = new RGBELoader(loadingManager);
hdriLoader.load(DEFAULT_HDRI_PATH, function(hdri) {
    hdri.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = hdri;
    scene.environment = hdri;
});

async function loadHdri() {
    try {
        const [fileHandle] = await window.showOpenFilePicker();
        const file = await fileHandle.getFile();
        const url = await URL.createObjectURL(file);

        await hdriLoader.load(url, function(hdri) {
            hdri.mapping = THREE.EquirectangularReflectionMapping;
            scene.environment = hdri;
            scene.background = hdri;
            URL.revokeObjectURL(url);
        }, undefined, function(errorMessage) {
            console.error(errorMessage);
            URL.revokeObjectURL(url);
        });
    }
    catch (error) {
        console.log(error);
    }
}

let objMaterial = new THREE.MeshStandardMaterial({
    color: 0x1E18FF,
    roughness: 0,
    metalness: 0.5,
    wireframe: false});

let loadedObj;
let loadedObjHelper;

const objLoader = new OBJLoader(loadingManager);
objLoader.load(DEFAULT_OBJ_PATH, function(obj) {
    obj.traverse( child => {
        if (child.material)
        {
            child.material = objMaterial;
        }
    } );

    scene.add(obj);
    loadedObj = obj;

    loadedObjHelper = new THREE.BoxHelper(loadedObj);
    scene.add(loadedObjHelper);
}, undefined, function(errorMessage) {
    console.error(errorMessage);
});

async function loadObj() {
    try {
        const [fileHandle] = await window.showOpenFilePicker();
        const file = await fileHandle.getFile();
        const url = await URL.createObjectURL(file);

        await objLoader.load(url, function(obj) {
            obj.traverse( child => {
                if (child.material)
                {
                    child.material = objMaterial;
                }
            });
        
            scene.remove(loadedObj);
            scene.add(obj);
            loadedObj = obj;

            scene.remove(loadedObjHelper);
            loadedObjHelper = new THREE.BoxHelper(loadedObj);
            scene.add(loadedObjHelper);

            URL.revokeObjectURL(url);
        }, undefined, function(errorMessage) {
            console.error(errorMessage);
            URL.revokeObjectURL(url);
        });
    }
    catch (error) {
        console.log(error);
    }
}

const gui = new dat.GUI();

var loadObjButton = { add:function() {
    loadObj();
}};

gui.add(loadObjButton, 'add').name('Load .obj File');

var loadHdriButton = { add:function() {
    loadHdri();
}};

gui.add(loadHdriButton, 'add').name('Load .hdri File');

const options = {
    color: '#1E18FF',
    emissive: '#000000',
    roughness: 0,
    metalness: 0.5,
    flat: false,
    wireframe: false,
    exposure: 3.0
}

gui.addColor(options, 'color').name('Color').onChange(function(e){
    objMaterial.color.set(e);
});

gui.addColor(options, 'emissive').name('Emissive').onChange(function(e){
    objMaterial.emissive.set(e);
});

gui.add(options, 'roughness', 0, 1).name('Roughness').onChange(function(e){
    objMaterial.roughness = e;
});

gui.add(options, 'metalness', 0, 1).name('Metalness').onChange(function(e){
    objMaterial.metalness = e;
});

gui.add(options, 'flat').name('Flat').onChange(function(e){
    objMaterial.flatShading = e;
});

gui.add(options, 'wireframe').name('Wireframe').onChange(function(e){
    objMaterial.wireframe = e;
});

gui.add(options, 'exposure', 0, 30).name('Exposure').onChange(function(e){
    renderer.toneMappingExposure = e;
});

const axesHelper = new THREE.AxesHelper(4);
axesHelper.position.set(0, 0.003, 0);
scene.add(axesHelper);

const gridHelper = new THREE.GridHelper(20, 20);
scene.add(gridHelper);

function renderLoop(time) {
    renderer.render(scene, camera);
}

renderer.setAnimationLoop(renderLoop);
