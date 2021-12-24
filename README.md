# OneDrive Backup Plugin

Automatically upload OctoPrint backups to OneDrive when they are created.

## Installation

Install the plugin via the bundled Plugin Manager or manually using this URL:
```
https://github.com/cp2004/OctoPrint-OneDrive-Backup/releases/download/latest/release.zip
```

**Warning**: This plugin requires Python 3.7 or newer to install. To find out more about upgrading your OctoPrint install
to use Python 3, you can take a look at [this post](https://community.octoprint.org/t/upgrading-your-octoprint-install-to-python-3/35158)

**Warning 2**: Don't try installing this plugin from the source code on GitHub, since it has a separate build step for the
frontend code. If you are insterested in installing from source to contribute, please see the [contributing guidelines](CONTRIBUTING.md)

## Configuration

Once the plugin is installed and loaded, you can set it up to connect to your Microsoft account.



## Important Security Notice

Please be aware that this plugin stores its tokens for accessing your Microsoft account in OctoPrint's
configuration folder, as expected. As a result, if your OctoPrint install (or the server it is running on) is
compromised, your Microsoft account tokens will be compromised as well.

**It is not recommended to use this plugin on OctoPrint installs accessible directly from the
internet, or multi-user installs where you may not trust every user.**

The author of this plugin is not responsible for any damage caused as a result of using this plugin.
