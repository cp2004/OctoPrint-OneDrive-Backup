import logging
import os
import threading
import urllib.parse
from typing import Optional

import requests
from msal import PublicClientApplication, SerializableTokenCache

import octoprint_onedrive_backup

# MSAL/Graph config
APPLICATION_ID = "1fbab959-f7f1-43c4-a800-5f7f58eb068f"  # Not a secret :)
GRAPH_URL = "https://graph.microsoft.com/v1.0"

# WHEN CHANGING SCOPES we will need to think of a way to re-auth, hopefully this isn't needed...
SCOPES = [
    "User.ReadBasic.All",
    "Files.ReadWrite",
]
REQUEST_TIMEOUT = 5  # Seconds
UNKNOWN_ERROR = "Unknown error, check octoprint.log for details"


# Built on the assumption we will only ever have one account logged in at a time
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

    def begin_auth_flow(self) -> dict:
        if self.auth_poll_thread is None or not self.auth_poll_thread.is_alive():
            # Remove any accounts before adding a new one
            self.forget_account()

            # Begin auth flow
            self.flow_in_progress = self.client.initiate_device_flow(scopes=SCOPES)
            # Thread to poll graph for auth result
            self.auth_poll_thread = threading.Thread(
                target=self.acquire_token,
                kwargs={"flow": self.flow_in_progress},
            )
            self.auth_poll_thread.start()
            return self.flow_in_progress
        else:
            raise AuthInProgressError("Auth flow is already in progress")

    def acquire_token(self, flow: dict) -> None:
        self.client.acquire_token_by_device_flow(flow)
        self.cache.save()
        self.plugin.send_message("auth_done", {})
        self.flow_in_progress = None

    def list_accounts(self):
        return [account["username"] for account in self.client.get_accounts()]

    def forget_account(self):
        if len(self.client.get_accounts()):
            # Assuming that we never get more than one account
            self.client.remove_account(self.client.get_accounts()[0])

    def list_folders(self, item_id=None):
        if not len(self.client.get_accounts()):
            self._logger.error("No accounts registered, can't list folders")
            return {"error": {"message": "No accounts registered"}}

        if item_id is None:
            location = "root"
        else:
            location = f"items/{item_id}"

        folders = []
        data = self._graph_request(f"/me/drive/{location}/children", select="")
        if "error" in data:
            return {"error": data["error"]}  # No extra fields slipping in

        else:
            value = data["value"]
            for item in value:
                if "folder" in item:
                    folders.append(
                        {
                            "name": item["name"],
                            "id": item["id"],
                            "parent": item["parentReference"]["id"],
                            "childCount": item["folder"]["childCount"],
                            "path": item["parentReference"]["path"].split("/root:")[1]
                            + "/"
                            + item["name"],  # Human readable path
                        }
                    )

        return {"root": True if item_id is None else False, "folders": folders}

    def upload_file(
        self,
        file_name,
        file_path,
        on_progress_update=lambda x: None,
        on_upload_complete=lambda: None,
        on_error=lambda x: None,
    ):
        # https://docs.microsoft.com/en-us/graph/api/driveitem-createuploadsession?view=graph-rest-1.0

        if not len(self.client.get_accounts()):
            self._logger.error("No accounts registered, can't upload file")
            return

        if not callable(on_progress_update):
            raise TypeError("on_progress_update must be callable")

        if not callable(on_upload_complete):
            raise TypeError("on_upload_complete must be callable")

        if not callable(on_error):
            raise TypeError("on_error must be callable")

        self._logger.info(f"Starting upload session for {file_name}")

        upload_location_id = self.plugin._settings.get(["folder", "id"])
        if not upload_location_id:  # Not configured
            self._logger.error("Upload location not configured")
            return

        # Get file details
        if not os.path.exists(file_path):
            self._logger.error(f"File {file_path} does not exist")
            # Abort
            return
        file_size = os.path.getsize(file_path)

        self._logger.debug("Creating upload session")
        data = {
            "item": {
                "@microsoft.graph.conflictBehavior": "rename",
                "name": file_name,
                "fileSize": file_size,
            }
        }
        upload_session = self._graph_request(
            f"/me/drive/items/{upload_location_id}:/{urllib.parse.quote(file_name)}:/createUploadSession",
            method="POST",
            data=data,
        )

        if (
            upload_session
            and "error" in upload_session
            or "uploadUrl" not in upload_session
        ):
            self._logger.error(
                f"Error creating upload session: {upload_session['error']}"
            )
            return

        # Upload URLs will expire in several days, but that shouldn't be a problem for us
        upload_url = upload_session["uploadUrl"]

        # Maximum bytes in any one request is 60MiB. So we need to chunk the file, which must be
        # a multiple of 320KiB. See docs. Recommended 5-10MB chunks.
        chunk_size = 1024 * 320 * 16  # 5MB
        number_of_uploads = -(-file_size // chunk_size)
        self._logger.debug(
            f"chunk size: {chunk_size}, file size: {file_size}, number of uploads: {number_of_uploads}"
        )

        self._logger.info("Uploading file to OneDrive...")

        try:
            self._logger.debug("Loading file")

            i = 0
            with open(file_path, "rb") as f:
                while f.tell() < file_size:
                    i += 1

                    content_range_start = f.tell()
                    content_range_end = (
                        f.tell() + chunk_size - 1
                    )  # -1 because f.tell() is 0-indexed

                    # Last chunk is capped of course
                    if (file_size - f.tell()) < chunk_size:
                        content_range_end = file_size - 1

                    self._logger.debug(f"Uploading chunk {i} of {number_of_uploads}")
                    self._logger.debug(
                        f"content_range_start: {content_range_start}, content_range_end: {content_range_end}"
                    )
                    # Notify of upload progress, as integer percentage
                    on_progress_update((100 * i) // number_of_uploads)

                    chunk = f.read(chunk_size)

                    # This was the site of 3 days of pain
                    headers = self._get_headers()
                    headers.update(
                        {
                            "Content-range": f"bytes {content_range_start}-{content_range_end}/{file_size}"
                        }
                    )

                    response = self._graph_request(
                        upload_url,
                        method="PUT",
                        data=chunk,
                        headers=headers,
                        timeout=60,  # Longer timeout than default as we are uploading larger things
                    )

                    if "error" in response:
                        self._logger.error(
                            f"Error uploading chunk {i}: {response['error']}"
                        )
                        on_error(response["error"])
                        return

                    self._logger.debug(f"Chunk {i} upload complete")

        except Exception as e:
            self._logger.error(f"Error uploading file: {e}")
            on_error(repr(e))
            return

        # If we got this far... Everything worked?
        self._logger.info("Upload complete")
        on_upload_complete()

    def _get_headers(self) -> dict:
        # TODO sometimes this fails when requested too fast?
        # token = self.client.acquire_token_silent(
        #     scopes=SCOPES, account=self.client.get_accounts()[0]
        # )

        token = self.client.acquire_token_silent_with_error(
            scopes=SCOPES, account=self.client.get_accounts()[0]
        )

        if "error" in token:
            self._logger.error("Error getting token: " + token["error"])
            return {}  # Will end up with empty token error later

        if token is None:
            self._logger.error(
                "No token available in cache to use"
            )  # Probably no account logged in
            return {}  # Will end up with empty token error later

        return {"Authorization": f"Bearer {token['access_token']}"}

    def _graph_request(
        self,
        endpoint,
        method="GET",
        select=None,
        data=None,
        timeout=REQUEST_TIMEOUT,
        headers=None,
    ) -> dict:
        if not endpoint[:1] == "/":
            endpoint = f"/{endpoint}"

        url = f"{GRAPH_URL}{endpoint}"

        select = {"$select": select} if select is not None else None

        headers = headers if headers is not None else self._get_headers()

        # Catch-all in case of internet problems
        try:
            response = requests.request(
                method,
                url,
                params=select,
                data=data,
                headers=headers,
                timeout=timeout,
            )

        except Exception as e:
            self._logger.exception(e)
            return {"error": UNKNOWN_ERROR}

        try:
            # Check status code - all errors will have an error code outside of 2xx-3xx
            response.raise_for_status()

        except requests.RequestException as e:
            self._logger.exception(e)
            # Try and get the error message out of MS graph response - all 'successful' network requests
            # should (by protocol) have a useful error message, but if not, return a generic error
            try:
                data = response.json()
                if "error" in data:
                    return {"error": data["error"]}
            except Exception as e:
                self._logger.exception(e)
                return {"error": UNKNOWN_ERROR}

        # Finally, try return a json response
        try:
            return response.json()
        except Exception as e:
            self._logger.exception(e)
            return {"error": UNKNOWN_ERROR}


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

    def add(self, event, **kwargs):
        super().add(event, **kwargs)
        self.save()

    def modify(self, credential_type, old_entry, new_key_value_pairs=None):
        super().modify(credential_type, old_entry, new_key_value_pairs)
        self.save()
