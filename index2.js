

var container, controller, camera, scene, group, renderer, stats;
var linesMesh;
var colors;
var particles, pointCloud;
var pointsPosistions;
var pointsData = [];
var effectController = {
    showDots: true,
    showLines: true,
    minDistance: 100,
    limitConnections: false,
    maxConnections: 20,
    particleCount: 500
};

var r = 800;
var rHalf = r / 2;
var particleCount = 500;
var maxParticleCount = 15000;
var utils = new DataUtils();



async function init() {
    stats = new Stats();

    initGUI();
    container = document.getElementById('container');
    container.appendChild(stats.dom);
    initCamera();
    initController(camera, container);
    initScene();
    initGroup(); 
    initRenderer();


    var helper = new THREE.BoxHelper(new THREE.Mesh(new THREE.BoxBufferGeometry(r, r, r)));
    helper.material.color.setHex(0x080808);
    helper.material.blending = THREE.AdditiveBlending;
    helper.material.transparent = true;
    group.add(helper);

    var pointsAndLine = await initPoint();

    console.log(pointsAndLine);

    //helper remove later
    var axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);




    window.addEventListener('resize', onWindowResize, false);
}

function initRenderer() {
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.gammaInput = true;
    renderer.gammaOutput = true;
    container.appendChild(renderer.domElement);
}

function initController(camera, container) {
    controller = new THREE.OrbitControls(camera, container)
}

function initCamera() {
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 4000);
    camera.position.z = 1750;
}

function initScene() {
    scene = new THREE.Scene();
}

function initGroup() {
    group = new THREE.Group();
    scene.add(group);
}

function initGUI() {
    var gui = new dat.GUI();
    gui.add(effectController, "showDots").onChange(function (value) {
        pointCloud.visible = value;
    });
    gui.add(effectController, "showLines").onChange(function (value) {
        linesMesh.visible = value;
    });
    gui.add(effectController, "minDistance", 1000, 4000);
    gui.add(effectController, "limitConnections");
    gui.add(effectController, "maxConnections", 0, 30, 1);
    gui.add(effectController, "particleCount", 0, maxParticleCount, 1).onChange(function (value) {
        particleCount = parseInt(value);
        particles.setDrawRange(0, particleCount);
    });
}

async function initPoint() {
    var data = await initData();

   data = data.filter(function(value){
       return value.dimensionDetails;
   })

    pointsPosistions = new Float32Array(data.length * 3);

    for (var i = 0; i < data.length; i++) {


        var coordinates = utils.parseDataParticlesPosition(data[i]);

        pointsPosistions[i * 3] = coordinates.x
        pointsPosistions[i * 3 + 1] = coordinates.y;
        pointsPosistions[i * 3 + 2] = coordinates.z;



        pointsData.push({
            velocity: new THREE.Vector3(- 1 + Math.random() * 2, - 1 + Math.random() * 2, - 1 + Math.random() * 2),
            numConnections: 0
        })

    }

    for (var j = 0; j < pointsPosistions.length / 3; j++) {

        var x = pointsPosistions[j * 3];
        var y = pointsPosistions[j * 3 + 1];
        var z = pointsPosistions[j * 3 + 2];

        
        var sine = utils.sine(x, y, z);
        var rational = utils.rationalize(sine.x, sine.y, sine.z, r)

        pointsPosistions[j * 3] = rational.x
        pointsPosistions[j * 3 + 1] = rational.y;
        pointsPosistions[j * 3 + 2] = rational.z;

    }

    particles = new THREE.BufferGeometry();
    particles.setDrawRange(0, particleCount);
    particles.addAttribute('position', new THREE.BufferAttribute(pointsPosistions, 3).setDynamic(true));
    var pMaterial = new THREE.PointsMaterial({
        color: 0xFFFFFF,
        size: 3,
        blending: THREE.AdditiveBlending,
        transparent: true,
        sizeAttenuation: false
    });
    // create the particle system
    pointCloud = new THREE.Points(particles, pMaterial);
    group.add(pointCloud);

    positions = new Float32Array(pointsPosistions.length);
    colors = new Float32Array(pointsPosistions.length);

    var geometry = new THREE.BufferGeometry();
    geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3).setDynamic(true));
    geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3).setDynamic(true));
    geometry.computeBoundingSphere();
    geometry.setDrawRange(0, 0);
    var material = new THREE.LineBasicMaterial({
        vertexColors: THREE.VertexColors,
        blending: THREE.AdditiveBlending,
        transparent: true
    });
    linesMesh = new THREE.LineSegments(geometry, material);
    group.add(linesMesh);


    return {
        points: pointsPosistions,
        line: linesMesh
    }
}



