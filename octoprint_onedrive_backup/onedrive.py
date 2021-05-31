import logging
import os
import threading
from typing import Optional

import requests
from msal import PublicClientApplication, SerializableTokenCache

import octoprint_onedrive_backup

# MSAL/Graph config
APPLICATION_ID = "1fbab959-f7f1-43c4-a800-5f7f58eb068f"
GRAPH_URL = "https://graph.microsoft.com/v1.0"
# TODO way to change scopes and prompt re-auth
SCOPES = [
    "User.ReadBasic.All",
    "Files.ReadWrite",
]

# Other config
REQUEST_TIMEOUT = 2  # Seconds


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
            self.flow_in_progress = self.client.initiate_device_flow(scopes=SCOPES)
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

    def list_folders(self, item_id=None):
        if item_id is None:
            location = "root"
        else:
            location = f"items/{item_id}"

        folders = []
        data = self._get_graph(f"/me/drive/{location}/children", "")
        if data:
            value = data["value"]
            for item in value:
                if "folder" in item:
                    folders.append(
                        {
                            "name": item["name"],
                            "id": item["id"],
                            "parent": item["parentReference"]["id"],
                            "childCount": item["folder"]["childCount"],
                        }
                    )
        return {"root": True if item_id is None else False, "folders": folders}

    def _get_headers(self):
        token = self.client.acquire_token_silent(
            scopes=SCOPES, account=self.client.get_accounts()[0]
        )  # TODO select active account

        if token is None:
            # Auth failed, do something about it
            return {}

        return {"Authorization": f"Bearer {token['access_token']}"}

    def _get_graph(self, endpoint, select=None):
        if not endpoint[:1] == "/":
            endpoint = f"/{endpoint}"

        try:
            with requests.request(
                "GET",
                f"{GRAPH_URL}{endpoint}",
                params={"$select": select} if select else None,
                headers=self._get_headers(),
                timeout=REQUEST_TIMEOUT,
            ) as response:
                if 200 <= response.status_code < 210:
                    # Valid response, proceed
                    try:
                        response_json = response.json()
                    except ValueError:
                        raise GraphError("Invalid response recieved")

                    if "error" in response_json:
                        # In theory this should not happen, since we check the status code,  but if it does
                        raise GraphError("Graph reported an error")

                    return response_json

                else:
                    raise GraphError("Error connecting to Microsoft Graph")

        except requests.RequestException as e:
            self._logger.exception(e)
        except GraphError as e:
            self._logger.exception(e)

        return {}


class AuthInProgressError(Exception):
    pass


class GraphError(Exception):
    """Base class for MS Graph related exceptions"""

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
