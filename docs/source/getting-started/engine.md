---
title: Setup the Unchained Engine
sidebar_title: Install engine
---

> This tutorial walks you through installing and configuring Unchained Engine.
> An advanced understanding of [Node.js](https://nodejs.org) and [graphQL](https://graphql.org/) is required to follow this tutorial

This tutorial helps you:

- Install and run the Unchained Engine locally
- Log into your admin UI and add a product.

# Create a new Unchained Engine

In this section, we will walk you through the steps required to start up an Unchained Engine api server locally. To perform your first shopping task, we setup the test webapp _Storefront_ and connect it to our Unchained Engine.

## Step 1: Installation

Initialize a new Unchained Engine with `npm` (or another package manager such as Yarn):

```bash
mkdir my-unchained-engine-app
cd my-unchained-engine-app

npm init @unchainedshop engine

npm run install
```

## Step 2: Start the Unchained Engine

```bash
npm run dev
```

Open [localhost:4010](http://localhost:4010) to check if your app is running correctly. You should see an **Login Screen**. Well, log-in!

Username: admin@unchained.local<br />
Password: password

You should see the following admin console in your browser (Yes, the UI can be improved. However, it's an admin console not visible to any customer).

![diagram](../images/gettingStarted/AdminConsole.png)

[localhost:4010/graphql](http://localhost:4010/graphql) opens the graphQL playground for you to easily execute queries and mutations.

## (Step 3: Add a new product)

> To test the Unchained Engine the next step will be to setup the test frontend project _Storefront_ created with [React.js](https://reactjs.org/) and [Next.js](https://nextjs.org/) locally.

## Summary

What did we do so far?

- [http://localhost:3000](http://localhost:3000) to see your web shop front-end (Storefront)
- [http://localhost:4010](http://localhost:4010) to see the Unchained Engine Admin UI<br />Login with username: _admin@unchained.local_ / password: _password_
- [http://localhost:4010/graphql](http://localhost:4010/graphql) to see the Unchained Engine graphQL playground
