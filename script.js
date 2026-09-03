/* =========================================================
   AREEV SALES MANAGER
   Fresh JavaScript
   ========================================================= */

"use strict";

/* =========================================================
   STORAGE
   ========================================================= */

const STORAGE_KEY = "areev_sales_manager_v1";

let appData = {
    profile: {
        name: "",
        phone: "",
        age: "",
        gender: "",
        photo: ""
    },

    customers: [],

    products: [],

    sales: []
};

let cart = [];


/* =========================================================
   LOAD / SAVE DATA
   ========================================================= */

function loadData() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (saved) {
            const parsed = JSON.parse(saved);

            appData = {
                profile: {
                    name: "",
                    phone: "",
                    age: "",
                    gender: "",
                    photo: "",
                    ...(parsed.profile || {})
                },

                customers: Array.isArray(parsed.customers)
                    ? parsed.customers
                    : [],

                products: Array.isArray(parsed.products)
                    ? parsed.products
                    : [],

                sales: Array.isArray(parsed.sales)
                    ? parsed.sales
                    : []
            };
        }
    } catch (error) {
        console.error("Could not load saved data:", error);
    }
}


function saveData() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(appData)
        );
    } catch (error) {
        console.error("Could not save data:", error);
    }
}


/* =========================================================
   ID GENERATOR
   ========================================================= */

function createId(prefix = "id") {
    return (
        prefix +
        "_" +
        Date.now() +
        "_" +
        Math.random()
            .toString(36)
            .substring(2, 8)
    );
}


/* =========================================================
   GENERAL HELPERS
   ========================================================= */

function formatCurrency(value) {
    const number = Number(value) || 0;

    return "₹" + number.toLocaleString("en-IN", {
        maximumFractionDigits: 2
    });
}


function todayString() {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function formatDate(dateString) {
    if (!dateString) return "";

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return dateString;
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}


function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    loadData();

    setupNavigation();
    setupForms();
    setupSearch();

    renderEverything();

});


/* =========================================================
   NAVIGATION
   ========================================================= */

function setupNavigation() {

    document.addEventListener("click", (event) => {

        const button = event.target.closest("[data-page]");

        if (!button) return;

        const page = button.dataset.page;

        showPage(page);
    });
}


function showPage(page) {

    document.querySelectorAll(".page").forEach(section => {
        section.classList.remove("active");
    });

    const target = document.getElementById(page);

    if (target) {
        target.classList.add("active");
    }

    document.querySelectorAll("[data-page]").forEach(button => {
        button.classList.remove("active");

        if (button.dataset.page === page) {
            button.classList.add("active");
        }
    });

    if (page === "dashboard") {
        renderDashboard();
    }

    if (page === "customers") {
        renderCustomers();
    }

    if (page === "products") {
        renderProducts();
    }

    if (page === "new-sale") {
        renderSalePage();
    }

    if (page === "sales") {
        renderSales();
    }

    if (page === "profile") {
        renderProfile();
    }
}


/* =========================================================
   FORM SETUP
   ========================================================= */

function setupForms() {

    const customerForm =
        document.getElementById("customerForm");

    if (customerForm) {
        customerForm.addEventListener("submit", event => {

            event.preventDefault();

            addCustomer();
        });
    }


    const productForm =
        document.getElementById("productForm");

    if (productForm) {
        productForm.addEventListener("submit", event => {

            event.preventDefault();

            addProduct();
        });
    }


    const saleForm =
        document.getElementById("saleForm");

    if (saleForm) {
        saleForm.addEventListener("submit", event => {

            event.preventDefault();

            addSaleToCart();
        });
    }


    const profileForm =
        document.getElementById("profileForm");

    if (profileForm) {
        profileForm.addEventListener("submit", event => {

            event.preventDefault();

            saveProfile();
        });
    }


    const photoInput =
        document.getElementById("profilePhoto");

    if (photoInput) {
        photoInput.addEventListener("change", handleProfilePhoto);
    }


    const confirmSaleButton =
        document.getElementById("confirmSale");

    if (confirmSaleButton) {
        confirmSaleButton.addEventListener(
            "click",
            completeSale
        );
    }

}


/* =========================================================
   CUSTOMER SYSTEM
   ========================================================= */

function addCustomer() {

    const nameInput =
        document.getElementById("customerName");

    const phoneInput =
        document.getElementById("customerPhone");

    const regularInput =
        document.getElementById("regularCustomer");


    const name =
        nameInput?.value.trim();

    const phone =
        phoneInput?.value.trim() || "";

    const regular =
        regularInput?.checked || false;


    if (!name) {
        alert("Please enter the customer name.");
        return;
    }


    const duplicate =
        appData.customers.some(customer =>
            customer.name.toLowerCase() === name.toLowerCase() &&
            customer.phone === phone
        );


    if (duplicate) {
        alert("This customer already exists.");
        return;
    }


    appData.customers.push({

        id: createId("customer"),

        name,

        phone,

        regular,

        createdAt: new Date().toISOString()

    });


    saveData();

    if (nameInput) nameInput.value = "";
    if (phoneInput) phoneInput.value = "";
    if (regularInput) regularInput.checked = false;


    renderEverything();

    alert("Customer added successfully.");
}


