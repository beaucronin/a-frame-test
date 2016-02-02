var nodes = {};
var SPEED = 5;
var graph = new Graph(),
	// layout = new Layout.ForceDirected(graph, { layout: '3d', attraction: .5, repulsion: 0.01, width: 1000, height: 1000 });
	layout = new Layout.ForceDirected(graph, { layout: '3d', attraction: .05, repulsion: 0.001, width: 1000, height: 1000 });

var spriteMaterial = new THREE.SpriteMaterial( 
{ 
	map: (new THREE.TextureLoader()).load('glow.png'),
	color: 0x00ff0f, transparent: false, blending: THREE.AdditiveBlending
});

var container, stats;
var camera, scene, renderer, particles, geometry, material, i, h, color, sprite, size;
var mouseX = 0, mouseY = 0;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

function initLayout() {
	layout.init();
}

function createNode(name) {
	var geo = new THREE.SphereGeometry(.15, 32,32),
		mat = new THREE.MeshPhongMaterial({ color: "#2233dd"}),
		mesh = new THREE.Mesh(geo, mat);
	mesh.position.set(Math.random() - .5, Math.random() - .5, Math.random() - 1.5);
	scene.add(mesh);
	nodes[name] = mesh;
	var node = new Node(mesh.id);
	node.position = mesh.position;
	node.data = mesh;
	console.log('created node '+name);
	if (graph.addNode(node))
		initLayout();	
}

function processEvent(e) {
	if ('type' in e) {
		// informational message
		// console.log(e);
	} else {
		if (! (e.src in nodes))
			createNode(e.src);
		if (! (e.tgt in nodes))
			createNode(e.tgt);

		var sprite = new THREE.Sprite( spriteMaterial.clone() );
		sprite.scale.set(0.25, 0.25, 0.25);

		var p1 = nodes[e.src].position,
			p2 = nodes[e.tgt].position,
			geo = new THREE.SphereGeometry(.001, 4, 4),
			mat = new THREE.MeshLambertMaterial({ color: 0x2222ff }),
			mesh = new THREE.Mesh(geo, mat);

		mesh.add(sprite);
		scene.add(mesh);
		if (graph.addEdge(graph.getNode(nodes[e.src].id), graph.getNode(nodes[e.tgt].id)))
			initLayout();

		var tween = new TWEEN.Tween({ x: p1.x, y: p1.y, z: p1.z })
			.to({ x: p2.x, y: p2.y, z: p2.z }, 1000)
			.onStart(function() {
				mesh.position.set(p1.x, p1.y, p2.z);
			})
			.onUpdate(function() {
				mesh.position.x = this.x;
				mesh.position.y = this.y;
				mesh.position.z = this.z;
			})
			.onComplete(function() {
				scene.remove(mesh);
			})
			.easing(TWEEN.Easing.Quadratic.InOut)
			.start();
	}
}

window.onload = function() {
	var socket = new WebSocket('ws://127.0.0.1:8080/');
	socket.onmessage = function(event) {
		processEvent(JSON.parse(event.data));
		var data = JSON.parse(event.data);
		console.log(data);
	}
	socket.onopen = function() {
		socket.send(JSON.stringify({
			command: "play",
			start: "2016-01-01T00:00:00.000Z",
			end: "2016-01-01T00:00:30.000Z",
			// start: "2001-03-01T12:00:00.000Z",
			// end: "2001-03-02T00:00:00.000Z",
			loop: true,
			speed: SPEED
		}));
	}

	var gui = new DAT.GUI({
    	height : 5 * 32 - 1
	});
	// gui.add(layout, 'attraction_multiplier').min(0.0).max(1.0).step(.025).name('attraction');
	// gui.add(layout, 'repulsion_multiplier').min(.0001).max(.005).step(.0001).name('repulsion');
}

init();
animate();

function init() {

	container = document.createElement( 'div' );
	document.body.appendChild( container );

	camera = new THREE.PerspectiveCamera( 55, window.innerWidth / window.innerHeight, 2, 2000 );
	camera.position.z = 5;
	camera.lookAt(0, 0, 0);

	scene = new THREE.Scene();
	// scene.fog = new THREE.FogExp2( 0x000000, 0.001 );

	var light = new THREE.AmbientLight( 0x404040 );
	scene.add(light);

	renderer = new THREE.WebGLRenderer();
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	container.appendChild( renderer.domElement );
	window.addEventListener( 'resize', onWindowResize, false );

	var controls = new THREE.OrbitControls(camera, renderer.domElement);
}

function onWindowResize() {

	windowHalfX = window.innerWidth / 2;
	windowHalfY = window.innerHeight / 2;

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate(time) {
	requestAnimationFrame( animate );
	renderer.render( scene, camera );
	layout.generate();
	TWEEN.update(time);

}

