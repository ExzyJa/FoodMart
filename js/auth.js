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

  function sendVerificationEmail(user) {
    var actionSettings = window.location.protocol === "http:" || window.location.protocol === "https:" ? {
      url: window.location.origin + "/login.html",
      handleCodeInApp: false
    } : undefined;
    return user.sendEmailVerification(actionSettings);
  }

  var registerForm = document.getElementById("register-form");
  if (registerForm) {
    var registerMessage = document.getElementById("register-message");
    var verificationPanel = document.getElementById("verification-panel");
    var verificationMessage = document.getElementById("verification-message");
    var currentUser = null;

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
        currentUser = result.user;
        return currentUser.updateProfile({ displayName: name }).then(function() {
          return sendVerificationEmail(currentUser);
        });
      }).then(function() {
        registerForm.classList.add("d-none");
        verificationPanel.classList.remove("d-none");
      }).catch(function(error) {
        showMessage(registerMessage, error.code === "auth/email-already-in-use" ? "An account with this Gmail address already exists." : error.message, "danger");
      });
    });

    document.getElementById("resend-verification").addEventListener("click", function() {
      if (!currentUser) return;
      sendVerificationEmail(currentUser).then(function() {
        showMessage(verificationMessage, "A new verification email was sent. Check your inbox and spam folder.", "success");
      }).catch(function(error) {
        showMessage(verificationMessage, error.code === "auth/too-many-requests" ? "Please wait a few minutes before requesting another email." : error.message, "danger");
      });
    });

    document.getElementById("verification-form").addEventListener("submit", function(event) {
      event.preventDefault();
      currentUser.reload().then(function() {
        if (!currentUser.emailVerified) throw new Error("Please click the verification link in your email first.");
        return currentUser.getIdToken(true);
      }).then(function() {
        localStorage.setItem(sessionKey, "1");
        showMessage(verificationMessage, "Email verified. Redirecting...", "success");
        var pending = JSON.parse(localStorage.getItem(pendingCartKey) || "null");
        var destination = pending && pending.returnUrl ? pending.returnUrl : "index.html";
        window.setTimeout(function() { window.location.href = destination; }, 700);
      }).catch(function(error) {
        showMessage(verificationMessage, error.message, "danger");
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
          if (!result.user.emailVerified) {
            return sendVerificationEmail(result.user).then(function() {
              return firebase.auth().signOut().then(function() { throw new Error("Please verify your email. A new verification email was sent."); });
            });
          }
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