function docReady(fn) {
  // see if DOM is already available
  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    // call on next available tick
    setTimeout(fn, 1);
  } else {
    document.addEventListener("DOMContentLoaded", fn);
  }
}

docReady(MAIN);

// *************** GLOBALS ***************
let yHeight = null; // view area, usable screen height {set by function MAIN() }
let xWidth = null; // view area, usable screen width {set by function MAIN() }
let xPos = null; // mouse or touchpad, last known x position {set by function mouseMoving() }
let yPos = null; // mouse or touchpad, last known y position {set by function mouseMoving() }
let movingObject = null; // object that is being moved by mouse click or touch
let movingID = null; // id of object that is being moved by mouse click or touch
let movingCause = null; // 'cause' field of status bar at bottom of screen
let movingCurrentZindex = null; // used to set the height of moving object
let movingInitialZindex = null; // used to set the height of moving object
let legacyParent = null; // the original parent element object is being moved from
let newParent = null; // the new parent element object is being moved to
let dropzoneWidth = null; // calculated width of dropzones, based on screensize
let dropzoneHeight = null; // calculated height of dropzones, based on screensize
let movableWidth = null; // calculated width of movable(s), based on dropzoneWidth
let movableHeight = null; // calculated height of movable(s), based on dropzoneHeight
let mouseDownTouchStart = null; // true or false
let color12 = null; // index of 12 colors, [0] through [11]
let childZoneScale = null; // the scale factor of dropzone children 'fit to' area
let imgArrayInitial = null; // images initialized to this array
let imgArrayInPlay = null; // images are moved from imgArrayInitial to this image array while in play
let imgArrayOutOfPlay = null; // images are moved from imgArrayInPlay to this image array when out of play

function MAIN() {
  console.log("MAIN()");
  getViewSize();
  addColor12();
  addDropzoneElements();
  addMovableElements();
  initializeArrays();
  paintScreen("initialize");
}

function addColor12() {
  color12 = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
  // transparent
  // color12[0] = "transparent";
  // color12[1] = "transparent";
  // color12[2] = "transparent";
  // color12[3] = "transparent";
  // color12[4] = "transparent";
  // color12[5] = "transparent";
  // color12[6] = "transparent";
  // color12[7] = "transparent";
  // color12[8] = "transparent";
  // color12[9] = "transparent";
  // color12[10] = "transparent";
  // color12[11] = "transparent";

  // color spectrum
  color12[0] = "#ff0000";
  color12[1] = "#df2b00";
  color12[2] = "#bf5500";
  color12[3] = "#958000";
  color12[4] = "#6aaa00";
  color12[5] = "#557a00";
  color12[6] = "#007a55";
  color12[7] = "#00aa6a";
  color12[8] = "#008095";
  color12[9] = "#0055bf";
  color12[10] = "#002bdf";
  color12[11] = "#0000ff";

  // dull white
  // color12[0] = "#eeeeee";
  // color12[1] = "#eeeeee";
  // color12[2] = "#eeeeee";
  // color12[3] = "#eeeeee";
  // color12[4] = "#eeeeee";
  // color12[5] = "#eeeeee";
  // color12[6] = "#eeeeee";
  // color12[7] = "#eeeeee";
  // color12[8] = "#eeeeee";
  // color12[9] = "#eeeeee";
  // color12[10] = "#eeeeee";
  // color12[11] = "#eeeeee";
}

function addDropzoneElements() {
  let elementCount = null;
  let dropzoneID = null;
  for (elementCount = 1; elementCount < 13; elementCount++) {
    let createDIV = document.createElement("div");
    let tmpNode = document.getElementById("fullScreenDIV");
    tmpNode = tmpNode.appendChild(createDIV);
    if (elementCount < 10) {
      dropzoneID = "dropzone0" + elementCount;
    } else {
      dropzoneID = "dropzone" + elementCount;
    }
    tmpNode.setAttribute("id", dropzoneID);
    tmpNode.setAttribute("class", "dropzone");
    tmpNode.setAttribute("onmouseup", "onClickTouchEnd(event, 'mouse')");
    tmpNode.setAttribute("ontouchend", "onClickTouchEnd(event, 'touch')");
    document.getElementById("fullScreenDIV").appendChild(tmpNode);
    tmpNode.innerHTML = dropzoneID;
    tmpNode.style.zIndex = -1;
  }
}

