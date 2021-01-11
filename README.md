# KwicKwocKwac
Web application for labeling documents generating RDFa and TEI output, developed for the digital edition of Aldo Moro opera omnia.

## Set up MongoDB

The project is build on the database management system Mongo.

First you need to create a Mongo collection where there has to be at least two tables: one named **users** for saving users, and another named **metadata** for stored the metadata information of every marked up document.

To set up MongoDB inside the project you need to create a **.env** file in order to store the connection information.

Inside the file you need to declare a DB_CONNECT variable assigning the url for your Mongo collection.

```
DB_CONNECT = mongodb+srv://"username":"password"@"clustername"-rwpos.mongodb.net/"collection"?retryWrites=true&w=majority
```

## Set up JWT

For the authentication management we use the JSON Web Token standard.

The encryption is based upon three parts: 

- Header
- Payload
- Signature

The header typically consists of two parts: the type of the token, which is JWT, and the signing algorithm being used, such as HMAC SHA256 or RSA.

The second part of the token is the payload, which contains the claims. Claims are statements about an entity (typically, the user) and additional data. We store here the information about the username.

To create the signature part you have to take the encoded header, the encoded payload, a secret, the algorithm specified in the header, and sign that. 

The secret object will be store inside the **.env** file in the variable TOKEN_SECRET.

```
TOKEN_SECRET = tH1s_1s_An_eXAmpl3_0F_SEcreT_String
```

## How to run

First you need to install **Node.js** in your computer following the how to install guide from the official web site (https://nodejs.org/en/download/package-manager/ "Node.js").

From the terminal install all dependencies inside package.json using the node packet manager called **npm**.

```
npm install
```

Start the server on *localhost:3000*

```
npm start
```

It will execute node index.js to start the server.

To execute it on developer mode, run the following command

```
npm run dev
```

This time is going to run nodemon a tool that will restart automatically the server when an edited file is saved.

KwicKwocKwac will run on localhost:3000

## How to use it

Inside the doc folder there is a complete documentation of the application accessible also from the documentation button in the app menu.


<!-- ## Login

Connect on locahost:3000 to open the application. 

To enter edit mode you need to login with the above default credential.

|     username     |   password   |
|:----------------:|:------------:|
| ProgettoAldoMoro | KwicKwocKwac |


**THE .env FILE CONTAINS SENSITIVE INFORMATION THAT WILL BE USED FOR DEVELOPING PURPOSE ONLY.** -->
