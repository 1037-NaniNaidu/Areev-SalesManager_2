/* =========================================================
   SALES MANAGER
   Complete JavaScript
   ========================================================= */


/* =========================================================
   DATA
   ========================================================= */

const STORAGE_KEY = "sales_manager_fresh_v1";

const defaultData = {
    profile: {
        name: "",
        business: "",
        phone: "",
        language: "en"
    },

    customers: [],
    products: [],
    sales: []
};

let appData = loadData();
let currentCustomerTab = "all";
let selectedCustomerId = null;


/* =========================================================
   LOAD / SAVE
   ========================================================= */

function loadData() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (!saved) {
            return JSON.parse(JSON.stringify(defaultData));
        }

        const parsed = JSON.parse(saved);

        return {
            ...JSON.parse(JSON.stringify(defaultData)),
            ...parsed,

            profile: {
                ...defaultData.profile,
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

    } catch (error) {
        console.error("Load error:", error);
        return JSON.parse(JSON.stringify(defaultData));
    }
}


function saveData() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(appData)
    );
}


/* =========================================================
   HELPERS
   ========================================================= */

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


function getToday() {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function getCurrentMonth() {
    return getToday().substring(0, 7);
}


function formatMoney(value) {
    return (
        "₹" +
        Number(value || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })
    );
}


function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function showToast(message) {
    const toast = document.getElementById("toast");

    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2200);
}


/* =========================================================
   PAGE NAVIGATION
   ========================================================= */

