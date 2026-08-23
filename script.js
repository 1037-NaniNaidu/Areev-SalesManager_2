/* =========================================================
   SALES MANAGER
   ========================================================= */

const STORAGE_KEY = "sales_manager_v2";


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
        Number(value || 0)
            .toLocaleString(
                "en-IN",
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            );

}


function today() {

    return new Date()
        .toISOString()
        .split("T")[0];

}


function createId(prefix) {

    return (
        prefix +
        "_" +
        Date.now() +
        "_" +
        Math.random()
            .toString(36)
            .substring(2, 7)
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

        name: name,

        phone: phone,

        age: Number(age),

        gender: gender

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

    if (!profile) return;


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
    document.querySelectorAll(
        ".nav-button"
    );


function showPage(pageId) {

    pages.forEach(
        page => {

            page.classList.toggle(
                "active",
                page.id === pageId
            );

        }
    );


    navButtons.forEach(
        button => {

            button.classList.toggle(
                "active",
                button.dataset.page === pageId
            );

        }
    );


    if (pageId === "homePage") {

        renderHome();

    }


    if (pageId === "productsPage") {

        renderProducts();

    }


    if (pageId === "customersPage") {

        renderCustomers();

    }


    if (pageId === "salesPage") {

        renderSales();

    }


    if (pageId === "reportsPage") {

        generateReport();

    }


    if (pageId === "profilePage") {

        loadProfile();

    }


    window.scrollTo(
        0,
        0
    );

}


document
    .querySelectorAll("[data-page]")
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    showPage(
                        button.dataset.page
                    );

                }
            );

        }
    );


/* =========================================================
   HOME PAGE
   ========================================================= */

document
    .getElementById("productSearch")
    .addEventListener(
        "input",
        renderHome
    );


function getRemainingStock(product) {

    return Math.max(
        0,
        product.totalStock -
        product.soldQuantity
    );

}


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
                        : "No products added yet. Add products from the Products section."
                    }
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML =
        products.map(
            product => `

                <button
                    class="product-card"
                    data-product-id="${product.id}"
                >

                    <div>

                        <h3>
                            ${escapeHTML(product.name)}
                        </h3>

                        <div>
                            Tap to select
                        </div>

                    </div>


                    <div>

                        <div class="product-price">
                            ${money(product.price)}
                        </div>

                    </div>

                </button>

            `
        ).join("");


    container
        .querySelectorAll(
            "[data-product-id]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        openProduct(
                            button.dataset.productId
                        );

                    }
                );

            }
        );

}


/* =========================================================
   PRODUCT SELECTION
   ========================================================= */

let selectedProductId = null;


function openProduct(productId) {

    selectedProductId =
        productId;


    const product =
        data.products.find(
            p => p.id === productId
        );


    if (!product) return;


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

                `

                <p>
                    This product is currently
                    out of stock.
                </p>

                `

            }

        </div>

    `;


    if (remaining > 0) {

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

                    value--;

                    if (value < 1)
                        value = 1;

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

                    value++;

                    if (value > remaining)
                        value = remaining;

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

    }


    showPage(
        "productPage"
    );

}


function addSelectedProductToCart() {

    const product =
        data.products.find(
            p => p.id === selectedProductId
        );


    if (!product) return;


    const quantity =
        Number(
            getValue(
                "detailQuantity"
            )
        );


    const remaining =
        getRemainingStock(
            product
        );


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

            quantity:
                quantity

        });

    }


    saveData();

    renderCart();

    showPage(
        "cartPage"
    );

}


/* =========================================================
   CART
   ========================================================= */

function calculateCartTotal() {

    return data.cart.reduce(
        (total, item) => {

            const product =
                data.products.find(
                    p =>
                        p.id ===
                        item.productId
                );


            if (!product)
                return total;


            return total +
                (
                    product.price *
                    item.quantity
                );

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
                total +
                item.quantity,
            0
        );


    document.getElementById(
        "cartItemCount"
    ).textContent =
        count +
        (
            count === 1
            ? " item"
            : " items"
        );


    document.getElementById(
        "cartTotal"
    ).textContent =
        money(
            calculateCartTotal()
        );


    if (!data.cart.length) {

        container.innerHTML = `

            <div class="product-info">

                <p>
                    Your cart is empty.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML =
        data.cart.map(
            item => {

                const product =
                    data.products.find(
                        p =>
                            p.id ===
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
                                ${money(
                                    product.price
                                )}
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

            }
        ).join("");


    container
        .querySelectorAll(
            "[data-minus]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        changeCartQuantity(
                            button.dataset.minus,
                            -1
                        );

                    }
                );

            }
        );


    container
        .querySelectorAll(
            "[data-plus]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        changeCartQuantity(
                            button.dataset.plus,
                            1
                        );

                    }
                );

            }
        );


    container
        .querySelectorAll(
            "[data-remove]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        removeFromCart(
                            button.dataset.remove
                        );

                    }
                );

            }
        );

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
        data.products.find(
            product =>
                product.id ===
                productId
        );


    if (!item || !product)
        return;


    let newQuantity =
        item.quantity +
        change;


    const remaining =
        getRemainingStock(
            product
        );


    if (newQuantity < 1) {

        newQuantity = 1;

    }


    if (
        newQuantity >
        remaining
    ) {

        newQuantity =
            remaining;

    }


    item.quantity =
        newQuantity;


    saveData();

    renderCart();

}


