const API = (() => {
  const URL = "http://localhost:3000";
  const getCart = async () => {
    // define your method to get cart data
    const response = await fetch(`${URL}/cart`);
    return response.json();
  };

  const getInventory = async () => {
    // define your method to get inventory data
    const response = await fetch(`${URL}/inventory`);
    return response.json();
  };

  const addToCart = async (inventoryItem) => {
    // define your method to add an item to cart
    const response = await fetch(`${URL}/cart`, {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify(inventoryItem),
    });
    return response.json();
  };

  const updateCart = async (id, newAmount) => {
    // define your method to update an item in cart
    const response = await fetch(`${URL}/cart/${id}`, {
      method: "PATCH",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify({ amount: newAmount }),
    });
    return response.json();
  };

  const deleteFromCart = async (id) => {
    // define your method to delete an item in cart
    const response = await fetch(`${URL}/cart/${id}`, {
      method: "DELETE",
      headers: { "Content-type": "application/json" },
    });

    if (!response.ok) {
      const error = await response.text();
      alert(error);
    }

    return response.json();
  };

  const checkout = () => {
    // you don't need to add anything here
    return getCart().then((data) =>
      Promise.all(data.map((item) => deleteFromCart(item.id)))
    );
  };

  return {
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
  };
})();

const Model = (() => {
  // implement your logic for Model
  class State {
    #onChange;
    #inventory;
    #cart;
    constructor() {
      this.#inventory = [];
      this.#cart = [];
    }

    get cart() {
      return this.#cart;
    }

    get inventory() {
      return this.#inventory;
    }

    set cart(newCart) {
      this.#cart = newCart;
      this.#onChange();
    }
    set inventory(newInventory) {
      this.#inventory = newInventory;
      this.#onChange();
    }

    subscribe(cb) {
      this.#onChange = cb;
    }
  }

  return {
    State,
    ...API,
  };
})();

const View = (() => {
  // implement your logic for View
  const inventoryListElement = document.querySelector(".inventory__list");
  const cartListElement = document.querySelector(".cart__list");
  const checkoutButton = document.querySelector(".checkout-btn");

  const renderInventory = (inventories) => {
    const currList = inventories.map((inventory) => {
      const li = document.createElement("li");
      li.id = String(inventory.id);

      const span = document.createElement("span");
      span.textContent = `${inventory.content}`;

      const minusBtn = document.createElement("button");
      minusBtn.classList.add("inventory__minus_btn");
      minusBtn.textContent = "-";

      const numSpan = document.createElement("span");
      numSpan.classList.add("inventory__amount");
      numSpan.textContent = 0;

      const plusBtn = document.createElement("button");
      plusBtn.classList.add("inventory__plus_btn");
      plusBtn.textContent = "+";

      const addCartBtn = document.createElement("button");
      addCartBtn.classList.add("inventory__add-cart-btn");
      addCartBtn.textContent = "add to cart";

      minusBtn.addEventListener("click", () => {
        let curr = parseInt(numSpan.textContent);
        if (curr > 0) {
          numSpan.textContent = curr - 1;
        }
      });

      plusBtn.addEventListener("click", () => {
        numSpan.textContent = parseInt(numSpan.textContent) + 1;
      });

      li.append(span, minusBtn, numSpan, plusBtn, addCartBtn);
      return li;
    });

    inventoryListElement.replaceChildren(...currList);
  };

  const renderCart = (cart) => {
    const currList = cart.map((item) => {
      const li = document.createElement("li");
      li.id = String(item.id);

      const span = document.createElement("span");
      span.classList.add("content-amount");
      span.textContent = `${item.content} x ${item.amount}`;

      const deleteBtn = document.createElement("button");
      deleteBtn.classList.add("cart__delete_btn");
      deleteBtn.textContent = "delete";

      const editBtn = document.createElement("button");
      editBtn.classList.add("cart__edit-btn");
      editBtn.textContent = "edit";

      deleteBtn.addEventListener("click", (event) => {});

      li.append(span, deleteBtn, editBtn);
      return li;
    });

    cartListElement.replaceChildren(...currList);
  };

  return {
    renderInventory,
    renderCart,
    checkoutButton,
    inventoryListElement,
    cartListElement,
  };
})();

