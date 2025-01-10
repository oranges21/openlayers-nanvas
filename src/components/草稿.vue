<template>
  <div class="main">
    <ul class="cameraCircle" v-show="isCamera">
      <li
        :class="isCircleType == 'frame' ? 'isCameraCircle' : ''"
        @click="openSelect('frame')"
      >
        {{ isCircleType == "frame" ? "关闭框选" : "开启框选" }}
      </li>
      <li
        :class="isCircleType == 'Circle' ? 'isCameraCircle' : ''"
        @click="openSelect('Circle')"
      >
        {{ isCircleType == "Circle" ? "关闭圈选" : "开启圈选" }}
      </li>
      <li
        :class="isCircleType == 'Polygon' ? 'isCameraCircle' : ''"
        @click="openSelect('Polygon')"
      >
        {{ isCircleType == "Polygon" ? "关闭多边形选" : "开启多边形选" }}
      </li>
      <li
        :class="isCircleType == 'allCircle' ? 'isCameraCircle' : ''"
        @click="openSelect('allCircle')"
      >
        {{ isCircleType == "allCircle" ? "取消屏幕内全选" : "屏幕内全选" }}
      </li>
    </ul>
    <div
      class="cameraChecked"
      ref="cameraCheckeds"
      v-show="cameraTextShow && isActiveCircle"
    >
      <ul>
        <li v-for="v in cameraCheckList" class="cameraChecked_item">
          <div>
            <input
              type="checkbox"
              :checked="v.checked"
              @click.stop="cameraCheckBox(v)"
            />
          </div>
          <div>{{ v.name }}</div>
        </li>
      </ul>
      <div class="camerButton">
        <button class="camerButtonCancel" @click="cameraTextShow = false">
          取消
        </button>
        <button class="camerButtonRequire" @click.stop="camerAddSelected">
          确认
        </button>
      </div>
    </div>
    <div v-if="ismap" id="map" ref="rootmap" width="100%" height="100%">
      <div id="overlay-box"></div>
      <!-- 地图画框框选 -->
      <div class="circle" ref="circleElement"></div>
      <!-- 地图摄像头勾选 -->
      <div
        class="cameraChecked"
        ref="cameraChecked"
        v-show="cameraTextShow && isActiveCircle == false"
      >
        <ul v-if="cameraTextShow && isActiveCircle == false">
          <li v-for="v in cameraCheckList" class="cameraChecked_item">
            <div>
              <input
                type="checkbox"
                :checked="v.checked"
                @click.stop="cameraCheckBox(v)"
              />
            </div>
            <div>{{ v.style_.text_.text_ }}</div>
          </li>
        </ul>
        <div class="camerButton">
          <button class="camerButtonCancel" @click="cameraTextShow = false">
            取消
          </button>
          <button class="camerButtonRequire" @click.stop="camerAddSelected">
            加入已选
          </button>
        </div>
      </div>
      <!-- 轨迹信息 -->
      <div v-show="isShowText" ref="propuTxex" class="pointInfo">
        <div class="textImg">
          <div class="textImgmessage" v-show="TrackPointInfoList.length != 1">
            <span @click="textImgmessageLast">&lt;</span>
            <span @click="textImgmessageNext">></span>
          </div>
          <img
            :src="
              currentTrackPointInfo
                ? $getImgUrl(currentTrackPointInfo.targetPicture)
                : ''
            "
            alt=""
          />
        </div>
        <div class="textPro">
          <div class="textTime">
            {{ currentTrackPointInfo ? currentTrackPointInfo.createTime : "" }}
          </div>
          <div class="textPointName">
            {{
              currentTrackPointInfo
                ? currentTrackPointInfo.pointInfo.pointName
                : ""
            }}
          </div>
          <div class="textTextarea" v-if="currentTrackPointInfo">
            <textarea
              placeholder="备注信息"
              @keydown="messageSendlisten"
              name=""
              id=""
              cols="30"
              rows="6"
              v-model="currentTrackPointInfo.remark"
            ></textarea>
          </div>
        </div>
      </div>
      <!-- 案件信息 -->
      <div ref="caseInfoText" v-show="isCaseTextShow" class="caseInfoText">
        <div class="caseTitle" v-if="isCaseTextShow">
          <div
            @click="changeCase"
            style="
              cursor: pointer;
              color: #3b79f6;
              border-bottom: 1px solid #3b79f6;
              padding: 0;
              margin-bottom: 10px;
              font-size: 14px;
            "
          >
            {{ caseInfo.caseName }}>>
          </div>
          <div class="changeCaseIcon" v-show="singleclickFeatures.length != 1">
            <div
              class="changeCaseIconLeft"
              @click="caseInfoIndexAddSum(false)"
              style="margin-right: 20px"
            ></div>
            <div
              class="changeCaseIconRight"
              @click="caseInfoIndexAddSum(true)"
            ></div>
            <!-- <span><img src="@/assets/index/indexEnter/changeCaseRightIcon.png" alt=""></span> -->
          </div>
        </div>
        <div class="caseInfo" v-if="isCaseTextShow">
          <div class="caseInfo_item">
            <span>案发时间：</span><span>{{ caseInfo.occurrenceTime }}</span>
          </div>
          <div class="caseInfo_item">
            <span>案发地点：</span
            ><span>{{ caseInfo.pointInfo.pointName }}</span>
          </div>
          <div class="caseInfo_item">
            <span>创建人：</span><span>{{ caseInfo.createPerson }}</span>
          </div>
          <div class="caseInfo_item">
            <span>创建人归属：</span
            ><span>{{ caseInfo.createPersonUnit }}</span>
          </div>
          <div class="caseInfo_item">
            <span>案件描述：</span><span>{{ caseInfo.caseDesc }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import "ol/ol.css";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Style, Icon, Stroke, Circle, Text, Fill } from "ol/style";
