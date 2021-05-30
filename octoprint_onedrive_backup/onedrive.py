import logging
import os
import threading
from typing import Optional

from msal import PublicClientApplication, SerializableTokenCache

import octoprint_onedrive_backup

APPLICATION_ID = "1fbab959-f7f1-43c4-a800-5f7f58eb068f"


class OneDriveComm:
    def __init__(self, plugin):
        self.plugin = plugin  # type: octoprint_onedrive_backup.OneDriveBackupPlugin
        self._logger = logging.getLogger(
            "octoprint.plugins.onedrive_backup.OneDriveComm"
        )

        self.cache = PersistentTokenStore(
            os.path.join(self.plugin.get_plugin_data_folder(), "cache.bin")
        )
        self.cache.load()

        self.client = PublicClientApplication(
            APPLICATION_ID,
            authority="https://login.microsoftonline.com/common",
            token_cache=self.cache,
        )

        self.auth_poll_thread: Optional[threading.Thread] = None
        self.flow_in_progress: Optional[dict] = None
        self.token_result: Optional[dict] = None

    def begin_auth_flow(self) -> dict:
        if self.auth_poll_thread is None:
            self.flow_in_progress = self.client.initiate_device_flow(
                scopes=["User.ReadBasic.All"]
            )
            self.auth_poll_thread = threading.Thread(
                target=self.acquire_token,
                kwargs={"flow": self.flow_in_progress},
            )
            self.auth_poll_thread.start()
            return self.flow_in_progress
        else:
            raise AuthInProgressError("Auth flow is already in progress")

    def acquire_token(self, flow: dict) -> None:
        result = self.client.acquire_token_by_device_flow(flow)
        self.cache.save()
        self.token_result = result
        self.plugin.send_message("auth_done", {})
        self.flow_in_progress = None

    def list_accounts(self):
        return [account["username"] for account in self.client.get_accounts()]


class AuthInProgressError(Exception):
    pass


class PersistentTokenStore(SerializableTokenCache):
    """
    Subclasses the default TokenCache, to write it out a file path
    Pass to the client instance as below
    Usage:
        self.cache = PersistentTokenStore(os.path.join(self.plugin.get_plugin_data_folder(), "cache.bin"))
        self.cache.load()

        self.client = PublicClientApplication(
            token_cache=self.cache,
            )
    """

    def __init__(self, path):
        super().__init__()
        self.path = path

    def save(self) -> None:
        """Serialize the current cache state into a string."""
        if self.has_state_changed:
            with open(self.path, "wt", encoding="utf-8") as file:
                file.write(self.serialize())

    def load(self) -> None:
        if os.path.exists(self.path):
            with open(self.path, encoding="utf-8") as file:
                self.deserialize(file.read())