function removeFromCart(
    productId
) {

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

    showPage(
        "checkoutPage"
    );

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


    data.customers.forEach(
        customer => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                customer.id;


            option.textContent =
                customer.name +
                (
                    customer.type ===
                    "account"

                    ? " — Account Customer"

                    : ""
                );


            select.appendChild(
                option
            );

        }
    );

}


function renderCheckoutSummary() {

    const container =
        document.getElementById(
            "checkoutSummary"
        );


    container.innerHTML =
        data.cart.map(
            item => {

                const product =
                    data.products.find(
                        p =>
                            p.id ===
                            item.productId
                    );


                return `

                    <div class="summary-line">

                        <span>
                            ${escapeHTML(
                                product.name
                            )}
                            ×
                            ${item.quantity}
                        </span>

                        <strong>
                            ${money(
                                product.price *
                                item.quantity
                            )}
                        </strong>

                    </div>

                `;

            }
        ).join("") +

        `

        <hr>

        <div class="summary-line">

            <strong>
                Total
            </strong>

            <strong>
                ${money(
                    calculateCartTotal()
                )}
            </strong>

        </div>

        `;

}


document
    .getElementById(
        "checkoutAddCustomer"
    )
    .addEventListener(
        "click",
        () => openCustomerModal()
    );


document
    .getElementById(
        "completeSaleButton"
    )
    .addEventListener(
        "click",
        completeSale
    );


function completeSale() {

    if (!data.cart.length)
        return;


    /* Check stock one more time */

    for (
        const item of data.cart
    ) {

        const product =
            data.products.find(
                p =>
                    p.id ===
                    item.productId
            );


        if (
            !product ||
            item.quantity >
            getRemainingStock(product)
        ) {

            alert(
                "Stock changed. Please check your cart."
            );

            renderCart();

            return;

        }

    }


    const customerId =
        getValue(
            "checkoutCustomer"
        ) || null;


    const customer =
        data.customers.find(
            c =>
                c.id ===
                customerId
        );


    const items =
        data.cart.map(
            item => {

                const product =
                    data.products.find(
                        p =>
                            p.id ===
                            item.productId
                    );


                return {

                    productId:
                        product.id,

                    name:
                        product.name,

                    price:
                        product.price,

                    quantity:
                        item.quantity,

                    total:
                        product.price *
                        item.quantity

                };

            }
        );


    const total =
        items.reduce(
            (sum, item) =>
                sum +
                item.total,
            0
        );


    const now =
        new Date();


    const sale = {

        id:
            createId("sale"),

        date:
            now.toISOString()
                .split("T")[0],

        time:
            now.toLocaleTimeString(
                "en-IN"
            ),

        customerId:
            customerId,

        customerName:
            customer
                ? customer.name
                : "Walk-in",

        items:
            items,

        total:
            total

    };


    /* Update stock */

    items.forEach(
        item => {

            const product =
                data.products.find(
                    p =>
                        p.id ===
                        item.productId
                );


            product.soldQuantity +=
                item.quantity;

        }
    );


    /* Update account customer */

    if (
        customer &&
        customer.type ===
        "account"
    ) {

        customer.totalPurchased =
            (
                customer.totalPurchased ||
                0
            ) +
            total;


        customer.due =
            (
                customer.due ||
                0
            ) +
            total;

    }


    data.sales.push(
        sale
    );


    data.cart = [];


    saveData();


    alert(
        "Sale completed successfully!"
    );


    updateDashboard();

    renderHome();

    showPage(
        "homePage"
    );

}