import { Point, LineString } from "ol/geom";
import Overlay from "ol/Overlay";
import { Map, View, Feature } from "ol";
import { never, always } from "ol/events/condition";
import { getArea, getLength, getDistance } from "ol/sphere"; //测距
import { fromLonLat } from "ol/proj";
import ol from "ol";
// import mapconfig from "../../config/mapconfig.js";
import Cluster from "ol/source/Cluster";
// import DragPan from 'ol/interaction/DragPan'//先在项目中引用此包
import { Select, DragPan, Draw, DragBox } from "ol/interaction";
import { createBox } from "ol/interaction/Draw";
import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";
import { Options, Vue, Prop, Watch } from "vue-property-decorator";
import { getTrackList, getTrackPointInfo, getTrackPointEdit } from "@/api/map";
import {
  caseReports,
  getReportsTrackList,
  getReportsTrackUrl,
} from "@/api/case";
import { getUserCaseList } from "@/api/case";
import html2canvas from "html2canvas";
import axios from "axios";
import { letterSpacing } from "html2canvas/dist/types/css/property-descriptors/letter-spacing";
@Options({
  props: {
    noticeCanera: 0,
    videoTapeList: {},
    caseTime: {
      type: Object,
      default: {},
    },
    addName: {
      type: String,
      default: "",
    },
    isactive: {
      type: Boolean,
      default: false,
    },
    fatherPoint: {
      type: Array,
      default: [],
    },
    isAddLining: false,
    isAddPoint: false,
    isCaseInfo: false,
    isCamera: false,
  },
  watch: {
    noticeCanera() {
      this.getDeviceTree();
      if (this.cameraCheckList.length > 0) {
        this.cameraTextShow = false;
      }
    },
  },
})
export default class olmap extends Vue {
  @Prop({ type: Array, default: [] }) public isMapGetImg: boolean = false;
  @Prop({ type: Array, default: [] }) public isReportsLining: boolean = false; //是否打开案件报告连线
  $store: any;
  @Watch("isMapGetImg", { immediate: true, deep: true })
  seeIsMapGetImg(newVal: any) {
    if (this.isMapGetImg == true) {
      this.getToImage();
    }
  }
  @Watch("isActiveCircle", { immediate: true, deep: true })
  seeisActiveCircle(newVal: any) {}
  @Watch("cameraTextShow", { immediate: true, deep: true })
  seecameraTextShow(newVal: any) {}
  $message: any;
  $getImgUrl: any;
  $getVideoUrl: any;
  noticeCanera: any;
  caseTime: any; //拉取录像视频流的起始时间段
  isCaseInfo: boolean = false; //是否获取案件信息
  isAddLining = false; //是否渲染轨迹线段
  isAddPoint = false; //是否打开地图新增点位功能
  isactive!: boolean; //是否渲染dialog
  isCamera!: boolean; //是否摄像头
  addName!: string; //新增点位的命名
  videoTapeList: any; //从父级接收到的摄像头表
  public coordinate: any = []; //新增点位的坐标
  public dialogVisible: boolean = false; //dialog开关
  public map: any = null; //地图容器
  public pointLayer: any = []; //点位图层
  public currentV: any = null; //新增点位的图层
  public currfeature: any = null; //储存的新增点位
  fatherPoint: Array<any> = new Array(); //从父级接受到的点位
  public isShowText: boolean = false; //轨迹线索显示点位信息的弹框
  public isCaseTextShow: boolean = false; //案件信息点位弹框
  public textId: any = 0; //弹框id
  public currentTrackPointInfo: any = null; //当前获得的轨迹点位信息
  public TrackPointInfoList: Array<any> = []; //获取到的当前点位信息数组
  public caseList: Array<any> = []; //获取到的所有案件信息
  public caseInfo: any = null; //当前案件信息
  public caseInfoIndex: number = 0; //当前案件信息列表加减
  public singleclickFeatures: any = null; //单击地图列表获得的feature列表
  public leftY: number = 0;
  public leftX: number = 0;
  public startLocalY: number = 0; //画框起始位Y坐标
  public startLocalX: number = 0; //画框起始位X坐标
  public pan: any = null;
  public isCircle: boolean = false; //画框显示
  public circlePointArray: any = { start: [], end: [] }; //画框起始点数组
  public isActiveCircle: boolean = false; //是否开启画框
  public cameraTextShow: boolean = false; //是否展开摄像头信息
  public cameraCheckList: Array<any> = []; //选中的摄像头列表
  public getCameraVideoList: Array<any> = []; //拉取视频流列表
  public clusters: any = null; //案件点位叠加层
  public drawLayer: any = null; //多边形画框图层
  public ismap: boolean = true;
  public drawBox: any = null;
  public isCircleType: any = null; //圈选，框选，多边形选择类型切换
  public mapConfig: {
    target: any;
    hostUrl: string;
    projection: string;
    center: Array<number>;
    zoom: number;
    maxZoom: number;
    minZoom: number;
  } = {
    target: null,
    hostUrl: process.env.VUE_APP_DEV_mapImgAPI
      ? process.env.VUE_APP_DEV_mapImgAPI
      : "http://" + location.host,
    projection: "EPSG:4326",
    // center: [116.395645038, 39.9299857781], //北京
    // center: [117.024967066, 36.6827847272], //济南
    center: [104.067923463, 30.6799428454], //成都
    // center: [113.64964385, 34.7566100641], //郑州
    zoom: 15,
    maxZoom: 17,
    // zoom: 6,
    // maxZoom: 10,
    minZoom: 1,
  };
  public initMap() {
    let _this = this;
    this.mapConfig.target = (this.$refs as any).rootmap;
    this.map = new Map({
      target: this.mapConfig.target,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        projection: this.mapConfig.projection, //使用这个坐标系
        center: this.mapConfig.center,
        zoom: this.mapConfig.zoom,
        maxZoom: this.mapConfig.maxZoom,
        minZoom: this.mapConfig.minZoom,
      }),
    });
    this.pointLayer = new VectorLayer({
      source: new VectorSource(),
    });
    // 点击图标获得点位信息
    this.map.on("singleclick", (e: { pixel: any; coordinate: any }) => {
      if (this.map.hasFeatureAtPixel(e.pixel)) {
        var feature = this.map.getFeaturesAtPixel(e.pixel);
        this.singleclickFeatures = feature[0].values_.features;
        //如果点击的是已存在点位，就把点位的id和name发送到父组件
        if (feature.length == 1 && this.isAddLining) {
          this.addText(feature);
        }
        if (this.isCaseInfo) {
          this.caseInfoText(this.singleclickFeatures);
        }
        if (this.isCamera) {
          this.cameraTextChecked(feature[0].values_.features);
        }
        //轨迹画线点击出现介绍框
      } else {
        // this.isCamera?this.cameraTextShow = false:''
        this.isCaseTextShow = false;
        this.caseInfoIndex = 0;
        this.coordinate = e.coordinate;
        this.addPoints();
      }
    });
    //地图画框
    this.map.on("pointerdrag", (e: { coordinate: any }) => {
      if (this.isActiveCircle) {
        this.circlePointArray.start.length !== 0
          ? (this.circlePointArray.end = e.coordinate)
          : (this.circlePointArray.start = e.coordinate);
      }
    });

    //地图放大缩小触发的函数
    this.map.on("moveend", (e: any) => {
      this.isCamera ? (this.cameraTextShow = false) : "";
      this.isCaseTextShow = false;
      this.caseInfoIndex = 0;
    });
    this.map.addLayer(this.pointLayer);
    this.initPoint();
  }
  /**
   * 点击增加点位实现函数
   */
  public addPoints() {
    if (this.isAddPoint) {
      if (this.currfeature != null) {
        this.currentV.getSource().removeFeature(this.currfeature);
        this.map.removeLayer(this.pointLayer);
      }
      // 创建feature要素，一个feature就是一个点坐标信息
      // if(this.addName!=''){
      this.currfeature = new Feature({
        geometry: new Point(this.coordinate),
      });
      //设置id
      // 设置要素的图标
      this.currfeature.setStyle(
        new Style({
          // 设置图片效果
          image: new Icon({
            src: this.mapConfig.hostUrl + "/mapIcon/map_green.png",
            scale: 0.8,
            crossOrigin: "Anonymous",
          }),
        })
      );
      // 要素添加到地图图层上
      this.currentV = new VectorLayer({
        source: new VectorSource(),
      });
      this.currentV.getSource().addFeature(this.currfeature);
      this.map.addLayer(this.currentV);
      this.dialogVisible = false;
      this.$emit("pointLocation", this.coordinate);
    }
  }
  /**
  //  * initPoint地图初始化打点
   */
  public initPoint() {
    if (!this.fatherPoint) return;
    this.coordinate = this.fatherPoint;
    this.currfeature = new Feature({
      geometry: new Point(this.coordinate),
    });
    //设置id
    // 设置要素的图标
    this.currfeature.setStyle(
      new Style({
        // // 设置图片效果
        image: new Icon({
          src: this.mapConfig.hostUrl + "/mapIcon/map_green.png",
          scale: 0.8,
          crossOrigin: "Anonymous",
        }),
      })
    );
    // 要素添加到地图图层上
    this.currentV = new VectorLayer({
      source: new VectorSource(),
    });
    this.currentV.getSource().addFeature(this.currfeature);
    this.map.addLayer(this.currentV);
  }
  /**
   * addLining增加轨迹线段
   */
  public async addLining() {
    let coords: Array<any> = []; //地图画线
    let iconCoords: Array<any> = []; //地图描点
    let res: any = null;
    let lengthArr: Array<any> = []; //地图画线数组
    let indexLength: any = 0; //地图画线数组长度
    if (this.isReportsLining === true) {
      res = await getReportsTrackList({});
    } else {
      res = await getTrackList({});
    }
    res.data == null ? (res.data = []) : "";
    res.data.map((v: any) => {
      lengthArr.push(v);
      indexLength = lengthArr.length;
      v.map((item: any) => {
        coords.push([item.latitude, item.longitude]);
        iconCoords.push({
          id: item.pointId,
          name: item.pointName,
          numIndex: item.index.toString(),
          location: [item.latitude, item.longitude],
        });
      });
    });
    let length: Array<any> = []; //距离数组
    let centerArr: Array<any> = []; //线段中心 显示距离
    if (indexLength !== 1) {
      for (let j = 0; j < indexLength; j++) {
        length.push(getDistance(coords[2 * j], coords[2 * j + 1]));
        centerArr.push([
          (coords[2 * j][0] + coords[2 * j + 1][0]) / 2,
          (coords[2 * j][1] + coords[2 * j + 1][1]) / 2,
        ]);
      }
    } else {
      length.push(getDistance(coords[0], coords[1]));
      centerArr.push([
        (coords[0][0] + coords[1][0]) / 2,
        (coords[0][1] + coords[1][1]) / 2,
      ]);
    }
    // else {
    //   length = [];
    //   centerArr = [];
    // }
    let routeLayer: any = null;
    let routeLayerDistance: any = null;
    routeLayer = new VectorLayer({
      source: new VectorSource({
        features: [],
      }),
    });
    routeLayerDistance = new VectorLayer({
      source: new VectorSource({
        features: [],
      }),
    });
    iconCoords.map((v: any, i: any) => {
      iconCoords.map((item, index) => {
        if (v.id == item.id && i != index) {
          if (index > i && v.numIndex.indexOf(item.numIndex) == -1) {
            v.numIndex = v.numIndex + "," + item.numIndex;
          } else if (index > i && item.numIndex.indexOf(v.numIndex) == -1) {
            item.numIndex = v.numIndex + "," + item.numIndex;
          }
        }
      });
    });
    iconCoords.map((v: any, i: any) => {
      const feature = new Feature({
        geometry: new Point(v.location), //画点
      });
      feature.setStyle(
        new Style({
          // 设置图片效果
          image: new Icon({
            src: this.mapConfig.hostUrl + "/mapIcon/map_red.png",
            scale: 0.8,
            crossOrigin: "Anonymous",
          }),
          text: new Text({
            font: "15px Microsoft YaHei",
            text: v.numIndex ? v.numIndex.toString() : "",
            offsetX: 0,
            offsetY: 30,
            fill: new Fill({
              color: "#fff",
            }),
            backgroundFill: new Fill({
              color: "#3b79f6",
            }),
            padding: [4, 4, 1, 4],
          }),
        })
      );
      feature.setId(v.id);
      routeLayer.getSource().addFeatures([feature]);
    });

    centerArr.map((v: any, i: any) => {
      const feature = new Feature({
        geometry: new Point(v), //画点
      });
      feature.setStyle(
        new Style({
          text: new Text({
            font: "12px Microsoft YaHei",
            // text: length[i] < 1000 ? Math.round(length[i]) + '米' : Math.round(length[i] / 1000) + '公里',
            text: length[i].toFixed(0) + "米",
            offsetX: 0,
            offsetY: 15,
            fill: new Fill({
              color: "#fff",
            }),
            backgroundFill: new Fill({
              color: "#3b79f6",
            }),
            padding: [4, 4, 1, 4],
          }),
        })
      );
      feature.setId(v);
      routeLayerDistance.getSource().addFeatures([feature]);
    });

    let wireFeature: any = {};
    wireFeature = new Feature({
      geometry: new LineString(coords), //画线段
    });
    wireFeature.setStyle(
      new Style({
        stroke: new Stroke({
          // 设置边的样式
          color: "#3b79f6",
          lineDash: [10, 10, 10, 10],
          width: 4,
        }),
      })
    );
    this.map.addLayer(routeLayerDistance);
    this.map.addLayer(routeLayer);
    routeLayer.getSource().addFeatures([wireFeature]);
    routeLayerDistance.getSource().addFeatures([wireFeature]);

    console.log("coords", coords);
    console.log("indexLength", indexLength);
    console.log("centerArr", centerArr);
    console.log("iconCoords", iconCoords);
    // console.log('length', length < 1000 ? Math.round(length) + '米' : Math.round(length / 1000) + '公里');
    console.log("length", length);
  }

  /**
   * addText轨迹线索点击弹框
   */
  public addText(item: any) {
    if (item[0].id_ == this.textId) {
      this.isShowText = false;
      this.textId = null;
      return;
    } else {
      this.textId = item[0].id_;
      this.isShowText = true;
      const oSpan: any = this.$refs.propuTxex as any;
      let textInfo = new Overlay({
        position: item[0].values_.geometry.flatCoordinates, //设置位置
        element: oSpan,
        offset: [-200, -200], //设置偏移
      });
      this.textInfo(this.textId);
      this.map.addOverlay(textInfo);
    }
  }
  /**
   * textInfo轨迹点位信息
   */
  public async textInfo(pointId: number | string) {
    let res = await getTrackPointInfo({ pointId });
    if (res.code == 0) {
      this.TrackPointInfoList = res.data;
      this.TrackPointInfoList.map((v) => {
        v.createTime = v.createTime.substring(0, 19).replace("T", " ");
      });
      this.currentTrackPointInfo = this.TrackPointInfoList[0];
    }
  }
  /**
   * textImgmessageNext图片下一个
   */
  public textImgmessageNext() {
    this.TrackPointInfoList.map((v, i) => {
      if (
        this.currentTrackPointInfo.id == v.id &&
        i != this.TrackPointInfoList.length - 1
      ) {
        this.currentTrackPointInfo = this.TrackPointInfoList[i + 1];
      }
    });
  }
  /**
   * textImgmessageLast图片上一个
   */
  public textImgmessageLast() {
    this.TrackPointInfoList.map((v, i) => {
      if (this.currentTrackPointInfo.id == v.id && i != 0) {
        this.currentTrackPointInfo = this.TrackPointInfoList[i - 1];
      }
    });
  }
  /**
   * messageSendlisten轨迹线索
   */
  public async messageSendlisten(event: { keyCode: number }) {
    let item = this.currentTrackPointInfo;
    if (event.keyCode === 13) {
      let res = await getTrackPointEdit({ id: item.id, remark: item.remark });
      if (res.code == 0) {
        this.isShowText = false;
      }
      return;
    }
  }
  /**
   * getCaseRootPoint获得案件发生点位并在地图画点
   */
  public async getCaseRootPoint() {
    let res = await getUserCaseList({});
    if (res.code == 0) {
      let featureArr = res.data;
      this.caseList = featureArr;
      let hostUrl = this.mapConfig.hostUrl;
      let coords: Array<any> = [];

      featureArr.map(
        (v: {
          pointInfo: { latitude: any; longitude: any };
          caseName: any;
          id: string | number | undefined;
        }) => {
          let local = [v.pointInfo.latitude, v.pointInfo.longitude];
          const feature = new Feature({
            geometry: new Point(local),
          });
          // feature.setGeometryName(v.caseName)
          feature.setStyle(
            new Style({
              text: new Text({
                text: v.caseName,
              }),
            })
          );
          feature.setId(v.id);
          // routeLayer.getSource().addFeatures([feature]);
          coords.push(feature);
        }
      );
      const clusterSource = new Cluster({
        distance: 40, // 要素将被聚合在一起的像素距离，默认为20
        minDistance: 20, // 聚合块之间的最小像素距离，默认为零
        source: new VectorSource({
          features: coords,
        }),
      });
      this.clusters = new VectorLayer({
        source: clusterSource,
        zIndex: 1,
        style: function (feature, resolution) {
          var size = feature.get("features").length;
          //如果是聚合数为1也就是最底层的则是定位图标
          if (size == 1) {
            return new Style({
              image: new Icon({
                anchor: [0.5, 1],
                src: hostUrl + "/mapIcon/map_red.png",
                crossOrigin: "Anonymous",
              }),
              text: new Text({
                font: "12px Microsoft YaHei",
                text: feature.get("features")[0].style_.text_.text_,
                offsetX: 0,
                offsetY: -50,
                fill: new Fill({
                  color: "#fff",
                }),
                backgroundFill: new Fill({
                  color: "#3b79f6",
                }),
                padding: [8, 8, 8, 8],
              }),
            });
          } else {
            //这里设置聚合部分的样式
            return new Style({
              image: new Icon({
                anchor: [0.5, 1],
                src: hostUrl + "/mapIcon/map_red.png",
                crossOrigin: "Anonymous",
              }),
              text: new Text({
                font: "12px Microsoft YaHei",
                text: "共" + size.toString() + "起案件",
                offsetX: 0,
                offsetY: -50,
                fill: new Fill({
                  color: "#fff",
                }),
                backgroundFill: new Fill({
                  color: "#3b79f6",
                }),
                padding: [4, 4, 1, 4],
              }),
            });
          }
        },
      });
      this.map.addLayer(this.clusters);
    }
  }
  /**
   * getDeviceTree得到摄像头设备树
   */
  public async getDeviceTree() {
    this.caseList = JSON.parse(JSON.stringify(this.videoTapeList));
    this.getCameraList();
  }
  /**
   * getCameraList获得摄像头列表并在地图上画点
   */
  public async getCameraList() {
    let coords: Array<any> = [];
    let hostUrl = this.mapConfig.hostUrl;
    this.caseList.map((v) => {
      let local = [v.latitude, v.longitude];
      const feature = new Feature({
        geometry: new Point(local),
        checked: v.checked,
        id: v.deviceId,
      });
      feature.setStyle(
        new Style({
          text: new Text({
            text: v.name,
          }),
        })
      );
      feature.setId(v.deviceId + "," + v.checked);
      coords.push(feature);
      // routeLayer.getSource().addFeatures([feature]);
    });
    const clusterSource = new Cluster({
      distance: 40, // 要素将被聚合在一起的像素距离，默认为20
      minDistance: 20, // 聚合块之间的最小像素距离，默认为零
      source: new VectorSource({
        features: coords,
      }),
    });
    this.clusters = new VectorLayer({
      source: clusterSource,
      zIndex: 1,
      style: function (feature, resolution) {
        let size = feature.get("features").length;
        let featureArr = feature.get("features");
        let index = 0;
        featureArr.map((v: { id_: string }) => {
          let arr = typeof v.id_ == "string" ? v.id_.split(",") : v.id_;
          arr[1] === "true" ? index++ : "";
        });
        //如果是聚合数为1也就是最底层的则是定位图标
        if (size == 1) {
          return new Style({
            image: new Icon({
              anchor: [0.5, 1],
              src: hostUrl + "/mapIcon/cam.png",
              crossOrigin: "Anonymous",
            }),
            text: new Text({
              font: "15px Microsoft YaHei",
              text: index + "/" + size.toString(),
              offsetX: 0,
              offsetY: -33,
              fill: new Fill({
                color: "#ffffff",
              }),
            }),
          });
        } else {
          //这里设置聚合部分的样式
          return new Style({
            image: new Icon({
              anchor: [0.5, 1],
              src: hostUrl + "/mapIcon/cam.png",
              crossOrigin: "Anonymous",
            }),
            text: new Text({
              font: "15px Microsoft YaHei",
              text: index + "/" + size.toString(),
              offsetX: 0,
              offsetY: -33,
              fill: new Fill({
                color: "#ffffff",
              }),
            }),
          });
        }
      },
    });
    this.map.addLayer(this.clusters);
  }
  /**
   * cameraTextChecked点击地图摄像头展开设备树
   */
  public cameraTextChecked(item: any) {
    if (this.isActiveCircle) {
      return;
    }
    this.cameraTextShow = true;
    const oSpan: any = this.$refs.cameraChecked as any;
    let textInfo = new Overlay({
      position: item[0].values_.geometry.flatCoordinates, //设置位置
      element: oSpan,
      offset: [20, -50], //设置偏移
    });
    this.cameraCheckList = item;
    typeof item.id_ == "string" ? (item.id_ = item.id_.split(",")) : "";
    this.cameraCheckList.map((v) => {
      v.checked ? v.checked : (v.checked = false);
    });
    this.cameraCheckList.map((items) => {
      this.caseList.map((v) => {
        typeof items.id_ == "string" ? (items.id_ = items.id_.split(",")) : "";
        if (v.checked && items.id_[0] == v.deviceId) {
          items.checked = true;
        }
      });
    });
    this.map.addOverlay(textInfo);
  }
  /**
   * cameraCheckBox摄像头选中修改选取状态
   */
  public cameraCheckBox(item: any) {
    if (this.isActiveCircle) {
      this.getCameraVideoList.map((v) => {
        v.deviceId == item.deviceId ? (v.checked = !v.checked) : "";
      });
      return;
    }
    this.getCameraVideoList = [];
    typeof item.id_ == "string" ? (item.id_ = item.id_.split(",")) : "";
    item.checked = item.checked == false ? true : false;
    this.getCameraVideoList.push(item);
    console.log(this.getCameraVideoList);
  }
  /**
   * camerAddSelected摄像头加入已选
   */
  public camerAddSelected(getCameraVideoList?: any) {
    if (this.caseTime.start == undefined || this.caseTime.end == undefined) {
      this.$message.error("请选择时间后重新选择设备");
      return;
    }
    console.log(getCameraVideoList);

    if (this.isActiveCircle) {
      this.getCameraVideoList.map((item) => {
        item.checked
          ? this.caseList.map((v) =>
              v.deviceId == item.deviceId ? (v.checked = true) : ""
            )
          : this.caseList.map((v) =>
              v.deviceId == item.deviceId ? (v.checked = false) : ""
            );
      });
    } else {
      console.log(111);

      this.getCameraVideoList.map((item) => {
        item.checked
          ? this.caseList.map((v) =>
              v.deviceId == item.id_[0] ? (v.checked = true) : ""
            )
          : this.caseList.map((v) =>
              v.deviceId == item.id_[0] ? (v.checked = false) : ""
            );
      });
    }
    this.$emit("noticeChangeBox", this.getCameraVideoList, this.isActiveCircle);
    this.getCameraList();
  }
  /**
   * caseInfoText案件信息文本
   */
  public caseInfoText(item: any) {
    this.isCaseTextShow = true;
    item.length > 1
      ? (this.textId = item[this.caseInfoIndex].id_)
      : (this.textId = item[0].id_);
    this.caseList.map((v) => {
      if (v.id == this.textId) {
        v.occurrenceTime = v.occurrenceTime.substring(0, 19).replace("T", " ");
        this.caseInfo = v;
      }
    });
    const oSpan: any = this.$refs.caseInfoText as any;
    let textInfo = new Overlay({
      position: item[0].values_.geometry.flatCoordinates, //设置位置
      element: oSpan,
      offset: [-30, 10], //设置偏移
    });
    this.textInfo(this.textId);
    this.map.addOverlay(textInfo);
  }
  /**
   * caseInfoIndexAdd 案件信息序号++
   */
  public caseInfoIndexAddSum(isAdd: boolean) {
    let arrLength = this.singleclickFeatures.length;
    if (this.caseInfoIndex == arrLength - 1 && isAdd === true) {
      this.$message.error("已经到底了");
      return;
    } else if (this.caseInfoIndex == 0 && isAdd === false) {
      this.$message.error("已经到头了");
      return;
    }
    if (isAdd) {
      this.caseInfoIndex < arrLength - 1
        ? this.caseInfoIndex++
        : this.caseInfoIndex;
      this.caseInfoText(this.singleclickFeatures);
      return;
    }
    this.caseInfoIndex > 0 ? this.caseInfoIndex-- : this.caseInfoIndex;
    this.caseInfoText(this.singleclickFeatures);
  }
  /**
   * 地图点击拖拽禁止缩放
   */
  public drawStyle() {
    this.cameraTextShow = false;
    if (this.isActiveCircle) {
      let view = this.map.getView();
      view.setMaxZoom(this.mapConfig.maxZoom);
      view.setMinZoom(this.mapConfig.minZoom);
    } else {
      let view = this.map.getView();
      let curCenter = view.getCenter();
      this.mapConfig.zoom = 17;
      view.setZoom(this.mapConfig.zoom);
      view.setMaxZoom(this.mapConfig.zoom);
      view.setMinZoom(this.mapConfig.zoom);
      view.animate({
        center: curCenter,
      });
    }
    this.isActiveCircle = !this.isActiveCircle;
    this.map.getInteractions().forEach((element: any) => {
      if (element instanceof DragPan) {
        this.pan = element;
      }
    });

    this.isActiveCircle ? (this.cameraTextShow = false) : "";
    this.pan.setActive(!this.isActiveCircle);
  }
  /**
   * clickDown地图框选按下
   */
  public clickDown(event: { clientY: number; clientX: number }) {
    if (this.isActiveCircle == false) {
      return;
    }
    if (this.caseTime.start == undefined || this.caseTime.end == undefined) {
      this.$message.error("请选择时间后重新选择设备");
      return;
    }
    this.cameraTextShow = false;
    this.circlePointArray = { start: [], end: [] };
    let obj = this.$refs.rootmap as any;
    let objkk: any = this.$refs.circleElement;
    objkk.style.display = "block";
    this.leftY = event.clientY - obj.getBoundingClientRect().y;
    this.leftX = event.clientX - obj.getBoundingClientRect().x;
    objkk.style.width = 0;
    objkk.style.height = 0;
    objkk.style.top = this.leftY + "px";
    objkk.style.left = this.leftX + "px";
    this.startLocalY = event.clientY;
    this.startLocalX = event.clientX;
    this.isCircle = true;
  }
  /**
   * clickDown地图框选移动
   */
  public clickMove(event: { clientX: number; clientY: number }) {
    if (this.isCircle === false) {
      return;
    }
    let objkk: any = this.$refs.circleElement;
    let obj = this.$refs.rootmap as any;
    let wid: any = event.clientX - this.startLocalX;
    let hei: any = event.clientY - this.startLocalY;
    if (hei < 0 && wid < 0) {
      this.leftY = event.clientY - obj.getBoundingClientRect().y;
      this.leftX = event.clientX - obj.getBoundingClientRect().x;
      objkk.style.top = this.leftY + "px";
      objkk.style.left = this.leftX + "px";
    } else {
      if (wid < 0) {
        this.leftX = event.clientX - obj.getBoundingClientRect().x;
        objkk.style.left = this.leftX + "px";
      } else if (hei < 0) {
        this.leftY = event.clientY - obj.getBoundingClientRect().y;
        objkk.style.top = this.leftY + "px";
      }
    }
    objkk.style.width = Math.abs(wid) + "px";
    objkk.style.height = Math.abs(hei) + "px";
  }
  /**
   * clickDown地图框选抬起
   */
  public clickUp(event: { clientY: number; clientX: number }) {
    if (this.isCircle === false || this.isActiveCircle == false) return;
    this.isCircle = false;
    let objkk: any = this.$refs.circleElement;
    if (objkk.offsetHeight < 10 && objkk.offsetWidth < 10) return;
    objkk.style.display = "none";
    let startX = this.circlePointArray.start[1];
    let endX = this.circlePointArray.end[1];
    let startY = this.circlePointArray.start[0];
    let endY = this.circlePointArray.end[0];
    let oldArr: Array<any> = [];
    let newArr: any = [];
    this.caseList.map((v, i) => {
      switch (true) {
        case startY < v.latitude &&
          v.latitude < endY &&
          startX > v.longitude &&
          v.longitude > endX:
          oldArr.push(v);
          break;
        case startY < v.latitude &&
          v.latitude < endY &&
          startX < v.longitude &&
          v.longitude < endX:
          oldArr.push(v);
          break;
        case startY > v.latitude &&
          v.latitude > endY &&
          startX < v.longitude &&
          v.longitude < endX:
          oldArr.push(v);
          break;
        case startY > v.latitude &&
          v.latitude > endY &&
          startX > v.longitude &&
          v.longitude > endX:
          oldArr.push(v);
          break;
        default:
          break;
      }
    });
    oldArr.map((item) => {
      this.caseList.map((v) => {
        v.deviceId == item.deviceId ? newArr.push(v) : "";
      });
    });
    this.cameraCheckList = newArr;
    this.cameraCheckList.length != 0
      ? (this.cameraTextShow = true)
      : (this.cameraTextShow = false);
    this.getCameraVideoList = this.cameraCheckList;
    let obj = this.$refs.rootmap as any;
    let cameraChecked: any = this.$refs.cameraCheckeds;
    cameraChecked.style.top =
      event.clientY - obj.getBoundingClientRect().y + "px";
    cameraChecked.style.left =
      event.clientX - obj.getBoundingClientRect().x + "px";
    this.getCameraList();
  }
  /**
   * changeCase切换案件
   */
  public changeCase() {
    this.$emit("changeCase", this.caseInfo.id);
  }
  /**
   * getToImage截图并导出案件报告
   */
  public getToImage() {
    let _this = this;
    this.map.once("postcompose", function (event) {
      let maps: any = _this.$refs.rootmap;
      html2canvas(maps, {
        useCORS: true,
        logging: false,
        allowTaint: false,
        scale: window.devicePixelRatio,
      }).then((canvas) => {
        let newImageUrl = new Image();
        newImageUrl.src = canvas.toDataURL("png");
        canvas.width = maps.clientWidth;
        canvas.height = maps.clientHeight;
        let ctx: any = canvas.getContext("2d");
        newImageUrl.onload = async function () {
          let w = newImageUrl.width;
          let h = newImageUrl.height;
          ctx.drawImage(newImageUrl, 0, 0, w, h, 0, 0, w, h);
          let dataUrl = canvas.toDataURL("image/jpg");
          let res = await caseReports({
            mapScreenshots: dataUrl.substring(
              dataUrl.indexOf(",") + 1,
              dataUrl.length
            ),
            userType: sessionStorage.getItem("userType"),
          });
          // if (res.code == 0) {
          //   axios
          //     .get(_this.$getVideoUrl(res.data), { responseType: "blob" })
          //     .then(async (ress: any) => {
          //       let blob = new Blob([
          //         ress.data,
          //         { type: "application/msword" },
          //       ]);
          //       let downloadUrl = window.URL.createObjectURL(blob);
          //       const link = document.createElement("a");
          //       link.href = downloadUrl;
          //       let { caseName } = JSON.parse(
          //         (sessionStorage as any).getItem("cases")
          //       );
          //       link.setAttribute("download", caseName + ".docx");
          //       document.body.appendChild(link);
          //       link.click();
          //       link.remove();
          //       _this.$message.success("导出成功");
          //       let res = await getReportsTrackUrl({});
          //       if (res.code == 0) {
          //         _this.$store.commit(
          //           "routerList/SET_CASEREPORTURL",
          //           JSON.stringify(res.data)
          //         );
          //       }
          //       _this.$emit("changeIsMapGetImg", false);
          //     });
          // }
        };
      });
    });
    this.map.renderSync();
  }
  /**
   * openSelect打开多边形旋转
   */
  public async openSelect(type: string) {
    this.map.removeInteraction(this.drawBox);
    this.map.removeLayer(this.drawLayer);
    if (this.isCircleType === null) {
      this.isCircleType = type;
      await this.drawStyle();
    } else {
      if (this.isCircleType === type) {
        if (this.isCircleType === "allCircle") {
          this.getCameraVideoList.map((v) => {
            v.checked = false;
          });
          this.camerAddSelected(this.getCameraVideoList);
        }
        this.isCircleType = null;
        await this.drawStyle();
      } else {
        this.isCircleType = type;
      }
    }
    if (this.isActiveCircle == false) {
      return;
    }
    this.drawLayer = new VectorLayer({
      source: new VectorSource(),
    });
    var select = new Select({
      condition: never,
    });
    if (type === "frame") {
      this.drawBox = new Draw({
        source: this.drawLayer.getSource(),
        type: "Circle",
        geometryFunction: createBox(),
      });
    } else if (type === "allCircle") {
      let currentMapViewSize: Array<any> = this.map
        .getView()
        .calculateExtent(this.map.getSize());
      this.getCameraVideoList.length = 0;
      this.caseList.map((v) => {
        let s = this.compareNumber(v.latitude, currentMapViewSize[0]);
        let h = this.compareNumber(currentMapViewSize[2], v.latitude);
        let j = this.compareNumber(v.longitude, currentMapViewSize[1]);
        let w = this.compareNumber(currentMapViewSize[3], v.longitude);
        if (s && h && j && w) {
          v.checked = true;
          v.checked === true ? this.getCameraVideoList.push(v) : "";
        }
      });
      this.cameraCheckList = this.getCameraVideoList;

      const oSpan: any = this.$refs.cameraCheckeds as any;
      let textInfo = new Overlay({
        position: this.map.getView().getCenter(), //设置位置
        element: oSpan,
        offset: [20, -50], //设置偏移
      });
      this.map.on("moveend", () => {
        this.getCameraVideoList.length != 0
          ? (this.cameraTextShow = true)
          : (this.cameraTextShow = false);
        this.map.addOverlay(textInfo);
      });
      this.getCameraVideoList.length != 0
        ? (this.cameraTextShow = true)
        : (this.cameraTextShow = false);
      this.map.addOverlay(textInfo);

      return;
    } else if (type === "Circle") {
      this.drawBox = new Draw({
        source: this.drawLayer.getSource(),
        type: "Circle",
      });
    } else {
      this.drawBox = new Draw({
        source: this.drawLayer.getSource(),
        type: "Polygon",
      });
    }
    this.drawBox.on("drawstart", () => {
      this.cameraTextShow = false;
      select.getFeatures().clear();
      this.drawLayer.getSource().clear();
    });
    this.drawBox.on("drawend", (e) => {
      if (e.feature) {
        // 遍历被选中的要素
        var selected: any = [];
        // 获取多边形的外接矩形范围
        let polygon: any = e.feature.getGeometry();
        let extent = polygon.getExtent();
        // 查询外接矩形范围内的所有点
        this.clusters
          .getSource()
          .forEachFeatureIntersectingExtent(extent, function (feature) {
            var coordinates = feature.getGeometry().getCoordinates();
            // 判断该点是否在圆内部
            if (polygon.intersectsCoordinate(coordinates)) {
              selected.push(feature.values_);
            }
          });
        this.cameraCheckList = [];
        selected.map((item) => {
          this.caseList.map((v) => {
            item.features[0].get("id") == v.deviceId
              ? this.cameraCheckList.push(v)
              : "";
          });
        });
        this.getCameraVideoList = this.cameraCheckList;
        this.getCameraVideoList.length != 0
          ? (this.cameraTextShow = true)
          : (this.cameraTextShow = false);
        const oSpan: any = this.$refs.cameraCheckeds as any;
        let textInfo = new Overlay({
          position: e.feature.values_.geometry.flatCoordinates, //设置位置
          element: oSpan,
          offset: [20, -50], //设置偏移
        });
        this.map.addOverlay(textInfo);
        this.getCameraList();
      }
    });
    // 添加交互工具
    this.map.addInteraction(this.drawBox);
    this.map.addLayer(this.drawLayer);
    this.map.addInteraction(select);
  }
  public compareNumber(fnumber: any, snumber: any) {
    let strfnumber: string = fnumber.toString();
    let strfnumberArr = strfnumber.split(".");
    let intfnumber = strfnumberArr[0];
    let floatfnumber = strfnumberArr[1];
    let strsnumber: string = snumber.toString();
    let strsnumberArr = strsnumber.split(".");
    let intsnumber = strsnumberArr[0];
    let floatsnumber = strsnumberArr[1];
    let fnumberSliceArr: Array<any> = this.slicingStr(floatfnumber);
    let snumberSliceArr: Array<any> = this.slicingStr(floatsnumber);
    if (intfnumber > intsnumber) {
      return true;
    }
    if (fnumberSliceArr.length <= snumberSliceArr.length) {
      for (let i = 0; i < fnumberSliceArr.length; i++) {
        if (fnumberSliceArr[i] != snumberSliceArr[i]) {
          if (fnumberSliceArr[i] > snumberSliceArr[i]) {
            return true;
          } else {
            return false;
          }
        } else {
          return false;
        }
      }
    } else {
      for (let i = 0; i < snumberSliceArr.length; i++) {
        if (fnumberSliceArr[i] != snumberSliceArr[i]) {
          if (fnumberSliceArr[i] > snumberSliceArr[i]) {
            return true;
          } else {
            return false;
          }
        } else {
          return true;
        }
      }
    }
  }
  public slicingStr(q: any) {
    let newArr: Array<any> = [];
    for (let i = 0; i < q.length / 4; i++) {
      let kk = q.substring(i === 0 ? (i = 0) : i * 4, i * 4 + 4);
      newArr.push(kk);
    }
    return newArr;
  }
  mounted() {
    this.initMap();
    switch (true) {
      case this.isCaseInfo:
        this.getCaseRootPoint();
        break;
      case this.isAddLining:
        this.addLining();
        break;
      case this.isReportsLining:
        this.addLining();
        break;
      case this.isCamera:
        this.getDeviceTree();
        break;
      case this.isAddPoint:
        this.initPoint();
        break;
      default:
        break;
    }
  }
}
</script>

