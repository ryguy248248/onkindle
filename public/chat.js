// Live updates for the chat room. Written in plain ES3/ES5 with
// XMLHttpRequest so it runs in older Kindle browsers. Without JS the page
// still works: the form posts normally and the page refreshes every 30s.
(function () {
  var list = document.getElementById("messages");
  var form = document.getElementById("send");
  var input = document.getElementById("body");
  var status = document.getElementById("status");
  if (!list || !form || !input || !window.XMLHttpRequest) return;

  var latest = parseInt(list.getAttribute("data-latest"), 10) || 0;
  var polling = false;
  var sending = false;
  var POLL_MS = 4000;
  var ERRORS = {
    "empty": "Type a message first.",
    "too-long": "Messages can be up to 500 characters.",
    "slow-down": "Wait a few seconds between messages.",
    "unauthorized": "You were logged out. Refresh to log in again."
  };

  function setStatus(text) {
    if (status) status.innerHTML = text;
  }

  function request(method, url, body, done) {
    var xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.setRequestHeader("Accept", "application/json");
    if (body) xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;
      var data = null;
      try { data = JSON.parse(xhr.responseText); } catch (e) {}
      done(xhr.status, data);
    };
    xhr.send(body || null);
  }

  function poll() {
    if (polling) return;
    polling = true;
    request("GET", "/api/messages?after=" + latest + "&t=" + new Date().getTime(), null, function (code, data) {
      polling = false;
      if (code === 401) { setStatus(ERRORS.unauthorized); return; }
      if (code !== 200 || !data) { setStatus("Connection lost. Retrying…"); return; }
      if (data.html) {
        var empty = document.getElementById("empty");
        if (empty) empty.parentNode.removeChild(empty);
        list.innerHTML = data.html + list.innerHTML;
        latest = data.latest;
      }
      setStatus("Live · newest at the top");
    });
  }

  form.onsubmit = function () {
    var text = input.value.replace(/^\s+|\s+$/g, "");
    if (!text || sending) return false;
    sending = true;
    request("POST", "/api/messages", "body=" + encodeURIComponent(text), function (code, data) {
      sending = false;
      if (code === 201) {
        input.value = "";
        poll();
      } else {
        setStatus((data && ERRORS[data.error]) || "Could not send. Try again.");
      }
    });
    return false;
  };

  setStatus("Live · newest at the top");
  setInterval(poll, POLL_MS);
})();
