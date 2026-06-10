let cart = [];

// Adicionar ao carrinho
function addToCart(productId, productName, productPrice, productImg) {
    const existingProduct = cart.find(item => item.id === productId);

    if (existingProduct) {
        existingProduct.quantity += 1;
    } else {
        cart.push({
            id: productId,
            name: productName,
            price: productPrice,
            img: productImg,
            quantity: 1
        });
    }

    updateCart();
}

// Atualizar carrinho
function updateCart() {
    const cartItemsContainer = document.getElementById('cart-items');
    cartItemsContainer.innerHTML = '';

    let total = 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = "<p style='text-align:center;'>Carrinho vazio 🛒</p>";
    }

    cart.forEach(item => {
        const priceNumber = parseFloat(item.price.replace('R$', '').replace(',', '.'));
        total += priceNumber * item.quantity;

        const cartItem = document.createElement('div');
        cartItem.classList.add('cart-item');

        cartItem.innerHTML = `
            <img src="${item.img}" alt="${item.name}" />
            <div class="cart-item-info">
                <span>${item.name}</span>
                <span class="price">${item.price}</span>
            </div>
            <div class="quantity-buttons">
                <button class="quantity-btn" onclick="decreaseQuantity('${item.id}')">-</button>
                <span>${item.quantity}</span>
                <button class="quantity-btn" onclick="increaseQuantity('${item.id}')">+</button>
            </div>
        `;

        cartItemsContainer.appendChild(cartItem);
    });

    document.getElementById('cart-total').innerText =
        `Total: R$ ${total.toFixed(2).replace('.', ',')}`;
}

// Aumentar quantidade
function increaseQuantity(productId) {
    const product = cart.find(item => item.id === productId);

    if (product) {
        product.quantity += 1;
        updateCart();
    }
}

// Diminuir quantidade (remove quando chega a 0)
function decreaseQuantity(productId) {
    const index = cart.findIndex(item => item.id === productId);

    if (index !== -1) {
        if (cart[index].quantity > 1) {
            cart[index].quantity -= 1;
        } else {
            cart.splice(index, 1);
        }
        updateCart();
    }
}

// Mostrar carrinho
function showCart() {
    document.getElementById('cart-container').style.display = 'block';
    document.getElementById('main-content').style.display = 'none';
}

// Esconder carrinho
function hideCart() {
    document.getElementById('cart-container').style.display = 'none';
    document.getElementById('main-content').style.display = 'flex';
}

// Eventos dos botões principais
document.getElementById('cart-button').addEventListener('click', showCart);
document.getElementById('checkout-button').addEventListener('click', hideCart);

// Botões de adicionar produto (com ID único)
const productButtons = document.querySelectorAll('.product-item-button button');

productButtons.forEach((button, index) => {
    button.addEventListener('click', (e) => {
        const productItem = e.target.closest('.product-item');

        const productId = "product-" + index;
        const productName = productItem.querySelector('h2').innerText;
        const productPrice = productItem.querySelector('h3').innerText;
        const productImg = productItem.querySelector('img').src;

        addToCart(productId, productName, productPrice, productImg);
    });
});