<style lang="scss" scoped>
.main {
  position: relative;
  height: 100%;
  width: 100%;
}

#map {
  height: 100%;
  width: 100%;
  position: relative;
  overflow: hidden;
}

.cameraCircle {
  position: absolute;
  top: 0;
  left: 5%;
  z-index: 99999;
  display: flex;

  li {
    padding: 5px 10px;
    border: 1px solid #fff;
    margin-right: 20px;
    cursor: pointer;

    &:hover {
      background-color: #1890ff;
    }
  }
}

.isCameraCircle {
  background-color: #1890ff;
}

/*隐藏ol的一些自带元素*/
.ol-attribution,
.ol-zoom {
  display: none;
}

.pointDetail {
  position: absolute;
  /* background-color: white; */
  bottom: 0;
  right: 0;
  color: #fff;
  white-space: nowrap;
  z-index: 999;

  ul {
    li {
      list-style-type: none;
    }
  }
}

.pointInfo {
  position: absolute;
  top: 0;
  left: 0;
  width: 360px;
  height: 150px;
  color: #fff;
  background-color: #fff;
  border-radius: 5px;
  padding: 10px;
  display: flex;
  overflow: hidden;

  .textImg {
    width: 150px;
    height: 150px;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #000;
    overflow: hidden;

    .textImgmessage {
      position: absolute;
      width: 100%;
      top: 50%;
      left: 0;
      color: #ffff;
      font-weight: 600;
      font-size: 28px;
      display: flex;
      justify-content: space-between;
      transform: translate(0, -50%);

      span {
        cursor: pointer;
      }
    }

    img {
      height: auto;
      width: auto;
      max-width: 100%;
      max-height: 100%;
    }
  }

  .textPro {
    padding: 0 0 0 10px;
    width: 50%;
    color: #000000;
    font-size: 14px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    .textTime {
      font-size: 14px;
      color: #262626;
    }

    .textPointName {
      font-size: 14px;
      color: #dbdbdb;
    }

    .textTextarea {
      textarea {
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        border: 1px solid rgba(204, 204, 204, 0.37);
        font-size: 14px;
        outline: none;

        &::placeholder {
          color: #dbdbdb;
          font-size: 14px;
        }
      }
    }
  }
}

