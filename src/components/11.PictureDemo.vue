<template>
  <div id="app">
    <!-- 地图容器 -->
    <!-- 这个 div 是地图的主要容器，所有地图元素都将渲染到这个 div 中 -->
    <div id="map" class="map"></div>
    <!-- Popup 容器 -->
    <!-- 这个 div 包含了弹窗（Popup）的所有元素，包括关闭按钮和内容区域 -->
    <div id="popup" class="ol-popup">
      <!-- 关闭按钮，点击后会隐藏 Popup -->
      <a href="#" id="popup-closer" class="ol-popup-closer"></a>
      <div class="block text-center" m="t-4">
        <el-carousel trigger="click" height="150px">
          <el-carousel-item v-for="item in 4" :key="item">
            <!-- <h3 class="small justify-center" text="2xl">{{ item }}</h3> -->
            <img
              style="width: 100%; height: 100%"
              src="https://img2.baidu.com/it/u=1337068678,3064275007&fm=253&fmt=auto&app=120&f=JPEG?w=500&h=750"
              alt="示例图片"
            />
          </el-carousel-item>
        </el-carousel>
      </div>
      <!-- 弹窗的内容区域 -->
      <div id="popup-content"></div>
    </div>
  </div>
</template>

<script setup>
// 导入 OpenLayers 和 Vue 相关模块以及样式文件
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import Graticule from "ol/layer/Graticule";
import Stroke from "ol/style/Stroke";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import {
  Style,
  Fill,
  Stroke as FeatureStroke,
  Circle as CircleStyle,
} from "ol/style";
import VectorLayer from "ol/layer/Vector";
import { onMounted } from "vue";
// 导入中国地图的 GeoJSON 数据
import { areaGeo } from "./geoJson/china.js";
// 标记相关的导入
import Point from "ol/geom/Point";
import Feature from "ol/Feature";
// 交互和控件的导入
import {
  defaults as defaultInteractions,
  DragRotateAndZoom,
} from "ol/interaction";
import { defaults as defaultControls, FullScreen } from "ol/control";
import MousePosition from "ol/control/MousePosition";
import { createStringXY } from "ol/coordinate";
import OverviewMap from "ol/control/OverviewMap";
import { XYZ } from "ol/source";
import { ScaleLine } from "ol/control";
// Overlay 和坐标转换相关导入
import { Overlay } from "ol";
import { fromLonLat, toLonLat } from "ol/proj";
import { toStringHDMS } from "ol/coordinate";

// 当组件挂载时调用 initMap 函数初始化地图
onMounted(() => {
  initMap();
});

