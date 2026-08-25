/* =========================================================
   SALES MANAGER
   ========================================================= */

const STORAGE_KEY = "sales_manager_v3";


/* =========================================================
   DATA
   ========================================================= */

let data = loadData();

if (!data) {

    data = {
        profile: null,
        products: [],
        customers: [],
        sales: [],
        cart: []
    };

    saveData();
}


/* =========================================================
   STORAGE
   ========================================================= */

function saveData() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
    );
}


function loadData() {

    try {

        const saved =
            localStorage.getItem(STORAGE_KEY);

        return saved
            ? JSON.parse(saved)
            : null;

    } catch (error) {

        console.error(error);

        return null;
    }
}


/* =========================================================
   HELPERS
   ========================================================= */

function money(value) {

    return "₹" +
        Number(value || 0).toLocaleString(
            "en-IN",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );
}


function today() {

    const date = new Date();

    const year =
        date.getFullYear();

    const month =
        String(date.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(date.getDate())
            .padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function createId(prefix) {

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


function getValue(id) {

    const element =
        document.getElementById(id);

    return element
        ? element.value.trim()
        : "";
}


function setValue(id, value) {

    const element =
        document.getElementById(id);

    if (element) {

        element.value =
            value ?? "";
    }
}


function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function formatDate(dateString) {

    if (!dateString)
        return "";

    const parts =
        dateString.split("-");

    if (parts.length !== 3)
        return dateString;

    return `${parts[2]}-${parts[1]}-${parts[0]}`;
}


function getCustomer(customerId) {

    return data.customers.find(
        customer =>
            customer.id === customerId
    );
}


function getProduct(productId) {

    return data.products.find(
        product =>
            product.id === productId
    );
}


function getRemainingStock(product) {

    return Math.max(
        0,
        Number(product.totalStock || 0) -
        Number(product.soldQuantity || 0)
    );
}


/* =========================================================
   FIRST TIME SETUP
   ========================================================= */

const setupScreen =
    document.getElementById("setupScreen");

const mainApp =
    document.getElementById("mainApp");


function startApplication() {

    if (!data.profile) {

        setupScreen.classList.remove("hidden");

        mainApp.classList.add("hidden");

        return;
    }

    setupScreen.classList.add("hidden");

    mainApp.classList.remove("hidden");

    loadProfile();

    showPage("homePage");

    renderHome();

    updateDashboard();
}


document
    .getElementById("createProfileButton")
    .addEventListener(
        "click",
        createProfile
    );


function createProfile() {

    const name =
        getValue("setupName");

    const phone =
        getValue("setupPhone");

    const age =
        getValue("setupAge");

    const gender =
        getValue("setupGender");


    if (
        !name ||
        !phone ||
        !age ||
        !gender
    ) {

        alert(
            "Please complete all profile details."
        );

        return;
    }


    data.profile = {

        name,
        phone,
        age: Number(age),
        gender
    };


    saveData();

    startApplication();
}


/* =========================================================
   PROFILE
   ========================================================= */

function loadProfile() {

    const profile =
        data.profile;

    if (!profile)
        return;


    setValue(
        "profileName",
        profile.name
    );

    setValue(
        "profilePhone",
        profile.phone
    );

    setValue(
        "profileAge",
        profile.age
    );

    setValue(
        "profileGender",
        profile.gender
    );


    document.getElementById(
        "welcomeText"
    ).textContent =
        "Welcome, " +
        profile.name;
}


document
    .getElementById("saveProfile")
    .addEventListener(
        "click",
        saveProfile
    );


function saveProfile() {

    const name =
        getValue("profileName");

    const phone =
        getValue("profilePhone");

    const age =
        getValue("profileAge");

    const gender =
        getValue("profileGender");


    if (
        !name ||
        !phone ||
        !age ||
        !gender
    ) {

        alert(
            "Please complete all details."
        );

        return;
    }


    data.profile = {

        name,
        phone,
        age: Number(age),
        gender
    };


    saveData();

    loadProfile();

    alert(
        "Profile updated successfully."
    );
}


/* =========================================================
   PAGE NAVIGATION
   ========================================================= */

const pages =
    document.querySelectorAll(".page");

const navButtons =
    document.querySelectorAll(".nav-button");


function showPage(pageId) {

    pages.forEach(page => {

        page.classList.toggle(
            "active",
            page.id === pageId
        );

    });


    navButtons.forEach(button => {

        button.classList.toggle(
            "active",
            button.dataset.page === pageId
        );

    });


    if (pageId === "homePage")
        renderHome();

    if (pageId === "productsPage")
        renderProducts();

    if (pageId === "customersPage")
        renderCustomers();

    if (pageId === "salesPage")
        renderSales();

    if (pageId === "reportsPage")
        generateReport();

    if (pageId === "profilePage")
        loadProfile();

    if (pageId === "cartPage")
        renderCart();

    window.scrollTo(0, 0);
}


document
    .querySelectorAll("[data-page]")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                showPage(
                    button.dataset.page
                );

            }
        );

    });


