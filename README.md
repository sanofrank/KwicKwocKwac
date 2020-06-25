# KwicKwocKwac
Web application for labeling content.

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

## Login

Connect on locahost:3000 to open the application. To enter edit mode you need to login with the above default credential[^1].

|     username     |   password   |
|:----------------:|:------------:|
| ProgettoAldoMoro | KwicKwocKwac |

[^1]THE .env FILE CONTAINS SENSITIVE INFORMATION THAT WILL BE USED FOR DEVELOPING PURPOSE ONLY.