function addMovableElements() {
  let elementCount = null;
  let movableID = null;
  let imageID = null;
  let imageFile = null;
  for (elementCount = 1; elementCount < 13; elementCount++) {
    let createDIV = document.createElement("div");
    let tmpNode = document.getElementById("fullScreenDIV");
    tmpNode = tmpNode.appendChild(createDIV);
    if (elementCount < 10) {
      movableID = "movable0" + elementCount;
      imageID = "imageMovable0" + elementCount;
      imageFile = "0" + elementCount + ".png";
    } else {
      movableID = "movable" + elementCount;
      imageID = "imageMovable" + elementCount;
      imageFile = elementCount + ".png";
    }
    tmpNode.setAttribute("id", movableID);
    tmpNode.setAttribute("class", "movable");
    document.getElementById("fullScreenDIV").appendChild(tmpNode);
    document.getElementById(movableID).style.backgroundColor =
      color12[elementCount - 1];
    document.getElementById(movableID).style.zIndex = 13 - elementCount;
    let createIMG = document.createElement("img");
    tmpNode = document.getElementById(movableID);
    tmpNode = tmpNode.appendChild(createIMG);
    tmpNode.setAttribute("id", imageID);
    tmpNode.setAttribute("class", "movableContent");
    tmpNode.setAttribute("src", "./images/" + imageFile);
    document.getElementById(movableID).appendChild(tmpNode);
  }
}

function getViewSize() {
  let viewSize = null;
  yHeight = window.innerHeight;
  xWidth = window.innerWidth;
  viewSize = [xWidth, yHeight];
  return viewSize;
}

function initializeArrays() {
  imgArrayInitial = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  imgArrayInPlay = [];
  imgArrayOutOfPlay = [];
  moveArrayElement(imgArrayInitial, imgArrayOutOfPlay, 4);
}

function mouseMoving(event, cause) {
  console.log("mouseMoving()");
  movingCause = cause;
  // update dropzone
  let dropzoneArray = null;
  resolveXYpos(event, cause);
  dropzoneArray = document.elementsFromPoint(xPos, yPos);
  newParent = resolveDropzoneArray(dropzoneArray);
  // drag movable if selected and mouse down
  if (movingObject && mouseDownTouchStart) {
    resolveXYpos(event, cause);
    movingObject.style.top =
      parseInt(yPos) - parseInt(movableHeight) / 2 + "px";
    movingObject.style.left =
      parseInt(xPos) - parseInt(movableWidth) / 2 + "px";
  }

  updateStatus();
}

function moveArrayElement(array1, array2, arrayIndex) {
  if (arrayIndex == "ALL") {
    // move all elements
    for (let i = 0; i < array1.length; i++) {
      array2.push(array1[i]);
      array1.splice(i, 1);
      i--;
    }
  } else {
    array2.push(array1[arrayIndex]);
    array1.splice(arrayIndex, 1);
  }
}

