# nmc-pizza-ecomm
Pizza Delivery ecommerce api assignment for pirple Node Master Class.

Utilizes helper libraries from stripe.com and mailgun.com for payment processing and emailing receipts respectively.

### The API

#### Signing up a customer account

POST to /users with a body in the following format:
```
{
	"firstName": "Pizza",
	"lastName": "Lover",
	"email": "munch@eat.org",
	"address1": "123 45th St NW",
	"address2": "Apt 200",
	"city": "Seattle",
	"state": "WA",
	"zipcode": "98124-1234",
	"password": "LovePizza",
	"tosAgreement": true
}
```
On success expect 200 status and and empty body object. Error resposes returned for missing or malformed request body.

#### Login. Get a token

POST to /tokens with a body in the following format:
```
{
  "email": "munch@eat.org",
  "password": "LovePizza"
}
```
On success expect 200 status and the following response body:
```
{
    "email": "munch@eat.org",
    "id": "1jIizHuaOkOwIbhrfBu7",
    "expires": 1535596593842
}
```
The id must be retained and included in subsequent message headers as "token". This is our version of Bearer Authentication.  Tokens expire in one hour and can be extended by the user:

PUT to /tokens?id=1jIizHuaOkOwIbhrfBu7

This will return
```
{
    "email": "munch@eat.org",
    "id": "pZWEXfTKeUt1epOxOJqa",
    "expires": 1535596707060
}
```
which includes an extended expires time.

#### Get the menu

GET to /menu with token header set to token id:
```
[
    {
        "type": "pizza",
        "id": 101,
        "name": "Puget Pounder",
        "description": "Red sauce topped with Sausage, Peperoni, Olives",
        "small": 9.95,
        "medium": 14.95,
        "large": 21.95
    },
    {
        "type": "pizza",
        "id": 102,
        "name": "John Candy",
        "description": "Red sauce topped with Peperoni, Canadian Bacon, Olives",
        "small": 9.95,
        "medium": 14.95,
        "large": 21.95
    },
    {
        "type": "salad",
        "id": 201,
        "name": "House",
        "description": "Mixed greens with your choice of dressing",
        "small": 4.95,
        "medium": 6.95,
        "large": 9.95
    },
    ...
]
```
The menu is kept as a json file in .data/menu.

#### Build an order (fill your pizza cart)

POST to /cart with a body in the form: (token header requred)
```
{
	"menuId": 101,
	"size": "large",
	"qty": 2
}
```
On success expect status 200 and an empty body.

#### Get the cart (do this before you update it)

GET /cart (token header required) Response:
```
[
    {
        "type": "pizza",
        "name": "Puget Pounder",
        "size": "large",
        "qty": 2,
        "price": 21.95,
        "extPrice": 43.9
    },
    {
        "type": "dessert",
        "name": "Chocolate Ice Cream",
        "size": "medium",
        "qty": 1,
        "price": 4.95,
        "extPrice": 4.95
    }
]
```
Make changes to this array of items and then PUT to /cart to update.

#### Place your order

POST to /order with a valid token in the header and a body of the form:
```
{
	"cardToken": "tok_mastercard"
}
```
The cardToken is the temporary token Stripe returns once they have received the customer's payment information. Expect the following back:
```
{
    "chargeStatus": "succeeded",
    "chargeAmount": 96.65,
    "emailStatus": "Queued. Thank you."
}
```
An email receipt is generated (but not sent in the current sandbox version).

#### Other Routes

/users, /tokens, /cart routes all include full CRUD capability (POST GET PUT DELETE).  A valid token is required for all operations except initial signup (POST /users).

Also supported: /ping responds with 200 regardless of the method used.

