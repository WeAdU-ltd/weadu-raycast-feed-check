# WeAdU Feed Check

A Raycast extension that checks a Google Shopping product feed you paste into it. It lists each product with the problems it found, so you can fix them before Merchant Center does.

The check runs on your computer. The extension makes no network request and does not sign in to Merchant Center.

## Command

**Check Shopping Feed**: paste a feed, submit, and read the result.

- Accepted formats: Google RSS 2.0 or Atom feeds (with `g:` fields), and CSV or tab-separated files whose header row uses Google attribute names (`id`, `title`, `description`, `link`, `image_link` or `image link`, `availability`, `price`, `brand`, `gtin`, `mpn`, `condition`, `identifier_exists`).
- Up to 500 products are checked. Beyond that, a warning says the feed was truncated.
- Each product shows its findings and a count of errors and warnings. **Copy findings** copies them as text. **Check another feed** goes back to the form.

## What is checked

Errors:

- empty `id`, `title`, `description`, `link`, `image_link`, `availability`, or `price`;
- `title` over 150 characters, `description` over 5,000 characters;
- `link` or `image_link` not starting with `http://` or `https://`;
- `availability` other than `in_stock`, `out_of_stock`, `preorder`, or `backorder` (`in stock` is accepted);
- `price` that cannot be read (expected form: `19.00 EUR`) or is not greater than zero;
- `gtin` with an invalid length or check digit;
- the same `id` used twice.

Warnings:

- `title` under 15 characters, all in capitals, or containing promotional wording such as "free shipping", "sale", or "% off";
- `price` without an ISO currency code;
- empty `brand`;
- empty `gtin` and `mpn`, unless `identifier_exists` is `no`;
- empty `condition`, or a value other than `new`, `refurbished`, or `used`.

A product with no finding is not an approval from Google: Merchant Center applies many more rules.

## Installation

Once the extension is in the Raycast Store, install it from the Store command in Raycast.

To run it from source:

```sh
npm ci
npx ray develop
```

## Privacy

The pasted text stays on your computer. The extension makes no network request, stores nothing, and has no telemetry.

## Development

```sh
npm ci
sh test.sh   # logic tests, type check, and a render test of the command
```

## License

[MIT](LICENSE)

## About

Made by [WeAdU](https://weadu.com). WeAdU is not affiliated with Raycast or Google.
