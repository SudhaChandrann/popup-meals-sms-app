const Order = require("./assignment2Order");
const fetch = require('sync-fetch');

const OrderState = Object.freeze({
    WELCOMING:   Symbol("welcoming"),
    MENU:   Symbol("menu"),
    SERVE:   Symbol("serve"),
    ITEMPRICE: Symbol("ITEMPRICE"),
    SIZEPRICE: Symbol("SIZEPRICE"),
    TOTALPRICE: Symbol("totalprice"),
    PAYMENT: Symbol("payment")
});

module.exports = class RestaurantOrder extends Order{
    constructor(sNumber, sUrl){
        super(sNumber, sUrl);
        this.stateCur = OrderState.WELCOMING;
        this.sSERVE = "";
        this.sMenu = "";
        this.sTOPPINGS = "";
        this.sDrinks = "";
        this.sFRIES = "";
        this.sItem = "";
        this.sITEMPRICE = "";
        this.sSIZEPRICE = "";
        this.totalprice = "";
        this.sTOPPINGSPRICE = "";
        this.sFRIESprice = "";
        this.sDrinksprice = "";
        global.dishes = [];
        global.dishObjects = {};
    }
    handleInput(sInput){
        let aReturn = [];
        switch(this.stateCur){
          case OrderState.WELCOMING:
            //this.orderItems.push(sInput)
            let sResult = "";
            aReturn.push("Welcome to Anudeep's Restaurant");
            aReturn.push("What food would you like to order?");
            const oJson = fetch("https://popup-meals-default-rtdb.firebaseio.com/meals.json").json();
            console.log(oJson);
            Object.keys(oJson).map((key) => {
                const oEntity = oJson[key];
                global.dishObjects[oEntity.title.toLowerCase()] = oEntity;
                global.dishes.push(oEntity.title.toLowerCase());
                oEntity.id = key;
                aReturn.push("Dish: " + oEntity.title + "\n" +
                            "Description: " + oEntity.full_description + "\n" +
                            "Pickup Location: " + oEntity.location +"\n" +
                            "Date: " + oEntity.date_of_event +"\n");

            });
            console.log("Dict Values - "+ JSON.stringify(global.dishObjects));
            console.log("Dishes-", JSON.stringify(global.dishes));
            this.stateCur = OrderState.MENU;
            break;
          case OrderState.MENU:
            console.log("Input-" +sInput);
            let selectedDish = "";
            selectedDish = global.dishes.find((dish) => dish.includes(sInput));
            console.log("Selected Dish-"+ selectedDish);
            sInput = selectedDish;
            if (global.dishes.indexOf(sInput.toLowerCase() >= -1))
            {
                this.sItem = sInput.toLowerCase();
                console.log("Dict value "+ global.dishObjects);
                Object.keys(global.dishObjects).map((key) => {
                  const oEntity = global.dishObjects[key]
                  console.log("Key "+ key.toString());
                  console.log("Value " + oEntity.price.toString());
                  if(key == sInput)
                  {
                  this.sITEMPRICE = oEntity.price;
                  console.log("Entitiy" + oEntity);
                  }
                });
                console.log("Selected Dish Object-"+ global.dishObjects[sInput]);
                console.log("Item Price - " + this.sITEMPRICE);
                this.totalprice = this.sITEMPRICE
                console.log(this.totalprice);
                aReturn.push(`How many SERVE's? of ${sInput} l or 2 or 3 would you like?`);
                this.stateCur = OrderState.SERVE

            }
            else{
                aReturn.push("Please enter a valid dish. Available dishes - ", JSON.stringify(dishes));
            }
            break;
          case OrderState.SERVE:
            if (sInput == 1 || sInput == 2 || sInput ==3)
            {
            this.sSERVE = sInput;
            this.sSIZEPRICE = (sInput - 1) * this.sITEMPRICE
            this.totalprice = this.totalprice + this.sSIZEPRICE
            console.log(this.totalprice);
            }
            else {
              aReturn.push("Please enter a valid serve Quantity: 1 - 2 - 3");
            }            
            aReturn.push(`Thank you for your order of ${this.sSERVE} servings of ${this.sItem}`);
            this.nOrder = this.totalprice;
            aReturn.push(`Please pay for your order here`);
            this.stateCur = OrderState.PAYMENT;
            aReturn.push(`${this.sUrl}/payment/${this.sNumber}/`);
            break;
          case OrderState.PAYMENT:
                console.log(sInput);
                this.isDone(true);
                let d = new Date();
                d.setMinutes(d.getMinutes() + 30);
                aReturn.push(`Your order is confirmed. Stay healthy! Stay Safe!!`);
                break;
        }
        return aReturn;
    }
    renderForm(){
      // your client id should be kept private
      const sClientID = SB_CLIENT_ID;
      return(`
      <!DOCTYPE html>
  
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1"> <!-- Ensures optimal rendering on mobile devices. -->
        <meta http-equiv="X-UA-Compatible" content="IE=edge" /> <!-- Optimal Internet Explorer compatibility -->
      </head>
      
      <body>
        <script src="https://code.jquery.com/jquery-3.5.1.min.js"></script>
        <script
          src="https://www.paypal.com/sdk/js?client-id=${sClientID}"> // Required. Replace SB_CLIENT_ID with your sandbox client ID.
        </script>
        Thank you ${this.sNumber} for your order of $${this.nOrder}.
        <div id="paypal-button-container"></div>
  
        <script>
          paypal.Buttons({
              createOrder: function(data, actions) {
                // This function sets up the details of the transaction, including the amount and line item details.
                return actions.order.create({
                  purchase_units: [{
                    amount: {
                      value: '${this.nOrder}'
                    }
                  }]
                });
              }, 
              onApprove: function(data, actions) {
                // This function captures the funds from the transaction.
                return actions.order.capture().then(function(details) {
                  // This function shows a transaction success message to your buyer.
                  $.post(".", details, ()=>{
                    window.open("", "_self");
                    window.close(); 
                  });
                });
              }
          
            }).render('#paypal-button-container');
          // This function displays Smart Payment Buttons on your web page.
        </script>
      
      </body>
          
      `);
  
    }
}