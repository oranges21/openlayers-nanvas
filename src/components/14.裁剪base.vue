<template>
  <div>
    <canvas
      ref="myCanvas"
      @mousedown="startDrag"
      @mousemove="drag"
      @mouseup="stopDrag"
    ></canvas>
    <img
      ref="myImage"
      :src="imageSrc"
      style="display: none"
      @load="onImageLoad"
    />
    <button
      @click="
        drawClippedImage(isDragging, {
          clipStartX,
          clipStartY,
          clipEndX,
          clipEndY,
        })
      "
    >
      裁剪
    </button>
    <button @click="drawRotatedImage(180)">旋转 45°</button>
    <button @click="drawMaskedImage('rgba(0,0,0,0.5)')">遮罩</button>
    <button @click="drawScaledImage(0.5, 0.5)">缩小 50%</button>
    <button @click="resetCanvas">重置</button>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";

const myCanvas = ref(null);
const myImage = ref(null);
const imageSrc = ref(
  "https://img2.baidu.com/it/u=1337068678,3064275007&fm=253&fmt=auto&app=120&f=JPEG?w=500&h=750"
);
let ctx = null;
let isDragging = false;
let startX, startY, currentX, currentY;
const clipStartX = ref(0);
const clipStartY = ref(0);
const clipEndX = ref(0);
const clipEndY = ref(0);
// 添加一个新的ref来保存备用画布
const offscreenCanvas = ref(null);

// 当图像加载时调用
function onImageLoad() {
  // 初始化画布大小
  myCanvas.value.width = myImage.value.width;
  myCanvas.value.height = myImage.value.height;
  // 同时初始化备用画布大小和内容
  if (offscreenCanvas.value) {
    offscreenCanvas.value.width = myCanvas.value.width;
    offscreenCanvas.value.height = myCanvas.value.height;
    const offscreenCtx = offscreenCanvas.value.getContext("2d");
    offscreenCtx.drawImage(myImage.value, 0, 0);
  }
  drawImage();
}

// 组件挂载后初始化画布
onMounted(() => {
  ctx = myCanvas.value.getContext("2d");
  // 初始化备用画布
  offscreenCanvas.value = document.createElement("canvas");
  offscreenCanvas.value.width = myCanvas.value.width;
  offscreenCanvas.value.height = myCanvas.value.height;
  const offscreenCtx = offscreenCanvas.value.getContext("2d");

  // 将原始图像绘制到备用画布
  offscreenCtx.drawImage(myImage.value, 0, 0);
});

// 在这里绘制原始图像
function drawImage() {
  ctx.drawImage(myImage.value, 0, 0);
}
// 开始拖拽
function startDrag(event) {
  // 获取画布的位置信息，方便找相对坐标
  const rect = myCanvas.value.getBoundingClientRect();
  //相当于使用画布的左上角为坐标原点
  startX = event.clientX - rect.left;
  startY = event.clientY - rect.top;
  isDragging = true;
  console.log("startDrag");
  console.log("startX", startX);
  console.log("startY", startY);
  drawImage(); // 清除任何之前的绘图并重绘图像
}

// 拖拽中
function drag(event) {
  // 如果为false则跳出
  if (!isDragging) return;
  //相当于使用画布的左上角为坐标原点
  const rect = myCanvas.value.getBoundingClientRect();
  currentX = event.clientX - rect.left;
  currentY = event.clientY - rect.top;
  console.log("Drag");
  console.log("currentX", currentX);
  console.log("currentY", currentY);
  drawClippedImage(true, {
    clipStartX: startX,
    clipStartY: startY,
    clipEndX: currentX,
    clipEndY: currentY,
  }); // 动态绘制裁剪框
}

