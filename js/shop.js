(function() {
  "use strict";

  var products = [
    { id: "bananas", name: "Fresh Bananas", image: "images/thumb-bananas.png" },
    { id: "biscuits", name: "Butter Biscuits", image: "images/thumb-biscuits.png" },
    { id: "cucumber", name: "Fresh Cucumber", image: "images/thumb-cucumber.png" },
    { id: "milk", name: "Pure Fresh Milk", image: "images/thumb-milk.png" },
    { id: "tomatoes", name: "Garden Tomatoes", image: "images/thumb-tomatoes.png" },
    { id: "ketchup", name: "Tomato Ketchup", image: "images/thumb-tomatoketchup.png" }
  ];
  var price = 1;
  var cart = JSON.parse(localStorage.getItem("foodmart-cart") || "[]");

  var formatPrice = function(value) {
    return "₱" + value.toFixed(2);
  };

  var saveCart = function() {
    localStorage.setItem("foodmart-cart", JSON.stringify(cart));
  };

  var showOrderQr = function(orderNumber, customerName, total, payment, qrText) {
    var qrPanel = document.getElementById("order-qr-panel");
    var qrElement = document.getElementById("order-qr");
    var checkoutLink = document.getElementById("payment-checkout-link");
    qrElement.innerHTML = "";
    qrPanel.classList.remove("d-none");
    checkoutLink.classList.toggle("d-none", payment !== "PayMongo");
    if (payment === "PayMongo") checkoutLink.href = qrText;
    if (typeof QRCode === "undefined") {
      qrElement.textContent = "QR code library could not load. Please reconnect and try again.";
      return;
    }
    try {
      new QRCode(qrElement, {
        text: qrText || [orderNumber, customerName, total.replace("₱", ""), "COD"].join("|"),
        width: 180,
        height: 180,
        colorDark: "#222222",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.L
      });
    } catch (error) {
      qrElement.textContent = "QR code could not be generated. Keep your order number: " + orderNumber;
    }
  };

  var renderProducts = function() {
    document.getElementById("product-list").innerHTML = products.map(function(product) {
      return '<div class="col-sm-6 col-xl-4"><article class="shop-product h-100">' +
        '<img src="' + product.image + '" alt="' + product.name + '" class="img-fluid">' +
        '<div class="p-3"><h2 class="h5">' + product.name + '</h2><p class="price mb-3">' + formatPrice(price) + '</p>' +
        '<button class="btn btn-dark w-100 add-product" data-id="' + product.id + '">Add to order</button></div></article></div>';
    }).join("");
  };

  var filterProducts = function(query) {
    var normalizedQuery = query.toLowerCase().trim();
    var productElements = document.querySelectorAll("#product-list .shop-product");
    productElements.forEach(function(productElement) {
      var matches = !normalizedQuery || productElement.textContent.toLowerCase().indexOf(normalizedQuery) !== -1;
      productElement.closest(".col-sm-6").classList.toggle("d-none", !matches);
    });
  };

  var renderCart = function() {
    var cartElement = document.getElementById("shop-cart");
    var totalElement = document.getElementById("shop-total");
    var total = cart.reduce(function(sum, item) { return sum + item.quantity * price; }, 0);

    if (!cart.length) {
      cartElement.innerHTML = '<p class="text-muted">Your order is empty.</p>';
    } else {
      cartElement.innerHTML = cart.map(function(item) {
        return '<div class="d-flex justify-content-between align-items-center gap-2 mb-3">' +
          '<span>' + item.name + '<small class="d-block text-muted">' + formatPrice(price) + ' each</small></span>' +
          '<span class="d-flex align-items-center gap-2"><button class="btn btn-sm btn-outline-secondary change-quantity" data-id="' + item.id + '" data-change="-1">-</button>' +
          '<strong>' + item.quantity + '</strong><button class="btn btn-sm btn-outline-secondary change-quantity" data-id="' + item.id + '" data-change="1">+</button></span></div>';
      }).join("");
    }
    totalElement.textContent = formatPrice(total);
  };

  document.addEventListener("click", function(event) {
    var addButton = event.target.closest(".add-product");
    var quantityButton = event.target.closest(".change-quantity");
    var id = addButton ? addButton.dataset.id : quantityButton && quantityButton.dataset.id;
    if (!id) return;

    var item = cart.filter(function(entry) { return entry.id === id; })[0];
    if (addButton && !window.FoodMartAuth.requireLoginForCart({ id: id, name: products.filter(function(entry) { return entry.id === id; })[0].name, quantity: 1 }, "shop.html")) return;
    if (addButton && item) item.quantity += 1;
    if (addButton && !item) {
      var product = products.filter(function(entry) { return entry.id === id; })[0];
      cart.push({ id: product.id, name: product.name, quantity: 1 });
    }
    if (quantityButton && item) {
      item.quantity += Number(quantityButton.dataset.change);
      if (item.quantity <= 0) cart = cart.filter(function(entry) { return entry.id !== id; });
    }
    saveCart();
    renderCart();
  });

  document.getElementById("order-form").addEventListener("submit", function(event) {
    event.preventDefault();
    var form = event.target;
    var result = document.getElementById("order-result");
    if (!cart.length || !form.checkValidity()) {
      form.classList.add("was-validated");
      result.className = "alert alert-warning mt-4";
      result.textContent = cart.length ? "Please complete your delivery details." : "Add at least one product before placing your order.";
      return;
    }

    var payment = form.elements.payment.value;
    var customerName = document.getElementById("customer-name").value;
    var orderNumber = "FM-" + Date.now().toString().slice(-6);
    var orderTotal = formatPrice(cart.reduce(function(sum, item) { return sum + item.quantity * price; }, 0));
    if (payment === "paymongo") {
      var submitButton = form.querySelector("button[type=submit]");
      submitButton.disabled = true;
      result.className = "alert alert-info mt-4";
      result.textContent = "Opening secure payment checkout...";
      fetch("api/create-checkout.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_number: orderNumber,
          customer_name: customerName,
          customer_email: form.elements.email.value,
          items: cart.map(function(item) { return { id: item.id, quantity: item.quantity }; })
        })
      }).then(function(response) {
        return response.text().then(function(body) {
          var data;
          try {
            data = JSON.parse(body);
          } catch (error) {
            throw new Error("The payment service is unavailable. Please try again later.");
          }
          if (!response.ok) throw new Error(data.message || "Could not start payment.");
          return data;
        });
      }).then(function(data) {
        result.className = "alert alert-info mt-4";
        result.textContent = "Scan the QR code below to pay securely with PayMongo.";
        showOrderQr(orderNumber, customerName, orderTotal, "PayMongo", data.checkout_url);
        submitButton.disabled = false;
      }).catch(function(error) {
        result.className = "alert alert-danger mt-4";
        result.textContent = error.message;
        submitButton.disabled = false;
      });
      return;
    }

    result.className = "alert alert-success mt-4";
    result.textContent = "Order " + orderNumber + " received. Please prepare " + orderTotal + " cash on delivery.";
    cart = [];
    saveCart();
    renderCart();
    form.reset();
    showOrderQr(orderNumber, customerName, orderTotal, "Cash on delivery");
  });

  var pending = window.FoodMartAuth.takePendingCart();
  if (pending && pending.returnUrl === "shop.html" && pending.item) {
    var pendingItem = cart.filter(function(entry) { return entry.id === pending.item.id; })[0];
    if (pendingItem) pendingItem.quantity += pending.item.quantity;
    else cart.push(pending.item);
    saveCart();
  }
  var paymentStatus = new URLSearchParams(window.location.search).get("payment");
  if (paymentStatus === "success") {
    cart = [];
    saveCart();
    var successMessage = document.getElementById("order-result");
    successMessage.className = "alert alert-success mt-4";
    successMessage.textContent = "Payment received. Your order is being processed.";
  } else if (paymentStatus === "cancelled") {
    var cancelledMessage = document.getElementById("order-result");
    cancelledMessage.className = "alert alert-warning mt-4";
    cancelledMessage.textContent = "Payment was cancelled. Your cart is still saved.";
  }
  renderProducts();
  var searchQuery = new URLSearchParams(window.location.search).get("search") || "";
  filterProducts(searchQuery);
  renderCart();
}());