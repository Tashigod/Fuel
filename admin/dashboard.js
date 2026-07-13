const API_BASE = "https://fuel-xxa4.onrender.com";


document.addEventListener("DOMContentLoaded", () => {

    const token = localStorage.getItem("adminToken");
    const username = localStorage.getItem("adminUsername");


    const adminName = document.getElementById("adminName");
    const logoutBtn = document.getElementById("logoutBtn");

    const ordersTable = document.getElementById("ordersTable");

    const totalOrders = document.getElementById("totalOrders");
    const totalRevenue = document.getElementById("totalRevenue");

    const orderModal = document.getElementById("orderModal");
    const closeModal = document.getElementById("closeModal");
    const orderDetails = document.getElementById("orderDetails");


    // =========================
    // CHECK LOGIN
    // =========================

    if (!token) {

        window.location.href = "login.html";
        return;

    }


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
    // LOAD ORDERS
    // =========================

    async function loadOrders() {

        try {

            const response = await fetch(
                `${API_BASE}/api/orders`,
                {
                    headers:{
                        Authorization:`Bearer ${token}`
                    }
                }
            );


            const orders = await response.json();


            displayOrders(orders);


        } catch(error){

            console.error(
                "Failed loading orders:",
                error
            );


            ordersTable.innerHTML = `
                <tr>
                    <td colspan="7">
                        Failed to load orders
                    </td>
                </tr>
            `;

        }

    }




    // =========================
    // DISPLAY ORDERS
    // =========================

    function displayOrders(orders){


        ordersTable.innerHTML = "";


        let revenue = 0;



        orders.forEach(order => {


            revenue += Number(order.total);



            const customer =
                order.address.email || "Unknown";



            const products =
                order.items.map(item => {

                    return `${item.name} x${item.quantity}`;

                }).join(", ");



            const row = document.createElement("tr");



            row.innerHTML = `

                <td>
                    #${order.id}
                </td>


                <td>
                    ${customer}
                </td>


                <td>
                    ${products}
                </td>


                <td>
                    ₦${Number(order.total)
                    .toLocaleString()}
                </td>


                <td>
                    ${new Date(order.date)
                    .toLocaleDateString()}
                </td>


                <td>

                <select 
                class="status-select"
                data-id="${order.id}">

                <option ${order.status=="pending"?"selected":""}>
                pending
                </option>

                <option ${order.status=="processing"?"selected":""}>
                processing
                </option>

                <option ${order.status=="out for delivery"?"selected":""}>
                out for delivery
                </option>

                <option ${order.status=="delivered"?"selected":""}>
                delivered
                </option>

                <option ${order.status=="cancelled"?"selected":""}>
                cancelled
                </option>

                </select>

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



        totalOrders.textContent =
            orders.length;



        totalRevenue.textContent =
            "₦" + revenue.toLocaleString();



        // Store orders for modal

        window.allOrders = orders;


    }

    document.querySelectorAll(".status-select")
.forEach(select => {


select.addEventListener("change", async ()=>{


const id = select.dataset.id;


try{


await fetch(
`${API_BASE}/api/orders/${id}/status`,
{

method:"PUT",

headers:{

"Content-Type":"application/json",

Authorization:`Bearer ${token}`

},

body:JSON.stringify({

status:select.value

})

}

);


alert("Status updated");


}


catch(error){

console.error(error);

alert("Update failed");

}


});


});





    // =========================
    // CLOSE MODAL
    // =========================

    if(closeModal){

        closeModal.onclick = () => {

            orderModal.classList.remove("show");

        };

    }



    // Close clicking outside

    if(orderModal){

        orderModal.onclick = (e)=>{

            if(e.target === orderModal){

                orderModal.classList.remove("show");

            }

        };

    }



    loadOrders();


});





// =========================
// VIEW ORDER DETAILS
// =========================

function viewOrder(id){


    const order =
        window.allOrders.find(
            order => order.id === id
        );



    if(!order) return;



    const address = order.address;



    const products = order.items.map(item=>{


        return `

        <div>

            ${item.name}

            -
            ${item.quantity}

            x ₦${Number(item.price)
            .toLocaleString()}

        </div>

        `;


    }).join("");



    document.getElementById("orderDetails").innerHTML = `


        <h3>
            Order #${order.id}
        </h3>


        <p>
            <strong>Email:</strong>
            ${address.email}
        </p>


        <p>
            <strong>Phone:</strong>
            ${address.phone}
        </p>


        <p>
            <strong>Address:</strong>

            ${address.street},
            ${address.city},
            ${address.state}

        </p>


        <h3>
            Products
        </h3>


        <div class="order-products">

            ${products}

        </div>



        <p>
            <strong>Total:</strong>

            ₦${Number(order.total)
            .toLocaleString()}

        </p>


        <p>
            <strong>Date:</strong>

            ${new Date(order.date)
            .toLocaleString()}

        </p>


        <p>
            <strong>Status:</strong>

            ${order.status}

        </p>


    `;



    document
    .getElementById("orderModal")
    .classList.add("show");


}