function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

async function initData() {
    return pageObject(0, 15000)
        .then(payload => payload.data.objects);
}

//logic
var update = function () {
    // console.log("updating")
    // console.log(pointsPosistions)
    var vertexpos = 0;
    var colorpos = 0;
    var numConnected = 0;
    for (var i = 0; i < pointsData.length; i++)
        pointsData[i].numConnections = 0;
    for (var i = 0; i < pointsData.length; i++) {
        var pointData = pointsData[i];

        // get the particle
        pointsPosistions[i * 3] += pointData.velocity.x;
        pointsPosistions[i * 3 + 1] += pointData.velocity.y;
        pointsPosistions[i * 3 + 2] += pointData.velocity.z;
        if (pointsPosistions[i * 3 + 1] < - rHalf || pointsPosistions[i * 3 + 1] > rHalf)
            pointData.velocity.y = - pointData.velocity.y;
        if (pointsPosistions[i * 3] < - rHalf || pointsPosistions[i * 3] > rHalf)
            pointData.velocity.x = - pointData.velocity.x;
        if (pointsPosistions[i * 3 + 2] < - rHalf || pointsPosistions[i * 3 + 2] > rHalf)
            pointData.velocity.z = - pointData.velocity.z;
        if (effectController.limitConnections && pointData.numConnections >= effectController.maxConnections)
            continue;
        // Check collision
        for (var j = i + 1; j < pointsData.length; j++) {
            var pointDataB = pointsData[j];
            if (effectController.limitConnections && pointDataB.numConnections >= effectController.maxConnections)
                continue;
            var dx = pointsPosistions[i * 3] - pointsPosistions[j * 3];
            var dy = pointsPosistions[i * 3 + 1] - pointsPosistions[j * 3 + 1];
            var dz = pointsPosistions[i * 3 + 2] - pointsPosistions[j * 3 + 2];
            var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (dist < effectController.minDistance) {
                pointData.numConnections++;
                pointDataB.numConnections++;
                var alpha = 1.0 - dist / effectController.minDistance;
                positions[vertexpos++] = pointsPosistions[i * 3];
                positions[vertexpos++] = pointsPosistions[i * 3 + 1];
                positions[vertexpos++] = pointsPosistions[i * 3 + 2];
                positions[vertexpos++] = pointsPosistions[j * 3];
                positions[vertexpos++] = pointsPosistions[j * 3 + 1];
                positions[vertexpos++] = pointsPosistions[j * 3 + 2];
                colors[colorpos++] = alpha;
                colors[colorpos++] = alpha;
                colors[colorpos++] = alpha;
                colors[colorpos++] = alpha;
                colors[colorpos++] = alpha;
                colors[colorpos++] = alpha;
                numConnected++;
            }
        }
    }
    if (linesMesh) {
        linesMesh.geometry.setDrawRange(0, numConnected * 2);
        linesMesh.geometry.attributes.position.needsUpdate = true;
        linesMesh.geometry.attributes.color.needsUpdate = true;
        pointCloud.geometry.attributes.position.needsUpdate = true;
    }


}

var render = function () {
    stats.update();
    // var time = Date.now() * 0.001;
    // group.rotation.y = time * 0.1;
    renderer.render(scene, camera);
}

var loop = function () {
    requestAnimationFrame(loop);

    update();
    render();
}

//initialize and start
init();
loop();

