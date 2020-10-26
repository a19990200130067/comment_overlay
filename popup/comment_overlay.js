function openTab(evt, tabName) {
  var i, tabcontent, tablinks;
  console.log(tabName);
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
  tablinks = document.getElementsByClassName("tablinks");
  console.log(tablinks)
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }
  document.getElementById(tabName).style.display = "block";
  evt.target.className += " active";
}

function parseBilibiliDanmaku(xmlContent) {
  var all_danmaku = xmlContent.getElementsByTagName("d");
  console.log(all_danmaku);
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
        console.log("classes: ", tablinks[i].classList, tablinks[i].className);
        if (tablinks[i].classList.contains("active")) {
          comment_source = tablinks[i].firstChild.nodeValue;
          break;
        }
      }
      console.log(`Here we go ${comment_source}`);
      if (comment_source == "Bilibili") {
        comments = fetchCommentsFromBili();
      } else if (comment_source == "AcFun") {

      } else if (comment_source == "Niconico") {

      }

      if (comments.length == 0) {
        return;
      }
      console.log(comments);
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

/**
 * There was an error executing the script.
 * Display the popup's error message, and hide the normal UI.
 */
function reportExecuteScriptError(error) {
  document.querySelector("#popup-content").classList.add("hidden");
  document.querySelector("#error-content").classList.remove("hidden");
  console.error(`Failed to execute beastify content script: ${error.message}`);
}

/**
 * When the popup loads, inject a content script into the active tab,
 * and add a click handler.
 * If we couldn't inject the script, handle the error.
 */
browser.tabs.executeScript({file: "/content_scripts/overlay_canvas.js"})
.then(listenForClicks)
.catch(reportExecuteScriptError);