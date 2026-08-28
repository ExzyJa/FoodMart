(function($) {

  "use strict";

  var initPreloader = function() {
    $(document).ready(function($) {
    var Body = $('body');
        Body.addClass('preloader-site');
    });
    $(window).load(function() {
        $('.preloader-wrapper').fadeOut();
        $('body').removeClass('preloader-site');
    });
  }

  // init Chocolat light box
	var initChocolat = function() {
		Chocolat(document.querySelectorAll('.image-link'), {
		  imageSize: 'contain',
		  loop: true,
		})
	}

  var initSwiper = function() {

    var swiper = new Swiper(".main-swiper", {
      speed: 500,
      pagination: {
        el: ".swiper-pagination",
        clickable: true,
      },
    });

    var category_swiper = new Swiper(".category-carousel", {
      slidesPerView: 6,
      spaceBetween: 30,
      speed: 500,
      navigation: {
        nextEl: ".category-carousel-next",
        prevEl: ".category-carousel-prev",
      },
      breakpoints: {
        0: {
          slidesPerView: 2,
        },
        768: {
          slidesPerView: 3,
        },
        991: {
          slidesPerView: 4,
        },
        1500: {
          slidesPerView: 6,
        },
      }
    });

    var brand_swiper = new Swiper(".brand-carousel", {
      slidesPerView: 4,
      spaceBetween: 30,
      speed: 500,
      navigation: {
        nextEl: ".brand-carousel-next",
        prevEl: ".brand-carousel-prev",
      },
      breakpoints: {
        0: {
          slidesPerView: 2,
        },
        768: {
          slidesPerView: 2,
        },
        991: {
          slidesPerView: 3,
        },
        1500: {
          slidesPerView: 4,
        },
      }
    });

    var products_swiper = new Swiper(".products-carousel", {
      slidesPerView: 5,
      spaceBetween: 30,
      speed: 500,
      navigation: {
        nextEl: ".products-carousel-next",
        prevEl: ".products-carousel-prev",
      },
      breakpoints: {
        0: {
          slidesPerView: 1,
        },
        768: {
          slidesPerView: 3,
        },
        991: {
          slidesPerView: 4,
        },
        1500: {
          slidesPerView: 6,
        },
      }
    });
  }

  var initProductQty = function(){

    $('.product-qty').each(function(){

      var $el_product = $(this);
      $el_product.find('.quantity-right-plus').click(function(e){
          e.preventDefault();
          var quantity = parseInt($el_product.find('.input-number').val(), 10) || 1;
          $el_product.find('.input-number').val(quantity + 1);
      });

      $el_product.find('.quantity-left-minus').click(function(e){
          e.preventDefault();
          var quantity = parseInt($el_product.find('.input-number').val(), 10) || 1;
          if(quantity > 1){
            $el_product.find('.input-number').val(quantity - 1);
          }
      });

    });

  }

  var initShopping = function() {
    var cart = JSON.parse(localStorage.getItem('foodmart-home-cart') || '[]');
    var wishlist = JSON.parse(localStorage.getItem('foodmart-wishlist') || '[]');
    var $cartItems = $('#cart-items');
    var $cartCount = $('#cart-count');
    var $cartTotal = $('#cart-total');
    var $headerCartTotal = $('.cart-total');
    var $wishlistItems = $('#wishlist-items');

    var money = function(value) {
      return '$' + value.toFixed(2);
    };

    var saveCart = function() {
      localStorage.setItem('foodmart-home-cart', JSON.stringify(cart));
    };

    var renderCart = function() {
      var itemCount = cart.reduce(function(total, item) { return total + item.quantity; }, 0);
      var total = cart.reduce(function(sum, item) { return sum + item.price * item.quantity; }, 0);

      $cartCount.text(itemCount);
      $cartTotal.text(money(total));
      $headerCartTotal.text(money(total));

      if (!cart.length) {
        $cartItems.html('<li class="list-group-item text-muted">Your cart is empty.</li>');
        return;
      }

      $cartItems.html(cart.map(function(item) {
        return '<li class="list-group-item d-flex justify-content-between align-items-center lh-sm">' +
          '<div><h6 class="my-0">' + item.name + '</h6><small class="text-body-secondary">' + item.quantity + ' x ' + money(item.price) + '</small></div>' +
          '<div class="d-flex align-items-center gap-2"><span>' + money(item.price * item.quantity) + '</span><button type="button" class="btn btn-sm btn-outline-danger remove-cart-item" data-id="' + item.id + '" aria-label="Remove ' + item.name + '">&times;</button></div>' +
          '</li>';
      }).join(''));
    };

    var renderWishlist = function() {
      if (!$wishlistItems.length) return;
      var favoriteProducts = $('.product-item').filter(function() {
        return wishlist.indexOf(String($(this).data('product-id'))) !== -1;
      });
      $('#wishlist-count').text(favoriteProducts.length);
      $('.nav-wishlist').attr('aria-label', 'Open favorites (' + favoriteProducts.length + ')');
      if (!favoriteProducts.length) {
        $wishlistItems.html('<li class="list-group-item text-muted">Your favorites are empty.</li>');
        return;
      }
      $wishlistItems.html(favoriteProducts.map(function() {
        var $product = $(this);
        var productId = String($product.data('product-id'));
        return '<li class="list-group-item d-flex justify-content-between align-items-center gap-2">' +
          '<span>' + $product.find('h3').first().text().trim() + '</span>' +
          '<button type="button" class="btn btn-sm btn-outline-danger remove-wishlist" data-id="' + productId + '" aria-label="Remove ' + $product.find('h3').first().text().trim() + ' from favorites">Remove</button>' +
          '</li>';
      }).get().join(''));
    };

    $('.product-item').each(function(index) {
      var $product = $(this);
      if (!$product.find('h3').length || !$product.find('.price').length) return;

      $product.attr('data-product-id', index);
      var productId = String(index);
      var isWishlisted = wishlist.indexOf(productId) !== -1;
      $product.find('.btn-wishlist')
        .toggleClass('active', isWishlisted)
        .attr('aria-pressed', isWishlisted ? 'true' : 'false')
        .attr('aria-label', isWishlisted ? 'Remove ' + $product.find('h3').first().text().trim() + ' from favorites' : 'Add ' + $product.find('h3').first().text().trim() + ' to favorites');
      $product.find('a').filter(function() {
        return $(this).text().trim().indexOf('Add to Cart') === 0;
      }).addClass('add-to-cart');
    });

    $(document).on('click', '.add-to-cart', function(e) {
      e.preventDefault();
      var $product = $(this).closest('.product-item');
      var id = $product.data('product-id');
      var quantity = Math.max(1, parseInt($product.find('.input-number').val(), 10) || 1);
      var pendingItem = {
        id: id,
        name: $product.find('h3').first().text().trim(),
        price: parseFloat($product.find('.price').first().text().replace(/[^0-9.]/g, '')) || 0,
        quantity: quantity
      };

      if (!window.FoodMartAuth.requireLoginForCart(pendingItem, 'index.html')) return;
      var existing = cart.filter(function(item) { return item.id === id; })[0];

      if (existing) {
        existing.quantity += quantity;
      } else {
        cart.push(pendingItem);
      }
      saveCart();
      renderCart();
    });

    $(document).on('click', '.remove-cart-item', function() {
      var id = $(this).data('id');
      cart = cart.filter(function(item) { return item.id !== id; });
      saveCart();
      renderCart();
    });

    $(document).on('click', '.btn-wishlist', function(e) {
      e.preventDefault();
      if (!window.FoodMartAuth.requireLoginForWishlist()) return;
      var $button = $(this);
      var productId = String($button.closest('.product-item').data('product-id'));
      var productName = $button.closest('.product-item').find('h3').first().text().trim();
      var isActive = !$button.hasClass('active');
      wishlist = wishlist.filter(function(id) { return id !== productId; });
      if (isActive) wishlist.push(productId);
      localStorage.setItem('foodmart-wishlist', JSON.stringify(wishlist));
      $button.toggleClass('active', isActive)
        .attr('aria-pressed', isActive ? 'true' : 'false')
        .attr('aria-label', isActive ? 'Remove ' + productName + ' from favorites' : 'Add ' + productName + ' to favorites');
      renderWishlist();
    });

    $(document).on('click', '.remove-wishlist', function() {
      var productId = String($(this).data('id'));
      wishlist = wishlist.filter(function(id) { return id !== productId; });
      localStorage.setItem('foodmart-wishlist', JSON.stringify(wishlist));
      $('.product-item[data-product-id="' + productId + '"] .btn-wishlist')
        .removeClass('active')
        .attr('aria-pressed', 'false')
        .attr('aria-label', 'Add this product to favorites');
      renderWishlist();
    });

    var filterProducts = function(query) {
      query = query.toLowerCase().trim();
      $('.product-item').each(function() {
        var $product = $(this);
        var matches = !query || $product.text().toLowerCase().indexOf(query) !== -1;
        var $column = $product.closest('.col');
        ($column.length ? $column : $product)[matches ? 'show' : 'hide']();
      });
    };

    $('#search-form input, #offcanvasSearch input').on('input', function() {
      filterProducts($(this).val());
    });

    $('#search-form, #offcanvasSearch form').submit(function(e) {
      e.preventDefault();
      filterProducts($(this).find('input').val());
      bootstrap.Offcanvas.getOrCreateInstance(document.getElementById('offcanvasSearch')).hide();
      document.querySelector('.product-tabs').scrollIntoView({ behavior: 'smooth' });
    });

    $('form[role="newsletter"], .bg-secondary form').submit(function(e) {
      e.preventDefault();
      if ($(this).find('input[type="email"]').val()) alert('Thanks for subscribing!');
    });

    $('.offcanvas-body .btn-lg[type="submit"]').click(function(e) {
      e.preventDefault();
      alert(cart.length ? 'Checkout is ready to connect to a payment provider.' : 'Add an item to your cart first.');
    });

    var pending = window.FoodMartAuth.takePendingCart();
    if (pending && pending.returnUrl === 'index.html' && pending.item) {
      var pendingExisting = cart.filter(function(item) { return item.id === pending.item.id; })[0];
      if (pendingExisting) pendingExisting.quantity += pending.item.quantity;
      else cart.push(pending.item);
      saveCart();
    }
    renderCart();
    renderWishlist();
  };

  var initSocialLinks = function() {
    var socialLinks = document.querySelectorAll('.social-links li a');
    var replacements = [
      {
        href: 'https://github.com/ExzyJa/FoodMart',
        label: 'GitHub',
        path: 'M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.69c-2.78.6-3.37-1.18-3.37-1.18a2.65 2.65 0 0 0-1.11-1.46c-.91-.62.07-.61.07-.61a2.1 2.1 0 0 1 1.53 1.03a2.12 2.12 0 0 0 2.9.83a2.1 2.1 0 0 1 .63-1.33c-2.22-.25-4.55-1.11-4.55-4.94a3.87 3.87 0 0 1 1.03-2.68a3.6 3.6 0 0 1 .1-2.64s.84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02a3.6 3.6 0 0 1 .1 2.64a3.87 3.87 0 0 1 1.03 2.68c0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z'
      },
      {
        href: 'portfolio.html',
        label: 'Portfolio',
        path: 'M9 4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2h4a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3Zm2 0v1h2V4h-2Zm9 5H4v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9Zm-9 2h2v2h-2v-2Z'
      },
      {
        href: 'https://www.tiktok.com/',
        label: 'TikTok',
        path: 'M16 3c.4 2.1 1.6 3.4 3.7 3.5v3.2a8.1 8.1 0 0 1-3.7-1.1v6.1a6.3 6.3 0 1 1-5.5-6.2v3.3a3.1 3.1 0 1 0 2.4 3V3H16Z'
      }
    ];
    [1, 2, 4].forEach(function(index, replacementIndex) {
      var link = socialLinks[index];
      var replacement = replacements[replacementIndex];
      if (!link || !replacement) return;
      link.href = replacement.href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.setAttribute('aria-label', replacement.label);
      link.title = replacement.label;
      link.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="' + replacement.path + '"></path></svg>';
    });
  };

  // init jarallax parallax
  var initJarallax = function() {
    jarallax(document.querySelectorAll(".jarallax"));

    jarallax(document.querySelectorAll(".jarallax-keep-img"), {
      keepImg: true,
    });
  }

  // document ready
  $(document).ready(function() {
    
    initPreloader();
    initSwiper();
    initProductQty();
    initShopping();
    initSocialLinks();
    initJarallax();
    initChocolat();

  }); // End of a document

})(jQuery);