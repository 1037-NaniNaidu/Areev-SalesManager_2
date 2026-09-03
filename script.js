/* =========================================================
   AREEV SALES MANAGER
   Fresh JavaScript
   ========================================================= */

"use strict";

/* =========================
   STORAGE KEYS
========================= */

const STORAGE = {
    products: "areev_products",
    customers: "areev_customers",
    sales: "areev_sales",
    profile: "areev_profile"
};


/* =========================
   GLOBAL STATE
========================= */

let products = loadData(STORAGE.products, []);
let customers = loadData(STORAGE.customers, []);
let sales = loadData(STORAGE.sales, []);
let profile = loadData(STORAGE.profile, {
    name: "",
    phone: "",
    age: "",
    gender: "",
    photo: ""
});

let cart = [];
let selectedCustomerId = "";


/* =========================
   BASIC HELPERS
========================= */

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

function loadData(key, fallback) {
    try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : fallback;
    } catch (error) {
        console.error("Storage error:", error);
        return fallback;
    }
}

function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function saveAll() {
    saveData(STORAGE.products, products);
    saveData(STORAGE.customers, customers);
    saveData(STORAGE.sales, sales);
    saveData(STORAGE.profile, profile);
}

function money(value) {
    return "₹" + Number(value || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function today() {
    const date = new Date();
    return date.toISOString().split("T")[0];
}

function formatDate(dateString) {
    if (!dateString) return "-";

    const date = new Date(dateString);

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


/* =========================
   DOM HELPER
========================= */

function $(id) {
    return document.getElementById(id);
}


/* =========================================================
   PAGE INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    setupNavigation();
    setupForms();
    setupSearch();
    setupProfile();

    refreshEverything();
});


/* =========================================================
   NAVIGATION
========================================================= */

function setupNavigation() {

    document.querySelectorAll("[data-section]").forEach(button => {

        button.addEventListener("click", () => {

            const sectionId = button.dataset.section;

            showSection(sectionId);

        });

    });

}


function showSection(sectionId) {

    document.querySelectorAll(".app-section").forEach(section => {
        section.classList.remove("active");
    });

    const target = $(sectionId);

    if (target) {
        target.classList.add("active");
    }

    document.querySelectorAll("[data-section]").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.section === sectionId
        );
    });

    if (sectionId === "dashboard") {
        updateDashboard();
    }

    if (sectionId === "sales") {
        renderSales();
    }

    if (sectionId === "customers") {
        renderCustomers();
    }

    if (sectionId === "products") {
        renderProducts();
    }
}


/* =========================================================
   FORM SETUP
========================================================= */

function setupForms() {

    const customerForm = $("customerForm");

    if (customerForm) {
        customerForm.addEventListener("submit", event => {
            event.preventDefault();
            addCustomer();
        });
    }


    const productForm = $("productForm");

    if (productForm) {
        productForm.addEventListener("submit", event => {
            event.preventDefault();
            addProduct();
        });
    }


    const saleForm = $("saleForm");

    if (saleForm) {
        saleForm.addEventListener("submit", event => {
            event.preventDefault();
            addToCart();
        });
    }

}


/* =========================================================
   CUSTOMERS
========================================================= */

function addCustomer() {

    const nameInput = $("customerName");
    const phoneInput = $("customerPhone");
    const regularInput = $("regularCustomer");

    if (!nameInput) return;

    const name = nameInput.value.trim();
    const phone = phoneInput ? phoneInput.value.trim() : "";
    const regular = regularInput ? regularInput.checked : false;

    if (!name) {
        alert("Please enter customer name.");
        return;
    }

    const customer = {
        id: generateId(),
        name,
        phone,
        regular,
        createdAt: new Date().toISOString()
    };

    customers.push(customer);

    saveData(STORAGE.customers, customers);

    nameInput.value = "";

    if (phoneInput) phoneInput.value = "";
    if (regularInput) regularInput.checked = false;

    refreshEverything();

    alert("Customer added successfully.");
}