const Controller = ((model, view, api) => {
  const state = new model.State();

  const handleAddToCart = () => {
    view.inventoryListElement.addEventListener("click", async (event) => {
      if (event.target.classList.contains("inventory__add-cart-btn")) {
        event.preventDefault();
        const li = event.target.closest("li");
        if (!li) return;

        try {
          const id = li.id.toString();
          const amountElement = li.querySelector(".inventory__amount");
          const amount = parseInt(amountElement.textContent) || 1;
          console.log(li);
          console.log(state.inventory);
          const item = state.inventory.find((ele) => ele.id.toString() === id);
          if (!item) throw new Error("Item not found in inventory");
          console.log(state.cart);
          const existingItem = state.cart.find((ele) => ele.id.toString() === id);
          console.log(existingItem);
          if (existingItem) {
            const data = await model.updateCart(id, existingItem.amount + amount);
            console.log(data);
          } else {
            const data = await model.addToCart({
              id: item.id,
              content: item.content,
              amount: amount,
            });
            console.log(data);
          }

          const updatedCart = await model.getCart();
          state.cart = updatedCart;

          amountElement.textContent = "0";
        } catch (error) {
          console.error("Error handling cart operation:", error);
        }
      }
    });
  };

  const handleEdit = () => {
    view.cartListElement.addEventListener("click", async (event) => {
      if (event.target.classList.contains("cart__edit-btn")) {
        event.preventDefault();
        const li = event.target.closest("li");
        if (!li) return;
  
        try {
          const editBtn = event.target;
          const amountSpan = li.querySelector(".content-amount");
          const currentAmount = parseInt(amountSpan.textContent.split('x')[1].trim());
        
  
          const btnContainer = document.createElement("div");
          btnContainer.classList.add("cart__edit-controls");
          
          const minusBtn = document.createElement("button");
          minusBtn.textContent = "-";
          minusBtn.classList.add("cart__edit-minus");
          
          const numSpan = document.createElement("span");
          numSpan.classList.add("cart__amount-display");
          numSpan.textContent = currentAmount;
  
          const plusBtn = document.createElement("button");
          plusBtn.textContent = "+";
          plusBtn.classList.add("cart__edit-plus");
  
          btnContainer.append(minusBtn, numSpan, plusBtn);
          editBtn.replaceWith(btnContainer);
  
        } catch (error) {
          console.error("Edit failed:", error);
        }
      }
    });
  };
  
  const handleEditAmount = () => {
    view.cartListElement.addEventListener("click", async (event) => {
      const li = event.target.closest("li");
      if (!li) return;
  
      const itemId = li.id;
      const amountDisplay = li.querySelector(".cart__amount-display");
      const mainAmountSpan = li.querySelector(".cart__amount");
      
      try {
        if (event.target.classList.contains("cart__edit-minus")) {
          const newAmount = Math.max(parseInt(amountDisplay.textContent) - 1, 0);
          await updateCartAmount(itemId, newAmount, amountDisplay, mainAmountSpan);
        }
        
        if (event.target.classList.contains("cart__edit-plus")) {
          const newAmount = parseInt(amountDisplay.textContent) + 1;
          await updateCartAmount(itemId, newAmount, amountDisplay, mainAmountSpan);
        }
      } catch (error) {
        console.error("Edit amount failed:", error);
      }
    });
  };

  const updateCartAmount = async (itemId, newAmount, displayElement, mainElement) => {
    await model.updateCart(itemId, newAmount);
    displayElement.textContent = newAmount;
    mainElement.textContent = newAmount;
    state.cart = state.cart.map(item => 
      item.id === itemId ? {...item, amount: newAmount} : item
    );
  };

  const handleDelete = () => {
    view.cartListElement.addEventListener("click", async (event) => {
      if (event.target.classList.contains("cart__delete_btn")) {
        event.preventDefault();
        const li = event.target.closest("li");
        if (!li) return;
  
        try {
          const itemId = li.id;
          await model.deleteFromCart(itemId);
          state.cart = state.cart.filter(item => item.id !== itemId);
        } catch (error) {
          console.error("Error deleting item:", error);
        }
      }
    });
  };

  const handleCheckout = async (event) => {
    view.checkoutButton.addEventListener("click", async (event) => {
      event.preventDefault();
      await model.checkout();
      state.cart = [];
      alert("Checkout");
    });
  };

  const init = async () => {
    state.subscribe(() => {
      View.renderInventory(state.inventory);
      View.renderCart(state.cart);
    });

    try {
      const data = await api.getInventory();
      state.inventory = data;
    } catch (error) {
      console.log("Error fetching inventories:", error);
    }

    try {
      const data = await api.getCart();
      state.cart = data;
    } catch (error) {
      console.log("Error fetching cart:", error);
    }
    handleAddToCart();
    handleEdit();
    handleCheckout();
    handleEditAmount();
    handleDelete();
  };

  return {
    init,
  };
})(Model, View, API);

Controller.init();
