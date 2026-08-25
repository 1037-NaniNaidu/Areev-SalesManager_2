/* =========================================================
   SALES MANAGER
   Fresh Version
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

        const saved =
            localStorage.getItem(STORAGE_KEY);

        if (!saved) {

            return structuredClone(defaultData);

        }

        const parsed =
            JSON.parse(saved);

        return {

            ...structuredClone(defaultData),

            ...parsed,

            profile: {
                ...defaultData.profile,
                ...(parsed.profile || {})
            },

            customers:
                Array.isArray(parsed.customers)
                    ? parsed.customers
                    : [],

            products:
                Array.isArray(parsed.products)
                    ? parsed.products
                    : [],

            sales:
                Array.isArray(parsed.sales)
                    ? parsed.sales
                    : []

        };

    } catch (error) {

        console.error(error);

        return structuredClone(defaultData);

    }

}


function saveData() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(appData)
    );

}


/* =========================================================
   BASIC HELPERS
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

    return date.toISOString().split("T")[0];

}


function getCurrentMonth() {

    return getToday().substring(0, 7);

}


function formatMoney(value) {

    return "₹" +
        Number(value || 0)
            .toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
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


function showToast(message) {

    const toast =
        document.getElementById("toast");

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

    document
        .querySelectorAll(".page")
        .forEach(page => {

            page.classList.remove("active");

        });


    const page =
        document.getElementById(pageId);

    if (!page) return;

    page.classList.add("active");


    if (pageId === "homePage") {

        renderDashboard();

    }


    if (pageId === "customersPage") {

        renderCustomers();

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

    document.getElementById(
        "dashboardCustomers"
    ).textContent =
        appData.customers.length;


    document.getElementById(
        "dashboardProducts"
    ).textContent =
        appData.products.length;


    const today =
        getToday();


    const todaySales =
        appData.sales
            .filter(sale =>
                sale.date === today
            )
            .reduce(
                (total, sale) =>
                    total + Number(sale.total),
                0
            );


    document.getElementById(
        "dashboardTodaySales"
    ).textContent =
        formatMoney(todaySales);


    const stock =
        appData.products
            .reduce(
                (total, product) =>
                    total + Number(product.stock),
                0
            );


    document.getElementById(
        "dashboardStock"
    ).textContent =
        stock;

}


/* =========================================================
   CUSTOMERS
   ========================================================= */

function changeCustomerTab(type) {

    currentCustomerTab = type;


    document
        .getElementById("allCustomersTab")
        .classList.toggle(
            "active",
            type === "all"
        );


    document
        .getElementById("regularCustomersTab")
        .classList.toggle(
            "active",
            type === "regular"
        );


    renderCustomers();

}


function renderCustomers() {

    const search =
        (
            document.getElementById(
                "customerSearch"
            ).value || ""
        ).toLowerCase();


    let customers =
        appData.customers.filter(customer => {

            const matchesSearch =
                customer.name
                    .toLowerCase()
                    .includes(search);


            const matchesTab =
                currentCustomerTab === "all"
                ||
                customer.regular === true;


            return (
                matchesSearch &&
                matchesTab
            );

        });


    const container =
        document.getElementById(
            "customersList"
        );


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
                            sum + Number(sale.total),
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
                item => item.id === customerId
            )
            : null;


    document.getElementById(
        "modalContent"
    ).innerHTML = `

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

    const name =
        document
            .getElementById(
                "modalCustomerName"
            )
            .value
            .trim();


    const phone =
        document
            .getElementById(
                "modalCustomerPhone"
            )
            .value
            .trim();


    const regular =
        document
            .getElementById(
                "modalCustomerRegular"
            )
            .checked;


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
            item => item.id === customerId
        );


    if (!customer) return;


    const confirmed =
        confirm(
            `Delete ${customer.name}? This will also remove that customer's sales records.`
        );


    if (!confirmed) return;


    appData.customers =
        appData.customers.filter(
            item => item.id !== customerId
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


    renderCustomerDetail();

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
                    b.createdAt -
                    a.createdAt
            );


    const total =
        sales.reduce(
            (sum, sale) =>
                sum + Number(sale.total),
            0
        );


    const monthly =
        sales
            .filter(
                sale =>
                    sale.date.startsWith(
                        getCurrentMonth()
                    )
            )
            .reduce(
                (sum, sale) =>
                    sum + Number(sale.total),
                0
            );


    const container =
        document.getElementById(
            "customerDetailContent"
        );


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

                                    ${sale.date}

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
                                ${formatMoney(sale.total)}
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

        const customerSelect =
            document.getElementById(
                "saleCustomer"
            );


        customerSelect.value =
            selectedCustomerId;


    }, 50);

}


/* =========================================================
   CUSTOMER PDF / PRINT
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
                    a.createdAt -
                    b.createdAt
            );


    const total =
        sales.reduce(
            (sum, sale) =>
                sum + Number(sale.total),
            0
        );


    const rows =
        sales.map(
            sale => `

                <tr>

                    <td>
                        ${sale.date}
                    </td>

                    <td>
                        ${escapeHTML(
                            sale.productName
                        )}
                    </td>

                    <td>
                        ${sale.quantity}
                    </td>

                    <td>
                        ${formatMoney(
                            sale.price
                        )}
                    </td>

                    <td>
                        ${formatMoney(
                            sale.total
                        )}
                    </td>

                </tr>

            `
        ).join("");


    const html = `

        <!DOCTYPE html>

        <html>

        <head>

            <meta charset="UTF-8">

            <title>
                Customer Sales Report
            </title>

            <style>

                body {
                    font-family: Arial, sans-serif;
                    padding: 30px;
                    color: #222;
                }

                h1 {
                    margin-bottom: 5px;
                }

                h2 {
                    margin-top: 25px;
                }

                p {
                    color: #666;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 25px;
                }

 
