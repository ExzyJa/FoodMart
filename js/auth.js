(function() {
  "use strict";

  var sessionKey = "foodmart-session";
  var pendingCartKey = "foodmart-pending-cart";
  var gmailPattern = /^[^\s@]+@gmail\.com$/i;

  window.FoodMartAuth = {
    isLoggedIn: function() {
      return localStorage.getItem(sessionKey) === "1";
    },
    requireLoginForCart: function(item, returnUrl) {
      if (this.isLoggedIn()) return true;
      localStorage.setItem(pendingCartKey, JSON.stringify({ item: item, returnUrl: returnUrl }));
      window.location.href = "register.html";
      return false;
    },
    requireLoginForWishlist: function() {
      if (this.isLoggedIn()) return true;
      window.location.href = "login.html";
      return false;
    },
    takePendingCart: function() {
      var pending = JSON.parse(localStorage.getItem(pendingCartKey) || "null");
      localStorage.removeItem(pendingCartKey);
      return pending;
    }
  };

  function showMessage(element, message, type) {
    element.textContent = message;
    element.className = "alert alert-" + type;
  }

  var registerForm = document.getElementById("register-form");
  if (registerForm) {
    var registerMessage = document.getElementById("register-message");

    registerForm.addEventListener("submit", function(event) {
      event.preventDefault();
      var name = document.getElementById("register-name").value.trim();
      var email = document.getElementById("register-email").value.trim().toLowerCase();
      var password = document.getElementById("register-password").value;
      var confirm = document.getElementById("register-confirm").value;

      if (!name || !gmailPattern.test(email)) {
        showMessage(registerMessage, "Please enter a valid Gmail address.", "danger");
        return;
      }
      if (password.length < 8 || password !== confirm) {
        showMessage(registerMessage, "Passwords must match and be at least 8 characters.", "danger");
        return;
      }
      firebase.auth().createUserWithEmailAndPassword(email, password).then(function(result) {
        return result.user.updateProfile({ displayName: name }).then(function() {
          localStorage.setItem(sessionKey, "1");
          var pending = JSON.parse(localStorage.getItem(pendingCartKey) || "null");
          var destination = pending && pending.returnUrl ? pending.returnUrl : "index.html";
          showMessage(registerMessage, "Account created. Redirecting...", "success");
          window.setTimeout(function() { window.location.href = destination; }, 700);
        });
      }).catch(function(error) {
        showMessage(registerMessage, error.code === "auth/email-already-in-use" ? "An account with this Gmail address already exists." : error.message, "danger");
      });
    });
  }

  var loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", function(event) {
      event.preventDefault();
      var message = document.getElementById("login-message");
      var email = document.getElementById("login-email").value.trim().toLowerCase();
      var password = document.getElementById("login-password").value;
      if (!gmailPattern.test(email)) {
        showMessage(message, "Please use a valid Gmail address.", "danger");
      } else {
        firebase.auth().signInWithEmailAndPassword(email, password).then(function(result) {
          localStorage.setItem(sessionKey, "1");
          showMessage(message, "You are logged in. Redirecting...", "success");
          window.setTimeout(function() { window.location.href = "index.html"; }, 700);
        }).catch(function(error) {
          showMessage(message, error.code === "auth/invalid-credential" ? "Email or password is incorrect." : error.message, "danger");
        });
      }
    });
  }
})();