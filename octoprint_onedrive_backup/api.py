import logging

from octoprint_onedrive_backup import onedrive


class Commands:
    StartAuth = "startAuth"
    GetFolders = "folders"
    GetFoldersByID = "foldersById"
    SetFolder = "setFolder"
    Forget = "forget"

    @staticmethod
    def list_commands():
        return {
            Commands.StartAuth: [],
            Commands.GetFolders: [],
            Commands.GetFoldersByID: ["id"],
            Commands.SetFolder: ["id", "path"],
            Commands.Forget: [],
        }


class OneDriveBackupApi:
    def __init__(self, plugin):
        self.plugin = plugin
        self._logger = logging.getLogger("octoprint.plugins.onedrive_backup.api")

    def on_api_get(self, request):
        return {
            "accounts": self.plugin.onedrive.list_accounts(),
            "flow": self.plugin.onedrive.flow_in_progress,
            "folder": self.plugin._settings.get(["folder"], merged=True),
        }

    def on_api_command(self, command, data):
        if command == Commands.StartAuth:
            try:
                flow = self.plugin.onedrive.begin_auth_flow()
                url = flow["verification_uri"]
                code = flow["user_code"]
            except onedrive.AuthInProgressError:
                if self.plugin.onedrive.flow_in_progress:
                    url = (self.plugin.onedrive.flow_in_progress["verification_uri"],)
                    code = self.plugin.onedrive.flow_in_progress["user_code"]
                else:
                    # ?? Shouldn't happen
                    return {}

            return {
                "url": url,
                "code": code,
            }

        if command == Commands.GetFolders:
            folders = self.plugin.onedrive.list_folders()

            return folders

        if command == Commands.GetFoldersByID:
            item_id = data.get("id")
            folders = self.plugin.onedrive.list_folders(item_id)

            return folders

        if command == Commands.SetFolder:
            folder_id = data.get("id")
            folder_path = data.get("path")

            self.plugin._settings.set(["folder", "id"], folder_id)
            self.plugin._settings.set(["folder", "path"], folder_path)

            self.plugin._settings.save()

        if command == Commands.Forget:
            self.plugin.onedrive.forget_account()
