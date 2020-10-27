function openTab(evt, tabName) {
  var i, tabcontent, tablinks;
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }
  document.getElementById(tabName).style.display = "block";
  evt.target.className += " active";
}

function parseBilibiliDanmaku(xmlContent) {
  var all_danmaku = xmlContent.getElementsByTagName("d");
  var result = [];
  /*
    Example danmaku entry:
    <d p="1011.13300,1,25,16777215,1603274998,0,3b567c19,39915525534384133">Some Text Here</d>
    The "p" attributes should contain all the necessary info we need
    List of things we know so far:
      0: the first number is the time it should appear in video, in seconds
      1: second one is (likely) the display method. 1 for rolling (right to left); 5 for display on top
      2: third one (25 here) is unknown for now
      3: the next one (16777215) is the color code
   */
  var i;
  for (i = 0; i < all_danmaku.length; i++) {
    var entry = {}
    var attrs = all_danmaku[i].getAttribute('p');
    attrs = attrs.replace(/\s/g, '').split(',');
    entry["time"] = parseFloat(attrs[0]);
    entry["displayMode"] = parseInt(attrs[1]);
    entry["color"] = parseInt(attrs[3]);
    entry["speed"] = 150; // pixel per second
    entry["text"] = all_danmaku[i].childNodes[0].textContent;
    result.push(entry);
  }
  return result;
}

function fetchCommentsFromBili() {
  var cid = document.getElementById("cid_input").value;
  var bvid = document.getElementById("bvid_input").value;
  var mdss = document.getElementById("mdss_input").value;
  var aid = document.getElementById("aid_input").value;

  if (cid == "" && bvid != "") {
    var request = new XMLHttpRequest();
    request.open('GET', `https://api.bilibili.com/x/player/pagelist?bvid=${bvid}`, false);
    request.send(null);
    if (request.status === 200) {
      var reply = JSON.parse(request.responseText);
      var video_no = parseInt(document.getElementById("bvid_video_no").value) - 1;
      if (isNaN(video_no) || video_no < 0) {
        video_no = 0;
      }
      if (video_no < reply.data.length) {
        cid = reply.data[video_no].cid;
      }
    }
  } else if (cid == "" && mdss != "") {
    var season_id = "";
    var video_no = parseInt(document.getElementById("mdss_video_no").value) - 1;
    if (isNaN(video_no) || video_no < 0) {
      video_no = 0;
    }
    switch (mdss.slice(0, 2)) {
      case "md":
        {
          var media_id = mdss.slice(2);
          var request = new XMLHttpRequest();
          request.open('GET', `https://api.bilibili.com/pgc/review/user?media_id=${media_id}`, false);
          request.send(null);
          if (request.status === 200) {
            var reply = JSON.parse(request.responseText);
            season_id = reply.result.media.season_id;
          }
        }
        break;
      case "ss":
        season_id = mdss.slice(2);
        break;
    }
    var request = new XMLHttpRequest();
    request.open('GET', `https://api.bilibili.com/pgc/web/season/section?season_id=${season_id}`, false);
    request.send(null);
    if (request.status === 200) {
      var reply = JSON.parse(request.responseText);
      if (video_no < reply.result.main_section.episodes.length) {
        cid = reply.result.main_section.episodes[video_no].cid;
      }
    }
  } else if (cid == "" && aid != "") {
    // TODO: convert aid to cid
  }

  if (cid == "") {
    return [];
  } else {
    var request = new XMLHttpRequest();
    request.open('GET', `https://comment.bilibili.com/${cid}.xml`, false);  // `false` makes the request synchronous
    request.send(null);
    if (request.status === 200) {
      var comments = parseBilibiliDanmaku(request.responseXML);
      return comments;
    } else {
      return [];
    }
  }
}

/**
 * Listen for clicks on the buttons, and send the appropriate message to
 * the content script in the page.
 */
function listenForClicks() {
    document.addEventListener("click", (e) => {
    
    function start_overlay(tabs) {
      var comments = [];
      var comment_source = "";
      tablinks = document.getElementsByClassName("tablinks");
      for (i = 0; i < tablinks.length; i++) {
        if (tablinks[i].classList.contains("active")) {
          comment_source = tablinks[i].firstChild.nodeValue;
          break;
        }
      }
      
      if (comment_source == "Bilibili") {
        comments = fetchCommentsFromBili();
      } else if (comment_source == "AcFun") {

      } else if (comment_source == "Niconico") {

      }

      if (comments.length == 0) {
        return;
      }
      outputPrintlnHTML(`Got <span style="color:#657b83;">${comments.length}</span> comments from <span style="color:#93a1a1;">${comment_source}</span>`);
      browser.tabs.sendMessage(tabs[0].id, {
        command: "start_overlay",
        comments: comments,
      });
    }

    function reset(tabs) {
      browser.tabs.sendMessage(tabs[0].id, {
        command: "reset",
      });
    }

    /**
     * Just log the error to the console.
     */
    function reportError(error) {
      console.error(`Error: ${error}`);
    }

    if (e.target.classList.contains("tablinks")) {
      openTab(e, e.target.firstChild.nodeValue);
    } else if (e.target.id == "start") {
      browser.tabs.query({active: true, currentWindow: true})
        .then(start_overlay)
        .catch(reportError);
    } else if (e.target.id == "reset") {
      browser.tabs.query({active: true, currentWindow: true})
        .then(reset)
        .catch(reportError);
    }
  });
}