function renderCustomers(searchText = "") {

    const container = $("customersList");

    if (!container) return;

    const search = searchText.toLowerCase();

    const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(search) ||
        customer.phone.toLowerCase().includes(search)
    );

    if (filtered.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                <h3>No customers found</h3>
                <p>Add your first customer.</p>
            </div>
        `;

        return;
    }

    container.innerHTML = filtered.map(customer => {

        const customerSales = sales.filter(
            sale => sale.customerId === customer.id
        );

        const total = customerSales.reduce(
            (sum, sale) => sum + Number(sale.total),
            0
        );

        return `
            <div class="customer-card">

                <div class="customer-info">

                    <h3>${escapeHTML(customer.name)}</h3>

                    <p>
                        ${customer.phone
                            ? escapeHTML(customer.phone)
                            : "No phone number"}
                    </p>

                    <small>
                        ${customer.regular ? "⭐ Regular Customer" : "Customer"}
                    </small>

                </div>

                <div class="customer-total">
                    <strong>${money(total)}</strong>
                    <span>Total Sales</span>
                </div>

                <div class="customer-actions">

                    <button onclick="selectCustomer('${customer.id}')">
                        New Sale
                    </button>

                    <button onclick="customerReport('${customer.id}')">
                        Report
                    </button>

                    <button onclick="editCustomer('${customer.id}')">
                        Edit
                    </button>

                    <button onclick="deleteCustomer('${customer.id}')">
                        Delete
                    </button>

                </div>

            </div>
        `;

    }).join("");
}


function selectCustomer(customerId) {

    const customer = customers.find(
        item => item.id === customerId
    );

    if (!customer) return;

    selectedCustomerId = customerId;

    const customerSelect = $("saleCustomer");

    if (customerSelect) {
        customerSelect.value = customerId;
    }

    showSection("newSale");

    updateSaleProductDropdown();
}


function editCustomer(customerId) {

    const customer = customers.find(
        item => item.id === customerId
    );

    if (!customer) return;

    const newName = prompt(
        "Customer name:",
        customer.name
    );

    if (newName === null) return;

    const name = newName.trim();

    if (!name) {
        alert("Customer name cannot be empty.");
        return;
    }

    const newPhone = prompt(
        "Phone number:",
        customer.phone || ""
    );

    if (newPhone === null) return;

    customer.name = name;
    customer.phone = newPhone.trim();

    saveData(STORAGE.customers, customers);

    refreshEverything();
}


function deleteCustomer(customerId) {

    const customer = customers.find(
        item => item.id === customerId
    );

    if (!customer) return;

    const confirmed = confirm(
        `Delete customer "${customer.name}"?`
    );

    if (!confirmed) return;

    customers = customers.filter(
        item => item.id !== customerId
    );

    saveData(STORAGE.customers, customers);

    refreshEverything();
}


/* =========================================================
   REGULAR CUSTOMERS
========================================================= */

function renderRegularCustomers() {

    const container = $("regularCustomersList");

    if (!container) return;

    const regularCustomers = customers.filter(
        customer => customer.regular
    );

    if (regularCustomers.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                <h3>No regular customers</h3>
                <p>Mark a customer as regular when adding them.</p>
            </div>
        `;

        return;
    }

    container.innerHTML = regularCustomers.map(customer => {

        const customerSales = sales.filter(
            sale => sale.customerId === customer.id
        );

        const total = customerSales.reduce(
            (sum, sale) => sum + Number(sale.total),
            0
        );

        return `
            <div class="customer-card">

                <div>
                    <h3>⭐ ${escapeHTML(customer.name)}</h3>
                    <p>${escapeHTML(customer.phone || "")}</p>
                </div>

                <div>
                    <strong>${money(total)}</strong>
                    <small>Total Sales</small>
                </div>

                <button onclick="customerReport('${customer.id}')">
                    View Report
                </button>

            </div>
        `;

    }).join("");
}


/* =========================================================
   PRODUCTS
========================================================= */

function addProduct() {

    const nameInput = $("productName");
    const priceInput = $("productPrice");
    const stockInput = $("productStock");

    if (!nameInput || !priceInput || !stockInput) return;

    const name = nameInput.value.trim();
    const price = Number(priceInput.value);
    const stock = Number(stockInput.value);

    if (!name) {
        alert("Please enter product name.");
        return;
    }

    if (!Number.isFinite(price) || price <= 0) {
        alert("Please enter a valid selling price.");
        return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
        alert("Please enter a valid stock quantity.");
        return;
    }

    const product = {
        id: generateId(),
        name,
        price,
        stock,
        originalStock: stock,
        createdAt: new Date().toISOString()
    };

    products.push(product);

    saveData(STORAGE.products, products);

    nameInput.value = "";
    priceInput.value = "";
    stockInput.value = "";

    refreshEverything();

    alert("Product added successfully.");
}