/* =========================================================
   PRODUCTS MANAGEMENT
   ========================================================= */

document
    .getElementById(
        "addProductButton"
    )
    .addEventListener(
        "click",
        () => openProductModal()
    );


function renderProducts() {

    const container =
        document.getElementById(
            "manageProducts"
        );


    if (!data.products.length) {

        container.innerHTML = `

            <div class="product-info">

                <p>
                    No products added yet.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML =
        data.products.map(
            product => {

                const remaining =
                    getRemainingStock(
                        product
                    );


                return `

                    <div class="product-card">

                        <div>

                            <h3>
                                ${escapeHTML(
                                    product.name
                                )}
                            </h3>

                            <div>
                                Selling price:
                                ${money(
                                    product.price
                                )}
                            </div>

                            <div>
                                Total stock:
                                ${product.totalStock}
                            </div>

                            <div>
                                Remaining:
                                <strong>
                                    ${remaining}
                                </strong>
                            </div>

                        </div>


                        <button
                            class="secondary-button"
                            data-edit-product="${product.id}"
                        >
                            Edit
                        </button>

                    </div>

                `;

            }
        ).join("");


    container
        .querySelectorAll(
            "[data-edit-product]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        openProductModal(
                            button.dataset.editProduct
                        );

                    }
                );

            }
        );

}


function openProductModal(
    productId = null
) {

    const product =
        productId
        ? data.products.find(
            p =>
                p.id ===
                productId
        )
        : null;


    openModal(`

        <h2>
            ${
                product
                ? "Edit Product"
                : "Add Product"
            }
        </h2>


        <input
            id="modalProductName"
            placeholder="Product name"
            value="${
                product
                ? escapeAttribute(product.name)
                : ""
            }"
        >


        <input
            id="modalProductPrice"
            type="number"
            min="0"
            step="0.01"
            placeholder="Selling price"
            value="${
                product
                ? product.price
                : ""
            }"
        >


        <input
            id="modalProductStock"
            type="number"
            min="0"
            step="1"
            placeholder="Total stock"
            value="${
                product
                ? product.totalStock
                : ""
            }"
        >


        <button
            id="saveProduct"
            class="primary-button"
        >
            Save Product
        </button>

    `);


    document
        .getElementById(
            "saveProduct"
        )
        .addEventListener(
            "click",
            () => {

                const name =
                    getValue(
                        "modalProductName"
                    );


                const price =
                    Number(
                        getValue(
                            "modalProductPrice"
                        )
                    );


                const stock =
                    Number(
                        getValue(
                            "modalProductStock"
                        )
                    );


                if (
                    !name ||
                    !Number.isFinite(price) ||
                    price < 0 ||
                    !Number.isInteger(stock) ||
                    stock < 0
                ) {

                    alert(
                        "Please enter valid product details."
                    );

                    return;

                }


                if (product) {

                    if (
                        stock <
                        product.soldQuantity
                    ) {

                        alert(
                            "Total stock cannot be less than the quantity already sold."
                        );

                        return;

                    }


                    product.name =
                        name;

                    product.price =
                        price;

                    product.totalStock =
                        stock;

                } else {

                    data.products.push({

                        id:
                            createId("product"),

                        name:
                            name,

                        price:
                            price,

                        totalStock:
                            stock,

                        soldQuantity:
                            0

                    });

                }


                saveData();

                closeModal();

                renderProducts();

                renderHome();

            }
        );

}


/* =========================================================
   CUSTOMERS
   ========================================================= */

let selectedCustomerType =
    "normal";


document
    .getElementById(
        "addCustomerButton"
    )
    .addEventListener(
        "click",
        () => openCustomerModal()
    );


document
    .querySelectorAll(
        ".customer-tab"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    selectedCustomerType =
                        button.dataset.type;


                    document
                        .querySelectorAll(
                            ".customer-tab"
                        )
                        .forEach(
                            tab =>
                                tab.classList.toggle(
                                    "active",
                                    tab ===
                                    button
                                )
                        );


                    renderCustomers();

                }
            );

        }
    );


function renderCustomers() {

    const container =
        document.getElementById(
            "customerList"
        );


    const customers =
        data.customers.filter(
            customer =>
                customer.type ===
                selectedCustomerType
        );


    if (!customers.length) {

        container.innerHTML = `

            <div class="product-info">

                <p>
                    No ${
                        selectedCustomerType ===
                        "account"
                        ? "regular/account"
                        : "normal"
                    }
                    customers added yet.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML =
        customers.map(
            customer => `

                <div class="customer-card">

                    <div>

                        <h3>
                            ${escapeHTML(
                                customer.name
                            )}
                        </h3>

                        <div>
                            Phone:
                            ${
                                escapeHTML(
                                    customer.phone ||
                                    "Not provided"
                                )
                            }
                        </div>


                        ${
                            customer.type ===
                            "account"

                            ?

                            `

                            <div>
                                Total purchased:
                                ${money(
                                    customer.totalPurchased ||
                                    0
                                )}
                            </div>

                            <div>
                                Amount due:
                                <strong>
                                    ${money(
                                        customer.due ||
                                        0
                                    )}
                                </strong>
                            </div>

                            `

                            :

                            ""

                        }

                    </div>


                    <button
                        class="secondary-button"
                        data-edit-customer="${customer.id}"
                    >
                        Edit
                    </button>

                </div>

            `
        ).join("");


    container
        .querySelectorAll(
            "[data-edit-customer]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        openCustomerModal(
                            button.dataset.editCustomer
                        );

                    }
                );

            }
        );

}