/* =========================================================
   PRODUCTS
   ========================================================= */

function addProduct() {

    const nameInput =
        document.getElementById("productName");

    const priceInput =
        document.getElementById("productPrice");

    const stockInput =
        document.getElementById("productStock");


    const name =
        nameInput?.value.trim();

    const price =
        Number(priceInput?.value);

    const stock =
        Number(stockInput?.value);


    if (!name) {
        alert("Please enter the product name.");
        return;
    }


    if (!Number.isFinite(price) || price < 0) {
        alert("Please enter a valid selling price.");
        return;
    }


    if (!Number.isInteger(stock) || stock < 0) {
        alert("Please enter a valid stock quantity.");
        return;
    }


    const duplicate =
        appData.products.some(product =>
            product.name.toLowerCase() === name.toLowerCase()
        );


    if (duplicate) {
        alert("A product with this name already exists.");
        return;
    }


    appData.products.push({

        id: createId("product"),

        name,

        price,

        totalStock: stock,

        soldStock: 0,

        remainingStock: stock,

        createdAt: new Date().toISOString()

    });


    saveData();

    if (nameInput) nameInput.value = "";
    if (priceInput) priceInput.value = "";
    if (stockInput) stockInput.value = "";


    renderEverything();

    alert("Product added successfully.");
}


/* =========================================================
   EDIT PRODUCT
   ========================================================= */

function editProduct(productId) {

    const product =
        appData.products.find(
            item => item.id === productId
        );

    if (!product) return;


    const newName =
        prompt(
            "Product name:",
            product.name
        );

    if (newName === null) return;


    const newPrice =
        prompt(
            "Selling price:",
            product.price
        );

    if (newPrice === null) return;


    const newStock =
        prompt(
            "Add stock quantity:",
            "0"
        );

    if (newStock === null) return;


    const price =
        Number(newPrice);

    const additionalStock =
        Number(newStock);


    if (!newName.trim()) {
        alert("Product name cannot be empty.");
        return;
    }


    if (!Number.isFinite(price) || price < 0) {
        alert("Invalid price.");
        return;
    }


    if (
        !Number.isInteger(additionalStock) ||
        additionalStock < 0
    ) {
        alert("Invalid stock quantity.");
        return;
    }


    product.name =
        newName.trim();

    product.price =
        price;


    product.totalStock +=
        additionalStock;

    product.remainingStock +=
        additionalStock;


    saveData();

    renderEverything();
}


/* =========================================================
   DELETE PRODUCT
   ========================================================= */

function deleteProduct(productId) {

    const product =
        appData.products.find(
            item => item.id === productId
        );

    if (!product) return;


    const confirmed =
        confirm(
            `Delete "${product.name}"?`
        );

    if (!confirmed) return;


    appData.products =
        appData.products.filter(
            item => item.id !== productId
        );


    cart =
        cart.filter(
            item => item.productId !== productId
        );


    saveData();

    renderEverything();
}


/* =========================================================
   DELETE CUSTOMER
   ========================================================= */

function deleteCustomer(customerId) {

    const customer =
        appData.customers.find(
            item => item.id === customerId
        );

    if (!customer) return;


    const confirmed =
        confirm(
            `Delete "${customer.name}"?`
        );

    if (!confirmed) return;


    appData.customers =
        appData.customers.filter(
            item => item.id !== customerId
        );


    saveData();

    renderEverything();
}


/* =========================================================
   SALES PAGE
   ========================================================= */

function renderSalePage() {

    populateCustomerDropdown();
    populateProductDropdown();
    renderCart();

}


function populateCustomerDropdown() {

    const select =
        document.getElementById("saleCustomer");

    if (!select) return;


    const current =
        select.value;


    select.innerHTML =
        `<option value="">Select customer</option>`;


    appData.customers.forEach(customer => {

        const option =
            document.createElement("option");

        option.value =
            customer.id;

        option.textContent =
            customer.name +
            (
                customer.regular
                    ? " ⭐"
                    : ""
            );

        select.appendChild(option);

    });


    if (
        appData.customers.some(
            customer => customer.id === current
        )
    ) {
        select.value = current;
    }
}


function populateProductDropdown() {

    const select =
        document.getElementById("saleProduct");

    if (!select) return;


    const current =
        select.value;


    select.innerHTML =
        `<option value="">Select product</option>`;


    appData.products.forEach(product => {

        const option =
            document.createElement("option");

        option.value =
            product.id;

        option.textContent =
            `${product.name} — ${formatCurrency(product.price)} — Stock: ${product.remainingStock}`;

        option.disabled =
            product.remainingStock <= 0;

        select.appendChild(option);

    });


    if (
        appData.products.some(
            product => product.id === current
        )
    ) {
        select.value = current;
    }
}