const initMap = () => {
  // 创建一个向量源并读取 GeoJSON 数据，用于显示中国的省份边界
  const vectorSource = new VectorSource({
    features: new GeoJSON().readFeatures(areaGeo),
  });

  // 定义省份边界的样式：填充色和描边颜色及宽度
  const style = new Style({
    fill: new Fill({
      color: "rgba(255, 255, 255, 0.6)", // 半透明白色填充
    }),
    stroke: new FeatureStroke({
      color: "#319FD3", // 蓝色描边
      width: 1, // 描边宽度
    }),
  });

  // 使用定义好的样式创建一个向量图层来展示中国省份边界
  const vectorLayer = new VectorLayer({
    source: vectorSource,
    style: style,
  });

  // 创建一个经纬网图层，并设置其样式，如线宽、颜色和是否显示标签等
  const graticule = new Graticule({
    strokeStyle: new Stroke({
      color: "rgba(255,120,0,0.9)", // 橙红色虚线
      width: 2, // 线宽
      lineDash: [0.5, 4], // 虚线模式
    }),
    showLabels: true, // 显示经纬度标签
    wrapX: false, // 不跨经度180度线重复绘制
  });

  // 创建 overview map 控件（鹰眼图），用于提供整个地图的概览
  const overviewMapControl = new OverviewMap({
    layers: [
      new TileLayer({
        source: new XYZ({
          url: "https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png", // 使用 OSM 瓦片服务
          attributions:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }),
      }),
    ],
  });

  // 向地图添加鼠标位置控制，显示当前鼠标的地理坐标
  const mousePositionControl = new MousePosition({
    coordinateFormat: createStringXY(5), // 坐标格式化为字符串，保留小数点后五位
    projection: "EPSG:4326", // 使用 WGS84 投影系统
    className: "custom-mouse-position", // 自定义样式类名
    target: document.getElementById("map"), // 将坐标信息显示在地图容器中
    undefinedHTML: "&nbsp;", // 如果没有定义坐标则显示空格
  });

  // 获取 DOM 元素以创建 Popup
  const container = document.getElementById("popup");
  const closer = document.getElementById("popup-closer");
  const content = document.getElementById("popup-content");

  // 创建 Overlay 对象，用于实现 Popup 功能
  const overlay = new Overlay({
    element: container, // Popup 的 HTML 元素
    autoPan: true, // 自动平移以确保 Popup 可见
    positioning: "bottom-center", // Popup 定位方式
    stopEvent: true, // false:允许事件穿透到地图 true:阻止
    autoPanAnimation: {
      duration: 250, // 平移动画持续时间
    },
  });

  // 设置当点击关闭按钮时隐藏 Popup 的逻辑
  closer.onclick = () => {
    overlay.setPosition(undefined); // 移除 Popup 的位置属性，使其不可见
    container.classList.remove("ol-popup-visible"); // 移除可见样式类
    closer.blur(); // 移除焦点
    return false; // 防止默认行为
  };

  // 创建一个新的向量源用于用户标记
  const markerSource = new VectorSource();

  // 定义用户标记的样式：圆形图标及其填充和描边颜色
  const markerStyle = new Style({
    image: new CircleStyle({
      radius: 7, // 圆形半径
      fill: new Fill({ color: "#ffcc33" }), // 黄色填充
      stroke: new FeatureStroke({
        color: "#fff", // 白色描边
        width: 2, // 描边宽度
      }),
    }),
  });

  // 使用定义好的样式创建一个向量图层来展示用户标记
  const markerLayer = new VectorLayer({
    source: markerSource,
    style: markerStyle,
  });

  // 创建地图实例，包含基础图层、经纬网图层、省份边界图层和用户标记图层
  const map = new Map({
    layers: [
      new TileLayer({
        source: new OSM(), // 使用 OSM 提供的基础地图瓦片
      }),
      graticule, // 添加经纬网图层
      vectorLayer, // 添加省份边界图层
      markerLayer, // 添加用户标记图层
    ],
    target: "map", // 指定地图渲染的目标容器 ID
    view: new View({
      center: fromLonLat([104.195397, 35.86166]), // 设置地图中心点为中国地理中心
      zoom: 4, // 设置初始缩放级别
      projection: "EPSG:3857", // 使用 Web Mercator 投影系统
    }),
    controls: defaultControls({ zoom: true }).extend([overviewMapControl]), // 添加默认控件和自定义控件
    interactions: defaultInteractions().extend([new DragRotateAndZoom()]), // 添加默认交互和自定义交互
    overlays: [overlay], // 添加 Popup Overlay
  });

  // 添加全屏控件到地图
  map.addControl(new FullScreen());
  // 添加鼠标位置控件到地图
  map.addControl(mousePositionControl);
  // 添加比例尺控件到地图
  map.addControl(new ScaleLine());

  // 监听地图上的单击事件，用于添加新标记或显示现有标记的 Popup
  let selectedMarker = null;
  map.on("singleclick", (evt) => {
    const coordinate = evt.coordinate; // 获取点击的坐标
    const feature = map.forEachFeatureAtPixel(evt.pixel, function (feature) {
      return feature; // 检查点击位置是否有特征（即标记）
    });

    if (feature) {
      // 如果点击的是标记，则显示 Popup
      const geometry = feature.getGeometry(); // 获取标记的几何对象
      const coord = geometry.getCoordinates(); // 获取标记的坐标
      content.innerHTML = `<p>你点击的位置是： ${coord}</p>`; // 设置 Popup 内容
      overlay.setPosition(coord); // 设置 Popup 位置
      container.classList.add("ol-popup-visible"); // 显示 Popup
      selectedMarker = feature; // 记录选中的标记
    } else {
      // 如果没有点击到任何标记，则添加新的标记
      const pointFeature = new Feature({
        geometry: new Point(coordinate), // 创建新的点特征
      });
      markerSource.addFeature(pointFeature); // 将新标记添加到向量源

      // 默认情况下不显示 Popup，除非点击了标记
      if (!selectedMarker) {
        overlay.setPosition(undefined); // 移除 Popup 位置
        container.classList.remove("ol-popup-visible"); // 隐藏 Popup
      }
    }
  });

  console.log("init finished"); // 初始化完成后的日志输出
};
</script>

