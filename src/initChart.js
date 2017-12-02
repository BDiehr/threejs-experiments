import { scaleLinear, scaleLog } from 'd3-scale';
import data from './data';
const THREE = require('three');
const OrbitControls = require('three-orbit-controls')(THREE);
const RATIO = window.innerHeight / window.innerWidth;
const WIDTH = 100;
const HEIGHT = RATIO * 100;


/**
 * Axis Type
 *
 * An axis type defines the orientation of the axis-line,
 * as well as defining how the ticks are positioned relative
 * to the axis.
 *
 * Note: Axis Type is a direct parrell to `d3-axis` axis types.
 */
const axisType = {
  top: 'top',
  right: 'right',
  bottom: 'bottom',
  left: 'left',
};

const rotateAxis = (x, y, z, theta) => vec =>
  vec.applyAxisAngle(
    new THREE.Vector3(x, y, z),
    theta,
  );

const axisVector = {
  [axisType.top]: rotateAxis(1, 0, 0, Math.PI / 2),
  [axisType.bottom]: x => x, // do nothing, bottom is the default position.
  [axisType.right]: rotateAxis(0, 0, 1, -1 * Math.PI * 3 / 2),
  [axisType.left]: rotateAxis(0, 0, 1, Math.PI / 2),
};
/**
 * Create Axis
 *
 * @param tickCount - Number of 'ticks' to position on the scale
 * @param tickHeight - Height of a tick
 * @param scale - Scale to define the positioning of the ticks
 * @param type - Type of axis - bottom, left, right, top (d3-axis types)
 * @returns {Geometry} - Three.js Geometry
 */
const createAxisGeometry = ({ type, tickCount, tickHeight, scale }) => {
  const geometry = new THREE.Geometry();
  const ticks = scale.ticks(tickCount);
  geometry.vertices = ticks
    .map(value => [
      new THREE.Vector3(value, 0, 1),
      new THREE.Vector3(value, tickHeight, 1),
      new THREE.Vector3(value, 0, 1),
    ])
    .reduce((all, some) => [...all, ...some], [])
    .map(vec => axisVector[type](vec));
  return geometry;
};

export default function initChart() {
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(0 - 2, WIDTH - 2, HEIGHT - 2, 0 - 2, 1, 100 );
  const controls = new OrbitControls(camera);
  controls.enableRotate = false;
  controls.autoRotate = false;
  controls.mouseButtons = {
    ORBIT: THREE.MOUSE.RIGHT,
    ZOOM: THREE.MOUSE.MIDDLE,
    PAN: THREE.MOUSE.LEFT
  };
  controls.dampingFactor = 0.8;
  controls.enableDamping = true;
  camera.position.set(0, 0, 10);
  camera.lookAt(new THREE.Vector3(0, 0, 0));
  controls.update();

  /**
   * Define Materials
   */
  const materialX = new THREE.LineBasicMaterial({ color: 'white' });
  const materialY = new THREE.LineBasicMaterial({ color: 'white' });

  /**
   * Define Scales
   */
  const yScale = scaleLog()
    .base(2)
    .domain([1, HEIGHT])
    .range([1, 300]);
  const xScale = scaleLinear()
    .domain([0, 100])
    .range([0, WIDTH]);

  /**
   * Define Geometries
   */
  const xAxisGeometry = createAxisGeometry({
    tickCount: 100,
    tickHeight: 1,
    scale: xScale,
    type: axisType.bottom,
  });
  const yAxisGeometry = createAxisGeometry({
    tickCount: 100,
    tickHeight: 1,
    scale: yScale,
    type: axisType.left,
  }).translate(0, 1, 0);

  const xLine = new THREE.Line(xAxisGeometry, materialX);
  const yLine = new THREE.Line(yAxisGeometry, materialY);

  scene.add(yLine);
  scene.add(xLine);

  /** Add Data */
  var material = new THREE.MeshBasicMaterial( { color: 'white' } );
  var geometry = new THREE.CircleGeometry(0.5, 100);
  data
    .map(([x, y]) => geometry.clone().translate(xScale(x), yScale.invert(y), 0))
    .map(geo => new THREE.Mesh(geo, material))
    .forEach(mesh => scene.add(mesh));

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth / 2, window.innerHeight / 2);
  document.body.appendChild( renderer.domElement );

  function animate() {

    requestAnimationFrame( animate );
    // required if controls.enableDamping or controls.autoRotate are set to true
    controls.update();
    renderer.render( scene, camera );
  }


  animate();
}
