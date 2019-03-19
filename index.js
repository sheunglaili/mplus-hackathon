var group;
var data;
var container, stats;
var particlesData = [];
var camera, scene, renderer, raycaster;
var mouse = new THREE.Vector2(), INTERSECTED_POINT;
var positions, colors;
var particles, particlesSize, particleColors;
var pointCloud;
var particlePositions;
var linesMesh;
var prev = "";

var maxParticleCount = 1000;
var particleCount = 1000;
var r = 800;
var rHalf = r / 2;
var color;
var controls;

var colorState;

var colorsLineMap = {
    Photography: {
        r: 74,
        g: 214,
        b: 208
    },
    Textile: {
        r: 59,
        g: 170,
        b: 168
    },
    "Architectural Drawing": {
        r: 0,
        g: 0,
        b: 0
    },
    "Poster": {
        r: 0,
        g: 0,
        b: 0
    },
    "Painting": {
        r: 0,
        g: 0,
        b: 0
    },
    "Architectural Photography": {
        r: 0,
        g: 0,
        b: 0
    },
    "Book/Periodical": {
        r: 0,
        g: 0,
        b: 0
    },
    "Design Drawing": {
        r: 0,
        g: 0,
        b: 0
    },
    "Drawing": {
        r: 0,
        g: 0,
        b: 0
    },
    "Product Design": {
        r: 0,
        g: 0,
        b: 0
    },
    "Sculpture": {
        r: 0,
        g: 0,
        b: 0
    },
    "Print": {
        r: 0,
        g: 0,
        b: 0
    },
    "Design Object": {
        r: 0,
        g: 0,
        b: 0
    },
    "Architectural Model": {
        r: 0,
        g: 0,
        b: 0
    },
    "Archival Documentation": {
        r: 0,
        g: 0,
        b: 0
    }, "Video": {
        r: 0,
        g: 0,
        b: 0
    }, "Work on Paper": {
        r: 0,
        g: 0,
        b: 0
    }, "Installation": {
        r: 0,
        g: 0,
        b: 0
    }, "Ephemera": {
        r: 0,
        g: 0,
        b: 0
    }, "Costume": {
        r: 0,
        g: 0,
        b: 0
    }, "Ink Art": {
        r: 0,
        g: 0,
        b: 0
    }, "Performance": {
        r: 0,
        g: 0,
        b: 0
    },
    "Video Installation": {
        r: 0,
        g: 0,
        b: 0
    }, "Digital": {
        r: 0,
        g: 0,
        b: 0
    }, "Collage": {
        r: 0,
        g: 0,
        b: 0
    }, "Craft Object": {
        r: 0,
        g: 0,
        b: 0
    }, "Film": {
        r: 0,
        g: 0,
        b: 0
    }, "Animation": {
        r: 0,
        g: 0,
        b: 0
    }, "Sound": {
        r: 0,
        g: 0,
        b: 0
    }, "Lighting": {
        r: 0,
        g: 0,
        b: 0
    }, "Maquette": {
        r: 0,
        g: 0,
        b: 0
    }, "Signage": {
        r: 0,
        g: 0,
        b: 0
    }, "Architectural Fragment": {
        r: 0,
        g: 0,
        b: 0
    }, "Interior": {
        r: 0,
        g: 0,
        b: 0
    }, "Multiple": {
        r: 0,
        g: 0,
        b: 0
    }, "Furniture": {
        r: 0,
        g: 0,
        b: 0
    }
};



var effectController = {
    showDots: true,
    showLines: true,
    minDistance: 300,
    limitConnections: false,
    maxConnections: 20,
    particleCount: 1000,
    selected: null
};

var utils = new DataUtils();


initData()
    .then(payload => {
        data = payload;
        init();
        animate();
    })


function initGUI(categories) {

    var gui = new dat.GUI();

    gui.add(effectController, "showDots").onChange(function (value) {

        pointCloud.visible = value;

    });
    gui.add(effectController, "showLines").onChange(function (value) {

        linesMesh.visible = value;

    });
    gui.add(effectController, "minDistance", 10, 300);
    gui.add(effectController, "limitConnections");
    gui.add(effectController, "maxConnections", 0, 30, 1);
    gui.add(effectController, "particleCount", 0, maxParticleCount, 1).onChange(function (value) {

        particleCount = parseInt(value);
        particles.setDrawRange(0, particleCount);

    });

    categories = categories.map(x => x.title);
    categories.push("none")

    gui.add(effectController, "selected", categories)


}

