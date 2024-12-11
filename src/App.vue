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
    <button id="locate-to-chengdu" @click="locateToChengdu">定位到成都</button>
    <!-- 选择模式切换 -->
    <select
      id="selection-type"
      v-model="selectionType"
      @change="onSelectionChange"
    >
      <option value="point">点选</option>
      <option value="box">框选</option>
      <option value="Circle">圈选</option>
      <option value="Polygon">面选</option>
      <option value="LineString">线选</option>
    </select>
  </div>
</template>

<script setup>
// 导入 OpenLayers 和 Vue 相关模块以及样式文件
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
//地图图层
import TileLayer from "ol/layer/Tile";
// 数据源
import OSM from "ol/source/OSM";
import Stroke from "ol/style/Stroke";
// 向量源
import VectorSource from "ol/source/Vector";
//地图坐标信息
import GeoJSON from "ol/format/GeoJSON";
import { Style, Fill, Circle as CircleStyle } from "ol/style";
// 矢量图层
import VectorLayer from "ol/layer/Vector";
import { onMounted, ref } from "vue";
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
// Overlay 和坐标转换相关导入
import { Overlay } from "ol";
import { fromLonLat } from "ol/proj";
import Icon from "ol/style/Icon";
//聚合
import Cluster from "ol/source/Cluster";
import Text from "ol/style/Text";
//绘图
import { Select } from "ol/interaction";
import { Draw } from "ol/interaction";

