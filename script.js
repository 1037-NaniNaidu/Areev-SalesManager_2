document.addEventListener("DOMContentLoaded", function () {

    // ==========================================
    // DATA
    // ==========================================

    let products = JSON.parse(
        localStorage.getItem("salesManagerProducts")
    ) || [];

    let customers = JSON.parse(
        localStorage.getItem("salesManagerCustomers")
    ) || [];

    let sales = JSON.parse(
        localStorage.getItem("salesManagerSales")
    ) || [];


    // ==========================================
    // SECTION NAVIGATION
    // ==========================================

    window.showSection = function (sectionId) {

        document.querySelectorAll(".section").forEach(function (section) {
            section.classList.remove("active");
        });

        const section = document.getElementById(sectionId);

        if (section) {
            section.classList.add("active");
        }

        refreshEverything();
    };


    // ==========================================
    // STORAGE
    // ==========================================

    function saveProducts() {
        localStorage.setItem(
            "salesManagerProducts",
            JSON.stringify(products)
        );
    }

    function saveCustomers() {
        localStorage.setItem(
            "salesManagerCustomers",
            JSON.stringify(customers)
        );
    }

    function saveSales() {
        localStorage.setItem(
            "salesManagerSales",
            JSON.stringify(sales)
        );
    }


    // ==========================================
    // ID
    // ==========================================

    function createId() {
        return Date.now().toString() +
               Math.random().toString(36).substring(2, 8);
    }


    // ==========================================
    // PRODUCTS
    // ==========================================

    window.addProduct = function () {

        const nameInput =
            document.getElementById("productName");

        const priceInput =
            document.getElementById("productPrice");

        const costInput =
            document.getElementById("productCost");

        const stockInput =
            document.getElementById("productStock");


        const name = nameInput.value.trim();

        const price = Number(priceInput.value);

        const cost = Number(costInput.value);

        const stock = Number(stockInput.value);


        if (!name) {
            alert("Please enter the product name.");
            return;
        }

        if (price <= 0) {
            alert("Please enter a valid selling price.");
            return;
        }

        if (cost < 0) {
            alert("Please enter a valid cost price.");
            return;
        }

        if (stock < 0) {
            alert("Please enter a valid stock quantity.");
            return;
        }


        const product = {

            id: createId(),

            name: name,

            price: price,

            cost: cost,

            stock: stock,

            createdAt: new Date().toISOString()

        };


        products.push(product);

        saveProducts();

        nameInput.value = "";
        priceInput.value = "";
        costInput.value = "";
        stockInput.value = "";


        refreshEverything();

        alert("Product added successfully.");
    };


    function displayProducts() {

        const container =
            document.getElementById("productList");

        if (!container) return;


        container.innerHTML = "";


        if (products.length === 0) {

            container.innerHTML =
                "<p>No products added yet.</p>";

            return;
        }


        products.forEach(function (product) {

            const div = document.createElement("div");

            div.className = "item";


            div.innerHTML = `

                <h3>${escapeHTML(product.name)}</h3>

                <p>
                    Selling Price:
                    ₹${product.price.toFixed(2)}
                </p>

                <p>
                    Cost Price:
                    ₹${product.cost.toFixed(2)}
                </p>

                <p>
                    Stock:
                    ${product.stock}
                </p>

                <button
                    class="delete-btn"
                    onclick="deleteProduct('${product.id}')"
                >
                    Delete
                </button>

            `;


            container.appendChild(div);

        });
    }


    window.deleteProduct = function (id) {

        const product = products.find(
            function (item) {
                return item.id === id;
            }
        );


        if (!product) return;


        const confirmed = confirm(
            "Delete " + product.name + "?"
        );


        if (!confirmed) return;


        products = products.filter(
            function (item) {
                return item.id !== id;
            }
        );


        saveProducts();

        refreshEverything();
    };


    // ==========================================
    // CUSTOMERS
    // ==========================================

    window.addCustomer = function () {

        const nameInput =
            document.getElementById("customerName");

        const phoneInput =
            document.getElementById("customerPhone");


        const name = nameInput.value.trim();

        const phone = phoneInput.value.trim();


        if (!name) {

            alert("Please enter the customer name.");

            return;
        }


        const customer = {

            id: createId(),

            name: name,

            phone: phone,

            createdAt: new Date().toISOString()

        };


        customers.push(customer);

        saveCustomers();


        nameInput.value = "";

        phoneInput.value = "";


        refreshEverything();

        alert("Customer added successfully.");
    };


    function displayCustomers() {

        const container =
            document.getElementById("customerList");


        if (!container) return;


        container.innerHTML = "";


        if (customers.length === 0) {

            container.innerHTML =
                "<p>No customers added yet.</p>";

            return;
        }


        customers.forEach(function (customer) {

            const div = document.createElement("div");

            div.className = "item";


            div.innerHTML = `

                <h3>${escapeHTML(customer.name)}</h3>

                <p>
                    Phone:
                    ${escapeHTML(customer.phone || "Not provided")}
                </p>

                <button
                    class="delete-btn"
                    onclick="deleteCustomer('${customer.id}')"
                >
                    Delete
                </button>

            `;


            container.appendChild(div);

        });
    }


    window.deleteCustomer = function (id) {

        const customer = customers.find(
            function (item) {
                return item.id === id;
            }
        );


        if (!customer) return;


        const confirmed = confirm(
            "Delete " + customer.name + "?"
        );


        if (!confirmed) return;


        customers = customers.filter(
            function (item) {
                return item.id !== id;
            }
        );


        saveCustomers();

        refreshEverything();
    };


    // ==========================================
    // SALE DROPDOWNS
    // ==========================================

    function updateCustomerDropdown() {

        const select =
            document.getElementById("saleCustomer");


        if (!select) return;


        const currentValue = select.value;


        select.innerHTML =
            '<option value="">Select customer</option>';


        customers.forEach(function (customer) {

            const option =
                document.createElement("option");

            option.value = customer.id;

            option.textContent =
                customer.name;

            select.appendChild(option);

        });


        if (
            customers.some(
                function (customer) {
                    return customer.id === currentValue;
                }
            )
        ) {

            select.value = currentValue;
        }
    }


    function updateProductDropdown() {

        const select =
            document.getElementById("saleProduct");


        if (!select) return;


        const currentValue = select.value;


        select.innerHTML =
            '<option value="">Select product</option>';


        products.forEach(function (product) {

            const option =
                document.createElement("option");

            option.value = product.id;

            option.textContent =
                product.name +
                " - ₹" +
                product.price +
                " (" +
                product.stock +
                " in stock)";


            select.appendChild(option);

        });


        if (
            products.some(
                function (product) {
                    return product.id === currentValue;
                }
            )
        ) {

            select.value = currentValue;
        }
    }


    // ==========================================
    // SALE AMOUNT
    // ==========================================

    window.updateSaleAmount = function () {

        const productId =
            document.getElementById("saleProduct").value;


        const quantity =
            Number(
                document.getElementById("saleQuantity").value
            );


        const amountInput =
            document.getElementById("saleAmount");


        const product =
            products.find(
                function (item) {
                    return item.id === productId;
                }
            );


        if (!product || quantity <= 0) {

            amountInput.value = "";

            return;
        }


        const amount =
            product.price * quantity;


        amountInput.value =
            amount.toFixed(2);
    };


    // ==========================================
    // ADD SALE
    // ==========================================

    window.addSale = function () {

        const customerId =
            document.getElementById("saleCustomer").value;


        const productId =
            document.getElementById("saleProduct").value;


        const quantity =
            Number(
                document.getElementById("saleQuantity").value
            );


        const payment =
            document.getElementById("salePayment").value;


        if (!customerId) {

            alert("Please select a customer.");

            return;
        }


        if (!productId) {

            alert("Please select a product.");

            return;
        }


        if (quantity <= 0) {

            alert("Please enter a valid quantity.");

            return;
        }


        const product =
            products.find(
                function (item) {
                    return item.id === productId;
                }
            );


        if (!product) {

            alert("Product not found.");

            return;
        }


        if (quantity > product.stock) {

            alert(
                "Not enough stock available.\n\n" +
                "Available stock: " +
                product.stock
            );

            return;
        }


        const customer =
            customers.find(
                function (item) {
                    return item.id === customerId;
                }
            );


        if (!customer) {

            alert("Customer not found.");

            return;
        }


        const amount =
            product.price * quantity;


        const sale = {

            id: createId(),

            customerId: customer.id,

            customerName: customer.name,

            productId: product.id,

            productName: product.name,

            quantity: quantity,

            price: product.price,

            amount: amount,

            payment: payment,

            date: new Date().toISOString()

        };


        sales.push(sale);


        // Reduce stock

        product.stock =
            product.stock - quantity;


        saveProducts();

        saveSales();


        // Reset sale form

        document.getElementById(
            "saleCustomer"
        ).value = "";

        document.getElementById(
            "saleProduct"
        ).value = "";

        document.getElementById(
            "saleQuantity"
        ).value = "1";

        document.getElementById(
            "saleAmount"
        ).value = "";


        refreshEverything();


        alert("Sale saved successfully.");
    };


    // ==========================================
    // SALES HISTORY
    // ==========================================

    function displaySales() {

        const container =
            document.getElementById("salesList");


        if (!container) return;


        container.innerHTML = "";


        if (sales.length === 0) {

            container.innerHTML =
                "<p>No sales recorded yet.</p>";

            return;
        }


        const sortedSales =
            [...sales].sort(
                function (a, b) {
                    return new Date(b.date) -
                           new Date(a.date);
                }
            );


        sortedSales.forEach(function (sale) {

            const div =
                document.createElement("div");


            div.className =
                "item sale-item";


            const date =
                new Date(sale.date);


            div.innerHTML = `

                <h3>
                    ${escapeHTML(sale.productName)}
                </h3>

                <p>
                    Customer:
                    ${escapeHTML(sale.customerName)}
                </p>

                <p>
                    Quantity:
                    ${sale.quantity}
                </p>

                <p>
                    Amount:
                    ₹${sale.amount.toFixed(2)}
                </p>

                <p>
                    Payment:
                    ${sale.payment === "paid"
                        ? "Paid"
                        : "Unpaid"}
                </p>

                <p>
                    Date:
                    ${date.toLocaleString()}
                </p>

            `;


            container.appendChild(div);

        });
    }


    // ==========================================
    // DASHBOARD
    // ==========================================

    function updateDashboard() {

        const today =
            new Date().toDateString();


        let totalSales = 0;

        let todaySales = 0;


        sales.forEach(function (sale) {

            totalSales += sale.amount;


            if (
                new Date(sale.date)
                    .toDateString() === today
            ) {

                todaySales += sale.amount;

            }

        });


        document.getElementById(
            "todaySales"
        ).textContent =
            "₹" + todaySales.toFixed(2);


        document.getElementById(
            "totalSales"
        ).textContent =
            "₹" + totalSales.toFixed(2);


        document.getElementById(
            "productCount"
        ).textContent =
            products.length;


        document.getElementById(
            "customerCount"
        ).textContent =
            customers.length;
    }


    // ==========================================
    // SECURITY
    // ==========================================

    function escapeHTML(value) {

        return String(value)

            .replace(/&/g, "&amp;")

            .replace(/</g, "&lt;")

            .replace(/>/g, "&gt;")

            .replace(/"/g, "&quot;")

            .replace(/'/g, "&#039;");
    }


    // ==========================================
    // REFRESH EVERYTHING
    // ==========================================

    function refreshEverything() {

        displayProducts();

        displayCustomers();

        updateCustomerDropdown();

        updateProductDropdown();

        displaySales();

        updateDashboard();

        updateSaleAmount();
    }


    // ==========================================
    // START
    // ==========================================

    refreshEverything();

});