function renderProducts(searchText = "") {

    const container = $("productsList");

    if (!container) return;

    const search = searchText.toLowerCase();

    const filtered = products.filter(product =>
        product.name.toLowerCase().includes(search)
    );

    if (filtered.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                <h3>No products found</h3>
                <p>Add your first product.</p>
            </div>
        `;

        return;
    }

    container.innerHTML = filtered.map(product => {

        const stockClass =
            product.stock === 0
                ? "out-of-stock"
                : product.stock <= 5
                    ? "low-stock"
                    : "in-stock";

        return `
            <div class="product-card">

                <div>
                    <h3>${escapeHTML(product.name)}</h3>
                    <p>${money(product.price)}</p>
                </div>

                <div class="stock-info ${stockClass}">
                    <strong>${product.stock}</strong>
                    <span>Remaining</span>
                </div>

                <div class="product-actions">

                    <button onclick="editProduct('${product.id}')">
                        Edit
                    </button>

                    <button onclick="addStock('${product.id}')">
                        Add Stock
                    </button>

                    <button onclick="deleteProduct('${product.id}')">
                        Delete
                    </button>

                </div>

            </div>
        `;

    }).join("");
}


function editProduct(productId) {

    const product = products.find(
        item => item.id === productId
    );

    if (!product) return;

    const name = prompt(
        "Product name:",
        product.name
    );

    if (name === null) return;

    const priceText = prompt(
        "Selling price:",
        product.price
    );

    if (priceText === null) return;

    const price = Number(priceText);

    if (!Number.isFinite(price) || price <= 0) {
        alert("Invalid price.");
        return;
    }

    product.name = name.trim();
    product.price = price;

    saveData(STORAGE.products, products);

    refreshEverything();
}


function addStock(productId) {

    const product = products.find(
        item => item.id === productId
    );

    if (!product) return;

    const amountText = prompt(
        `Current stock: ${product.stock}\n\nHow many units do you want to add?`
    );

    if (amountText === null) return;

    const amount = Number(amountText);

    if (!Number.isInteger(amount) || amount <= 0) {
        alert("Enter a valid whole number.");
        return;
    }

    product.stock += amount;
    product.originalStock += amount;

    saveData(STORAGE.products, products);

    refreshEverything();
}


function deleteProduct(productId) {

    const product = products.find(
        item => item.id === productId
    );

    if (!product) return;

    const confirmed = confirm(
        `Delete "${product.name}"?`
    );

    if (!confirmed) return;

    products = products.filter(
        item => item.id !== productId
    );

    saveData(STORAGE.products, products);

    refreshEverything();
}


/* =========================================================
   SALE CUSTOMER DROPDOWN
========================================================= */

function updateCustomerDropdown() {

    const select = $("saleCustomer");

    if (!select) return;

    const currentValue = select.value;

    select.innerHTML = `
        <option value="">Select Customer</option>
        ${customers.map(customer => `
            <option value="${customer.id}">
                ${escapeHTML(customer.name)}
            </option>
        `).join("")}
    `;

    if (customers.some(c => c.id === currentValue)) {
        select.value = currentValue;
    }

    if (selectedCustomerId &&
        customers.some(c => c.id === selectedCustomerId)) {

        select.value = selectedCustomerId;
    }
}


/* =========================================================
   SALE PRODUCT DROPDOWN
========================================================= */

function updateSaleProductDropdown() {

    const select = $("saleProduct");

    if (!select) return;

    select.innerHTML = `
        <option value="">Select Product</option>

        ${products.map(product => `
            <option
                value="${product.id}"
                ${product.stock <= 0 ? "disabled" : ""}
            >
                ${escapeHTML(product.name)}
                — ${money(product.price)}
                — Stock: ${product.stock}
            </option>
        `).join("")}
    `;
}


/* =========================================================
   ADD ITEM TO CART
========================================================= */

function addToCart() {

    const customerSelect = $("saleCustomer");
    const productSelect = $("saleProduct");
    const quantityInput = $("saleQuantity");

    if (!customerSelect || !productSelect || !quantityInput) {
        return;
    }

    const customerId = customerSelect.value;
    const productId = productSelect.value;
    const quantity = Number(quantityInput.value);

    if (!customerId) {
        alert("Please select a customer.");
        return;
    }

    if (!productId) {
        alert("Please select a product.");
        return;
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
        alert("Enter a valid quantity.");
        return;
    }

    const product = products.find(
        item => item.id === productId
    );

    if (!product) {
        alert("Product not found.");
        return;
    }

    const existingCartItem = cart.find(
        item => item.productId === productId
    );

    const alreadyInCart = existingCartItem
        ? existingCartItem.quantity
        : 0;

    if (alreadyInCart + quantity > product.stock) {
        alert(
            `Only ${product.stock} units of ${product.name} are available.`
        );
        return;
    }

    if (existingCartItem) {

        existingCartItem.quantity += quantity;

        existingCartItem.total =
            existingCartItem.quantity *
            existingCartItem.price;

    } else {

        cart.push({
            id: generateId(),
            productId: product.id,
            productName: product.name,
            price: product.price,
            quantity,
            total: product.price * quantity
        });

    }

    quantityInput.value = "";

    renderCart();
}


/* =========================================================
   CART
========================================================= */

function renderCart() {

    const container = $("cartItems");
    const totalElement = $("cartTotal");

    if (!container) return;

    if (cart.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                <p>Your cart is empty.</p>
            </div>
        `;

        if (totalElement) {
            totalElement.textContent = money(0);
        }

        return;
    }

    container.innerHTML = cart.map(item => `

        <div class="cart-item">

            <div>
                <h4>${escapeHTML(item.productName)}</h4>
                <p>
                    ${item.quantity} × ${money(item.price)}
                </p>
            </div>

            <strong>
                ${money(item.total)}
            </strong>

            <button onclick="removeFromCart('${item.id}')">
                ✕
            </button>

        </div>

    `).join("");

    const total = cart.reduce(
        (sum, item) => sum + item.total,
        0
    );

    if (totalElement) {
        totalElement.textContent = money(total);
    }
}


function removeFromCart(cartItemId) {

    cart = cart.filter(
        item => item.id !== cartItemId
    );

    renderCart();
}


function clearCart() {

    if (cart.length === 0) return;

    const confirmed = confirm(
        "Clear all items from
                