function onClickTouchEnd(event, cause) {
  let newParentChildCount = null;
  let movingChildCount = null;
  console.log("onClickTouchEnd(), Over:" + newParent.id);
  movingCause = cause;
  movingCurrentZindex = movingInitialZindex;
  mouseDownTouchStart = false;
  if (movingObject && newParent) {
    if (movingObject != newParent) {
      if (newParent.childElementCount > 0) {
        for (
          newParentChildCount = 0;
          newParentChildCount <= newParent.childElementCount;
          newParentChildCount++
        ) {
          if (
            newParent.childNodes[newParentChildCount].className == "movable"
          ) {
            legacyParent.appendChild(newParent.childNodes[newParentChildCount]);
          }
        }
      }
      newParent.appendChild(movingObject);
      movingObject.style.zIndex = movingCurrentZindex;
      if (movingObject.childElementCount > 0) {
        for (
          movingChildCount = 0;
          movingChildCount < movingObject.childElementCount;
          movingChildCount++
        ) {
          movingObject.childNodes[movingChildCount].style.zIndex =
            movingCurrentZindex;
        }
      }
      newParent.style.zIndex = -1;
      legacyParent.style.zIndex = -1;
      paintScreen("elementHasNewParent");
    }
  }
  // Zero GLOBALS
  xPos = null;
  yPos = null;
  movingID = null;
  movingObject = null;
  movableHeight = null;
  movableWidth = null;
  legacyParent = null;
  newParent = null;
  paintScreen("onClickTouchEnd");
}

function onClickTouchStart(event, cause) {
  console.log("onClickTouchStart()");
  movingCause = cause;
  mouseDownTouchStart = true;
  let movableArray = null;
  let movingChildCount = null;

  resolveXYpos(event, cause);
  movableArray = document.elementsFromPoint(xPos, yPos);
  movingObject = resolveMovable(movableArray);
  if (movingObject) {
    legacyParent = movingObject.parentNode;
    movingCurrentZindex = 500;
    movingInitialZindex = movingObject.style.zIndex;
    movingObject.style.zIndex = movingCurrentZindex;
    if (movingObject.childElementCount > 0) {
      for (
        movingChildCount = 0;
        movingChildCount < movingObject.childElementCount;
        movingChildCount++
      ) {
        movingObject.childNodes[movingChildCount].style.zIndex =
          movingCurrentZindex;
      }
      movingObject.parentNode.style.zIndex = movingCurrentZindex;
    }
    movingID = movingObject.id;
    movableHeight = movingObject.style.height;
    movableWidth = movingObject.style.width;
    console.log("Draging:" + movingID);
  }
}