function openCustomerModal(
    customerId = null
) {

    const customer =
        customerId
        ? data.customers.find(
            c =>
                c.id ===
                customerId
        )
        : null;


    openModal(`

        <h2>
            ${
                customer
                ? "Edit Customer"
                : "Add Customer"
            }
        </h2>


        <input
            id="modalCustomerName"
            placeholder="Customer name"
            value="${
                customer
                ? escapeAttribute(customer.name)
                : ""
            }"
        >


        <input
            id="modalCustomerPhone"
            type="tel"
            placeholder="Phone number"
            value="${
                customer
                ? escapeAttribute(
                    customer.phone || ""
                )
                : ""
            }"
        >


        <select id="modalCustomerType">

            <option value="normal">
                Normal Customer
            </option>

            <option value="account">
                Regular / Account Customer
            </option>

        </select>


        <input
            id="modalCustomerDue"
            type="number"
            min="0"
            step="0.01"
            placeholder="Current amount due"
            value="${
                customer
                ? customer.due || 0
                : 0
            }"
        >


        <button
            id="saveCustomer"
            class="primary-button"
        >
            Save Customer
        </button>

    `);


    setValue(
        "modalCustomerType",
        customer
        ? customer.type
        : selectedCustomerType
    );


    document
        .getElementById(
            "saveCustomer"
        )
        .addEventListener(
            "click",
            () => {

                const name =
                    getValue(
                        "modalCustomerName"
                    );


                const phone =
                    getValue(
                        "modalCustomerPhone"
                    );


                const type =
                    getValue(
                        "modalCustomerType"
                    );


                const due =
                    Number(
                        getValue(
                            "modalCustomerDue"
                        ) || 0
                    );


                if (!name) {

                    alert(
                        "Customer name is required."
                    );

                    return;

                }


                if (customer) {

                    customer.name =
                        name;

                    customer.phone =
                        phone;

                    customer.type =
                        type;

                    customer.due =
                        due;

                } else {

                    data.customers.push({

                        id:
                            createId("customer"),

                        name:
                            name,

                        phone:
                            phone,

                        type:
                            type,

                        due:
                            due,

                        totalPurchased:
                            0

                    });

                }


                saveData();

                closeModal();

                renderCustomers();

                renderCustomerDropdown();

            }
        );

}