// 停止拖拽
function stopDrag() {
  // 如果为false则跳出
  if (!isDragging) return;

  isDragging = false;
  // 保存裁剪区域坐标
  //给按钮传递的参数赋值
  clipStartX.value = startX;
  clipStartY.value = startY;
  clipEndX.value = currentX;
  clipEndY.value = currentY;
  console.log("stopDrag");
  drawClippedImage(true, {
    clipStartX: startX,
    clipStartY: startY,
    clipEndX: currentX,
    clipEndY: currentY,
  }); // 应用最终裁剪
}
// 裁剪
function drawClippedImage(
  isPreview,
  { clipStartX, clipStartY, clipEndX, clipEndY }
) {
  if (isPreview) {
    console.log("预览裁剪");
    // 先从备用画布复制原始图像到主画布
    ctx.clearRect(0, 0, myCanvas.value.width, myCanvas.value.height);
    ctx.drawImage(offscreenCanvas.value, 0, 0);
    ctx.strokeStyle = "green";
    // ctx.strokeReact(startX, startY, currentX - startX, currentY - startY);
    ctx.strokeRect(
      clipStartX,
      clipStartY,
      clipEndX - clipStartX,
      clipEndY - clipStartY
    );
  } else {
    ctx.clearRect(0, 0, myCanvas.value.width, myCanvas.value.height); // 清除画布
    ctx.save();
    ctx.beginPath();
    // 定义裁剪区域
    // ctx.rect(x坐标的值, y坐标的值,宽 , 高);
    ctx.rect(
      clipStartX,
      clipStartY,
      clipEndX - clipStartX,
      clipEndY - clipStartY
    );
    ctx.clip();

    // ctx.drawImage(myImage.value, 0, 0);
    // 在裁剪区域内重绘图像的部分
    ctx.drawImage(
      offscreenCanvas.value,
      clipStartX,
      clipStartY,
      clipEndX - clipStartX,
      clipEndY - clipStartY,
      clipStartX,
      clipStartY,
      clipEndX - clipStartX,
      clipEndY - clipStartY
    );
  }
  ctx.restore(); // 恢复之前保存的绘图状态
}
// function drawClippedImage(isPreview, clipRect = null) {
//   // 清除画布
//   ctx.clearRect(0, 0, myCanvas.value.width, myCanvas.value.height);

//   const rect = clipRect || {
//     x: startX,
//     y: startY,
//     width: currentX - startX,
//     height: currentY - startY,
//   };
//   if (isPreview) {
//     console.log("预览裁剪");
//     // 预览裁剪框
//     ctx.strokeStyle = "red";
//     ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
//   } else if (rect.width !== undefined && rect.height !== undefined) {
//     console.log("应用裁剪");
//     const { x, y, width, height } = rect;
//     // 先绘制原始图像，以确保我们从一个干净的状态开始
//     drawImage();
//     // 应用裁剪
//     ctx.save();
//     ctx.beginPath();
//     ctx.rect(x, y, width, height);
//     ctx.clip();
//     // 在裁剪区域内重绘图像的部分
//     ctx.drawImage(
//       myImage.value,
//       x,
//       y, // 源图像中的x, y坐标
//       width,
//       height, // 源图像中的宽度和高度
//       x,
//       y, // 目标画布上的x, y坐标
//       width,
//       height // 目标画布上的宽度和高度
//     );
//     ctx.restore();

//     // 更新画布尺寸为裁剪区域大小（可选）
//     // myCanvas.value.width = Math.abs(currentX - startX);
//     // myCanvas.value.height = Math.abs(currentY - startY);

//     // 重置坐标以便下一次裁剪
//     startX = currentX = undefined;
//     startY = currentY = undefined;
//   }
// }
// 旋转
function drawRotatedImage(angle) {
  ctx.clearRect(0, 0, myCanvas.value.width, myCanvas.value.height); // 清除画布
  const x = myCanvas.value.width / 2;
  const y = myCanvas.value.height / 2;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((angle * Math.PI) / 180); // 将角度转换为弧度
  ctx.drawImage(
    myImage.value,
    -myImage.value.width / 2,
    -myImage.value.height / 2
  );
  ctx.restore();
}

// 遮罩
function drawMaskedImage(maskColor) {
  ctx.clearRect(0, 0, myCanvas.value.width, myCanvas.value.height); // 清除画布
  ctx.globalCompositeOperation = "source-over";
  ctx.drawImage(myImage.value, 0, 0);

  ctx.globalCompositeOperation = "destination-in";
  ctx.fillStyle = maskColor;
  ctx.fillRect(0, 0, myCanvas.value.width, myCanvas.value.height);

  ctx.globalCompositeOperation = "source-over"; // 恢复默认的合成操作
}

// 缩放
function drawScaledImage(scaleX, scaleY) {
  ctx.clearRect(0, 0, myCanvas.value.width, myCanvas.value.height); // 清除画布
  ctx.save();
  ctx.scale(scaleX, scaleY);
  ctx.drawImage(myImage.value, 0, 0);
  ctx.restore();
}

// 重置画布回到原始图像
function resetCanvas() {
  drawImage();
}
</script>
