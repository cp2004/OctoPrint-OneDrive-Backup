import octoprint.plugin


class OneDriveBackupPlugin(
    octoprint.plugin.SettingsPlugin,
    octoprint.plugin.AssetPlugin,
    octoprint.plugin.TemplatePlugin,
):

    # SettingsPlugin
    def get_settings_defaults(self):
        return {}

    # AssetPlugin
    def get_assets(self):
        return {"js": ["dist/onedrive_backup.js"], "css": ["dist/onedrive_backup.css"]}

    # Software Update hook
    def get_update_information(self):
        return {
            "onedrive_backup": {
                "displayName": "OneDrive Backup",
                "displayVersion": self._plugin_version,
                "type": "github_release",
                "user": "cp2004",
                "repo": "OctoPrint-OneDrive-Backup",
                "current": self._plugin_version,
                "pip": "https://github.com/cp2004/OctoPrint-OneDrive-Backup/archive/{target_version}.zip",
            }
        }


from ._version import get_versions

__plugin_name__ = "OneDrive Backup"
__plugin_version__ = get_versions()["version"]
__plugin_pythoncompat__ = ">=3.7,<4"


def __plugin_load__():
    global __plugin_implementation__
    __plugin_implementation__ = OneDriveBackupPlugin()

    global __plugin_hooks__
    __plugin_hooks__ = {
        "octoprint.plugin.softwareupdate.check_config": __plugin_implementation__.get_update_information
    }