/* =========================================================
   HOME
   ========================================================= */

document
    .getElementById("productSearch")
    .addEventListener(
        "input",
        renderHome
    );


function renderHome() {

    const container =
        document.getElementById(
            "homeProductList"
        );


    const search =
        getValue(
            "productSearch"
        ).toLowerCase();


    const products =
        data.products.filter(
            product =>
                product.name
                    .toLowerCase()
                    .includes(search)
        );


    if (!products.length) {

        container.innerHTML = `

            <div class="product-info">

                <p>
                    ${
                        data.products.length
                        ? "No matching products found."
                        : "No products added yet. Add products from Products."
                    }
                </p>

            </div>
        `;

        return;
    }


    container.innerHTML =
        products.map(product => {

            const remaining =
                getRemainingStock(product);

            return `

                <button
                    class="product-card"
                    data-product-id="${product.id}"
                >

                    <div>

                        <h3>
                            ${escapeHTML(product.name)}
                        </h3>

                        <div>
                            Stock: ${remaining}
                        </div>

                    </div>

                    <div>

                        <div class="product-price">
                            ${money(product.price)}
                        </div>

                    </div>

                </button>
            `;

        }).join("");


    container
        .querySelectorAll(
            "[data-product-id]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    openProduct(
                        button.dataset.productId
                    );

                }
            );

        });
}


/* =========================================================
   PRODUCT SELECTION
   ========================================================= */

let selectedProductId = null;


function openProduct(productId) {

    selectedProductId =
        productId;


    const product =
        getProduct(productId);

    if (!product)
        return;


    const remaining =
        getRemainingStock(product);


    const container =
        document.getElementById(
            "productDetails"
        );


    container.innerHTML = `

        <div class="product-info">

            <h2>
                ${escapeHTML(product.name)}
            </h2>

            <p>
                Selling price:
                <strong>
                    ${money(product.price)}
                </strong>
            </p>

            <div class="remaining-stock">

                Remaining stock:
                <strong>
                    ${remaining}
                </strong>

            </div>

            ${
                remaining > 0
                ?

                `

                <label>
                    Quantity to sell
                </label>

                <div class="quantity-control">

                    <button id="detailMinus">
                        −
                    </button>

                    <input
                        id="detailQuantity"
                        type="number"
                        min="1"
                        max="${remaining}"
                        value="1"
                    >

                    <button id="detailPlus">
                        +
                    </button>

                </div>

                <button
                    id="addCartButton"
                    class="primary-button"
                >
                    Add to Cart 🛒
                </button>
                `

                :

                `<p>This product is out of stock.</p>`
            }

        </div>
    `;


    if (remaining <= 0)
        return;


    const quantityInput =
        document.getElementById(
            "detailQuantity"
        );


    document
        .getElementById("detailMinus")
        .addEventListener(
            "click",
            () => {

                let value =
                    Number(
                        quantityInput.value
                    );

                value =
                    Math.max(1, value - 1);

                quantityInput.value =
                    value;
            }
        );


    document
        .getElementById("detailPlus")
        .addEventListener(
            "click",
            () => {

                let value =
                    Number(
                        quantityInput.value
                    );

                value =
                    Math.min(
                        remaining,
                        value + 1
                    );

                quantityInput.value =
                    value;
            }
        );


    document
        .getElementById("addCartButton")
        .addEventListener(
            "click",
            addSelectedProductToCart
        );


    showPage("productPage");
}


function addSelectedProductToCart() {

    const product =
        getProduct(selectedProductId);

    if (!product)
        return;


    const quantity =
        Number(
            getValue(
                "detailQuantity"
            )
        );


    const remaining =
        getRemainingStock(product);


    if (
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > remaining
    ) {

        alert(
            "Please enter a valid quantity."
        );

        return;
    }


    const existing =
        data.cart.find(
            item =>
                item.productId ===
                product.id
        );


    if (existing) {

        if (
            existing.quantity +
            quantity >
            remaining
        ) {

            alert(
                "You cannot add more than the remaining stock."
            );

            return;
        }


        existing.quantity +=
            quantity;

    } else {

        data.cart.push({

            productId:
                product.id,

            quantity
        });
    }


    saveData();

    renderCart();

    showPage("cartPage");
}


