# Contribution Guidelines

I'll keep it short, if you have any questions please don't hesitate to get in touch!

## Contributing code

If you want to install & run this plugin from source then you will need a couple more steps than the standard plugin:

1. Download and install the plugin: `git clone https://github.com/cp2004/OctoPrint-OneDrive-Backup.git`, and then install it
  using `pip install -e .` when your OctoPrint virtual environment is active.
2. To install the frontend code, you will require NodeJS (non-ancient), then use `npm install`.

You can either start the frontend in development mode, or build for production if you don't intend on changing the frontend.

`npm start` - development mode.

`npm run release` - production mode.

That should be it :)

## Contributing documentation

Extra guides, clarification etc. are always welcome :)

Opening issues to let me know of things that you don't understand helps as well.

Please don't open PRs fixing single typos. It gets me excited for a contribution but then disappointed.
