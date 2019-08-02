//SET EVENT HANDLER ON POP STATE
window.onpopstate = navigate;

//GET TODAY'S DATE
let date = new Date();
const TODAY = `${date.getFullYear()}-${(date.getMonth() + 1) < 10 ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1)}-${date.getDate() < 10 ? "0" + date.getDate() : date.getDate()}`;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
let dateItems;

// DOM ELEMENTS SHORTCUTS
const HOME = document.getElementById("/home");
const MATCH_INFO = document.getElementById("/match-info");
const CALENDAR = document.getElementById("/calendar");
const EVENT_DETAILS = document.getElementById("/event-details");
const CONTACT = document.getElementById("/contact");
const NAVIGATION = document.getElementById("navigation");
const SIGN_IN_BUTTON = document.getElementById("sign-in-button");
const SIGN_OUT_BUTTON = document.getElementById("sign-out-button");
const MESSAGES_BUTTON = document.getElementById("event-messages-btn");
const EVENT_MESSAGES = document.getElementById("event-messages");
const FIREBASE_AUTH_CONTAINER = document.getElementById("firebaseui-auth-container");
const FIREBASE_AUTH_CONTAINER_BACKGROUND = document.getElementById("firebaseui-auth-container-background");
const MESSAGE_FORM = document.getElementById('message-form');
const MESSAGE_INPUT = document.getElementById('new-post-message');
const TITLE_INPUT = document.getElementById('new-post-title');
const RECENT_POSTS_SECTION = document.getElementById('recent-posts-list');
const POSTS_PLACEHOLDER = document.getElementById("posts-placeholder");
const SEND_BUTTON = document.getElementById("message-button");
const POSTS_BOX = document.getElementById("add-post");

let queryParams = getURLQuery();
var listeningFirebaseRefs = [];
var currentEvent; //Keep track of selected event
var ui; //Firebase auth ui component

let currentUID = null; //Signed-in user ID

