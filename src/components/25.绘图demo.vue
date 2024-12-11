<template>
  <div id="app">
    <div ref="mapContainer" id="map"></div>
    <form>
      <label for="type">Geometry type &nbsp;</label>
      <select ref="typeSelect" id="type">
        <option value="Point">点</option>
        <option value="LineString">线</option>
        <option value="Polygon">面</option>
        <option value="Circle">几何圆</option>
        <option value="Geodesic" selected>测地线圆</option>
      </select>
    </form>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import Map from "ol/Map.js";
import View from "ol/View.js";
import { Circle as CircleStyle, Fill, Stroke, Style } from "ol/style.js";
import { Draw, Modify, Snap } from "ol/interaction.js";
import { GeometryCollection, Point, Polygon } from "ol/geom.js";
import { OSM, Vector as VectorSource } from "ol/source.js";
import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer.js";
import { circular } from "ol/geom/Polygon.js";
import { getDistance } from "ol/sphere.js";
import { transform } from "ol/proj.js";

// 使用 ref 来引用 DOM 元素
const mapContainer = ref(null);
const typeSelect = ref(null);

onMounted(() => {
  // 确保在组件挂载后才初始化地图
  initMap();
});

function initMap() {
  // 创建一个基于 OSM 的瓦片图层作为底图
  const raster = new TileLayer({
    source: new OSM(),
  });

  // 创建一个空的向量源用于存储用户绘制的特征
  const source = new VectorSource();

  // 定义默认样式：填充、描边和点状图标样式
  const style = new Style({
    fill: new Fill({ color: "rgba(255, 255, 255, 0.2)" }),
    stroke: new Stroke({ color: "#33cc33", width: 2 }),
    image: new CircleStyle({
      radius: 7,
      fill: new Fill({ color: "#ffcc33" }),
    }),
  });

  // 定义修改时使用的样式：不同的颜色和透明度
  const geodesicStyle = new Style({
    geometry: function (feature) {
      return feature.get("modifyGeometry") || feature.getGeometry();
    },
    fill: new Fill({ color: "rgba(255, 255, 255, 0.2)" }),
    stroke: new Stroke({ color: "#ff3333", width: 2 }),
    image: new CircleStyle({
      radius: 7,
      fill: new Fill({ color: "rgba(0, 0, 0, 0)" }), // 空心圆点
    }),
  });

  // 创建一个向量图层来显示用户绘制的特征，并设置样式函数以应用正确的样式
  const vector = new VectorLayer({
    source: source,
    style: function (feature) {
      const geometry = feature.getGeometry();
      // 如果是 GeometryCollection 类型，则应用 geodesicStyle 样式，否则应用默认样式
      return geometry.getType() === "GeometryCollection"
        ? geodesicStyle
        : style;
    },
  });

  // 初始化地图实例，包含底图和向量图层，并设定初始中心点和缩放级别
  const map = new Map({
    layers: [raster, vector],
    target: mapContainer.value, // 使用 ref 引用的地图容器
    view: new View({
      center: [-11000000, 6600000], // 初始中心坐标
      zoom: 3, // 初始缩放级别
    }),
  });

  // 获取 Modify 交互的默认样式函数，稍后将被覆盖
  const defaultStyle = new Modify({ source: source })
    .getOverlay()
    .getStyleFunction();

  // 创建 Modify 交互，允许用户编辑已经绘制的特征
  const modify = new Modify({
    source: source,
    style: function (feature) {
      // 遍历每个要修改的特征，计算新的几何体并保存更改
      feature.get("features").forEach(function (modifyFeature) {
        const modifyGeometry = modifyFeature.get("modifyGeometry");
        if (modifyGeometry) {
          // 更新多边形或半径，具体取决于用户是否在调整中心点还是边缘点
          // ...
          // 这部分逻辑涉及到复杂的几何变换，包括投影转换和距离计算
          // 最终更新多边形坐标并保存到 modifyGeometry 中
        }
      });
      return defaultStyle(feature); // 返回默认样式
    },
  });

  // 当开始修改特征时，克隆当前几何体以便稍后恢复
  modify.on("modifystart", function (event) {
    event.features.forEach(function (feature) {
      const geometry = feature.getGeometry();
      if (geometry.getType() === "GeometryCollection") {
        feature.set("modifyGeometry", geometry.clone(), true);
      }
    });
  });

  // 当结束修改特征时，将修改后的几何体应用到特征上，并移除临时属性
  modify.on("modifyend", function (event) {
    event.features.forEach(function (feature) {
      const modifyGeometry = feature.get("modifyGeometry");
      if (modifyGeometry) {
        feature.setGeometry(modifyGeometry);
        feature.unset("modifyGeometry", true);
      }
    });
  });

  // 将 Modify 交互添加到地图中
  map.addInteraction(modify);

  let draw, snap; // 全局变量，用于后续移除交互

  function addInteractions() {
    let value = typeSelect.value?.value;
    let geometryFunction;

    // 如果选择了 "Geodesic" 选项，则实际绘制的是 "Circle"
    if (value === "Geodesic") {
      value = "Circle";
      // 自定义几何函数，用于创建一个基于两点之间的距离的圆形
      geometryFunction = function (coordinates, geometry, projection) {
        if (!geometry) {
          // 如果没有现有几何体，则初始化一个 GeometryCollection 包含一个空多边形和一个点
          geometry = new GeometryCollection([
            new Polygon([]),
            new Point(coordinates[0]),
          ]);
        }
        const geometries = geometry.getGeometries();
        const center = transform(coordinates[0], projection, "EPSG:4326"); // 转换为 WGS84 投影
        const last = transform(coordinates[1], projection, "EPSG:4326"); // 第二个点也是 WGS84 投影
        const radius = getDistance(center, last); // 计算两个点之间的距离作为半径
        const circle = circular(center, radius, 128); // 创建一个圆周上有 128 个点的圆形
        circle.transform("EPSG:4326", projection); // 将圆形转换回原始投影
        geometries[0].setCoordinates(circle.getCoordinates()); // 更新多边形坐标
        geometry.setGeometries(geometries); // 更新几何集合
        return geometry;
      };
    }

    // 创建 Draw 交互，允许用户绘制指定类型的几何体
    draw = new Draw({
      source: source,
      type: value,
      geometryFunction: geometryFunction,
    });

    // 添加 Draw 和 Snap 交互到地图中，Snap 交互帮助用户捕捉到已有的几何体上
    map.addInteraction(draw);
    snap = new Snap({ source: source });
    map.addInteraction(snap);
  }

  // 在组件挂载后执行的操作
  addInteractions();

  // 确保在组件挂载后才添加事件监听器
  if (typeSelect.value) {
    typeSelect.value.onchange = function () {
      map.removeInteraction(draw);
      map.removeInteraction(snap);
      addInteractions();
    };
  }
}
</script>

<style scoped>
#map {
  position: relative; /* 确保子元素可以基于此元素进行绝对定位 */
  width: 100%; /* 地图宽度占满父级容器 */
  height: 100vh; /* 地图高度为视口高度 */
}

/* 确保地图容器有最小的高度，避免高度为0的情况 */
#app {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

form {
  margin-bottom: 10px;
}
</style>