/* =========================================================
   PRODUCT PRICE PREVIEW
   ========================================================= */

function updateSaleAmount() {

    const productSelect =
        document.getElementById("saleProduct");

    const quantityInput =
        document.getElementById("saleQuantity");

    const priceElement =
        document.getElementById("salePrice");

    const amountElement =
        document.getElementById("saleAmount");


    if (!productSelect) return;


    const product =
        appData.products.find(
            item => item.id === productSelect.value
        );


    const quantity =
        Number(quantityInput?.value) || 0;


    if (!product) {

        if (priceElement)
            priceElement.textContent = "₹0";

        if (amountElement)
            amountElement.textContent = "₹0";

        return;
    }


    const amount =
        product.price * quantity;


    if (priceElement) {
        priceElement.textContent =
            formatCurrency(product.price);
    }


    if (amountElement) {
        amountElement.textContent =
            formatCurrency(amount);
    }
}


/* =========================================================
   ADD SALE TO CART
   ========================================================= */

function addSaleToCart() {

    const customerSelect =
        document.getElementById("saleCustomer");

    const productSelect =
        document.getElementById("saleProduct");

    const quantityInput =
        document.getElementById("saleQuantity");


    const customerId =
        customerSelect?.value;

    const productId =
        productSelect?.value;

    const quantity =
        Number(quantityInput?.value);


    if (!customerId) {
        alert("Please select a customer.");
        return;
    }


    if (!productId) {
        alert("Please select a product.");
        return;
    }


    if (
        !Number.isInteger(quantity) ||
        quantity <= 0
    ) {
        alert("Please enter a valid quantity.");
        return;
    }


    const product =
        appData.products.find(
            item => item.id === productId
        );


    if (!product) {
        alert("Product not found.");
        return;
    }


    const existing =
        cart.find(
            item => item.productId === productId
        );


    const currentCartQuantity =
        existing
            ? existing.quantity
            : 0;


    if (
        currentCartQuantity + quantity >
        product.remainingStock
    ) {

        alert(
            `Only ${product.remainingStock} units of "${product.name}" are available.`
        );

        return;
    }


    if (existing) {

        existing.quantity += quantity;

        existing.amount =
            existing.quantity *
            existing.price;

    } else {

        cart.push({

            productId,

            customerId,

            productName:
                product.name,

            price:
                product.price,

            quantity,

            amount:
                product.price *
                quantity

        });

    }


    if (quantityInput) {
        quantityInput.value = "1";
    }


    renderCart();

    updateSaleAmount();
}


/* =========================================================
   CART
   ========================================================= */

function renderCart() {

    const container =
        document.getElementById("cartItems");

    const totalElement =
        document.getElementById("cartTotal");


    if (!container) return;


    if (cart.length === 0) {

        container.innerHTML =
            `<p class="empty-message">Cart is empty.</p>`;

        if (totalElement) {
            totalElement.textContent =
                formatCurrency(0);
        }

        return;
    }


    let total = 0;


    container.innerHTML =
        cart.map((item, index) => {

            total += item.amount;


            return `
                <div class="cart-item">

                    <div>
                        <strong>
                            ${escapeHTML(item.productName)}
                        </strong>

                        <div>
                            ${item.quantity} ×
                            ${formatCurrency(item.price)}
                        </div>
                    </div>

                    <div>
                        <strong>
                            ${formatCurrency(item.amount)}
                        </strong>

                        <button
                            type="button"
                            onclick="removeFromCart(${index})"
                        >
                            Remove
                        </button>
                    </div>

                </div>
            `;

        }).join("");


    if (totalElement) {
        totalElement.textContent =
            formatCurrency(total);
    }
}


function removeFromCart(index) {

    if (
        index < 0 ||
        index >= cart.length
    ) {
        return;
    }


    cart.splice(index, 1);

    renderCart();
}


/* =========================================================
   COMPLETE SALE
   ========================================================= */

function completeSale() {

    if (cart.length === 0) {

        alert("Your cart is empty.");

        return;
    }


    const customerId =
        cart[0].customerId;


    const customer =
        appData.customers.find(
            item => item.id === customerId
        );


    if (!customer) {

        alert("Customer not found.");

        return;
    }


    /*
       Final stock verification
       before saving the sale.
    */

    for (const item of cart) {

        const product =
            appData.products.find(
                product =>
                    product.id === item.productId
            );


        if (!product) {

            alert(
                `Product "${item.productName}" no longer exists.`
            );

            return;
        }


        if (
            item.quantity >
            product.remainingStock
        ) {

            alert(
                