!function buildPage() {

  /* BEGIN HOME PAGE --------------------------------------------------------------------------------------- */

  //GET TODAY'S MATCH BUTTON
  const TODAYS_MATCH_BTN = document.getElementById("home-match").firstElementChild;

  //CHECK IF THERE IS A MATCH ON CURRENT DATE
  let todaysMatchIndex = data.findIndex(event => event.date === TODAY && event.eventType === "match");
  if (todaysMatchIndex < 0) {
    TODAYS_MATCH_BTN.classList.add("disabled");
  } else {
    TODAYS_MATCH_BTN.addEventListener("click", () => {
      let query = `?eventIndex=${todaysMatchIndex}&eventId=${data[todaysMatchIndex].eventId}`;
      updateView("/home", "/match-info", query);
    });
  }

  //GET EVENTS BUTTON
  const EVENTS_BTN = document.getElementById("home-events").firstElementChild;

  //ADD EVENTS BUTTON BEHAVIOR
  EVENTS_BTN.addEventListener("click", () => {
    let query = ``;
    updateView("/home", "/calendar", query);
  });

  //GET CONTACT BUTTON
  const CONTACT_BTN = document.getElementById("home-contact").firstElementChild;

  //ADD CONTACT BUTTON BEHAVIOR
  CONTACT_BTN.addEventListener("click", () => {
    let query = ``;
    updateView("/home", "/contact", query);
  });

  /* END HOME PAGE ------------------------------------------------------------------------------- */

  /* BEGIN EVENTS DETAILS PAGE ------------------------------------------------------------------- */

  //HIDE INTERFACE ELEMENTS ON MESSAGE BOX FOCUS
  MESSAGE_INPUT.addEventListener("focus", (e) => {
    NAVIGATION.classList.toggle("hidden");
    SIGN_OUT_BUTTON.classList.toggle("hidden");
    /* EVENT_DETAILS.firstElementChild.classList.add("smallerHeader"); */
    /* POSTS_BOX.classList.add("lowerPostBox"); */
    setTimeout(() => MESSAGE_INPUT.scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"}), 500);
  });

  MESSAGE_INPUT.addEventListener("blur", () => {
    setTimeout(() => {
      NAVIGATION.classList.toggle("hidden");
      SIGN_OUT_BUTTON.classList.toggle("hidden");
      /* EVENT_DETAILS.firstElementChild.classList.remove("smallerHeader"); */
      /* POSTS_BOX.classList.remove("lowerPostBox"); */
    }, 100);
  });

  //SAVES MESSAGE ON FORM SUBMIT
  MESSAGE_FORM.onsubmit = function (e) {
    e.preventDefault();
    var text = MESSAGE_INPUT.value;
    var timestamp = getTimestamp();
    if (text) {
      newPostForCurrentUser(currentEvent, timestamp, text);
      MESSAGE_INPUT.value = '';
      RECENT_POSTS_SECTION.firstElementChild.nextElementSibling.scroll({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
    }
  };

  /* END EVENTS DETAILS PAGE --------------------------------------------------------------------- */

  /* BEGIN NAVIGATION ---------------------------------------------------------------------------- */

  //ADD BACK BUTTON BEHAVIOR
  document.getElementById("back-btn").addEventListener("click", () => window.history.back());

  //ADD HOME BUTTON BEHAVIOR
  document.getElementById("home-btn").addEventListener("click", handleNavEvents);

  //REMOVE NAV FROM DOM. TO BE REATTACHED ON EACH VIEW SEPARATELY
  NAVIGATION.parentElement.removeChild(NAVIGATION);

  /* END NAVIGATION ------------------------------------------------------------------------------ */

  /* BEGIN USER AUTH ----------------------------------------------------------------------------- */

  //REMOVE SIGN IN / SIGN OUT BUTTONS FROM DOM
  SIGN_IN_BUTTON.parentElement.removeChild(SIGN_OUT_BUTTON);
  SIGN_IN_BUTTON.parentElement.removeChild(SIGN_IN_BUTTON);

  //ADD EVENT LISTENER ON SIGN IN BUTTON
  SIGN_IN_BUTTON.addEventListener('click', function () {

    //INITIALIZE FIREBASE UI WIDGET
    try {
      ui = new firebaseui.auth.AuthUI(firebase.auth());
    } catch (error) {
      console.log(error.message);
    }

    //CLOSE AUTH UI BY CLICKING OUTSIDE BUTTONS
    FIREBASE_AUTH_CONTAINER_BACKGROUND.addEventListener("click", (e) => {
      FIREBASE_AUTH_CONTAINER.classList.add("hidden");
      e.stopPropagation();
      //console.log("click!");
    }, false);

    //DONT USER HELPER
    firebaseui.auth.CredentialHelper.NONE

    var uiConfig = {
      callbacks: {
        signInSuccessWithAuthResult: function (authResult, redirectUrl) {
          //ON SIGN IN, HIDE AUTH UI WIDGET
          FIREBASE_AUTH_CONTAINER.classList.add("hidden");
          //DONT REDIRECT
          return false;
        },
        uiShown: function () {
          //SHOW AUTH UI WIDGET WHEN TRYING TO SIGN IN
          FIREBASE_AUTH_CONTAINER.classList.remove("hidden");
        }
      },
      //USE POPUP SIGN-IN FLOW
      signInFlow: 'popup',
      signInSuccessUrl: '/',
      signInOptions: [
        // Leave the lines as is for the providers you want to offer your users.
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        firebase.auth.EmailAuthProvider.PROVIDER_ID
      ],
      credentialHelper: firebaseui.auth.CredentialHelper.NONE, //NO CREDENTIAL HELPER
      // Terms of service url.
      tosUrl: function() {},
      // Privacy policy url.
      privacyPolicyUrl: function() {}
    };

    ui.start('#firebaseui-auth-container', uiConfig);
  });

  //ADD EVENT LISTENER ON SIGN OUT BUTTON
  SIGN_OUT_BUTTON.addEventListener('click', function () {
    if (queryParams.messages === "true") //EXIT MESSAGES VIEW ON SIGN OUT
    {
      document.getElementById("back-btn").click();
    }
    firebase.auth().signOut();
  });

  //LISTEN FOR AUTH STATE CHANGES
  firebase.auth().onAuthStateChanged(onAuthStateChanged);

  /* END USER AUTH ----------------------------------------------------------------------------- */

  refreshView();
}();

function refreshView() {

  //GET PATH NAME
  var path = getPath();

  //GET URL QUERY PARAMETERS
  queryParams = getURLQuery();

  switch (path) {
    case "/home":
      //GET AND UNHIDE VIEW
      HOME.classList.toggle("hidden");
      //ATTACH USER AUTH
      attachElem("sign-in-out", "/home");
      break;
    case "/match-info":
      //GET AND UNHIDE VIEW
      MATCH_INFO.classList.toggle("hidden");
      //DISPLAY MAP IFRAME
      document.getElementById("match-map").innerHTML = locations.find(location => location.id === data[queryParams.eventIndex].eventLocation).map;
      //DISPLAY MATCH DATA
      const MATCH_DETAILS = document.getElementById("match-address");
      dateItems = data[queryParams.eventIndex].date.split("-");

      MATCH_DETAILS.firstElementChild.firstElementChild.firstChild.nodeValue = `${MONTHS[parseInt(dateItems[1]) - 1]} ${dateItems[2]}`;
      MATCH_DETAILS.firstElementChild.firstElementChild.nextElementSibling.firstChild.nodeValue = data[queryParams.eventIndex].time;
      MATCH_DETAILS.firstElementChild.nextElementSibling.firstElementChild.firstChild.nodeValue = locations.find(location => location.id === data[queryParams.eventIndex].eventLocation).name;
      MATCH_DETAILS.firstElementChild.nextElementSibling.getElementsByTagName("span")[1].firstChild.nodeValue = locations.find(location => location.id === data[queryParams.eventIndex].eventLocation).address;
      //ATTACH NAVIGATION
      attachElem("navigation", "/match-info");
      //ATTACH USER AUTH
      attachElem("sign-in-out", "/match-info");
      break;
    case "/calendar":
      //GET AND UNHIDE VIEW
      CALENDAR.classList.toggle("hidden");
      //ATTACH NAVIGATION
      attachElem("navigation", "/calendar");
      //ATTACH USER AUTH
      attachElem("sign-in-out", "/calendar");
      break;
    case "/event-details":
      //GET AND UNHIDE VIEW
      EVENT_DETAILS.classList.toggle("hidden");

      //GET INDEX OF EVENT IN DATA ARRAY
      const EVENT_INDEX = data.findIndex(event => event.eventId === parseInt(queryParams.eventId));

      //GET THE SELECTED EVENT'S ID
      currentEvent = data[EVENT_INDEX].eventId;

      //DISPLAY EVENT TITLE
      document.getElementById("event-title").firstChild.nodeValue = data[EVENT_INDEX].eventName;

      //SHOW EVENT MESSAGES VIEW OR EVENT DETAILS BASED ON URL QUERY
      if (queryParams.messages) {
        cleanupUi();
        startDatabaseQueries();
        EVENT_MESSAGES.classList.toggle("hidden");
        document.getElementById("event-map").classList.add("hidden");
        document.getElementById("details").classList.add("hidden");
        document.getElementById("event-messages-btn").classList.add("hidden");
      } else {
        //DISPLAY MAP IFRAME
        try {
          document.getElementById("event-map").innerHTML = locations.find(location => location.id === data[EVENT_INDEX].eventLocation).map;
        } catch (e) {
          console.error(e);
        }

        //DISPLAY EVENT DATA
        const DETAILS = document.getElementById("details");
        dateItems = data[EVENT_INDEX].date.split("-");
        DETAILS.firstElementChild.firstElementChild.firstChild.nodeValue = `${MONTHS[(dateItems[1] - 1)]} ${dateItems[2]}`;
        DETAILS.firstElementChild.firstElementChild.nextElementSibling.firstChild.nodeValue = data[EVENT_INDEX].time;
        DETAILS.firstElementChild.nextElementSibling.firstElementChild.firstChild.nodeValue = locations.find(location => location.id === data[EVENT_INDEX].eventLocation).name;
        DETAILS.firstElementChild.nextElementSibling.getElementsByTagName("span")[1].firstChild.nodeValue = locations.find(location => location.id === data[EVENT_INDEX].eventLocation).address;
        DETAILS.firstElementChild.nextElementSibling.nextElementSibling.firstChild.nodeValue = data[EVENT_INDEX].description || "";
      }
      //ATTACH NAVIGATION
      attachElem("navigation", "/event-details");
      //ATTACH USER AUTH
      attachElem("sign-in-out", "/event-details");
      break;
    case "/contact":
      //GET AND UNHIDE VIEW
      CONTACT.classList.toggle("hidden");
      //ATTACH NAVIGATION
      attachElem("navigation", "/contact");
      //ATTACH USER AUTH
      attachElem("sign-in-out", "/contact");
      break;
    default:

  }
}

function getPath() {
  let urlPathName = document.location.pathname;
  if (urlPathName === "/") {
    urlPathName = "/home";
  }
  return urlPathName;
}

//PUSHES HISTORY STATE AND NAVIGATES TO REQUESTED VIEW
function updateView(oldV, newV, query) {
  window.history.pushState({ view: oldV }, null, newV + query);

  navigate();
}

//HIDES ALL VIEWS AND THEN REFRESHES VIEWS
function navigate(e = null) {
  let views = document.getElementsByClassName("view");
  for (view of views) {
    view.classList.add("hidden");
  }
  EVENT_MESSAGES.classList.add("hidden");
  document.getElementById("event-map").classList.remove("hidden");
  document.getElementById("details").classList.remove("hidden");
  document.getElementById("event-messages-btn").classList.remove("hidden");

  refreshView();
}

//SETS THE HOME BUTTON TO GO BACK 1, 2 OR 3 HISTORY STATES, DEPENDING ON WHERE IT'S LOCATED
function handleNavEvents(e) {
  if (getPath() === "/event-details")
    if (queryParams.messages === "true") {
      window.history.go(-3);
    } else {
      window.history.go(-2);
    }
  else
    window.history.go(-1);
}

// ATTACH NAV AND AUTH BUTTONS TO CURRENT VIEW
function attachElem(elem, view) {
  switch (elem) {
    case "navigation":
      let nav;
      //FIRST REMOVE ANY OCCURRENCE OF NAV FROM DOM
      if ((nav = document.getElementById("navigation"))) {
        nav.parentElement.removeChild(nav);
      }
      //ATTACH NAV TO VIEW
      document.getElementById(view).appendChild(NAVIGATION);
      if (view !== "/event-details") {
        document.getElementById("back-btn").classList.add("invisible");
      } else {
        document.getElementById("back-btn").classList.remove("invisible");
      }
      break;
    case "sign-in-out":
      let button;
      let buttons = ["sign-in-button", "sign-out-button"];
      //FIRST REMOVE ANY SIGN IN BUTTONS FROM DOM
      for (let i = 0; i < 2; ++i) {
        if (button = document.getElementById(buttons[i])) {
          button.parentElement.removeChild(button);
        }
      }
      //ATTACH BUTTONS TO VIEW
      document.getElementById(view).getElementsByClassName("log-in-out")[0].appendChild(SIGN_IN_BUTTON);
      document.getElementById(view).getElementsByClassName("log-in-out")[0].appendChild(SIGN_OUT_BUTTON);
      break;
  }
}

//GET A STRINGIFIED JSON REPRESENTATION OF THE CURRENT DATE AND TIME
function getTimestamp() {
  return Date.now();
}

//GET URL QUERY PARAMETERS
function getURLQuery() {
  const LOCATION = window.location.search;
  let queryParams = {};

  if (LOCATION) {
    const QUERY = LOCATION.substring(1).split("&");
    QUERY.forEach(function (query) {
      let queryArray = query.split("=");
      queryParams[queryArray[0]] = queryArray[1];
    });
  }
  return queryParams;
}

function showEventMessages() {
  let query = `${window.location.search}&messages=true`;
  updateView("/event-details", "/event-details", query);
}

function onAuthStateChanged(user) {
  // We ignore token refresh events.
  if (user && currentUID === user.uid) {
    return;
  }

  cleanupUi();
  if (user) {
    currentUID = user.uid;
    MESSAGES_BUTTON.classList.remove("disabled");
    MESSAGES_BUTTON.addEventListener("click", showEventMessages);
    writeUserData(user.uid, user.displayName ? user.displayName : user.email, user.email, user.photoURL);
    startDatabaseQueries();
  } else {
    // Set currentUID to null.
    currentUID = null;
    MESSAGES_BUTTON.removeEventListener("click", showEventMessages);
    MESSAGES_BUTTON.classList.add("disabled");
  }

  updateAuthUI();
}

function updateAuthUI() {
  if (currentUID) {
    SIGN_IN_BUTTON.classList.add("hidden");
    SIGN_OUT_BUTTON.classList.remove("hidden");
  } else {
    SIGN_OUT_BUTTON.classList.add("hidden");
    SIGN_IN_BUTTON.classList.remove("hidden");
  }
}

function newPostForCurrentUser(currentEvent, timestamp, text) {
  // [START single_value_read]
  var userId = firebase.auth().currentUser.uid;
  return firebase.database().ref('/users/' + userId).once('value').then(function (snapshot) {
    var username = (snapshot.val() && snapshot.val().username) || 'Anonymous';
    // [START_EXCLUDE]
    return writeNewPost(currentEvent, timestamp, firebase.auth().currentUser.uid, username,
      firebase.auth().currentUser.photoURL,
      text);
    // [END_EXCLUDE]
  });
  // [END single_value_read]
}

function writeNewPost(currentEvent,timestamp, uid, username, picture, body, date) {
  // A post entry.
  var postData = {
    author: username,
    uid: uid,
    body: body,
    authorPic: picture,
    timestamp: timestamp
  };

  // Get a key for a new Post.
  var newPostKey = firebase.database().ref().child('posts').push().key;

  // Write the new post's data simultaneously in the posts list and the user's post list.
  var updates = {};
  updates['/posts/' + currentEvent + '/' + newPostKey] = postData;
  updates['/user-posts/' + uid + '/' + currentEvent + '/' + newPostKey] = postData;

  return firebase.database().ref().update(updates);
}

function writeUserData(userId, name, email, imageUrl) {
  firebase.database().ref('users/' + userId).set({
    username: name,
    email: email,
    profile_picture: imageUrl
  });
}

function startDatabaseQueries() {

  var recentPostsRef = firebase.database().ref('posts/' + currentEvent).limitToLast(100);

  var fetchPosts = function (postsRef, sectionElement) {
    postsRef.on('child_added', function (data) {
      console.log(data.val().timestamp);
      POSTS_PLACEHOLDER.classList.add("hidden");
      var author = data.val().author || 'Anonymous';
      var containerElement = sectionElement.getElementsByClassName('posts-container')[0];
      containerElement.insertBefore(
        createPostElement(data.key, data.val().body, author, data.val().uid, data.val().authorPic, data.val().timestamp),
        containerElement.firstChild);
    });
    postsRef.on('child_changed', function (data) {
      var containerElement = sectionElement.getElementsByClassName('posts-container')[0];
      var postElement = containerElement.getElementsByClassName('post-' + data.key)[0];
      postElement.getElementsByClassName('username')[0].innerText = data.val().author;
      postElement.getElementsByClassName('text')[0].innerText = data.val().body;
    });
    postsRef.on('child_removed', function (data) {
      var containerElement = sectionElement.getElementsByClassName('posts-container')[0];
      var post = containerElement.getElementsByClassName('post-' + data.key)[0];
      post.parentElement.removeChild(post);
    });
  };

  fetchPosts(recentPostsRef, RECENT_POSTS_SECTION);

  listeningFirebaseRefs.push(recentPostsRef);
}

function cleanupUi() {
  // Remove all previously displayed posts.
  RECENT_POSTS_SECTION.getElementsByClassName('posts-container')[0].innerHTML = '';
  POSTS_PLACEHOLDER.classList.remove("hidden");

  // Stop all currently listening Firebase listeners.
  listeningFirebaseRefs.forEach(function (ref) {
    ref.off();
  });
  listeningFirebaseRefs = [];
}

function createPostElement(postId, text, author, authorId, authorPic, timestamp) {

var localDate = new Date(timestamp);
var localDateString = localDate.toLocaleDateString(undefined, {  
	day : 'numeric',
	month : 'short',
	year : 'numeric'
})

var localTimeString = localDate.toLocaleTimeString(undefined, {
	hour: '2-digit',
	minute: '2-digit'
})

console.dir(localDateString);
console.dir(localTimeString);
  var html =
    '<div class="post post-' + postId + '>' +
      '<div class="">' +
        '<div class="header">' +
          '<div>' +
            '<div class="avatar"></div>' +
            '<div class="username"></div>' +
          '</div>' +
        '</div>' +
      '<div class="text"></div>' +
      '<div class="footer">' +
        '<div class="timestamp"></div>' +
      '</div>' +
      '</div>' +
    '</div>';

  // Create the DOM element from the HTML.
  var div = document.createElement('div');
  div.innerHTML = html;
  var postElement = div.firstChild;

  // Set values.
  postElement.getElementsByClassName('text')[0].innerText = text;
  /* postElement.getElementsByClassName('mdl-card__title-text')[0].innerText = title; */
  postElement.getElementsByClassName('username')[0].innerHTML = '<b>' + (author || 'Anonymous') + '</b>' + ' wrote:';
  postElement.getElementsByClassName('avatar')[0].style.backgroundImage = 'url("' +
    (authorPic || './silhouette.jpg') + '")';
  postElement.getElementsByClassName('timestamp')[0].innerText = `${localDateString} - ${localTimeString}`;

  return postElement;
}
