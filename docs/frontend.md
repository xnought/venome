# Frontend

In [SvelteKit](https://kit.svelte.dev/) which uses the [Svelte](https://svelte.dev/) JavaScript framework which makes frontend work really freaking easy and great for visualizations.

Here are [tutorials](https://learn.svelte.dev/tutorial/welcome-to-svelte) if you are interested, you'll find it simpler than regular JavaScript and much faster than other frameworks like React.

## UI Styling

Our frontend uses [Flowbite Svelte Components](https://flowbite-svelte.com/) and [Tailwind CSS](https://tailwindcss.com/), although feel free to use native CSS.

Check out Flowbite to use those ready-made svelte components (like buttons, dropdowns, tooltips, cards, and more).

## Add packages

```bash
cd frontend
yarn add js_package_name
```

which adds the package locally (so your intellisense can detect it).

To have those packages also installed/reflected in the backend run

```bash
sh run.sh refresh_packages
```

or rebuild the entire docker (this method is slower, but guaranteed to work) with 

```bash
sh run.sh hard_restart
```

## Access to Backend Functions

You can create functions in the [`backend/server.py`](../backend/src/server.py) and import them into the frontend.

To do this, you need to have saved your changes in the backend, restart the server, then run `./run.sh gen_api` from the project root.

Now you can simply import the `Backend` object and call the functions by name (which will subsequently call the server).

Example

```ts
import { Backend } from '$lib/backend';
console.log(await Backend.helloWord()) // > {"message": "Hello World"}
```

It's that easy!

> [!NOTE]
> The `Backend.helloWorld()` corresponds exactly to the backend function defined in the HTTP server. Which is automatically generated by `yarn openapi` based on the backend HTTP endpoints.
> 
> Check [`server.py`](../backend/src/server.py) and you'll find `hello_world` as a function too.
>
> If you must know, the frontend uses this interface `Backend.helloWorld()` to make a GET request to the backend at the function `hello_world` in [`server.py`](../backend/src/server.py). Luckily this is abstracted away with `yarn openapi` / `./run.sh api` API generation.


## Need help?

First check [SvelteKit](https://kit.svelte.dev/) docs to figure out what files mean what. Then ask @xnought.