function init() {


    getCatergories().then(
        res => initGUI(res.data.categories)
    )


    container = document.getElementById('container');

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 15000);
    camera.position.z = 1750;
    camera.enableZoom = true;

    controls = new THREE.OrbitControls(camera, container);

    scene = new THREE.Scene();

    raycaster = new THREE.Raycaster();
    raycaster.params.Points.threshold = 5;

    group = new THREE.Group();
    scene.add(group);

    var helper = new THREE.BoxHelper(new THREE.Mesh(new THREE.BoxBufferGeometry(r, r, r)));
    helper.material.color.setHex(0x080808);
    helper.material.blending = THREE.AdditiveBlending;
    helper.material.transparent = true;
    group.add(helper);

    var segments = maxParticleCount * maxParticleCount;

    positions = new Float32Array(segments * 3);
    colors = new Float32Array(segments * 3);

    var pMaterial = new THREE.PointsMaterial({
        vertexColors: THREE.VertexColors,
        size: 5,
        blending: THREE.AdditiveBlending,
        transparent: true,
        sizeAttenuation: false
    });

    // var pMaterial = new THREE.ShaderMaterial( {
    //     uniforms: {
    //         amplitude: { value: 1.0 },
    //         color: { value: new THREE.Color( 0xffffff ) },
    //         texture: THREE.SphericalReflectionMapping
    //     },
    //     vertexShader: document.getElementById( 'vertexshader' ).textContent,
    //     fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
    //     blending: THREE.AdditiveBlending,
    //     depthTest: false,
    //     transparent: true
    // } );


    particles = new THREE.BufferGeometry();
    particlePositions = new Float32Array(maxParticleCount * 3);
    particlesSize = new Float32Array(maxParticleCount)

    colorState = new Float32Array(maxParticleCount * 3);
    particleColors = new Float32Array(maxParticleCount * 3);

    color = new THREE.Color();

    for (var i = 0; i < maxParticleCount; i++) {

        // var x = Math.random() * r - r / 2;
        // var y = Math.random() * r - r / 2;
        // var z = Math.random() * r - r / 2;
        var element = data[i];

        console.log(element);

        var coordinates = utils.parseDataParticlesPosition(data[i]);

        particlePositions[i * 3] = coordinates.x;
        particlePositions[i * 3 + 1] = coordinates.y;
        particlePositions[i * 3 + 2] = coordinates.z;

        // add it to the geometry
        particlesData.push({
            velocity: new THREE.Vector3(- 1 + Math.random() * 1, - 1 + Math.random() * 1, - 1 + Math.random() * 1),
            numConnections: 0,
            data: element
        });

        if (element.constituents && element.constituents[0].gender == "Male") {
            color.set(0x2F82F8)
            console.log("man")
            color.toArray(particleColors, i * 3);
            color.toArray(colorState, i * 3);

        } else if (element.constituents && element.constituents[0].gender == "Female") {
            color.set(0xD1345D)
            console.log("woman")
            color.toArray(particleColors, i * 3);
            color.toArray(colorState, i * 3);
        } else {
            color.setHex(0xFFFFFF)
            color.toArray(particleColors, i * 3);
            color.toArray(colorState, i * 3);
        }

        particlesSize[i] = 10;

    }

    console.log(particleColors);


    for (var j = 0; j < maxParticleCount; j++) {
        var x = particlePositions[j * 3];
        var y = particlePositions[j * 3 + 1];
        var z = particlePositions[j * 3 + 2];


        var sine = utils.sine(x, y, z);
        var rational = utils.rationalize(sine.x, sine.y, sine.z, r)

        particlePositions[j * 3] = rational.x
        particlePositions[j * 3 + 1] = rational.y;
        particlePositions[j * 3 + 2] = rational.z;


    }
    particles.setDrawRange(0, particleCount);
    particles.addAttribute('position', new THREE.BufferAttribute(particlePositions, 3).setDynamic(true));
    particles.addAttribute('color', new THREE.BufferAttribute(particleColors, 3).setDynamic(true));

    // create the particle system
    pointCloud = new THREE.Points(particles, pMaterial);
    group.add(pointCloud);

    var geometry = new THREE.BufferGeometry();

    geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3).setDynamic(true));
    geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3).setDynamic(true));

    geometry.computeBoundingSphere();

    geometry.setDrawRange(0, 0);

    var material = new THREE.LineBasicMaterial({
        vertexColors: THREE.VertexColors,
        linewidth: 1,
        color: 0xffffff
    });

    linesMesh = new THREE.LineSegments(geometry, material);
    group.add(linesMesh);

    //

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    renderer.gammaInput = true;
    renderer.gammaOutput = true;

    container.appendChild(renderer.domElement);

    //

    stats = new Stats();
    container.appendChild(stats.dom);

    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('mousemove', onDocumentMouseMove, false);

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