/* =========================================================
   CART
   ========================================================= */

function calculateCartTotal() {

    return data.cart.reduce(
        (total, item) => {

            const product =
                getProduct(
                    item.productId
                );

            if (!product)
                return total;

            return total +
                product.price *
                item.quantity;

        },
        0
    );
}


function renderCart() {

    const container =
        document.getElementById(
            "cartItems"
        );


    const count =
        data.cart.reduce(
            (total, item) =>
                total + item.quantity,
            0
        );


    document.getElementById(
        "cartItemCount"
    ).textContent =
        `${count} ${
            count === 1
            ? "item"
            : "items"
        }`;


    document.getElementById(
        "cartTotal"
    ).textContent =
        money(
            calculateCartTotal()
        );


    if (!data.cart.length) {

        container.innerHTML = `

            <div class="product-info">
                <p>Your cart is empty.</p>
            </div>
        `;

        return;
    }


    container.innerHTML =
        data.cart.map(item => {

            const product =
                getProduct(
                    item.productId
                );

            if (!product)
                return "";


            return `

                <div class="cart-item">

                    <div>

                        <strong>
                            ${escapeHTML(
                                product.name
                            )}
                        </strong>

                        <div>
                            ${money(product.price)}
                            each
                        </div>

                    </div>

                    <div>

                        <div class="cart-controls">

                            <button
                                data-minus="${product.id}"
                            >
                                −
                            </button>

                            <strong>
                                ${item.quantity}
                            </strong>

                            <button
                                data-plus="${product.id}"
                            >
                                +
                            </button>

                            <button
                                data-remove="${product.id}"
                            >
                                ×
                            </button>

                        </div>

                    </div>

                </div>
            `;

        }).join("");


    container
        .querySelectorAll("[data-minus]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    changeCartQuantity(
                        button.dataset.minus,
                        -1
                    );

                }
            );

        });


    container
        .querySelectorAll("[data-plus]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    changeCartQuantity(
                        button.dataset.plus,
                        1
                    );

                }
            );

        });


    container
        .querySelectorAll("[data-remove]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    removeFromCart(
                        button.dataset.remove
                    );

                }
            );

        });
}


function changeCartQuantity(
    productId,
    change
) {

    const item =
        data.cart.find(
            item =>
                item.productId ===
                productId
        );


    const product =
        getProduct(productId);


    if (!item || !product)
        return;


    let newQuantity =
        item.quantity +
        change;


    const remaining =
        getRemainingStock(product);


    if (newQuantity < 1)
        newQuantity = 1;


    if (newQuantity > remaining)
        newQuantity = remaining;


    if (remaining <= 0) {

        removeFromCart(productId);

        return;
    }


    item.quantity =
        newQuantity;


    saveData();

    renderCart();
}


function removeFromCart(productId) {

    data.cart =
        data.cart.filter(
            item =>
                item.productId !==
                productId
        );


    saveData();

    renderCart();
}


/* =========================================================
   CHECKOUT
   ========================================================= */

document
    .getElementById(
        "checkoutButton"
    )
    .addEventListener(
        "click",
        openCheckout
    );


function openCheckout() {

    if (!data.cart.length) {

        alert(
            "Your cart is empty."
        );

        return;
    }


    renderCustomerDropdown();

    renderCheckoutSummary();

    showPage("checkoutPage");
}


function renderCustomerDropdown() {

    const select =
        document.getElementById(
            "checkoutCustomer"
        );


    select.innerHTML = `

        <option value="">
            Walk-in / Normal Customer
        </option>
    `;


    data.customers.forEach(customer => {

        const option =
            document.createElement("option");

        option.value =
            customer.id;

        option.textContent =
            customer.type === "account"
            ? `${customer.name} — Regular`
            : customer.name;

        select.appendChild(option);

    });
}


function renderCheckoutSummary() {

    const container =
        document.getElementById(
            "checkoutSummary"
        );


    const total =
        calculateCartTotal();


    container.innerHTML = `

        <div class="summary-line">

            <span>
                Items
            </span>

            <strong>
                ${data.cart.redu