let markerSource;
let locateToChengdu;
let selectInteraction; // 用于存储当前的选择交互
let drawInteraction; // 用于存储绘图交互
let onSelectionChange;
const selectionType = ref("point"); // 默认选择类型为点选
// 当组件挂载时调用 initMap 函数初始化地图
onMounted(() => {
  initMap();
  //渲染标记点
  const coordinatedata = [
    [11585424.079541972, 3590576.879235157],
    [11815902.844893824, 3621620.1690649893],
    [12111122.86177541, 4071747.8715975597],
    [12654949.208662543, 4136421.352602793],
    [12758535.25852801, 4578788.232677905],
    [13045986.327596923, 4400289.316156369],
    [12890607.371343456, 3882901.1128522437],
    [12577259.730535809, 3298252.4087765645],
    [12393394.711332364, 3600924.6030381834],
  ];
  for (var i = 0; i < coordinatedata.length; i++) {
    const pointFeature = new Feature({
      geometry: new Point(coordinatedata[i]), // 创建新的点特征
    });
    markerSource.addFeature(pointFeature); // 将新标记添加到向量源
  }
});
const initMap = () => {
  // 创建一个向量源并读取 GeoJSON 数据，用于显示中国的省份边界
  const vectorSource = new VectorSource({
    features: new GeoJSON().readFeatures(areaGeo, {
      dataProjection: "EPSG:4326",
      featureProjection: "EPSG:3857",
    }),
  });
  // 定义省份边界的样式：填充色和描边颜色及宽度
  const style = new Style({
    // fill: new Fill({
    //   color: "rgba(255, 255, 255, 0.6)", // 半透明白色填充
    // }),
    stroke: new Stroke({
      color: "#319FD3", // 蓝色描边
      width: 1, // 描边宽度
    }),
  });
  // 使用定义好的样式创建一个向量图层来展示中国省份边界
  const vectorLayer = new VectorLayer({
    source: vectorSource,
    style: style,
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
  markerSource = new VectorSource();
  // 使用 Cluster 源包装原始的向量源
  const clusterSource = new Cluster({
    distance: 40, // 聚合的距离阈值，单位是像素
    source: markerSource,
  });
  //聚合图样式判断
  function clusterStyleFunction(feature) {
    const size = feature.get("features").length;
    let style;
    if (size === 1) {
      // 如果只有一个点，则使用普通图标样式
      style = new Style({
        image: new Icon({
          anchor: [0.5, 1],
          anchorXUnits: "fraction",
          anchorYUnits: "fraction",
          src: "https://img2.baidu.com/it/u=1337068678,3064275007&fm=253&fmt=auto&app=120&f=JPEG?w=500&h=750",
          scale: 0.03,
        }),
      });
    } else {
      // 如果有多个点，则使用带有数字的圆形样式
      style = new Style({
        image: new CircleStyle({
          radius: 20,
          fill: new Fill({
            color: "#ffcc33", // 黄色填充
          }),
          stroke: new Stroke({
            color: "#fff", // 白色描边
            width: 2,
          }),
        }),
        text: new Text({
          text: size.toString(),
          fill: new Fill({
            color: "#333", // 文本颜色
          }),
          font: 'bold 14px "Arial"',
          textAlign: "center",
          textBaseline: "middle",
        }),
      });
    }
    return style;
  }
  // 使用定义好的样式函数创建一个向量图层来展示用户标记和聚合点
  const markerLayer = new VectorLayer({
    source: clusterSource,
    style: clusterStyleFunction,
  });
  // 创建地图实例，包含基础图层、经纬网图层、省份边界图层和用户标记图层
  const map = new Map({
    layers: [
      new TileLayer({
        source: new OSM(), // 使用 OSM 提供的基础地图瓦片
      }),
      vectorLayer, // 添加省份边界图层
      markerLayer, // 添加用户标记图层
    ],
    target: "map", // 指定地图渲染的目标容器 ID
    view: new View({
      center: fromLonLat([104.195397, 35.86166]), // 设置地图中心点为中国地理中心
      zoom: 4, // 设置初始缩放级别
      projection: "EPSG:3857", // 使用 Web Mercator 投影系统
    }),
    interactions: defaultInteractions({ doubleClickZoom: false }).extend([
      new DragRotateAndZoom(),
    ]), // 添加默认交互和自定义交互
    overlays: [overlay], // 添加 Popup Overlay
  });
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
      //关闭弹窗
      overlay.setPosition(undefined); // 移除 Popup 的位置属性，使其不可见
      container.classList.remove("ol-popup-visible"); // 移除可见样式类
      // 如果没有点击到任何标记，则添加新的标记
      const pointFeature = new Feature({
        geometry: new Point(coordinate), // 创建新的点特征
      });
      markerSource.addFeature(pointFeature); // 将新标记添加到向量源
      //打印标记的点
      console.log(coordinate);

      // 默认情况下不显示 Popup，除非点击了标记
      if (!selectedMarker) {
        overlay.setPosition(undefined); // 移除 Popup 位置
        container.classList.remove("ol-popup-visible"); // 隐藏 Popup
      }
    }
  });
  //定位功能： 定义一个函数来处理定位到成都的操作
  locateToChengdu = () => {
    // 成都的坐标需要转换为EPSG:3857投影系统下的坐标
    const chengduLonLat = [104.065735, 30.659462]; // 成都经纬度坐标
    const chengduCoordinate = fromLonLat(chengduLonLat);
    // 使用 animate 方法平滑地改变地图视图的位置和缩放级别
    map.getView().animate({
      center: chengduCoordinate,
      zoom: 10, // 设置你想要的缩放级别
      duration: 2000, // 动画持续时间，单位是毫秒
    });
  };

  // 定义选择条件函数
  function singleClick(mapBrowserEvent) {
    return mapBrowserEvent.type === "click";
  }
  // 点选交互
  function pointSelection() {
    select("point");
  }
  // 框选交互
  function boxSelection() {
    select("Square");
  }
  // 圈选交互
  function circleSelection() {
    select("Circle");
  }
  // 面选交互
  function polygonSelection() {
    select("Polygon");
  }
  // 线选交互（选择靠近线的目标）
  function lineSelection() {
    select("LineString");
  }
  // 创建 Select 交互实例，用于选择特征
  const select = (type) => {
    console.log("select函数内type：", type);
    console.log("储存的当前选择交互", selectInteraction);
    console.log("储存的当前绘图交互", drawInteraction);
    if (selectInteraction) {
      map.removeInteraction(selectInteraction);
    }
    if (drawInteraction) {
      map.removeInteraction(drawInteraction);
    }
    //如果是点选
    if (type === "point") {
      // 如果是点选则新增单击的地图交互
      selectInteraction = new Select({
        condition: singleClick,
      });
      // 添加选择事件监听器，用于处理点选逻辑
      selectInteraction.on("select", function (event) {
        const selectedFeatures = event.selected; // 获取被选中的特征列表

        // 遍历被选中的特征并打印它们的坐标
        selectedFeatures.forEach((feature) => {
          const coord = feature.getGeometry().getCoordinates();
          console.log("Selected point coordinates:", coord);
        });
      });
      map.addInteraction(selectInteraction);
    } else {
      //给点选和框选两个分支，其他的按照原来的值定义的type
      drawInteraction = new Draw({
        source: vectorSource, // 使用省份边界向量源作为临时绘图源
        type: type === "box" ? "Square" : type, // 框选实际是画一个矩形
      });
      map.addInteraction(drawInteraction);
      drawInteraction.on("drawend", (event) => {
        const geometry = event.feature.getGeometry();
        let extent;
        if (geometry.getType() === "Point") {
          extent = geometry.getExtent();
        } else {
          extent = geometry.getExtent();
        }
        // 根据不同选择类型计算符合条件的特征
        const features = [];
        markerSource.forEachFeature((feature) => {
          const geom = feature.getGeometry();
          if (geom.intersectsExtent(extent)) {
            features.push(feature);
          }
        });
        // 打印所有被选中的特征坐标
        console.log("Selected features coordinates:");
        features.forEach((feature) => {
          const coord = feature.getGeometry().getCoordinates();
          console.log(coord);
        });
        // 移除绘制的几何体
        vectorSource.clear();
        // 如果是框选，则移除绘制的矩形
        if (type === "box") {
          map.removeInteraction(drawInteraction);
          drawInteraction = null;
        }
      });
    }
  };
  // 添加选择模式切换按钮或下拉菜单
  // 这里假设你已经有了一个选择模式切换的UI元素
  onSelectionChange = (e) => {
    selectionType.value = e.target.value;
    console.log(e.target.value);
    select(selectionType.value);
  };
  // 初始化默认的选择交互
  //首次会加载一次
  select(selectionType.value);
  console.log("init finished"); // 初始化完成后的日志输出
};
</script>

<style scoped>
/* 地图容器样式 */
.map {
  position: relative; /* 确保子元素可以基于此元素进行绝对定位 */
  width: 100%; /* 地图宽度占满父级容器 */
  height: 100vh; /* 地图高度为视口高度 */
}
#locate-to-chengdu {
  position: absolute;
  top: 10px; /* 距离顶部的距离 */
  left: 50%;
  transform: translateX(-50%); /* 水平居中按钮 */
  z-index: 10; /* 确保按钮显示在地图之上 */
  padding: 5px 10px;
  background-color: #fff; /* 按钮背景颜色 */
  border: 1px solid #ccc; /* 按钮边框 */
  cursor: pointer;
  /* 添加更多样式以美化按钮，例如圆角、阴影等 */
  border-radius: 3px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
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
#selection-type {
  margin-bottom: 10px;
  position: absolute;
  top: 100px;
  right: 10px;
}
</style>