/* =========================================================
   SALES DASHBOARD
   ========================================================= */

function updateDashboard() {

    const sales =
        data.sales.filter(
            sale =>
                sale.date ===
                today()
        );


    const total =
        sales.reduce(
            (sum, sale) =>
                sum +
                sale.total,
            0
        );


    const items =
        sales.reduce(
            (sum, sale) => {

                return sum +
                    sale.items.reduce(
                        (
                            itemSum,
                            item
                        ) =>
                            itemSum +
                            item.quantity,
                        0
                    );

            },
            0
        );


    document.getElementById(
        "todaySalesAmount"
    ).textContent =
        money(total);


    document.getElementById(
        "todayItemsSold"
    ).textContent =
        items;

}


/* =========================================================
   SALES HISTORY
   ========================================================= */

document
    .getElementById(
        "salesDate"
    )
    .addEventListener(
        "change",
        renderSales
    );


document
    .getElementById(
        "showAllSales"
    )
    .addEventListener(
        "click",
        () => {

            setValue(
                "salesDate",
                ""
            );

            renderSales();

        }
    );


function renderSales() {

    updateDashboard();


    const selectedDate =
        getValue(
            "salesDate"
        );


    let sales =
        [...data.sales];


    if (selectedDate) {

        sales =
            sales.filter(
                sale =>
                    sale.date ===
                    selectedDate
            );

    }


    sales.reverse();


    const container =
        document.getElementById(
            "salesList"
        );


    if (!sales.length) {

        container.innerHTML = `

            <div class="product-info">

                <p>
                    No sales found.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML =
        sales.map(
            sale => `

                <div class="sale-card">

                    <div class="sale-header">

                        <strong>
                            ${
                                escapeHTML(
                                    sale.customerName
                                )
                            }
                        </strong>

                        <strong>
                            ${money(
                                sale.total
                            )}
                        </strong>

                    </div>


                    <div>
                        ${sale.date}
                        ·
                        ${escapeHTML(
                            sale.time
                        )}
                    </div>


                    <div class="sale-items">

                        ${
                            sale.items
                                .map(
                                    item =>
                                        `${escapeHTML(
                                            item.name
                                        )}
                                        ×
                                        ${item.quantity}
                                        =
                                        ${money(
                                            item.total
                                        )}`
                                )
                                .join(
                                    "<br>"
                                )
                        }

                    </div>

                </div>

            `
        ).join("");

}


/* =========================================================
   REPORTS
   ========================================================= */

document
    .getElementById(
        "reportType"
    )
    .addEventListener(
        "change",
        updateReportControls
    );


document
    .getElementById(
        "generateReport"
    )
    .addEventListener(
        "click",
        generateReport
    );


function updateReportControls() {

    const type =
        getValue(
            "reportType"
        );


    document
        .getElementById(
            "reportDate"
        )
        .classList.toggle(
            "hidden",
            type !== "date"
        );


    document
        .getElementById(
            "rangeInputs"
        )
        .classList.toggle(
            "hidden",
            type !== "range"
        );

}


function getReportSales() {

    const type =
        getValue(
            "reportType"
        );


    if (type === "all") {

        return [...data.sales];

    }


    if (type === "today") {

        return data.sales.filter(
            sale =>
                sale.date ===
                today()
        );

    }


    if (type === "date") {

        const date =
            getValue(
                "reportDate"
            );


        if (!date)
            return [];


        return data.sales.filter(
            sale =>
                sale.date ===
                date
        );

    }


    if (type === "range") {

        const from =
            getValue(
                "reportFrom"
            );

        const to =
            getValue(
                "reportTo"
            );


        if (!from || !to)
            return [];


        return data.sales.filter(
            sale =>
                sale.date >= from &&
                sale.date <= to
        );

    }


    return [];

}


function generateReport() {

    const sales =
        getReportSales();


    let rows = [];


    sales.forEach(
        sale => {

            sale.items.forEach(
                item => {

                    rows.push({

                        date:
                            sale.date,

                        time:
                            sale.time,

                        customer:
                            sale.customerName,

                        product:
                            item.name,

                        price:
                            item.price,

                        quantity:
                            item.quantity,

                        total:
                            item.total

                    });

                }
            );

        }
    );


    const totalQuantity =
        rows.reduce(
            (sum, row) =>
                sum +
                row.quantity,
            0
        );


    const totalAmount =
        rows.reduce(
            (sum, row) =>
                sum +
                row.total,
            0
        );


    const container =
        document.getElementById(
            "reportArea"
        );


    container.innerHTML = `

        <div class="report-box">

            <h2>
                Sales Report
            </h2>


            <table class="report-table">

                <thead>

                    <tr>

                        <th>
                            Date
                        </th>

                        <th>
                            Time
                        </th>

                        <th>
                            Customer
                        </th>

                        <th>
                            Product
                        </th>

                        <th>
                            Selling Price
                        </th>

                        <th>
                            Quantity Sold
                        </th>

                        <th>
                            Total
                        </th>

                    </tr>

                </thead>


                <tbody>

                    ${
                        rows.length

                        ?

                        rows.map(
                            row => `

                                <tr>

                                    <td>
                                        ${row.date}
                                    </td>

                                    <td>
                                        ${escapeHTML(
                                            row.time
                                        )}
                                    </td>

                                    <td>
                                        ${escapeHTML(
                                            row.customer
                                        )}
                                    </td>

                                    <td>
                                        ${escapeHTML(
                                            row.product
                                        )}
                                    </td>

                                    <td>
                                        ${money(
                                            row.price
                                        )}
                                    </td>

                                    <td>
                                        ${row.quantity}
                                    </td>

                                    <td>
                                        ${money(
                                            row.total
                                        )}
                                    </td>

                                </tr>

                            `
                        ).join("")

                        :

                        `

                        <tr>

                            <td
                                colspan="7"
                            >
                                No sales found.
                            </td>

                        </tr>

                        `

                    }

                </tbody>

            </table>


            <div class="report-total">

                Total Items Sold:
                ${totalQuantity}

                <br>

                Total Sales:
                ${money(
                    totalAmount
                )}

            </div>

        </div>

    `;

}


/* =========================================================
   PRINT / PDF
   ========================================================= */

document
    .getElementById(
        "printReport"
    )
    .addEventListener(
        "click",
        () => {

            generateReport();

            setTimeout(
                () => {

                    window.print();

                },
                100
            );

        }
    );


document
    .getElementById(
        "pdfReport"
    )
    .addEventListener(
        "click",
        () => {

            generateReport();

            setTimeout(
                () => {

                    window.print();

                },
                100
            );

        }
    );


/* =========================================================
   MODAL
   ========================================================= */

function openModal(content) {

    document.getElementById(
        "modalContent"
    ).innerHTML =
        content;


    document
        .getElementById(
            "modal"
        )
        .classList.remove(
            "hidden"
        );

}


function closeModal() {

    document
        .getElementById(
            "modal"
        )
        .classList.add(
            "hidden"
        );


    document.getElementById(
        "modalContent"
    ).innerHTML = "";

}


document
    .getElementById(
        "closeModal"
    )
    .addEventListener(
        "click",
        closeModal
    );


document
    .getElementById(
        "modal"
    )
    .addEventListener(
        "click",
        event => {

            if (
                event.target.id ===
                "modal"
            ) {

                closeModal();

            }

        }
    );


/* =========================================================
   SECURITY / TEXT HELPERS
   ========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(
            /[&<>"']/g,
            character => {

                const map = {

                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '"': "&quot;",
                    "'": "&#039;"

                };

                return map[
                    character
                ];

            }
        );

}


function escapeAttribute(value) {

    return escapeHTML(value);

}


/* =========================================================
   START
   ========================================================= */

startApplication();
