import threading
import os
from typing import Optional

import octoprint.plugin

from .api import Commands, OneDriveBackupApi
from octo_onedrive import OneDriveComm

APPLICATION_ID = "1fbab959-f7f1-43c4-a800-5f7f58eb068f"  # Not a secret :)

# WHEN CHANGING SCOPES we will need to think of a way to re-auth, hopefully this isn't needed...
SCOPES = [
    # "User.ReadBasic.All",  Seemed to cause issues looking up the AT from cache.
    # See https://github.com/AzureAD/microsoft-authentication-library-for-python/issues/450
    "Files.ReadWrite",
]


class OneDriveBackupPlugin(
    octoprint.plugin.SettingsPlugin,
    octoprint.plugin.AssetPlugin,
    octoprint.plugin.TemplatePlugin,
    octoprint.plugin.SimpleApiPlugin,
    octoprint.plugin.EventHandlerPlugin,
):
    def __init__(self):
        super().__init__()
        self.onedrive: Optional[OneDriveComm] = None
        self.api: Optional[OneDriveBackupApi] = None

    def initialize(self):
        self.api = OneDriveBackupApi(self)

        self.onedrive = OneDriveComm(
            app_id=APPLICATION_ID,
            scopes=SCOPES,
            token_cache_path=os.path.join(self.get_plugin_data_folder(), "cache.bin"),
            encryption_key=self._settings.global_get(["server", "secretKey"]),
            logger="octoprint.plugins.onedrive_backup.OneDriveComm"
        )

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

    def on_event(self, event, payload):
        if event == "plugin_backup_backup_created":
            # Check if a folder has been configured
            folder_id = self._settings.get(["folder", "id"])
            if folder_id:
                t = threading.Thread(
                    target=self.onedrive.upload_file,
                    kwargs={
                        "file_name": payload["name"],
                        "file_path": payload["path"],
                        "upload_location_id": folder_id,
                        "on_upload_progress": self.on_upload_progress,
                        "on_upload_complete": self.on_upload_complete,
                        "on_upload_error": self.on_upload_error,
                    },
                )
                t.daemon = True
                t.start()

    def on_upload_progress(self, progress):
        # Called by the onedrive client for every chunk uploaded
        self.send_message("upload_progress", {"progress": progress})

    def on_upload_error(self, error):
        # If the upload fails, this will be called so we can notify the user
        self.send_message("upload_error", {"error": error})

    def on_upload_complete(self):
        self.send_message("upload_complete", {})

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
                "stable_branch": {
                    "name": "Stable",
                    "branch": "main",
                    "comittish": ["main"],
                },
                "prerelease_branches": [
                    {
                        "name": "Release Candidate",
                        "branch": "pre-release",
                        "comittish": ["pre-release", "main"],
                    }
                ],
                "current": self._plugin_version,
                "pip": "https://github.com/cp2004/OctoPrint-OneDrive-Backup/releases/download/{target_version}/release.zip",
            }
        }

    def backup_excludes_hook(self, *args, **kwargs):
        """
        Excluding the MS Graph API token from the backup. Unnecessary security risk, if someone was to share
        the backup it could partly compromise their MS account.
        """
        return ["cache.bin"]


from ._version import get_versions

__plugin_name__ = "OneDrive Backup"
__plugin_version__ = get_versions()["version"]
__plugin_pythoncompat__ = ">=3.7,<4"


def __plugin_load__():
    global __plugin_implementation__
    __plugin_implementation__ = OneDriveBackupPlugin()

    global __plugin_hooks__
    __plugin_hooks__ = {
        "octoprint.plugin.softwareupdate.check_config": __plugin_implementation__.get_update_information,
        "octoprint.plugin.backup.additional_excludes": __plugin_implementation__.backup_excludes_hook,
    }
