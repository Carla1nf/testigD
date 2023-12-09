# Debita V2 Frontend (NextJS)

We tried to convert the old site to TypeScript and bring it up to speed but failed on a few counts.
The old CRA app (deprectaed) proved tricky to integrate with modern tooling. To this end, we have started fresh with these goals

- Reuse the CSS Modules from the V1 website
- Convert the wider layout to tailwind for better responsive control (any components that need it can be converted) in time, we will be fully Tailwind
- TypeScript support. Infer-types first the ndefine where needed.

## Todo list

- [ ] Fonts
- [ ] Google tag manager

## CSS Modules

[CSS Modules](https://nextjs.org/docs/app/building-your-application/styling/css-modules) are built in and easy to use in NextJS, check the docs for how to use them.

## Colours and theming

- Colour pallets are inspired by [IBM Carbon](https://carbondesignsystem.com/data-visualization/color-palettes/)
- [Tailwind](https://tailwindcss.com/docs/customizing-colors) is used for the wider layout and responsive design
- Tins and shades are courtesy of [hex color](https://www.color-hex.com/color/32282d)

### MUI & NextJS

[MUI app directory](https://mui.com/material-ui/guides/next-js-app-router/) support comes baked in, so we can continue to use MUI for some aspects, but I would eventually want to remove it. To use MUI we need to make sure that all compoennts that touch it use the `"use client"` directive which may cause problematic.

For now, we go with it and see what issues we run into.

### Default install docs

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
