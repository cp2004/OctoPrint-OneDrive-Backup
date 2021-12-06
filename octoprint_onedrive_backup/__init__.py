from typing import Optional

import octoprint.plugin

from .api import Commands, OneDriveBackupApi
from .onedrive import OneDriveComm


class OneDriveBackupPlugin(
    octoprint.plugin.SettingsPlugin,
    octoprint.plugin.AssetPlugin,
    octoprint.plugin.TemplatePlugin,
    octoprint.plugin.SimpleApiPlugin,
):
    def __init__(self):
        super().__init__()
        self.onedrive: Optional[OneDriveComm] = None
        self.api: Optional[OneDriveBackupApi] = None

    def initialize(self):
        self.api = OneDriveBackupApi(self)
        self.onedrive = OneDriveComm(self)

    # SimpleApiPlugin
    def on_api_get(self, request):
        return self.api.on_api_get(request)

    def on_api_command(self, command, data):
        return self.api.on_api_command(command, data)

    def get_api_commands(self):
        return Commands.list_commands()

    def send_message(self, msg_type: str, msg_content: dict):
        self._plugin_manager.send_plugin_message(
            "onedrive_backup", {"type": msg_type, "content": msg_content}
        )

    # SettingsPlugin
    def get_settings_defaults(self):
        """
        Quite basic settings as the authentication tokens are stored separately, outside config.yaml.
        """
        return {
            "folder": {"id": "", "path": ""},
        }

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
