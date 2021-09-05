// ==UserScript==
// @name Kapa Auto Follow
// @namespace    http://tampermonkey.net/
// @version      3.0.3
// @description  Kapa Auto Follow to any platform, mostly film platform
// @author       Kapa
// @include      *
// @grant        GM_xmlhttpRequest
// @require https://raw.githubusercontent.com/KhanhPham2411/PublicUserScripts/main/Core/shared.js
// @grant GM_setValue
// @grant GM_getValue
// @require http://userscripts-mirror.org/scripts/source/107941.user.js
// ==/UserScript==

(function () {
  "use strict";

  mergeLocalStorageWithSuperValue();
  registerListener();

  console.log("Kapa Auto Follow");

  if(checkNonSupportedDomain()){
    return;
  }
  var check_element = checkElement();
  if (!check_element) return;

  var parentElement = findParentElement(check_element);
  if(!parentElement) return;

  var following = getValue("following");
  if(following){
    for (var item of following) {
      if(parentElement.outerHTML.indexOf(item.pathname) > -1){
        if(window.origin == item.origin){
          return;
        }
      }
    }
  }

  // key: "@@KapaAutoFollow:following"
  // reset: localStorage.setItem("@@KapaAutoFollow:following", [])
  // get: localStorage.getItem("@@KapaAutoFollow:following")
  updateList("following", {
    origin: window.location.origin,
    href: window.location.href,
    pathname: window.location.pathname,
    fullpathname: window.location.origin + window.location.pathname,
    totalEpisodes: parentElement.childElementCount,
    hostname: window.location.hostname,
    title: document.title,
  });
})();

function registerListener(){
  document.addEventListener('keydown', function (event) {
    event.preventDefault();
    // CTRL + ` combo
    if (event.ctrlKey && event.key === '`') {
      openWindow();
    }
  });
}
function openWindow() {
  newWindow = window.open("https://khanhpham2411.github.io/KapaAutoFollow_source/", '_blank', "height=812,width=375,status=yes");  
}

function setValue(value) {
  document.getElementById('value').value = value;
}
function namespaceKey() {
  return "@@KapaAutoFollow:";
}
function checkNonSupportedDomain(){
  var domainList = ["google.com", "expo.dev"];
  for(var domain of domainList){
    if(window.location.origin.indexOf(domain) > -1){
      return true;
    }
  }

  return false;
}

function mergeLocalStorageWithSuperValue(){
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function(key, value) {
    if(key.startsWith(namespaceKey())){
      GM_SuperValue.set(key, value);
    }else{
      originalSetItem.apply(this, arguments);
    }
  };
  const originalGetItem = localStorage.getItem;
  localStorage.getItem = function(key) {
    if(key.startsWith(namespaceKey())){
      return GM_SuperValue.get(key);
    }else{
      return originalGetItem.apply(this, arguments);
    }
  };
}
function getValue(key){
  return GM_SuperValue.get(namespaceKey() + key);
}
function setValue(key, value){
  GM_SuperValue.set(namespaceKey() + key, value)
}

function fetchFollowing(){
  var followingList = GM_SuperValue.get("following");
  console.log("fetchFollowing: ", followingList);
  if(followingList){
    for(var following of followingList){
      GM_fetch(following, {"method": "GET"}).then(response => console.log("OK"));
    }
  }
}
function updateList(listId, value) {
  var list = [];
  var storedList = getValue(listId);

  if (storedList != null) {
    list = storedList;
  }
  if (list.indexOf(value) === -1) {
    list.push(value);
    setValue(listId, list);
  }
  console.log(listId, list);

  return list;
}

function findParentElement(check_element) {
  if (check_element.tagName == "BODY"){
    return null;
  } 

  var parentElement = check_element.parentElement;
  if (parentElement.querySelectorAll("a").length > 1) {
    var tag_a = parentElement.querySelectorAll("a");
    for (var element_a of tag_a) {
      if (element_a.href != tag_a[0].href) {
        if(similarity(element_a.href, tag_a[0].href) < 0.9){
          return null;
        }
        console.log("similarity:", element_a, tag_a[0]);
        for(var child of parentElement.children){
          if(child.tagName != parentElement.children[0].tagName){
            // return findParentElement(parentElement);
            return null;
          }
        }

        console.log("findParentElement: ", parentElement);
        return parentElement;
      }
    }
  }

  return findParentElement(parentElement);
}
function checkElement() {
  if(window.location.pathname == "/"){
    return null;
  }

  var tag_a = document.querySelectorAll("a");
  var check_element = null;
  for (var element of tag_a) {
    if(element.href.indexOf(window.location.pathname) == -1){
      continue;
    }
    if(element.innerHTML.indexOf("<img") > -1) { 
      continue; 
    }

    var outerHtml = element.outerHTML.split(">" + element.innerHTML)[0];
    if (outerHtml.indexOf(window.location.pathname) > -1) {
      console.log("checkElement: ", element);
      check_element = element;
      break;
    }
  }

  return check_element;
}

function GM_fetch(url, fetch_info) {
  return new Promise(function (resolve, reject) {
    fetch_info.onload = function (response) {
      response.text = function () {
        return response.responseText;
      };
      resolve(response);
    };
    fetch_info.url = url;
    fetch_info.data = fetch_info.body;

    GM_xmlhttpRequest(fetch_info);
  });
}



// infrastructure
function similarity(s1, s2) {
  var longer = s1;
  var shorter = s2;
  if (s1.length < s2.length) {
    longer = s2;
    shorter = s1;
  }
  var longerLength = longer.length;
  if (longerLength == 0) {
    return 1.0;
  }
  return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
}
function editDistance(s1, s2) {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();

  var costs = new Array();
  for (var i = 0; i <= s1.length; i++) {
    var lastValue = i;
    for (var j = 0; j <= s2.length; j++) {
      if (i == 0)
        costs[j] = j;
      else {
        if (j > 0) {
          var newValue = costs[j - 1];
          if (s1.charAt(i - 1) != s2.charAt(j - 1))
            newValue = Math.min(Math.min(newValue, lastValue),
              costs[j]) + 1;
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0)
      costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}