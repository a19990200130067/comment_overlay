(function() {
  /**
   * Check and set a global guard variable.
   * If this content script is injected into the same page again,
   * it will do nothing next time.
   */
  if (window.hasRun) {
    return;
  }
  window.hasRun = true;

  function createSvgElement(id, d, extra_param=null) {
    var svg_ele = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg_ele.id = id;
    svg_ele.setAttribute("width", "3em");
    svg_ele.setAttribute("height", "3em");
    svg_ele.setAttribute("class", "bi bi-arrows-move");
    svg_ele.setAttribute("viewBox", "0 0 16 16");
    svg_ele.setAttribute("fill", "#ddd");
    svg_ele.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns", "http://www.w3.org/2000/xmlns/");
    var svg_path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    svg_path.setAttribute("fill-rule", "evenodd");
    svg_path.setAttribute("d", d);
    if (extra_param) {
      for (var k in extra_param) {
        svg_path.setAttribute(k, extra_param[k]);
      }
    }
    svg_ele.appendChild(svg_path);
    return svg_ele;
  }

  function setDragAnchor(element, anchor) {
    var prevX = 0;
    var prevY = 0;
    var prevMouseUp = null;
    var prevMouseMove = null;
    anchor.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
      e = e || window.event;
      e.preventDefault();
      // get the mouse cursor position at startup:
      prevX = e.clientX;
      prevY = e.clientY;
      prevMouseUp = document.onmouseup;
      prevMouseMove = document.onmousemove;
      document.onmouseup = dragMouseUp;
      // call a function whenever the cursor moves:
      document.onmousemove = dragMouseMove;
    }

    function dragMouseMove(e) {
      e = e || window.event;
      e.preventDefault();
      // calculate the new cursor position:
      var dX = prevX - e.clientX;
      var dY = prevY - e.clientY;
      prevX = e.clientX;
      prevY = e.clientY;
      // set the element's new position:
      element.style.top = (element.offsetTop - dY) + "px";
      element.style.left = (element.offsetLeft - dX) + "px";
    }

    function dragMouseUp(e) {
      // stop moving when mouse button is released:
      document.onmouseup = prevMouseUp;
      document.onmousemove = prevMouseMove;
    }
  }

  function setResizeAnchor(element, anchor) {
    var prevX = 0;
    var prevY = 0;
    var oldWidth = 0;
    var oldHeight = 0;
    var prevMouseUp = null;
    var prevMouseMove = null;
    anchor.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
      e = e || window.event;
      e.preventDefault();
      // get the mouse cursor position at startup:
      prevX = e.clientX;
      prevY = e.clientY;
      oldWidth = parseInt(window.getComputedStyle(element).width);
      oldHeight = parseInt(window.getComputedStyle(element).height);
      prevMouseUp = document.onmouseup;
      prevMouseMove = document.onmousemove;
      document.onmouseup = dragMouseUp;
      // call a function whenever the cursor moves:
      document.onmousemove = dragMouseMove;
    }

    function dragMouseMove(e) {
      e = e || window.event;
      e.preventDefault();
      // calculate the new cursor position:
      var dX = prevX - e.clientX;
      var dY = prevY - e.clientY;
      // set the element's new position:
      element.style.height = (oldHeight - dY) + 'px';
      element.style.width = (oldWidth - dX) + 'px';
    }

    function dragMouseUp(e) {
      // stop moving when mouse button is released:
      document.onmouseup = prevMouseUp;
      document.onmousemove = prevMouseMove;
    }
  }

  function constructOverlay() {
    var top = document.createElement("div");
    top.id = "comment_overlay_canvas_top";

    // header is what we use to drag & move the overlay
    var header = document.createElement("div");
    header.id = "comment_overlay_canvas_header";
    header.style.opacity = "1.0";
    header.style.height = "3em";
    header.style.width = "100%";
    header.style.boxShadow = "0 0 5px #fff";
    header.style.backgroundColor = "#202020";
    header.style.borderRadius = "5px";
    header.style.pointerEvents = "auto";

    /*
     * bootstrap icons:
     * https://icons.getbootstrap.com/icons/grip-vertical/
     * https://icons.getbootstrap.com/icons/x/
     */
    var header_drag = createSvgElement("comment_overlay_canvas_drag", "M2 8a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm0-3a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm3 3a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm0-3a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm3 3a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm0-3a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm3 3a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm0-3a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm3 3a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm0-3a1 1 0 1 1 0 2 1 1 0 0 1 0-2z");
    header_drag.style.position = "relative";
    header_drag.style.left = "50%";
    header_drag.style.marginLeft = "auto";
    header_drag.style.marginRight = "auto";
    header_drag.style.transform = "translateX(-50%)";
    header_drag.style.cursor = "move";
    setDragAnchor(top, header_drag);


    var close_btn = createSvgElement("comment_overlay_canvas_close", "M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z");
    close_btn.style.float = "right";
    close_btn.style.cursor = "pointer";
    close_btn.onclick = function () {removeExistingOverlay();};

    header.appendChild(header_drag);
    header.appendChild(close_btn);

    // The canvas for drawing & animating comments
    var canvas = document.createElement("canvas");
    canvas.id = "comment_overlay_canvas";
    canvas.style.height = `${screen.height / 2}px`;
    canvas.style.width = `${screen.width / 2}px`;
    canvas.style.opacity = "0.2";
    canvas.style.backgroundColor = "black";
    canvas.style.float = "left";

    top.appendChild(header);
    top.appendChild(canvas);

    var resize_btn = createSvgElement(
      "comment_overlay_canvas_resize",
      "M7 11.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5z",
      {"transform": "rotate(-45 0 0) translate(-8 4)"}
    );
    resize_btn.style.position = "absolute";
    resize_btn.style.left = "100%";
    resize_btn.style.top = "100%";
    resize_btn.style.transform = "translate(-100%, -100%)";
    resize_btn.style.cursor = "nwse-resize";
    resize_btn.style.backgroundColor = "#202020";
    resize_btn.style.pointerEvents = "auto";
    top.appendChild(resize_btn);
    setResizeAnchor(canvas, resize_btn);

    // setup styles for dragging
    top.style.position = "fixed";
    top.style.zIndex = "255";
    top.style.opacity = "1.0";
    top.style.top = `${screen.height / 4}px`;
    top.style.left = `${screen.width / 4}px`;
    top.style.pointerEvents = "none";
    top.style.border = ".5px solid #505050";
    top.style.borderBottom = "none";

    return top;
  }

  /**
   * Given a URL to a beast image, remove all existing beasts, then
   * create and style an IMG node pointing to
   * that image, then insert the node into the document.
   */
  function insertOverlay(comments) {
    removeExistingOverlay();
    var overlay = constructOverlay();
    document.body.appendChild(overlay);
  }

  /**
   * Remove every beast from the page.
   */
  function removeExistingOverlay() {
    let existingCanvas = document.getElementById("comment_overlay_canvas_top");
    if (existingCanvas) {
      existingCanvas.remove();
    }
  }

  /**
   * Listen for messages from the background script.
  */
  browser.runtime.onMessage.addListener((message) => {
    if (message.command === "start_overlay") {
      insertOverlay(message.comments);
    } else if (message.command === "reset") {
      removeExistingOverlay();
    }
  });
})();