function openPage(pageId) {

    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
    });

    const page = document.getElementById(pageId);

    if (!page) {
        console.error("Page not found:", pageId);
        return;
    }

    page.classList.add("active");

    if (pageId === "homePage") {
        renderDashboard();
    }

    if (pageId === "customersPage") {
        renderCustomers();
    }

    if (pageId === "customerDetailPage") {
        renderCustomerDetail();
    }

    if (pageId === "productsPage") {
        renderProducts();
    }

    if (pageId === "salePage") {
        renderSaleForm();
    }

    if (pageId === "salesPage") {
        renderSales();
    }

    if (pageId === "settingsPage") {
        loadSettings();
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================================
   DASHBOARD
   ========================================================= */

function renderDashboard() {

    const customers = document.getElementById(
        "dashboardCustomers"
    );

    const products = document.getElementById(
        "dashboardProducts"
    );

    const todaySales = document.getElementById(
        "dashboardTodaySales"
    );

    const stock = document.getElementById(
        "dashboardStock"
    );

    if (customers) {
        customers.textContent =
            appData.customers.length;
    }

    if (products) {
        products.textContent =
            appData.products.length;
    }

    const today = getToday();

    const totalToday = appData.sales
        .filter(sale => sale.date === today)
        .reduce(
            (total, sale) =>
                total + Number(sale.total || 0),
            0
        );

    if (todaySales) {
        todaySales.textContent =
            formatMoney(totalToday);
    }

    const totalStock = appData.products
        .reduce(
            (total, product) =>
                total + Number(product.stock || 0),
            0
        );

    if (stock) {
        stock.textContent = totalStock;
    }

    updateHeader();
}


/* =========================================================
   HEADER / PROFILE
   ========================================================= */

function updateHeader() {

    const businessDisplay =
        document.getElementById(
            "businessNameDisplay"
        );

    if (!businessDisplay) return;

    businessDisplay.textContent =
        appData.profile.business ||
        "Sales & Stock Manager";
}


/* =========================================================
   CUSTOMERS
   ========================================================= */

function changeCustomerTab(type) {

    currentCustomerTab = type;

    const allTab =
        document.getElementById(
            "allCustomersTab"
        );

    const regularTab =
        document.getElementById(
            "regularCustomersTab"
        );

    if (allTab) {
        allTab.classList.toggle(
            "active",
            type === "all"
        );
    }

    if (regularTab) {
        regularTab.classList.toggle(
            "active",
            type === "regular"
        );
    }

    renderCustomers();
}


function renderCustomers() {

    const searchInput =
        document.getElementById(
            "customerSearch"
        );

    const search =
        (searchInput?.value || "")
            .trim()
            .toLowerCase();

    const container =
        document.getElementById(
            "customersList"
        );

    if (!container) return;

    let customers =
        appData.customers.filter(customer => {

            const name =
                String(customer.name || "")
                    .toLowerCase();

            const matchesSearch =
                name.includes(search);

            const matchesTab =
                currentCustomerTab === "all" ||
                customer.regular === true;

            return (
                matchesSearch &&
                matchesTab
            );
        });


    if (customers.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                👥
                <br><br>
                No customers found.
            </div>
        `;

        return;
    }


    container.innerHTML =
        customers.map(customer => {

            const total =
                appData.sales
                    .filter(
                        sale =>
                            sale.customerId ===
                            customer.id
                    )
                    .reduce(
                        (sum, sale) =>
                            sum +
                            Number(sale.total || 0),
                        0
                    );

            return `
                <div class="list-card">

                    <div class="list-main">

                        <strong>
                            ${escapeHTML(customer.name)}
                        </strong>

                        <small>

                            ${
                                customer.regular
                                    ? "⭐ Regular Customer"
                                    : "Normal Customer"
                            }

                            ${
                                customer.phone
                                    ? " • " +
                                      escapeHTML(customer.phone)
                                    : ""
                            }

                            <br>

                            Total Sales:
                            ${formatMoney(total)}

                        </small>

                    </div>

                    <div class="list-actions">

                        <button
                            class="mini-button blue"
                            onclick="openCustomerDetail('${customer.id}')">

                            Open

                        </button>

                        <button
                            class="mini-button"
                            onclick="openCustomerModal('${customer.id}')">

                            Edit

                        </button>

                        <button
                            class="mini-button red"
                            onclick="deleteCustomer('${customer.id}')">

                            Delete

                        </button>

                    </div>

                </div>
            `;

        }).join("");
}


/* =========================================================
   CUSTOMER MODAL
   ========================================================= */

function openCustomerModal(customerId = null) {

    const customer =
        customerId
            ? appData.customers.find(
                item =>
                    item.id === customerId
            )
            : null;

    const modalContent =
        document.getElementById(
            "modalContent"
        );

    if (!modalContent) return;

    modalContent.innerHTML = `

        <h2>
            ${
                customer
                    ? "Edit Customer"
                    : "Add Customer"
            }
        </h2>

        <label>
            Customer Name
        </label>

        <input
            id="modalCustomerName"
            type="text"
            value="${escapeHTML(customer?.name || "")}"
            placeholder="Customer name"
        >

        <label>
            Phone Number
        </label>

        <input
            id="modalCustomerPhone"
            type="tel"
            value="${escapeHTML(customer?.phone || "")}"
            placeholder="Phone number"
        >

        <label class="checkbox-row">

            <input
                id="modalCustomerRegular"
                type="checkbox"
                ${
                    customer?.regular
                        ? "checked"
                        : ""
                }
            >

            Regular Customer

        </label>

        <button
            class="primary-button full-width"
            onclick="saveCustomer('${customerId || ""}')">

            Save Customer

        </button>
    `;

    openModal();
}


function saveCustomer(customerId) {

    const nameInput =
        document.getElementById(
            "modalCustomerName"
        );

    const phoneInput =
        document.getElementById(
            "modalCustomerPhone"
        );

    const regularInput =
        document.getElementById(
            "modalCustomerRegular"
        );

    const name =
        nameInput?.value.trim() || "";

    const phone =
        phoneInput?.value.trim() || "";

    const regular =
        regularInput?.checked || false;

    if (!name) {

        showToast(
            "Please enter customer name."
        );

        return;
    }


    if (customerId) {

        const customer =
            appData.customers.find(
                item =>
                    item.id === customerId
            );

        if (customer) {

            customer.name = name;
            customer.phone = phone;
            customer.regular = regular;
        }

    } else {

        appData.customers.push({

            id: createId("customer"),

            name,

            phone,

            regular,

            createdAt: Date.now()
        });
    }


    saveData();

    closeModal();

    renderCustomers();

    renderDashboard();

    renderSaleForm();

    showToast(
        "Customer saved successfully."
    );
}


/* =========================================================
   DELETE CUSTOMER
   ========================================================= */

function deleteCustomer(customerId) {

    const customer =
        appData.customers.find(
            item =>
                item.id === customerId
        );

    if (!customer) return;

    const confirmed =
        confirm(
            `Delete ${customer.name}? This will also remove that customer's sales records.`
        );

    if (!confirmed) return;

    appData.customers =
        appData.customers.filter(
            item =>
                item.id !== customerId
        );

    appData.sales =
        appData.sales.filter(
            sale =>
                sale.customerId !== customerId
        );

    saveData();

    renderCustomers();
    renderDashboard();
    renderSaleForm();

    showToast(
        "Customer deleted."
    );
}


/* =========================================================
   CUSTOMER DETAIL
   ========================================================= */

function openCustomerDetail(customerId) {

    selectedCustomerId =
        customerId;

    openPage(
        "customerDetailPage"
    );
}


function renderCustomerDetail() {

    const customer =
        appData.customers.find(
            item =>
                item.id ===
                selectedCustomerId
        );

    if (!customer) {

        openPage("customersPage");

        return;
    }

    const sales =
        appData.sales
            .filter(
                sale =>
                    sale.customerId ===
                    customer.id
            )
            .sort(
                (a, b) =>
                    Number(b.createdAt) -
                    Number(a.createdAt)
            );

    const total =
        sales.reduce(
            (sum, sale) =>
                sum +
                Number(sale.total || 0),
            0
        );

    const monthly =
        sales
            .filter(
                sale =>
                    String(sale.date || "")
                        .startsWith(
                            getCurrentMonth()
                        )
            )
            .reduce(
                (sum, sale) =>
                    sum +
                    Number(sale.total || 0),
                0
            );

    const container =
        document.getElementById(
            "customerDetailContent"
        );

    if (!container) return;

    container.innerHTML = `

        <div class="customer-profile">

            <h2>
                ${escapeHTML(customer.name)}
            </h2>

            <p>

                ${
                    customer.regular
                        ? "⭐ Regular Customer"
                        : "Normal Customer"
                }

                ${
                    customer.phone
                        ? " • " +
                          escapeHTML(customer.phone)
                        : ""
                }

            </p>

            <div class="customer-stat-grid">

                <div class="customer-stat">

                    <small>
                        Monthly Total
                    </small>

                    <strong>
                        ${formatMoney(monthly)}
                    </strong>

                </div>

                <div class="customer-stat">

                    <small>
                        Total Sales
                    </small>

                    <strong>
                        ${formatMoney(total)}
                    </strong>

                </div>

            </div>

            <div class="customer-actions">

                <button
                    class="primary-button"
                    onclick="makeSaleForCustomer()">

                    🛒 Make Sale

                </button>

                <button
                    class="secondary-button"
                    onclick="printCustomerPDF('${customer.id}')">

                    🧾 Customer PDF

                </button>

                <button
                    class="mini-button"
                    onclick="openCustomerModal('${customer.id}')">

                    Edit

                </button>

            </div>

        </div>

        <h3>
            Sales History
        </h3>

        <div>

            ${
                sales.length

                    ? sales.map(sale => `

                        <div class="list-card">

                            <div class="list-main">

                                <strong>
                                    ${escapeHTML(
                                        sale.productName
                                    )}
                                </strong>

                                <small>

                                    ${escapeHTML(
                                        sale.date
                                    )}

                                    • Quantity:
                                    ${sale.quantity}

                                    •
                                    ${
                                        sale.paymentStatus === "paid"
                                            ? "Paid"
                                            : "Pending"
                                    }

                                </small>

                            </div>

                            <strong>
                                ${formatMoney(
                                    sale.total
                                )}
                            </strong>

                        </div>

                    `).join("")

                    :

                    `
                        <div class="empty-state">

                            No sales for this customer yet.

                        </div>
                    `
            }

        </div>
    `;
}


function makeSaleForCustomer() {

    openPage("salePage");

    setTimeout(() => {

        const select =
            document.getElementById(
                "saleCustomer"
            );

        if (select) {

            select.value =
                selectedCustomerId;

            updateSaleCustomer();
        }

    }, 50);
}


/* =========================================================
   CUSTOMER PDF
   ========================================================= */

function printCustomerPDF(customerId) {

    const customer =
        appData.customers.find(
            item =>
                item.id === customerId
        );

    if (!customer) return;

    const sales =
        appData.sales
            .filter(
                sale =>
                    sale.customerId ===
                    customerId
            )
            .sort(
                (a, b) =>
                    Number(a.createdAt) -
                    Number(b.createdAt)
            );

    const total =
        sales.reduce(
            (sum, sale) =>
                sum +
                Number(sale.total || 0),
            0
        );

    const rows =
        sales.map(
       
