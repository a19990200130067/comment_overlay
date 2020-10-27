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
      element.height = (oldHeight - dY);// + 'px';
      element.width = (oldWidth - dX);// + 'px';
    }

    function dragMouseUp(e) {
      // stop moving when mouse button is released:
      document.onmouseup = prevMouseUp;
      document.onmousemove = prevMouseMove;
      if (element.onresize) {
        element.onresize();
      }
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
    header.style.boxShadow = "5px 5px 5px 10px #ffffff";
    header.style.backgroundColor = "#303030";
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
    canvas.height = screen.height / 2;
    canvas.width = screen.width / 2;
    canvas.style.opacity = "1.0";
    //canvas.style.backgroundColor = "black";
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
    top.style.fontSize = "16px";
    top.style.position = "fixed";
    top.style.zIndex = "255";
    top.style.opacity = "1.0";
    top.style.top = `${screen.height / 4}px`;
    top.style.left = `${screen.width / 4}px`;
    top.style.pointerEvents = "none";
    top.style.boxShadow = "-1px -1px 3px 2px #dddddd";
    //top.style.outline = "2px solid #505050";

    // add a handler for hiding / reshowing;
    header.style.transition = "opacity 1s";
    resize_btn.style.transition = "opacity 1s";
    top.style.transition = "opacity 1s";
    function showHeaderAndResize() {
      header.style.opacity = 1.0;
      resize_btn.style.opacity = 1.0;
      //top.style.outline = "2px solid #505050";
      top.style.boxShadow = "-1px -1px 3px 2px #dddddd";
    }

    function hideHeaderAndResize() {
      header.style.opacity = 0.0;
      resize_btn.style.opacity = 0.0;
      top.style.outline = "none";
      top.style.boxShadow = "none";
    }

    header.onmouseover = showHeaderAndResize;
    header.onmouseout = hideHeaderAndResize;
    resize_btn.onmouseover = showHeaderAndResize;
    resize_btn.onmouseout = hideHeaderAndResize;

    return top;
  }

  function numToHexRgb(n) {
    var s = Number(n).toString(16);
    while (s.length < 6) {
      s = '0' + s;
    }
    return "#" + s;
  }

  function getBorderColor(n) {
    var r = n >> (8 * 2);
    var g = (n & 0x00ffff) >> 8;
    var b = n & 0x0000ff;
    var grayscale = (r + g + b) / 3;
    if (grayscale > 255 / 2) {
      return "#000000";
    } else {
      return "#ffffff";
    }
  }

  // assuming comments are sorted by time by caller
  function startOverlay(comments) {
    var canvas = document.getElementById("comment_overlay_canvas");
    if (!canvas) {
      console.error("Could not find canvas to draw");
      return;
    }

    var video_tags = document.getElementsByTagName("video");
    var video_tag = null;
    if (video_tags.length > 1) {
      for (var i = 0; i < video_tags.length; i++) {
        if (video_tags[i].currentSrc != "") {
          video_tag = video_tags[i];
        }
      }
    } else if (video_tags.length == 1) {
      video_tag = video_tags[0];
    } else {
      console.log("comment_overlay: no video tag found");
    }

    var max_comment_on_screen = 99999999;
    var font_px = 25;
    var ctx = canvas.getContext("2d");
    ctx.font = `bold ${font_px}px -apple-system,BlinkMacSystemFont,Helvetica Neue,Helvetica,Arial,PingFang SC,Hiragino Sans GB,Microsoft YaHei,sans-serif`;
    ctx.textAlign = "left";
    var horizonal_margin = 2 * font_px;
    canvas.onresize = resizeHandler;

    var active_comments = [];
    var curr_time = 0;
    var comment_idx = 0;

    var lane_margin = 10;
    var lane_occupied = [];
    var lane_queueing = [];
    var lane_max_queueing = 0;
    var num_lanes = Math.floor(canvas.height / (font_px + lane_margin)) - 1;

    var top_occupied = []
    for (var i = 0; i < num_lanes; i++) {
      top_occupied.push(false);
      lane_occupied.push(null);
      lane_queueing.push(0);
    }
    
    var prev_time_stamp = performance.now();

    requestAnimationFrame(updateComments);

    function initVars() {
      active_comments = [];
      comment_idx = 0;

      lane_occupied = [];
      lane_queueing = [];
      num_lanes = Math.floor(canvas.height / (font_px + lane_margin)) - 1;

      top_occupied = []
      for (var i = 0; i < num_lanes; i++) {
        top_occupied.push(false);
        lane_occupied.push(null);
        lane_queueing.push(0);
      }
    }

    function resizeHandler() {
      var canvas = document.getElementById("comment_overlay_canvas");
      if (!canvas) {
        return;
      }
      var ctx = canvas.getContext("2d");
      ctx.font = `bold ${font_px}px -apple-system,BlinkMacSystemFont,Helvetica Neue,Helvetica,Arial,PingFang SC,Hiragino Sans GB,Microsoft YaHei,sans-serif`;
      ctx.textAlign = "left";
      num_lanes = Math.floor(canvas.height / (font_px + lane_margin)) - 1;
      top_occupied.length = num_lanes;
      lane_occupied.length = num_lanes;
      lane_queueing.length = num_lanes;
    }

    function updateComments(time_stamp) {
      var canvas = document.getElementById("comment_overlay_canvas");
      if (!canvas) {
        return;
      }

      var dt = time_stamp - prev_time_stamp;
      prev_time_stamp = time_stamp;
      if (video_tag) {
        curr_time = video_tag.currentTime - dt / 1000;
        if (video_tag.paused) {
          var prev_video_time = video_tag.currentTime;
          var orig_onplay = video_tag.onplay;
          video_tag.onplay = function (e) {
            // update curr_time, and clear active comments
            curr_time = video_tag.currentTime;
            if (Math.abs(curr_time - prev_video_time) > 1.0) {
              initVars();
            }
            // search for starting point.
            // using linear scan here. Could use binary search for better performance
            while (comment_idx < comments.length && curr_time >= comments[comment_idx]["time"]) {
              comment_idx++;
            }
            prev_time_stamp = performance.now();
            requestAnimationFrame(updateComments);
            video_tag.onplay = orig_onplay;
            if (orig_onplay) {
              orig_onplay(e);
            }
          }
          return;
        }
      }

      var ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      var free_lane_idx = 0;
      while (comment_idx < comments.length && curr_time >= comments[comment_idx]["time"]) {
        if (active_comments.length > max_comment_on_screen) {
          comment_idx++;
          continue;
        }
        var ce = comments[comment_idx];
        var new_entry = {};
        new_entry.text = ce["text"];
        new_entry.color = numToHexRgb(ce["color"]);
        new_entry.borderColor = getBorderColor(ce["color"]);
        new_entry.type = "roll";
        if (ce["displayMode"] == 5) {
          new_entry.type = "top";
        }
        new_entry.left = canvas.width;
        // scale speed according to text length (not accurate though...)
        var text_len = new_entry.text.length * font_px;
        new_entry.speed = ce["speed"];// * (text_len + canvas.width) / canvas.width
        new_entry.countdown = 999;

        new_entry.width = text_len;
        new_entry.height = font_px;

        if (new_entry.type == "top") {
          new_entry.countdown = canvas.width / new_entry.speed * 1000 / 2.0;
          new_entry.left = canvas.width / 2 - text_len / 2;
        }

        // find a position for the comment
        var prev_free_idx = free_lane_idx;
        if (new_entry.type == "top") {
          do {
            if (!top_occupied[free_lane_idx]) {
              break;
            }
            free_lane_idx = (free_lane_idx + 1) % num_lanes;
          } while (free_lane_idx != prev_free_idx);
          if (top_occupied[free_lane_idx]) {
            comment_idx++;
            continue;
          }
          top_occupied[free_lane_idx] = true;
        } else {
          do {
            if (!lane_occupied[free_lane_idx]) {
              break;
            }
            free_lane_idx = (free_lane_idx + 1) % num_lanes;
          } while (free_lane_idx != prev_free_idx);
          if (lane_occupied[free_lane_idx]) {
            free_lane_idx = Math.floor(Math.random() * num_lanes);
            if (true || lane_queueing[free_lane_idx] >= lane_max_queueing) {
              // skip this one
              comment_idx++;
              continue;
            }
            /*
            lane_queueing[free_lane_idx]++;
            lane_occupied[free_lane_idx].occupying = -1;
            new_entry.speed = lane_occupied[free_lane_idx].speed;
            new_entry.left += (lane_occupied[free_lane_idx].text.length * font_px) - (canvas.width - lane_occupied[free_lane_idx]);
            */
          }
          lane_occupied[free_lane_idx] = new_entry;
        }
        new_entry.top = free_lane_idx * (font_px + lane_margin) + (lane_margin / 2) + font_px;
        new_entry.occupying = free_lane_idx;
        active_comments.push(new_entry);
        comment_idx++;
      }
      /*
      for (var i = 0; i < active_comments.length; i++) {
        var entry = active_comments[i];
        ctx.clearRect(entry.left, entry.top, entry.width, entry.height);
      }
      */
      for (var i = 0; i < active_comments.length; i++) {
        var entry = active_comments[i];
        ctx.fillStyle = entry.color;
        ctx.strokeStyle = entry.borderColor;
        ctx.fillText(entry.text, entry.left, entry.top);
        ctx.strokeText(entry.text, entry.left, entry.top);

        switch (entry.type) {
          case "top":
            entry.countdown -= dt;
            break;
          case "roll":
            entry.left -= dt * entry.speed / 1000.0;
            if (entry.occupying >= 0 && entry.left + entry.text.length * font_px + horizonal_margin < canvas.width) {
              if (lane_occupied.length > entry.occupying) {
                lane_occupied[entry.occupying] = null;
                if (lane_queueing[entry.occupying] > 0) {
                  lane_queueing[entry.occupying]--;
                }
              }
              entry.occupying = -1;
            }
            break;
        }
      }

      var delta = 0;
      for (var i = 0; i < active_comments.length; i++) {
        var e = active_comments[i];
        var should_remove = false;
        if (e.countdown < 0) {
          should_remove = true;
        } else if (e.left + e.text.length * font_px < 0) {
          should_remove = true;
        }

        if (should_remove && e.occupying >= 0) {
          if (e.type == "roll" && lane_occupied.length > entry.occupying) {
            lane_occupied[e.occupying] = null;
          }
          if (e.type == "top" && top_occupied.length > entry.occupying) {
            top_occupied[e.occupying] = false;
          }
        }
        if (should_remove) {
          delta++;
        } else if (delta > 0) {
          active_comments[i - delta] = active_comments[i];
        }
      }
      active_comments.length -= delta;
      curr_time += dt / 1000.0;
      requestAnimationFrame(updateComments);
    }
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
    comments.sort(function (a, b) { return a["time"] - b["time"]; });
    startOverlay(comments);
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