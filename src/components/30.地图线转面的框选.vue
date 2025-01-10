<template>
  <div id="map" ref="mapRef"></div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Point, LineString, Polygon } from "ol/geom";
import Draw from "ol/interaction/Draw";
import Feature from "ol/Feature";
import { Style, Stroke, Fill } from "ol/style";

const mapRef = ref(null);
let map;
let points = [];
let drawInteraction;
let vectorSource; // 确保矢量源是全局变量

onMounted(() => {
  // 创建矢量源和图层
  vectorSource = new VectorSource();
  const vectorLayer = new VectorLayer({
    source: vectorSource,
  });

  // 创建地图
  map = new Map({
    target: mapRef.value,
    layers: [
      new TileLayer({
        source: new OSM(),
      }),
      vectorLayer,
    ],
    view: new View({
      center: [0, 0],
      zoom: 2,
    }),
  });

  // 定义样式
  const style = new Style({
    stroke: new Stroke({
      color: "#ffcc33",
      width: 2,
    }),
    fill: new Fill({
      color: "rgba(255, 255, 255, 0.6)",
    }),
  });
  vectorLayer.setStyle(style);

  startDrawingPoints();
});

function startDrawingPoints() {
  if (drawInteraction) {
    map.removeInteraction(drawInteraction);
  }

  drawInteraction = new Draw({
    source: vectorSource,
    type: "Point", // 设置类型为点
    geometryName: "geometry",
  });

  drawInteraction.on("drawend", function (event) {
    points.push(event.feature.getGeometry().getCoordinates());

    if (points.length === 2) {
      handleTwoPoints();
    }
  });

  map.addInteraction(drawInteraction);
}

function handleTwoPoints() {
  map.removeInteraction(drawInteraction); // 停止绘制

  const line = new LineString(points);
  const lineWidth = prompt("请输入宽度:");
  if (lineWidth && !isNaN(lineWidth)) {
    createRectangleFromLine(line, parseFloat(lineWidth));
  }

  points = []; // 清空点集合，准备下一次绘制
}

function createRectangleFromLine(line, width) {
  const coordinates = line.getCoordinates();
  const start = coordinates[0];
  const end = coordinates[1];

  // 计算方向向量
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const length = Math.sqrt(dx * dx + dy * dy);

  // 正交向量
  const orthoDx = -dy / length;
  const orthoDy = dx / length;

  // 计算四个角点
  const halfWidth = width / 2;
  const corner1 = [
    start[0] + orthoDx * halfWidth,
    start[1] + orthoDy * halfWidth,
  ];
  const corner2 = [end[0] + orthoDx * halfWidth, end[1] + orthoDy * halfWidth];
  const corner3 = [end[0] - orthoDx * halfWidth, end[1] - orthoDy * halfWidth];
  const corner4 = [
    start[0] - orthoDx * halfWidth,
    start[1] - orthoDy * halfWidth,
  ];

  // 创建矩形面
  const polygon = new Polygon([[corner1, corner2, corner3, corner4, corner1]]);

  // 添加矩形到矢量源中
  vectorSource.clear(); // 清除之前的几何对象
  vectorSource.addFeature(new Feature({ geometry: polygon }));

  // 如果需要保留原始点，可以取消下面这行
  // vectorSource.addFeatures([new Feature({ geometry: new Point(start) }), new Feature({ geometry: new Point(end) })]);
}
</script>

<style scoped>
#map {
  width: 100%;
  height: 400px;
}
</style>