function tryRestoreState() {
  return browser.storage.local.get("comment_overlay_state")
  .then(function (e) {
    if (!("comment_overlay_state" in e)) {
      return;
    }
    var data = e.comment_overlay_state.bilibili_data;
    var input_src = ["cid", "bvid","mdss", "aid"];
    var video_no_src = ["bvid","mdss", "aid"];
    input_src.map(function (src) {
      var id = src + "_input";
      if (id in data) {
        document.getElementById(id).value = data[id];
      }
    });
    video_no_src.map(function (src) {
      var id = src + "_video_no";
      if (id in data) {
        document.getElementById(id).value = data[id];
      }
    });
  })
  .then(function () {
    var output = document.getElementById("output");
    if (output && output.restoreFromStorage) {
      return output.restoreFromStorage();
    }
  });
}

function setUnloadHandler() {
  window.addEventListener("unload", async function () {
    var input_src = ["cid", "bvid","mdss", "aid"];
    var video_no_src = ["bvid","mdss", "aid"];
    var bilibili_data = {};
    input_src.map(function (src) {
      var id = src + "_input";
      bilibili_data[id] = document.getElementById(id).value;
    });
    video_no_src.map(function (src) {
      var id = src + "_video_no";
      var dep_id = src + "_input";
      if (bilibili_data[dep_id] && bilibili_data[dep_id] != "") {
        bilibili_data[id] = document.getElementById(id).value;
      }
    });
    var comment_overlay_state = {};
    comment_overlay_state.bilibili_data = bilibili_data;
    var output_data = document.getElementById("output").storageState();
    comment_overlay_state.output_data = output_data;
    await browser.storage.local.set({comment_overlay_state})
    .then(function () {
      console.log("OK");
    });
    //if (output.beforeUnload) {
      //await output.beforeUnload();
    //}
  });
}

function setupOutput() {
  var output = document.getElementById("output");
  output.lines = [];
  var max_lines = 8;
  for (var i = 0; i < max_lines; i++) {
    output.lines.push("");
  }
  var line_idx = 0;
  function refreshOutput() {
    var html = "";
    for (var i = 0; i < max_lines; i++) {
      html += output.lines[i] + "<br>";
    }
    output.innerHTML = html;
  }

  output.storageState = function () {
    return { "max_lines": max_lines, "lines": output.lines};
  }

  output.beforeUnload = function () {
    var output_data = {}
    output_data.max_lines = max_lines;
    output_data.lines = output.lines;
    return browser.storage.local.set({ output_data })
    .then(function () {
      console.log("OK");
    })
  };

  output.restoreFromStorage = function () {
    return browser.storage.local.get("comment_overlay_state")
    .then (function (r) {
      if (!("comment_overlay_state" in r)) {
        return;
      }
      var output_data = r.comment_overlay_state.output_data;
      max_lines = output_data.max_lines;
      output.lines = Array.from(output_data.lines);
      refreshOutput();
      line_idx = 0;
      while (line_idx < max_lines && output.lines[line_idx] != "") {
        line_idx++;
      }
    });
  };

  output.printlnHTML = function (msg) {
    if (line_idx < max_lines) {
      output.lines[line_idx] = msg;
      line_idx++;
    } else {
      output.lines.shift();
      output.lines.push(msg);
      line_idx = max_lines;
    }
    refreshOutput();
  };
}

function outputPrintln(msg) {
  var output = document.getElementById("output");
  if (output && output.printlnHTML) {
    output.printlnHTML(escape(msg));
  }
}

function outputPrintlnHTML(msg) {
  var output = document.getElementById("output");
  if (output && output.printlnHTML) {
    output.printlnHTML(msg);
  }
}

/**
 * There was an error executing the script.
 * Display the popup's error message, and hide the normal UI.
 */
function reportExecuteScriptError(error) {
  document.querySelector("#popup-content").classList.add("hidden");
  document.querySelector("#error-content").classList.remove("hidden");
  console.error(`Failed to execute content script: ${error.message}`);
}

/**
 * When the popup loads, inject a content script into the active tab,
 * and add a click handler.
 * If we couldn't inject the script, handle the error.
 */
browser.tabs.executeScript({file: "/content_scripts/overlay_canvas.js"})
.then(setupOutput)
.then(tryRestoreState)
.then(setUnloadHandler)
.then(listenForClicks)
.catch(reportExecuteScriptError);