.caseInfoText {
  width: 240px;
  background-color: #ffff;
  border-radius: 10px;
  padding: 10px 20px;
  display: flex;
  flex-direction: column;

  .caseTitle {
    // height: 30px;
    // line-height: 30px;
    font-weight: 700;
    font-size: 14px;
    color: #262626;
    display: flex;
    justify-content: space-between;

    .changeCaseIcon {
      display: flex;
      align-items: center;
      justify-content: space-around;

      .changeCaseIconLeft {
        width: 10px;
        height: 13px;
        background-image: url(../../assets/index/indexEnter/changeCaseLeftIcon.png);
        background-repeat: no-repeat;

        &:hover {
          background-image: url(../../assets/index/indexEnter/changeCaseRightIcon.png);
          transform-origin: 50% center;
          transform: rotate(180deg);
        }
      }

      .changeCaseIconRight {
        width: 10px;
        height: 13px;
        background-image: url(../../assets/index/indexEnter/changeCaseLeftIcon.png);
        transform-origin: 50% center;
        transform: rotate(180deg);
        background-repeat: no-repeat;

        &:hover {
          background-image: url(../../assets/index/indexEnter/changeCaseRightIcon.png);
          transform-origin: 50% center;
          transform: rotate(0deg) !important;
          background-repeat: no-repeat;
        }
      }
    }
  }

  .caseInfo {
    flex: 1;
    font-size: 14px;
    color: #8c8c8c;
    display: flex;
    flex-direction: column;

    .caseInfo_item {
      flex: 1;
      margin-bottom: 10px;
    }
  }
}

.circle {
  position: absolute;
  border: 1px solid var(--activedselected);
  background-color: rgba(255, 255, 255, 0.493);
  z-index: 998;
}

.cameraChecked {
  width: 180px;
  padding: 10px 5px;
  background-color: #fff;
  color: #000;
  border-radius: 1px;
  z-index: 999;
  position: absolute;

  ul {
    width: 100%;

    .cameraChecked_item {
      display: flex;
      align-items: center;
      z-index: 99;

      div {
        display: flex;
        margin-right: 5px;
        font-size: 14px;
        align-items: center;
        justify-content: center;

        input {
          display: inline-block;
        }
      }
    }
  }

  .camerButton {
    display: flex;
    justify-content: space-around;
    margin-top: 10px;
    white-space: nowrap;

    button {
      width: 40%;
      height: 32px;
      outline: none;
      border: 0;
      font-size: 12px;
    }

    .camerButtonCancel {
      border: 1px solid rgba(0, 0, 0, 0.15);
    }

    .camerButtonRequire {
      background-color: #1890ff;
      color: #fff;
    }
  }
}
</style>
