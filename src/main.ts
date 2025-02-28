import { PLAPI, PLExtAPI, PLExtension, PLMainAPI } from "paperlib-api/api";
import { PaperEntity } from "paperlib-api/model";
import path from "path";
import url from "url";
import { writeToClipboard } from "./clipboard";
class PaperlibExtension extends PLExtension {
  disposeCallbacks: (() => void)[];

  constructor() {
    super({
      id: "copy-file-url-as-markdown",
      defaultPreference: {
        useApiHost: {
          type: "boolean",
          name: "Use APIHost Format",
          description: "Local file link starts with http://127.0.0.1:21227/. paperlib-apihost-extension required.",
          value: false,
          order: 1,
        },
      },
    });

    this.disposeCallbacks = [];
  }

  async initialize() {
    await PLExtAPI.extensionPreferenceService.register(
      this.id,
      this.defaultPreference,
    );

    // Register Context Menu UI
    PLMainAPI.contextMenuService.registerContextMenu(
      this.id,
      [
        {
          id: "copy-file-url-as-markdown",
          label: "Copy file url as markdown"
        }
      ]
    );

    this.disposeCallbacks.push(
      // Register Event Listener
      PLMainAPI.contextMenuService.on("dataContextMenuFromExtensionsClicked", (value) => {
        const { extID, itemID } = value.value;
        if (extID === this.id && itemID === "copy-file-url-as-markdown") {
          // PLExtAPI.clipboardService.copyToClipboard(
          this.copyasMarkdown();
        }
      })
    );
  }

  async dispose() {
    PLExtAPI.extensionPreferenceService.unregister(this.id);
    // Unregister Context Menu UI
    PLMainAPI.contextMenuService.unregisterContextMenu(this.id);
    // Remove event listener
    this.disposeCallbacks.forEach((callback) => callback());
  }

  async copyasMarkdown() {
    try {
      const selectedPaperEntities = (await PLAPI.uiStateService.getState(
        "selectedPaperEntities",
      )) as PaperEntity[];
      if (selectedPaperEntities.length !== 1) return;
      const paperEntity = selectedPaperEntities[0];

      const mainURL = paperEntity.mainURL;
      if (mainURL === "") throw new Error("Link is empty");
      // PLAPI.logService.info(mainURL, "", false, "CopyAsMarkdownExt",);

      // Get preference
      const useApiHost = (await PLExtAPI.extensionPreferenceService.get(
        this.id,
        "useApiHost",
      )) as boolean;

      const title = paperEntity.title;
      let link = "";

      // Construct Link
      if (await PLAPI.uiStateService.getState("contentType") === "library") {

        if (mainURL.startsWith("http")) {
          // web link
          link = mainURL
        } else if (useApiHost) {
          // local file: use api host
          link = `http://127.0.0.1:21227/PLAPI.fileService.open/?args=["file://${mainURL}"]`;
        } else {
          // local file： absolute path
          const libFolder = (await PLAPI.preferenceService.get("appLibFolder")) as string;
          link = mainURL.startsWith("http")
            ? mainURL
            : path.join(libFolder, mainURL);
          link = url.pathToFileURL(link).toString();
        }

      } else {
        // feed 
        link = mainURL;
      }


      writeToClipboard(`[${title}](${link})`);
      PLAPI.logService.info("Copied.", "", true, "CopyAsMarkdownExt")

    } catch (error) {
      PLAPI.logService.error(
        "Failed to copy file as markdown link.",
        error as Error,
        true,
        "CopyAsMarkdownExt",
      );
    }
  }
}

async function initialize() {
  const extension = new PaperlibExtension();
  await extension.initialize();

  return extension;
}

export { initialize };