function paintScreen(whyPaintScreen) {
  console.log("paintScreen('" + whyPaintScreen + "')");
  let dropSizeWidth = parseInt(xWidth / 2) + 1 + "px";
  let dropSizeHeight = parseInt(yHeight / 8) + 1 + "px";
  let dropID = "";
  let dropX = null;
  let dropY = null;
  let dropzoneIndex = null;

  // initialize dropzones
  yHeight = window.innerHeight;
  xWidth = window.innerWidth;
  childZoneScale = 0.9;
  document.getElementById("fullScreenDIV").style.height = yHeight + "px";
  document.getElementById("fullScreenDIV").style.width = xWidth + "px";
  document.getElementById("mouseTouchPosition").style.height = "25px";
  movingObject;
  document.getElementById("mouseTouchPosition").style.width = xWidth + "px";
  document.getElementById("mouseTouchPosition").style.top = yHeight - 20 + "px";
  document.getElementById("mouseTouchPosition").style.left = "0px";
  for (dropzoneIndex = 1; dropzoneIndex < 13; dropzoneIndex++) {
    if (dropzoneIndex < 10) {
      dropID = "dropzone0";
    } else {
      dropID = "dropzone";
    }
    dropID = dropID + dropzoneIndex;
    document.getElementById(dropID).style.width = dropSizeWidth;
    document.getElementById(dropID).style.height = dropSizeHeight;
    if (dropzoneIndex % 2) {
      dropX = 0 + "px";
    } else {
      dropX = parseInt(xWidth / 2) + 1 + "px";
    }
    dropY = Math.round(dropzoneIndex / 2) * parseInt(dropSizeHeight) + 1 + "px";
    document.getElementById(dropID).style.left = dropX;
    document.getElementById(dropID).style.top = dropY;
  }

  // initialize movables
  let movable = null;
  let movableSizeWidth =
    parseInt(parseInt(dropSizeWidth) * childZoneScale) + "px";
  let movableSizeHeight =
    parseInt(parseInt(dropSizeHeight) * childZoneScale) + "px";
  let movableID = null;
  let movableParent = null;
  let movableX = null;
  let movableY = null;
  let movableIndex = null;
  let diffLeft = null;
  let diffTop = null;

  for (movableIndex = 1; movableIndex < 13; movableIndex++) {
    if (movableIndex < 10) {
      movableID = "movable0";
    } else {
      movableID = "movable";
    }
    movableID = movableID + movableIndex;
    movable = document.getElementById(movableID);
    movableParent = movable.parentNode;

    movable.style.width = movableSizeWidth;
    movable.style.height = movableSizeHeight;

    if (movableParent.className == "fullScreen") {
      diffLeft =
        parseInt(movableParent.style.width) - parseInt(movable.style.width);
      diffTop =
        parseInt(document.getElementById("dropzone01").style.top) -
        parseInt(movable.style.height);
      diffLeft = parseInt(diffLeft / 2);
      diffTop = parseInt(diffTop / 2);
      movableX = diffLeft;
      movableY = diffTop;
      movable.style.left = movableX + "px";
      movable.style.top = movableY + "px";
    }
    if (movableParent.className == "dropzone") {
      diffLeft =
        parseInt(movableParent.style.width) - parseInt(movable.style.width);
      diffTop =
        parseInt(movableParent.style.height) - parseInt(movable.style.height);
      diffLeft = parseInt(diffLeft / 2);
      diffTop = parseInt(diffTop / 2);
      movableX = diffLeft + parseInt(movableParent.style.left);
      movableY = diffTop + parseInt(movableParent.style.top);
      movable.style.left = movableX + "px";
      movable.style.top = movableY + "px";
    }
    if (movable.childElementCount > 0) {
      movable.childNodes[0].style.height =
        movable.childNodes[0].parentNode.style.height;
    }
  }
  updateStatus();
}

function resolveDropzoneArray(dropzoneArray) {
  let dropzoneArrayIndex = null;
  let dropzoneItemReturned = null;

  for (
    dropzoneArrayIndex = 0;
    dropzoneArrayIndex < dropzoneArray.length;
    dropzoneArrayIndex++
  ) {
    if (dropzoneArray[dropzoneArrayIndex].className == "dropzone") {
      dropzoneItemReturned = dropzoneArray[dropzoneArrayIndex];
    }
  }
  if (dropzoneItemReturned == null) {
    if (!legacyParent) {
      legacyParent = document.getElementById("fullScreenDIV");
    }
    dropzoneItemReturned = legacyParent;
  }
  return dropzoneItemReturned;
}

function resolveMovable(movableArray) {
  let movableArrayIndex = null;
  let movableItemReturned = null;

  for (
    movableArrayIndex = 0;
    movableArrayIndex < movableArray.length;
    movableArrayIndex++
  ) {
    if (movableArray[movableArrayIndex].className == "movable") {
      movableItemReturned = movableArray[movableArrayIndex];
      movableArrayIndex = movableArray.length;
    }
  }
  return movableItemReturned;
}

function resolveXYpos(event, cause) {
  xPos = null;
  yPos = null;
  if (cause == "mouse") {
    xPos = parseInt(event.clientX);
    yPos = parseInt(event.clientY);
  }

  if (cause == "touch") {
    xPos = parseInt(event.changedTouches[0].clientX);
    yPos = parseInt(event.changedTouches[0].clientY);
  }
}

function updateStatus() {
  if (!newParent) {
    newParent = document.getElementById("fullScreenDIV");
  }
  let statusElement = document.getElementById("mouseTouchPosition");
  statusElement.innerHTML =
    movingCause +
    "(x=" +
    xPos +
    ", y=" +
    yPos +
    ") Dragging:" +
    movingID +
    " | Over:" +
    newParent.id;
}
