(() => {
  "use strict";

  const STORAGE_KEY = "areev_sales_manager_v1";
  const $ = (id) => document.getElementById(id);

  const money = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    }).format(Number(value) || 0);

  const todayISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  };

  const makeId = () =>
    (window.crypto && crypto.randomUUID)
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const escapeHTML = (s) =>
    String(s ?? "").replace(/[&<>"']/g, c =>
      ({
        "&":"&amp;",
        "<":"&lt;",
        ">":"&gt;",
        '"':"&quot;",
        "'":"&#39;"
      }[c])
    );

  const defaultData = () => ({
    profile: {
      name: "",
      business: "",
      phone: "",
      language: "en"
    },
    products: [],
    customers: [],
    sales: [],
    recycleBin: []
  });

  let data = loadData();
  let cart = [];
  let toastTimer;

  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      if (!raw) return defaultData();

      const parsed = JSON.parse(raw);

      return {
        ...defaultData(),
        ...parsed,
        profile: {
          ...defaultData().profile,
          ...(parsed.profile || {})
        },
        products: Array.isArray(parsed.products)
          ? parsed.products : [],
        customers: Array.isArray(parsed.customers)
          ? parsed.customers : [],
        sales: Array.isArray(parsed.sales)
          ? parsed.sales : [],
        recycleBin: Array.isArray(parsed.recycleBin)
          ? parsed.recycleBin : []
      };

    } catch (error) {
      console.error("Could not read saved data", error);
      return defaultData();
    }
  }

  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(error);
      showToast("Could not save. Browser storage may be full.");
      return false;
    }
  }

  function showToast(message) {
    const el = $("toast");
    el.textContent = message;
    el.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(
      () => el.classList.remove("show"),
      2600
    );
  }

  function showView(name) {
    document.querySelectorAll(".view").forEach(v =>
      v.classList.toggle("active", v.id === `view-${name}`)
    );

    document.querySelectorAll(".nav-link").forEach(b =>
      b.classList.toggle("active", b.dataset.view === name)
    );

    const titles = {
      dashboard: "Dashboard",
      products: "Products",
      customers: "Customers",
      sales: "Sales",
      reports: "Reports",
      settings: "Settings"
    };

    $("pageTitle").textContent = titles[name] || "Dashboard";
    $("sidebar").classList.remove("open");

    if (name === "dashboard") renderDashboard();
    if (name === "products") renderProducts();
    if (name === "customers") renderCustomers();
    if (name === "sales") renderSaleForm();
    if (name === "reports") renderReports();
    if (name === "settings") fillProfileForm();
  }

  function openDialog(title, content, actions) {
    $("dialogTitle").textContent = title;
    $("dialogContent").innerHTML = content;
    $("dialogActions").innerHTML = actions;

    const dlg = $("appDialog");

    if (typeof dlg.showModal === "function") {
      dlg.showModal();
    } else {
      dlg.setAttribute("open", "");
    }
  }

  function closeDialog() {
    const dlg = $("appDialog");

    if (dlg.open) dlg.close();
    else dlg.removeAttribute("open");
  }

  function empty(message) {
    return `<div class="empty-state">${escapeHTML(message)}</div>`;
  }

  function productById(id) {
    return data.products.find(p => p.id === id);
  }

  function customerById(id) {
    return data.customers.find(c => c.id === id);
  }

  // DASHBOARD

  function renderDashboard() {
    const today = todayISO();

    const todays = data.sales.filter(
      s => s.date === today
    );

    $("statToday").textContent = money(
      todays.reduce((n, s) => n + s.total, 0)
    );

    $("statTodayCount").textContent =
      `${todays.length} transaction${todays.length === 1 ? "" : "s"}`;

    $("statProducts").textContent = data.products.length;
    $("statCustomers").textContent = data.customers.length;

    $("statStock").textContent = data.products.reduce(
      (n, p) => n + Number(p.stock || 0),
      0
    );

    const recent = [...data.sales]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 6);

    $("recentSales").innerHTML = recent.length
      ? table(
          ["Date", "Customer", "Items", "Total"],
          recent.map(s => [
            formatDate(s.date),
            escapeHTML(s.customerName || "Walk-in"),
            s.items.reduce((n, i) => n + i.quantity, 0),
            money(s.total)
          ])
        )
      : empty("No sales recorded yet.");

    const low = data.products
      .filter(p => Number(p.stock) <= 5)
      .sort((a, b) => a.stock - b.stock);

    $("lowStockList").innerHTML = low.length
      ? low.slice(0, 7).map(p => `
          <div class="low-stock-item">
            <span>${escapeHTML(p.name)}</span>
            <strong class="${p.stock <= 2 ? "stock-low" : ""}">
              ${p.stock} left
            </strong>
          </div>
        `).join("")
      : empty("No low-stock products.");
  }

  function table(headers, rows) {
    if (!rows.length) return empty("Nothing to show.");

    return `
      <table>
        <thead>
          <tr>
            ${headers.map(h => `<th>${h}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => `
            <tr>
              ${r.map(c => `<td>${c}</td>`).join("")}
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  }

  // PRODUCTS

  function renderProducts() {
    const q = $("productSearch").value.trim().toLowerCase();

    const rows = data.products
      .filter(p => p.name.toLowerCase().includes(q))
      .map(p => [
        `<strong>${escapeHTML(p.name)}</strong>`,
        money(p.price),
        `<span class="${p.stock <= 5 ? "stock-low" : ""}">${p.stock}</span>`,
        `
          <div class="action-group">
            <button class="small-button" data-edit-product="${p.id}">
              Edit
            </button>
            <button class="small-button delete" data-delete-product="${p.id}">
              Delete
            </button>
          </div>
        `
      ]);

    $("productsTable").innerHTML = table(
      ["Product", "Selling price", "Stock left", "Actions"],
      rows
    );
  }

  function productDialog(product = null) {
    const p = product || {
      name: "",
      price: "",
      stock: ""
    };

    openDialog(
      product ? "Edit product" : "Add product",
      `
        <div class="dialog-fields">
          <label>
            Product name
            <input
              id="dlgProductName"
              required
              maxlength="100"
              value="${escapeHTML(p.name)}"
              placeholder="e.g. Rice"
            >
          </label>

          <label>
            Selling price (₹)
            <input
              id="dlgProductPrice"
              required
              type="number"
              min="0"
              step="0.01"
              value="${p.price}"
              placeholder="0.00"
            >
          </label>

          <label>
            Available stock
            <input
              id="dlgProductStock"
              required
              type="number"
              min="0"
              step="1"
              value="${p.stock}"
              placeholder="0"
            >
          </label>
        </div>
      `,
      `
        <button class="secondary" type="button" data-dialog-cancel>
          Cancel
        </button>
        <button class="primary" type="button" id="saveProductButton">
          Save product
        </button>
      `
    );

    $("saveProductButton").addEventListener("click", () => {
      const name = $("dlgProductName").value.trim();
      const price = Number($("dlgProductPrice").value);
      const stock = Number($("dlgProductStock").value);

      if (
        !name ||
        $("dlgProductPrice").value === "" ||
        $("dlgProductStock").value === "" ||
        !Number.isFinite(price) ||
        price < 0 ||
        !Number.isInteger(stock) ||
        stock < 0
      ) {
        showToast("Enter a name, valid price and whole-number stock.");
        return;
      }

      if (product) {
        Object.assign(product, { name, price, stock });
      } else {
        data.products.push({
          id: makeId(),
          name,
          price,
          stock
        });
      }

      if (saveData()) {
        closeDialog();
        renderProducts();
        renderDashboard();
        renderSaleForm();

        showToast(
          product ? "Product updated." : "Product added."
        );
      }
    });
  }

  // CUSTOMERS

  function renderCustomers() {
    const q = $("customerSearch").value.trim().toLowerCase();

    const rows = data.customers
      .filter(c =>
        (c.name + " " + (c.phone || ""))
          .toLowerCase()
          .includes(q)
      )
      .map(c => {
        const sales = data.sales.filter(
          s => s.customerId === c.id
        );

        const total = sales.reduce(
          (n, s) => n + s.total,
          0
        );

        return [
          `<strong>${escapeHTML(c.name)}</strong>`,
          escapeHTML(c.phone || "—"),
          sales.length,
          money(total),
          `
            <div class="action-group">
              <button class="small-button" data-customer-detail="${c.id}">
                History
              </button>
              <button class="small-button" data-edit-customer="${c.id}">
                Edit
              </button>
              <button class="small-button delete" data-delete-customer="${c.id}">
                Delete
              </button>
            </div>
          `
        ];
      });

    $("customersTable").innerHTML = table(
      ["Customer", "Phone", "Sales", "Total purchased", "Actions"],
      rows
    );
  }

  function customerDialog(customer = null) {
    const c = customer || {
      name: "",
      phone: "",
      notes: ""
    };

    openDialog(
      customer ? "Edit customer" : "Add customer",
      `
        <div class="dialog-fields">
          <label>
            Customer name
            <input
              id="dlgCustomerName"
              required
              maxlength="100"
              value="${escapeHTML(c.name)}"
            >
          </label>

          <label>
            Phone number
            <input
              id="dlgCustomerPhone"
              maxlength="20"
              inputmode="tel"
              value="${escapeHTML(c.phone || "")}"
            >
          </label>

          <label>
            Notes (optional)
            <input
              id="dlgCustomerNotes"
              maxlength="200"
              value="${escapeHTML(c.notes || "")}"
            >
          </label>
        </div>
      `,
      `
        <button class="secondary" type="button" data-dialog-cancel>
          Cancel
        </button>
        <button class="primary" type="button" id="saveCustomerButton">
          Save customer
        </button>
      `
    );

    $("saveCustomerButton").addEventListener("click", () => {
      const name = $("dlgCustomerName").value.trim();

      if (!name) {
        showToast("Enter the customer name.");
        return;
      }

      const fields = {
        name,
        phone: $("dlgCustomerPhone").value.trim(),
        notes: $("dlgCustomerNotes").value.trim()
      };

      if (customer) {
        Object.assign(customer, fields);
      } else {
        data.customers.push({
          id: makeId(),
          ...fields
        });
      }

      if (saveData()) {
        closeDialog();
        renderCustomers();
        renderDashboard();
        renderSaleForm();

        showToast(
          customer ? "Customer updated." : "Customer added."
        );
      }
    });
  }

  function showCustomerHistory(id) {
    const c = customerById(id);
    if (!c) return;

    const sales = data.sales
      .filter(s => s.customerId === id)
      .sort((a, b) => b.createdAt - a.createdAt);

    const total = sales.reduce(
      (n, s) => n + s.total,
      0
    );

    const rows = sales.map(s => [
      formatDate(s.date),
      s.items.map(i =>
        `${escapeHTML(i.name)} × ${i.quantity}`
      ).join(", "),
      money(s.total)
    ]);

    openDialog(
      `${c.name} — purchase history`,
      `
        <p class="muted">
          Phone: ${escapeHTML(c.phone || "Not provided")}
          · Total purchases: <strong>${money(total)}</strong>
        </p>
        <div class="table-wrap">
          ${table(["Date", "Items", "Total"], rows)}
        </div>
      `,
      `
        <button class="secondary" type="button" data-dialog-cancel>
          Close
        </button>
        <button class="primary" type="button" id="customerCsvButton">
          Download CSV
        </button>
      `
    );

    $("customerCsvButton").addEventListener("click", () =>
      downloadCSV(
        `customer-${safeFile(c.name)}-sales.csv`,
        sales
      )
    );
  }

  // SALES AND CART

  function renderSaleForm() {
    const selected = $("saleCustomer").value;

    $("saleCustomer").innerHTML =
      `<option value="">Walk-in customer</option>` +
      data.customers.map(c => `
        <option value="${c.id}">${escapeHTML(c.name)}</option>
      `).join("");

    $("saleCustomer").value =
      customerById(selected) ? selected : "";

    const current = $("saleProduct").value;

    $("saleProduct").innerHTML =
      `<option value="">Select a product</option>` +
      data.products
        .filter(p => p.stock > 0)
        .map(p => `
          <option value="${p.id}">
            ${escapeHTML(p.name)} — ${money(p.price)} (${p.stock} left)
          </option>
        `).join("");

    $("saleProduct").value =
      productById(current) && productById(current).stock > 0
        ? current
        : "";

    renderCart();
  }

  function addToCart() {
    const id = $("saleProduct").value;
    const p = productById(id);
    const qty = Number($("saleQuantity").value);

    if (!p) {
      showToast("Select a product first.");
      return;
    }

    if (!Number.isInteger(qty) || qty < 1) {
      showToast("Enter a whole quantity greater than zero.");
      return;
    }

    const existing = cart.find(i => i.productId === id);
    const inCart = existing ? existing.quantity : 0;

    if (qty + inCart > p.stock) {
      showToast(`Only ${p.stock - inCart} more unit(s) available.`);
      return;
    }

    if (existing) {
      existing.quantity += qty;
    } else {
      cart.push({
        productId: id,
        name: p.name,
        price: p.price,
        quantity: qty
      });
    }

    $("saleQuantity").value = "1";

    renderCart();
    showToast("Added to cart.");
  }

  function renderCart() {
    const units = cart.reduce(
      (n, i) => n + i.quantity,
      0
    );

    const total = cart.reduce(
      (n, i) => n + i.price * i.quantity,
      0
    );

    $("cartCount").textContent =
      `${units} item${units === 1 ? "" : "s"}`;

    $("cartTotal").textContent = money(total);

    $("cartItems").innerHTML = cart.length
      ? cart.map(i => `
          <div class="cart-line">
            <div>
              <strong>${escapeHTML(i.name)}</strong>
              <small>
                ${money(i.price)} each · ${money(i.price * i.quantity)}
              </small>
            </div>

            <div class="cart-controls">
              <button data-cart-minus="${i.productId}" aria-label="Decrease quantity">−</button>
              <strong>${i.quantity}</strong>
              <button data-cart-plus="${i.productId}" aria-label="Increase quantity">+</button>
              <button class="small-button delete" data-cart-remove="${i.productId}">×</button>
            </div>
          </div>
        `).join("")
      : empty("Your cart is empty.");

    $("confirmSaleButton").disabled = !cart.length;
  }

  function confirmSale() {
    if (!cart.length) return;

    for (const item of cart) {
      const p = productById(item.productId);

      if (!p || p.stock < item.quantity) {
        showToast("Stock changed. Please review your cart.");
        return;
      }
    }

    const customerId = $("saleCustomer").value;
    const customer = customerById(customerId);

    const items = cart.map(i => ({
      productId: i.productId,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      lineTotal: i.price * i.quantity
    }));

    const sale = {
      id: makeId(),
      date: todayISO(),
      createdAt: Date.now(),
      customerId: customer ? customer.id : "",
      customerName: customer ? customer.name : "Walk-in",
      items,
      total: items.reduce(
        (n, i) => n + i.lineTotal,
        0
      )
    };

    items.forEach(i => {
      productById(i.productId).stock -= i.quantity;
    });

    data.sales.push(sale);

    if (saveData()) {
      cart = [];
      renderSaleForm();
      renderDashboard();
      showToast("Sale saved and stock updated.");
    }
  }

  // REPORTS

  function renderReports() {
    const from = $("reportFrom").value;
    const to = $("reportTo").value;
    const cid = $("reportCustomer").value;

    const filtered = filteredSales(from, to, cid);

    $("reportTotal").textContent = money(
      filtered.reduce((n, s) => n + s.total, 0)
    );

    $("reportCount").textContent = filtered.length;

    $("reportUnits").textContent = filtered.reduce(
      (n, s) =>
        n + s.items.reduce((m, i) => m + i.quantity, 0),
      0
    );

    const rows = [...filtered]
      .sort((a, b) => b.createdAt - a.createdAt)
      .map(s => [
        formatDate(s.date),
        escapeHTML(s.customerName || "Walk-in"),
        s.items.map(i =>
          `${escapeHTML(i.name)} × ${i.quantity}`
        ).join(", "),
        money(s.total)
      ]);

    $("reportsTable").innerHTML = table(
      ["Date", "Customer", "Items", "Total"],
      rows
    );

    $("reportCustomer").innerHTML =
      `<option value="">All customers</option>` +
      data.customers.map(c => `
        <option value="${c.id}">${escapeHTML(c.name)}</option>
      `).join("");

    $("reportCustomer").value = cid;
  }

  function filteredSales(from, to, cid) {
    return data.sales.filter(s =>
      (!from || s.date >= from) &&
      (!to || s.date <= to) &&
      (!cid || s.customerId === cid)
    );
  }

  function formatDate(iso) {
    if (!iso) return "—";

    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  }

  // DOWNLOAD AND CSV

  function safeFile(s) {
    return String(s || "data")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "data";
  }

  function downloadFile(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = filename;

    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  }

  function csvCell(value) {
    return `"${String(value ?? "").replace(/"/g, '""')}"`;
  }

  function downloadCSV(filename, sales) {
    const rows = [[
      "Date",
      "Customer",
      "Product",
      "Quantity",
      "Unit price",
      "Line total",
      "Sale total"
    ]];

    sales.forEach(s =>
      s.items.forEach(i =>
        rows.push([
          s.date,
          s.customerName,
          i.name,
          i.quantity,

          