<style scoped>
/* 地图容器样式 */
.map {
  width: 100%; /* 地图宽度占满父级容器 */
  height: 100vh; /* 地图高度为视口高度 */
}

/* Popup 弹窗样式 */
.ol-popup {
  position: absolute; /* 绝对定位 */
  background-color: white; /* 白色背景 */
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2); /* 添加阴影效果 */
  padding: 15px; /* 内边距 */
  border-radius: 10px; /* 圆角 */
  border: 1px solid #cccccc; /* 边框 */
  bottom: 12px; /* 底部偏移 */
  left: 50%; /* 左侧居中 */
  transform: translateX(-50%); /* 精确调整到水平居中 */
  visibility: hidden; /* 默认隐藏 */
  width: auto; /* 自适应宽度 */
}

/* Popup 箭头样式 */
.ol-popup:after,
.ol-popup:before {
  top: 100%; /* 箭头位于弹窗底部 */
  border: solid transparent; /* 箭头使用边框模拟 */
  content: " "; /* 空内容 */
  height: 0; /* 高度为零 */
  width: 0; /* 宽度为零 */
  position: absolute; /* 绝对定位 */
  pointer-events: none; /* 忽略指针事件 */
}

/* 白色箭头 */
.ol-popup:after {
  border-top-color: white; /* 上边框颜色为白色 */
  border-width: 10px; /* 箭头宽度 */
  left: 50%; /* 居中 */
  transform: translateX(-50%); /* 精确调整到居中 */
  margin-left: -10px; /* 箭头左侧微调 */
}

/* 灰色箭头 */
.ol-popup:before {
  border-top-color: #cccccc; /* 上边框颜色为灰色 */
  border-width: 11px; /* 箭头宽度 */
  left: 48px; /* 箭头左侧偏移 */
  margin-left: -11px; /* 箭头左侧微调 */
}

/* 关闭按钮样式 */
.ol-popup-closer {
  text-decoration: none; /* 移除下划线 */
  position: absolute; /* 绝对定位 */
  top: 2px; /* 顶部偏移 */
  right: 8px; /* 右侧偏移 */
}

/* 关闭按钮文本 */
.ol-popup-closer:after {
  content: "✖"; /* 显示关闭符号 */
}

/* 显示 Popup 时应用的样式 */
.ol-popup-visible {
  visibility: visible; /* 显示 */
}
/* 轮播图 */
.demonstration {
  color: var(--el-text-color-secondary);
}

.el-carousel__item h3 {
  color: #475669;
  opacity: 0.75;
  line-height: 150px;
  margin: 0;
  text-align: center;
}

.el-carousel__item:nth-child(2n) {
  background-color: #99a9bf;
}

.el-carousel__item:nth-child(2n + 1) {
  background-color: #d3dce6;
}
</style>
