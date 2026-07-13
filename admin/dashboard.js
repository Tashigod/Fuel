const API_BASE = "https://fuel-xxa4.onrender.com";

document.addEventListener("DOMContentLoaded", () => {

    const token = localStorage.getItem("adminToken");
    const username = localStorage.getItem("adminUsername");

    const adminName = document.getElementById("adminName");
    const logoutBtn = document.getElementById("logoutBtn");

    const ordersTable = document.getElementById("ordersTable");
    const totalOrders = document.getElementById("totalOrders");
    const totalRevenue = document.getElementById("totalRevenue");


    // =========================
    // CHECK ADMIN LOGIN
    // =========================

    if (!token) {
        window.location.href = "login.html";
        return;
    }


    // Display username

    adminName.textContent = username || "Admin";


    // =========================
    // LOGOUT
    // =========================

    logoutBtn.addEventListener("click", () => {

        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUsername");

        window.location.href = "login.html";

    });


    // =========================
    // FETCH ORDERS
    // =========================

    async function fetchOrders() {

        try {

            const response = await fetch(`${API_BASE}/api/orders`, {

                method: "GET",

                headers: {
                    Authorization: `Bearer ${token}`
                }

            });


            const orders = await response.json();


            if (!Array.isArray(orders)) {

                throw new Error("Orders data is not valid");

            }


            updateDashboard(orders);


        } catch (error) {

            console.error("Error loading orders:", error);

            ordersTable.innerHTML = `
                <tr>
                    <td colspan="6">
                        Failed to load orders
                    </td>
                </tr>
            `;

        }

    }



    // =========================
    // UPDATE DASHBOARD
    // =========================

    function updateDashboard(orders) {


        ordersTable.innerHTML = "";


        let revenue = 0;


        orders.forEach(order => {


            revenue += Number(order.total);


            const customer =
                order.address?.email ||
                order.address?.phone ||
                "Unknown";


            const row = document.createElement("tr");


            row.innerHTML = `

                <td>${order.id}</td>

                <td>${customer}</td>

                <td>
                    ₦${Number(order.total).toLocaleString()}
                </td>

                <td>
                    ${
                        order.created_at
                        ? new Date(order.created_at).toLocaleDateString()
                        : "N/A"
                    }
                </td>

                <td>
                    ${order.status}
                </td>

                <td>
                    <button 
                    class="view-btn"
                    onclick="viewOrder(${order.id})">
                        View
                    </button>
                </td>

            `;


            ordersTable.appendChild(row);


        });


        // Update statistics

        totalOrders.textContent = orders.length;


        totalRevenue.textContent =
            "₦" + revenue.toLocaleString();


    }



    fetchOrders();


});


// =========================
// VIEW ORDER
// =========================

function viewOrder(id) {

    alert(
        `Viewing order #${id}\n\nOrder details popup can be added here.`
    );

}