function animate() {

    var vertexpos = 0;
    var colorpos = 0;
    var numConnected = 0;

    for (var i = 0; i < particleCount; i++)
        particlesData[i].numConnections = 0;

    for (var i = 0; i < particleCount; i++) {

        // get the particle
        var particleData = particlesData[i];

        particlePositions[i * 3] += particleData.velocity.x;
        particlePositions[i * 3 + 1] += particleData.velocity.y;
        particlePositions[i * 3 + 2] += particleData.velocity.z;

        if (particlePositions[i * 3 + 1] < - rHalf || particlePositions[i * 3 + 1] > rHalf)
            particleData.velocity.y = - particleData.velocity.y;

        if (particlePositions[i * 3] < - rHalf || particlePositions[i * 3] > rHalf)
            particleData.velocity.x = - particleData.velocity.x;

        if (particlePositions[i * 3 + 2] < - rHalf || particlePositions[i * 3 + 2] > rHalf)
            particleData.velocity.z = - particleData.velocity.z;

        if (effectController.limitConnections && particleData.numConnections >= effectController.maxConnections)
            continue;

        // Check collision

        for (var j = i + 1; j < particleCount; j++) {

            var particleDataB = particlesData[j];
            if (effectController.limitConnections && particleDataB.numConnections >= effectController.maxConnections)
                continue;

            var dx = particlePositions[i * 3] - particlePositions[j * 3];
            var dy = particlePositions[i * 3 + 1] - particlePositions[j * 3 + 1];
            var dz = particlePositions[i * 3 + 2] - particlePositions[j * 3 + 2];
            var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (dist < effectController.minDistance) {

                if (effectController.selected && effectController.selected != "none") {
                    if (particleDataB.data.classification.category == effectController.selected) {

                        if (prev != effectController.selected) {
                            cleanUpColor();
                        }


                        particleData.numConnections++;
                        particleDataB.numConnections++;

                        var alpha = 1.0 - dist / effectController.minDistance;

                        positions[vertexpos++] = particlePositions[i * 3];
                        positions[vertexpos++] = particlePositions[i * 3 + 1];
                        positions[vertexpos++] = particlePositions[i * 3 + 2];

                        positions[vertexpos++] = particlePositions[j * 3];
                        positions[vertexpos++] = particlePositions[j * 3 + 1];
                        positions[vertexpos++] = particlePositions[j * 3 + 2];

                        colors[colorpos++] = alpha;
                        colors[colorpos++] = alpha;
                        colors[colorpos++] = alpha;

                        colors[colorpos++] = alpha;
                        colors[colorpos++] = alpha;
                        colors[colorpos++] = alpha;

                        color.setHex(0xFFD000);
                        particleColors[i * 3] = color.r;
                        particleColors[i * 3 + 1] = color.g;
                        particleColors[i * 3 + 2] = color.b;

                        // console.log(particleColors);


                        numConnected++;

                    }
                } else {
                    particleData.numConnections++;
                    particleDataB.numConnections++;

                    var alpha = 1.0 - dist / effectController.minDistance;

                    positions[vertexpos++] = particlePositions[i * 3];
                    positions[vertexpos++] = particlePositions[i * 3 + 1];
                    positions[vertexpos++] = particlePositions[i * 3 + 2];

                    positions[vertexpos++] = particlePositions[j * 3];
                    positions[vertexpos++] = particlePositions[j * 3 + 1];
                    positions[vertexpos++] = particlePositions[j * 3 + 2];

                    colors[colorpos++] = alpha;
                    colors[colorpos++] = alpha;
                    colors[colorpos++] = alpha;

                    colors[colorpos++] = alpha;
                    colors[colorpos++] = alpha;
                    colors[colorpos++] = alpha;

                    particleColors[i * 3] = colorState[i * 3];
                    particleColors[i * 3 + 1] = colorState[i * 3 + 1];
                    particleColors[i * 3 + 2] = colorState[i * 3 + 2];

                    numConnected++;
                }

            }

        }

    }

    prev = effectController.selected;


    linesMesh.geometry.setDrawRange(0, numConnected * 2);
    linesMesh.geometry.attributes.position.needsUpdate = true;
    linesMesh.geometry.attributes.color.needsUpdate = true;

    pointCloud.geometry.attributes.color.needsUpdate = true;
    pointCloud.geometry.attributes.position.needsUpdate = true;

    requestAnimationFrame(animate);

    stats.update();
    render();

}

function cleanUpColor() {
    for (var i = 0; i < particleCount; i++) {
        particleColors[i * 3] = colorState[i * 3];
        particleColors[i * 3 + 1] = colorState[i * 3 + 1];
        particleColors[i * 3 + 2] = colorState[i * 3 + 2];
    }
}

function render() {

    raycaster.setFromCamera(mouse, camera);

    var intersects = raycaster.intersectObjects(scene.children, true);

    intersection = (intersects.length) > 0 ? intersects[0] : null;



    if (intersection) {
        console.log(intersection)
        // if (INTERSECTED != intersects[0].object) {
        //     if (INTERSECTED && INTERSECTED.material) INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);
        //     INTERSECTED = intersects[0].object;
        //     INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
        //     INTERSECTED.material.emissive.setHex(0xff0000);

        //     console.log(INTERSECTED)
        // }
        if (intersection.object.type == "Points") {
            INTERSECTED_POINT = intersection.point
            console.log(particlesData[intersection.index]);
            //  camera.lookAt(intersection.object.position)
        }
    } else {
        // if (INTERSECTED) INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);
        // INTERSECTED = null;
        // console.log(INTERSECTED)
    }

    if (INTERSECTED_POINT) {
        controls.target = INTERSECTED_POINT;
        controls.update();

    }

    var time = Date.now() * 0.001;

    group.rotation.y = time * 0.1;
    renderer.render(scene, camera);

}

function onDocumentMouseMove(event) {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
}



function initData() {
    return pageObject(0, maxParticleCount)
        .then(payload => payload.data.objects);
}
